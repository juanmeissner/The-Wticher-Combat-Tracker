const ROOM_KEY = 'room';
const ROOM_DIRECTORY_KEY = 'rooms';
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_SEEN_COMMANDS = 500;
const TICKET_LIFETIME_MS = 45_000;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_PBKDF2_ITERATIONS = 100_000;
const MIN_PBKDF2_ITERATIONS = 1_000;
const MAX_PBKDF2_ITERATIONS = 100_000;
const DEFAULT_MASTER_RECONNECT_GRACE_MS = 5 * 60_000;
const DEFAULT_DIRECTORY_HEARTBEAT_MS = 2 * 60_000;
const DEFAULT_DIRECTORY_STALE_MS = 10 * 60_000;

const COMMANDS = Object.freeze({
    'combat.turn.advance': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'combat.target.set': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'combat.damage.apply': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'combat.healing.apply': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'combat.condition.change': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'participant.resource.adjust': { player: 'allow', conflict: 'delta', scope: 'owned-participant' },
    'roll.publish': { player: 'allow', conflict: 'append', scope: 'owned-participant' },
    'combat.message.publish': { player: 'allow', conflict: 'append', scope: 'room-member' },
    'campaign.clock.advance': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'campaign.event.change': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'campaign.preferences.change': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'sheet.update': { player: 'propose', conflict: 'exclusive', scope: 'owned-sheet' },
    'sheet.level-up': { player: 'propose', conflict: 'exclusive', scope: 'owned-sheet' },
    'inventory.change': { player: 'propose', conflict: 'exclusive', scope: 'owned-participant' },
    'equipment.change': { player: 'propose', conflict: 'exclusive', scope: 'owned-participant' },
    'spell.learn': { player: 'propose', conflict: 'exclusive', scope: 'owned-sheet' },
    'transfer.item': { player: 'propose', conflict: 'exclusive', scope: 'owned-participant' },
    'transfer.crowns': { player: 'propose', conflict: 'exclusive', scope: 'owned-participant' },
    'proposal.resolve': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'conflict.resolve': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'room.member.revoke': { player: 'deny', conflict: 'exclusive', scope: 'campaign' },
    'room.close': { player: 'deny', conflict: 'exclusive', scope: 'campaign' }
});

const PROPOSAL_LABELS = Object.freeze({
    'sheet.update': 'Atualização da ficha',
    'sheet.level-up': 'Evolução de nível',
    'inventory.change': 'Alteração de inventário',
    'equipment.change': 'Alteração de equipamento',
    'spell.learn': 'Aprendizado de magia',
    'transfer.item': 'Transferência de item',
    'transfer.crowns': 'Transferência de Coroas'
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

export function validateRequiredName(value, label, maximum) {
    const name = String(value || '').trim();
    if (!name) return `Informe ${label}.`;
    if (name.length > maximum) return `${label} pode ter no máximo ${maximum} caracteres.`;
    return '';
}

export function normalizePbkdf2Iterations(value) {
    const configured = Number(value);
    const iterations = Number.isFinite(configured) && configured > 0
        ? Math.trunc(configured)
        : DEFAULT_PBKDF2_ITERATIONS;
    return Math.min(MAX_PBKDF2_ITERATIONS, Math.max(MIN_PBKDF2_ITERATIONS, iterations));
}

function normalizeDuration(value, fallback, minimum = 30_000, maximum = 24 * 60 * 60_000) {
    const configured = Number(value);
    const duration = Number.isFinite(configured) && configured > 0
        ? Math.trunc(configured)
        : fallback;
    return Math.min(maximum, Math.max(minimum, duration));
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value));
    return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

async function derivePassword(password, salt, iterations = DEFAULT_PBKDF2_ITERATIONS) {
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

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeImportedCharacterSheet(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const sheet = clone(value);
    const name = String(sheet.name || sheet.identity?.name || '').trim().slice(0, 100);
    if (!name) return null;
    const sheetId = `sheet-${crypto.randomUUID()}`;
    sheet.id = sheetId;
    sheet.name = name;
    if (sheet.identity && typeof sheet.identity === 'object') sheet.identity.name = name;
    sheet.hpMax = Math.max(1, Number(sheet.hpMax) || 1);
    sheet.stMax = Math.max(0, Number(sheet.stMax) || 0);
    sheet.hpCurrent = Math.min(sheet.hpMax, Math.max(0, Number(sheet.hpCurrent ?? sheet.hpMax) || 0));
    sheet.stCurrent = Math.min(sheet.stMax, Math.max(0, Number(sheet.stCurrent ?? sheet.stMax) || 0));
    sheet.updatedAt = new Date().toISOString();
    return sheet;
}

function createCombatantFromImportedSheet(sheet) {
    const participantId = `participant-${crypto.randomUUID()}`;
    return {
        ...clone(sheet),
        id: participantId,
        sheetId: sheet.id,
        name: sheet.name,
        initiative: 0,
        hpMax: sheet.hpMax,
        hpCurrent: sheet.hpCurrent,
        stMax: sheet.stMax,
        stCurrent: sheet.stCurrent,
        toxicityCurrent: Math.max(0, Number(sheet.toxicityCurrent) || 0),
        ca: Math.max(0, Number(sheet.ca) || 0),
        movement: Math.max(0, Number(sheet.movement) || 5),
        atkInfo: String(sheet.atkInfo || '-'),
        armor: clone(sheet.armor || { head: 0, torso: 0, arm: 0, leg: 0 }),
        inventory: clone(sheet.inventory || []),
        abilities: clone(sheet.abilities || []),
        equipment: clone(sheet.equipment || {}),
        type: 'player',
        conditions: [],
        effects: [],
        deathSaves: { success: 0, failures: 0 },
        stabilized: false
    };
}

function appendImportedCharacter(campaign, sheet) {
    const state = campaign.state ||= {};
    const combat = state.combat ||= {};
    const combatants = Array.isArray(combat.combatants) ? combat.combatants : (combat.combatants = []);
    const sheets = Array.isArray(state.characterSheets) ? state.characterSheets : (state.characterSheets = []);
    const combatant = createCombatantFromImportedSheet(sheet);
    sheets.push(clone(sheet));
    combatants.push(combatant);
    if (!combat.activeTurnId) combat.activeTurnId = combatant.id;

    const compatibility = state.compatibility ||= {};
    for (const key of ['dnd_combat_session', 'dnd_players']) {
        try {
            const parsed = typeof compatibility[key] === 'string' ? JSON.parse(compatibility[key]) : [];
            const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.combatants) ? parsed.combatants : []);
            list.push(clone(combatant));
            compatibility[key] = JSON.stringify(Array.isArray(parsed) ? list : { ...parsed, combatants: list });
        } catch {
            compatibility[key] = JSON.stringify([clone(combatant)]);
        }
    }
    try {
        const parsedSheets = typeof compatibility.dnd_character_sheets === 'string'
            ? JSON.parse(compatibility.dnd_character_sheets)
            : [];
        const list = Array.isArray(parsedSheets) ? parsedSheets : [];
        list.push(clone(sheet));
        compatibility.dnd_character_sheets = JSON.stringify(list);
    } catch {
        compatibility.dnd_character_sheets = JSON.stringify([clone(sheet)]);
    }
    return combatant;
}

function commandOwnedByMember(command, member, definition) {
    if (member?.role === 'master' || definition?.scope === 'room-member') return true;
    if (definition?.scope === 'owned-participant') {
        return String(command?.targetId || '') === String(member?.participantId || '');
    }
    if (definition?.scope === 'owned-sheet') {
        return String(command?.targetId || '') === String(member?.sheetId || '');
    }
    return false;
}

function replaceById(list, id, nextValue) {
    if (!Array.isArray(list) || !nextValue || String(nextValue.id || '') !== String(id || '')) return false;
    const index = list.findIndex(entry => String(entry?.id || '') === String(id || ''));
    if (index < 0) return false;
    list[index] = clone(nextValue);
    return true;
}

function replaceCompatibilityEntity(campaign, keys, id, nextValue) {
    const compatibility = campaign?.state?.compatibility;
    if (!compatibility || typeof compatibility !== 'object') return;
    keys.forEach(key => {
        if (typeof compatibility[key] !== 'string') return;
        try {
            const parsed = JSON.parse(compatibility[key]);
            const list = Array.isArray(parsed) ? parsed : parsed?.combatants;
            if (!replaceById(list, id, nextValue)) return;
            compatibility[key] = JSON.stringify(parsed);
        } catch { /* compatibilidade inválida não impede a atualização principal */ }
    });
}

export function applyPermanentCommand(campaign, command) {
    const replacementCampaign = sanitizeCampaign(command?.payload?.campaign);
    if (replacementCampaign && String(replacementCampaign.id) === String(campaign?.id)) {
        Object.keys(campaign).forEach(key => delete campaign[key]);
        Object.assign(campaign, replacementCampaign);
        return { applied: true, mode: 'campaign' };
    }

    if (['sheet.update', 'sheet.level-up', 'spell.learn'].includes(command?.type)) {
        const sheet = command?.payload?.sheet;
        if (!replaceById(campaign?.state?.characterSheets, command.targetId, sheet)) {
            return { applied: false, reason: 'sheet-not-found' };
        }
        replaceCompatibilityEntity(campaign, ['dnd_character_sheets'], command.targetId, sheet);
        return { applied: true, mode: 'sheet' };
    }

    if (['inventory.change', 'equipment.change'].includes(command?.type)) {
        const combatant = command?.payload?.combatant;
        if (!replaceById(campaign?.state?.combat?.combatants, command.targetId, combatant)) {
            return { applied: false, reason: 'participant-not-found' };
        }
        replaceCompatibilityEntity(campaign, ['dnd_combat_session', 'dnd_players'], command.targetId, combatant);
        return { applied: true, mode: 'participant' };
    }

    return { applied: false, reason: 'unsupported-payload' };
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

export class RoomDirectory {
    constructor(ctx, env = {}) {
        this.ctx = ctx;
        this.env = env;
    }

    async fetch(request) {
        const url = new URL(request.url);
        const rooms = await this.ctx.storage.get(ROOM_DIRECTORY_KEY) || {};
        if (request.method === 'GET' && url.pathname.endsWith('/internal/list')) {
            const staleAfter = normalizeDuration(
                this.env?.DIRECTORY_STALE_MS,
                DEFAULT_DIRECTORY_STALE_MS,
                60_000,
                60 * 60_000
            );
            const cutoff = Date.now() - staleAfter;
            let changed = false;
            Object.entries(rooms).forEach(([code, room]) => {
                const lastHeartbeat = Date.parse(room?.directoryHeartbeatAt || room?.updatedAt || room?.createdAt || 0);
                if (
                    room?.discoverable === false
                    || room?.closedAt
                    || room?.masterOnline !== true
                    || !Number.isFinite(lastHeartbeat)
                    || lastHeartbeat < cutoff
                ) {
                    delete rooms[code];
                    changed = true;
                }
            });
            if (changed) await this.ctx.storage.put(ROOM_DIRECTORY_KEY, rooms);
            const visible = Object.values(rooms)
                .filter(room => room?.discoverable !== false && !room?.closedAt && room?.masterOnline === true)
                .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
                .slice(0, 100)
                .map(room => ({
                    code: room.code,
                    name: room.name,
                    connected: Math.max(0, Number(room.connected) || 0),
                    availableCharacters: Math.max(0, Number(room.availableCharacters) || 0),
                    createdAt: room.createdAt,
                    updatedAt: room.updatedAt
                }));
            return jsonResponse({ ok: true, rooms: visible });
        }
        if (request.method === 'POST' && url.pathname.endsWith('/internal/upsert')) {
            const body = await readJson(request);
            const code = normalizeRoomCode(body.code);
            if (!code || !String(body.name || '').trim()) return errorResponse('invalid_room', 'Sala inválida.');
            if (body.closedAt || body.discoverable === false || body.masterOnline !== true) delete rooms[code];
            else rooms[code] = {
                code,
                name: String(body.name).slice(0, 100),
                connected: Math.max(0, Number(body.connected) || 0),
                availableCharacters: Math.max(0, Number(body.availableCharacters) || 0),
                discoverable: true,
                masterOnline: true,
                createdAt: body.createdAt || new Date().toISOString(),
                updatedAt: body.updatedAt || new Date().toISOString(),
                directoryHeartbeatAt: body.directoryHeartbeatAt || new Date().toISOString(),
                closedAt: null
            };
            await this.ctx.storage.put(ROOM_DIRECTORY_KEY, rooms);
            return jsonResponse({ ok: true });
        }
        return errorResponse('not_found', 'Rota do diretório não encontrada.', 404);
    }
}

export class CampaignRoom {
    constructor(ctx, env) {
        this.ctx = ctx;
        this.env = env || {};
        this.room = null;
        this.ready = this.ctx.storage.get(ROOM_KEY).then(stored => { this.room = stored || null; });
    }

    async persist() {
        await this.ctx.storage.put(ROOM_KEY, this.room);
    }

    appendAccessLog(action, member = null, detail = {}) {
        if (!this.room) return;
        this.room.accessLog ||= [];
        this.room.accessLog.push({
            id: `access-${crypto.randomUUID()}`,
            action: String(action || 'room.activity'),
            memberId: member?.id || null,
            memberName: member?.name || null,
            role: member?.role || null,
            detail: clone(detail),
            createdAt: new Date().toISOString()
        });
        this.room.accessLog = this.room.accessLog.slice(-200);
    }

    async syncDirectory(options = {}) {
        if (!this.room || !this.env?.ROOM_DIRECTORY) return;
        try {
            const presence = Array.isArray(options.presence)
                ? options.presence
                : this.getPresence(options.excludeSocket || null);
            const masterOnline = presence.some(member => member?.role === 'master');
            const directoryHeartbeatAt = new Date().toISOString();
            const id = this.env.ROOM_DIRECTORY.idFromName('public-room-directory-v1');
            const stub = this.env.ROOM_DIRECTORY.get(id);
            await stub.fetch('https://directory.internal/internal/upsert', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    code: this.room.code,
                    name: this.room.name,
                    connected: presence.length,
                    availableCharacters: this.getAvailableParticipants().length,
                    discoverable: this.room.discoverable !== false,
                    masterOnline,
                    createdAt: this.room.createdAt,
                    updatedAt: directoryHeartbeatAt,
                    directoryHeartbeatAt,
                    closedAt: this.room.closedAt
                })
            });
        } catch (error) {
            console.warn('Não foi possível atualizar o diretório público de salas.', error?.message || error);
        }
    }

    ensureWorkflowState() {
        if (!this.room) return;
        this.room.proposals ||= {};
        this.room.proposalOrder ||= [];
        this.room.decisions ||= [];
        this.room.conflicts ||= {};
        this.room.conflictOrder ||= [];
        this.room.activity ||= [];
        this.room.accessLog ||= [];
        if (this.room.discoverable === undefined) this.room.discoverable = true;
    }

    getMasterReconnectGraceMs() {
        return normalizeDuration(
            this.env?.MASTER_RECONNECT_GRACE_MS,
            DEFAULT_MASTER_RECONNECT_GRACE_MS,
            30_000,
            60 * 60_000
        );
    }

    getDirectoryHeartbeatMs() {
        return normalizeDuration(
            this.env?.DIRECTORY_HEARTBEAT_MS,
            DEFAULT_DIRECTORY_HEARTBEAT_MS,
            30_000,
            10 * 60_000
        );
    }

    async setRoomAlarm(timestamp) {
        if (typeof this.ctx.storage.setAlarm !== 'function') return;
        await this.ctx.storage.setAlarm(timestamp);
    }

    async clearRoomAlarm() {
        if (typeof this.ctx.storage.deleteAlarm !== 'function') return;
        await this.ctx.storage.deleteAlarm();
    }

    async markMasterOnline() {
        if (!this.room || this.room.closedAt) return;
        const now = new Date().toISOString();
        this.room.lastMasterSeenAt = now;
        this.room.masterDisconnectedAt = null;
        this.room.autoCloseAt = null;
        await this.setRoomAlarm(Date.now() + this.getDirectoryHeartbeatMs());
    }

    async markMasterOffline(excludeSocket = null) {
        if (!this.room || this.room.closedAt || this.hasConnectedMaster(excludeSocket)) return false;
        const now = Date.now();
        this.room.masterDisconnectedAt ||= new Date(now).toISOString();
        this.room.autoCloseAt ||= new Date(now + this.getMasterReconnectGraceMs()).toISOString();
        await this.setRoomAlarm(Date.parse(this.room.autoCloseAt));
        return true;
    }

    async fetch(request) {
        await this.ready;
        this.ensureWorkflowState();
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
        const masterNameError = validateRequiredName(body.actorName, 'o nome do Mestre', 80);
        const roomNameError = validateRequiredName(body.roomName, 'o nome da sala', 100);
        const campaign = sanitizeCampaign(body.campaign);
        if (masterNameError) return errorResponse('invalid_master_name', masterNameError);
        if (roomNameError) return errorResponse('invalid_room_name', roomNameError);
        if (passwordError) return errorResponse('invalid_password', passwordError);
        if (!campaign) return errorResponse('invalid_campaign', 'A campanha enviada é inválida.');

        const salt = randomSecret(18);
        const iterations = normalizePbkdf2Iterations(this.env?.PBKDF2_ITERATIONS);
        const token = randomSecret();
        const master = normalizeMember({
            name: String(body.actorName).trim(),
            role: 'master',
            deviceId: body.deviceId,
            tokenHash: await sha256(token)
        });
        this.room = {
            version: 1,
            code: normalizeRoomCode(body.roomCode),
            name: String(body.roomName).trim(),
            passwordSalt: salt,
            passwordVerifier: await derivePassword(String(body.password), salt, iterations),
            passwordIterations: iterations,
            campaign,
            sequence: 1,
            members: { [master.id]: master },
            tickets: {},
            joinAttempts: {},
            seenCommandIds: [],
            proposals: {},
            proposalOrder: [],
            decisions: [],
            conflicts: {},
            conflictOrder: [],
            activity: [],
            accessLog: [],
            discoverable: body.discoverable !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMasterSeenAt: null,
            masterDisconnectedAt: new Date().toISOString(),
            autoCloseAt: new Date(Date.now() + this.getMasterReconnectGraceMs()).toISOString(),
            closedAt: null
        };
        const ticket = await this.createTicket(master.id);
        this.appendAccessLog('room.created', master);
        await this.persist();
        await this.syncDirectory();
        await this.setRoomAlarm(Date.parse(this.room.autoCloseAt));
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
        let selected = candidates.find(entry => String(entry.participantId) === String(body.participantId || ''));
        let imported = null;
        if (!selected && body.characterSheet) {
            const totalPlayers = getCampaignParticipants(this.room.campaign).length;
            if (totalPlayers >= 30) return errorResponse('room_full', 'A sala atingiu o limite de 30 personagens.', 409);
            const sheet = normalizeImportedCharacterSheet(body.characterSheet);
            if (!sheet) return errorResponse('invalid_character_sheet', 'A ficha enviada é inválida.', 400);
            imported = appendImportedCharacter(this.room.campaign, sheet);
            selected = { participantId: imported.id, sheetId: sheet.id, name: sheet.name };
            this.room.sequence += 1;
            this.room.campaign.revision = Math.max(0, Number(this.room.campaign.revision) || 0) + 1;
            this.room.campaign.updatedAt = new Date().toISOString();
        }
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
        this.appendAccessLog(imported ? 'member.joined-with-character' : 'member.joined', member, {
            participantId: selected.participantId
        });
        const ticket = await this.createTicket(member.id);
        await this.persist();
        await this.syncDirectory();
        if (imported) this.broadcast(target => this.snapshotEvent(target));
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
        member.lastSeenAt = new Date().toISOString();
        if (member.role === 'master') await this.markMasterOnline();
        this.appendAccessLog('member.connected', member);
        server.send(JSON.stringify(this.snapshotEvent(member)));
        await this.persist();
        this.broadcastPresence();
        await this.syncDirectory();
        return new Response(null, { status: 101, webSocket: client });
    }

    snapshotEvent(member) {
        return {
            type: 'room.snapshot',
            sequence: this.room.sequence,
            room: { code: this.room.code, name: this.room.name },
            member: publicMember(member),
            campaign: projectCampaignForMember(this.room.campaign, member),
            presence: this.getPresence(),
            workflow: this.getWorkflowForMember(member)
        };
    }

    getWorkflowForMember(member) {
        this.ensureWorkflowState();
        const canSee = entry => member?.role === 'master'
            || String(entry?.memberId || '') === String(member?.id || '');
        const proposals = this.room.proposalOrder
            .map(id => this.room.proposals[id])
            .filter(entry => entry && canSee(entry))
            .slice(-100)
            .map(clone);
        const conflicts = this.room.conflictOrder
            .map(id => this.room.conflicts[id])
            .filter(entry => entry && canSee(entry))
            .slice(-100)
            .map(clone);
        const decisions = this.room.decisions.filter(canSee).slice(-100).map(clone);
        return {
            proposals,
            conflicts,
            decisions,
            activity: this.room.activity.slice(-80).map(clone),
            accessLog: member?.role === 'master' ? this.room.accessLog.slice(-80).map(clone) : [],
            members: member?.role === 'master'
                ? Object.values(this.room.members || {}).map(entry => ({
                    ...publicMember(entry),
                    revoked: entry.revoked === true,
                    createdAt: entry.createdAt,
                    lastSeenAt: entry.lastSeenAt
                }))
                : []
        };
    }

    getPresence(excludeSocket = null) {
        return this.ctx.getWebSockets().filter(socket => socket !== excludeSocket)
            .map(socket => socket.deserializeAttachment?.())
            .filter(Boolean).map(publicMember);
    }

    hasConnectedMaster(excludeSocket = null) {
        return this.getPresence(excludeSocket).some(member => member?.role === 'master');
    }

    send(socket, payload) {
        try { socket.send(JSON.stringify(payload)); } catch { /* conexão já encerrada */ }
    }

    broadcast(factory, except = null) {
        this.ctx.getWebSockets().forEach(socket => {
            if (socket === except) return;
            const member = socket.deserializeAttachment?.();
            if (!member) return;
            const payload = typeof factory === 'function' ? factory(member) : factory;
            if (payload !== null && payload !== undefined) this.send(socket, payload);
        });
    }

    broadcastPresence(excludeSocket = null) {
        const payload = {
            type: 'room.presence',
            sequence: this.room.sequence,
            members: this.getPresence(excludeSocket)
        };
        this.broadcast(payload, excludeSocket);
    }

    async webSocketMessage(socket, rawMessage) {
        await this.ready;
        this.ensureWorkflowState();
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
            await this.syncDirectory();
            this.send(socket, { type: 'snapshot.accepted', sequence: this.room.sequence });
            this.broadcast(target => this.snapshotEvent(target), socket);
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
        if (String(command.campaignId || '') !== String(this.room.campaign.id)) {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Campanha incompatível.' });
            return;
        }
        if (!commandOwnedByMember(command, member, definition)) {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'O participante não controla este alvo.' });
            return;
        }
        if (member.role !== 'master' && definition.player === 'propose') {
            await this.createProposal(socket, member, command);
            return;
        }
        if (member.role !== 'master' && definition.player !== 'allow') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Ação não permitida.' });
            return;
        }
        if (command.type === 'proposal.resolve') {
            await this.resolveProposal(socket, member, command);
            return;
        }
        if (command.type === 'conflict.resolve') {
            await this.resolveConflict(socket, member, command);
            return;
        }
        if (command.type === 'room.member.revoke') {
            await this.revokeMember(socket, member, command);
            return;
        }
        if (command.type === 'room.close') {
            await this.closeRoom(socket, member, command);
            return;
        }
        const entityKey = String(command.entityKey || `${command.type}:${command.targetId || 'campaign'}`);
        const currentEntityVersion = Math.max(0, Number(this.room.campaign.entityVersions?.[entityKey]) || 0);
        if (definition.conflict === 'exclusive' && Number(command.baseVersion || 0) !== currentEntityVersion) {
            await this.createConflict(socket, member, command, { currentEntityVersion });
            return;
        }
        let result = { applied: true };
        if (command.type === 'participant.resource.adjust') {
            result = applyResourceCommand(this.room.campaign, command, member);
            if (!result.applied) {
                this.send(socket, { type: 'command.rejected', commandId: command.id, reason: result.reason });
                return;
            }
        } else if (['roll.publish', 'combat.message.publish'].includes(command.type)) {
            let resourceChanged = false;
            if (command.type === 'roll.publish' && member.participantId) {
                const target = this.room.campaign?.state?.combat?.combatants?.find(entry =>
                    String(entry?.id || '') === String(member.participantId));
                if (target) {
                    const luckDelta = Math.min(1, Math.max(0, Math.trunc(Number(command.payload?.luckDiceGained) || 0)));
                    const adrenalineDelta = Math.min(3, Math.max(0, Math.trunc(Number(command.payload?.adrenalineGained) || 0)));
                    if (luckDelta || adrenalineDelta) {
                        target.progression = {
                            ...(target.progression || {}),
                            luckDice: Math.max(0, Number(target.progression?.luckDice) || 0) + luckDelta,
                            adrenaline: Math.max(0, Number(target.progression?.adrenaline) || 0) + adrenalineDelta
                        };
                        replaceCompatibilityEntity(this.room.campaign, ['dnd_combat_session', 'dnd_players'], target.id, target);
                        resourceChanged = true;
                    }
                }
            }
            const activity = {
                id: command.id,
                type: command.type,
                memberId: member.id,
                memberName: member.name,
                participantId: member.participantId,
                payload: clone(command.payload),
                createdAt: new Date().toISOString()
            };
            this.room.activity.push(activity);
            this.room.activity = this.room.activity.slice(-200);
            result = { applied: true, activity, resourceChanged };
        } else if (PROPOSAL_LABELS[command.type]) {
            result = applyPermanentCommand(this.room.campaign, command);
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
        await this.syncDirectory();
        const accepted = { type: 'command.accepted', commandId: command.id, sequence: this.room.sequence, result };
        this.broadcast(accepted);
        if (command.type === 'participant.resource.adjust' || PROPOSAL_LABELS[command.type]) {
            this.broadcast(target => this.snapshotEvent(target));
        } else if (result.activity) {
            this.broadcast({ type: 'activity.created', sequence: this.room.sequence, activity: result.activity });
            if (result.resourceChanged) this.broadcast(target => this.snapshotEvent(target));
        }
    }

    async revokeMember(socket, member, command) {
        if (member.role !== 'master') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Somente o mestre remove participantes.' });
            return;
        }
        const targetId = String(command.payload?.memberId || command.targetId || '');
        const target = this.room.members?.[targetId];
        if (!target || target.role === 'master') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Participante inválido.' });
            return;
        }
        target.revoked = true;
        target.revokedAt = new Date().toISOString();
        target.revokedBy = member.id;
        this.room.seenCommandIds.push(command.id);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.room.sequence += 1;
        this.room.updatedAt = new Date().toISOString();
        this.appendAccessLog('member.revoked', target, { revokedBy: member.name });
        await this.persist();
        this.send(socket, { type: 'command.accepted', commandId: command.id, sequence: this.room.sequence });
        this.ctx.getWebSockets().forEach(targetSocket => {
            const attached = targetSocket.deserializeAttachment?.();
            if (String(attached?.id || '') !== targetId) return;
            this.send(targetSocket, { type: 'room.revoked', sequence: this.room.sequence });
            try { targetSocket.close(4003, 'Acesso revogado'); } catch { /* conexão já fechada */ }
        });
        this.broadcastPresence();
        this.broadcast(targetMember => this.snapshotEvent(targetMember));
        await this.syncDirectory();
    }

    async closeRoom(socket, member, command) {
        if (member.role !== 'master') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Somente o mestre encerra a sala.' });
            return;
        }
        this.room.closedAt = new Date().toISOString();
        this.room.updatedAt = this.room.closedAt;
        this.room.sequence += 1;
        this.room.seenCommandIds.push(command.id);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.appendAccessLog('room.closed', member);
        await this.persist();
        await this.syncDirectory();
        await this.clearRoomAlarm();
        this.send(socket, { type: 'command.accepted', commandId: command.id, sequence: this.room.sequence });
        this.broadcast({ type: 'room.closed', sequence: this.room.sequence });
        this.ctx.getWebSockets().forEach(targetSocket => {
            try { targetSocket.close(4004, 'Sala encerrada'); } catch { /* conexão já fechada */ }
        });
    }

    async createProposal(socket, member, command) {
        const proposal = {
            id: `proposal-${crypto.randomUUID()}`,
            label: PROPOSAL_LABELS[command.type] || command.type,
            status: 'pending',
            memberId: member.id,
            memberName: member.name,
            participantId: member.participantId,
            sheetId: member.sheetId,
            command: clone({ ...command, actorId: member.actorId, role: member.role }),
            createdAt: new Date().toISOString(),
            resolvedAt: null
        };
        this.room.proposals[proposal.id] = proposal;
        this.room.proposalOrder.push(proposal.id);
        this.room.seenCommandIds.push(command.id);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.room.sequence += 1;
        this.room.updatedAt = new Date().toISOString();
        await this.persist();
        this.broadcast(target => target.role === 'master' || target.id === member.id
            ? { type: 'proposal.created', sequence: this.room.sequence, proposal: clone(proposal) }
            : null);
        this.send(socket, { type: 'command.accepted', commandId: command.id, proposed: true, proposalId: proposal.id, sequence: this.room.sequence });
    }

    async resolveProposal(socket, member, command) {
        if (member.role !== 'master') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Somente o mestre resolve propostas.' });
            return;
        }
        const proposal = this.room.proposals[String(command.payload?.proposalId || '')];
        if (!proposal || proposal.status !== 'pending') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Proposta inexistente ou já resolvida.' });
            return;
        }
        const decision = command.payload?.decision === 'approved' ? 'approved' : 'rejected';
        let result = { applied: false, reason: 'rejected' };
        if (decision === 'approved') {
            const approvedCommand = clone(proposal.command);
            if (command.payload?.adjustedPayload && typeof command.payload.adjustedPayload === 'object') {
                approvedCommand.payload = clone(command.payload.adjustedPayload);
            }
            const entityKey = String(approvedCommand.entityKey || `${approvedCommand.type}:${approvedCommand.targetId || 'campaign'}`);
            const currentEntityVersion = Math.max(0, Number(this.room.campaign.entityVersions?.[entityKey]) || 0);
            if (Number(approvedCommand.baseVersion || 0) !== currentEntityVersion) {
                proposal.status = 'conflict';
                proposal.resolvedAt = new Date().toISOString();
                await this.createConflict(socket, proposal, approvedCommand, {
                    currentEntityVersion,
                    proposalId: proposal.id,
                    memberId: proposal.memberId,
                    memberName: proposal.memberName,
                    ackCommandId: command.id
                });
                return;
            }
            result = applyPermanentCommand(this.room.campaign, approvedCommand);
            if (!result.applied) {
                this.send(socket, { type: 'command.rejected', commandId: command.id, reason: result.reason });
                return;
            }
            this.room.campaign.revision = Math.max(0, Number(this.room.campaign.revision) || 0) + 1;
            this.room.campaign.updatedAt = new Date().toISOString();
            this.room.campaign.entityVersions = {
                ...(this.room.campaign.entityVersions || {}),
                [String(approvedCommand.entityKey || `${approvedCommand.type}:${approvedCommand.targetId || 'campaign'}`)]: this.room.campaign.revision
            };
        }
        proposal.status = decision;
        proposal.resolvedAt = new Date().toISOString();
        proposal.resolvedBy = member.id;
        proposal.note = String(command.payload?.note || '').slice(0, 500);
        const record = {
            id: `decision-${crypto.randomUUID()}`,
            proposalId: proposal.id,
            memberId: proposal.memberId,
            memberName: proposal.memberName,
            decision,
            label: proposal.label,
            note: proposal.note,
            decidedBy: member.name,
            createdAt: proposal.resolvedAt
        };
        this.room.decisions.push(record);
        this.room.decisions = this.room.decisions.slice(-200);
        this.room.seenCommandIds.push(command.id);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.room.sequence += 1;
        this.room.updatedAt = new Date().toISOString();
        await this.persist();
        this.broadcast({ type: 'proposal.resolved', sequence: this.room.sequence, proposal: clone(proposal), decision: record });
        this.broadcast(target => this.snapshotEvent(target));
        this.send(socket, { type: 'command.accepted', commandId: command.id, sequence: this.room.sequence, result });
    }

    async createConflict(socket, member, command, options = {}) {
        const acknowledgedCommandId = String(options.ackCommandId || command.id);
        const conflict = {
            id: `conflict-${crypto.randomUUID()}`,
            label: PROPOSAL_LABELS[command.type] || command.type || 'Alteração simultânea',
            status: 'pending',
            memberId: options.memberId || member.id,
            memberName: options.memberName || member.name,
            proposalId: options.proposalId || null,
            entityKey: String(command.entityKey || `${command.type}:${command.targetId || 'campaign'}`),
            expectedVersion: Math.max(0, Number(command.baseVersion) || 0),
            currentVersion: Math.max(0, Number(options.currentEntityVersion) || 0),
            incomingCommand: clone(command),
            createdAt: new Date().toISOString(),
            resolvedAt: null
        };
        this.room.conflicts[conflict.id] = conflict;
        this.room.conflictOrder.push(conflict.id);
        this.room.seenCommandIds.push(acknowledgedCommandId);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.room.sequence += 1;
        this.room.updatedAt = new Date().toISOString();
        await this.persist();
        this.broadcast(target => target.role === 'master' || target.id === conflict.memberId
            ? { type: 'conflict.created', sequence: this.room.sequence, conflict: clone(conflict) }
            : null);
        this.send(socket, { type: 'command.accepted', commandId: acknowledgedCommandId, conflict: true, conflictId: conflict.id, sequence: this.room.sequence });
    }

    async resolveConflict(socket, member, command) {
        if (member.role !== 'master') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Somente o mestre resolve conflitos.' });
            return;
        }
        const conflict = this.room.conflicts[String(command.payload?.conflictId || '')];
        if (!conflict || conflict.status !== 'pending') {
            this.send(socket, { type: 'command.rejected', commandId: command.id, reason: 'Conflito inexistente ou já resolvido.' });
            return;
        }
        const resolution = command.payload?.resolution === 'incoming' ? 'incoming' : 'current';
        let result = { applied: false, mode: 'current-preserved' };
        if (resolution === 'incoming') {
            result = applyPermanentCommand(this.room.campaign, conflict.incomingCommand);
            if (!result.applied) {
                this.send(socket, { type: 'command.rejected', commandId: command.id, reason: result.reason });
                return;
            }
            this.room.campaign.revision = Math.max(0, Number(this.room.campaign.revision) || 0) + 1;
            this.room.campaign.updatedAt = new Date().toISOString();
            this.room.campaign.entityVersions = {
                ...(this.room.campaign.entityVersions || {}),
                [conflict.entityKey]: this.room.campaign.revision
            };
        }
        conflict.status = 'resolved';
        conflict.resolution = resolution;
        conflict.resolvedAt = new Date().toISOString();
        conflict.resolvedBy = member.id;
        const proposal = conflict.proposalId ? this.room.proposals[conflict.proposalId] : null;
        if (proposal) {
            proposal.status = resolution === 'incoming' ? 'approved' : 'rejected';
            proposal.resolvedAt = conflict.resolvedAt;
            proposal.resolvedBy = member.id;
        }
        const record = {
            id: `decision-${crypto.randomUUID()}`,
            proposalId: conflict.proposalId,
            conflictId: conflict.id,
            memberId: conflict.memberId,
            memberName: conflict.memberName,
            decision: resolution === 'incoming' ? 'approved' : 'rejected',
            label: conflict.label,
            note: resolution === 'incoming' ? 'Versão recebida preservada.' : 'Versão atual preservada.',
            decidedBy: member.name,
            createdAt: conflict.resolvedAt
        };
        this.room.decisions.push(record);
        this.room.decisions = this.room.decisions.slice(-200);
        this.room.seenCommandIds.push(command.id);
        this.room.seenCommandIds = this.room.seenCommandIds.slice(-MAX_SEEN_COMMANDS);
        this.room.sequence += 1;
        this.room.updatedAt = new Date().toISOString();
        await this.persist();
        this.broadcast({ type: 'conflict.resolved', sequence: this.room.sequence, conflict: clone(conflict), proposal: clone(proposal), decision: record });
        this.broadcast(target => this.snapshotEvent(target));
        this.send(socket, { type: 'command.accepted', commandId: command.id, sequence: this.room.sequence, result });
    }

    async webSocketClose(socket, code, reason) {
        const member = socket.deserializeAttachment?.();
        try { socket.close(code, reason); } catch { /* fechamento já concluído */ }
        const presence = this.getPresence(socket);
        if (member?.role === 'master' && await this.markMasterOffline(socket)) {
            this.appendAccessLog('master.disconnected', member, { reconnectUntil: this.room.autoCloseAt });
            await this.persist();
            this.broadcast({
                type: 'room.master-offline',
                reconnectUntil: this.room.autoCloseAt
            }, socket);
        }
        this.broadcastPresence(socket);
        await this.syncDirectory({ presence });
    }

    async webSocketError(socket) {
        await this.webSocketClose(socket, 1011, 'Erro na conexão');
    }

    async alarm() {
        await this.ready;
        this.ensureWorkflowState();
        if (!this.room) return;
        if (this.room.closedAt) {
            await this.syncDirectory();
            await this.clearRoomAlarm();
            return;
        }

        if (this.hasConnectedMaster()) {
            await this.markMasterOnline();
            await this.persist();
            await this.syncDirectory();
            return;
        }

        await this.markMasterOffline();
        const deadline = Date.parse(this.room.autoCloseAt || 0);
        if (Number.isFinite(deadline) && deadline > Date.now()) {
            await this.persist();
            await this.syncDirectory();
            await this.setRoomAlarm(deadline);
            return;
        }

        const closedAt = new Date().toISOString();
        this.room.closedAt = closedAt;
        this.room.updatedAt = closedAt;
        this.room.closeReason = 'master_timeout';
        this.room.sequence += 1;
        this.appendAccessLog('room.auto-closed', null, {
            reason: 'master_timeout',
            masterDisconnectedAt: this.room.masterDisconnectedAt
        });
        await this.persist();
        await this.syncDirectory();
        this.broadcast({
            type: 'room.closed',
            sequence: this.room.sequence,
            reason: 'master_timeout'
        });
        this.ctx.getWebSockets().forEach(targetSocket => {
            try { targetSocket.close(4004, 'Sala encerrada por inatividade do Mestre'); } catch { /* conexão já fechada */ }
        });
        await this.clearRoomAlarm();
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

async function routeToDirectory(env, request, internalPath) {
    if (!env.ROOM_DIRECTORY) return jsonResponse({ ok: true, rooms: [] });
    const id = env.ROOM_DIRECTORY.idFromName('public-room-directory-v1');
    const stub = env.ROOM_DIRECTORY.get(id);
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
            const listMatch = request.method === 'GET' && url.pathname === '/api/rooms';
            const createMatch = request.method === 'POST' && url.pathname === '/api/rooms';
            const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{6,12})\/(join|ticket|socket|status)$/i);
            if (listMatch) {
                response = await routeToDirectory(env, request, '/internal/list');
            } else if (createMatch) {
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
