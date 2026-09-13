const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const worldMap = require(path.join(projectRoot, 'js', 'world', 'world-map.js'));
const worldModel = require(path.join(projectRoot, 'js', 'world', 'world-model.js'));
const worldCartographicData = require(path.join(projectRoot, 'js', 'world', 'world-cartographic-data.js'));
const worldLocationImportedData = require(path.join(projectRoot, 'js', 'world', 'world-location-imported-data.js'));
const worldRoadData = require(path.join(projectRoot, 'js', 'world', 'world-road-data.js'));
const manifest = JSON.parse(read(path.join('img', 'maps', 'continent', 'manifest.json')));

function sourcePixel(location) {
    const coordinate = worldMap.percentToMapCoordinate(location.coordinates);
    return {
        x: Math.round(coordinate.lng),
        y: Math.round(4096 - coordinate.lat)
    };
}

test('coordenadas percentuais preservam a referência cartográfica do mapa', () => {
    assert.deepEqual(worldMap.percentToMapCoordinate({ x: 0, y: 0 }), { lat: 4096, lng: 0 });
    assert.deepEqual(worldMap.percentToMapCoordinate({ x: 100, y: 100 }), { lat: 0, lng: 2880 });

    const coordinate = worldMap.percentToMapCoordinate({ x: 37.5, y: 62.25 });
    const roundTrip = worldMap.mapCoordinateToPercent(coordinate);
    assert.ok(Math.abs(roundTrip.x - 37.5) < 0.000001);
    assert.ok(Math.abs(roundTrip.y - 62.25) < 0.000001);
});

test('locais privados ou sem coordenadas não entram na futura camada pública de marcadores', () => {
    const world = {
        locations: [
            { id: 'publico', visibility: 'public', coordinates: { x: 10, y: 20 } },
            { id: 'privado', visibility: 'private', coordinates: { x: 30, y: 40 } },
            { id: 'sem-coordenada', visibility: 'public' }
        ]
    };
    assert.deepEqual(worldMap.getMappableLocations(world).map(location => location.id), ['publico']);
    assert.deepEqual(worldMap.getMappableLocations(world, { includePrivate: true }).map(location => location.id), ['publico', 'privado']);
});

test('filtros cartográficos combinam busca, região, tipo, camada e confiabilidade', () => {
    const world = {
        locations: [
            { id: 'root', type: 'continent', name: 'O Continente' },
            { id: 'temeria', type: 'realm', politicalType: 'kingdom', parentId: 'root', name: 'Teméria' },
            { id: 'redania', type: 'realm', politicalType: 'kingdom', parentId: 'root', name: 'Redânia' },
            { id: 'vizima', type: 'location', parentId: 'temeria', name: 'Vizima', canonicalType: 'capital', coordinates: { x: 40, y: 30 } },
            { id: 'ponte', type: 'location', parentId: 'temeria', name: 'Ponte Velha', cartographicStatus: 'map-only', cartographicType: 'settlement', cartographicConfidence: 'medium', coordinates: { x: 42, y: 31 } },
            { id: 'acampamento', type: 'location', parentId: 'redania', name: 'Acampamento da campanha', origin: 'custom', customType: 'fort', coordinates: { x: 20, y: 20 } }
        ]
    };

    assert.deepEqual(worldMap.getMapRegions(world).map(region => [region.name, region.count]), [['Redânia', 1], ['Teméria', 2]]);
    assert.deepEqual(worldMap.filterMappableLocations(world, { query: 'ponte', regionId: 'all', type: 'all', layer: 'all', confidence: 'all' }).map(entry => entry.id), ['ponte']);
    assert.deepEqual(worldMap.filterMappableLocations(world, { query: '', regionId: 'temeria', type: 'all', layer: 'all', confidence: 'all' }).map(entry => entry.id), ['vizima', 'ponte']);
    assert.deepEqual(worldMap.filterMappableLocations(world, { query: '', regionId: 'all', type: 'settlement', layer: 'cartographic', confidence: 'medium' }).map(entry => entry.id), ['ponte']);
});

test('catálogo cartográfico posiciona locais canônicos preservando coordenadas do mestre', () => {
    const seeded = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld(), {
        now: '2026-09-10T00:00:00.000Z'
    });
    const vizima = seeded.locations.find(location => location.id === 'world-canonical-vizima');
    const kaerMorhen = seeded.locations.find(location => location.id === 'world-canonical-kaer-morhen');

    assert.equal(worldCartographicData.CARTOGRAPHIC_CATALOG_VERSION, 7);
    assert.equal(Object.keys(worldCartographicData.CANONICAL_COORDINATES).length, 59);
    const vizimaMapCoordinate = worldMap.percentToMapCoordinate(vizima.coordinates);
    const importedVizima = worldLocationImportedData.markers.find(marker => marker.locationId === vizima.id);
    assert.ok(Math.abs(vizimaMapCoordinate.lng - importedVizima.point.x) < 0.000001);
    assert.ok(Math.abs(vizimaMapCoordinate.lat - (4096 - importedVizima.point.y)) < 0.000001);
    assert.equal(vizima.coordinateConfidence, 'precise');
    assert.ok(kaerMorhen.coordinates);
    assert.equal(seeded.locations.filter(location => location.coordinates).length, 212);
    assert.equal(worldLocationImportedData.markers.length, 132);
    assert.equal(worldLocationImportedData.unmatchedMarkers.length, 0);
    assert.equal(worldLocationImportedData.ambiguousMarkers.length, 0);

    vizima.coordinates = { x: 41, y: 29 };
    const reseeded = worldCartographicData.seedCartographicLocations(seeded, { now: '2026-09-11T00:00:00.000Z' });
    const updatedVizima = reseeded.locations.find(location => location.id === vizima.id);
    assert.deepEqual(updatedVizima.coordinates, { x: 41, y: 29 });
    assert.equal(updatedVizima.coordinateConfidence, 'precise');
    assert.equal(updatedVizima.mapId, worldCartographicData.MAP_ID);
});

test('marcadores auditados permanecem ancorados em pixels do mapa original em todas as regiões', () => {
    const seeded = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld(), {
        now: '2026-09-10T00:00:00.000Z'
    });
    const expected = new Map([
        ['world-cartographic-aed-gynvael', { x: 485, y: 140 }],
        ['world-canonical-lan-exeter', { x: 780, y: 310 }],
        ['world-canonical-thanedd', { x: 1185, y: 1220 }],
        ['world-cartographic-tiberghien', { x: 1090, y: 1460 }],
        ['world-canonical-lyria-city', { x: 2570, y: 1305 }],
        ['world-cartographic-kagen', { x: 1980, y: 1700 }],
        ['world-cartographic-riedbrune', { x: 2135, y: 1885 }],
        ['world-cartographic-tigg', { x: 1475, y: 1935 }],
        ['world-canonical-rhys-rhun', { x: 1485, y: 2155 }],
        ['world-cartographic-tergano', { x: 1950, y: 2155 }],
        ['world-cartographic-vedette', { x: 2390, y: 2030 }],
        ['world-cartographic-pomerol', { x: 2470, y: 2080 }],
        ['world-canonical-beauclair', { x: 2390, y: 2155 }],
        ['world-cartographic-corvo', { x: 2470, y: 2220 }],
        ['world-cartographic-caravista', { x: 1980, y: 2295 }],
        ['world-cartographic-new-forge', { x: 2385, y: 2550 }],
        ['world-cartographic-sarda', { x: 2295, y: 2600 }],
        ['world-canonical-metinna-city', { x: 1670, y: 2550 }],
        ['world-cartographic-glyswen', { x: 2360, y: 2765 }],
        ['world-cartographic-thurn', { x: 2045, y: 2845 }],
        ['world-cartographic-maecht-city', { x: 2020, y: 3030 }],
        ['world-canonical-stygga', { x: 1760, y: 3170 }],
        ['world-canonical-vicovaro-city', { x: 2295, y: 3510 }],
        ['world-canonical-nilfgaard-city', { x: 1705, y: 3785 }]
    ]);

    for (const [id, pixel] of expected) {
        const location = seeded.locations.find(entry => entry.id === id);
        assert.ok(location, `marcador ausente: ${id}`);
        const imported = worldLocationImportedData.markers.find(marker => marker.locationId === id);
        const expectedPixel = imported
            ? { x: Math.round(imported.point.x), y: Math.round(imported.point.y) }
            : pixel;
        assert.deepEqual(sourcePixel(location), expectedPixel, `coordenada deslocada: ${id}`);
    }
});

test('círculos verdes do SVG atualizam todos os marcadores reconhecidos sem criar duplicatas', () => {
    const seeded = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld(), {
        now: '2026-09-10T00:00:00.000Z'
    });
    const importedIds = new Set(worldLocationImportedData.markers.map(marker => marker.locationId));
    assert.equal(importedIds.size, 132);
    for (const marker of worldLocationImportedData.markers) {
        const location = seeded.locations.find(entry => entry.id === marker.locationId);
        assert.ok(location, `local importado ausente: ${marker.label}`);
        assert.deepEqual(sourcePixel(location), {
            x: Math.round(marker.point.x),
            y: Math.round(marker.point.y)
        }, `círculo verde não aplicado: ${marker.label}`);
        assert.equal(location.coordinateConfidence, 'precise');
    }
});

test('migração cartográfica substitui coordenadas antigas do catálogo, mas preserva ajustes da versão atual', () => {
    const legacy = worldCartographicData.seedCartographicLocations(worldModel.createEmptyWorld(), {
        now: '2026-09-10T00:00:00.000Z'
    });
    legacy.cartographicCatalogVersion = 4;
    const legacyVizima = legacy.locations.find(location => location.id === 'world-canonical-vizima');
    const legacyCaravista = legacy.locations.find(location => location.id === 'world-cartographic-caravista');
    legacyVizima.coordinates = { x: 42.5, y: 28.6 };
    legacyVizima.coordinateConfidence = 'approximate';
    legacyVizima.mapId = worldCartographicData.MAP_ID;
    legacyCaravista.coordinates = { x: 55.5, y: 56.6 };
    legacyCaravista.coordinateConfidence = 'approximate';
    legacyCaravista.cartographicVersion = 4;

    const corrected = worldCartographicData.seedCartographicLocations(legacy, { now: '2026-09-11T00:00:00.000Z' });
    const correctedVizima = worldMap.percentToMapCoordinate(corrected.locations.find(location => location.id === legacyVizima.id).coordinates);
    const correctedCaravista = worldMap.percentToMapCoordinate(corrected.locations.find(location => location.id === legacyCaravista.id).coordinates);
    const importedVizima = worldLocationImportedData.markers.find(marker => marker.locationId === legacyVizima.id);
    assert.ok(Math.abs(correctedVizima.lng - importedVizima.point.x) < 0.000001);
    assert.ok(Math.abs(correctedCaravista.lng - 1980) < 0.000001);
    assert.ok(Math.abs(correctedCaravista.lat - (4096 - 2295)) < 0.000001);
});

test('contexto do marcador reúne conteúdo público do local e de seus descendentes', () => {
    const world = {
        locations: [
            { id: 'temeria', name: 'Teméria' },
            { id: 'vizima', parentId: 'temeria', name: 'Vizima', coordinates: { x: 42, y: 28 } },
            { id: 'castelo', parentId: 'vizima', name: 'Castelo Real' }
        ],
        npcs: [
            { id: 'ferreiro', currentLocationId: 'castelo', visibility: 'public', merchant: { enabled: true } },
            { id: 'espião', currentLocationId: 'vizima', visibility: 'private', merchant: { enabled: false } }
        ],
        regionalEvents: [
            { id: 'feira', locationId: 'temeria', enabled: true, visibility: 'public' },
            { id: 'baile', locationId: 'castelo', enabled: true, visibility: 'public' },
            { id: 'segredo', locationId: 'vizima', enabled: true, visibility: 'private' }
        ]
    };
    const playerContext = worldMap.getLocationContext(world, 'vizima');
    const masterContext = worldMap.getLocationContext(world, 'vizima', { includePrivate: true });

    assert.deepEqual([...worldMap.getLocationScopeIds(world, 'vizima')], ['vizima', 'castelo']);
    assert.deepEqual(playerContext.npcs.map(entry => entry.id), ['ferreiro']);
    assert.deepEqual(playerContext.merchants.map(entry => entry.id), ['ferreiro']);
    assert.deepEqual(playerContext.events.map(entry => entry.id), ['feira', 'baile']);
    assert.deepEqual(masterContext.npcs.map(entry => entry.id), ['ferreiro', 'espião']);
    assert.deepEqual(masterContext.events.map(entry => entry.id), ['feira', 'baile', 'segredo']);
});

test('pirâmide converte a grade invertida do Leaflet para os blocos armazenados', () => {
    assert.equal(manifest.levels.reduce((total, level) => total + level.tileCount, 0), 257);
    for (const level of manifest.levels) {
        for (let x = 0; x < level.columns; x += 1) {
            for (let y = 0; y < level.rows; y += 1) {
                assert.equal(
                    fs.existsSync(path.join(projectRoot, 'img', 'maps', 'continent', 'tiles', level.directory, String(x), `${y}.webp`)),
                    true,
                    `bloco ausente no zoom ${level.zoom}: ${x}/${y}`
                );
            }
        }
    }
    assert.deepEqual(
        worldMap.getTileSourceCoordinate({ x: 0, y: -1, z: -4 }, manifest),
        { directory: 'm4', x: 0, y: 0 }
    );
    assert.deepEqual(
        worldMap.getTileSourceCoordinate({ x: 11, y: -1, z: 0 }, manifest),
        { directory: '0', x: 11, y: 15 }
    );
    assert.equal(
        worldMap.buildTileUrl({ x: 2, y: -4, z: -2 }, manifest),
        'img/maps/continent/tiles/m2/2/0.webp'
    );
    assert.match(read(path.join('scripts', 'generate-map-tiles.py')), /Image\.Resampling\.LANCZOS/);
});

test('manifesto dos blocos é reutilizado durante a sessão', async () => {
    const originalFetch = global.fetch;
    let requests = 0;
    global.fetch = async () => {
        requests += 1;
        return { ok: true, json: async () => manifest };
    };
    try {
        const first = await worldMap.loadTileManifest('test://continent-manifest');
        const second = await worldMap.loadTileManifest('test://continent-manifest');
        assert.equal(requests, 1);
        assert.strictEqual(second, first);
    } finally {
        global.fetch = originalFetch;
    }
});

test('rede viária preserva trechos, entroncamentos e escala cartográfica centralizada', () => {
    const summary = worldRoadData.getNetworkSummary();
    assert.equal(worldRoadData.ROAD_NETWORK_VERSION, 2);
    assert.equal(worldRoadData.MAP_REFERENCE.kilometersPerGrid, 100);
    assert.equal(worldRoadData.MAP_REFERENCE.pixelsPerGrid, 576);
    assert.equal(summary.nodeCount, 202);
    assert.equal(summary.segmentCount, 246);
    assert.equal(summary.junctionCount, 102);
    assert.ok(summary.distanceKm > 4000);
    assert.equal(worldRoadData.ROAD_SOURCE.kind, 'svg');
    assert.equal(worldRoadData.ROAD_SOURCE.file, 'img/maps/continent/continent-roads.svg');

    const nodeIds = new Set(worldRoadData.ROAD_NODES.map(node => node.id));
    assert.equal(nodeIds.size, worldRoadData.ROAD_NODES.length);
    for (const segment of worldRoadData.ROAD_SEGMENTS) {
        assert.ok(nodeIds.has(segment.fromNodeId), `origem ausente: ${segment.id}`);
        assert.ok(nodeIds.has(segment.toNodeId), `destino ausente: ${segment.id}`);
        assert.ok(segment.points.length >= 2, `geometria insuficiente: ${segment.id}`);
        assert.ok(worldRoadData.getSegmentDistanceKm(segment) > 0, `distância inválida: ${segment.id}`);
        for (const point of segment.points) {
            assert.ok(point.x >= 0 && point.x <= 2880, `x fora do mapa: ${segment.id}`);
            assert.ok(point.y >= 0 && point.y <= 4096, `y fora do mapa: ${segment.id}`);
        }
    }
});

test('grafo importado encontra rotas conectadas e preserva os vínculos com locais', () => {
    const route = worldRoadData.findShortestRoute('road-node-novigrad', 'road-node-rinde');
    const carriageRoute = worldRoadData.findShortestRoute('road-node-novigrad', 'road-node-rinde', { carriageOnly: true });

    assert.ok(route);
    assert.equal(route.nodeIds[0], 'road-node-novigrad');
    assert.equal(route.nodeIds.at(-1), 'road-node-rinde');
    assert.ok(route.distanceKm > 0);
    assert.ok(carriageRoute);
    assert.equal(carriageRoute.distanceKm, route.distanceKm);
    assert.equal(worldRoadData.findNodeByLocationId('world-canonical-tretogor').id, 'road-node-tretogor');
});

test('popup calcula a menor distância viária e rejeita locais sem estrada contínua', () => {
    const network = { nodes: worldRoadData.ROAD_NODES, segments: worldRoadData.ROAD_SEGMENTS };
    const route = worldMap.calculateRoadDistance(
        'world-canonical-novigrad',
        'world-canonical-oxenfurt',
        network,
        worldRoadData.MAP_REFERENCE
    );
    assert.equal(route.ok, true);
    assert.ok(route.distanceKm > 0);
    assert.ok(route.segmentIds.length > 0);

    const disconnectedNetwork = {
        nodes: network.nodes.map(node => node.id === 'road-node-svg-174'
            ? { ...node, locationId: 'world-test-disconnected' }
            : node),
        segments: network.segments
    };
    const disconnected = worldMap.calculateRoadDistance(
        'world-canonical-novigrad',
        'world-test-disconnected',
        disconnectedNetwork,
        worldRoadData.MAP_REFERENCE
    );
    assert.deepEqual(disconnected, { ok: false, reason: 'disconnected' });

    const missing = worldMap.calculateRoadDistance(
        'world-canonical-novigrad',
        'world-custom-without-road',
        network,
        worldRoadData.MAP_REFERENCE
    );
    assert.deepEqual(missing, { ok: false, reason: 'destination-not-on-road' });
});

test('mapa usa Leaflet local, tela cheia e integração offline versionada', () => {
    const indexSource = read('index.html');
    const featureLoader = read(path.join('js', 'world', 'world-feature-loader.js'));
    const sessionSource = read(path.join('js', 'session-features.js'));
    const styles = read('world-map.css');
    const zoomLock = read(path.join('js', 'zoom-lock.js'));
    const worker = read(path.join('js', 'service-worker.js'));

    assert.match(indexSource, /vendor\/leaflet\/leaflet\.css/);
    assert.match(indexSource, /js\/world\/world-feature-loader\.js/);
    assert.doesNotMatch(indexSource, /<script src="vendor\/leaflet\/leaflet\.js"/);
    assert.doesNotMatch(indexSource, /<script src="js\/world\/world-map\.js"/);
    assert.match(featureLoader, /vendor\/leaflet\/leaflet\.js/);
    assert.match(featureLoader, /js\/world\/world-map\.js/);
    assert.equal(worldMap.BASE_LAYER.type, 'tiles');
    assert.match(sessionSource, /openWorldHub\('map'\)/);
    assert.match(sessionSource, /worldMap\?\.renderView/);
    assert.match(sessionSource, /worldMap\?\.initialize/);
    assert.match(sessionSource, /view === 'history' \? `/);
    assert.match(styles, /\.world-map-mode/);
    assert.match(styles, /height:\s*100dvh/);
    assert.match(styles, /\.world-interactive-map/);
    assert.match(zoomLock, /data-allow-map-zoom/);
    assert.match(worker, /witcher-combat-tracker-v158/);
    assert.match(worker, /js\/world\/world-road-imported-data\.js/);
    assert.match(worker, /vendor\/leaflet\/leaflet\.js/);
    assert.match(worker, /js\/world\/world-map\.js/);
    assert.match(worker, /js\/world\/world-road-data\.js/);
    assert.match(worker, /js\/world\/world-road-editor\.js/);
    assert.match(worker, /world-map\.css/);
    assert.match(worker, /img\/maps\/continent\/manifest\.json/);
    assert.match(worker, /img\/maps\/continent\/tiles\/m4\/0\/0\.webp/);
    assert.match(sessionSource, /renderView\?\.\(world, \{ playerMode \}\)/);
    assert.match(sessionSource, /initialize\?\.\(\{ world, playerMode \}\)/);
    assert.match(read(path.join('js', 'world', 'world-map.js')), /Marcadores e regiões/);
    assert.match(styles, /\.world-map-filter-panel/);
    assert.match(styles, /\.world-location-marker/);
    assert.match(styles, /\.world-map-popup-context/);
    assert.match(styles, /\.world-map-popup-distance/);
    assert.match(styles, /\.world-route-preview-casing/);
    const mapSource = read(path.join('js', 'world', 'world-map.js'));
    assert.doesNotMatch(mapSource, /worldMapLoading|Carregando os blocos do mapa|Preparando o mapa/);
    assert.match(mapSource, /preferCanvas:\s*true/);
    assert.match(mapSource, /updateWhenIdle:\s*true/);
    assert.match(mapSource, /keepBuffer:\s*1/);
    assert.match(styles, /\.world-route-preview-line/);
    assert.match(styles, /\.world-route-preview-endpoint/);
    assert.match(styles, /\.world-travel-map-preview-overlay/);
    assert.match(styles, /\.world-map-legend-dot\.canonical/);
    assert.match(sessionSource, /data-npc-location-path/);
    assert.match(sessionSource, /FILTRO ABERTO PELO MAPA/);
    assert.match(read(path.join('js', 'world', 'world-map.js')), /openContext/);
    assert.match(featureLoader, /js\/world\/world-road-data\.js/);
    assert.match(featureLoader, /js\/world\/world-road-imported-data\.js/);
    assert.match(featureLoader, /js\/world\/world-road-editor\.js/);
    assert.match(read(path.join('js', 'world', 'world-map.js')), /refreshRoadLayer/);
    assert.match(styles, /\.world-road-segment/);
    assert.match(styles, /\.world-road-junction/);
});

test('Mestre controla escala e viagens enquanto Jogador recebe somente o mapa consultável', () => {
    const world = worldModel.createEmptyWorld({ now: '2026-09-10T00:00:00.000Z' });
    world.mapSettings = { pixelsPerGrid: 576, kilometersPerGrid: 225 };
    const masterView = worldMap.renderView(world, { playerMode: false });
    const playerView = worldMap.renderView(world, { playerMode: true });

    assert.match(masterView, /225 km por quadrícula/);
    assert.match(masterView, /Calibração de distância/);
    assert.match(masterView, /saveMapScale/);
    assert.match(masterView, /worldMapRoadEditor/);
    assert.match(playerView, /Mapa visual interativo/i);
    assert.match(playerView, /225 km por quadrícula/);
    assert.doesNotMatch(playerView, /Calibração de distância/);
    assert.doesNotMatch(playerView, /saveMapScale/);
    assert.doesNotMatch(playerView, /worldMapRoadEditor/);
});
