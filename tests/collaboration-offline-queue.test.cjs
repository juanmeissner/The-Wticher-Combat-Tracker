const test = require('node:test');
const assert = require('node:assert/strict');

class MemoryStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
    setItem(key, value) { this.values.set(key, String(value)); }
    removeItem(key) { this.values.delete(key); }
}

test('fila offline persiste, reconta tentativas e remove comandos confirmados', async () => {
    const originalStorage = global.localStorage;
    const originalIndexedDb = global.indexedDB;
    global.localStorage = new MemoryStorage();
    global.indexedDB = undefined;
    delete require.cache[require.resolve('../js/collaboration/offline-queue.js')];
    const queue = require('../js/collaboration/offline-queue.js');

    try {
        queue.resetForTests();
        const command = {
            id: 'cmd-offline-1',
            campaignId: 'campaign-test',
            type: 'participant.resource.adjust',
            targetId: 'geralt',
            payload: { resource: 'adrenaline', delta: 1 }
        };
        assert.equal(await queue.enqueue('abc-234xy', command), true);
        const pending = await queue.list('ABC234XY');
        assert.equal(pending.length, 1);
        assert.equal(pending[0].roomCode, 'ABC234XY');
        assert.deepEqual(pending[0].command, command);

        await queue.markAttempt(command.id);
        const attempted = await queue.list('ABC234XY');
        assert.equal(attempted[0].attempts, 1);
        assert.ok(attempted[0].lastAttemptAt);

        await queue.remove(command.id);
        assert.deepEqual(await queue.list('ABC234XY'), []);
    } finally {
        queue.resetForTests();
        global.localStorage = originalStorage;
        global.indexedDB = originalIndexedDb;
    }
});
