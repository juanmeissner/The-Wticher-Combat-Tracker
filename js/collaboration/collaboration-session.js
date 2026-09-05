(function (root, factory) {
    const protocol = root?.collaborationProtocol
        || (typeof require === 'function' ? require('./protocol.js') : null);
    const permissions = root?.collaborationPermissions
        || (typeof require === 'function' ? require('./permissions.js') : null);
    const api = factory(root, protocol, permissions);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.collaborationSession = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, protocol, permissions) {
    'use strict';

    const STORAGE_KEY = 'dnd_collaboration_session_v1';
    const SESSION_VERSION = 1;
    const CONNECTION_STATES = Object.freeze({
        OFFLINE: 'offline',
        CONNECTING: 'connecting',
        SYNCED: 'synced',
        PENDING: 'pending',
        CONFLICT: 'conflict',
        REVOKED: 'revoked'
    });

    let storage = null;
    let session = null;

    function createDeviceId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        return uuid ? `device-${uuid}` : `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizeSession(value = {}) {
        const role = value.role === protocol.ROLES.PLAYER
            ? protocol.ROLES.PLAYER
            : protocol.ROLES.MASTER;
        const roomCode = String(value.roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const endpoint = String(value.endpoint || '').trim().replace(/\/+$/, '');
        const roomMode = value.mode === 'room' && roomCode && endpoint && value.memberToken;
        const allowedConnectionStates = Object.values(CONNECTION_STATES);
        return {
            version: SESSION_VERSION,
            mode: roomMode ? 'room' : (role === protocol.ROLES.PLAYER ? 'player-preview' : 'solo'),
            role,
            actorId: String(value.actorId || (role === protocol.ROLES.MASTER ? 'local-master' : 'local-player')),
            deviceId: String(value.deviceId || createDeviceId()),
            linkedParticipantId: value.linkedParticipantId === null || value.linkedParticipantId === undefined
                ? null
                : String(value.linkedParticipantId),
            linkedSheetId: value.linkedSheetId === null || value.linkedSheetId === undefined
                ? null
                : String(value.linkedSheetId),
            connectionState: roomMode && allowedConnectionStates.includes(value.connectionState)
                ? value.connectionState
                : CONNECTION_STATES.OFFLINE,
            roomId: roomMode ? String(value.roomId || roomCode) : null,
            roomCode: roomMode ? roomCode : null,
            roomName: roomMode ? String(value.roomName || 'Sala da campanha') : null,
            endpoint: roomMode ? endpoint : null,
            memberId: roomMode ? String(value.memberId || '') : null,
            memberName: roomMode ? String(value.memberName || '') : null,
            memberToken: roomMode ? String(value.memberToken || '') : null,
            lastServerSequence: roomMode ? Math.max(0, Number(value.lastServerSequence) || 0) : 0
        };
    }

    function initialize(options = {}) {
        storage = options.storage || root?.localStorage || null;
        let stored = null;
        try {
            stored = JSON.parse(storage?.getItem?.(STORAGE_KEY) || 'null');
        } catch {
            stored = null;
        }
        session = normalizeSession(options.session || stored || {});
        persist();
        applyRoleToDocument();
        return getSession();
    }

    function persist() {
        storage?.setItem?.(STORAGE_KEY, JSON.stringify(session));
    }

    function getSession() {
        return session ? JSON.parse(JSON.stringify(session)) : normalizeSession();
    }

    function isMaster() {
        return getSession().role === protocol.ROLES.MASTER;
    }

    function isPlayer() {
        return getSession().role === protocol.ROLES.PLAYER;
    }

    function getRoleLabel() {
        return isPlayer() ? 'Jogador' : 'Mestre';
    }

    function getPermissionContext() {
        const current = getSession();
        return {
            role: current.role,
            actorId: current.actorId,
            deviceId: current.deviceId,
            ownedParticipantIds: current.linkedParticipantId ? [current.linkedParticipantId] : [],
            ownedSheetIds: current.linkedSheetId ? [current.linkedSheetId] : []
        };
    }

    function authorize(type, targetId, payload = {}, options = {}) {
        const current = getSession();
        const campaign = root?.campaignStore?.getActiveCampaign?.();
        const command = protocol.createCommand({
            id: options.id,
            campaignId: campaign?.id || 'local-campaign',
            actorId: current.actorId,
            deviceId: current.deviceId,
            role: current.role,
            type,
            targetId,
            entityKey: options.entityKey || `${type}:${targetId || 'campaign'}`,
            baseVersion: options.baseVersion || 0,
            payload
        });
        return {
            command,
            ...permissions.authorizeCommand(command, getPermissionContext())
        };
    }

    function isOnlineRoom() {
        return getSession().mode === 'room';
    }

    function updateSession(changes = {}) {
        if (!session) initialize();
        session = normalizeSession({ ...session, ...changes });
        persist();
        applyRoleToDocument();
        root?.refreshSessionStatus?.();
        return getSession();
    }

    function startOnlineSession(data = {}) {
        const member = data.member || {};
        const room = data.room || {};
        return updateSession({
            mode: 'room',
            role: member.role === protocol.ROLES.PLAYER ? protocol.ROLES.PLAYER : protocol.ROLES.MASTER,
            actorId: member.actorId,
            endpoint: data.endpoint,
            roomId: room.code,
            roomCode: room.code,
            roomName: room.name,
            memberId: member.id,
            memberName: member.name,
            memberToken: data.memberToken,
            linkedParticipantId: member.participantId,
            linkedSheetId: member.sheetId,
            lastServerSequence: room.sequence,
            connectionState: CONNECTION_STATES.CONNECTING
        });
    }

    function updateOnlineIdentity(message = {}) {
        if (!isOnlineRoom()) return getSession();
        const member = message.member || {};
        const room = message.room || {};
        return updateSession({
            actorId: member.actorId || session.actorId,
            memberId: member.id || session.memberId,
            memberName: member.name || session.memberName,
            linkedParticipantId: member.participantId ?? session.linkedParticipantId,
            linkedSheetId: member.sheetId ?? session.linkedSheetId,
            roomName: room.name || session.roomName,
            lastServerSequence: Math.max(Number(message.sequence) || 0, session.lastServerSequence || 0)
        });
    }

    function setConnectionState(connectionState) {
        if (!isOnlineRoom()) return getSession();
        if (!Object.values(CONNECTION_STATES).includes(connectionState)) return getSession();
        return updateSession({ connectionState });
    }

    function setLastServerSequence(sequence) {
        if (!isOnlineRoom()) return getSession();
        return updateSession({
            lastServerSequence: Math.max(session.lastServerSequence || 0, Number(sequence) || 0)
        });
    }

    function leaveOnlineSession() {
        const deviceId = session?.deviceId || createDeviceId();
        session = normalizeSession({ role: protocol.ROLES.MASTER, deviceId });
        persist();
        applyRoleToDocument();
        root?.renderCharacterCollectionSelectors?.();
        root?.renderList?.(false);
        root?.refreshSessionStatus?.();
        return getSession();
    }

    function getParticipantOptions() {
        const combatEntries = typeof combatants !== 'undefined' && Array.isArray(combatants)
            ? combatants.filter(entry => entry?.type === 'player')
            : [];
        const sheetEntries = typeof characterSheets !== 'undefined' && Array.isArray(characterSheets)
            ? characterSheets
            : [];
        const unique = new Map();

        combatEntries.forEach(entry => unique.set(`combatant:${entry.id}`, {
            value: `combatant:${entry.id}`,
            participantId: String(entry.id),
            sheetId: entry.sheetId ? String(entry.sheetId) : null,
            name: entry.name || 'Jogador em combate'
        }));
        sheetEntries.forEach(entry => {
            const linked = combatEntries.find(combatant => String(combatant.sheetId || '') === String(entry.id));
            if (linked) return;
            unique.set(`sheet:${entry.id}`, {
                value: `sheet:${entry.id}`,
                participantId: null,
                sheetId: String(entry.id),
                name: entry.name || 'Ficha salva'
            });
        });
        return [...unique.values()];
    }

    function setLocalRole(role, ownerValue = '') {
        if (!session) initialize();
        if (role !== protocol.ROLES.PLAYER) {
            session = normalizeSession({
                ...session,
                role: protocol.ROLES.MASTER,
                actorId: 'local-master',
                linkedParticipantId: null,
                linkedSheetId: null
            });
        } else {
            const owner = getParticipantOptions().find(option => option.value === ownerValue);
            if (!owner) {
                root?.showToast?.('Escolha a ficha controlada pelo jogador.');
                return false;
            }
            session = normalizeSession({
                ...session,
                role: protocol.ROLES.PLAYER,
                actorId: `local-player-${owner.participantId || owner.sheetId}`,
                linkedParticipantId: owner.participantId,
                linkedSheetId: owner.sheetId
            });
        }

        persist();
        applyRoleToDocument();
        root?.renderCharacterCollectionSelectors?.();
        root?.renderList?.(false);
        root?.refreshSessionStatus?.();
        root?.showToast?.(isPlayer()
            ? '👤 Prévia do modo Jogador ativada.'
            : '👑 Modo Mestre restaurado.');
        return true;
    }

    function setLocalPlayerFromView() {
        const select = root?.document?.getElementById('collaborationOwnerSelect');
        if (setLocalRole(protocol.ROLES.PLAYER, select?.value || '')) {
            root?.renderCollaborationView?.(root.document.querySelector('#sessionToolsModal .session-tools'));
        }
    }

    function setLocalMasterFromView() {
        if (setLocalRole(protocol.ROLES.MASTER)) {
            root?.renderCollaborationView?.(root.document.querySelector('#sessionToolsModal .session-tools'));
        }
    }

    function getStatusPresentation() {
        const current = getSession();
        const roomSuffix = current.roomCode ? ` · ${current.roomCode}` : '';
        if (current.connectionState === CONNECTION_STATES.SYNCED) return { label: `Sala sincronizada${roomSuffix}`, className: 'is-synced' };
        if (current.connectionState === CONNECTION_STATES.CONNECTING) return { label: `Conectando à sala${roomSuffix}`, className: 'is-connecting' };
        if (current.connectionState === CONNECTION_STATES.PENDING) return { label: `Alteração sendo enviada${roomSuffix}`, className: 'is-pending' };
        if (current.connectionState === CONNECTION_STATES.CONFLICT) return { label: 'Conflito aguardando o mestre', className: 'is-conflict' };
        if (current.connectionState === CONNECTION_STATES.REVOKED) return { label: 'Acesso revogado', className: 'is-revoked' };
        return { label: `${getRoleLabel()} · modo local`, className: 'is-offline' };
    }

    function updateConnectionIndicator() {
        const indicator = root?.document?.getElementById('sessionConnectionStatus');
        if (!indicator) return;
        const presentation = getStatusPresentation();
        indicator.className = `session-connection-status ${presentation.className}`;
        indicator.title = presentation.label;
        indicator.setAttribute('aria-label', presentation.label);
    }

    function applyRoleToDocument() {
        if (!root?.document || !session) return;
        root.document.documentElement.dataset.collaborationRole = session.role;
        root.document.documentElement.dataset.collaborationMode = session.mode;
        updateConnectionIndicator();
    }

    function renderCollaborationView(dialog) {
        if (!dialog) return;
        const current = getSession();
        const campaign = root?.campaignStore?.getActiveCampaign?.();
        if (current.mode === 'room') {
            const presentation = getStatusPresentation();
            const onlineMembers = root?.collaborationRealtime?.getPresence?.() || [];
            dialog.innerHTML = `
                <div class="session-dialog-header">
                    <div><small class="collaboration-eyebrow">SALA EXPERIMENTAL</small><h2>${escapeHtml(current.roomName || 'Sala da campanha')}</h2></div>
                    <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
                </div>
                <section id="collaborationRoomLive" class="collaboration-status-card">
                    <span class="collaboration-status-dot ${escapeHtml(presentation.className)}"></span>
                    <div><strong>${escapeHtml(presentation.label)}</strong><small>${escapeHtml(current.memberName || getRoleLabel())} · ${getRoleLabel()}</small></div>
                </section>
                <section class="collaboration-room-code">
                    <small>CÓDIGO DA SALA</small>
                    <strong>${escapeHtml(current.roomCode)}</strong>
                    <button type="button" onclick="copyCollaborationRoomCode()">Copiar</button>
                </section>
                <section class="collaboration-presence">
                    <strong>Conectados agora</strong>
                    <div>${onlineMembers.length
                        ? onlineMembers.map(member => `<span>${member.role === 'master' ? '👑' : '👤'} ${escapeHtml(member.name)}</span>`).join('')
                        : '<small>Aguardando a lista de presença...</small>'}</div>
                </section>
                <div class="collaboration-live-actions">
                    ${current.role === protocol.ROLES.MASTER
                        ? '<button type="button" class="session-primary" onclick="publishCollaborationCampaignNow()">↻ Sincronizar agora</button>'
                        : ''}
                    <button type="button" class="session-secondary" onclick="leaveCollaborationRoom()">Sair da sala</button>
                </div>
                <p class="enhancement-note">A sala experimental sincroniza automaticamente a visão do Mestre. Nesta etapa, o Jogador também pode ajustar os próprios recursos de Adrenalina e Dado da Sorte.</p>
                <button type="button" class="session-secondary session-full" onclick="renderSessionToolsView('menu')">Voltar</button>
            `;
            return;
        }
        const options = getParticipantOptions();
        const selectedValue = current.linkedParticipantId
            ? `combatant:${current.linkedParticipantId}`
            : current.linkedSheetId
                ? `sheet:${current.linkedSheetId}`
                : options[0]?.value || '';
        const optionMarkup = options.length
            ? options.map(option => `<option value="${escapeHtml(option.value)}"${option.value === selectedValue ? ' selected' : ''}>${escapeHtml(option.name)}</option>`).join('')
            : '<option value="">Nenhuma ficha disponível</option>';

        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div><small class="collaboration-eyebrow">COLABORAÇÃO</small><h2>Sala da campanha</h2></div>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <section class="collaboration-status-card">
                <span class="collaboration-status-dot is-offline"></span>
                <div><strong>Pronto para conectar</strong><small>${escapeHtml(campaign?.metadata?.name || 'Campanha principal')} · revisão ${campaign?.revision || 0}</small></div>
            </section>
            <p>Crie uma sala como Mestre ou entre usando o código e a senha enviados pelo Mestre. Sem conexão, o aplicativo continua funcionando normalmente.</p>
            <label class="collaboration-field">
                <span>Endereço do serviço Cloudflare</span>
                <input id="collaborationEndpoint" class="session-input" type="url" inputmode="url" autocomplete="url" placeholder="https://seu-worker.workers.dev" value="${escapeHtml(root?.collaborationRealtime?.getSavedEndpoint?.() || '')}">
            </label>
            <div class="collaboration-online-grid">
                <section class="collaboration-online-card">
                    <span class="collaboration-card-icon">👑</span>
                    <strong>Criar sala</strong>
                    <small>Publica uma cópia segura da campanha ativa.</small>
                    <input id="collaborationCreateName" class="session-input" type="text" maxlength="80" placeholder="Nome do Mestre" value="Mestre">
                    <input id="collaborationRoomName" class="session-input" type="text" maxlength="100" placeholder="Nome da sala" value="${escapeHtml(campaign?.metadata?.name || 'Campanha principal')}">
                    <input id="collaborationCreatePassword" class="session-input" type="password" minlength="6" maxlength="128" autocomplete="new-password" placeholder="Senha da sala">
                    <button id="collaborationCreateButton" type="button" class="session-primary" onclick="createCollaborationRoomFromView()">Criar sala</button>
                </section>
                <section class="collaboration-online-card">
                    <span class="collaboration-card-icon">👤</span>
                    <strong>Entrar na sala</strong>
                    <small>O Mestre define qual personagem você controlará.</small>
                    <input id="collaborationJoinName" class="session-input" type="text" maxlength="80" placeholder="Seu nome">
                    <input id="collaborationJoinCode" class="session-input collaboration-code-input" type="text" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="Código da sala">
                    <input id="collaborationJoinPassword" class="session-input" type="password" maxlength="128" autocomplete="current-password" placeholder="Senha da sala">
                    <label id="collaborationJoinParticipantField" class="collaboration-field hidden">
                        <span>Seu personagem</span>
                        <select id="collaborationJoinParticipant" class="session-input"></select>
                    </label>
                    <button id="collaborationJoinButton" type="button" class="session-primary" onclick="joinCollaborationRoomFromView()">Continuar</button>
                </section>
            </div>
            <details class="collaboration-local-preview">
                <summary>Prévia local de permissões</summary>
            <div class="collaboration-role-grid">
                <button type="button" class="collaboration-role-card ${current.role === protocol.ROLES.MASTER ? 'is-active' : ''}" onclick="setLocalMasterFromView()">
                    <span>👑</span><strong>Mestre</strong><small>Acesso completo à campanha e às configurações.</small>
                </button>
                <section class="collaboration-role-card ${current.role === protocol.ROLES.PLAYER ? 'is-active' : ''}">
                    <span>👤</span><strong>Jogador</strong><small>Prévia restrita vinculada a uma única ficha.</small>
                    <select id="collaborationOwnerSelect" class="session-input" ${options.length ? '' : 'disabled'}>${optionMarkup}</select>
                    <button type="button" class="session-small-button" onclick="setLocalPlayerFromView()" ${options.length ? '' : 'disabled'}>Visualizar</button>
                </section>
            </div>
            </details>
            <button type="button" class="session-secondary session-full" onclick="renderSessionToolsView('menu')">Voltar</button>
        `;
    }

    function setBusy(button, busy, label) {
        if (!button) return;
        if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent;
        button.disabled = busy;
        button.textContent = busy ? label : button.dataset.idleLabel;
    }

    async function createCollaborationRoomFromView() {
        const button = root?.document?.getElementById('collaborationCreateButton');
        setBusy(button, true, 'Criando...');
        try {
            const result = await root.collaborationRealtime.createRoom({
                endpoint: root.document.getElementById('collaborationEndpoint')?.value,
                actorName: root.document.getElementById('collaborationCreateName')?.value,
                roomName: root.document.getElementById('collaborationRoomName')?.value,
                password: root.document.getElementById('collaborationCreatePassword')?.value
            });
            root?.showToast?.(`🌐 Sala ${result.room.code} criada.`);
            renderCollaborationView(root.document.querySelector('#sessionToolsModal .session-tools'));
        } catch (error) {
            root?.showToast?.(`⚠️ ${error?.message || 'Não foi possível criar a sala.'}`);
            setBusy(button, false);
        }
    }

    async function joinCollaborationRoomFromView() {
        const button = root?.document?.getElementById('collaborationJoinButton');
        setBusy(button, true, 'Conectando...');
        try {
            const result = await root.collaborationRealtime.joinRoom({
                endpoint: root.document.getElementById('collaborationEndpoint')?.value,
                actorName: root.document.getElementById('collaborationJoinName')?.value,
                roomCode: root.document.getElementById('collaborationJoinCode')?.value,
                password: root.document.getElementById('collaborationJoinPassword')?.value,
                participantId: root.document.getElementById('collaborationJoinParticipant')?.value
            });
            root?.showToast?.(`👤 Conectado à sala ${result.room.code}.`);
            renderCollaborationView(root.document.querySelector('#sessionToolsModal .session-tools'));
        } catch (error) {
            if (error?.code === 'participant_required' && Array.isArray(error.data?.participants) && error.data.participants.length) {
                const field = root.document.getElementById('collaborationJoinParticipantField');
                const select = root.document.getElementById('collaborationJoinParticipant');
                select.innerHTML = error.data.participants.map(participant =>
                    `<option value="${escapeHtml(participant.participantId)}">${escapeHtml(participant.name)}</option>`).join('');
                field.classList.remove('hidden');
                button.dataset.idleLabel = 'Entrar agora';
                root?.showToast?.('Escolha o personagem que será controlado.');
            } else {
                root?.showToast?.(`⚠️ ${error?.message || 'Não foi possível entrar na sala.'}`);
            }
            setBusy(button, false);
        }
    }

    async function copyCollaborationRoomCode() {
        const code = getSession().roomCode;
        if (!code) return;
        try {
            await root.navigator?.clipboard?.writeText?.(code);
            root?.showToast?.(`Código ${code} copiado.`);
        } catch {
            root?.showToast?.(`Código da sala: ${code}`);
        }
    }

    function leaveCollaborationRoom() {
        root?.collaborationRealtime?.disconnect?.();
        root?.showToast?.('Sala desconectada. O modo offline continua disponível.');
        renderCollaborationView(root.document.querySelector('#sessionToolsModal .session-tools'));
    }

    function publishCollaborationCampaignNow() {
        const published = root?.collaborationRealtime?.publishActiveCampaign?.();
        root?.showToast?.(published ? '↻ Campanha enviada para a sala.' : 'A sala ainda está reconectando.');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function installInteractionGuards() {
        if (!root?.document || root.document.documentElement.dataset.collaborationGuards === 'true') return;
        root.document.documentElement.dataset.collaborationGuards = 'true';
        root.document.addEventListener('click', event => {
            if (!isPlayer()) return;
            const masterOnly = event.target.closest?.('[data-master-only]');
            if (!masterOnly) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            root?.showToast?.('🔒 Esta ação pertence ao mestre da sala.');
        }, true);
    }

    function resetForTests() {
        session = null;
        storage = null;
    }

    const api = Object.freeze({
        STORAGE_KEY,
        SESSION_VERSION,
        CONNECTION_STATES,
        normalizeSession,
        initialize,
        getSession,
        isMaster,
        isPlayer,
        getRoleLabel,
        getPermissionContext,
        authorize,
        isOnlineRoom,
        updateSession,
        startOnlineSession,
        updateOnlineIdentity,
        setConnectionState,
        setLastServerSequence,
        leaveOnlineSession,
        getStatusPresentation,
        updateConnectionIndicator,
        applyRoleToDocument,
        renderCollaborationView,
        setLocalRole,
        setLocalPlayerFromView,
        setLocalMasterFromView,
        installInteractionGuards,
        resetForTests
    });

    if (root?.document && root?.localStorage) {
        initialize();
        root.addEventListener?.('load', () => {
            applyRoleToDocument();
            installInteractionGuards();
        });
    }

    root.renderCollaborationView = renderCollaborationView;
    root.setLocalPlayerFromView = setLocalPlayerFromView;
    root.setLocalMasterFromView = setLocalMasterFromView;
    root.createCollaborationRoomFromView = createCollaborationRoomFromView;
    root.joinCollaborationRoomFromView = joinCollaborationRoomFromView;
    root.copyCollaborationRoomCode = copyCollaborationRoomCode;
    root.leaveCollaborationRoom = leaveCollaborationRoom;
    root.publishCollaborationCampaignNow = publishCollaborationCampaignNow;
    return api;
});
