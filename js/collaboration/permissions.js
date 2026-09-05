(function (root, factory) {
    const protocol = root?.collaborationProtocol
        || (typeof require === 'function' ? require('./protocol.js') : null);
    const api = factory(protocol);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.collaborationPermissions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (protocol) {
    'use strict';

    const PRIVATE_KEYS = new Set([
        'gmNotes', 'masterNotes', 'secretNotes', 'privateNotes', 'secrets',
        'password', 'passwordHash', 'ownerSecret', 'accessLog', 'revokedDevices'
    ]);

    function sameId(left, right) {
        return left !== undefined && left !== null
            && right !== undefined && right !== null
            && String(left) === String(right);
    }

    function ownsTarget(command, context = {}) {
        const ownedParticipantIds = context.ownedParticipantIds || [];
        const ownedSheetIds = context.ownedSheetIds || [];
        const definition = protocol.getCommandDefinition(command?.type);

        if (!definition) return false;
        if (definition.scope === 'room-member') return true;
        if (definition.scope === 'owned-participant') {
            return ownedParticipantIds.some(id => sameId(id, command?.targetId));
        }
        if (definition.scope === 'owned-sheet') {
            return ownedSheetIds.some(id => sameId(id, command?.targetId));
        }
        return false;
    }

    function authorizeCommand(command, context = {}) {
        const validation = protocol.validateCommand(command);
        if (!validation.valid) return { decision: protocol.DECISIONS.DENY, reason: validation.errors.join(' ') };

        const role = protocol.normalizeRole(context.role || command.role);
        const roleDecision = protocol.getRoleDecision(command.type, role);

        if (roleDecision === protocol.DECISIONS.DENY) {
            return { decision: roleDecision, reason: 'Este papel não pode executar esta ação.' };
        }

        if (role === protocol.ROLES.PLAYER && !ownsTarget(command, context)) {
            return { decision: protocol.DECISIONS.DENY, reason: 'O jogador não controla este alvo.' };
        }

        return {
            decision: roleDecision,
            reason: roleDecision === protocol.DECISIONS.PROPOSE
                ? 'A alteração permanente precisa da aprovação do mestre.'
                : ''
        };
    }

    function stripPrivateFields(value) {
        if (Array.isArray(value)) return value.map(stripPrivateFields);
        if (!value || typeof value !== 'object') return value;

        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => !PRIVATE_KEYS.has(key))
                .map(([key, nested]) => [key, stripPrivateFields(nested)])
        );
    }

    function projectCharacterSheets(sheets, context) {
        const ownedSheetIds = context.ownedSheetIds || [];
        return (Array.isArray(sheets) ? sheets : [])
            .filter(sheet => ownedSheetIds.some(id => sameId(id, sheet?.id)))
            .map(stripPrivateFields);
    }

    function projectCampaign(campaign, context = {}) {
        if (!campaign || typeof campaign !== 'object') return null;
        const role = protocol.normalizeRole(context.role);
        const clone = typeof structuredClone === 'function'
            ? structuredClone(campaign)
            : JSON.parse(JSON.stringify(campaign));

        if (role === protocol.ROLES.MASTER) return clone;

        const safe = stripPrivateFields(clone);
        const state = safe.state || {};
        delete state.preferences;
        delete state.master;
        delete state.audit;
        delete state.access;

        if (Array.isArray(state.combat?.combatants)) {
            state.combat.combatants = state.combat.combatants.map(combatant => {
                if (context.ownedParticipantIds?.some(id => sameId(id, combatant?.id))) return combatant;
                const visible = { ...combatant };
                delete visible.inventory;
                delete visible.abilities;
                delete visible.learnedSpells;
                delete visible.professionalSkills;
                return visible;
            });
        }

        if (Array.isArray(state.characterSheets)) {
            state.characterSheets = projectCharacterSheets(state.characterSheets, context);
        }

        const compatibility = state.compatibility;
        if (compatibility && typeof compatibility === 'object') {
            delete compatibility.dnd_app_preferences;
            delete compatibility.dnd_saved_encounters;
            delete compatibility.dnd_last_combat_report;
            delete compatibility.dnd_campaign_preferences;
            delete compatibility.inventory;
            delete compatibility.abilitiesInventory;
            delete compatibility.expandedMagic;

            if (typeof compatibility.dnd_character_sheets === 'string') {
                try {
                    compatibility.dnd_character_sheets = JSON.stringify(projectCharacterSheets(
                        JSON.parse(compatibility.dnd_character_sheets),
                        context
                    ));
                } catch {
                    delete compatibility.dnd_character_sheets;
                }
            }
        }

        return safe;
    }

    return Object.freeze({
        PRIVATE_KEYS,
        sameId,
        ownsTarget,
        authorizeCommand,
        stripPrivateFields,
        projectCampaign
    });
});
