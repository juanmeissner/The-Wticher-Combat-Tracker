const ROOM_KEY = 'room';
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_SEEN_COMMANDS = 500;
const TICKET_LIFETIME_MS = 45_000;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_PBKDF2_ITERATIONS = 100_000;
const MIN_PBKDF2_ITERATIONS = 1_000;
const MAX_PBKDF2_ITERATIONS = 100_000;

const COMMANDS = Object.freeze({
    'participant.resource.adjust': { player: 'allow', conflict: 'delta' },
    'roll.publish': { player: 'allow', conflict: 'append' },
    'combat.message.publish': { player: 'allow', conflict: 'append' }
});

function jsonResponse(value, status = 200, headers = {}) {
    return new Response(JSON.stringify(value), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
    });
}

function errorResponse(code, message, status = 400, detail = {}, headers = {}) {
    return jsonResponse({ ok: false, error: code, message, ...detail }, status, headers);
}

function base64Url(bytes) {
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function randomSecret(byteLength = 32) {
    return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function createRoomCode(length = 8) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return [...bytes].map(byte => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]).join('');
}

export function normalizeRoomCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

export function validatePassword(value) {
    const password = String(value || '');
    if (password.length < 6) return 'Use uma senha com pelo menos 6 caracteres.';
    if (password.length > 128) return 'A senha pode ter no máximo 128 caracteres.';
    return '';
}

export function normalizePbkdf2Iterations(value) {
    const configured = Number(value);
    const iterations = Number.isFinite(configured) && configured > 0
        ? Math.trunc(configured)
        : DEFAULT_PBKDF2_ITERATIONS;
    return Math.min(MAX_PBKDF2_ITERATIONS, Math.max(MIN_PBKDF2_ITERATIONS, iterations));
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value));
    return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

async function derivePassword(password, salt, iterations = 120_000) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: new TextEncoder().encode(salt),
        iterations
    }, key, 256);
    return base64Url(new Uint8Array(bits));
}

function timingSafeEqual(left, right) {
    const a = new TextEncoder().encode(String(left || ''));
    const b = new TextEncoder().encode(String(right || ''));
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let index = 0; index < a.length; index++) mismatch |= a[index] ^ b[index];
    return mismatch === 0;
}

async function readJson(request) {
    const declaredLength = Number(request.headers.get('content-length')) || 0;
    if (declaredLength > MAX_BODY_BYTES) throw new Error('payload_too_large');
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error('payload_too_large');
    return text ? JSON.parse(text) : {};
}

function sanitizeCampaign(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (!String(value.id || '').trim()) return null;
    return JSON.parse(JSON.stringify(value));
}

function stripPrivateFields(value) {
    const privateKeys = new Set([
        'gmNotes', 'masterNotes', 'secretNotes', 'privateNotes', 'secrets',
        'password', 'passwordHash', 'ownerSecret', 'accessLog', 'revokedDevices'
    ]);
    if (Array.isArray(value)) return value.map(stripPrivateFields);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value)
        .filter(([key]) => !privateKeys.has(key))
        .map(([key, nested]) => [key, stripPrivateFields(nested)]));
}

export function getCampaignParticipants(campaign) {
    const combatants = Array.isArray(campaign?.state?.combat?.combatants)
        ? campaign.state.combat.combatants
        : [];
    return combatants
        .filter(entry => entry?.type === 'player')
        .map(entry => ({
            participantId: String(entry.id),
            sheetId: entry.sheetId ? String(entry.sheetId) : null,
            name: String(entry.name || 'Jogador')
        }));
}

export function projectCampaignForMember(campaign, member = {}) {
    if (member.role === 'master') return JSON.parse(JSON.stringify(campaign));
    const safe = stripPrivateFields(JSON.parse(JSON.stringify(campaign)));
    const state = safe.state || {};
    delete state.preferences;
    delete state.master;
    delete state.audit;
    delete state.access;
    if (Array.isArray(state.combat?.combatants)) {
        state.combat.combatants = state.combat.combatants.map(combatant => {
            if (String(combatant?.id) === String(member.participantId)) return combatant;
            const visible = { ...combatant };
            delete visible.inventory;
            delete visible.abilities;
            delete visible.learnedSpells;
            delete visible.professionalSkills;
            return visible;
        });
    }
    if (Array.isArray(state.characterSheets)) {
        state.characterSheets = state.characterSheets.filter(sheet =>
            member.sheetId && String(sheet?.id) === String(member.sheetId));
    }
    if (state.compatibility && typeof state.compatibility === 'object') {
        delete state.compatibility.dnd_app_preferences;
        delete state.compatibility.dnd_saved_encounters;
        delete state.compatibility.dnd_last_combat_report;
        delete state.compatibility.dnd_campaign_preferences;
        delete state.compatibility.inventory;
        delete state.compatibility.abilitiesInventory;
        delete state.compatibility.expandedMagic;
        for (const combatKey of ['dnd_combat_session', 'dnd_players']) {
            if (typeof state.compatibility[combatKey] !== 'string') continue;
            try {
                const parsed = JSON.parse(state.compatibility[combatKey]);
                const list = Array.isArray(parsed) ? parsed : parsed.combatants;
                if (!Array.isArray(list)) continue;
                const projected = list.map(combatant => {
                    if (String(combatant?.id) === String(member.participantId)) return combatant;
                    const visible = { ...combatant };
                    delete visible.inventory;
                    delete visible.abilities;
                    delete visible.learnedSpells;
                    delete visible.professionalSkills;
                    return visible;
                });
                state.compatibility[combatKey] = JSON.stringify(Array.isArray(parsed)
                    ? projected
                    : { ...parsed, combatants: projected });
            } catch {
                delete state.compatibility[combatKey];
            }
        }
        if (typeof state.compatibility.dnd_character_sheets === 'string') {
            try {
                const sheets = JSON.parse(state.compatibility.dnd_character_sheets);
                state.compatibility.dnd_character_sheets = JSON.stringify(sheets.filter(sheet =>
                    member.sheetId && String(sheet?.id) === String(member.sheetId)));
            } catch {
                delete state.compatibility.dnd_character_sheets;
            }
        }
    }
    return safe;
}

function normalizeMember(value = {}) {
    return {
        id: String(value.id || crypto.randomUUID()),
        actorId: String(value.actorId || crypto.randomUUID()),
        deviceId: String(value.deviceId || ''),
        name: String(value.name || 'Participante').slice(0, 80),
        role: value.role === 'master' ? 'master' : 'player',
        participantId: value.participantId ? String(value.participantId) : null,
        sheetId: value.sheetId ? String(value.sheetId) : null,
        tokenHash: String(value.tokenHash || ''),
        revoked: value.revoked === true,
        createdAt: value.createdAt || new Date().toISOString(),
        lastSeenAt: value.lastSeenAt || new Date().toISOString()
    };
}

function publicMember(member) {
    return {
        id: member.id,
        actorId: member.actorId,
        name: member.name,
        role: member.role,
        participantId: member.participantId,
        sheetId: member.sheetId
    };
}

export function applyResourceCommand(campaign, command, member) {
    if (command?.type !== 'participant.resource.adjust') return { applied: false, reason: 'unsupported' };
    if (member.role !== 'master' && String(command.targetId) !== String(member.participantId)) {
        return { applied: false, reason: 'forbidden' };
    }
    const resource = String(command.payload?.resource || '');
    if (!['luckDice', 'adrenaline'].includes(resource)) return { applied: false, reason: 'invalid-resource' };
    const delta = Math.trunc(Number(command.payload?.delta) || 0);
    if (!delta || Math.abs(delta) > 20) return { applied: false, reason: 'invalid-delta' };
    const combatants = campaign?.state?.combat?.combatants;
    const target = Array.isArray(combatants)
        ? combatants.find(entry => String(entry?.id) === String(command.targetId))
        : null;
    if (!target) return { applied: false, reason: 'target-not-found' };
    const before = Math.max(0, Number(target.progression?.[resource]) || 0);
    const after = Math.max(0, before + delta);
    target.progression = { ...(target.progression || {}), [resource]: after };
    const compatibility = campaign?.state?.compatibility;
    if (compatibility && typeof compatibility === 'object') {
        for (const key of ['dnd_combat_session', 'dnd_players']) {
            if (typeof compatibility[key] !== 'string') continue;
            try {
                const parsed = JSON.parse(compatibility[key]);
                const list = Array.isArray(parsed) ? parsed : parsed.combatants;
                const compatibleTarget = Array.isArray(list)
                    ? list.find(entry => String(entry?.id) === String(command.targetId))
                    : null;
                if (!compatibleTarget) continue;
                compatibleTarget.progression = {
                    ...(compatibleTarget.progression || {}),
                    [resource]: after
                };
                compatibility[key] = JSON.stringify(parsed);
            } catch { /* compatibilidade inválida não bloqueia o comando principal */ }
        }
    }
    return { applied: true, before, after };
}

export class CampaignRoom {
    constructor(ctx, env) {
        this.ctx = ctx;
        this.env = env;
        this.room = null;
        this.ready = this.ctx.storage.get(ROOM_KEY).then(stored => { this.room = stored || null; });
    }

    async persist() {
        await this.ctx.storage.put(ROOM_KEY, this.room);
    }

    async fetch(request) {
        await this.ready;
        const url = new URL(request.url);
        try {
            if (request.method === 'POST' && url.pathname.endsWith('/internal/create')) return await this.create(request);
            if (request.method === 'POST' && url.pathname.endsWith('/internal/join')) return await this.join(request);
            if (request.method === 'POST' && url.pathname.endsWith('/internal/ticket')) return await this.issueTicket(request);
            if (request.method === 'GET' && url.pathname.endsWith('/internal/socket')) return await this.openSocket(request);
            if (request.method === 'GET' && url.pathname.endsWith('/internal/status')) return this.status();
            return errorResponse('not_found', 'Rota da sala não encontrada.', 404);
        } catch (error) {
            console.error('Falha ao processar sala de colaboração.', error);
            if (error?.message === 'payload_too_large') return errorResponse('payload_too_large', 'A campanha ultrapassa o limite de 3 MB.', 413);
            if (error instanceof SyntaxError) return errorResponse('invalid_json', 'Os dados enviados são inválidos.', 400);
            return errorResponse('room_error', 'Não foi possível processar a sala.', 500);
        }
    }

    async create(request) {
        if (this.room && !this.room.closedAt) return errorResponse('room_exists', 'Este código de sala já está em uso.', 409);
        const body = await readJson(request);
        const passwordError = validatePassword(body.password);
        const campaign = sanitizeCampaign(body.campaign);
        if (passwordError) return errorResponse('invalid_password', passwordError);
        if (!campaign) return errorResponse('invalid_campaign', 'A campanha enviada é inválida.');

        const salt = randomSecret(18);
        const iterations = normalizePbkdf2Iterations(this.env?.PBKDF2_ITERATIONS);
        const token = randomSecret();
        const master = normalizeMember({
            name: body.actorName || 'Mestre',
            role: 'master',
            deviceId: body.deviceId,
            tokenHash: await sha256(token)
        });
        this.room = {
            version: 1,
            code: normalizeRoomCode(body.roomCode),
            name: String(body.roomName || campaign.metadata?.name || 'Campanha').slice(0, 100),
            passwordSalt: salt,
            passwordVerifier: await derivePassword(String(body.password), salt, iterations),
            passwordIterations: iterations,
            campaign,
            sequence: 1,
            members: { [master.id]: master },
            tickets: {},
            joinAttempts: {},
            seenCommandIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            closedAt: null
        };
        const ticket = await this.createTicket(master.id);
        await this.persist();
        return jsonResponse({
            ok: true,
            room: { code: this.room.code, name: this.room.name, sequence: this.room.sequence },
            member: publicMember(master),
            memberToken: token,
            socketTicket: ticket,
            campaign: projectCampaignForMember(campaign, master)
        }, 201);
    }

    async verifyPassword(password) {
        if (!this.room || this.room.closedAt) return false;
        const verifier = await derivePassword(String(password || ''), this.room.passwordSalt, this.room.passwordIterations);
        return timingSafeEqual(verifier, this.room.passwordVerifier);
    }

    getAvailableParticipants() {
        const claimed = new Set(Object.values(this.room.members || {})
            .filter(member => !member.revoked && member.role === 'player' && member.participantId)
            .map(member => String(member.participantId)));
        return getCampaignParticipants(this.room.campaign).filter(entry => !claimed.has(entry.participantId));
    }

    async join(request) {
        if (!this.room || this.room.closedAt) return errorResponse('room_not_found', 'Sala inexistente ou encerrada.', 404);
        const body = await readJson(request);
        const attemptKey = await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}:${request.headers.get('user-agent') || 'unknown'}`);
        const now = Date.now();
        const attempt = this.room.joinAttempts?.[attemptKey];
        if (attempt && attempt.resetAt > now && attempt.count >= 8) {
            return errorResponse('rate_limited', 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.', 429, {
                retryAfterSeconds: Math.ceil((attempt.resetAt - now) / 1000)
            });
        }
        if (!await this.verifyPassword(body.password)) {
            this.room.joinAttempts ||= {};
            this.room.joinAttempts[attemptKey] = {
                count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1,
                resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + 10 * 60_000
            };
            await this.persist();
            return errorResponse('invalid_credentials', 'Código ou senha incorretos.', 401);
        }
        if (this.room.joinAttempts?.[attemptKey]) delete this.room.joinAttempts[attemptKey];
        const candidates = this.getAvailableParticipants();
        const selected = candidates.find(entry => String(entry.participantId) === String(body.participantId || ''));
        if (!selected) {
            return errorResponse('participant_required', candidates.length
                ? 'Escolha qual personagem será controlado neste dispositivo.'
                : 'Não há personagens disponíveis nesta sala.', 409, { participants: candidates });
        }
        const token = randomSecret();
        const member = normalizeMember({
            name: body.actorName || selected.name,
            role: 'player',
            deviceId: body.deviceId,
            participantId: selected.participantId,
            sheetId: selected.sheetId,
            tokenHash: await sha256(token)
        });
        this.room.members[member.id] = member;
        this.room.updatedAt = new Date().toISOString();
        const ticket = await this.createTicket(member.id);
        await this.persist();
        return jsonResponse({
            ok: true,
            room: { code: this.room.code, name: this.room.name, sequence: this.room.sequence },
            member: publicMember(member),
            memberToken: token,
            socketTicket: ticket,
            campaign: projectCampaignForMember(this.room.campaign, member)
        });
    }

    async authenticate(request) {
        const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
        if (!match) return null;
        const tokenHash = await sha256(match[1]);
        return Object.values(this.room?.members || {}).find(member =>
            !member.revoked && timingSafeEqual(member.tokenHash, tokenHash)) || null;
    }

    pruneTickets() {
        const now = Date.now();
        Object.entries(this.room.tickets || {}).forEach(([hash, ticket]) => {
            if (Number(ticket.expiresAt) <= now) delete this.room.tickets[hash];
        });
    }

    async createTicket(memberId) {
        this.pruneTickets();
        const ticket = randomSecret(24);
        this.room.tickets[await sha256(ticket)] = {
            memberId,
            expiresAt: Date.now() + TICKET_LIFETIME_MS
        };
        return ticket;
    }

    async issueTicket(request) {
        if (!this.room || this.room.closedAt) return errorResponse('room_not_found', 'Sala inexistente ou encerrada.', 404);
        const member = await this.authenticate(request);
        if (!member) return errorResponse('unauthorized', 'Acesso inválido ou revogado.', 401);
        member.lastSeenAt = new Date().toISOString();
        const socketTicket = await this.createTicket(member.id);
        await this.persist();
        return jsonResponse({ ok: true, socketTicket, sequence: this.room.sequence });
    }

    async openSocket(request) {
        if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
            return errorResponse('upgrade_required', 'Esta rota exige conexão WebSocket.', 426);
        }
        if (!this.room || this.room.closedAt) return errorResponse('room_not_found', 'Sala inexistente ou encerrada.', 404);
        this.pruneTickets();
        const rawTicket = new URL(request.url).searchParams.get('ticket') || '';
        const ticketHash = await sha256(rawTicket);
        const ticket = this.room.tickets[ticketHash];
        delete this.room.tickets[ticketHash];
        if (!ticket || ticket.expiresAt <= Date.now()) {
            await this.persist();
            return errorResponse('invalid_ticket', 'O acesso em tempo real expirou.', 401);
        }
        const member = this.room.members[ticket.memberId];
        if (!member || member.revoked) return errorResponse('revoked', 'Este dispositivo não possui acesso.', 403);

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        const attachment = publicMember(member);
        server.serializeAttachment(attachment);
        this.ctx.acceptWebSocket(server);
        server.send(JSON.stringify(this.snapshotEvent(member)));
        await this.persist();
        this.broadcastPresence();
        return new Response(null, { status: 101, webSocket: client });
    }

    snapshotEvent(member) {
        return {
            type: 'room.snapshot',
            sequence: this.room.sequence,
            room: { code: this.room.code, name: this.room.name },
            member: publicMember(member),
            campaign: projectCampaignForMember(this.room.campaign, member),
            presence: this.getPresence()
        };
    }

    getPresence() {
        return this.ctx.getWebSockets().map(socket => socket.deserializeAttachment?.())
            .filter(Boolean).map(publicMember);
    }

    send(socket, payload) {
        try { socket.send(JSON.stringify(payload)); } catch { /* conexão já encerrada */ }
    }

    broadcast(factory, except = null) {
        this.ctx.getWebSockets().forEach(socket => {
            if (socket === except) return;
            const member = socket.deserializeAttachment?.();
            if (!member) return;
            this.send(socket, typeof factory === 'function' ? factory(member) : factory);
        });
    }

    broadcastPresence() {
        const payload = { type: 'room.presence', sequence: this.room.sequence, members: this.getPresence() };
        this.broadcast(payload);
    }

    async webSocketMessage(socket, rawMessage) {
        await this.ready;
        const member = socket.deserializeAttachment?.();
        if (!member || this.room?.members?.[member.id]?.revoked) {
            this.send(socket, { type: 'room.revoked' });
            socket.close(4003, 'Acesso revogado');
            return;
        }
        let message;
        try { message = JSON.parse(typeof rawMessage === 'string' ? rawMessage : new TextDecoder().decode(rawMessage)); }
        catch { this.send(socket, { type: 'command.rejected', reason: 'Mensagem inválida.' }); return; }

        if (message.type === 'ping') { this.send(socket, { type: 'pong', at: Date.now() }); return; }
        if (message.type === 'resync.request') { this.send(socket, this.snapshotEvent(member)); return; }
        if (message.type === 'snapshot.publish') {
            if (member.role !== 'master') { this.send(socket, { type: 'command.rejected', reason: 'Somente o mestre publica a campanha.' }); return; }
            const campaign = sanitizeCampaign(message.campaign);
            if (!campaign || String(campaign.id) !== String(this.room.campaign.id)) {
                this.send(socket, { type: 'command.rejected', reason: 'Snapshot de campanha inválido.' });
                return;
            }
            this.room.campaign = campaign;
            this.room.sequence += 1;
            this.room.updatedAt = new Date().toISOString();
            await this.persist();
            this.broadcast(target => this.snapshotEvent(target));
            return;
        }
        if (message.type === 'command.submit') {
            await this.handleCommand(socket, member, message.command);
            return;
        }
        this.send(socket, { type: 'command.rejected', reason: 'Tipo de mensagem desconhecido.' });
    }

    async handleCommand(socket, member, command) {
        const definition = COMMANDS[String(command?.type || '')];
        if (!command?.id || !definition) {
            this.send(socket, { type: 'command.rejected', commandId: command?.id || null, reason: 'Comando não suportado nesta etapa.' });
            return;
        }
        if (this.room.seenCommandIds.includes(command.id)) {
            this.send(socket, { type: 'command.accepted', commandId: command.id, duplicate: true, sequence: this.room.sequence });
            return;
        }
        if (member.role !== 'master' && definition.player !== 'allow') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Ação não permitida.' });
            return;
        }
        let result = { applied: true };
        if (command.type === 'participant.resource.adjust') {
            result = applyResourceCommand(this.room.campaign, command, member);
            if (!result.applied) {
                this.send(socket, { type: 'command.rejected', commandId: command.id, reason: result.reason });
                return;
            }
        }
        this.room.seenCommandIds.push(command.id);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.room.sequence += 1;
        this.room.campaign.revision = Math.max(0, Number(this.room.campaign.revision) || 0) + 1;
        this.room.campaign.updatedAt = new Date().toISOString();
        this.room.campaign.entityVersions = {
            ...(this.room.campaign.entityVersions || {}),
            [String(command.entityKey || `${command.type}:${command.targetId || 'campaign'}`)]: this.room.campaign.revision
        };
        this.room.updatedAt = new Date().toISOString();
        await this.persist();
        const accepted = { type: 'command.accepted', commandId: command.id, sequence: this.room.sequence, result };
        this.broadcast(accepted);
        if (command.type === 'participant.resource.adjust') {
            this.broadcast(target => this.snapshotEvent(target));
        }
    }

    async webSocketClose(socket, code, reason) {
        try { socket.close(code, reason); } catch { /* fechamento já concluído */ }
        this.broadcastPresence();
    }

    async webSocketError(socket) {
        try { socket.close(1011, 'Erro na conexão'); } catch { /* conexão já encerrada */ }
        this.broadcastPresence();
    }

    status() {
        if (!this.room || this.room.closedAt) return errorResponse('room_not_found', 'Sala inexistente ou encerrada.', 404);
        return jsonResponse({
            ok: true,
            room: { code: this.room.code, name: this.room.name, sequence: this.room.sequence },
            connected: this.getPresence().length
        });
    }
}

function getAllowedOrigin(request, env) {
    const origin = request.headers.get('origin') || '';
    const configured = String(env?.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!origin) return '*';
    if (configured.includes('*') || configured.includes(origin)) return origin;
    return null;
}

function corsHeaders(origin) {
    return {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type,authorization',
        'access-control-max-age': '86400',
        'vary': 'Origin'
    };
}

async function routeToRoom(env, code, request, internalPath) {
    const id = env.CAMPAIGN_ROOMS.idFromName(code);
    const stub = env.CAMPAIGN_ROOMS.get(id);
    const target = new URL(request.url);
    target.pathname = internalPath;
    return stub.fetch(new Request(target, request));
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const allowedOrigin = getAllowedOrigin(request, env);
        if (!allowedOrigin) return errorResponse('origin_denied', 'Origem não autorizada.', 403);
        const headers = corsHeaders(allowedOrigin);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (request.method === 'GET' && url.pathname === '/health') {
            return jsonResponse({ ok: true, service: 'witcher-combat-collaboration', version: 1 }, 200, headers);
        }

        let response;
        try {
            const createMatch = request.method === 'POST' && url.pathname === '/api/rooms';
            const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{6,12})\/(join|ticket|socket|status)$/i);
            if (createMatch) {
                const body = await readJson(request).catch(() => null);
                if (!body) return errorResponse('invalid_json', 'Os dados enviados são inválidos.', 400, {}, headers);
                let lastResponse = null;
                for (let attempt = 0; attempt < 5; attempt++) {
                    const code = createRoomCode();
                    const forwarded = new Request(`${url.origin}/internal/create`, {
                        method: 'POST', headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ ...body, roomCode: code })
                    });
                    lastResponse = await routeToRoom(env, code, forwarded, '/internal/create');
                    if (lastResponse.status !== 409) break;
                }
                response = lastResponse || errorResponse('room_code_failed', 'Não foi possível gerar o código da sala.', 503);
            } else if (roomMatch) {
                const code = normalizeRoomCode(roomMatch[1]);
                const action = roomMatch[2].toLowerCase();
                response = await routeToRoom(env, code, request, `/internal/${action}`);
            } else {
                response = errorResponse('not_found', 'Rota não encontrada.', 404);
            }
        } catch (error) {
            console.error('Falha de comunicação com a sala persistente.', error);
            response = errorResponse(
                'room_unavailable',
                'A sala está temporariamente indisponível. Tente novamente em instantes.',
                503
            );
        }
        if (response.status === 101) return response;
        const outgoing = new Response(response.body, response);
        Object.entries(headers).forEach(([key, value]) => outgoing.headers.set(key, value));
        return outgoing;
    }
};
