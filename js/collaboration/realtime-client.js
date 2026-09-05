(function (root, factory) {
    const protocol = root?.collaborationProtocol
        || (typeof require === 'function' ? require('./protocol.js') : null);
    const api = factory(root, protocol);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.collaborationRealtime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, protocol) {
    'use strict';

    const ENDPOINT_KEY = 'dnd_collaboration_endpoint_v1';
    const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 20000];
    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    let manualDisconnect = false;
    let campaignUnsubscribe = null;
    let publishTimer = null;
    let presence = [];

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

    function getSavedEndpoint() {
        return normalizeEndpoint(root?.localStorage?.getItem?.(ENDPOINT_KEY) || '');
    }

    function saveEndpoint(value) {
        const endpoint = normalizeEndpoint(value);
        if (endpoint) root?.localStorage?.setItem?.(ENDPOINT_KEY, endpoint);
        return endpoint;
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
        const endpoint = normalizeEndpoint(endpointValue);
        if (!endpoint) throw new Error('Informe o endereço do serviço Cloudflare.');
        return request(endpoint, '/health', { method: 'GET' });
    }

    async function createRoom(options = {}) {
        const endpoint = saveEndpoint(options.endpoint);
        if (!endpoint) throw new Error('Informe um endereço HTTPS válido para o serviço Cloudflare.');
        const campaign = root?.campaignStore?.checkpoint?.({ reason: 'collaboration-room-create' })
            || root?.campaignStore?.getActiveCampaign?.();
        if (!campaign) throw new Error('Nenhuma campanha ativa foi encontrada.');
        const current = root?.collaborationSession?.getSession?.() || {};
        const result = await request(endpoint, '/api/rooms', {
            body: {
                roomName: options.roomName || campaign.metadata?.name,
                password: options.password,
                actorName: options.actorName || 'Mestre',
                deviceId: current.deviceId,
                campaign
            }
        });
        root?.collaborationSession?.startOnlineSession?.({ endpoint, ...result });
        applySnapshot(result.campaign, result.room?.sequence, result.member);
        await connect({ socketTicket: result.socketTicket });
        return result;
    }

    async function joinRoom(options = {}) {
        const endpoint = saveEndpoint(options.endpoint);
        if (!endpoint) throw new Error('Informe um endereço HTTPS válido para o serviço Cloudflare.');
        const roomCode = String(options.roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!roomCode) throw new Error('Informe o código da sala.');
        const current = root?.collaborationSession?.getSession?.() || {};
        const result = await request(endpoint, `/api/rooms/${encodeURIComponent(roomCode)}/join`, {
            body: {
                password: options.password,
                actorName: options.actorName,
                participantId: options.participantId || null,
                deviceId: current.deviceId
            }
        });
        root?.collaborationSession?.startOnlineSession?.({ endpoint, ...result });
        applySnapshot(result.campaign, result.room?.sequence, result.member);
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
    }

    function handleMessage(event) {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type === 'room.snapshot') {
            presence = Array.isArray(message.presence) ? message.presence : presence;
            root?.collaborationSession?.updateOnlineIdentity?.(message);
            applySnapshot(message.campaign, message.sequence, message.member);
            refreshRoomView();
            return;
        }
        if (message.type === 'room.presence') {
            presence = Array.isArray(message.members) ? message.members : [];
            refreshRoomView();
            return;
        }
        if (message.type === 'command.accepted') {
            root?.collaborationSession?.setLastServerSequence?.(message.sequence);
            root?.collaborationSession?.setConnectionState?.('synced');
            return;
        }
        if (message.type === 'command.rejected') {
            root?.collaborationSession?.setConnectionState?.('conflict');
            root?.showToast?.(`⚠️ ${message.reason || 'A alteração foi recusada pela sala.'}`);
            return;
        }
        if (message.type === 'room.revoked' || message.type === 'room.closed') {
            manualDisconnect = true;
            root?.collaborationSession?.setConnectionState?.('revoked');
            root?.showToast?.(message.type === 'room.closed' ? 'A sala foi encerrada.' : 'O acesso deste dispositivo foi revogado.');
        }
    }

    function applySnapshot(campaign, sequence, member) {
        if (!campaign) return;
        const applied = root?.campaignStore?.applyRemoteCampaign?.(campaign, { sequence });
        if (applied) root?.applyRemoteCampaignView?.(applied);
        root?.collaborationSession?.setLastServerSequence?.(sequence);
    }

    function handleClose(event) {
        socket = null;
        if (manualDisconnect || event.code === 4003) return;
        root?.collaborationSession?.setConnectionState?.('connecting');
        scheduleReconnect();
    }

    function handleError() {
        if (socket?.readyState === root.WebSocket.OPEN) return;
        root?.collaborationSession?.setConnectionState?.('connecting');
    }

    function scheduleReconnect() {
        clearTimeout(reconnectTimer);
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(() => {
            connect().catch(() => scheduleReconnect());
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
        if (!socket || socket.readyState !== root.WebSocket.OPEN) {
            root?.showToast?.('A sala está reconectando. Tente novamente em instantes.');
            return false;
        }
        socket.send(JSON.stringify({ type: 'command.submit', command }));
        root?.collaborationSession?.setConnectionState?.('pending');
        return true;
    }

    function disconnect(options = {}) {
        manualDisconnect = true;
        clearTimeout(reconnectTimer);
        clearTimeout(publishTimer);
        if (socket && socket.readyState < 2) socket.close(1000, 'Sala desconectada');
        socket = null;
        presence = [];
        if (campaignUnsubscribe) campaignUnsubscribe();
        campaignUnsubscribe = null;
        if (options.clearSession !== false) root?.collaborationSession?.leaveOnlineSession?.();
    }

    function reconnectIfNeeded() {
        const current = root?.collaborationSession?.getSession?.() || {};
        if (current.mode !== 'room' || !current.memberToken || socket) return false;
        connect().catch(error => {
            root?.collaborationSession?.setConnectionState?.('connecting');
            scheduleReconnect();
            console.warn('A sala será reconectada automaticamente.', error?.message || error);
        });
        return true;
    }

    function getPresence() {
        return presence.map(member => ({ ...member }));
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
        normalizeEndpoint,
        getSavedEndpoint,
        saveEndpoint,
        checkHealth,
        createRoom,
        joinRoom,
        connect,
        disconnect,
        reconnectIfNeeded,
        publishActiveCampaign,
        submitCommand,
        getPresence,
        isConnected
    });
});
