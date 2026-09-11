const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const roads = require('../js/world/world-road-data.js');
const routeEngine = require('../js/world/world-route-engine.js');
const worldModel = require('../js/world/world-model.js');

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
    assert.ok(horse.durationMinutes < foot.durationMinutes);
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
        toLocationId: 'destination', durationMinutes: 180, transportMode: 'horse', transportLabel: 'Carpeado',
        transportAssetId: 'mount-1', travelerId: 'hero-1', travelerName: 'Geralt',
        travelers: [{ id: 'hero-1', name: 'Geralt', role: 'leader' }, { id: 'hero-2', name: 'Ciri', role: 'companion' }], distanceKm: 28.4,
        roadDistanceKm: 21, offRoadDistanceKm: 7.4, routeNodeIds: ['a', 'b'], routeSegmentIds: ['ab'],
        routeAlgorithm: 'astar', scaleKilometersPerGrid: 210.5
    });
    assert.equal(result.travel.transportMode, 'horse');
    assert.equal(result.travel.transportLabel, 'Carpeado');
    assert.equal(result.travel.distanceKm, 28.4);
    assert.equal(result.travel.routeAlgorithm, 'astar');
    assert.deepEqual(result.travel.travelers.map(entry => entry.name), ['Geralt', 'Ciri']);
    assert.equal(result.world.mapSettings.kilometersPerGrid, 210.5);
});

test('interface e pacote offline incluem planejamento, confirmação e calibração da rota', () => {
    const timeSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-time.js'), 'utf8');
    const mapSource = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-map.js'), 'utf8');
    const featureLoader = fs.readFileSync(path.join(projectRoot, 'js', 'world', 'world-feature-loader.js'), 'utf8');
    const worker = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
    const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    assert.match(timeSource, /ROTA CALCULADA POR A\*/);
    assert.match(timeSource, /confirmRoute/);
    assert.match(timeSource, /advanceByMinutes/);
    assert.match(timeSource, /getMountMovement/);
    assert.match(timeSource, /getVehicleMovement/);
    assert.match(timeSource, /Portal Vertical/);
    assert.match(timeSource, /travelerKeys/);
    assert.match(mapSource, /Calibração de distância/);
    assert.match(mapSource, /saveMapScale/);
    assert.match(index, /world-feature-loader\.js/);
    assert.match(featureLoader, /world-route-engine\.js/);
    assert.match(worker, /world-route-engine\.js/);
    assert.match(worker, /witcher-combat-tracker-v146/);
});
