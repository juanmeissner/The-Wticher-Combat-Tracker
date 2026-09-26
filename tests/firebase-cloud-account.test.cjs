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
    async batch(statements) {
        this.database.exec('BEGIN');
        try {
            const results = [];
            for (const statement of statements) results.push(await statement.run());
            this.database.exec('COMMIT');
            return results;
        } catch (error) {
            this.database.exec('ROLLBACK');
            throw error;
        }
    }
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
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0003_account_security_events.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0004_legacy_account_migrations.sql'), 'utf8'));
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
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0003_account_security_events.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0004_legacy_account_migrations.sql'), 'utf8'));
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

test('Firebase vincula conta legada sem perder campanhas nem sessões antigas', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0001_accounts_and_campaigns.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0002_firebase_identities.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0003_account_security_events.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0004_legacy_account_migrations.sql'), 'utf8'));
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const token = await tokens.makeToken();
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };

    const legacy = await (await accountService.handleAccountRequest(request(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Juan antigo', username: 'juan.mestre', password: 'senha-forte', deviceId: 'old-device' }
    ), d1)).json();
    await accountService.handleAccountRequest(request(
        'https://account.test/api/account/campaigns/legacy-campaign',
        'PUT',
        { campaign: { id: 'legacy-campaign', metadata: { name: 'Velen antiga' } }, name: 'Velen antiga', expectedRevision: null },
        legacy.token
    ), d1);

    await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, token), d1, undefined, options
    );
    await accountService.handleAccountRequest(request(
        'https://account.test/api/account/campaigns/firebase-campaign',
        'PUT',
        { campaign: { id: 'firebase-campaign', metadata: { name: 'Skellige nova' } }, name: 'Skellige nova', expectedRevision: null },
        token
    ), d1, undefined, options);

    const wrongPassword = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/link-legacy',
        'POST',
        { username: 'juan.mestre', password: 'senha-errada' },
        token
    ), d1, undefined, options);
    assert.equal(wrongPassword.status, 401);
    assert.equal((await wrongPassword.json()).error, 'invalid_legacy_credentials');

    const linkResponse = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/link-legacy',
        'POST',
        { username: 'juan.mestre', password: 'senha-forte' },
        token
    ), d1, undefined, options);
    assert.equal(linkResponse.status, 200);
    const linked = await linkResponse.json();
    assert.equal(linked.user.username, 'juan.mestre');
    assert.equal(linked.user.authProvider, 'firebase');
    assert.equal(linked.movedCampaigns, 1);
    assert.equal(linked.preservedLegacyCampaigns, 1);

    const firebaseCampaigns = await (await accountService.handleAccountRequest(
        request('https://account.test/api/account/campaigns', 'GET', undefined, token), d1, undefined, options
    )).json();
    assert.deepEqual(firebaseCampaigns.campaigns.map(item => item.id).sort(), ['firebase-campaign', 'legacy-campaign']);
    const legacyCampaigns = await (await accountService.handleAccountRequest(
        request('https://account.test/api/account/campaigns', 'GET', undefined, legacy.token), d1
    )).json();
    assert.deepEqual(legacyCampaigns.campaigns.map(item => item.id).sort(), ['firebase-campaign', 'legacy-campaign']);
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM users WHERE id LIKE 'user-firebase-%'").get().total, 0);

    const linkedAgain = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/link-legacy',
        'POST',
        { username: 'juan.mestre', password: 'senha-forte' },
        token
    ), d1, undefined, options);
    assert.equal(linkedAgain.status, 200);
    assert.equal((await linkedAgain.json()).alreadyLinked, true);

    const secondToken = await tokens.makeToken({
        sub: 'firebase-uid-ciri',
        email: 'ciri@example.test',
        name: 'Ciri Firebase'
    });
    const reusedLegacy = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/link-legacy',
        'POST',
        { username: 'juan.mestre', password: 'senha-forte' },
        secondToken
    ), d1, undefined, options);
    assert.equal(reusedLegacy.status, 409);
    assert.equal((await reusedLegacy.json()).error, 'legacy_account_already_linked');
    database.close();
});

test('troca de senha encerra sessões legadas e registra histórico privado', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    for (const migration of [
        '0001_accounts_and_campaigns.sql',
        '0002_firebase_identities.sql',
        '0003_account_security_events.sql',
        '0004_legacy_account_migrations.sql'
    ]) {
        database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', migration), 'utf8'));
    }
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const oldFirebaseToken = await tokens.makeToken({ iat: Math.floor(tokens.nowMs / 1000) - 30 });
    const firebaseToken = await tokens.makeToken({ iat: Math.floor(tokens.nowMs / 1000) });
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };

    const legacy = await (await accountService.handleAccountRequest(request(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Juan antigo', username: 'juan.seguro', password: 'senha-forte', deviceId: 'old-device' }
    ), d1)).json();
    await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, firebaseToken), d1, undefined, options
    );
    const linked = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/link-legacy',
        'POST',
        { username: 'juan.seguro', password: 'senha-forte' },
        firebaseToken
    ), d1, undefined, options);
    assert.equal(linked.status, 200);

    const legacyBefore = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, legacy.token), d1
    );
    assert.equal(legacyBefore.status, 200);

    const changed = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/security/password-changed',
        'POST',
        {},
        firebaseToken
    ), d1, undefined, options);
    assert.equal(changed.status, 200);
    const result = await changed.json();
    assert.equal(result.revokedLegacySessions, 1);
    assert.equal(result.event.type, 'password_changed');

    const legacyAfter = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, legacy.token), d1
    );
    assert.equal(legacyAfter.status, 401);

    const duplicate = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/security/password-changed',
        'POST',
        {},
        firebaseToken
    ), d1, undefined, options);
    assert.equal(duplicate.status, 200);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM account_security_events').get().total, 1);

    const oldFirebaseSession = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, oldFirebaseToken), d1, undefined, options
    );
    assert.equal(oldFirebaseSession.status, 401);
    assert.equal((await oldFirebaseSession.json()).error, 'account_session_revoked');

    const historyResponse = await accountService.handleAccountRequest(
        request('https://account.test/api/account/security-events', 'GET', undefined, firebaseToken), d1, undefined, options
    );
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();
    assert.equal(history.events.length, 1);
    assert.equal(history.events[0].type, 'password_changed');
    assert.equal(history.events[0].details.revokedLegacySessions, 1);
    const serialized = JSON.stringify(history);
    assert.doesNotMatch(serialized, /senha-forte|juan@example\.test|Bearer|firebaseToken/);
    database.close();
});

test('vinculação bloqueia campanhas com o mesmo ID sem alterar nenhuma conta', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0001_accounts_and_campaigns.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0002_firebase_identities.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0003_account_security_events.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0004_legacy_account_migrations.sql'), 'utf8'));
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const token = await tokens.makeToken();
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };
    const legacy = await (await accountService.handleAccountRequest(request(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Conta antiga', username: 'conta.antiga', password: 'senha-antiga' }
    ), d1)).json();
    await accountService.handleAccountRequest(request(
        'https://account.test/api/account/campaigns/same-id',
        'PUT',
        { campaign: { id: 'same-id' }, name: 'Cópia antiga', expectedRevision: null },
        legacy.token
    ), d1);
    await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, token), d1, undefined, options
    );
    await accountService.handleAccountRequest(request(
        'https://account.test/api/account/campaigns/same-id',
        'PUT',
        { campaign: { id: 'same-id' }, name: 'Cópia Firebase', expectedRevision: null },
        token
    ), d1, undefined, options);
    const originalIdentity = database.prepare('SELECT user_id FROM firebase_identities WHERE firebase_uid = ?').get('firebase-uid-juan');

    const conflict = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/link-legacy',
        'POST',
        { username: 'conta.antiga', password: 'senha-antiga' },
        token
    ), d1, undefined, options);
    assert.equal(conflict.status, 409);
    const result = await conflict.json();
    assert.equal(result.error, 'legacy_campaign_conflict');
    assert.deepEqual(result.conflicts.map(item => item.id), ['same-id']);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM cloud_campaigns WHERE id = ?').get('same-id').total, 2);
    assert.equal(database.prepare('SELECT user_id FROM firebase_identities WHERE firebase_uid = ?').get('firebase-uid-juan').user_id, originalIdentity.user_id);
    database.close();
});

test('migração guiada preserva campanhas e desativa o acesso legado somente após confirmação', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    for (const migration of [
        '0001_accounts_and_campaigns.sql',
        '0002_firebase_identities.sql',
        '0003_account_security_events.sql',
        '0004_legacy_account_migrations.sql'
    ]) {
        database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', migration), 'utf8'));
    }
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const firebaseToken = await tokens.makeToken();
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };

    const legacy = await (await accountService.handleAccountRequest(request(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Conta antiga', username: 'mestre.antigo', password: 'senha-antiga', deviceId: 'legacy-device' }
    ), d1)).json();
    await accountService.handleAccountRequest(request(
        'https://account.test/api/account/campaigns/legacy-world',
        'PUT',
        { campaign: { id: 'legacy-world' }, name: 'Campanha antiga', expectedRevision: null },
        legacy.token
    ), d1);
    await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, firebaseToken), d1, undefined, options
    );
    await accountService.handleAccountRequest(request(
        'https://account.test/api/account/campaigns/firebase-world',
        'PUT',
        { campaign: { id: 'firebase-world' }, name: 'Campanha Firebase', expectedRevision: null },
        firebaseToken
    ), d1, undefined, options);

    const migratedResponse = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/migrate-legacy',
        'POST',
        { legacyToken: legacy.token },
        firebaseToken
    ), d1, undefined, options);
    assert.equal(migratedResponse.status, 200);
    const migrated = await migratedResponse.json();
    assert.equal(migrated.migrationCompleted, true);
    assert.equal(migrated.alreadyMigrated, false);
    assert.equal(migrated.movedCampaigns, 1);
    assert.equal(migrated.preservedLegacyCampaigns, 1);
    assert.equal(migrated.revokedLegacySessions, 1);
    assert.equal(migrated.user.username, 'mestre.antigo');

    const campaigns = await (await accountService.handleAccountRequest(
        request('https://account.test/api/account/campaigns', 'GET', undefined, firebaseToken), d1, undefined, options
    )).json();
    assert.deepEqual(campaigns.campaigns.map(item => item.id).sort(), ['firebase-world', 'legacy-world']);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM account_sessions').get().total, 0);
    assert.equal(database.prepare("SELECT status FROM legacy_account_migrations WHERE user_id = ?").get(migrated.user.id).status, 'completed');
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM account_security_events WHERE event_type = 'legacy_migration_completed'").get().total, 1);

    const oldSession = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, legacy.token), d1
    );
    assert.equal(oldSession.status, 401);
    const oldLogin = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/login',
        'POST',
        { username: 'mestre.antigo', password: 'senha-antiga' }
    ), d1);
    assert.equal(oldLogin.status, 409);
    assert.equal((await oldLogin.json()).error, 'legacy_account_migrated');

    const repeated = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/migrate-legacy',
        'POST',
        { legacyToken: legacy.token },
        firebaseToken
    ), d1, undefined, options);
    assert.equal(repeated.status, 200);
    assert.equal((await repeated.json()).alreadyMigrated, true);
    database.close();
});

test('migração interrompida mantém a senha e a sessão antigas disponíveis', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const accountService = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href);
    const verifier = await import(pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'firebase-token-verifier.mjs')).href);
    verifier.resetFirebaseKeyCache();
    const database = new DatabaseSync(':memory:');
    for (const migration of [
        '0001_accounts_and_campaigns.sql',
        '0002_firebase_identities.sql',
        '0003_account_security_events.sql',
        '0004_legacy_account_migrations.sql'
    ]) {
        database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', migration), 'utf8'));
    }
    const d1 = new D1DatabaseAdapter(database);
    const tokens = await createTokenFactory();
    const unverifiedToken = await tokens.makeToken({ email_verified: false });
    const options = {
        firebaseProjectId: 'thewitcherrpgmanager',
        firebaseFetch: tokens.fetchKeys,
        firebaseNowMs: tokens.nowMs
    };
    const legacy = await (await accountService.handleAccountRequest(request(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Conta interrompida', username: 'migracao.pendente', password: 'senha-antiga' }
    ), d1)).json();

    const interrupted = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/migrate-legacy',
        'POST',
        { legacyToken: legacy.token },
        unverifiedToken
    ), d1, undefined, options);
    assert.equal(interrupted.status, 403);
    assert.equal((await interrupted.json()).error, 'firebase_email_unverified');
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM legacy_account_migrations').get().total, 0);

    const legacyProfile = await accountService.handleAccountRequest(
        request('https://account.test/api/account/me', 'GET', undefined, legacy.token), d1
    );
    assert.equal(legacyProfile.status, 200);
    const legacyLogin = await accountService.handleAccountRequest(request(
        'https://account.test/api/account/login',
        'POST',
        { username: 'migracao.pendente', password: 'senha-antiga' }
    ), d1);
    assert.equal(legacyLogin.status, 200);
    database.close();
});

test('configuração do Worker e cliente preservam Firebase e acesso legado', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const wrangler = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'wrangler.jsonc'), 'utf8');
    const worker = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'src', 'worker.mjs'), 'utf8');
    const account = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'cloud-account.js'), 'utf8');
    const migration = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0002_firebase_identities.sql'), 'utf8');
    const securityMigration = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0003_account_security_events.sql'), 'utf8');
    const legacyMigration = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0004_legacy_account_migrations.sql'), 'utf8');
    assert.match(wrangler, /"FIREBASE_PROJECT_ID": "thewitcherrpgmanager"/);
    assert.match(worker, /firebaseProjectId: env\.FIREBASE_PROJECT_ID/);
    assert.match(account, /firebaseAuthClient\.getIdToken/);
    assert.match(account, /firebase_email_unverified/);
    assert.match(account, /performRequest\(path, options, true\)/);
    assert.match(account, /\/api\/account\/link-legacy/);
    assert.match(account, /linkFirebaseLegacyAccount/);
    assert.match(account, /accountSession\?\.token/);
    assert.match(account, /recordPasswordChanged/);
    assert.match(account, /completeLegacyAccountMigration/);
    assert.match(account, /\/api\/account\/migrate-legacy/);
    assert.match(account, /\/api\/account\/security-events/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS firebase_identities/);
    assert.match(migration, /FOREIGN KEY \(user_id\) REFERENCES users\(id\) ON DELETE CASCADE/);
    assert.match(securityMigration, /CREATE TABLE IF NOT EXISTS account_security_events/);
    assert.match(securityMigration, /idx_account_security_events_user_created/);
    assert.match(legacyMigration, /CREATE TABLE IF NOT EXISTS legacy_account_migrations/);
    assert.match(legacyMigration, /firebase_uid TEXT NOT NULL UNIQUE/);
});
