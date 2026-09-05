const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const context = vm.createContext({ console });

vm.runInContext(
    `${fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8')}
     globalThis.__items = predefinedItems;`,
    context,
    { filename: 'items.js' }
);
vm.runInContext(
    fs.readFileSync(path.join(projectRoot, 'js', 'inventory-filters.js'), 'utf8'),
    context,
    { filename: 'inventory-filters.js' }
);

const items = context.__items;
const filters = context.inventoryFilterSystem;
const find = id => items.find(item => item.id === id);

assert.ok(filters, 'O sistema de filtros deve ser exposto para a interface.');
assert.equal(filters.matches(find('racaodeviagem'), 'usable', 'food'), true);
assert.equal(filters.matches(find('aguapotavel'), 'usable', 'drink'), true);
assert.equal(filters.matches(find('sanguepreto'), 'usable', 'witcher-potion'), true);
assert.equal(filters.matches(find('oleodevampiro'), 'usable', 'oil'), true);
assert.equal(filters.matches(find('bombadeestilhacos'), 'usable', 'throwable'), true);

assert.equal(filters.matches(find('flechadeaco'), 'equipment', 'ammunition'), true);
assert.equal(filters.matches(find('espadadepratadebruxo'), 'equipment', 'sword'), true);
assert.equal(filters.matches(find('arcocurto'), 'equipment', 'bow'), true);
assert.equal(filters.matches(find('zefharelfico'), 'equipment', 'bow'), true);
assert.equal(filters.matches(find('besta'), 'equipment', 'crossbow'), true);
assert.equal(filters.matches(find('machadodebatalha'), 'equipment', 'axe'), true);
assert.equal(filters.matches(find('adaga'), 'equipment', 'dagger'), true);
assert.equal(filters.matches(find('cajado'), 'equipment', 'staff'), true);
assert.equal(filters.matches(find('lanca'), 'equipment', 'spear'), true);
assert.equal(filters.matches(find('martelodasterrasaltas'), 'equipment', 'hammer'), true);
assert.equal(filters.matches(find('soqueira'), 'equipment', 'hammer'), true);
assert.equal(filters.matches(find('escudodemadeira'), 'equipment', 'shield'), true);
assert.equal(filters.matches(find('armaduradelobo'), 'equipment', 'armor-body'), true);
assert.equal(filters.matches(find('braceirasdelobo'), 'equipment', 'armor-arms'), true);
assert.equal(filters.matches(find('calcasdelobo'), 'equipment', 'armor-legs'), true);
assert.equal(filters.matches(find('capuzelficodebruxo'), 'equipment', 'armor-head'), true);
assert.equal(filters.matches(find('alforjesgrandes'), 'equipment', 'mount-gear'), true);

assert.equal(filters.matches(find('carnedecoelho'), 'misc', 'culinary'), true);
assert.equal(filters.matches(find('cerebrodeafogador'), 'misc', 'monster'), true);
assert.equal(filters.matches(find('verbena'), 'misc', 'herb'), true);
assert.equal(filters.matches(find('mineriodeferro'), 'misc', 'ore'), true);
assert.equal(filters.matches(find('aco'), 'misc', 'metal'), true);
assert.equal(filters.matches(find('carvao'), 'misc', 'natural'), true);
assert.equal(filters.matches(find('madeiraendurecida'), 'misc', 'natural'), true);
assert.equal(filters.matches(find('cavalodeguerra'), 'misc', 'mount'), true);
assert.equal(filters.matches(find('carrocasimples'), 'misc', 'mount'), true);
assert.equal(filters.matches(find('carruagemcomum'), 'misc', 'mount'), true);
assert.equal(filters.matches(find('carruagemcomum'), 'misc', 'vehicle'), true);

const mountCatalog = items.filter(item => item.transportKind === 'mount');
const vehicleCatalog = items.filter(item => item.transportKind === 'vehicle');
const mountGearCatalog = items.filter(item => item.transportKind === 'mount-gear');
assert.equal(mountCatalog.length, 4, 'O catálogo deve oferecer quatro tipos de cavalo.');
assert.equal(vehicleCatalog.length, 4, 'O catálogo deve oferecer duas carroças e duas carruagens.');
assert.equal(mountGearCatalog.length, 11, 'O catálogo deve oferecer equipamentos para todos os slots da montaria.');
assert.equal(find('ferradurasdecorrida').movementModifier, 2);
assert.equal(find('ferraduraselficas').movementModifier, 3);
assert.ok(mountCatalog.every(item => filters.matches(item, 'misc', 'mount')));
assert.ok(vehicleCatalog.every(item => filters.matches(item, 'misc', 'mount')));
assert.ok(vehicleCatalog.every(item => filters.matches(item, 'misc', 'vehicle')));
assert.ok(mountGearCatalog.every(item => filters.matches(item, 'equipment', 'mount-gear')));

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const navigationSource = fs.readFileSync(path.join(projectRoot, 'js', 'navigation.js'), 'utf8');
assert.match(indexSource, /js\/inventory-filters\.js/);
assert.match(indexSource, /inventoryModalSubfilters/);
assert.match(workerSource, /witcher-combat-tracker-v102/);
assert.match(workerSource, /js\/inventory-filters\.js/);
assert.doesNotMatch(navigationSource, /addEventListener\(['"]touch(?:start|end)/);

console.log('✓ Filtros contextuais do inventário e catálogo validados.');
