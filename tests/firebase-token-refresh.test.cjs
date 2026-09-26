const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const accountPath = path.join(projectRoot, 'js', 'collaboration', 'cloud-account.js');

function waitFor(predicate, timeoutMs = 1000) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            if (predicate()) return resolve();
            if (Date.now() - startedAt >= timeoutMs) return reject(new Error('Tempo de espera excedido.'));
            setTimeout(check, 5);
        };
        check();
    });
}

test.afterEach(() => {
    delete global.localStorage;
    delete global.document;
    delete global.firebaseAuthClient;
    delete global.collaborationRealtime;
    delete global.fetch;
    delete global.cloudAccount;
});

test('campanhas renovam o token quando o Worker ainda recebe e-mail não confirmado', async () => {
    const tokenRequests = [];
    const requestTokens = [];
    global.localStorage = {
        getItem: () => null,
        setItem() {},
        removeItem() {}
    };
    global.document = {
        getElementById: () => null,
        querySelector: () => null
    };
    global.collaborationRealtime = {
        getServiceEndpoint: () => 'https://account.test'
    };
    global.firebaseAuthClient = {
        async getIdToken(forceRefresh) {
            tokenRequests.push(Boolean(forceRefresh));
            return forceRefresh ? 'firebase-token-confirmed' : 'firebase-token-stale';
        }
    };
    global.fetch = async (url, options) => {
        const token = String(options?.headers?.authorization || '').replace(/^Bearer\s+/i, '');
        requestTokens.push(token);
        if (token === 'firebase-token-stale') {
            return new Response(JSON.stringify({
                error: 'firebase_email_unverified',
                message: 'Confirme seu endereço de e-mail antes de acessar as campanhas permanentes.'
            }), { status: 403, headers: { 'content-type': 'application/json' } });
        }
        const pathname = new URL(url).pathname;
        return new Response(JSON.stringify(pathname.endsWith('/campaigns')
            ? { campaigns: [] }
            : { user: { displayName: 'Flokibr', emailVerified: true, authProvider: 'firebase' } }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    };

    delete require.cache[require.resolve(accountPath)];
    const account = require(accountPath);
    account.useFirebaseUser({
        uid: 'firebase-confirmed-user',
        email: 'flokibr@example.com',
        displayName: 'Flokibr',
        emailVerified: true,
        providerIds: ['password']
    });

    await waitFor(() => account.getState().remoteUser?.emailVerified === true);
    const state = account.getState();
    assert.equal(state.errorMessage, '');
    assert.equal(state.remoteUser.displayName, 'Flokibr');
    assert.ok(tokenRequests.includes(false));
    assert.ok(tokenRequests.includes(true));
    assert.ok(requestTokens.includes('firebase-token-stale'));
    assert.ok(requestTokens.includes('firebase-token-confirmed'));
});
