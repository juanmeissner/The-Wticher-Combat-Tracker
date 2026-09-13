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

test('Tailwind é distribuído como CSS estático sem compilação no navegador', () => {
    const indexSource = read('index.html');
    const workerSource = read(path.join('js', 'service-worker.js'));
    const packageSource = JSON.parse(read('package.json'));
    const generatedCss = read('tailwind-static.css');

    assert.match(indexSource, /href="tailwind-static\.css"/);
    assert.doesNotMatch(indexSource, /cdn\.tailwindcss\.com/);
    assert.match(workerSource, /\.\/tailwind-static\.css/);
    assert.doesNotMatch(workerSource, /cdn\.tailwindcss\.com/);
    assert.match(packageSource.scripts['build:css'], /tailwindcss/);
    assert.ok(generatedCss.length > 1000);
});

test('lista de combate é inserida no DOM em um único lote', () => {
    const renderSource = read(path.join('js', 'combat', 'combat-render.js'));
    assert.match(renderSource, /document\.createDocumentFragment\(\)/);
    assert.match(renderSource, /reconcileCombatList\(container, fragment\)/);
    assert.match(renderSource, /currentNode\.isEqualNode\(nextNode\)/);
});

test('sincronização evita renderizações e gravações de fichas sem mudanças', () => {
    const sessionSource = read(path.join('js', 'session-features.js'));
    const enhancementsSource = read(path.join('js', 'enhancements.js'));

    assert.match(sessionSource, /previousCombatFingerprint !== nextCombatFingerprint/);
    assert.match(sessionSource, /previousInventoryFingerprint !== nextInventoryFingerprint/);
    assert.match(sessionSource, /previousAbilitiesFingerprint !== nextAbilitiesFingerprint/);
    assert.match(enhancementsSource, /getCharacterSheetSyncFingerprint/);
    assert.match(enhancementsSource, /localStorage\.getItem\(CHARACTER_SHEETS_KEY\) === serialized/);
});

test('listas extensas são compostas uma única vez antes de entrar no DOM', () => {
    const inventorySource = read(path.join('js', 'inventory.js'));
    const abilitiesSource = read(path.join('js', 'abilities', 'abilities.js'));
    const abilitiesModalSource = read(path.join('js', 'ui', 'abilities-modal.js'));
    const monstersSource = read(path.join('js', 'monsters.js'));

    assert.match(inventorySource, /filteredInventory\.map\(item =>/);
    assert.match(inventorySource, /filteredItems\.map\(item =>/);
    assert.doesNotMatch(inventorySource, /container\.innerHTML \+=/);
    assert.match(abilitiesSource, /abilitiesInventory\.map\(ability =>/);
    assert.doesNotMatch(abilitiesSource, /container\.innerHTML \+=/);
    assert.match(abilitiesModalSource, /filteredAbilities\.map\(ability =>/);
    assert.doesNotMatch(abilitiesModalSource, /container\.innerHTML \+=/);
    assert.match(monstersSource, /filtered\.map\(monster =>/);
    assert.doesNotMatch(monstersSource, /container\.innerHTML \+=/);
});

test('cache offline mantém os recursos carregados sob demanda', () => {
    const workerSource = read(path.join('js', 'service-worker.js'));
    assert.match(workerSource, /witcher-combat-tracker-v158/);
    assert.match(workerSource, /js\/world\/world-feature-loader\.js/);
    assert.match(workerSource, /js\/world\/world-road-imported-data\.js/);
    assert.match(workerSource, /vendor\/leaflet\/leaflet\.js/);
    assert.match(workerSource, /js\/world\/world-map\.js/);
    assert.match(workerSource, /xlsx\/dist\/xlsx\.full\.min\.js/);
});
