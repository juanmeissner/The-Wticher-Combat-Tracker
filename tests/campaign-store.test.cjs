const assert = require('node:assert/strict');
const migrations = require('../js/campaign/campaign-migrations.js');
const store = require('../js/campaign/campaign-store.js');

function createMemoryStorage(initial = {}) {
    const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); },
        dump() { return Object.fromEntries(values); }
    };
}

const storage = createMemoryStorage({
    dnd_combat_session: JSON.stringify({
        version: 3,
        combatants: [{ id: 'geralt', name: 'Geralt' }],
        activeTurnId: 'geralt',
        round: 4
    }),
    dnd_character_sheets: JSON.stringify([{ id: 'sheet-geralt', name: 'Geralt' }]),
    dnd_campaign_clock: JSON.stringify({ version: 4, currentMinute: 123 }),
    dnd_app_preferences: JSON.stringify({
        theme: 'contrast',
        carriedWeightMode: 'inventory',
        rollModes: { skills: 'auto' }
    })
});

store.resetForTests();
const migrated = store.initialize({ storage, installBridge: false, now: '2026-09-05T10:00:00.000Z' });
assert.equal(migrated.schemaVersion, 1);
assert.equal(migrated.revision, 0);
assert.equal(migrated.state.combat.round, 4);
assert.equal(migrated.state.characterSheets[0].id, 'sheet-geralt');
assert.equal(migrated.state.preferences.carriedWeightMode, 'inventory');
assert.equal(migrated.state.compatibility.dnd_app_preferences, undefined);
assert.ok(storage.getItem(migrations.CAMPAIGN_PREFERENCES_KEY));
assert.equal(store.getCampaigns().length, 1);

storage.setItem('dnd_session_history', JSON.stringify([{ id: 'history-1' }]));
const checkpoint = store.checkpoint({ now: '2026-09-05T10:01:00.000Z' });
assert.equal(checkpoint.revision, 1);
assert.equal(checkpoint.state.history[0].id, 'history-1');
assert.equal(checkpoint.entityVersions['storage:dnd_session_history'], 1);
assert.equal(store.checkpoint().revision, 1, 'Snapshot idêntico não deve criar outra revisão.');

const second = store.createCampaign({
    id: 'campaign-second',
    name: 'Segunda campanha',
    now: '2026-09-05T10:02:00.000Z'
});
assert.equal(second.metadata.name, 'Segunda campanha');
assert.equal(store.getCampaigns().length, 2);

const restored = store.activateCampaign('campaign-second', { reload: false });
assert.equal(restored.id, 'campaign-second');
assert.equal(JSON.parse(storage.getItem('dnd_combat_session') || 'null'), null);

const remoteSession = {
    version: 3,
    combatants: [{ id: 'ciri', name: 'Ciri' }],
    activeTurnId: 'ciri',
    round: 8
};
const remote = store.applyRemoteCampaign({
    ...restored,
    revision: 12,
    state: {
        ...restored.state,
        combat: remoteSession,
        compatibility: { dnd_combat_session: JSON.stringify(remoteSession) }
    }
}, { sequence: 20 });
assert.equal(remote.revision, 12);
assert.equal(remote.sync.lastServerSequence, 20);
assert.equal(JSON.parse(storage.getItem('dnd_combat_session')).round, 8);

store.resetForTests();
console.log('✓ Migração, campanhas versionadas, checkpoints e compatibilidade local validados.');
