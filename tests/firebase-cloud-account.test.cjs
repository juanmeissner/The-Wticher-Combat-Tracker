const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');

class D1PreparedStatementAdapter {
    constructor(statement) { this.statement = statement; this.values = []; }
    bind(...values) { this.values = values; return this; }
    async first() { return this.statement.get(...this.values) || null; }
    async all() { return { success: true, results: this.statement.all(...this.values) }; }
    async run() {
        const result = this.statement.run(...this.values);
        return { success: true, results: [], meta: { changes: Number(result.changes) } };
    }
}

class D1DatabaseAdapter {
    constructor(database) { this.database = database; }
    prepare(sql) { return new D1PreparedStatementAdapter(this.database.prepare(sql)); }
}

const base64Url = value => Buffer.from(value).toString('base64url');

async function createTokenFactory(projectId = 'thewitcherrpgmanager') {
    const keyPair = await crypto.subtle.generateKey({
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
    }, true, ['sign', 'verify']);
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const kid = 'firebase-test-key';
    const now = Math.floor(Date.now() / 1000);
    const makeToken = async overrides => {
        const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }));
        const payload = base64Url(JSON.stringify({
            aud: projectId,
            iss: `https://securetoken.google.com/${projectId}`,
            sub: 'firebase-uid-juan',
            iat: now - 10,
            exp: now + 3600,
            auth_time: now - 20,
            email: 'juan@example.test',
            email_verified: true,
            name: 'Juan Firebase',
            firebase: { sign_in_provider: 'password', identities: { email: ['juan@example.test'] } },
            ...overrides
        }));
        const signature = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            keyPair.privateKey,
            new TextEncoder().encode(`${header}.${payload}`)
        );
        return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
    };
    const fetchKeys = async () => new Response(JSON.stringify({
        keys: [{ ...publicJwk, kid, alg: 'RS256', use: 'sig' }]
    }), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } });
    return { makeToken, fetchKeys, nowMs: now * 1000 };
}

function request(url, method = 'GET', body, token = '') {
    return new Request(url, {
        method,
        headers: {
            ...(body === undefined ? {} : { 'content-type': 'application/json' }),
            ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
}

test('Worker valida Firebase, cria vínculo D1 e isola campanhas por UID', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0001_accounts_and_campaigns.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0002_firebase_identities.sql'), 'utf8'));
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const token = await tokens.makeToken();
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };

    const profileResponse = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, token), d1, undefined, options
    );
    assert.equal(profileResponse.status, 200);
    const profile = await profileResponse.json();
    assert.equal(profile.user.authProvider, 'firebase');
    assert.equal(profile.user.email, 'juan@example.test');
    assert.equal(profile.user.emailVerified, true);

    const identity = database.prepare('SELECT firebase_uid, user_id FROM firebase_identities').get();
    assert.equal(identity.firebase_uid, 'firebase-uid-juan');
    assert.match(identity.user_id, /^user-firebase-/);

    const campaign = { id: 'firebase-campaign', metadata: { name: 'Velen Firebase' }, state: { combat: { round: 1 } } };
    const saveResponse = await accountService.handleAccountRequest(
        request('https://account.test/api/account/campaigns/firebase-campaign', 'PUT', {
            campaign, name: 'Velen Firebase', expectedRevision: null
        }, token), d1, undefined, options
    );
    assert.equal(saveResponse.status, 201);

    const secondToken = await tokens.makeToken({
        sub: 'firebase-uid-ciri',
        email: 'ciri@example.test',
        name: 'Ciri Firebase'
    });
    const forbidden = await accountService.handleAccountRequest(
        request('https://account.test/api/account/campaigns/firebase-campaign', 'GET', undefined, secondToken),
        d1,
        undefined,
        options
    );
    assert.equal(forbidden.status, 404);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM firebase_identities').get().total, 2);
    database.close();
});

test('Worker rejeita e-mail não confirmado e token de outro projeto', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0001_accounts_and_campaigns.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0002_firebase_identities.sql'), 'utf8'));
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };

    const unverifiedToken = await tokens.makeToken({ email_verified: false });
    const unverified = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, unverifiedToken), d1, undefined, options
    );
    assert.equal(unverified.status, 403);
    assert.equal((await unverified.json()).error, 'firebase_email_unverified');

    const wrongAudienceToken = await tokens.makeToken({ aud: 'outro-projeto' });
    const wrongAudience = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, wrongAudienceToken), d1, undefined, options
    );
    assert.equal(wrongAudience.status, 401);
    assert.equal((await wrongAudience.json()).error, 'firebase_token_audience');
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM firebase_identities').get().total, 0);
    database.close();
});

test('configuração do Worker e cliente preservam Firebase e acesso legado', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const wrangler = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'wrangler.jsonc'), 'utf8');
    const worker = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'src', 'worker.mjs'), 'utf8');
    const account = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'cloud-account.js'), 'utf8');
    const migration = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0002_firebase_identities.sql'), 'utf8');
    assert.match(wrangler, /"FIREBASE_PROJECT_ID": "thewitcherrpgmanager"/);
    assert.match(worker, /firebaseProjectId: env\.FIREBASE_PROJECT_ID/);
    assert.match(account, /firebaseAuthClient\.getIdToken/);
    assert.match(account, /accountSession\?\.token/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS firebase_identities/);
    assert.match(migration, /FOREIGN KEY \(user_id\) REFERENCES users\(id\) ON DELETE CASCADE/);
});
