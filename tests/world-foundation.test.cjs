const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const worldModel = require('../js/world/world-model.js');
const worldCommerce = require('../js/world/world-commerce.js');
const worldAtlasData = require('../js/world/world-atlas-data.js');
const worldLocationData = require('../js/world/world-location-data.js');
const worldCartographicData = require('../js/world/world-cartographic-data.js');
const worldHistoryData = require('../js/world/world-history-data.js');
const worldTime = require('../js/world/world-time.js');
const campaignStore = require('../js/campaign/campaign-store.js');
const worldStore = require('../js/world/world-store.js');

function createMemoryStorage(initial = {}) {
    const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); },
        dump() { return Object.fromEntries(values); }
    };
}

test('Fundação do Mundo migra campanhas e preserva hierarquia, IDs e local atual', () => {
    const storage = createMemoryStorage({
        dnd_combat_session: JSON.stringify({ version: 3, combatants: [], round: 1 })
    });
    campaignStore.resetForTests();
    const campaign = campaignStore.initialize({
        storage,
        installBridge: false,
        id: 'campaign-world-one',
        now: '2026-09-08T12:00:00.000Z'
    });

    assert.equal(campaign.schemaVersion, 2);
    assert.equal(campaign.state.world.schemaVersion, 10);
    assert.equal(campaign.state.world.locations[0].id, worldModel.ROOT_CONTINENT_ID);

    const realm = worldStore.createLocation({
        id: 'world-realm-temeria',
        type: worldModel.LOCATION_TYPES.REALM,
        parentId: worldModel.ROOT_CONTINENT_ID,
        name: 'Teméria'
    }, { now: '2026-09-08T12:01:00.000Z' });
    const province = worldStore.createLocation({
        id: 'world-province-vizima',
        type: worldModel.LOCATION_TYPES.PROVINCE,
        parentId: realm.id,
        name: 'Região de Vizima'
    }, { now: '2026-09-08T12:02:00.000Z' });
    const location = worldStore.createLocation({
        id: 'world-location-vizima',
        type: worldModel.LOCATION_TYPES.LOCATION,
        parentId: province.id,
        name: 'Vizima'
    }, { now: '2026-09-08T12:03:00.000Z' });
    worldStore.setCurrentLocation(location.id, { now: '2026-09-08T12:04:00.000Z' });

    assert.deepEqual(
        worldStore.getCurrentLocationPath().map(entry => entry.name),
        ['O Continente', 'Teméria', 'Região de Vizima', 'Vizima']
    );
    assert.throws(() => worldStore.createLocation({
        type: worldModel.LOCATION_TYPES.PROVINCE,
        parentId: worldModel.ROOT_CONTINENT_ID,
        name: 'Província inválida'
    }), /não é compatível/);

    storage.setItem('dnd_session_history', JSON.stringify([{ id: 'history-after-world' }]));
    const checkpoint = campaignStore.checkpoint({ now: '2026-09-08T12:05:00.000Z' });
    assert.equal(checkpoint.state.world.currentLocationId, location.id, 'Checkpoint legado não pode apagar o Mundo.');

    const exported = worldStore.exportWorld({ now: '2026-09-08T12:06:00.000Z' });
    assert.equal(exported.format, worldModel.WORLD_EXPORT_FORMAT);
    assert.equal(exported.campaign.id, campaign.id);

    campaignStore.createCampaign({
        id: 'campaign-world-two',
        name: 'Segunda campanha',
        now: '2026-09-08T12:07:00.000Z'
    });
    campaignStore.activateCampaign('campaign-world-two', { reload: false });
    assert.ok(worldStore.getWorld().locations.length > 1, 'Cada campanha deve iniciar com seu próprio Atlas político.');

    const imported = worldStore.importWorld(exported, { now: '2026-09-08T12:08:00.000Z' });
    assert.equal(imported.currentLocationId, location.id);
    assert.ok(imported.locations.some(entry => entry.id === realm.id));
    assert.ok(imported.locations.some(entry => entry.id === province.id));
    assert.ok(imported.locations.some(entry => entry.id === location.id));

    const storedCampaign = JSON.parse(storage.getItem(campaignStore.campaignStorageKey('campaign-world-two')));
    assert.equal(storedCampaign.state.world.currentLocationId, location.id);
    assert.equal(storedCampaign.state.world.locations.find(entry => entry.name === 'Vizima').id, location.id);
    campaignStore.resetForTests();
});

test('pacote de Mundo rejeita formato inválido e IDs duplicados', () => {
    assert.throws(() => worldModel.parseImportPackage({ format: 'outro', version: 1 }), /incompatível/);
    const world = worldModel.createEmptyWorld({ now: '2026-09-08T12:00:00.000Z' });
    world.locations.push({ ...world.locations[0] });
    assert.throws(() => worldModel.parseImportPackage({
        format: worldModel.WORLD_EXPORT_FORMAT,
        version: worldModel.WORLD_EXPORT_VERSION,
        world
    }), /duplicado/);
});

test('Fundação do Mundo é carregada e distribuída no cache offline', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
    assert.match(indexSource, /world\/world-model\.js[\s\S]+world\/world-atlas-data\.js[\s\S]+world\/world-location-data\.js[\s\S]+world\/world-cartographic-data\.js[\s\S]+world\/world-history-data\.js[\s\S]+campaign\/campaign-migrations\.js[\s\S]+campaign\/campaign-store\.js[\s\S]+world\/world-store\.js/);
    assert.match(workerSource, /witcher-combat-tracker-v153/);
    assert.match(workerSource, /world\/world-model\.js/);
    assert.match(workerSource, /world\/world-atlas-data\.js/);
    assert.match(workerSource, /world\/world-location-data\.js/);
    assert.match(workerSource, /world\/world-cartographic-data\.js/);
    assert.match(workerSource, /world\/world-history-data\.js/);
    assert.match(workerSource, /world\/world-store\.js/);
    assert.match(indexSource, /campaign-clock\.js[\s\S]+world\/world-commerce\.js[\s\S]+session-features\.js/);
    assert.match(workerSource, /world\/world-commerce\.js/);
    assert.match(indexSource, /world\/world-time\.js/);
    assert.match(workerSource, /world\/world-time\.js/);
});

test('Atlas político é versionado, íntegro e preserva locais personalizados', () => {
    const now = '2026-09-08T12:00:00.000Z';
    const empty = worldModel.createEmptyWorld({ now });
    const custom = worldModel.addLocation(empty, {
        id: 'world-realm-campanha-personalizada',
        type: worldModel.LOCATION_TYPES.REALM,
        parentId: worldModel.ROOT_CONTINENT_ID,
        name: 'Reino da campanha',
        origin: 'custom',
        visibility: 'private'
    }, { now }).world;
    const seeded = worldAtlasData.seedPoliticalAtlas(custom, { now });
    const seededAgain = worldAtlasData.seedPoliticalAtlas(seeded, { now });
    const political = worldAtlasData.getPoliticalEntities(seeded);
    const ids = new Set(political.map(entry => entry.id));

    assert.equal(seeded.schemaVersion, 10);
    assert.equal(seeded.politicalAtlasVersion, worldAtlasData.POLITICAL_ATLAS_VERSION);
    assert.equal(political.length, worldAtlasData.POLITICAL_ENTITIES.length);
    assert.equal(seededAgain.locations.length, seeded.locations.length, 'A semeadura precisa ser idempotente.');
    assert.ok(seeded.locations.some(entry => entry.id === 'world-realm-campanha-personalizada' && entry.visibility === 'private'));
    assert.ok(political.length >= 60, 'O Atlas deve cobrir reinos, territórios, províncias e vassalos principais.');
    assert.equal(ids.size, political.length, 'IDs políticos devem ser únicos.');
    assert.ok(political.every(entry => entry.description && entry.politicalStatus));
    assert.ok(political.every(entry => entry.sources.length && entry.sources.every(item => /^https:\/\//.test(item.url))));
    assert.ok(political.every(entry => entry.relations.every(item =>
        seeded.locations.some(target => target.id === item.targetId))));
    assert.ok(political.some(entry => entry.id === worldAtlasData.IDS.NILFGAARD && entry.politicalType === 'empire'));
    assert.ok(political.some(entry => entry.id === worldAtlasData.IDS.NOVIGRAD && entry.politicalType === 'free-city'));
    assert.ok(political.some(entry => entry.id === worldAtlasData.IDS.MAHAKAM && entry.politicalType === 'autonomous-territory'));
});

test('interface do Mundo oferece busca, categorias, relações e fontes do Atlas', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
    const cssSource = fs.readFileSync(path.join(projectRoot, 'mobile.css'), 'utf8');

    assert.match(sessionSource, /Atlas político/);
    assert.match(sessionSource, /filterWorldPoliticalAtlas/);
    assert.match(sessionSource, /Relações políticas/);
    assert.match(sessionSource, /Fontes/);
    assert.match(cssSource, /\.world-atlas-toolbar/);
    assert.match(cssSource, /\.world-political-card-body/);
});

test('catálogo canônico inclui capitais, cidades, vilarejos, fortalezas e pontos especiais', () => {
    const now = '2026-09-08T12:00:00.000Z';
    const world = worldLocationData.seedCanonicalLocations(worldModel.createEmptyWorld({ now }), { now });
    const canonical = worldLocationData.getCanonicalLocations(world);
    const ids = new Set(canonical.map(entry => entry.id));
    const categories = new Set(canonical.map(entry => entry.canonicalType));

    assert.equal(world.schemaVersion, 10);
    assert.equal(world.canonicalCatalogVersion, worldLocationData.CANONICAL_CATALOG_VERSION);
    assert.equal(canonical.length, worldLocationData.CANONICAL_LOCATIONS.length);
    assert.ok(canonical.length >= 80);
    assert.equal(ids.size, canonical.length);
    ['capital', 'city', 'village', 'fortress', 'castle', 'academy', 'island', 'ruins', 'tower', 'special-site']
        .forEach(type => assert.ok(categories.has(type), `Categoria ${type} deve estar representada.`));
    assert.ok(canonical.every(entry => entry.description && entry.canonicalStatus));
    assert.ok(canonical.every(entry => entry.sources.length && entry.sources.every(item => /^https:\/\//.test(item.url))));

    const thaneddPath = worldModel.getLocationPath(world, 'world-canonical-tor-lara').map(entry => entry.name);
    assert.deepEqual(thaneddPath, ['O Continente', 'Teméria', 'Velen', 'Ilha de Thanedd', 'Tor Lara']);
    assert.ok(canonical.some(entry => entry.id === worldLocationData.IDS.KAER_MORHEN && entry.canonicalType === 'fortress'));
    assert.ok(canonical.some(entry => entry.id === worldLocationData.IDS.NILFGAARD_CITY && entry.isCapital));
    assert.ok(canonical.some(entry => entry.id === worldLocationData.IDS.BEAUCLAIR && entry.isCapital));
});

test('semeadura de locais é idempotente e preserva coordenadas e conteúdo personalizado', () => {
    const now = '2026-09-08T12:00:00.000Z';
    const first = worldLocationData.seedCanonicalLocations(worldModel.createEmptyWorld({ now }), { now });
    const vizima = first.locations.find(entry => entry.id === worldLocationData.IDS.VIZIMA);
    vizima.coordinates = { x: 42.5, y: 31.25 };
    const withCustom = worldModel.addLocation(first, {
        id: 'world-location-estalagem-personalizada',
        type: worldModel.LOCATION_TYPES.LOCATION,
        parentId: worldLocationData.IDS.VIZIMA,
        name: 'Estalagem da campanha',
        origin: 'custom'
    }, { now }).world;
    const second = worldLocationData.seedCanonicalLocations(withCustom, { now });

    assert.equal(second.locations.length, withCustom.locations.length);
    assert.deepEqual(second.locations.find(entry => entry.id === worldLocationData.IDS.VIZIMA).coordinates, { x: 42.5, y: 31.25 });
    assert.ok(second.locations.some(entry => entry.id === 'world-location-estalagem-personalizada'));
});

test('interface do Mundo oferece catálogo de locais pesquisável e filtrável', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');

    assert.match(sessionSource, /Canônicos, cartográficos e da campanha/);
    assert.match(sessionSource, /filterWorldCanonicalCatalog/);
    assert.match(sessionSource, /worldLocationType/);
    assert.match(sessionSource, /Locais v/);
});

test('camada cartográfica preserva assentamentos do mapa, coordenadas e confiabilidade', () => {
    const now = '2026-09-08T12:00:00.000Z';
    const first = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld({ now }), { now });
    const second = worldCartographicData.seedCartographicLocations(first, { now });
    const cartographic = worldCartographicData.getCartographicLocations(first);
    const ids = new Set(cartographic.map(entry => entry.id));
    const knownIds = new Set(first.locations.map(entry => entry.id));
    const confidence = new Set(cartographic.map(entry => entry.cartographicConfidence));

    assert.equal(first.schemaVersion, 10);
    assert.equal(first.cartographicCatalogVersion, worldCartographicData.CARTOGRAPHIC_CATALOG_VERSION);
    assert.equal(cartographic.length, worldCartographicData.CARTOGRAPHIC_LOCATIONS.length);
    assert.ok(cartographic.length >= 80);
    assert.equal(ids.size, cartographic.length);
    assert.equal(second.locations.length, first.locations.length, 'A semeadura cartográfica precisa ser idempotente.');
    assert.ok(cartographic.every(entry => entry.cartographicStatus === 'map-only'));
    assert.ok(cartographic.every(entry => knownIds.has(entry.parentId)));
    assert.ok(cartographic.every(entry => Number.isFinite(entry.coordinates?.x)
        && entry.coordinates.x >= 0 && entry.coordinates.x <= 100
        && Number.isFinite(entry.coordinates?.y)
        && entry.coordinates.y >= 0 && entry.coordinates.y <= 100));
    ['high', 'medium', 'low'].forEach(level => assert.ok(confidence.has(level)));
    assert.equal(worldCartographicData.MAP_REFERENCE.coordinateSystem, 'percent');
});

test('locais personalizados são editáveis e não alteram o catálogo oficial', () => {
    const storage = createMemoryStorage();
    campaignStore.resetForTests();
    campaignStore.initialize({ storage, installBridge: false, id: 'campaign-custom-location' });

    const created = worldStore.createLocation({
        type: worldModel.LOCATION_TYPES.LOCATION,
        parentId: worldAtlasData.IDS.TEMERIA,
        name: 'Aldeia do Carvalho',
        customType: 'village',
        visibility: 'private',
        coordinates: { x: 35.4, y: 27.8 }
    });
    assert.equal(created.origin, 'custom');
    assert.deepEqual(created.coordinates, { x: 35.4, y: 27.8 });

    const updated = worldStore.updateLocation(created.id, { description: 'Criada pelo mestre.' });
    assert.equal(updated.description, 'Criada pelo mestre.');
    assert.throws(() => worldStore.updateLocation(worldLocationData.IDS.VIZIMA, { name: 'Outro nome' }), /somente leitura/);
    assert.throws(() => worldStore.removeLocation(worldCartographicData.CARTOGRAPHIC_LOCATIONS[0].id), /somente leitura/);

    assert.deepEqual(worldStore.removeLocation(created.id), [created.id]);
    assert.equal(worldModel.getLocation(worldStore.getWorld(), created.id), null);
    assert.ok(worldModel.getLocation(worldStore.getWorld(), worldLocationData.IDS.VIZIMA));
    campaignStore.resetForTests();
});

test('interface reúne camadas canônica, cartográfica e personalizada com filtros próprios', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
    const cssSource = fs.readFileSync(path.join(projectRoot, 'mobile.css'), 'utf8');

    assert.match(sessionSource, /Somente no mapa/);
    assert.match(sessionSource, /getWorldReliabilityLabel/);
    assert.match(sessionSource, /worldLocationLayer/);
    assert.match(sessionSource, /worldLocationConfidence/);
    assert.match(sessionSource, /openWorldLocationEditor/);
    assert.match(sessionSource, /requestDeleteWorldLocation/);
    assert.match(sessionSource, /não altera o catálogo oficial/);
    assert.match(cssSource, /\.world-location-editor/);
    assert.match(cssSource, /\.world-cartographic-facts/);
});

test('NPCs preservam perfil, localização atual e histórico cronológico de deslocamentos', () => {
    const now = '2026-09-09T12:00:00.000Z';
    let world = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld({ now }), { now });
    const createdResult = worldModel.addNpc(world, {
        id: 'world-npc-vesemir',
        name: 'Vesemir',
        profession: 'Bruxo',
        faction: 'Escola do Lobo',
        relationship: 'allied',
        publicInfo: 'Um bruxo veterano.',
        privateNotes: 'Informação exclusiva do mestre.',
        currentLocationId: worldLocationData.IDS.KAER_MORHEN
    }, {
        now,
        chronology: { year: 1276, era: 'DR', month: 1, day: 3, hour: 8, minute: 15, campaignMinute: 2895 }
    });
    world = createdResult.world;
    assert.equal(createdResult.npc.movements.length, 1);
    assert.equal(createdResult.npc.movements[0].toLocationName, 'Kaer Morhen');

    const updatedResult = worldModel.updateNpc(world, createdResult.npc.id, {
        profession: 'Mestre bruxo',
        currentLocationId: worldLocationData.IDS.NOVIGRAD
    }, { now: '2026-09-09T12:01:00.000Z' });
    world = updatedResult.world;
    assert.equal(updatedResult.npc.profession, 'Mestre bruxo');
    assert.equal(updatedResult.npc.currentLocationId, worldLocationData.IDS.KAER_MORHEN, 'Editar o perfil não pode mover o NPC sem histórico.');

    const movedResult = worldModel.moveNpc(world, createdResult.npc.id, worldLocationData.IDS.NOVIGRAD, {
        now: '2026-09-09T12:02:00.000Z',
        note: 'Viajou para encontrar o grupo.',
        chronology: { year: 1276, era: 'DR', month: 1, day: 5, hour: 14, minute: 30, campaignMinute: 6150 }
    });
    world = movedResult.world;
    assert.equal(movedResult.npc.currentLocationId, worldLocationData.IDS.NOVIGRAD);
    assert.equal(movedResult.npc.movements.length, 2);
    assert.equal(movedResult.movement.fromLocationName, 'Kaer Morhen');
    assert.equal(movedResult.movement.toLocationName, 'Novigrad');
    assert.equal(movedResult.movement.chronology.year, 1276);
    assert.equal(worldModel.moveNpc(world, createdResult.npc.id, worldLocationData.IDS.NOVIGRAD).movement, null);

    const exported = worldModel.buildExportPackage(world, { now });
    const imported = worldModel.parseImportPackage(exported, { now });
    assert.equal(worldModel.getNpc(imported, createdResult.npc.id).movements.length, 2);
    assert.equal(worldModel.removeNpc(imported, createdResult.npc.id).world.npcs.length, 0);
});

test('remoção de local personalizado desloca NPC para local indefinido sem apagar seu histórico', () => {
    const now = '2026-09-09T12:00:00.000Z';
    let world = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld({ now }), { now });
    const custom = worldModel.addLocation(world, {
        id: 'world-location-acampamento-npc', type: 'location', parentId: worldAtlasData.IDS.TEMERIA,
        name: 'Acampamento oculto', origin: 'custom'
    }, { now });
    world = custom.world;
    world = worldModel.addNpc(world, {
        id: 'world-npc-viajante', name: 'Viajante', currentLocationId: custom.location.id
    }, { now }).world;
    const removed = worldModel.removeLocation(world, custom.location.id, {
        now: '2026-09-09T13:00:00.000Z',
        chronology: { year: 1276, era: 'DR', month: 1, day: 1, hour: 9, minute: 0 }
    }).world;
    const npc = worldModel.getNpc(removed, 'world-npc-viajante');
    assert.equal(npc.currentLocationId, null);
    assert.equal(npc.movements.at(-1).fromLocationName, 'Acampamento oculto');
    assert.equal(npc.movements.at(-1).toLocationName, 'Sem localização');
});

test('interface do Mundo gerencia NPCs e separa informações públicas das notas do mestre', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
    const cssSource = fs.readFileSync(path.join(projectRoot, 'mobile.css'), 'utf8');
    assert.match(sessionSource, /Gerenciamento de NPCs/);
    assert.match(sessionSource, /openWorldNpcEditor/);
    assert.match(sessionSource, /Informações públicas/);
    assert.match(sessionSource, /Anotações privadas do mestre/);
    assert.match(sessionSource, /Histórico de deslocamentos/);
    assert.match(sessionSource, /filterWorldNpcs/);
    assert.match(cssSource, /\.world-npc-editor/);
    assert.match(cssSource, /\.world-npc-movements/);
});

test('comerciantes preservam catálogo individual, preços, serviços e regras de reposição', () => {
    const now = '2026-09-09T12:00:00.000Z';
    let world = worldModel.createEmptyWorld({ now });
    world = worldModel.addNpc(world, {
        id: 'world-npc-ferreiro',
        name: 'Hattori',
        profession: 'Ferreiro',
        merchant: {
            name: 'Lâminas de Novigrad',
            category: 'blacksmith',
            negotiationDifficulty: 18,
            discountPercent: 15,
            buybackPercent: 50,
            restockMode: 'daily',
            lastRestockMinute: 1000,
            catalog: [{ id: 'sword-stock', itemId: 'espada', stock: 1, maximumStock: 5, price: 120, restockQuantity: 2 }],
            services: [{ id: 'repair-service', name: 'Reparo', price: 30, unlimited: false, stock: 0, maximumStock: 2, restockQuantity: 1 }]
        }
    }, { now }).world;

    const merchant = worldModel.getNpc(world, 'world-npc-ferreiro').merchant;
    assert.equal(merchant.category, 'blacksmith');
    assert.equal(merchant.catalog[0].price, 120);
    assert.equal(merchant.buybackPercent, 50);
    assert.equal(merchant.services[0].name, 'Reparo');
    assert.equal(worldModel.normalizeWorld(world, { now }).npcs[0].merchant.name, 'Lâminas de Novigrad');

    const firstRestock = worldCommerce.restockMerchant(merchant, { beforeMinute: 1000, afterMinute: 2440 });
    assert.equal(firstRestock.cycles, 1);
    assert.equal(firstRestock.merchant.catalog[0].stock, 3);
    assert.equal(firstRestock.merchant.services[0].stock, 1);
    const repeated = worldCommerce.restockMerchant(firstRestock.merchant, { beforeMinute: 1000, afterMinute: 2440 });
    assert.equal(repeated.cycles, 0, 'O mesmo intervalo não pode repor a loja duas vezes.');

    const consumed = worldCommerce.consumeMerchantEntry(firstRestock.merchant, 'item', 'sword-stock', 2);
    assert.equal(consumed.consumed, true);
    assert.equal(consumed.merchant.catalog[0].stock, 1);
    assert.equal(worldCommerce.consumeMerchantEntry(consumed.merchant, 'item', 'sword-stock', 2).reason, 'insufficient-stock');
});

test('Negócios aplica somente o desconto configurado quando o teste vence o ND', () => {
    const success = worldCommerce.resolveBusinessNegotiation({ naturalRoll: 14, skillTotal: 6, difficulty: 18, discountPercent: 15 });
    const failure = worldCommerce.resolveBusinessNegotiation({ naturalRoll: 5, skillTotal: 6, difficulty: 18, discountPercent: 15 });
    assert.equal(success.success, true);
    assert.equal(success.discountPercent, 15);
    assert.equal(worldCommerce.resolveBusinessNegotiation({ naturalRoll: 20, skillTotal: 0, difficulty: 18, discountPercent: 15 }).luckDiceGained, 1);
    assert.equal(failure.success, false);
    assert.equal(failure.discountPercent, 0);
    assert.equal(worldCommerce.calculateDiscountedPrice(120, success.discountPercent), 102);
    assert.equal(worldCommerce.calculateBuybackPrice(120, 50, success.discountPercent), 69);
    assert.equal(worldCommerce.resolveBusinessNegotiation({ naturalRoll: 21, skillTotal: 6, difficulty: 18 }).valid, false);
});

test('vendas devolvem produtos ao estoque e preservam o histórico privado da loja', () => {
    const merchant = worldModel.normalizeMerchant({
        name: 'Loja de teste',
        buybackPercent: 0,
        catalog: [{ id: 'existing', itemId: 'espada', stock: 1, maximumStock: 1, price: 100 }]
    });
    assert.equal(merchant.buybackPercent, 0, 'Uma loja pode desativar a recompra sem retornar ao padrão.');
    const received = worldCommerce.receiveMerchantItem(merchant, 'espada', 2, 100);
    assert.equal(received.received, true);
    assert.equal(received.entry.stock, 3);
    assert.equal(received.entry.maximumStock, 3);

    const newItem = worldCommerce.receiveMerchantItem(received.merchant, 'pocao', 1, 25);
    assert.equal(newItem.entry.price, 25);
    assert.equal(newItem.entry.restockQuantity, 0);
    const recorded = worldCommerce.appendMerchantTransaction(newItem.merchant, {
        type: 'sale', buyerId: 'geralt', buyerName: 'Geralt', itemId: 'pocao', itemName: 'Poção',
        quantity: 1, acquisitionUnits: 1, unitPrice: 12, total: 12
    });
    assert.equal(recorded.merchant.privateTransactions.length, 1);
    assert.equal(recorded.transaction.type, 'sale');
    assert.equal(recorded.transaction.total, 12);
});

test('interface do Mundo oferece diretório, editor, compras, serviços e negociação de comerciantes', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
    const commerceSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-commerce.js'), 'utf8');
    const inventorySource = fs.readFileSync(path.join(projectRoot, 'js', 'inventory.js'), 'utf8');
    const cssSource = fs.readFileSync(path.join(projectRoot, 'mobile.css'), 'utf8');
    assert.match(sessionSource, />Lojas</);
    assert.match(sessionSource, /Comerciantes e lojas/);
    assert.match(sessionSource, /filterWorldMerchants/);
    assert.match(commerceSource, /CATÁLOGO INDIVIDUAL/);
    assert.match(commerceSource, /TESTE DE NEGÓCIOS/);
    assert.match(commerceSource, /world-merchant-restock/);
    assert.match(commerceSource, /purchaseWorldMerchantItem/);
    assert.match(commerceSource, /hireWorldMerchantService/);
    assert.match(commerceSource, /VENDER DO INVENTÁRIO/);
    assert.match(commerceSource, /HISTÓRICO DA LOJA/);
    assert.match(commerceSource, /sellWorldMerchantItem/);
    assert.match(inventorySource, /purchaseCurrentInventoryItem/);
    assert.match(inventorySource, /sellCurrentInventoryItem/);
    assert.match(cssSource, /\.world-merchant-shop-dialog/);
});

test('camada histórica resolve governo, controle e estado conforme ano e era', () => {
    const now = '2026-09-08T12:00:00.000Z';
    const world = worldHistoryData.seedHistoricalLayer(
        worldLocationData.seedCanonicalLocations(worldModel.createEmptyWorld({ now }), { now }),
        { now }
    );
    const seededAgain = worldHistoryData.seedHistoricalLayer(world, { now });

    assert.equal(world.schemaVersion, 10);
    assert.equal(world.historicalCatalogVersion, worldHistoryData.HISTORY_CATALOG_VERSION);
    assert.equal(seededAgain.locations.length, world.locations.length);
    assert.ok(worldHistoryData.SITUATIONS.length >= 25);
    assert.ok(worldHistoryData.EVENTS.length >= 12);

    const knownIds = new Set(world.locations.map(entry => entry.id));
    assert.ok(worldHistoryData.SITUATIONS.every(entry => knownIds.has(entry.targetId)));
    assert.ok(worldHistoryData.EVENTS.every(entry => entry.affectedIds.every(id => knownIds.has(id))));

    const cintraBefore = worldHistoryData.getActiveSituation(worldAtlasData.IDS.CINTRA, {
        year: 1262, era: 'DR', month: 6, day: 1
    });
    const cintraOccupied = worldHistoryData.getActiveSituation(worldAtlasData.IDS.CINTRA, {
        year: 1263, era: 'DR', month: 6, day: 1
    });
    assert.match(cintraBefore.ruler, /Calanthe/);
    assert.equal(cintraOccupied.controllerId, worldAtlasData.IDS.NILFGAARD);
    assert.match(cintraOccupied.physicalStatus, /Devastado/);

    const warSnapshot = worldHistoryData.getHistoricalSnapshot(world, {
        year: 1267, era: 'DR', month: 8, day: 1
    });
    assert.ok(warSnapshot.activeEvents.some(entry => entry.id === 'world-history-event-second-northern-war'));
    assert.match(
        warSnapshot.situations.find(entry => entry.targetId === worldAtlasData.IDS.AEDIRN).politicalStatus,
        /Ocupação/
    );

    const gameSnapshot = worldHistoryData.getHistoricalSnapshot(world, {
        year: 1276, era: 'DR', month: 1, day: 1
    }, { continuity: 'games' });
    assert.ok(gameSnapshot.activeEvents.some(entry => entry.id === 'world-history-event-third-northern-war'));
    assert.match(gameSnapshot.situations.find(entry => entry.targetId === worldAtlasData.IDS.KAEDWEN).sovereignty, /Redânia/);
});

test('cronologia histórica ordena AR antes de DR e preserva precisão informada', () => {
    const ar = worldHistoryData.moment(1, 'AR');
    const dr = worldHistoryData.moment(1, 'DR');
    assert.ok(worldHistoryData.compareMoments(ar, dr) < 0);
    assert.equal(worldHistoryData.formatMoment(worldHistoryData.moment(1267, 'DR', 7, 1, 'month')), '07/1267 DR');
    assert.equal(worldHistoryData.formatMoment(worldHistoryData.moment(1268, 'DR', 4, 2, 'day')), '02/04/1268 DR');
});

test('interface do Mundo apresenta situação histórica vinculada ao calendário', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
    const cssSource = fs.readFileSync(path.join(projectRoot, 'mobile.css'), 'utf8');

    assert.match(sessionSource, /Situação territorial/);
    assert.match(sessionSource, /filterWorldHistory/);
    assert.match(sessionSource, /DATA DA CAMPANHA/);
    assert.match(sessionSource, /getDateParts/);
    assert.match(sessionSource, /Desfechos variáveis/);
    assert.match(cssSource, /\.world-history-date-banner/);
    assert.match(cssSource, /\.world-history-facts/);
});

test('Etapa 9 registra viagens, rotinas, funcionamento e eventos regionais sem duplicar ocorrências', () => {
    const now = '2026-09-09T12:00:00.000Z';
    let world = worldLocationData.seedCanonicalLocations(worldModel.createEmptyWorld({ now }), { now });
    world = worldModel.setCurrentLocation(world, worldLocationData.IDS.VIZIMA, { now });
    const npc = worldModel.addNpc(world, {
        id: 'world-npc-ferreiro-tempo', name: 'Ferreiro', currentLocationId: worldLocationData.IDS.VIZIMA,
        schedule: [{ id: 'schedule-forja', label: 'Trabalha na forja', weekdays: [3], startsAt: '08:00', endsAt: '18:00' }],
        merchant: { enabled: true, name: 'Forja', openingSchedule: { enabled: true, weekdays: [3], opensAt: '08:00', closesAt: '18:00' } }
    }, { now }).npc;
    world = worldModel.addNpc(world, npc, { now }).world;

    const eventResult = worldModel.upsertRegionalEvent(world, {
        id: 'world-event-feira', title: 'Feira de Vizima', locationId: worldLocationData.IDS.VIZIMA,
        startMinute: 1000, endMinute: 1120, recurrence: 'daily', visibility: 'public'
    }, { now });
    world = eventResult.world;
    const travel = worldModel.recordTravel(world, {
        toLocationId: worldLocationData.IDS.NOVIGRAD, departureMinute: 900,
        arrivalMinute: 1020, durationMinutes: 120, movedNpcIds: [npc.id]
    }, { now });

    assert.equal(travel.world.currentLocationId, worldLocationData.IDS.NOVIGRAD);
    assert.equal(travel.world.travelHistory.length, 1);
    assert.equal(travel.travel.durationMinutes, 120);
    assert.deepEqual(worldTime.getEventOccurrenceMinutes(eventResult.event, 900, 2500), [1000, 2440]);
    const clock = { getDateParts: () => ({ weekday: 3, hour: 10, minute: 0 }) };
    assert.equal(worldTime.isScheduleActive(npc.schedule[0], 0, clock), true);
    assert.equal(worldTime.isScheduleActive(npc.merchant.openingSchedule, 0, clock), true);
    assert.equal(worldTime.hasTravelAbility({ learnedAbilityIds: ['portal_vertical'] }, 'portal_vertical'), true);
    assert.equal(worldTime.getTravelCapacity('foot'), 0);
    assert.equal(worldTime.getTravelCapacity('horse'), 1);
    assert.equal(worldTime.getTravelCapacity('carriage'), Number.POSITIVE_INFINITY);
    assert.equal(worldTime.getTravelCapacity('portal'), Number.POSITIVE_INFINITY);
    assert.ok(worldTime.getTransportOptions({ learnedAbilityIds: ['portal_vertical'] })
        .some(option => option.mode === 'portal' && option.passengerLimit === Number.POSITIVE_INFINITY));
});

test('interface da Etapa 9 inclui viagem, agenda regional, horários de NPC e funcionamento de lojas', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
    const commerceSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-commerce.js'), 'utf8');
    const timeSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-time.js'), 'utf8');
    assert.match(sessionSource, /Planejar viagem/);
    assert.match(sessionSource, /AGENDA DO MUNDO/);
    assert.match(sessionSource, /openWorldNpcScheduleEditor/);
    assert.match(commerceSource, /Compras online exigem aprovação do mestre/);
    assert.match(commerceSource, /Loja fechada/);
    assert.match(timeSource, /world-time-and-regional-events/);
});
