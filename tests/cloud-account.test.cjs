const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');

class D1PreparedStatementAdapter {
    constructor(statement) {
        this.statement = statement;
        this.values = [];
    }
    bind(...values) {
        this.values = values;
        return this;
    }
    async first() {
        return this.statement.get(...this.values) || null;
    }
    async all() {
        return { success: true, results: this.statement.all(...this.values) };
    }
    async run() {
        const result = this.statement.run(...this.values);
        return { success: true, results: [], meta: { changes: Number(result.changes) } };
    }
}

class D1DatabaseAdapter {
    constructor(database) {
        this.database = database;
    }
    prepare(sql) {
        return new D1PreparedStatementAdapter(this.database.prepare(sql));
    }
}

function jsonRequest(url, method, body, token = '') {
    return new Request(url, {
        method,
        headers: {
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
}

test('contas privadas autenticam e isolam campanhas permanentes por proprietário', async () => {
    const projectRoot = path.resolve(__dirname, '..');
    const moduleUrl = pathToFileURL(path.join(projectRoot, 'cloudflare', 'src', 'account-service.mjs')).href;
    const accountService = await import(moduleUrl);
    const database = new DatabaseSync(':memory:');
    for (const migration of [
        '0001_accounts_and_campaigns.sql',
        '0002_firebase_identities.sql',
        '0003_account_security_events.sql',
        '0004_legacy_account_migrations.sql',
        '0005_unique_campaign_names.sql',
        '0006_account_security_controls.sql'
    ]) {
        database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', migration), 'utf8'));
    }
    const d1 = new D1DatabaseAdapter(database);

    const registerResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Juan', username: 'juan.mestre', password: 'senha-forte', deviceId: 'device-1' }
    ), d1);
    assert.equal(registerResponse.status, 201);
    const registered = await registerResponse.json();
    assert.equal(registered.user.username, 'juan.mestre');
    assert.ok(registered.token.length > 20);

    const duplicateResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Outro', username: 'JUAN.MESTRE', password: 'outra-senha' }
    ), d1);
    assert.equal(duplicateResponse.status, 409);

    const wrongLogin = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/login',
        'POST',
        { username: 'juan.mestre', password: 'senha-incorreta' }
    ), d1);
    assert.equal(wrongLogin.status, 401);

    const profileResponse = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/me',
        { headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(profileResponse.status, 200);
    assert.equal((await profileResponse.json()).user.displayName, 'Juan');
    const collaborationIdentity = await accountService.authenticateOptionalAccount(new Request(
        'https://account.test/api/rooms',
        { method: 'POST', headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(collaborationIdentity.error, null);
    assert.equal(collaborationIdentity.auth.user.id, registered.user.id);
    const invalidCollaborationIdentity = await accountService.authenticateOptionalAccount(new Request(
        'https://account.test/api/rooms',
        { method: 'POST', headers: { authorization: 'Bearer token-invalido' } }
    ), d1);
    assert.equal(invalidCollaborationIdentity.auth, null);
    assert.equal(invalidCollaborationIdentity.error.status, 401);

    const campaign = {
        schemaVersion: 1,
        id: 'campaign-geralt',
        revision: 7,
        metadata: { name: 'Campanha local' },
        state: { combat: { round: 4, combatants: [] }, compatibility: {} }
    };
    const invalidNameResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-geralt',
        'PUT',
        { campaign, name: '', expectedRevision: null },
        registered.token
    ), d1);
    assert.equal(invalidNameResponse.status, 400);

    const saveResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-geralt',
        'PUT',
        { campaign, name: 'Caçada em Velen', expectedRevision: null },
        registered.token
    ), d1);
    assert.equal(saveResponse.status, 201);
    const saved = await saveResponse.json();
    assert.equal(saved.cloud.revision, 1);
    assert.equal(saved.cloud.name, 'Caçada em Velen');

    const duplicateNameCampaign = { ...campaign, id: 'campaign-duplicate-name' };
    const duplicateNameResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-duplicate-name',
        'PUT',
        { campaign: duplicateNameCampaign, name: '  CAÇADA   EM VELEN  ', expectedRevision: null },
        registered.token
    ), d1);
    assert.equal(duplicateNameResponse.status, 409);
    assert.equal((await duplicateNameResponse.json()).error, 'duplicate_campaign_name');

    const secondCampaign = { ...campaign, id: 'campaign-skellige', metadata: { name: 'Skellige' } };
    const secondSaveResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-skellige',
        'PUT',
        { campaign: secondCampaign, name: 'Skellige', expectedRevision: null },
        registered.token
    ), d1);
    assert.equal(secondSaveResponse.status, 201);

    const duplicateRenameResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-skellige',
        'PATCH',
        { name: 'caçada em velen', expectedRevision: 1 },
        registered.token
    ), d1);
    assert.equal(duplicateRenameResponse.status, 409);
    assert.equal((await duplicateRenameResponse.json()).error, 'duplicate_campaign_name');

    const removeSecondResponse = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns/campaign-skellige',
        { method: 'DELETE', headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(removeSecondResponse.status, 200);

    const renameResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-geralt',
        'PATCH',
        { name: 'A Conjunção das Esferas', expectedRevision: 1 },
        registered.token
    ), d1);
    assert.equal(renameResponse.status, 200);
    const renamed = await renameResponse.json();
    assert.equal(renamed.cloud.id, 'campaign-geralt');
    assert.equal(renamed.cloud.name, 'A Conjunção das Esferas');
    assert.equal(renamed.cloud.revision, 2);

    const listResponse = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns',
        { headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    const listed = await listResponse.json();
    assert.equal(listed.campaigns.length, 1);
    assert.equal(listed.campaigns[0].name, 'A Conjunção das Esferas');
    assert.equal(listed.campaigns[0].id, 'campaign-geralt');

    const loadResponse = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns/campaign-geralt',
        { headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(loadResponse.status, 200);
    const loaded = await loadResponse.json();
    assert.equal(loaded.campaign.state.combat.round, 4);
    assert.equal(loaded.campaign.metadata.name, 'A Conjunção das Esferas');
    assert.equal(loaded.campaign.id, 'campaign-geralt');

    const conflictResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/campaigns/campaign-geralt',
        'PUT',
        { campaign, expectedRevision: 0 },
        registered.token
    ), d1);
    assert.equal(conflictResponse.status, 409);
    assert.equal((await conflictResponse.json()).error, 'cloud_campaign_conflict');

    const secondAccount = await (await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/register',
        'POST',
        { displayName: 'Ciri', username: 'ciri', password: 'senha-da-ciri' }
    ), d1)).json();
    const forbiddenLoad = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns/campaign-geralt',
        { headers: { authorization: `Bearer ${secondAccount.token}` } }
    ), d1);
    assert.equal(forbiddenLoad.status, 404);

    const deleteResponse = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns/campaign-geralt',
        { method: 'DELETE', headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(deleteResponse.status, 200);
    assert.equal((await deleteResponse.json()).cloud.name, 'A Conjunção das Esferas');

    const deletedLoad = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns/campaign-geralt',
        { headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(deletedLoad.status, 404);

    const emptyList = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/campaigns',
        { headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal((await emptyList.json()).campaigns.length, 0);

    const logoutResponse = await accountService.handleAccountRequest(jsonRequest(
        'https://account.test/api/account/logout',
        'POST',
        {},
        registered.token
    ), d1);
    assert.equal(logoutResponse.status, 200);
    const expiredProfile = await accountService.handleAccountRequest(new Request(
        'https://account.test/api/account/me',
        { headers: { authorization: `Bearer ${registered.token}` } }
    ), d1);
    assert.equal(expiredProfile.status, 401);
    database.close();
});

test('migração preserva campanhas existentes e cria nomes únicos por conta', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0001_accounts_and_campaigns.sql'), 'utf8'));
    const now = '2026-09-26T12:00:00.000Z';
    const insertUser = database.prepare(`
        INSERT INTO users
            (id, username, display_name, password_salt, password_verifier, password_iterations, created_at, updated_at)
        VALUES (?, ?, ?, 'salt', 'hash', 100000, ?, ?)
    `);
    insertUser.run('owner-1', 'owner.one', 'Owner One', now, now);
    insertUser.run('owner-2', 'owner.two', 'Owner Two', now, now);
    const insertCampaign = database.prepare(`
        INSERT INTO cloud_campaigns
            (id, owner_user_id, name, snapshot_json, revision, created_at, updated_at)
        VALUES (?, ?, ?, '{}', 1, ?, ?)
    `);
    insertCampaign.run('campaign-a', 'owner-1', 'Campanha Principal', now, now);
    insertCampaign.run('campaign-b', 'owner-1', 'campanha principal', now, now);
    insertCampaign.run('campaign-c', 'owner-2', 'Campanha Principal', now, now);

    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0005_unique_campaign_names.sql'), 'utf8'));
    database.exec(fs.readFileSync(path.join(projectRoot, 'cloudflare', 'migrations', '0006_account_security_controls.sql'), 'utf8'));
    const ownerOne = database.prepare(`
        SELECT id, name, name_key FROM cloud_campaigns
        WHERE owner_user_id = 'owner-1'
        ORDER BY id
    `).all();
    assert.equal(ownerOne.length, 2);
    assert.equal(ownerOne[0].name, 'Campanha Principal');
    assert.match(ownerOne[1].name, /\[campaign-b\]$/);
    assert.notEqual(ownerOne[0].name_key, ownerOne[1].name_key);
    assert.equal(database.prepare("SELECT name FROM cloud_campaigns WHERE owner_user_id = 'owner-2'").get().name, 'Campanha Principal');
    assert.throws(() => database.prepare(`
        INSERT INTO cloud_campaigns
            (id, owner_user_id, name, name_key, snapshot_json, revision, created_at, updated_at)
        VALUES ('campaign-d', 'owner-1', 'CAMPANHA PRINCIPAL', 'campanha principal', '{}', 1, ?, ?)
    `).run(now, now), /UNIQUE constraint failed/);
    database.close();
});

test('PWA carrega a conta opcional sem incluir o token em backups', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
    const appInit = fs.readFileSync(path.join(projectRoot, 'js', 'app-init.js'), 'utf8');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'collaboration-session.js'), 'utf8');
    const accountSource = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'cloud-account.js'), 'utf8');
    const styles = fs.readFileSync(path.join(projectRoot, 'collaboration.css'), 'utf8');
    assert.match(indexSource, /cloud-account\.js[\s\S]+collaboration-session\.js/);
    assert.match(workerSource, /cloud-account\.js/);
assert.match(workerSource, /witcher-combat-tracker-v195/);
    assert.match(appInit, /APP_SENSITIVE_STORAGE_KEYS/);
    assert.match(appInit, /dnd_cloud_account_session_v1/);
    assert.match(appInit, /dnd_cloud_account_device_v1/);
    assert.match(sessionSource, /cloudAccount.*getPanelMarkup/);
    assert.match(accountSource, /Salvar campanha na nuvem/);
    assert.match(accountSource, /requestDeleteCloudCampaign/);
    assert.match(accountSource, /requestRenameCloudCampaign/);
    assert.match(accountSource, /confirmRenameCloudCampaign/);
    assert.match(accountSource, /Já existe uma campanha com esse nome nesta conta/);
    assert.match(accountSource, /O ID permanente será preservado/);
    assert.match(accountSource, /x-witcher-device-id/);
    assert.match(accountSource, /Dispositivos com acesso/);
    assert.match(accountSource, /linkFirebaseLegacyAccount/);
    assert.match(styles, /cloud-account-panel/);
    assert.match(styles, /cloud-campaign-card-actions/);
    assert.match(styles, /firebase-legacy-link-form/);
assert.match(accountSource, /getCollaborationAccessToken/);
assert.match(accountSource, /getPublicIdentity/);
assert.match(accountSource, /Neste dispositivo/);
assert.match(accountSource, /Na sua conta/);
    assert.match(styles, /@media \(max-width: 520px\)/);
});
