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

const careConsumables = items.filter(item => item.careConsumable);
assert.equal(careConsumables.length, 14);
assert.equal(items.find(item => item.id === 'racaodeviagem')?.careConsumable?.optionId, 'simple_meal');
assert.equal(items.find(item => item.id === 'ensopadodeestalagem')?.careConsumable?.optionId, 'good_meal');
assert.equal(items.find(item => item.id === 'banquetedetoussaint')?.careConsumable?.optionId, 'sophisticated_meal');
assert.equal(items.find(item => item.id === 'aguapotavel')?.careConsumable?.kind, 'drink');
careConsumables.forEach(item => {
    assert.equal(item.category, 'usable');
    assert.equal(item.careConsumable.portionsPerUnit, 1);
    assert.ok(Array.isArray(item.recipe));
    assert.equal(item.craftingCategory, 'culinary');
    assert.ok(item.recipe.length > 0);
});
[
    'cereais', 'carneseca', 'sal', 'carne', 'legumes', 'ervasculinarias',
    'carnenobre', 'aguabruta', 'lupulo', 'levedura', 'uvasdetoussaint',
    'carnedecoelho', 'carnedeveado', 'carnedeporco', 'batata', 'cebola',
    'cenoura', 'alho', 'cogumeloscomestiveis', 'farinha', 'ovos', 'leite', 'manteiga'
].forEach(itemId => {
    const ingredient = items.find(item => item.id === itemId);
    assert.ok(ingredient, `Ingrediente culinário ausente: ${itemId}`);
    assert.equal(ingredient.craftingMaterial, true);
});
assert.equal(items.find(item => item.id === 'coelhoassadocomervas')?.careConsumable?.optionId, 'good_meal');
assert.equal(items.find(item => item.id === 'estufadorealdacaca')?.careConsumable?.optionId, 'sophisticated_meal');

console.log(`✓ Catálogo validado: ${items.length} itens com identificadores únicos.`);
