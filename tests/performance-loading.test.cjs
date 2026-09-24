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
    assert.doesNotMatch(indexSource, /<link[^>]+vendor\/leaflet\/leaflet\.css/);
    assert.doesNotMatch(indexSource, /<script src="js\/world\/world-map\.js"/);
    assert.doesNotMatch(indexSource, /<script src="js\/world\/world-road-imported-data\.js"/);
    assert.match(loaderSource, /ensureRouteFeatures/);
    assert.match(loaderSource, /ensureMapFeatures/);
    assert.match(loaderSource, /world-road-imported-data\.js/);
    assert.match(loaderSource, /vendor\/leaflet\/leaflet\.js/);
    assert.match(loaderSource, /loadStylesheet\('vendor\/leaflet\/leaflet\.css'\)/);
    assert.match(loaderSource, /world-map\.js/);
    assert.match(abilitiesExport, /ensureXlsxLibrary/);
    assert.match(abilitiesExport, /async function exportAbilitiesToExcel/);
});

test('service worker separa a interface essencial dos recursos pesados', () => {
    const workerSource = read(path.join('js', 'service-worker.js'));
    const coreShell = workerSource.match(/const CORE_SHELL = \[([\s\S]*?)\n\];/)?.[1] || '';
    const runtimeAssets = workerSource.match(/const RUNTIME_ASSETS = \[([\s\S]*?)\n\];/)?.[1] || '';

    assert.match(coreShell, /app-shell\.css/);
    assert.doesNotMatch(coreShell, /img\/monsters/);
    assert.doesNotMatch(coreShell, /img\/maps\/continent\/tiles/);
    assert.doesNotMatch(coreShell, /world-road-imported-data\.js/);
    assert.match(runtimeAssets, /img\/monsters\/witch\.png/);
    assert.match(runtimeAssets, /world-road-imported-data\.js/);
    assert.match(workerSource, /staleWhileRevalidate/);
    assert.match(workerSource, /request\.mode === 'navigate'/);
    assert.doesNotMatch(workerSource, /cache:\s*['"]no-store['"]/);
});

test('somente a tela principal ativa permanece renderizável', () => {
    const navigationSource = read(path.join('js', 'navigation.js'));
    const shellCss = read('app-shell.css');

    assert.match(navigationSource, /screen\.hidden = !isActive/);
    assert.match(navigationSource, /screen\.inert = !isActive/);
    assert.match(navigationSource, /aria-current/);
    assert.doesNotMatch(navigationSource, /translateX/);
    assert.match(shellCss, /#appWrapper > \[hidden\]/);
    assert.match(shellCss, /width:\s*100%/);
});

test('imagens dinâmicas usam URL segura, lazy loading e fallback centralizado', () => {
    const helpersSource = read(path.join('js', 'core', 'helpers.js'));
    const dynamicRenderers = [
        read(path.join('js', 'inventory.js')),
        read(path.join('js', 'equipment.js')),
        read(path.join('js', 'mounts.js')),
        read(path.join('js', 'monsters.js')),
        read(path.join('js', 'combat', 'combat-render.js')),
        read(path.join('js', 'combat', 'combat-effects.js')),
        read(path.join('js', 'world', 'world-commerce.js'))
    ].join('\n');

    assert.match(helpersSource, /function getSafeAppImageUrl/);
    assert.match(helpersSource, /protocol !== 'http:' && parsedUrl\.protocol !== 'https:'/);
    assert.match(helpersSource, /loading="\$\{eager \? 'eager' : 'lazy'\}"/);
    assert.match(helpersSource, /decoding="async"/);
    assert.match(helpersSource, /data-app-image-fallback/);
    assert.match(dynamicRenderers, /renderAppImage/);
    assert.doesNotMatch(dynamicRenderers, /<img\s+src="\$\{/);
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

test('lista de combate reaproveita cards que não mudaram', () => {
    const renderSource = read(path.join('js', 'combat', 'combat-render.js'));
    assert.match(renderSource, /combatantRenderRevisions = new Map\(\)/);
    assert.match(renderSource, /existingWrapper\?\.dataset\?\.combatRenderSignature === renderSignature/);
    assert.match(renderSource, /reconcileCombatList\(container, nextNodes\)/);
    assert.match(renderSource, /currentNode === nextNode/);
    assert.match(renderSource, /render:combat-list/);
});

test('painéis do combate são atualizados sem reconstruir o card do participante', () => {
    const renderSource = read(path.join('js', 'combat', 'combat-render.js'));
    const skillSource = read(path.join('js', 'character-skill-tests.js'));
    const spellSource = read(path.join('js', 'character-spells.js'));
    const equipmentSource = read(path.join('js', 'equipment.js'));
    const mountsSource = read(path.join('js', 'mounts.js'));
    const criticalSource = read(path.join('js', 'critical-wounds.js'));
    const equipmentCss = read('equipment.css');

    assert.match(renderSource, /function refreshCombatantPanel/);
    assert.match(renderSource, /currentPanel\.replaceWith\(nextPanel\)/);
    assert.match(renderSource, /restoreCombatPanelFocus\(nextPanel, focusState\)/);
    assert.match(renderSource, /window\.refreshCombatantPanel = refreshCombatantPanel/);
    assert.match(skillSource, /refreshCombatantPanel\?\.\(key, 'resources'\)/);
    assert.match(skillSource, /refreshCombatantPanel\?\.\(key, 'skills'\)/);
    assert.match(skillSource, /refreshCombatantPanel\?\.\(key, 'professional-skills'\)/);
    assert.match(spellSource, /refreshCombatantPanel\?\.\(combatantId, 'spells'\)/);
    assert.match(equipmentSource, /refreshCombatantPanel\?\.\(key, 'equipment'\)/);
    assert.match(mountsSource, /refreshCombatantPanel\?\.\(key, 'mount'\)/);
    assert.match(criticalSource, /refreshCombatantPanel\?\.\(key, 'critical-wounds'\)/);
    assert.match(equipmentCss, /\.combat-subpanels\s*\{[\s\S]*?overflow-anchor:\s*none;/);
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

test('listas extensas são renderizadas progressivamente em lotes ociosos', () => {
    const indexSource = read('index.html');
    const performanceSource = read(path.join('js', 'core', 'performance.js'));
    const inventorySource = read(path.join('js', 'inventory.js'));
    const abilitiesSource = read(path.join('js', 'abilities', 'abilities.js'));
    const abilitiesModalSource = read(path.join('js', 'ui', 'abilities-modal.js'));
    const monstersSource = read(path.join('js', 'monsters.js'));

    assert.match(indexSource, /js\/core\/performance\.js/);
    assert.match(performanceSource, /requestIdleCallback/);
    assert.match(performanceSource, /renderProgressiveList/);
    assert.match(performanceSource, /PerformanceObserver/);
    assert.match(inventorySource, /renderProgressiveList\(container, filteredInventory/);
    assert.match(inventorySource, /renderProgressiveList\(container, filteredItems/);
    assert.doesNotMatch(inventorySource, /container\.innerHTML \+=/);
    assert.match(abilitiesSource, /renderProgressiveList\(container, abilitiesInventory/);
    assert.doesNotMatch(abilitiesSource, /container\.innerHTML \+=/);
    assert.match(abilitiesModalSource, /renderProgressiveList\(container, filteredAbilities/);
    assert.doesNotMatch(abilitiesModalSource, /container\.innerHTML \+=/);
    assert.match(monstersSource, /renderProgressiveList\(container, filtered/);
    assert.doesNotMatch(monstersSource, /container\.innerHTML \+=/);
});

test('cache offline mantém os recursos carregados sob demanda', () => {
    const workerSource = read(path.join('js', 'service-worker.js'));
    assert.match(workerSource, /witcher-combat-tracker-v181/);
    assert.match(workerSource, /js\/core\/performance\.js/);
    assert.match(workerSource, /js\/world\/world-feature-loader\.js/);
    assert.match(workerSource, /js\/world\/world-road-imported-data\.js/);
    assert.match(workerSource, /vendor\/leaflet\/leaflet\.js/);
    assert.match(workerSource, /js\/world\/world-map\.js/);
    assert.match(workerSource, /xlsx\/dist\/xlsx\.full\.min\.js/);
});
