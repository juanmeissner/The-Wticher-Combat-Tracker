const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('recursos pesados são carregados somente quando a funcionalidade é aberta', () => {
    const indexSource = read('index.html');
    const loaderSource = read(path.join('js', 'world', 'world-feature-loader.js'));
    const abilitiesExport = read(path.join('js', 'abilities', 'abilities-export.js'));

    assert.match(indexSource, /js\/world\/world-feature-loader\.js/);
    assert.doesNotMatch(indexSource, /<script[^>]+xlsx\.full\.min\.js/);
    assert.doesNotMatch(indexSource, /<script src="vendor\/leaflet\/leaflet\.js"/);
    assert.doesNotMatch(indexSource, /<script src="js\/world\/world-map\.js"/);
    assert.doesNotMatch(indexSource, /<script src="js\/world\/world-road-imported-data\.js"/);
    assert.match(loaderSource, /ensureRouteFeatures/);
    assert.match(loaderSource, /ensureMapFeatures/);
    assert.match(loaderSource, /world-road-imported-data\.js/);
    assert.match(loaderSource, /vendor\/leaflet\/leaflet\.js/);
    assert.match(loaderSource, /world-map\.js/);
    assert.match(abilitiesExport, /ensureXlsxLibrary/);
    assert.match(abilitiesExport, /async function exportAbilitiesToExcel/);
});

test('lista de combate é inserida no DOM em um único lote', () => {
    const renderSource = read(path.join('js', 'combat', 'combat-render.js'));
    assert.match(renderSource, /document\.createDocumentFragment\(\)/);
    assert.match(renderSource, /container\.replaceChildren\(fragment\)/);
});

test('cache offline mantém os recursos carregados sob demanda', () => {
    const workerSource = read(path.join('js', 'service-worker.js'));
    assert.match(workerSource, /witcher-combat-tracker-v146/);
    assert.match(workerSource, /js\/world\/world-feature-loader\.js/);
    assert.match(workerSource, /js\/world\/world-road-imported-data\.js/);
    assert.match(workerSource, /vendor\/leaflet\/leaflet\.js/);
    assert.match(workerSource, /js\/world\/world-map\.js/);
    assert.match(workerSource, /xlsx\/dist\/xlsx\.full\.min\.js/);
});
