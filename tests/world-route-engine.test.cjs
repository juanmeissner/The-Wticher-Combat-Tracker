const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const roads = require('../js/world/world-road-data.js');
const routeEngine = require('../js/world/world-route-engine.js');
const worldModel = require('../js/world/world-model.js');
const worldTime = require('../js/world/world-time.js');

function node(id, x, y, locationId = null) {
    return { id, name: id, point: { x, y }, type: 'location', locationId };
}

function segment(id, from, to, points, options = {}) {
    return { id, name: id, fromNodeId: from, toNodeId: to, type: options.type || 'main', carriageAllowed: options.carriageAllowed !== false, points };
}

function location(id, x, y) {
    return { id, name: id, coordinates: { x: x / 2880 * 100, y: y / 4096 * 100 } };
}

const nodes = [
    node('a', 100, 100, 'origin'),
    node('b', 200, 100),
    node('c', 300, 100, 'destination'),
    node('d', 200, 180)
];
const segments = [
    segment('ab', 'a', 'b', [{ x: 100, y: 100 }, { x: 200, y: 100 }]),
    segment('bc', 'b', 'c', [{ x: 200, y: 100 }, { x: 300, y: 100 }]),
    segment('ad', 'a', 'd', [{ x: 100, y: 100 }, { x: 200, y: 180 }]),
    segment('dc', 'd', 'c', [{ x: 200, y: 180 }, { x: 300, y: 100 }])
];

test('A* encontra o menor caminho viário e expõe o algoritmo utilizado', () => {
    const route = roads.findShortestRoute('a', 'c', { nodes, segments });
    assert.equal(route.algorithm, 'astar');
    assert.deepEqual(route.nodeIds, ['a', 'b', 'c']);
    assert.deepEqual(route.segmentIds, ['ab', 'bc']);
});

test('escala da campanha recalibra distâncias e durações sem alterar a geometria', () => {
    const input = {
        origin: location('origin', 100, 100),
        destination: location('destination', 300, 100),
        mode: 'foot', movement: 10, nodes, segments
    };
    const standard = routeEngine.planRoute({ ...input, mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 100 } });
    const calibrated = routeEngine.planRoute({ ...input, mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 50 } });
    assert.equal(standard.ok, true);
    assert.equal(calibrated.ok, true);
    assert.ok(Math.abs(calibrated.distanceKm - standard.distanceKm / 2) <= 0.1);
    assert.ok(calibrated.durationMinutes <= Math.ceil(standard.durationMinutes / 2) + 1);
    assert.deepEqual(calibrated.points, standard.points);
});

test('pé, cavalo, carruagem e Portal Vertical respeitam suas regras de deslocamento', () => {
    const input = {
        origin: location('origin', 100, 100),
        destination: location('destination', 300, 100),
        nodes, segments,
        mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 100 }
    };
    const foot = routeEngine.planRoute({ ...input, mode: 'foot', movement: 10 });
    const horse = routeEngine.planRoute({ ...input, mode: 'horse', movement: 12 });
    const carriage = routeEngine.planRoute({ ...input, mode: 'carriage', movement: 10 });
    const portal = routeEngine.planRoute({ ...input, mode: 'portal', movement: 0 });
    assert.equal(foot.algorithm, 'astar');
    assert.equal(foot.usesRoads, true);
    assert.equal(foot.usesOffRoad, false);
    assert.equal(foot.offRoadDistanceKm, 0);
    assert.ok(horse.durationMinutes < foot.durationMinutes);
    assert.equal(horse.usesRoads, true);
    assert.equal(horse.usesOffRoad, false);
    assert.equal(carriage.ok, true);
    assert.equal(carriage.offRoadDistanceKm, 0);
    assert.deepEqual(carriage.segmentIds, ['ab', 'bc']);
    assert.equal(portal.ok, true);
    assert.equal(portal.algorithm, 'portal');
    assert.equal(portal.durationMinutes, 1);
    assert.equal(portal.usesRoads, false);
    assert.deepEqual(portal.segmentIds, []);

    const blocked = routeEngine.planRoute({
        ...input,
        mode: 'carriage',
        segments: segments.map(entry => ['bc', 'dc'].includes(entry.id) ? { ...entry, carriageAllowed: false } : entry)
    });
    assert.equal(blocked.ok, false);
    assert.match(blocked.error, /carruagem/i);
});

test('viagem a pé nunca ultrapassa 4 km por hora', () => {
    assert.equal(routeEngine.getTravelSpeedKmh('foot', 10, 'regional'), 4);
    assert.equal(routeEngine.getTravelSpeedKmh('foot', 15, 'main'), 4);
    assert.ok(routeEngine.getTravelSpeedKmh('foot', 5, 'mountain') < 4);
    assert.ok(routeEngine.getTravelSpeedKmh('horse', 15, 'main') > 4);
    assert.ok(routeEngine.getTravelSpeedKmh('carriage', 15, 'main') > 4);
});

test('viagens físicas são bloqueadas quando os locais não possuem uma estrada contínua', () => {
    const isolatedNodes = [...nodes, node('isolated', 520, 420, 'isolated')];
    const input = {
        origin: location('origin', 100, 100),
        destination: location('isolated', 520, 420),
        nodes: isolatedNodes,
        segments,
        mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 100 }
    };

    for (const mode of ['foot', 'horse', 'carriage']) {
        const result = routeEngine.planRoute({ ...input, mode, movement: 10 });
        assert.equal(result.ok, false, `${mode} não deve criar uma linha direta fora das estradas`);
        assert.match(result.error, /rota contínua/i);
    }

    const portal = routeEngine.planRoute({ ...input, mode: 'portal' });
    assert.equal(portal.ok, true);
    assert.equal(portal.algorithm, 'portal');
    assert.deepEqual(portal.segmentIds, []);
});

test('grupo usa uma única rota e chega no ritmo do transporte mais lento', () => {
    const input = {
        origin: location('origin', 100, 100),
        destination: location('destination', 300, 100),
        nodes,
        segments,
        mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 100 }
    };
    const horse = routeEngine.planRoute({ ...input, mode: 'horse', movement: 10 });
    const carriage = routeEngine.planRoute({ ...input, mode: 'carriage', movement: 10 });
    const group = routeEngine.planGroupRoute({
        ...input,
        units: [
            { id: 'horse-geralt', mode: 'horse', movement: 10, label: 'Carpeado', ownerName: 'Geralt' },
            { id: 'carriage-ciri', mode: 'carriage', movement: 10, label: 'Carruagem de Ciri', ownerName: 'Ciri' }
        ]
    });

    assert.equal(group.ok, true);
    assert.equal(group.mode, 'group');
    assert.equal(group.limitingUnit.mode, 'carriage');
    assert.equal(group.durationMinutes, carriage.durationMinutes);
    assert.ok(group.durationMinutes > horse.durationMinutes);
    assert.equal(group.carriageRestricted, true);
    assert.equal(group.offRoadDistanceKm, 0);
    assert.deepEqual(group.segmentIds, carriage.segmentIds);
});

test('presença de carruagem impede o grupo de usar atalhos incompatíveis', () => {
    const restrictedSegments = segments.map(entry => entry.id === 'bc' ? { ...entry, carriageAllowed: false } : entry);
    const result = routeEngine.planGroupRoute({
        origin: location('origin', 100, 100),
        destination: location('destination', 300, 100),
        nodes,
        segments: restrictedSegments,
        mapSettings: { pixelsPerGrid: 576, kilometersPerGrid: 100 },
        units: [
            { id: 'horse', mode: 'horse', movement: 12 },
            { id: 'carriage', mode: 'carriage', movement: 10 }
        ]
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.segmentIds, ['ad', 'dc']);
});

test('composição do grupo valida carona no cavalo e preserva uma única unidade de ritmo', () => {
    const geralt = { id: 'hero-1', name: 'Geralt' };
    const ciri = { id: 'hero-2', name: 'Ciri' };
    const selection = {
        assignments: [
            {
                ownerEntry: { key: 'combat:hero-1', owner: geralt },
                owner: geralt,
                option: { value: 'horse:roach', mode: 'horse', movement: 12, assetId: 'roach', name: 'Carpeado', label: 'Carpeado' }
            },
            {
                ownerEntry: { key: 'combat:hero-2', owner: ciri },
                owner: ciri,
                option: { value: 'passenger|horse|combat%3Ahero-1|roach', mode: 'passenger', targetMode: 'horse', targetOwnerKey: 'combat:hero-1', targetOwnerId: 'hero-1', targetOwnerName: 'Geralt', assetId: 'roach', name: 'Carpeado' }
            }
        ]
    };
    const party = worldTime.resolveTravelParty(selection);
    assert.equal(party.ok, true);
    assert.equal(party.units.length, 1);
    assert.equal(party.units[0].mode, 'horse');
    assert.equal(party.travelers[1].transportRole, 'passenger');
    assert.equal(party.travelers[1].transportOwnerName, 'Geralt');

    const yennefer = { id: 'hero-3', name: 'Yennefer' };
    const overCapacity = worldTime.resolveTravelParty({
        assignments: [...selection.assignments, {
            ownerEntry: { key: 'combat:hero-3', owner: yennefer },
            owner: yennefer,
            option: { value: 'passenger|horse|combat%3Ahero-1|roach', mode: 'passenger', targetMode: 'horse', targetOwnerKey: 'combat:hero-1', targetOwnerId: 'hero-1', targetOwnerName: 'Geralt', assetId: 'roach', name: 'Carpeado' }
        }]
    });
    assert.equal(overCapacity.ok, false);
    assert.match(overCapacity.error, /somente um passageiro/i);
});

test('Mundo migra a escala padrão e preserva os detalhes calculados da viagem', () => {
    let world = worldModel.createEmptyWorld({ now: '2026-09-10T00:00:00.000Z' });
    assert.deepEqual(world.mapSettings, { pixelsPerGrid: 576, kilometersPerGrid: 100, scaleVersion: 2 });
    assert.deepEqual(
        worldModel.normalizeMapSettings({ pixelsPerGrid: 576, kilometersPerGrid: 390 }),
        { pixelsPerGrid: 576, kilometersPerGrid: 100, scaleVersion: 2 }
    );
    assert.deepEqual(
        worldModel.normalizeMapSettings({ pixelsPerGrid: 576, kilometersPerGrid: 210.5 }),
        { pixelsPerGrid: 576, kilometersPerGrid: 210.5, scaleVersion: 2 }
    );
    world.locations.push(
        { ...worldModel.normalizeLocation({ id: 'origin', type: 'location', parentId: worldModel.ROOT_CONTINENT_ID, name: 'Origem', coordinates: { x: 10, y: 10 } }) },
        { ...worldModel.normalizeLocation({ id: 'destination', type: 'location', parentId: worldModel.ROOT_CONTINENT_ID, name: 'Destino', coordinates: { x: 20, y: 20 } }) }
    );
    world.currentLocationId = 'origin';
    world.mapSettings = { pixelsPerGrid: 576, kilometersPerGrid: 210.5 };
    const result = worldModel.recordTravel(world, {
        toLocationId: 'destination', durationMinutes: 180, transportMode: 'group', transportLabel: 'Grupo misto · ritmo de Carruagem',
        travelerId: 'hero-1', travelerName: 'Geralt',
        travelers: [
            { id: 'hero-1', name: 'Geralt', role: 'leader', transportMode: 'horse', transportRole: 'driver', transportAssetId: 'mount-1', transportLabel: 'Carpeado', transportOwnerId: 'hero-1', transportOwnerName: 'Geralt' },
            { id: 'hero-2', name: 'Ciri', role: 'companion', transportMode: 'carriage', transportRole: 'passenger', transportAssetId: 'vehicle-1', transportLabel: 'Passageiro em Carruagem', transportOwnerId: 'hero-3', transportOwnerName: 'Yennefer' }
        ], distanceKm: 28.4,
        roadDistanceKm: 21, offRoadDistanceKm: 7.4, routeNodeIds: ['a', 'b'], routeSegmentIds: ['ab'],
        routeAlgorithm: 'astar', scaleKilometersPerGrid: 210.5
    });
    assert.equal(result.travel.transportMode, 'group');
    assert.equal(result.travel.transportLabel, 'Grupo misto · ritmo de Carruagem');
    assert.equal(result.travel.distanceKm, 28.4);
    assert.equal(result.travel.routeAlgorithm, 'astar');
    assert.deepEqual(result.travel.travelers.map(entry => entry.name), ['Geralt', 'Ciri']);
    assert.equal(result.travel.travelers[0].transportLabel, 'Carpeado');
    assert.equal(result.travel.travelers[1].transportRole, 'passenger');
    assert.equal(result.travel.travelers[1].transportOwnerName, 'Yennefer');
    assert.equal(result.world.mapSettings.kilometersPerGrid, 210.5);
});

test('interface e pacote offline incluem planejamento, confirmação e calibração da rota', () => {
    const timeSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-time.js'), 'utf8');
    const mapSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-map.js'), 'utf8');
    const featureLoader = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-feature-loader.js'), 'utf8');
    const worker = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
    const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    assert.match(timeSource, /ROTA DO GRUPO CALCULADA POR A\*/);
    assert.match(timeSource, /confirmRoute/);
    assert.match(timeSource, /advanceByMinutes/);
    assert.match(timeSource, /getMountMovement/);
    assert.match(timeSource, /getVehicleMovement/);
    assert.match(timeSource, /Portal Vertical/);
    assert.match(timeSource, /Viagens físicas exigem uma rota contínua de estradas/);
    assert.match(timeSource, /showRoutePreview\?\.\(plan\)/);
    assert.match(timeSource, /world-travel-map-preview-overlay/);
    assert.match(timeSource, /COMPOSIÇÃO DO GRUPO/);
    assert.match(timeSource, /updateWorldTravelParticipant/);
    assert.match(timeSource, /planGroupRoute/);
    assert.match(timeSource, /Ritmo do grupo/);
    assert.match(mapSource, /Calibração de distância/);
    assert.match(mapSource, /saveMapScale/);
    assert.match(mapSource, /world-route-preview-casing/);
    assert.match(mapSource, /circleMarker/);
    assert.match(mapSource, /getPane\('worldRoutePane'\)\.style\.pointerEvents = 'none'/);
    assert.match(index, /world-feature-loader\.js/);
    assert.match(featureLoader, /world-route-engine\.js/);
    assert.match(worker, /world-route-engine\.js/);
    assert.match(worker, /witcher-combat-tracker-v158/);
});
