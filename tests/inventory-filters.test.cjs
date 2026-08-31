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

assert.equal(filters.matches(find('carnedecoelho'), 'misc', 'culinary'), true);
assert.equal(filters.matches(find('cerebrodeafogador'), 'misc', 'monster'), true);
assert.equal(filters.matches(find('verbena'), 'misc', 'herb'), true);
assert.equal(filters.matches(find('mineriodeferro'), 'misc', 'ore'), true);
assert.equal(filters.matches(find('aco'), 'misc', 'metal'), true);
assert.equal(filters.matches(find('carvao'), 'misc', 'natural'), true);
assert.equal(filters.matches(find('madeiraendurecida'), 'misc', 'natural'), true);

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const navigationSource = fs.readFileSync(path.join(projectRoot, 'js', 'navigation.js'), 'utf8');
assert.match(indexSource, /js\/inventory-filters\.js/);
assert.match(indexSource, /inventoryModalSubfilters/);
assert.match(workerSource, /witcher-combat-tracker-v75/);
assert.match(workerSource, /js\/inventory-filters\.js/);
assert.doesNotMatch(navigationSource, /addEventListener\(['"]touch(?:start|end)/);

console.log('✓ Filtros contextuais do inventário e catálogo validados.');
