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
    const PLAYER_PAD_KEY = 'dnd_collaboration_player_pad_collapsed_v1';
    const SESSION_VERSION = 1;
    const CONNECTION_STATES = Object.freeze({
        OFFLINE: 'offline',
        CONNECTING: 'connecting',
        SYNCED: 'synced',
        PENDING: 'pending',
        CONFLICT: 'conflict',
        REVOKED: 'revoked'
    });
    const ACCESS_END_REASONS = Object.freeze({
        LEFT: 'left',
        REVOKED: 'revoked',
        CLOSED: 'closed'
    });

    let storage = null;
    let session = null;
    let discoveredRooms = [];
    let roomDirectoryLoaded = false;
    let roomDirectoryLoading = false;
    let selectedRoom = null;
    let pendingJoin = null;

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
        const accessEndedMode = value.mode === 'access-ended' && role === protocol.ROLES.PLAYER;
        const allowedConnectionStates = Object.values(CONNECTION_STATES);
        return {
            version: SESSION_VERSION,
            mode: roomMode ? 'room' : (accessEndedMode ? 'access-ended' : (role === protocol.ROLES.PLAYER ? 'player-preview' : 'solo')),
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
            lastServerSequence: roomMode ? Math.max(0, Number(value.lastServerSequence) || 0) : 0,
            pendingCount: roomMode ? Math.max(0, Number(value.pendingCount) || 0) : 0,
            accessEndReason: accessEndedMode && Object.values(ACCESS_END_REASONS).includes(value.accessEndReason)
                ? value.accessEndReason
                : null,
            accessEndedAt: accessEndedMode ? String(value.accessEndedAt || new Date().toISOString()) : null
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
        const entityKey = options.entityKey || `${type}:${targetId || 'campaign'}`;
        const command = protocol.createCommand({
            id: options.id,
            campaignId: campaign?.id || 'local-campaign',
            actorId: current.actorId,
            deviceId: current.deviceId,
            role: current.role,
            type,
            targetId,
            entityKey,
            baseVersion: options.baseVersion ?? campaign?.entityVersions?.[entityKey] ?? 0,
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

    function setPendingCount(pendingCount) {
        if (!isOnlineRoom()) return getSession();
        return updateSession({ pendingCount: Math.max(0, Number(pendingCount) || 0) });
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

    function endPlayerRoomAccess(reason = ACCESS_END_REASONS.LEFT) {
        const current = getSession();
        if (current.role !== protocol.ROLES.PLAYER) return leaveOnlineSession();
        const normalizedReason = Object.values(ACCESS_END_REASONS).includes(reason)
            ? reason
            : ACCESS_END_REASONS.LEFT;
        session = normalizeSession({
            mode: 'access-ended',
            role: protocol.ROLES.PLAYER,
            deviceId: current.deviceId,
            accessEndReason: normalizedReason,
            accessEndedAt: new Date().toISOString()
        });
        persist();
        applyRoleToDocument();
        root?.renderCharacterCollectionSelectors?.();
        root?.renderList?.(false);
        root?.refreshSessionStatus?.();
        return getSession();
    }

    function isPlayerAccessEnded() {
        return getSession().mode === 'access-ended';
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
        if (current.mode === 'access-ended') return { label: 'Sem acesso à campanha', className: 'is-revoked' };
        if (current.connectionState === CONNECTION_STATES.SYNCED) return { label: `Sala sincronizada${roomSuffix}`, className: 'is-synced' };
        if (current.connectionState === CONNECTION_STATES.CONNECTING) return { label: `Conectando à sala${roomSuffix}`, className: 'is-connecting' };
        if (current.connectionState === CONNECTION_STATES.PENDING) return { label: `${current.pendingCount || 1} alteração(ões) pendente(s)${roomSuffix}`, className: 'is-pending' };
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
        root.document.documentElement.dataset.collaborationAccess = isPlayerAccessEnded() ? 'blocked' : 'granted';
        const appWrapper = root.document.getElementById('appWrapper');
        const desktopNavigation = root.document.querySelector('.desktop-navigation');
        const mobileNavigation = root.document.querySelector('.mobile-navigation');
        [appWrapper, desktopNavigation, mobileNavigation].forEach(element => {
            if (!element) return;
            element.inert = isPlayerAccessEnded();
            if (isPlayerAccessEnded()) element.setAttribute('aria-hidden', 'true');
            else element.removeAttribute('aria-hidden');
        });
        renderPlayerAccessEndedOverlay();
        applyPlayerPadState();
        updateConnectionIndicator();
    }

    function getAccessEndedCopy(reason = getSession().accessEndReason) {
        if (reason === ACCESS_END_REASONS.REVOKED) {
            return {
                title: 'Acesso removido pelo Mestre',
                message: 'Este dispositivo não possui mais acesso ao combate nem às informações da campanha.'
            };
        }
        if (reason === ACCESS_END_REASONS.CLOSED) {
            return {
                title: 'Sala encerrada',
                message: 'O Mestre encerrou a sala. As informações da campanha não estão mais disponíveis neste dispositivo.'
            };
        }
        return {
            title: 'Você saiu da sala',
            message: 'O acesso ao combate e às informações da campanha foi encerrado neste dispositivo.'
        };
    }

    function renderPlayerAccessEndedOverlay() {
        if (!root?.document) return;
        let overlay = root.document.getElementById('collaborationAccessEndedOverlay');
        if (!isPlayerAccessEnded()) {
            overlay?.remove?.();
            return;
        }
        if (!overlay) {
            overlay = root.document.createElement('section');
            overlay.id = 'collaborationAccessEndedOverlay';
            overlay.className = 'collaboration-access-ended';
            overlay.setAttribute('role', 'status');
            root.document.body.appendChild(overlay);
        }
        const copy = getAccessEndedCopy();
        overlay.innerHTML = `
            <div class="collaboration-access-ended-card">
                <span aria-hidden="true">🔒</span>
                <small>SESSÃO PROTEGIDA</small>
                <h1>${escapeHtml(copy.title)}</h1>
                <p>${escapeHtml(copy.message)}</p>
                <div class="collaboration-access-ended-actions">
                    <button type="button" class="is-secondary" onclick="returnToOfflineModeAfterAccessEnded()">Voltar ao modo offline</button>
                    <button type="button" onclick="openCollaborationLobbyAfterAccessEnded()">Procurar outra sala</button>
                </div>
            </div>
        `;
    }

    function openCollaborationLobbyAfterAccessEnded() {
        root?.openSessionTools?.('collaboration');
    }

    function returnToOfflineModeAfterAccessEnded() {
        if (!isPlayerAccessEnded()) return getSession();
        root?.collaborationRealtime?.disconnect?.({ clearSession: false });
        selectedRoom = null;
        pendingJoin = null;
        const offlineSession = leaveOnlineSession();
        root?.closeSessionTools?.();
        root?.showToast?.('Modo offline restaurado. Seus dados locais continuam disponíveis.');
        return offlineSession;
    }

    function applyPlayerPadState() {
        const controls = root?.document?.getElementById('combatControls');
        if (!controls) return;
        const collapsed = isPlayer() && root?.localStorage?.getItem?.(PLAYER_PAD_KEY) === 'true';
        controls.classList.toggle('player-pad-collapsed', collapsed);
        const name = root?.document?.getElementById('playerPadCollapsedName');
        const current = getSession();
        const ownedCharacter = typeof combatants !== 'undefined' && Array.isArray(combatants)
            ? combatants.find(entry => String(entry?.id || '') === String(current.linkedParticipantId || ''))
            : null;
        if (name) name.textContent = ownedCharacter?.name || current.memberName || 'Meu personagem';
    }

    function toggleCollaborationPlayerPad(collapsed) {
        if (!isPlayer()) return;
        root?.localStorage?.setItem?.(PLAYER_PAD_KEY, collapsed ? 'true' : 'false');
        applyPlayerPadState();
    }

    function openCollaborationPlayerRolls() {
        const participantId = getSession().linkedParticipantId;
        const card = participantId ? root?.document?.getElementById(`card-${participantId}`) : null;
        const wrapper = card?.closest?.('.combat-wrapper');
        const panel = wrapper?.querySelector?.('.character-skills-panel');
        if (!card) {
            root?.showToast?.('Sua ficha ainda não está disponível no combate.');
            return;
        }
        if (!panel) {
            root?.showToast?.('Esta ficha não possui perícias disponíveis para rolagem.');
            card.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (panel.classList.contains('is-collapsed')) root?.toggleCharacterSkillsPanel?.(encodeURIComponent(String(participantId)));
        root?.setTimeout?.(() => {
            const refreshed = root?.document?.getElementById(`card-${participantId}`)?.closest?.('.combat-wrapper')?.querySelector?.('.character-skills-panel');
            refreshed?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        }, 0);
    }

    function renderCollaborationView(dialog) {
        if (!dialog) return;
        const current = getSession();
        const campaign = root?.campaignStore?.getActiveCampaign?.();
        if (current.mode === 'room') {
            const presentation = getStatusPresentation();
            const onlineMembers = root?.collaborationRealtime?.getPresence?.() || [];
            const workflow = root?.collaborationRealtime?.getWorkflow?.() || {};
            const pendingProposals = (workflow.proposals || []).filter(entry => entry.status === 'pending');
            const openConflicts = (workflow.conflicts || []).filter(entry => entry.status === 'pending');
            const recentDecisions = (workflow.decisions || []).slice(-5).reverse();
            const recentActivity = (workflow.activity || []).slice(-8).reverse();
            const recentAccess = (workflow.accessLog || []).slice(-8).reverse();
            const registeredPlayers = (workflow.members || []).filter(member => member.role === 'player' && !member.revoked);
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
                        ? onlineMembers.map(member => `<span>${member.role === 'master' ? '👑' : '👤'} ${escapeHtml(member.name)}${current.role === protocol.ROLES.MASTER && member.role !== 'master' ? ` <button type="button" class="collaboration-member-remove" onclick="requestRevokeCollaborationMember('${escapeHtml(member.id)}','${escapeHtml(member.name)}')" title="Remover dispositivo">×</button>` : ''}</span>`).join('')
                        : '<small>Aguardando a lista de presença...</small>'}</div>
                </section>
                ${current.role === protocol.ROLES.MASTER && registeredPlayers.length ? `
                    <details class="collaboration-decisions">
                        <summary>Dispositivos autorizados (${registeredPlayers.length})</summary>
                        <div>${registeredPlayers.map(member => `<p class="collaboration-authorized-member"><span>👤</span><strong>${escapeHtml(member.name)}</strong><small>${onlineMembers.some(online => online.id === member.id) ? 'Online' : 'Offline'}</small><button type="button" onclick="requestRevokeCollaborationMember('${escapeHtml(member.id)}','${escapeHtml(member.name)}')">Revogar</button></p>`).join('')}</div>
                    </details>
                ` : ''}
                ${current.role === protocol.ROLES.MASTER ? `
                    <section class="collaboration-workflow" aria-label="Solicitações dos jogadores">
                        <header><div><strong>Solicitações</strong><small>${pendingProposals.length} aguardando decisão</small></div><span>${pendingProposals.length}</span></header>
                        <div class="collaboration-workflow-list">${pendingProposals.length
                            ? pendingProposals.map(renderProposalCard).join('')
                            : '<p class="collaboration-empty">Nenhuma alteração aguardando aprovação.</p>'}</div>
                    </section>
                    <section class="collaboration-workflow ${openConflicts.length ? 'has-conflicts' : ''}" aria-label="Conflitos de sincronização">
                        <header><div><strong>Conflitos</strong><small>Alterações incompatíveis nunca são substituídas silenciosamente</small></div><span>${openConflicts.length}</span></header>
                        <div class="collaboration-workflow-list">${openConflicts.length
                            ? openConflicts.map(renderConflictCard).join('')
                            : '<p class="collaboration-empty">Nenhum conflito pendente.</p>'}</div>
                    </section>
                    <details class="collaboration-decisions">
                        <summary>Histórico recente de decisões</summary>
                        <div>${recentDecisions.length ? recentDecisions.map(renderDecisionCard).join('') : '<p class="collaboration-empty">Nenhuma decisão registrada.</p>'}</div>
                    </details>
                    <details class="collaboration-decisions">
                        <summary>Registro de acessos</summary>
                        <div>${recentAccess.length ? recentAccess.map(renderAccessCard).join('') : '<p class="collaboration-empty">Nenhum acesso registrado.</p>'}</div>
                    </details>
                ` : pendingProposals.length ? `
                    <section class="collaboration-workflow">
                        <header><div><strong>Minhas solicitações</strong><small>Aguardando a decisão do Mestre</small></div><span>${pendingProposals.length}</span></header>
                    </section>
                ` : ''}
                <details class="collaboration-decisions" ${recentActivity.length ? '' : 'hidden'}>
                    <summary>Atividade recente da sala</summary>
                    <div>${recentActivity.map(renderActivityCard).join('')}</div>
                </details>
                <div class="collaboration-live-actions">
                    ${current.role === protocol.ROLES.MASTER
                        ? '<button type="button" class="session-primary" onclick="publishCollaborationCampaignNow()">↻ Sincronizar agora</button><button type="button" class="session-danger" onclick="requestCloseCollaborationRoom()">Encerrar sala</button>'
                        : ''}
                    <button type="button" class="session-secondary" onclick="leaveCollaborationRoom()">Sair da sala</button>
                </div>
                <p class="enhancement-note">Combate e recursos são sincronizados em tempo real. Alterações permanentes do Jogador entram na fila do Mestre e nunca substituem dados sem aprovação.</p>
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

        const roomCards = roomDirectoryLoading
            ? '<p class="collaboration-empty">Buscando salas abertas...</p>'
            : discoveredRooms.length
                ? discoveredRooms.map(room => `
                    <button type="button" class="collaboration-room-card ${selectedRoom?.code === room.code ? 'is-selected' : ''}" onclick="selectCollaborationRoom('${escapeHtml(room.code)}','${escapeHtml(room.name)}')">
                        <span><strong>${escapeHtml(room.name)}</strong><small>${room.connected} conectado${room.connected === 1 ? '' : 's'} · ${room.availableCharacters} personagem${room.availableCharacters === 1 ? '' : 's'} disponível${room.availableCharacters === 1 ? '' : 'is'}</small></span>
                        <b>Entrar</b>
                    </button>`).join('')
                : '<p class="collaboration-empty">Nenhuma sala pública aberta agora.</p>';
        const localSheets = getLocalCharacterSheets();
        const characterOptions = pendingJoin ? [
            ...(pendingJoin.participants || []).map(participant => `<option value="room:${escapeHtml(participant.participantId)}">Na sala · ${escapeHtml(participant.name)}</option>`),
            ...localSheets.map(sheet => `<option value="local:${escapeHtml(sheet.id)}">Neste dispositivo · ${escapeHtml(sheet.name)}</option>`)
        ].join('') : '';
        const joinPanel = selectedRoom ? `
            <section class="collaboration-online-card collaboration-join-selected">
                <div class="collaboration-selected-room"><span>🌐</span><div><small>SALA SELECIONADA</small><strong>${escapeHtml(selectedRoom.name)}</strong></div><button type="button" onclick="clearSelectedCollaborationRoom()">Trocar</button></div>
                ${pendingJoin ? `
                    <p>Escolha o personagem que este dispositivo controlará.</p>
                    <label class="collaboration-field"><span>Seu personagem</span><select id="collaborationJoinCharacterSource" class="session-input">${characterOptions || '<option value="">Crie ou importe uma ficha para continuar</option>'}</select></label>
                    <div class="collaboration-character-actions">
                        <button type="button" class="session-secondary" onclick="createNewCharacterSheet()">+ Criar ficha</button>
                        <button type="button" class="session-secondary" onclick="document.getElementById('collaborationCharacterImport').click()">⇧ Importar JSON</button>
                    </div>
                    <input id="collaborationCharacterImport" type="file" accept="application/json,.json" hidden onchange="importCollaborationCharacter(event)">
                ` : `
                    <input id="collaborationJoinName" class="session-input" type="text" maxlength="80" placeholder="Seu nome">
                    <input id="collaborationJoinPassword" class="session-input" type="password" maxlength="128" autocomplete="current-password" placeholder="Senha da sala">
                `}
                <button id="collaborationJoinButton" type="button" class="session-primary" onclick="joinCollaborationRoomFromView()">${pendingJoin ? 'Entrar com este personagem' : 'Continuar'}</button>
            </section>` : '';

        if (current.mode === 'access-ended') {
            const copy = getAccessEndedCopy(current.accessEndReason);
            dialog.innerHTML = `
                <div class="session-dialog-header">
                    <div><small class="collaboration-eyebrow">COLABORAÇÃO</small><h2>Entrar em outra sala</h2></div>
                    <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
                </div>
                <section class="collaboration-status-card is-access-ended">
                    <span class="collaboration-status-dot is-revoked"></span>
                    <div><strong>${escapeHtml(copy.title)}</strong><small>Nenhuma informação da campanha anterior está acessível.</small></div>
                </section>
                <p>Escolha uma nova sala e autentique este dispositivo para voltar ao modo Jogador.</p>
                <div class="session-dialog-actions collaboration-access-ended-dialog-actions">
                    <button type="button" class="session-secondary" onclick="returnToOfflineModeAfterAccessEnded()">Voltar ao modo offline</button>
                </div>
                <section class="collaboration-online-card collaboration-access-room-browser">
                    <div class="collaboration-room-list-heading"><div><span class="collaboration-card-icon">👤</span><strong>Salas abertas</strong></div><button type="button" onclick="refreshCollaborationRooms()" aria-label="Atualizar salas">↻</button></div>
                    <small>Toque em uma sala para conectar.</small>
                    <div class="collaboration-room-list">${roomCards}</div>
                    <details class="collaboration-private-room"><summary>Entrar em sala privada por código</summary><input id="collaborationPrivateCode" class="session-input collaboration-code-input" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="Código da sala"><button type="button" class="session-secondary" onclick="selectPrivateCollaborationRoom()">Selecionar</button></details>
                </section>
                ${joinPanel}
            `;
            if (!roomDirectoryLoaded && !roomDirectoryLoading) root?.setTimeout?.(() => refreshCollaborationRooms(), 0);
            return;
        }

        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div><small class="collaboration-eyebrow">COLABORAÇÃO</small><h2>Sala da campanha</h2></div>
                <button type="button" class="session-close" onclick="closeSessionTools()" aria-label="Fechar">×</button>
            </div>
            <section class="collaboration-status-card">
                <span class="collaboration-status-dot is-offline"></span>
                <div><strong>Pronto para conectar</strong><small>${escapeHtml(campaign?.metadata?.name || 'Campanha principal')} · revisão ${campaign?.revision || 0}</small></div>
            </section>
            <p>Crie uma sala como Mestre ou escolha uma sala aberta. Depois de selecionar, o jogador informa somente a senha e escolhe sua ficha; a conexão segura já está configurada.</p>
            <div class="collaboration-online-grid">
                <section class="collaboration-online-card">
                    <span class="collaboration-card-icon">👑</span>
                    <strong>Criar sala</strong>
                    <small>Publica uma cópia segura da campanha ativa.</small>
                    <input id="collaborationCreateName" class="session-input" type="text" maxlength="80" placeholder="Nome do Mestre" value="Mestre">
                    <input id="collaborationRoomName" class="session-input" type="text" maxlength="100" placeholder="Nome da sala" value="${escapeHtml(campaign?.metadata?.name || 'Campanha principal')}">
                    <input id="collaborationCreatePassword" class="session-input" type="password" minlength="6" maxlength="128" autocomplete="new-password" placeholder="Senha da sala">
                    <label class="collaboration-discoverable"><input id="collaborationDiscoverable" type="checkbox" checked><span>Mostrar esta sala na lista pública</span></label>
                    <button id="collaborationCreateButton" type="button" class="session-primary" onclick="createCollaborationRoomFromView()">Criar sala</button>
                </section>
                <section class="collaboration-online-card">
                    <div class="collaboration-room-list-heading"><div><span class="collaboration-card-icon">👤</span><strong>Salas abertas</strong></div><button type="button" onclick="refreshCollaborationRooms()" aria-label="Atualizar salas">↻</button></div>
                    <small>Toque em uma sala para conectar.</small>
                    <div class="collaboration-room-list">${roomCards}</div>
                    <details class="collaboration-private-room"><summary>Entrar em sala privada por código</summary><input id="collaborationPrivateCode" class="session-input collaboration-code-input" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="Código da sala"><button type="button" class="session-secondary" onclick="selectPrivateCollaborationRoom()">Selecionar</button></details>
                </section>
            </div>
            ${joinPanel}
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
        if (!roomDirectoryLoaded && !roomDirectoryLoading) root?.setTimeout?.(() => refreshCollaborationRooms(), 0);
    }

    function renderProposalCard(proposal) {
        const target = proposal.command?.targetId ? ` · alvo ${proposal.command.targetId}` : '';
        return `
            <article class="collaboration-request-card">
                <div><strong>${escapeHtml(proposal.label || proposal.command?.type || 'Alteração')}</strong><small>${escapeHtml(proposal.memberName || 'Jogador')}${escapeHtml(target)}</small></div>
                <div class="collaboration-request-actions">
                    <button type="button" class="is-approve" onclick="approveCollaborationProposal('${escapeHtml(proposal.id)}')">Aprovar</button>
                    ${getAdjustableProposalField(proposal) ? `<button type="button" onclick="adjustCollaborationProposal('${escapeHtml(proposal.id)}')">Ajustar</button>` : ''}
                    <button type="button" class="is-reject" onclick="rejectCollaborationProposal('${escapeHtml(proposal.id)}')">Rejeitar</button>
                </div>
            </article>`;
    }

    function renderConflictCard(conflict) {
        return `
            <article class="collaboration-request-card is-conflict">
                <div><strong>${escapeHtml(conflict.label || 'Alterações simultâneas')}</strong><small>${escapeHtml(conflict.memberName || 'Participante')} · escolha qual versão preservar</small></div>
                <div class="collaboration-request-actions">
                    <button type="button" class="is-approve" onclick="resolveCollaborationConflict('${escapeHtml(conflict.id)}','incoming')">Usar recebida</button>
                    <button type="button" onclick="resolveCollaborationConflict('${escapeHtml(conflict.id)}','current')">Manter atual</button>
                </div>
            </article>`;
    }

    function renderDecisionCard(decision) {
        return `<p class="collaboration-decision"><span>${decision.decision === 'approved' ? '✅' : '❌'}</span><strong>${escapeHtml(decision.label || 'Alteração')}</strong><small>${escapeHtml(decision.memberName || '')}${decision.note ? ` · ${escapeHtml(decision.note)}` : ''}</small></p>`;
    }

    function renderAccessCard(entry) {
        const labels = {
            'room.created': 'Sala criada',
            'member.joined': 'Jogador entrou',
            'member.joined-with-character': 'Jogador entrou com nova ficha',
            'member.connected': 'Dispositivo conectado',
            'member.revoked': 'Acesso revogado',
            'room.closed': 'Sala encerrada'
        };
        return `<p class="collaboration-decision"><span>🔐</span><strong>${escapeHtml(labels[entry.action] || entry.action || 'Acesso')}</strong><small>${escapeHtml(entry.memberName || '')}${entry.createdAt ? ` · ${new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}</small></p>`;
    }

    function renderActivityCard(entry) {
        const roll = entry.type === 'roll.publish';
        const result = roll ? entry.payload?.finalResult : null;
        return `<p class="collaboration-decision"><span>${roll ? '🎲' : '💬'}</span><strong>${escapeHtml(roll ? `${entry.memberName || 'Jogador'} rolou ${result ?? ''}` : entry.memberName || 'Mensagem')}</strong><small>${escapeHtml(entry.payload?.skillName || entry.payload?.message || '')}</small></p>`;
    }

    function getLocalCharacterSheets() {
        try {
            const sheets = JSON.parse(root?.localStorage?.getItem?.('dnd_character_sheets') || '[]');
            return Array.isArray(sheets) ? sheets.filter(sheet => sheet?.id && (sheet.name || sheet.identity?.name)) : [];
        } catch {
            return [];
        }
    }

    function getCollaborationDialog() {
        return root?.document?.querySelector('#sessionToolsModal .session-tools');
    }

    async function refreshCollaborationRooms() {
        if (roomDirectoryLoading) return;
        roomDirectoryLoading = true;
        renderCollaborationView(getCollaborationDialog());
        try {
            discoveredRooms = await root?.collaborationRealtime?.listRooms?.() || [];
            roomDirectoryLoaded = true;
        } catch (error) {
            discoveredRooms = [];
            roomDirectoryLoaded = true;
            root?.showToast?.(`⚠️ ${error?.message || 'Não foi possível carregar as salas.'}`);
        } finally {
            roomDirectoryLoading = false;
            renderCollaborationView(getCollaborationDialog());
        }
    }

    function selectCollaborationRoom(code, name) {
        selectedRoom = { code: String(code || ''), name: String(name || 'Sala da campanha') };
        pendingJoin = null;
        renderCollaborationView(getCollaborationDialog());
        root?.setTimeout?.(() => root?.document?.getElementById('collaborationJoinName')?.focus(), 0);
    }

    function clearSelectedCollaborationRoom() {
        selectedRoom = null;
        pendingJoin = null;
        renderCollaborationView(getCollaborationDialog());
    }

    function selectPrivateCollaborationRoom() {
        const code = String(root?.document?.getElementById('collaborationPrivateCode')?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!code) {
            root?.showToast?.('Informe o código da sala privada.');
            return;
        }
        selectCollaborationRoom(code, `Sala ${code}`);
    }

    function getProposalById(proposalId) {
        return (root?.collaborationRealtime?.getWorkflow?.()?.proposals || [])
            .find(entry => String(entry.id) === String(proposalId));
    }

    function getAdjustableProposalField(proposal) {
        const payload = proposal?.command?.payload || {};
        return ['quantity', 'amount', 'crowns', 'level'].find(key => Number.isFinite(Number(payload[key]))) || null;
    }

    function approveCollaborationProposal(proposalId) {
        root?.collaborationRealtime?.resolveProposal?.(proposalId, 'approved');
    }

    function adjustCollaborationProposal(proposalId) {
        const proposal = getProposalById(proposalId);
        const field = getAdjustableProposalField(proposal);
        if (!proposal || !field) return;
        const current = Number(proposal.command.payload[field]) || 0;
        const answer = root?.prompt?.(`Novo valor para ${field}:`, String(current));
        if (answer === null) return;
        const value = Number(answer);
        if (!Number.isFinite(value) || value < 0) {
            root?.showToast?.('Informe um valor numérico válido.');
            return;
        }
        root?.collaborationRealtime?.resolveProposal?.(proposalId, 'approved', {
            adjustedPayload: { ...proposal.command.payload, [field]: value },
            note: `${field} ajustado de ${current} para ${value}`
        });
    }

    function rejectCollaborationProposal(proposalId) {
        const note = root?.prompt?.('Motivo da rejeição (opcional):', '') ?? '';
        root?.collaborationRealtime?.resolveProposal?.(proposalId, 'rejected', { note });
    }

    function resolveCollaborationConflict(conflictId, resolution) {
        root?.collaborationRealtime?.resolveConflict?.(conflictId, resolution);
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
                actorName: root.document.getElementById('collaborationCreateName')?.value,
                roomName: root.document.getElementById('collaborationRoomName')?.value,
                password: root.document.getElementById('collaborationCreatePassword')?.value,
                discoverable: root.document.getElementById('collaborationDiscoverable')?.checked !== false
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
            if (!selectedRoom?.code) throw new Error('Escolha uma sala para continuar.');
            const characterSource = root.document.getElementById('collaborationJoinCharacterSource')?.value || '';
            const [sourceType, sourceId] = characterSource.split(':');
            const localSheet = sourceType === 'local'
                ? getLocalCharacterSheets().find(sheet => String(sheet.id) === String(sourceId))
                : null;
            const result = await root.collaborationRealtime.joinRoom({
                actorName: pendingJoin?.actorName || root.document.getElementById('collaborationJoinName')?.value,
                roomCode: selectedRoom.code,
                password: pendingJoin?.password || root.document.getElementById('collaborationJoinPassword')?.value,
                participantId: sourceType === 'room' ? sourceId : null,
                characterSheet: localSheet || null
            });
            pendingJoin = null;
            root?.showToast?.(`👤 Conectado à sala ${result.room.code}.`);
            renderCollaborationView(root.document.querySelector('#sessionToolsModal .session-tools'));
        } catch (error) {
            if (error?.code === 'participant_required' && Array.isArray(error.data?.participants)) {
                pendingJoin = {
                    roomCode: selectedRoom.code,
                    actorName: root.document.getElementById('collaborationJoinName')?.value || '',
                    password: root.document.getElementById('collaborationJoinPassword')?.value || '',
                    participants: error.data.participants
                };
                renderCollaborationView(getCollaborationDialog());
                root?.showToast?.('Escolha, crie ou importe o personagem que será controlado.');
            } else {
                root?.showToast?.(`⚠️ ${error?.message || 'Não foi possível entrar na sala.'}`);
            }
            setBusy(button, false);
        }
    }

    async function importCollaborationCharacter(event) {
        const input = event?.target;
        const file = input?.files?.[0];
        if (!file) return;
        try {
            if (Number(file.size) > 3 * 1024 * 1024) throw new Error('O arquivo excede o limite de 3 MB.');
            const payload = JSON.parse(await file.text());
            const sheet = root?.importCharacterSheetPackage?.(payload);
            if (!sheet) throw new Error('Não foi possível importar esta ficha.');
            root?.renderSessionToolsView?.('collaboration');
            root?.setTimeout?.(() => {
                const select = root?.document?.getElementById('collaborationJoinCharacterSource');
                if (select) select.value = `local:${sheet.id}`;
            }, 0);
        } catch (error) {
            root?.showToast?.(`⚠️ ${error?.message || 'Não foi possível importar esta ficha.'}`);
        } finally {
            if (input) input.value = '';
        }
    }

    function requestRevokeCollaborationMember(memberId, memberName) {
        const action = () => {
            if (root?.collaborationRealtime?.revokeMember?.(memberId)) root?.showToast?.(`🔒 Removendo ${memberName} da sala...`);
        };
        if (root?.openSessionConfirm) {
            root.openSessionConfirm({
                title: 'Remover dispositivo?',
                message: `${memberName} perderá o acesso imediatamente e poderá entrar novamente somente com autorização válida.`,
                confirmLabel: 'Remover',
                danger: true,
                onConfirm: action
            });
        } else if (root?.confirm?.(`Remover ${memberName} da sala?`)) action();
    }

    function requestCloseCollaborationRoom() {
        const action = () => root?.collaborationRealtime?.closeRoom?.();
        if (root?.openSessionConfirm) {
            root.openSessionConfirm({
                title: 'Encerrar sala?',
                message: 'Todos os jogadores serão desconectados. A campanha continuará salva localmente no dispositivo do Mestre.',
                confirmLabel: 'Encerrar sala',
                danger: true,
                onConfirm: action
            });
        } else if (root?.confirm?.('Encerrar esta sala para todos?')) action();
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
        const playerLeaving = isPlayer();
        root?.collaborationRealtime?.disconnect?.({ endPlayerAccess: playerLeaving, reason: ACCESS_END_REASONS.LEFT });
        root?.showToast?.(playerLeaving
            ? 'Você saiu da sala. O acesso à campanha foi encerrado.'
            : 'Sala desconectada. O modo offline continua disponível.');
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
        discoveredRooms = [];
        roomDirectoryLoaded = false;
        roomDirectoryLoading = false;
        selectedRoom = null;
        pendingJoin = null;
    }

    const api = Object.freeze({
        STORAGE_KEY,
        SESSION_VERSION,
        CONNECTION_STATES,
        ACCESS_END_REASONS,
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
        setPendingCount,
        leaveOnlineSession,
        endPlayerRoomAccess,
        returnToOfflineModeAfterAccessEnded,
        isPlayerAccessEnded,
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
    root.refreshCollaborationRooms = refreshCollaborationRooms;
    root.selectCollaborationRoom = selectCollaborationRoom;
    root.clearSelectedCollaborationRoom = clearSelectedCollaborationRoom;
    root.selectPrivateCollaborationRoom = selectPrivateCollaborationRoom;
    root.importCollaborationCharacter = importCollaborationCharacter;
    root.requestRevokeCollaborationMember = requestRevokeCollaborationMember;
    root.requestCloseCollaborationRoom = requestCloseCollaborationRoom;
    root.toggleCollaborationPlayerPad = toggleCollaborationPlayerPad;
    root.openCollaborationPlayerRolls = openCollaborationPlayerRolls;
    root.copyCollaborationRoomCode = copyCollaborationRoomCode;
    root.leaveCollaborationRoom = leaveCollaborationRoom;
    root.openCollaborationLobbyAfterAccessEnded = openCollaborationLobbyAfterAccessEnded;
    root.returnToOfflineModeAfterAccessEnded = returnToOfflineModeAfterAccessEnded;
    root.publishCollaborationCampaignNow = publishCollaborationCampaignNow;
    root.approveCollaborationProposal = approveCollaborationProposal;
    root.adjustCollaborationProposal = adjustCollaborationProposal;
    root.rejectCollaborationProposal = rejectCollaborationProposal;
    root.resolveCollaborationConflict = resolveCollaborationConflict;
    return api;
});
