const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const database = require('../js/campaign/campaign-database.js');
const projectRoot = path.resolve(__dirname, '..');

function campaign(id, revision, name = id) {
    return {
        id,
        revision,
        schemaVersion: 2,
        metadata: { name },
        state: { combat: { round: revision } }
    };
}

test('registro durável possui versão, checksum e detecta corrupção', () => {
    const record = database.createRecord(campaign('campaign-a', 4), '2026-09-19T12:00:00.000Z');

    assert.equal(record.storageVersion, database.STORAGE_VERSION);
    assert.equal(record.revision, 4);
    assert.equal(database.isValidRecord(record), true);
    assert.ok(record.bytes > 0);

    record.campaign.state.combat.round = 99;
    assert.equal(database.isValidRecord(record), false);
});

test('fila agrupa alterações e grava somente a revisão mais recente por campanha', async () => {
    const writes = [];
    const queue = database.createSaveQueue({
        delay: 60_000,
        writer: async value => writes.push(value)
    });

    queue.schedule(campaign('campaign-a', 1));
    queue.schedule(campaign('campaign-a', 2));
    queue.schedule(campaign('campaign-b', 3));
    assert.equal(queue.getPendingCount(), 2);

    const result = await queue.flush();
    assert.equal(result.length, 2);
    assert.deepEqual(writes.map(value => [value.id, value.revision]), [
        ['campaign-a', 2],
        ['campaign-b', 3]
    ]);
    assert.equal(queue.getPendingCount(), 0);
});

test('erros de cota são reconhecidos nos navegadores suportados', () => {
    assert.equal(database.isQuotaError({ name: 'QuotaExceededError' }), true);
    assert.equal(database.isQuotaError({ code: 22 }), true);
    assert.equal(database.isQuotaError(new Error('outro erro')), false);
});

test('falha de gravação conserva a campanha na fila para nova tentativa', async () => {
    let shouldFail = true;
    const writes = [];
    const queue = database.createSaveQueue({
        delay: 60_000,
        writer: async value => {
            if (shouldFail) {
                const error = new Error('sem espaço');
                error.name = 'QuotaExceededError';
                throw error;
            }
            writes.push(value);
        }
    });

    queue.schedule(campaign('campaign-retry', 8));
    const failedResult = await queue.flush();
    assert.equal(failedResult[0].saved, false);
    assert.equal(queue.getPendingCount(), 1);

    shouldFail = false;
    const retryResult = await queue.flush();
    assert.equal(retryResult[0].saved, true);
    assert.equal(queue.getPendingCount(), 0);
    assert.equal(writes[0].revision, 8);
});

test('PWA carrega o banco antes do store e mantém o módulo offline', () => {
    const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
    const storeSource = fs.readFileSync(path.join(projectRoot, 'js', 'campaign', 'campaign-store.js'), 'utf8');
    const appInitSource = fs.readFileSync(path.join(projectRoot, 'js', 'app-init.js'), 'utf8');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');

    assert.match(indexSource, /campaign\/campaign-migrations\.js[\s\S]+campaign\/campaign-database\.js[\s\S]+campaign\/campaign-store\.js/);
    assert.match(workerSource, /campaign\/campaign-database\.js/);
    assert.match(storeSource, /hydrateDurableStorage/);
    assert.match(storeSource, /removePhysicalCampaignData/);
    assert.match(storeSource, /flushDurableStorage/);
    assert.match(storeSource, /durableBootstrapPlaceholder[\s\S]+!durableHydrated/);
    assert.match(storeSource, /applyHydratedCampaignToRuntime/);
    assert.match(appInitSource, /getCompleteApplicationStorageSnapshot/);
    assert.match(appInitSource, /campaignDatabase\?\.clear/);
    assert.match(sessionSource, /version:\s*5/);
});
