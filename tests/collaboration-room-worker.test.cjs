const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

class MemoryStorage {
    constructor() { this.values = new Map(); this.alarm = null; }
    async get(key) { return this.values.get(key); }
    async put(key, value) { this.values.set(key, structuredClone(value)); }
    async setAlarm(value) { this.alarm = Number(value); }
    async getAlarm() { return this.alarm; }
    async deleteAlarm() { this.alarm = null; }
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

test('criação da sala exige nomes explícitos para sala e Mestre', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);

    const missingMasterRoom = new worker.CampaignRoom(new FakeContext(), { PBKDF2_ITERATIONS: '1000' });
    const missingMaster = await missingMasterRoom.fetch(new Request('https://room.test/internal/create', {
        method: 'POST',
        body: JSON.stringify({
            roomCode: 'NONAME23', roomName: 'Sala válida', actorName: '   ',
            password: 'segredo-forte', deviceId: 'master-device', campaign: campaignFixture()
        })
    }));
    assert.equal(missingMaster.status, 400);
    assert.equal((await missingMaster.json()).error, 'invalid_master_name');

    const missingRoomName = new worker.CampaignRoom(new FakeContext(), { PBKDF2_ITERATIONS: '1000' });
    const missingRoom = await missingRoomName.fetch(new Request('https://room.test/internal/create', {
        method: 'POST',
        body: JSON.stringify({
            roomCode: 'NONAME24', roomName: '', actorName: 'Mestre válido',
            password: 'segredo-forte', deviceId: 'master-device', campaign: campaignFixture()
        })
    }));
    assert.equal(missingRoom.status, 400);
    assert.equal((await missingRoom.json()).error, 'invalid_room_name');
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

test('rolagem de iniciativa do jogador atualiza somente o personagem vinculado', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const campaign = campaignFixture();
    const member = { role: 'player', participantId: 'geralt' };
    const applied = worker.applyInitiativeRoll(campaign, {
        type: 'roll.publish',
        targetId: 'geralt',
        payload: { testKind: 'initiative', naturalRoll: 17, dexterityBonus: 3, finalResult: 20 }
    }, member);
    assert.equal(applied.applied, true);
    assert.equal(applied.before, 0);
    assert.equal(applied.after, 20);
    assert.equal(campaign.state.combat.combatants.find(entry => entry.id === 'geralt').initiative, 20);

    const forbidden = worker.applyInitiativeRoll(campaign, {
        type: 'roll.publish',
        targetId: 'ciri',
        payload: { testKind: 'initiative', naturalRoll: 18, dexterityBonus: 2, finalResult: 20 }
    }, member);
    assert.equal(forbidden.reason, 'forbidden');

    const inconsistent = worker.applyInitiativeRoll(campaign, {
        type: 'roll.publish',
        targetId: 'geralt',
        payload: { testKind: 'initiative', naturalRoll: 18, dexterityBonus: 2, finalResult: 99 }
    }, member);
    assert.equal(inconsistent.reason, 'invalid-initiative');
});

test('alterações permanentes substituem somente a entidade autorizada', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const campaign = campaignFixture();
    const result = worker.applyPermanentCommand(campaign, {
        type: 'sheet.update',
        targetId: 'sheet-geralt',
        payload: { sheet: { id: 'sheet-geralt', name: 'Geralt atualizado', level: 4 } }
    });
    assert.equal(result.applied, true);
    assert.equal(campaign.state.characterSheets[0].name, 'Geralt atualizado');
    assert.equal(campaign.state.characterSheets[1].name, 'Ciri');
});

test('projeção do jogador oculta locais privados e seus descendentes', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const campaign = campaignFixture();
    campaign.state.world = {
        schemaVersion: 1,
        rootLocationId: 'world-continent',
        currentLocationId: 'world-location-secret',
        locations: [
            { id: 'world-continent', type: 'continent', parentId: null, name: 'O Continente', visibility: 'public' },
            { id: 'world-realm-public', type: 'realm', parentId: 'world-continent', name: 'Teméria', visibility: 'public' },
            { id: 'world-province-secret', type: 'province', parentId: 'world-realm-public', name: 'Base secreta', visibility: 'private' },
            { id: 'world-location-secret', type: 'location', parentId: 'world-province-secret', name: 'Laboratório', visibility: 'public' }
        ],
        npcs: [
            { id: 'npc-public', name: 'Ferreiro', visibility: 'public', currentLocationId: 'world-realm-public', privateNotes: 'Espião', movements: [], schedule: [{ id: 'public-time', visibility: 'public' }, { id: 'secret-time', visibility: 'private', privateNotes: 'Encontro secreto' }], merchant: { enabled: true, name: 'Forja', privateNotes: 'Contrabando', privateTransactions: [{ id: 'tx-secret', total: 50 }], catalog: [] } },
            { id: 'npc-secret', name: 'Informante', visibility: 'private', currentLocationId: 'world-realm-public', privateNotes: 'Contato secreto', movements: [] },
            { id: 'npc-hidden-place', name: 'Alquimista', visibility: 'public', currentLocationId: 'world-location-secret', movements: [] },
            { id: 'npc-traveler', name: 'Viajante', visibility: 'public', currentLocationId: 'world-realm-public', movements: [
                { id: 'move-secret', fromLocationId: 'world-location-secret', fromLocationName: 'Laboratório', toLocationId: 'world-realm-public', toLocationName: 'Teméria' },
                { id: 'move-public', fromLocationId: null, fromLocationName: 'Sem localização', toLocationId: 'world-realm-public', toLocationName: 'Teméria' }
            ] }
        ],
        travelHistory: [{ id: 'travel-public', visibility: 'public', toLocationId: 'world-realm-public' }, { id: 'travel-secret', visibility: 'private', toLocationId: 'world-realm-public' }],
        regionalEvents: [{ id: 'event-public', visibility: 'public', locationId: 'world-realm-public' }, { id: 'event-secret', visibility: 'private', locationId: 'world-realm-public', privateNotes: 'Emboscada' }]
    };
    const projected = worker.projectCampaignForMember(campaign, { role: 'player', participantId: 'geralt', sheetId: 'sheet-geralt' });
    assert.deepEqual(projected.state.world.locations.map(entry => entry.id), ['world-continent', 'world-realm-public']);
    assert.equal(projected.state.world.currentLocationId, null);
    assert.deepEqual(projected.state.world.npcs.map(entry => entry.id), ['npc-public', 'npc-traveler']);
    assert.equal(projected.state.world.npcs[0].privateNotes, undefined);
    assert.equal(projected.state.world.npcs[0].merchant.privateNotes, undefined);
    assert.equal(projected.state.world.npcs[0].merchant.privateTransactions, undefined);
    assert.equal(projected.state.world.npcs[0].merchant.name, 'Forja');
    assert.deepEqual(projected.state.world.npcs[0].schedule.map(entry => entry.id), ['public-time']);
    assert.deepEqual(projected.state.world.travelHistory.map(entry => entry.id), ['travel-public']);
    assert.deepEqual(projected.state.world.regionalEvents.map(entry => entry.id), ['event-public']);
    assert.deepEqual(projected.state.world.npcs[1].movements.map(entry => entry.id), ['move-public']);
    assert.equal(campaign.state.world.locations.length, 4, 'A projeção não deve alterar a campanha do mestre.');
    assert.equal(campaign.state.world.npcs.length, 4, 'A projeção não deve alterar os NPCs do mestre.');
});

test('compra online aprovada atualiza Coroas, inventário e estoque de forma atômica', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const campaign = campaignFixture();
    const geralt = campaign.state.combat.combatants.find(entry => entry.id === 'geralt');
    geralt.inventory = [{ id: 'coroa', name: 'Coroa', moneyValue: 100, quantity: 1 }];
    campaign.state.world = { npcs: [{ id: 'npc-ferreiro', merchant: {
        enabled: true, purchaseApprovalRequired: true,
        catalog: [{ id: 'entry-espada', itemId: 'espada-teste', stock: 3, enabled: true, price: 20 }],
        services: [], privateTransactions: []
    } }] };
    const result = worker.applyMerchantTransaction(campaign, {
        id: 'request-purchase-1', type: 'merchant.transaction', targetId: 'geralt',
        payload: { kind: 'item', npcId: 'npc-ferreiro', entryId: 'entry-espada', quantity: 2, unitPrice: 20, packSize: 1, item: { id: 'espada-teste', name: 'Espada de teste' } }
    });
    assert.equal(result.applied, true);
    assert.equal(geralt.inventory.find(entry => entry.id === 'coroa').moneyValue, 60);
    assert.equal(geralt.inventory.find(entry => entry.id === 'espada-teste').quantity, 2);
    assert.equal(campaign.state.world.npcs[0].merchant.catalog[0].stock, 1);
    assert.equal(campaign.state.world.npcs[0].merchant.privateTransactions[0].requestId, 'request-purchase-1');
    assert.match(campaign.state.history[0].label, /Geralt comprou Espada de teste x2/);
    assert.match(campaign.state.history[0].detail, /Total: 40 Coroas/);
});

test('proposta do jogador aguarda e registra decisão do mestre', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const room = new worker.CampaignRoom(ctx, { PBKDF2_ITERATIONS: '1000' });
    await room.ready;
    room.room = {
        campaign: campaignFixture(), sequence: 1, updatedAt: '', seenCommandIds: [],
        members: {}, tickets: {}, proposals: {}, proposalOrder: [], decisions: [],
        conflicts: {}, conflictOrder: [], activity: []
    };
    const sent = [];
    const socket = { send(value) { sent.push(JSON.parse(value)); } };
    const player = { id: 'member-geralt', actorId: 'actor-geralt', name: 'Jogador Geralt', role: 'player', participantId: 'geralt', sheetId: 'sheet-geralt' };
    const command = {
        id: 'cmd-sheet', campaignId: 'campaign-test', actorId: 'actor-geralt', deviceId: 'device-geralt',
        role: 'player', type: 'sheet.update', targetId: 'sheet-geralt', entityKey: 'sheet:sheet-geralt', baseVersion: 0,
        payload: { sheet: { id: 'sheet-geralt', name: 'Geralt aprovado', level: 5 } }
    };
    await room.createProposal(socket, player, command);
    const proposal = Object.values(room.room.proposals)[0];
    assert.equal(proposal.status, 'pending');
    assert.equal(room.room.campaign.state.characterSheets[0].name, 'Geralt');
    await room.resolveProposal(socket, { id: 'master', name: 'Mestre', role: 'master' }, {
        id: 'cmd-resolve', payload: { proposalId: proposal.id, decision: 'approved', note: 'Tudo certo.' }
    });
    assert.equal(proposal.status, 'approved');
    assert.equal(room.room.campaign.state.characterSheets[0].name, 'Geralt aprovado');
    assert.equal(room.room.decisions[0].note, 'Tudo certo.');
});

test('conflito de versão preserva as duas opções até a decisão do mestre', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const room = new worker.CampaignRoom(ctx, { PBKDF2_ITERATIONS: '1000' });
    await room.ready;
    const campaign = campaignFixture();
    campaign.entityVersions = { 'sheet:sheet-geralt': 7 };
    room.room = {
        campaign, sequence: 8, updatedAt: '', seenCommandIds: [],
        members: {}, tickets: {}, proposals: {}, proposalOrder: [], decisions: [],
        conflicts: {}, conflictOrder: [], activity: []
    };
    const sent = [];
    const socket = { send(value) { sent.push(JSON.parse(value)); } };
    const master = { id: 'member-master', actorId: 'actor-master', name: 'Mestre', role: 'master', participantId: null, sheetId: null };
    await room.handleCommand(socket, master, {
        id: 'cmd-stale', campaignId: 'campaign-test', actorId: 'actor-master', deviceId: 'device-master',
        role: 'master', type: 'sheet.update', targetId: 'sheet-geralt', entityKey: 'sheet:sheet-geralt', baseVersion: 3,
        payload: { sheet: { id: 'sheet-geralt', name: 'Versão recebida', level: 6 } }
    });
    const conflict = Object.values(room.room.conflicts)[0];
    assert.equal(conflict.status, 'pending');
    assert.equal(conflict.expectedVersion, 3);
    assert.equal(conflict.currentVersion, 7);
    assert.equal(room.room.campaign.state.characterSheets[0].name, 'Geralt');

    await room.resolveConflict(socket, master, {
        id: 'cmd-resolve-conflict',
        payload: { conflictId: conflict.id, resolution: 'incoming' }
    });
    assert.equal(conflict.status, 'resolved');
    assert.equal(conflict.resolution, 'incoming');
    assert.equal(room.room.campaign.state.characterSheets[0].name, 'Versão recebida');
    assert.equal(room.room.decisions[0].note, 'Versão recebida preservada.');
    assert.ok(sent.some(message => message.type === 'command.accepted' && message.commandId === 'cmd-stale'));
});

test('snapshot do mestre é enviado somente aos outros dispositivos', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const room = new worker.CampaignRoom(ctx, { PBKDF2_ITERATIONS: '1000' });
    await room.ready;
    const campaign = campaignFixture();
    const masterMessages = [];
    const playerMessages = [];
    const master = { id: 'member-master', actorId: 'actor-master', name: 'Mestre', role: 'master', participantId: null, sheetId: null };
    const player = { id: 'member-geralt', actorId: 'actor-geralt', name: 'Geralt', role: 'player', participantId: 'geralt', sheetId: 'sheet-geralt' };
    const masterSocket = {
        deserializeAttachment() { return master; },
        send(value) { masterMessages.push(JSON.parse(value)); }
    };
    const playerSocket = {
        deserializeAttachment() { return player; },
        send(value) { playerMessages.push(JSON.parse(value)); }
    };
    ctx.sockets = [masterSocket, playerSocket];
    room.room = {
        campaign, sequence: 3, updatedAt: '', seenCommandIds: [],
        members: { [master.id]: master, [player.id]: player }, tickets: {},
        proposals: {}, proposalOrder: [], decisions: [], conflicts: {}, conflictOrder: [], activity: []
    };

    const nextCampaign = structuredClone(campaign);
    nextCampaign.state.combat.round = 3;
    await room.webSocketMessage(masterSocket, JSON.stringify({ type: 'snapshot.publish', campaign: nextCampaign }));

    assert.ok(masterMessages.some(message => message.type === 'snapshot.accepted'));
    assert.equal(masterMessages.some(message => message.type === 'room.snapshot'), false);
    assert.equal(playerMessages.filter(message => message.type === 'room.snapshot').length, 1);
    assert.equal(playerMessages.find(message => message.type === 'room.snapshot').campaign.state.combat.round, 3);
});

test('diretório lista somente metadados de salas públicas abertas', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const directory = new worker.RoomDirectory(ctx);
    await directory.fetch(new Request('https://directory.test/internal/upsert', {
        method: 'POST',
        body: JSON.stringify({
            code: 'PUBLIC23', name: 'Caçada pública', connected: 2,
            availableCharacters: 1, discoverable: true, masterOnline: true,
            updatedAt: new Date().toISOString()
        })
    }));
    await directory.fetch(new Request('https://directory.test/internal/upsert', {
        method: 'POST',
        body: JSON.stringify({
            code: 'PRIVATE2', name: 'Sala privada', discoverable: false,
            updatedAt: new Date().toISOString()
        })
    }));
    await directory.fetch(new Request('https://directory.test/internal/upsert', {
        method: 'POST',
        body: JSON.stringify({
            code: 'OFFLINE2', name: 'Mestre desconectado', discoverable: true,
            masterOnline: false, updatedAt: new Date().toISOString()
        })
    }));
    await directory.fetch(new Request('https://directory.test/internal/upsert', {
        method: 'POST',
        body: JSON.stringify({
            code: 'STALE234', name: 'Sala abandonada', discoverable: true,
            masterOnline: true,
            updatedAt: new Date(Date.now() - 20 * 60_000).toISOString(),
            directoryHeartbeatAt: new Date(Date.now() - 20 * 60_000).toISOString()
        })
    }));
    const response = await directory.fetch(new Request('https://directory.test/internal/list'));
    const result = await response.json();
    assert.deepEqual(result.rooms, [{
        code: 'PUBLIC23', name: 'Caçada pública', connected: 2,
        availableCharacters: 1, createdAt: result.rooms[0].createdAt,
        updatedAt: result.rooms[0].updatedAt
    }]);
    assert.equal('password' in result.rooms[0], false);
    assert.equal('campaign' in result.rooms[0], false);
    const storedRooms = await ctx.storage.get('rooms');
    assert.equal('OFFLINE2' in storedRooms, false);
    assert.equal('STALE234' in storedRooms, false);
});

test('sala some do diretório sem Mestre e encerra após a janela de reconexão', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const directoryCtx = new FakeContext();
    const directory = new worker.RoomDirectory(directoryCtx);
    const room = new worker.CampaignRoom(ctx, {
        PBKDF2_ITERATIONS: '1000',
        MASTER_RECONNECT_GRACE_MS: '30000',
        ROOM_DIRECTORY: {
            idFromName() { return 'directory'; },
            get() {
                return {
                    fetch(input, init) { return directory.fetch(new Request(input, init)); }
                };
            }
        }
    });
    const created = await (await room.fetch(new Request('https://room.test/internal/create', {
        method: 'POST',
        body: JSON.stringify({
            roomCode: 'TIMEOUT2', roomName: 'Sala temporária', password: 'segredo-forte',
            actorName: 'Mestre', deviceId: 'master-device', campaign: campaignFixture()
        })
    }))).json();
    const masterMember = room.room.members[created.member.id];
    const masterSocket = {
        deserializeAttachment() { return masterMember; },
        send() {},
        close() { this.closed = true; }
    };
    const playerMessages = [];
    const playerSocket = {
        deserializeAttachment() { return { id: 'player', role: 'player', name: 'Jogador' }; },
        send(value) { playerMessages.push(JSON.parse(value)); },
        close() { this.closed = true; }
    };
    ctx.sockets = [masterSocket, playerSocket];
    await room.markMasterOnline();
    await room.persist();
    await room.syncDirectory();

    let directoryResult = await (await directory.fetch(new Request('https://directory.test/internal/list'))).json();
    assert.deepEqual(directoryResult.rooms.map(entry => entry.code), ['TIMEOUT2']);

    await room.webSocketClose(masterSocket, 1000, 'Mestre saiu');
    assert.ok(room.room.autoCloseAt);
    assert.ok(Number.isFinite(await ctx.storage.getAlarm()));
    directoryResult = await (await directory.fetch(new Request('https://directory.test/internal/list'))).json();
    assert.deepEqual(directoryResult.rooms, []);

    ctx.sockets = [playerSocket];
    room.room.autoCloseAt = new Date(Date.now() - 1).toISOString();
    await room.alarm();
    assert.ok(room.room.closedAt);
    assert.equal(room.room.closeReason, 'master_timeout');
    assert.equal(playerSocket.closed, true);
    assert.ok(playerMessages.some(message => message.type === 'room.closed' && message.reason === 'master_timeout'));
    assert.equal(await ctx.storage.getAlarm(), null);
});

test('jogador pode entrar com ficha própria e o mestre pode revogar o dispositivo e encerrar a sala', async () => {
    const moduleUrl = pathToFileURL(path.resolve(__dirname, '..', 'cloudflare', 'src', 'worker.mjs')).href;
    const worker = await import(moduleUrl);
    const ctx = new FakeContext();
    const room = new worker.CampaignRoom(ctx, { PBKDF2_ITERATIONS: '1000' });
    const created = await (await room.fetch(new Request('https://room.test/internal/create', {
        method: 'POST', body: JSON.stringify({
            roomCode: 'SHEET234', roomName: 'Nova campanha', password: 'segredo-forte',
            actorName: 'Mestre', deviceId: 'master-device', campaign: campaignFixture()
        })
    }))).json();
    const joinedResponse = await room.fetch(new Request('https://room.test/internal/join', {
        method: 'POST', body: JSON.stringify({
            password: 'segredo-forte', actorName: 'Jogador novo', deviceId: 'player-device',
            characterSheet: { id: 'local-sheet', name: 'Yennefer', hpMax: 44, stMax: 70, creationMode: 'full' }
        })
    }));
    assert.equal(joinedResponse.status, 200);
    const joined = await joinedResponse.json();
    assert.equal(joined.member.name, 'Jogador novo');
    assert.equal(joined.campaign.state.combat.combatants.find(entry => entry.id === joined.member.participantId).name, 'Yennefer');
    assert.notEqual(joined.member.sheetId, 'local-sheet');

    const masterMember = Object.values(room.room.members).find(member => member.role === 'master');
    const masterMessages = [];
    const playerMessages = [];
    const masterSocket = {
        deserializeAttachment() { return masterMember; },
        send(value) { masterMessages.push(JSON.parse(value)); },
        close() {}
    };
    const playerSocket = {
        deserializeAttachment() { return room.room.members[joined.member.id]; },
        send(value) { playerMessages.push(JSON.parse(value)); },
        close() { this.closed = true; }
    };
    ctx.sockets = [masterSocket, playerSocket];
    await room.handleCommand(masterSocket, masterMember, {
        id: 'cmd-revoke', campaignId: created.campaign.id, type: 'room.member.revoke',
        targetId: joined.member.id, payload: { memberId: joined.member.id }
    });
    assert.equal(room.room.members[joined.member.id].revoked, true);
    assert.equal(playerSocket.closed, true);
    assert.ok(playerMessages.some(message => message.type === 'room.revoked'));

    await room.handleCommand(masterSocket, masterMember, {
        id: 'cmd-close', campaignId: created.campaign.id, type: 'room.close', targetId: null, payload: {}
    });
    assert.ok(room.room.closedAt);
    assert.ok(masterMessages.some(message => message.type === 'room.closed'));
});
