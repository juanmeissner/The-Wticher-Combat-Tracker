(function (root, factory) {
    const protocol = root?.collaborationProtocol
        || (typeof require === 'function' ? require('./protocol.js') : null);
    const api = factory(root, protocol);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.collaborationRealtime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, protocol) {
    'use strict';

    const ENDPOINT_KEY = 'dnd_collaboration_endpoint_v1';
    const DEFAULT_ENDPOINT = 'https://witcher-combat-collaboration.juanmeissnerf.workers.dev';
    const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 20000];
    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    let manualDisconnect = false;
    let campaignUnsubscribe = null;
    let publishTimer = null;
    let presence = [];
    let pendingSnapshot = null;
    let snapshotFrame = null;
    let lastAppliedSequence = 0;
    let lastCampaignFingerprint = '';
    let workflow = { proposals: [], conflicts: [], decisions: [], activity: [], accessLog: [], members: [] };
    let queueFlushPromise = null;
    const sentCommandIds = new Set();

    function normalizeEndpoint(value) {
        const text = String(value || '').trim().replace(/\/+$/, '');
        if (!text) return '';
        try {
            const url = new URL(text);
            if (!['http:', 'https:'].includes(url.protocol)) return '';
            return url.toString().replace(/\/$/, '');
        } catch {
            return '';
        }
    }

    function isLocalDevelopmentEndpoint(value) {
        try {
            const hostname = new URL(value).hostname.toLowerCase();
            return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        } catch {
            return false;
        }
    }

    function getSavedEndpoint() {
        const saved = normalizeEndpoint(root?.localStorage?.getItem?.(ENDPOINT_KEY) || '');
        return isLocalDevelopmentEndpoint(saved) ? saved : DEFAULT_ENDPOINT;
    }

    function saveEndpoint(value) {
        const requested = normalizeEndpoint(value);
        const endpoint = isLocalDevelopmentEndpoint(requested) ? requested : DEFAULT_ENDPOINT;
        if (endpoint) root?.localStorage?.setItem?.(ENDPOINT_KEY, endpoint);
        return endpoint;
    }

    function getServiceEndpoint(value) {
        return normalizeEndpoint(value) || getSavedEndpoint() || DEFAULT_ENDPOINT;
    }

    async function request(endpoint, path, options = {}) {
        const response = await root.fetch(`${endpoint}${path}`, {
            method: options.method || 'POST',
            headers: {
                'content-type': 'application/json',
                ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        let data = {};
        try { data = await response.json(); } catch { data = {}; }
        if (!response.ok) {
            const error = new Error(data.message || `Falha de conexão (${response.status}).`);
            error.code = data.error || 'request_failed';
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    }

    async function checkHealth(endpointValue) {
        const endpoint = getServiceEndpoint(endpointValue);
        return request(endpoint, '/health', { method: 'GET' });
    }

    async function listRooms(endpointValue) {
        const endpoint = getServiceEndpoint(endpointValue);
        const result = await request(endpoint, '/api/rooms', { method: 'GET' });
        return Array.isArray(result.rooms) ? result.rooms : [];
    }

    async function createRoom(options = {}) {
        const endpoint = saveEndpoint(getServiceEndpoint(options.endpoint));
        const actorName = String(options.actorName || '').trim();
        const roomName = String(options.roomName || '').trim();
        if (!actorName) throw new Error('Informe o nome do Mestre.');
        if (!roomName) throw new Error('Informe o nome da sala.');
        const campaign = root?.campaignStore?.checkpoint?.({ reason: 'collaboration-room-create' })
            || root?.campaignStore?.getActiveCampaign?.();
        if (!campaign) throw new Error('Nenhuma campanha ativa foi encontrada.');
        const current = root?.collaborationSession?.getSession?.() || {};
        const result = await request(endpoint, '/api/rooms', {
            body: {
                roomName,
                password: options.password,
                actorName,
                deviceId: current.deviceId,
                discoverable: options.discoverable !== false,
                campaign
            }
        });
        root?.collaborationSession?.startOnlineSession?.({ endpoint, ...result });
        applySnapshot(result.campaign, result.room?.sequence, result.member, { force: true });
        await connect({ socketTicket: result.socketTicket });
        return result;
    }

    async function joinRoom(options = {}) {
        const endpoint = saveEndpoint(getServiceEndpoint(options.endpoint));
        const roomCode = String(options.roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!roomCode) throw new Error('Informe o código da sala.');
        if (!root?.campaignStore?.isTransientRemoteCampaign?.()) {
            root?.campaignStore?.checkpoint?.({ reason: 'collaboration-player-before-join' });
        }
        const current = root?.collaborationSession?.getSession?.() || {};
        const result = await request(endpoint, `/api/rooms/${encodeURIComponent(roomCode)}/join`, {
            body: {
                password: options.password,
                actorName: options.actorName,
                participantId: options.participantId || null,
                characterSheet: options.characterSheet || null,
                deviceId: current.deviceId
            }
        });
        root?.collaborationSession?.startOnlineSession?.({ endpoint, ...result });
        applySnapshot(result.campaign, result.room?.sequence, result.member, { force: true });
        await connect({ socketTicket: result.socketTicket });
        return result;
    }

    function socketUrl(endpoint, roomCode, ticket) {
        const url = new URL(`${endpoint}/api/rooms/${encodeURIComponent(roomCode)}/socket`);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('ticket', ticket);
        return url.toString();
    }

    async function issueTicket(current) {
        return request(current.endpoint, `/api/rooms/${encodeURIComponent(current.roomCode)}/ticket`, {
            token: current.memberToken,
            body: {}
        });
    }

    async function connect(options = {}) {
        const current = root?.collaborationSession?.getSession?.() || {};
        if (!current.endpoint || !current.roomCode || !current.memberToken) return false;
        clearTimeout(reconnectTimer);
        manualDisconnect = false;
        root?.collaborationSession?.setConnectionState?.('connecting');
        const ticket = options.socketTicket || (await issueTicket(current)).socketTicket;
        if (socket && socket.readyState < 2) socket.close(1000, 'Nova conexão');
        socket = new root.WebSocket(socketUrl(current.endpoint, current.roomCode, ticket));
        socket.addEventListener('open', handleOpen);
        socket.addEventListener('message', handleMessage);
        socket.addEventListener('close', handleClose);
        socket.addEventListener('error', handleError);
        return true;
    }

    function handleOpen() {
        reconnectAttempt = 0;
        root?.collaborationSession?.setConnectionState?.('synced');
        installCampaignPublisher();
        const current = root?.collaborationSession?.getSession?.() || {};
        socket?.send?.(JSON.stringify({ type: 'resync.request', since: current.lastServerSequence || 0 }));
    }

    function handleMessage(event) {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type === 'room.snapshot') {
            presence = Array.isArray(message.presence) ? message.presence : presence;
            mergeWorkflow(message.workflow, { replace: true });
            root?.collaborationSession?.updateOnlineIdentity?.(message);
            if (!queueSnapshot(message)) void flushOfflineQueue();
            refreshRoomView();
            return;
        }
        if (message.type === 'snapshot.accepted') {
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            root?.collaborationSession?.setConnectionState?.('synced');
            return;
        }
        if (message.type === 'room.presence') {
            presence = Array.isArray(message.members) ? message.members : [];
            refreshRoomView();
            return;
        }
        if (message.type === 'command.accepted') {
            void acknowledgeQueuedCommand(message.commandId);
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            return;
        }
        if (message.type === 'proposal.created') {
            mergeWorkflow({ proposals: [message.proposal] });
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            root?.showToast?.(root?.collaborationSession?.isMaster?.()
                ? `📨 Nova solicitação: ${message.proposal?.label || 'alteração de jogador'}.`
                : '📨 Alteração enviada para aprovação do mestre.');
            refreshRoomView();
            return;
        }
        if (message.type === 'proposal.resolved') {
            workflow.proposals = workflow.proposals.map(entry =>
                entry.id === message.proposal?.id ? message.proposal : entry);
            mergeWorkflow({ decisions: [message.decision] });
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            root?.showToast?.(message.proposal?.status === 'approved'
                ? '✅ Alteração aprovada pelo mestre.'
                : '❌ Alteração rejeitada pelo mestre.');
            refreshRoomView();
            return;
        }
        if (message.type === 'conflict.created') {
            mergeWorkflow({ conflicts: [message.conflict] });
            root?.collaborationSession?.setConnectionState?.('conflict');
            refreshRoomView();
            return;
        }
        if (message.type === 'conflict.resolved') {
            workflow.conflicts = workflow.conflicts.map(entry =>
                entry.id === message.conflict?.id ? message.conflict : entry);
            if (message.proposal) {
                workflow.proposals = workflow.proposals.map(entry =>
                    entry.id === message.proposal.id ? message.proposal : entry);
            }
            mergeWorkflow({ decisions: [message.decision] });
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            root?.collaborationSession?.setConnectionState?.('synced');
            refreshRoomView();
            return;
        }
        if (message.type === 'activity.created') {
            mergeWorkflow({ activity: [message.activity] });
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            if (message.activity?.type === 'roll.publish') {
                const result = message.activity.payload?.finalResult;
                root?.showToast?.(`🎲 ${message.activity.memberName || 'Jogador'} rolou ${result ?? 'um teste'}.`);
            }
            refreshRoomView();
            return;
        }
        if (message.type === 'command.rejected') {
            void acknowledgeQueuedCommand(message.commandId);
            root?.collaborationSession?.setConnectionState?.('conflict');
            root?.showToast?.(`⚠️ ${message.reason || 'A alteração foi recusada pela sala.'}`);
            return;
        }
        if (message.type === 'room.revoked' || message.type === 'room.closed') {
            manualDisconnect = true;
            const reason = message.type === 'room.closed' ? 'closed' : 'revoked';
            disconnect({ clearSession: false });
            root?.collaborationSession?.endPlayerRoomAccess?.(reason);
            root?.showToast?.(message.type === 'room.closed' ? 'A sala foi encerrada.' : 'O acesso deste dispositivo foi revogado.');
        }
    }

    function campaignFingerprint(campaign) {
        if (!campaign) return '';
        try { return JSON.stringify(campaign); } catch { return String(campaign?.revision || ''); }
    }

    function mergeUnique(current, incoming, limit = 100) {
        const values = new Map((current || []).map(entry => [String(entry?.id || ''), entry]));
        (incoming || []).forEach(entry => {
            if (entry?.id) values.set(String(entry.id), entry);
        });
        return [...values.values()].slice(-limit);
    }

    function mergeWorkflow(incoming = {}, options = {}) {
        if (options.replace) {
            workflow = {
                proposals: Array.isArray(incoming.proposals) ? incoming.proposals : [],
                conflicts: Array.isArray(incoming.conflicts) ? incoming.conflicts : [],
                decisions: Array.isArray(incoming.decisions) ? incoming.decisions : [],
                activity: Array.isArray(incoming.activity) ? incoming.activity : [],
                accessLog: Array.isArray(incoming.accessLog) ? incoming.accessLog : [],
                members: Array.isArray(incoming.members) ? incoming.members : []
            };
            return getWorkflow();
        }
        workflow = {
            proposals: mergeUnique(workflow.proposals, incoming.proposals),
            conflicts: mergeUnique(workflow.conflicts, incoming.conflicts),
            decisions: mergeUnique(workflow.decisions, incoming.decisions),
            activity: mergeUnique(workflow.activity, incoming.activity, 80),
            accessLog: mergeUnique(workflow.accessLog, incoming.accessLog, 80),
            members: mergeUnique(workflow.members, incoming.members, 100)
        };
        return getWorkflow();
    }

    function applySnapshot(campaign, sequence, member, options = {}) {
        if (!campaign) return;
        const numericSequence = Math.max(0, Number(sequence) || 0);
        const fingerprint = campaignFingerprint(campaign);
        if (!options.force && (
            (numericSequence && numericSequence <= lastAppliedSequence)
            || (fingerprint && fingerprint === lastCampaignFingerprint)
        )) {
            root?.collaborationSession?.setLastServerSequence?.(numericSequence);
            return;
        }
        const transient = member?.role === protocol.ROLES.PLAYER
            || root?.collaborationSession?.isPlayer?.();
        const applied = root?.campaignStore?.applyRemoteCampaign?.(campaign, {
            sequence,
            transient
        });
        if (applied) {
            lastAppliedSequence = Math.max(lastAppliedSequence, numericSequence);
            lastCampaignFingerprint = fingerprint;
            root?.applyRemoteCampaignView?.(applied);
        }
        root?.collaborationSession?.setLastServerSequence?.(numericSequence);
    }

    function queueSnapshot(message) {
        const sequence = Math.max(0, Number(message?.sequence) || 0);
        if (sequence && sequence <= lastAppliedSequence) return false;
        if (!pendingSnapshot || sequence >= Number(pendingSnapshot.sequence || 0)) pendingSnapshot = message;
        if (snapshotFrame !== null) return true;
        const schedule = root?.requestAnimationFrame || (callback => root?.setTimeout?.(callback, 16));
        snapshotFrame = schedule(() => {
            const latest = pendingSnapshot;
            pendingSnapshot = null;
            snapshotFrame = null;
            if (latest) {
                applySnapshot(latest.campaign, latest.sequence, latest.member);
                void flushOfflineQueue();
            }
        });
        return true;
    }

    function handleClose(event) {
        socket = null;
        sentCommandIds.clear();
        if (event.code === 4003 || event.code === 4004) {
            manualDisconnect = true;
            disconnect({ clearSession: false });
            root?.collaborationSession?.endPlayerRoomAccess?.(event.code === 4004 ? 'closed' : 'revoked');
            return;
        }
        if (manualDisconnect) return;
        root?.collaborationSession?.setConnectionState?.('connecting');
        scheduleReconnect();
    }

    function handleError() {
        if (socket?.readyState === root.WebSocket.OPEN) return;
        root?.collaborationSession?.setConnectionState?.('connecting');
    }

    function handleTerminalAccessError(error) {
        if (!root?.collaborationSession?.isPlayer?.()) return false;
        if (![403, 404].includes(Number(error?.status)) && !['revoked', 'room_not_found'].includes(error?.code)) return false;
        const closed = Number(error?.status) === 404 || error?.code === 'room_not_found';
        disconnect({ clearSession: false });
        root?.collaborationSession?.endPlayerRoomAccess?.(closed ? 'closed' : 'revoked');
        root?.showToast?.(closed ? 'A sala foi encerrada.' : 'O acesso deste dispositivo foi revogado.');
        return true;
    }

    function scheduleReconnect() {
        clearTimeout(reconnectTimer);
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(() => {
            connect().catch(error => {
                if (!handleTerminalAccessError(error)) scheduleReconnect();
            });
        }, delay);
    }

    function installCampaignPublisher() {
        if (campaignUnsubscribe || !root?.campaignStore?.subscribe) return;
        campaignUnsubscribe = root.campaignStore.subscribe(event => {
            if (event.reason === 'remote-applied') return;
            if (!root?.collaborationSession?.isMaster?.()) return;
            schedulePublish();
        });
    }

    function schedulePublish() {
        clearTimeout(publishTimer);
        publishTimer = setTimeout(() => publishActiveCampaign(), 120);
    }

    function publishActiveCampaign() {
        if (!socket || socket.readyState !== root.WebSocket.OPEN) return false;
        if (!root?.collaborationSession?.isMaster?.()) return false;
        const campaign = root?.campaignStore?.getActiveCampaign?.();
        if (!campaign) return false;
        socket.send(JSON.stringify({ type: 'snapshot.publish', campaign }));
        return true;
    }

    function submitCommand(command) {
        const current = root?.collaborationSession?.getSession?.() || {};
        if (!current.roomCode || !command?.id) return false;
        root?.collaborationSession?.setConnectionState?.('pending');
        const queue = root?.collaborationOfflineQueue;
        if (!queue?.enqueue) {
            if (!socket || socket.readyState !== root.WebSocket.OPEN) return false;
            socket.send(JSON.stringify({ type: 'command.submit', command }));
            return true;
        }
        queue.enqueue(current.roomCode, command).then(async () => {
            await updatePendingCount();
            if (socket?.readyState === root.WebSocket.OPEN) await flushOfflineQueue();
            else root?.showToast?.('📥 Alteração guardada. Ela será enviada quando a conexão voltar.');
        });
        return true;
    }

    async function updatePendingCount() {
        const current = root?.collaborationSession?.getSession?.() || {};
        const entries = await root?.collaborationOfflineQueue?.list?.(current.roomCode || '') || [];
        root?.collaborationSession?.setPendingCount?.(entries.length);
        return entries.length;
    }

    async function acknowledgeQueuedCommand(commandId) {
        if (commandId) sentCommandIds.delete(String(commandId));
        if (commandId) await root?.collaborationOfflineQueue?.remove?.(commandId);
        const pending = await updatePendingCount();
        if (!pending && root?.collaborationSession?.getSession?.().connectionState !== 'conflict') {
            root?.collaborationSession?.setConnectionState?.('synced');
        }
    }

    async function flushOfflineQueue() {
        if (queueFlushPromise) return queueFlushPromise;
        queueFlushPromise = (async () => {
            const current = root?.collaborationSession?.getSession?.() || {};
            if (!current.roomCode || !socket || socket.readyState !== root.WebSocket.OPEN) return false;
            const entries = await root?.collaborationOfflineQueue?.list?.(current.roomCode) || [];
            if (!entries.length) {
                root?.collaborationSession?.setPendingCount?.(0);
                return true;
            }
            root?.collaborationSession?.setPendingCount?.(entries.length);
            root?.collaborationSession?.setConnectionState?.('pending');
            for (const entry of entries) {
                if (!socket || socket.readyState !== root.WebSocket.OPEN) break;
                if (sentCommandIds.has(String(entry.id))) continue;
                await root?.collaborationOfflineQueue?.markAttempt?.(entry.id);
                socket.send(JSON.stringify({ type: 'command.submit', command: entry.command }));
                sentCommandIds.add(String(entry.id));
            }
            return true;
        })().finally(() => { queueFlushPromise = null; });
        return queueFlushPromise;
    }

    function disconnect(options = {}) {
        manualDisconnect = true;
        clearTimeout(reconnectTimer);
        clearTimeout(publishTimer);
        if (socket && socket.readyState < 2) socket.close(1000, 'Sala desconectada');
        socket = null;
        sentCommandIds.clear();
        presence = [];
        workflow = { proposals: [], conflicts: [], decisions: [], activity: [], accessLog: [], members: [] };
        pendingSnapshot = null;
        lastAppliedSequence = 0;
        lastCampaignFingerprint = '';
        if (snapshotFrame !== null) {
            const cancel = root?.cancelAnimationFrame || root?.clearTimeout;
            cancel?.(snapshotFrame);
            snapshotFrame = null;
        }
        if (campaignUnsubscribe) campaignUnsubscribe();
        campaignUnsubscribe = null;
        if (options.endPlayerAccess) {
            root?.collaborationSession?.endPlayerRoomAccess?.(options.reason || 'left');
        } else if (options.clearSession !== false) {
            root?.collaborationSession?.leaveOnlineSession?.();
        }
    }

    function reconnectIfNeeded() {
        const current = root?.collaborationSession?.getSession?.() || {};
        if (current.mode !== 'room' || !current.memberToken || socket) return false;
        connect().catch(error => {
            if (handleTerminalAccessError(error)) return;
            root?.collaborationSession?.setConnectionState?.('connecting');
            scheduleReconnect();
            console.warn('A sala será reconectada automaticamente.', error?.message || error);
        });
        return true;
    }

    function getPresence() {
        return presence.map(member => ({ ...member }));
    }

    function getWorkflow() {
        return JSON.parse(JSON.stringify(workflow));
    }

    function resolveProposal(proposalId, decision, options = {}) {
        const permission = root?.collaborationSession?.authorize?.('proposal.resolve', null, {
            proposalId,
            decision: decision === 'approved' ? 'approved' : 'rejected',
            note: options.note || '',
            adjustedPayload: options.adjustedPayload
        }, { entityKey: `proposal:${proposalId}` });
        if (!permission || permission.decision !== protocol.DECISIONS.ALLOW) return false;
        return submitCommand(permission.command);
    }

    function resolveConflict(conflictId, resolution) {
        const permission = root?.collaborationSession?.authorize?.('conflict.resolve', null, {
            conflictId,
            resolution: resolution === 'incoming' ? 'incoming' : 'current'
        }, { entityKey: `conflict:${conflictId}` });
        if (!permission || permission.decision !== protocol.DECISIONS.ALLOW) return false;
        return submitCommand(permission.command);
    }

    function revokeMember(memberId) {
        const permission = root?.collaborationSession?.authorize?.('room.member.revoke', memberId, { memberId }, {
            entityKey: `room-member:${memberId}`
        });
        if (!permission || permission.decision !== protocol.DECISIONS.ALLOW) return false;
        return submitCommand(permission.command);
    }

    function closeRoom() {
        const permission = root?.collaborationSession?.authorize?.('room.close', null, {}, { entityKey: 'room:status' });
        if (!permission || permission.decision !== protocol.DECISIONS.ALLOW) return false;
        return submitCommand(permission.command);
    }

    function publishRoll(targetId, payload = {}) {
        const permission = root?.collaborationSession?.authorize?.('roll.publish', targetId, payload, {
            entityKey: `roll:${targetId}`
        });
        if (!permission || permission.decision !== protocol.DECISIONS.ALLOW) return false;
        return submitCommand(permission.command);
    }

    function refreshRoomView() {
        const dialog = root?.document?.querySelector('#sessionToolsModal .session-tools');
        if (dialog && root?.document?.getElementById('collaborationRoomLive')) {
            root?.renderCollaborationView?.(dialog);
        }
    }

    function isConnected() {
        return Boolean(socket && socket.readyState === root.WebSocket.OPEN);
    }

    root?.addEventListener?.('online', () => reconnectIfNeeded());
    root?.addEventListener?.('offline', () => root?.collaborationSession?.setConnectionState?.('connecting'));
    root?.addEventListener?.('load', () => reconnectIfNeeded());

    return Object.freeze({
        ENDPOINT_KEY,
        DEFAULT_ENDPOINT,
        normalizeEndpoint,
        isLocalDevelopmentEndpoint,
        getSavedEndpoint,
        saveEndpoint,
        getServiceEndpoint,
        checkHealth,
        listRooms,
        createRoom,
        joinRoom,
        connect,
        disconnect,
        reconnectIfNeeded,
        publishActiveCampaign,
        submitCommand,
        flushOfflineQueue,
        updatePendingCount,
        getPresence,
        getWorkflow,
        resolveProposal,
        resolveConflict,
        revokeMember,
        closeRoom,
        publishRoll,
        isConnected
    });
});
