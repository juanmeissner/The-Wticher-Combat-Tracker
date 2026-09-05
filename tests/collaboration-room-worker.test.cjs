const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

class MemoryStorage {
    constructor() { this.values = new Map(); }
    async get(key) { return this.values.get(key); }
    async put(key, value) { this.values.set(key, structuredClone(value)); }
}

class FakeContext {
    constructor() {
        this.storage = new MemoryStorage();
        this.sockets = [];
    }
    getWebSockets() { return this.sockets; }
    acceptWebSocket(socket) { this.sockets.push(socket); }
}

function campaignFixture() {
    return {
        schemaVersion: 1,
        id: 'campaign-test',
        revision: 4,
        metadata: { name: 'Teste de colaboração', masterNotes: 'segredo' },
        state: {
            combat: {
                round: 2,
                combatants: [
                    { id: 'geralt', sheetId: 'sheet-geralt', type: 'player', name: 'Geralt', inventory: [{ name: 'Espada' }], progression: { adrenaline: 1 } },
                    { id: 'ciri', sheetId: 'sheet-ciri', type: 'player', name: 'Ciri', inventory: [{ name: 'Segredo' }], progression: { adrenaline: 0 } },
                    { id: 'grifo', type: 'monster', name: 'Grifo' }
                ]
            },
            characterSheets: [
                { id: 'sheet-geralt', name: 'Geralt', privateNotes: 'oculto' },
                { id: 'sheet-ciri', name: 'Ciri' }
            ],
            preferences: { hiddenRolls: true },
            compatibility: {
                dnd_character_sheets: JSON.stringify([
                    { id: 'sheet-geralt', name: 'Geralt' },
                    { id: 'sheet-ciri', name: 'Ciri' }
                ])
            }
        }
    };
}

test('sala experimental cria mestre, exige senha e vincula jogador', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const room = new worker.CampaignRoom(ctx, { PBKDF2_ITERATIONS: '1000' });
    const createResponse = await room.fetch(new Request('https://room.test/internal/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            roomCode: 'ABC234XY',
            roomName: 'Caçada do Grifo',
            password: 'segredo-forte',
            actorName: 'Mestre',
            deviceId: 'device-master',
            campaign: campaignFixture()
        })
    }));
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.room.code, 'ABC234XY');
    assert.equal(created.member.role, 'master');
    assert.ok(created.memberToken.length > 20);
    const stored = await ctx.storage.get('room');
    assert.notEqual(stored.passwordVerifier, 'segredo-forte');

    const wrongPassword = await room.fetch(new Request('https://room.test/internal/join', {
        method: 'POST', body: JSON.stringify({ password: 'errada!', deviceId: 'device-player' })
    }));
    assert.equal(wrongPassword.status, 401);

    const chooseCharacter = await room.fetch(new Request('https://room.test/internal/join', {
        method: 'POST', body: JSON.stringify({ password: 'segredo-forte', deviceId: 'device-player' })
    }));
    assert.equal(chooseCharacter.status, 409);
    const choices = await chooseCharacter.json();
    assert.deepEqual(choices.participants.map(entry => entry.participantId), ['geralt', 'ciri']);

    const joinResponse = await room.fetch(new Request('https://room.test/internal/join', {
        method: 'POST', body: JSON.stringify({
            password: 'segredo-forte',
            participantId: 'geralt',
            actorName: 'Jogador Geralt',
            deviceId: 'device-player'
        })
    }));
    assert.equal(joinResponse.status, 200);
    const joined = await joinResponse.json();
    assert.equal(joined.member.role, 'player');
    assert.equal(joined.member.participantId, 'geralt');
    assert.deepEqual(joined.campaign.state.characterSheets.map(sheet => sheet.id), ['sheet-geralt']);
    assert.equal(joined.campaign.state.preferences, undefined);
    assert.equal(joined.campaign.metadata.masterNotes, undefined);
    assert.equal(joined.campaign.state.combat.combatants.find(entry => entry.id === 'ciri').inventory, undefined);
    assert.deepEqual(joined.campaign.state.combat.combatants.find(entry => entry.id === 'geralt').inventory, [{ name: 'Espada' }]);

    const ticketResponse = await room.fetch(new Request('https://room.test/internal/ticket', {
        method: 'POST', headers: { authorization: `Bearer ${joined.memberToken}` }
    }));
    assert.equal(ticketResponse.status, 200);
    assert.ok((await ticketResponse.json()).socketTicket.length > 20);
});

test('iterações PBKDF2 respeitam o limite aceito pelo Cloudflare Workers', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    assert.equal(worker.normalizePbkdf2Iterations(), 100_000);
    assert.equal(worker.normalizePbkdf2Iterations('120000'), 100_000);
    assert.equal(worker.normalizePbkdf2Iterations('75000'), 75_000);
    assert.equal(worker.normalizePbkdf2Iterations('500'), 1_000);
});

test('comando de recurso respeita o personagem vinculado', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const campaign = campaignFixture();
    const member = { role: 'player', participantId: 'geralt' };
    const applied = worker.applyResourceCommand(campaign, {
        type: 'participant.resource.adjust',
        targetId: 'geralt',
        payload: { resource: 'adrenaline', delta: 1 }
    }, member);
    assert.equal(applied.applied, true);
    assert.equal(applied.before, 1);
    assert.equal(applied.after, 2);
    const forbidden = worker.applyResourceCommand(campaign, {
        type: 'participant.resource.adjust',
        targetId: 'ciri',
        payload: { resource: 'adrenaline', delta: 1 }
    }, member);
    assert.equal(forbidden.reason, 'forbidden');
});
