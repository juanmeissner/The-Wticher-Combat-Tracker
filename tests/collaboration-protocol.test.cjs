const assert = require('node:assert/strict');
const protocol = require('../js/collaboration/protocol.js');
const permissions = require('../js/collaboration/permissions.js');

const base = {
    id: 'command-1',
    campaignId: 'campaign-1',
    actorId: 'player-1',
    deviceId: 'device-1',
    role: protocol.ROLES.PLAYER,
    targetId: 'geralt',
    entityKey: 'combatant:geralt',
    baseVersion: 2,
    createdAt: '2026-09-05T12:00:00.000Z'
};

const resourceCommand = protocol.createCommand({
    ...base,
    type: 'participant.resource.adjust',
    payload: { resource: 'st', delta: -5 }
});
assert.equal(protocol.validateCommand(resourceCommand).valid, true);
assert.equal(permissions.authorizeCommand(resourceCommand, {
    role: 'player',
    ownedParticipantIds: ['geralt']
}).decision, protocol.DECISIONS.ALLOW);
assert.equal(permissions.authorizeCommand(resourceCommand, {
    role: 'player',
    ownedParticipantIds: ['yennefer']
}).decision, protocol.DECISIONS.DENY);

const levelCommand = protocol.createCommand({
    ...base,
    type: 'sheet.level-up',
    targetId: 'sheet-geralt',
    entityKey: 'sheet:sheet-geralt',
    payload: { level: 5 }
});
assert.equal(permissions.authorizeCommand(levelCommand, {
    role: 'player',
    ownedSheetIds: ['sheet-geralt']
}).decision, protocol.DECISIONS.PROPOSE);
assert.equal(permissions.authorizeCommand(levelCommand, {
    role: 'master'
}).decision, protocol.DECISIONS.ALLOW);

const turnCommand = protocol.createCommand({
    ...base,
    role: 'master',
    type: 'combat.turn.advance',
    targetId: null,
    entityKey: 'combat:turn'
});
assert.equal(permissions.authorizeCommand(turnCommand, { role: 'player' }).decision, protocol.DECISIONS.DENY);
assert.equal(permissions.authorizeCommand(turnCommand, { role: 'master' }).decision, protocol.DECISIONS.ALLOW);

assert.equal(protocol.evaluateConflict({
    command: resourceCommand,
    currentEntityVersion: 3
}), protocol.CONFLICT_RESULTS.MERGE);
assert.equal(protocol.evaluateConflict({
    command: turnCommand,
    currentEntityVersion: 3
}), protocol.CONFLICT_RESULTS.MASTER_DECISION);
assert.equal(protocol.evaluateConflict({
    command: turnCommand,
    currentEntityVersion: 2
}), protocol.CONFLICT_RESULTS.CLEAN);
assert.equal(protocol.evaluateConflict({
    command: resourceCommand,
    currentEntityVersion: 2,
    seenCommandIds: new Set(['command-1'])
}), protocol.CONFLICT_RESULTS.DUPLICATE);

const projected = permissions.projectCampaign({
    id: 'campaign-1',
    masterNotes: 'Segredo principal',
    state: {
        preferences: { hiddenRolls: true },
        combat: { round: 2, gmNotes: 'Armadilha' },
        characterSheets: [
            { id: 'sheet-geralt', name: 'Geralt', privateNotes: 'Conhece Ciri' },
            { id: 'sheet-yennefer', name: 'Yennefer' }
        ],
        compatibility: {
            dnd_app_preferences: '{}',
            dnd_saved_encounters: '[]',
            dnd_character_sheets: JSON.stringify([
                { id: 'sheet-geralt', name: 'Geralt' },
                { id: 'sheet-yennefer', name: 'Yennefer' }
            ])
        }
    }
}, {
    role: 'player',
    ownedSheetIds: ['sheet-geralt']
});

assert.equal(projected.masterNotes, undefined);
assert.equal(projected.state.preferences, undefined);
assert.equal(projected.state.combat.gmNotes, undefined);
assert.deepEqual(projected.state.characterSheets.map(sheet => sheet.id), ['sheet-geralt']);
assert.deepEqual(
    JSON.parse(projected.state.compatibility.dnd_character_sheets).map(sheet => sheet.id),
    ['sheet-geralt']
);
assert.equal(projected.state.compatibility.dnd_app_preferences, undefined);

console.log('✓ Contrato, permissões, propostas, conflitos e projeções colaborativas validados.');
