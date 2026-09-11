const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const roads = require(path.join(projectRoot, 'js', 'world', 'world-road-data.js'));
const editor = require(path.join(projectRoot, 'js', 'world', 'world-road-editor.js'));

function createStorage() {
    const values = new Map();
    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };
}

test('editor carrega o catálogo sem alterar os dados originais', () => {
    const network = editor.catalogNetwork();
    assert.deepEqual(editor.validateNetwork(network), []);
    assert.equal(editor.CATALOG_VERSION, roads.ROAD_NETWORK_VERSION);
    assert.equal(editor.STORAGE_KEY, 'witcher-road-network-overrides-v2');
    assert.equal(network.catalogVersion, roads.ROAD_NETWORK_VERSION);
    assert.equal(network.source, 'catalog');
    assert.equal(network.nodes.length, roads.ROAD_NODES.length);
    assert.equal(network.segments.length, roads.ROAD_SEGMENTS.length);
    network.segments[0].points[0].x += 10;
    assert.notEqual(network.segments[0].points[0].x, roads.ROAD_SEGMENTS[0].points[0].x);
});

test('importador interpreta nomes do Corel e conecta bifurcações coincidentes', () => {
    const importer = require(path.join(projectRoot, 'scripts', 'import-map-roads.js'));
    const parsed = importer.parseSvg(`
        <svg viewBox="0 0 2880 4096">
            <polyline id="road_x007c_main_x007c_carriage_x007c_Estrada_x0020_A" points="10,10 100,100" />
            <polyline id="road_x007c_regional_x007c_carriage_x007c_Estrada_x0020_B" points="100,100 200,150" />
            <line id="road_x007c_mountain_x007c_no-carriage_x007c_Passagem_x0020_C" x1="100" y1="100" x2="150" y2="250" />
        </svg>
    `);
    const network = importer.buildNetwork(parsed);
    assert.equal(network.segments.length, 3);
    assert.deepEqual(network.segments.map(segment => segment.type), ['main', 'regional', 'mountain']);
    assert.deepEqual(network.segments.map(segment => segment.carriageAllowed), [true, true, false]);
    assert.equal(network.nodes.filter(node => node.type === 'junction').length, 1);
    const junction = network.nodes.find(node => node.type === 'junction');
    assert.equal(network.segments.filter(segment => segment.fromNodeId === junction.id || segment.toNodeId === junction.id).length, 3);
});

test('importador converte círculos verdes do Corel em marcadores catalogados', () => {
    const importer = require(path.join(projectRoot, 'scripts', 'import-map-roads.js'));
    const parsed = importer.parseSvg(`
        <svg viewBox="0 0 2880 4096">
            <line id="road_x007c_main_x007c_carriage_x007c_Teste" x1="10" y1="10" x2="20" y2="20" />
            <circle id="location_x007c_Novigrad" cx="1168" cy="1030" r="4" />
            <circle id="location_x007c_Local_x0020_Desconhecido" cx="1200" cy="1040" r="4" />
        </svg>
    `);
    const imported = importer.buildMarkerImport(parsed);
    assert.equal(parsed.markers.length, 2);
    assert.equal(imported.markers.length, 1);
    assert.equal(imported.markers[0].locationId, 'world-canonical-novigrad');
    assert.deepEqual(imported.markers[0].point, { x: 1168, y: 1030 });
    assert.deepEqual(imported.unmatchedMarkers.map(marker => marker.label), ['Local Desconhecido']);
    assert.deepEqual(imported.ambiguousMarkers, []);
});

test('rede personalizada é salva, recarregada e restaurada localmente', () => {
    const storage = createStorage();
    const catalog = editor.loadNetwork(storage);
    const saved = editor.saveNetwork(storage, catalog);
    assert.equal(saved.source, 'manual');
    assert.equal(editor.loadNetwork(storage).source, 'manual');
    assert.ok(storage.getItem(editor.STORAGE_KEY));
    assert.equal(editor.restoreCatalog(storage).source, 'catalog');
    assert.equal(storage.getItem(editor.STORAGE_KEY), null);
});

test('mover uma extremidade atualiza todos os trechos conectados ao nó', () => {
    const catalog = editor.catalogNetwork();
    const node = catalog.nodes.find(entry => roads.getNodeDegree(entry.id, catalog.segments) >= 2);
    assert.ok(node);
    const connected = catalog.segments.filter(segment => segment.fromNodeId === node.id || segment.toNodeId === node.id);
    const moved = editor.moveNode(catalog, node.id, { x: node.point.x + 11, y: node.point.y + 13 });
    connected.forEach(original => {
        const segment = moved.segments.find(entry => entry.id === original.id);
        const endpoint = segment.fromNodeId === node.id ? segment.points[0] : segment.points.at(-1);
        assert.deepEqual(endpoint, { x: node.point.x + 11, y: node.point.y + 13 });
    });
});

test('corrige geometria e propriedades de um trecho existente', () => {
    const catalog = editor.catalogNetwork();
    const segment = catalog.segments[0];
    const points = [segment.points[0], { x: segment.points[0].x + 20, y: segment.points[0].y + 30 }, segment.points.at(-1)];
    const updated = editor.updateSegment(catalog, segment.id, {
        name: 'Estrada corrigida',
        type: 'regional',
        carriageAllowed: false,
        points
    });
    const result = updated.segments.find(entry => entry.id === segment.id);
    assert.equal(result.name, 'Estrada corrigida');
    assert.equal(result.type, 'regional');
    assert.equal(result.carriageAllowed, false);
    assert.equal(result.points.length, 3);
    assert.equal(result.confidence, 'manual');
});

test('cria trecho com encaixe em nó próximo e permite removê-lo', () => {
    const catalog = editor.catalogNetwork();
    const existing = catalog.nodes[0];
    const result = editor.addSegment(catalog, {
        name: 'Atalho do mestre',
        type: 'main',
        carriageAllowed: true,
        points: [
            { x: existing.point.x + 2, y: existing.point.y + 2 },
            { x: existing.point.x + 80, y: existing.point.y + 120 }
        ]
    });
    const added = result.network.segments.find(entry => entry.id === result.segmentId);
    assert.equal(added.fromNodeId, existing.id);
    assert.deepEqual(added.points[0], existing.point);
    assert.equal(result.network.segments.length, catalog.segments.length + 1);
    const removed = editor.removeSegment(result.network, result.segmentId);
    assert.equal(removed.segments.length, catalog.segments.length);
});

test('exportação e importação usam pacote versionado e validado', () => {
    const exported = editor.buildExportPackage(editor.catalogNetwork());
    const imported = editor.prepareImportedPackage(exported, { byteLength: JSON.stringify(exported).length });
    assert.equal(exported.type, editor.PACKAGE_TYPE);
    assert.equal(exported.version, editor.PACKAGE_VERSION);
    assert.equal(imported.segments.length, roads.ROAD_SEGMENTS.length);
    assert.throws(() => editor.prepareImportedPackage({ ...exported, type: 'outro' }), /incompatível/);
    assert.throws(() => editor.prepareImportedPackage(exported, { byteLength: editor.MAX_IMPORT_BYTES + 1 }), /4 MB/);
});

test('interface expõe edição somente ao mestre e entra no cache offline', () => {
    const mapSource = read(path.join('js', 'world', 'world-map.js'));
    const featureLoader = read(path.join('js', 'world', 'world-feature-loader.js'));
    const indexSource = read('index.html');
    const workerSource = read(path.join('js', 'service-worker.js'));
    const styles = read('world-map.css');
    assert.match(mapSource, /FERRAMENTA DO MESTRE/);
    assert.match(mapSource, /options\.playerMode === true \? ''/);
    assert.match(mapSource, /startEditingRoadSegment/);
    assert.match(mapSource, /startNewRoadSegment/);
    assert.match(mapSource, /toggleRoadEditorCollapsed/);
    assert.match(mapSource, /importRoadNetworkFile/);
    assert.match(mapSource, /restoreRoadNetworkCatalog/);
    assert.match(indexSource, /js\/world\/world-feature-loader\.js/);
    assert.match(featureLoader, /js\/world\/world-road-editor\.js/);
    assert.match(workerSource, /js\/world\/world-road-editor\.js/);
    assert.match(workerSource, /witcher-combat-tracker-v146/);
    assert.match(indexSource, /js\/world\/world-location-imported-data\.js/);
    assert.match(workerSource, /js\/world\/world-location-imported-data\.js/);
    assert.match(featureLoader, /js\/world\/world-road-imported-data\.js/);
    assert.match(workerSource, /js\/world\/world-road-imported-data\.js/);
    assert.match(styles, /\.world-road-editor-panel/);
    assert.match(styles, /\.world-road-editor-vertex/);
    assert.match(styles, /\.world-road-editor-panel\.compact/);
});
