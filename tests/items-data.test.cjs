const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = `${fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8')}
globalThis.__predefinedItems = predefinedItems;`;
const context = vm.createContext({});

vm.runInContext(source, context, { filename: 'items.js' });

const items = context.__predefinedItems;
const ids = items.map(item => item.id);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

assert.deepEqual(duplicateIds, [], `IDs duplicados: ${duplicateIds.join(', ')}`);

const witcherSteelSword = items.find(item => item.id === 'espadadeacodebruxo');
const witcherSilverSword = items.find(item => item.id === 'espadadepratadebruxo');

assert.equal(witcherSteelSword?.name, 'Espada de Aço de Bruxo');
assert.equal(witcherSilverSword?.name, 'Espada de Prata de Bruxo');
assert.notEqual(witcherSteelSword.id, witcherSilverSword.id);
assert.equal(witcherSilverSword.damage, '4d6');
assert.equal(witcherSilverSword.effect, 'Dano de Prata');

console.log(`✓ Catálogo validado: ${items.length} itens com identificadores únicos.`);
