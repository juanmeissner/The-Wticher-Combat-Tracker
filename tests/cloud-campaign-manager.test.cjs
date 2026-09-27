const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

test('gerenciador reúne cópias locais e remotas pelo ID permanente', async () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'collaboration', 'cloud-account.js'), 'utf8');
    const panel = { innerHTML: '' };
    const localCampaign = {
        id: 'campaign-linked',
        name: 'Caçada em Velen',
        revision: 12,
        updatedAt: '2026-09-26T12:00:00.000Z'
    };
    let subscription = null;
    const session = {
        token: 'legacy-test-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: { id: 'owner-1', username: 'mestre' }
    };
    const sandbox = {
        console,
        Date,
        Math,
        JSON,
        URL,
        encodeURIComponent,
        decodeURIComponent,
        setTimeout,
        clearTimeout,
        localStorage: createStorage({ dnd_cloud_account_session_v1: JSON.stringify(session) }),
        navigator: { onLine: true, platform: 'Test' },
        document: {
            getElementById(id) { return id === 'cloudAccountPanel' ? panel : null; },
            querySelector() { return null; }
        },
        campaignStore: {
            getCampaigns() { return [localCampaign]; },
            getActiveCampaign() { return { ...localCampaign, metadata: { name: localCampaign.name } }; },
            subscribe(listener) { subscription = listener; return () => { subscription = null; }; }
        },
        fetch: async url => {
            const pathname = new URL(url).pathname;
            const body = pathname.endsWith('/campaigns')
                ? { campaigns: [{ id: localCampaign.id, name: localCampaign.name, revision: 4, updatedAt: localCampaign.updatedAt }] }
                : { user: session.user };
            return { ok: true, status: 200, async json() { return body; } };
        },
        addEventListener() {},
        matchMedia() { return { matches: false }; },
        crypto: { randomUUID() { return 'device-test'; } }
    };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);

    await sandbox.cloudAccount.refreshAccount();
    sandbox.cloudAccount.mountPanel();

    assert.equal((panel.innerHTML.match(/<article class="cloud-campaign-card managed-campaign-card/g) || []).length, 1);
    assert.match(panel.innerHTML, /Caçada em Velen/);
    assert.match(panel.innerHTML, />Ativa</);
    assert.match(panel.innerHTML, />Dispositivo</);
    assert.match(panel.innerHTML, />Nuvem</);
    assert.match(panel.innerHTML, /Vínculo identificado · sincronização pendente/);
    assert.match(panel.innerHTML, /Nova campanha/);
    assert.equal(typeof subscription, 'function');
});

