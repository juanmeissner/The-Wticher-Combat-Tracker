const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const modulePath = path.join(projectRoot, 'js', 'collaboration', 'cloud-account.js');

function response(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

function createHarness() {
    const storage = new Map();
    const calls = [];
    const panel = { innerHTML: '' };
    const firebasePanel = { scrollIntoView: options => calls.push(['scroll', options]) };
    const legacySession = {
        token: 'legacy-session-token-with-safe-length',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user: { id: 'legacy-user', username: 'mestre.antigo', displayName: 'Mestre antigo' }
    };
    storage.set('dnd_cloud_account_session_v1', JSON.stringify(legacySession));

    global.localStorage = {
        getItem: key => storage.get(key) || null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: key => storage.delete(key)
    };
    global.document = {
        getElementById(id) {
            if (id === 'cloudAccountPanel') return panel;
            if (id === 'firebaseAuthPanel') return firebasePanel;
            return null;
        },
        querySelector() { return null; }
    };
    global.firebaseAuthUI = {
        setMode: mode => calls.push(['firebase-mode', mode]),
        loginWithGoogle: async () => true,
        getState: () => ({ user: null })
    };
    global.firebaseAuthClient = { getIdToken: async () => 'firebase-token' };
    global.collaborationRealtime = { getServiceEndpoint: () => 'https://account.test' };
    global.showToast = message => calls.push(['toast', message]);
    global.fetch = async (url, options = {}) => {
        const pathname = new URL(url).pathname;
        calls.push(['fetch', pathname, options]);
        if (pathname === '/api/account/migrate-legacy') {
            return response({
                ok: true,
                migrationCompleted: true,
                movedCampaigns: 1,
                preservedLegacyCampaigns: 2,
                revokedLegacySessions: 1,
                user: {
                    id: 'legacy-user',
                    username: 'mestre.antigo',
                    displayName: 'Mestre Firebase',
                    email: 'mestre@example.test',
                    emailVerified: true,
                    authProvider: 'firebase'
                }
            });
        }
        if (pathname === '/api/account/me') return response({ ok: true, user: { id: 'legacy-user', username: 'mestre.antigo' } });
        if (pathname === '/api/account/campaigns') return response({ ok: true, campaigns: [] });
        if (pathname === '/api/account/security-events') return response({ ok: true, events: [] });
        throw new Error(`Rota inesperada: ${pathname}`);
    };

    delete require.cache[require.resolve(modulePath)];
    const account = require(modulePath);
    return { account, panel, storage, calls, legacySession };
}

test.afterEach(() => {
    for (const key of [
        'localStorage', 'document', 'firebaseAuthUI', 'firebaseAuthClient',
        'collaborationRealtime', 'showToast', 'fetch', 'cloudAccount',
        'beginLegacyAccountMigration', 'beginLegacyAccountMigrationWithGoogle',
        'refreshLegacyMigrationVerification', 'completeLegacyAccountMigration'
    ]) delete global[key];
});

test('assistente retoma a migração e só a conclui com Firebase confirmado', async () => {
    const harness = createHarness();
    harness.account.mountPanel();
    await new Promise(resolve => setImmediate(resolve));
    assert.match(harness.panel.innerHTML, /Atualizar conta antiga/);
    assert.match(harness.panel.innerHTML, /Criar acesso com e-mail/);
    assert.doesNotMatch(harness.panel.innerHTML, /Criar uma conta Cloudflare|registerCloudAccount/);

    assert.equal(harness.account.beginLegacyMigration('register'), true);
    assert.ok(harness.calls.some(call => call[0] === 'firebase-mode' && call[1] === 'register'));
    assert.ok(harness.calls.some(call => call[0] === 'scroll' && call[1]?.behavior === 'smooth'));
    assert.ok(harness.storage.has('dnd_cloud_account_migration_v1'));

    harness.account.useFirebaseUser({
        uid: 'firebase-uid',
        email: 'mestre@example.test',
        emailVerified: false,
        providerIds: ['password']
    });
    assert.match(harness.panel.innerHTML, /Já confirmei o e-mail/);
    assert.doesNotMatch(harness.panel.innerHTML, /Concluir migração/);

    harness.account.useFirebaseUser({
        uid: 'firebase-uid',
        email: 'mestre@example.test',
        displayName: 'Mestre Firebase',
        emailVerified: true,
        providerIds: ['password']
    });
    assert.match(harness.panel.innerHTML, /Concluir migração/);

    const completed = await harness.account.completeLegacyMigration();
    assert.equal(completed, true, JSON.stringify(harness.account.getState()));
    const migrationCall = harness.calls.find(call => call[0] === 'fetch' && call[1] === '/api/account/migrate-legacy');
    assert.equal(migrationCall[2].headers.authorization, 'Bearer firebase-token');
    assert.deepEqual(JSON.parse(migrationCall[2].body), { legacyToken: harness.legacySession.token });
    assert.equal(harness.storage.has('dnd_cloud_account_session_v1'), false);
    assert.equal(harness.storage.has('dnd_cloud_account_migration_v1'), false);
});
