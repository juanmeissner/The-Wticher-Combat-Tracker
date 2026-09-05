(function (root, factory) {
    const api = factory();

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.collaborationProtocol = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const PROTOCOL_VERSION = 1;
    const CAMPAIGN_SCHEMA_VERSION = 1;

    const ROLES = Object.freeze({
        MASTER: 'master',
        PLAYER: 'player',
        SPECTATOR: 'spectator'
    });

    const DECISIONS = Object.freeze({
        ALLOW: 'allow',
        PROPOSE: 'propose',
        DENY: 'deny'
    });

    const CONFLICT_RESULTS = Object.freeze({
        DUPLICATE: 'duplicate',
        CLEAN: 'clean',
        MERGE: 'merge',
        MASTER_DECISION: 'master-decision'
    });

    const define = (scope, options = {}) => Object.freeze({
        scope,
        player: options.player || DECISIONS.DENY,
        spectator: options.spectator || DECISIONS.DENY,
        conflict: options.conflict || 'exclusive'
    });

    const COMMANDS = Object.freeze({
        'combat.turn.advance': define('campaign'),
        'combat.target.set': define('campaign'),
        'combat.damage.apply': define('campaign'),
        'combat.healing.apply': define('campaign'),
        'combat.condition.change': define('campaign'),
        'participant.resource.adjust': define('owned-participant', {
            player: DECISIONS.ALLOW,
            conflict: 'delta'
        }),
        'roll.publish': define('owned-participant', {
            player: DECISIONS.ALLOW,
            conflict: 'append'
        }),
        'combat.message.publish': define('room-member', {
            player: DECISIONS.ALLOW,
            conflict: 'append'
        }),
        'campaign.clock.advance': define('campaign'),
        'campaign.event.change': define('campaign'),
        'campaign.preferences.change': define('campaign'),
        'sheet.update': define('owned-sheet', { player: DECISIONS.PROPOSE }),
        'sheet.level-up': define('owned-sheet', { player: DECISIONS.PROPOSE }),
        'inventory.change': define('owned-participant', { player: DECISIONS.PROPOSE }),
        'equipment.change': define('owned-participant', { player: DECISIONS.PROPOSE }),
        'spell.learn': define('owned-sheet', { player: DECISIONS.PROPOSE }),
        'transfer.item': define('owned-participant', { player: DECISIONS.PROPOSE }),
        'transfer.crowns': define('owned-participant', { player: DECISIONS.PROPOSE }),
        'proposal.resolve': define('campaign'),
        'conflict.resolve': define('campaign'),
        'room.member.revoke': define('campaign'),
        'room.close': define('campaign')
    });

    function makeId(prefix = 'cmd') {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `${prefix}-${uuid}`;
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    }

    function normalizeRole(role) {
        return Object.values(ROLES).includes(role) ? role : ROLES.SPECTATOR;
    }

    function getCommandDefinition(type) {
        return COMMANDS[String(type || '')] || null;
    }

    function getRoleDecision(type, role) {
        const definition = getCommandDefinition(type);
        const normalizedRole = normalizeRole(role);

        if (!definition) return DECISIONS.DENY;
        if (normalizedRole === ROLES.MASTER) return DECISIONS.ALLOW;
        if (normalizedRole === ROLES.PLAYER) return definition.player;
        return definition.spectator;
    }

    function createCommand(input = {}) {
        return {
            protocolVersion: PROTOCOL_VERSION,
            id: String(input.id || makeId()),
            campaignId: String(input.campaignId || ''),
            actorId: String(input.actorId || ''),
            deviceId: String(input.deviceId || ''),
            role: normalizeRole(input.role),
            type: String(input.type || ''),
            targetId: input.targetId === undefined || input.targetId === null
                ? null
                : String(input.targetId),
            entityKey: String(input.entityKey || ''),
            baseVersion: Math.max(0, Math.floor(Number(input.baseVersion) || 0)),
            payload: input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload)
                ? input.payload
                : {},
            createdAt: input.createdAt || new Date().toISOString()
        };
    }

    function validateCommand(command) {
        const errors = [];

        if (!command || typeof command !== 'object' || Array.isArray(command)) {
            return { valid: false, errors: ['Comando inválido.'] };
        }

        if (command.protocolVersion !== PROTOCOL_VERSION) errors.push('Versão de protocolo incompatível.');
        if (!String(command.id || '').trim()) errors.push('ID do comando ausente.');
        if (!String(command.campaignId || '').trim()) errors.push('Campanha ausente.');
        if (!String(command.actorId || '').trim()) errors.push('Autor ausente.');
        if (!String(command.deviceId || '').trim()) errors.push('Dispositivo ausente.');
        if (!getCommandDefinition(command.type)) errors.push('Tipo de comando desconhecido.');
        if (!Object.values(ROLES).includes(command.role)) errors.push('Papel inválido.');
        if (!Number.isInteger(command.baseVersion) || command.baseVersion < 0) errors.push('Versão-base inválida.');
        if (!command.payload || typeof command.payload !== 'object' || Array.isArray(command.payload)) errors.push('Conteúdo inválido.');

        return { valid: errors.length === 0, errors };
    }

    function evaluateConflict({ command, currentEntityVersion = 0, seenCommandIds = [] } = {}) {
        if (seenCommandIds instanceof Set ? seenCommandIds.has(command?.id) : seenCommandIds.includes?.(command?.id)) {
            return CONFLICT_RESULTS.DUPLICATE;
        }

        const definition = getCommandDefinition(command?.type);
        if (!definition) return CONFLICT_RESULTS.MASTER_DECISION;
        if (Number(command?.baseVersion) === Number(currentEntityVersion)) return CONFLICT_RESULTS.CLEAN;
        if (definition.conflict === 'delta' || definition.conflict === 'append') return CONFLICT_RESULTS.MERGE;
        return CONFLICT_RESULTS.MASTER_DECISION;
    }

    return Object.freeze({
        PROTOCOL_VERSION,
        CAMPAIGN_SCHEMA_VERSION,
        ROLES,
        DECISIONS,
        CONFLICT_RESULTS,
        COMMANDS,
        makeId,
        normalizeRole,
        getCommandDefinition,
        getRoleDecision,
        createCommand,
        validateCommand,
        evaluateConflict
    });
});

