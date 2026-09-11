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

const merchantCommand = protocol.createCommand({
    ...base,
    type: 'merchant.transaction',
    payload: { kind: 'item', npcId: 'npc-public', entryId: 'item-1', quantity: 1 }
});
assert.equal(permissions.authorizeCommand(merchantCommand, {
    role: 'player', ownedParticipantIds: ['geralt']
}).decision, protocol.DECISIONS.PROPOSE);

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
        world: {
            currentLocationId: 'world-secret',
            mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 210 },
            locations: [
                { id: 'world-root', type: 'continent', visibility: 'public' },
                { id: 'world-public', type: 'location', parentId: 'world-root', visibility: 'public' },
                { id: 'world-secret', type: 'location', parentId: 'world-root', visibility: 'private' }
            ],
            npcs: [
                { id: 'npc-public', visibility: 'public', currentLocationId: 'world-public', privateNotes: 'oculto', movements: [], schedule: [{ id: 'public', visibility: 'public' }, { id: 'private', visibility: 'private', privateNotes: 'oculto' }], merchant: { name: 'Loja pública', privateNotes: 'estoque secreto', privateTransactions: [{ id: 'tx-secret', total: 50 }] } },
                { id: 'npc-private', visibility: 'private', currentLocationId: 'world-public', movements: [] },
                { id: 'npc-secret-place', visibility: 'public', currentLocationId: 'world-secret', movements: [] }
            ],
            travelHistory: [{ id: 'public-trip', visibility: 'public', toLocationId: 'world-public', distanceKm: 42, routeAlgorithm: 'astar' }, { id: 'secret-trip', visibility: 'private', toLocationId: 'world-public' }],
            regionalEvents: [{ id: 'public-event', visibility: 'public', locationId: 'world-public' }, { id: 'secret-event', visibility: 'private', locationId: 'world-public' }]
        },
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
assert.deepEqual(projected.state.world.locations.map(location => location.id), ['world-root', 'world-public']);
assert.deepEqual(projected.state.world.npcs.map(npc => npc.id), ['npc-public']);
assert.equal(projected.state.world.npcs[0].privateNotes, undefined);
assert.equal(projected.state.world.npcs[0].merchant.privateNotes, undefined);
assert.equal(projected.state.world.npcs[0].merchant.privateTransactions, undefined);
assert.equal(projected.state.world.npcs[0].merchant.name, 'Loja pública');
assert.deepEqual(projected.state.world.npcs[0].schedule.map(entry => entry.id), ['public']);
assert.deepEqual(projected.state.world.travelHistory.map(entry => entry.id), ['public-trip']);
assert.deepEqual(projected.state.world.mapSettings, { pixelsPerGrid: 576, kilometersPerGrid: 210 });
assert.equal(projected.state.world.travelHistory[0].routeAlgorithm, 'astar');
assert.deepEqual(projected.state.world.regionalEvents.map(entry => entry.id), ['public-event']);
assert.equal(projected.state.world.currentLocationId, null);

console.log('✓ Contrato, permissões, propostas, conflitos e projeções colaborativas validados.');
