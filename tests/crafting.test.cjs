const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const elements = new Map();
const historyEntries = [];
const element = (id, initial = {}) => {
    const value = { id, style: {}, value: '', textContent: '', ...initial };
    elements.set(id, value);
    return value;
};

[
    'craftingModalTitle', 'craftingModalContext', 'craftingQuantityInput',
    'craftingTestArea', 'craftingDifficultyLabel', 'craftingManualResultField',
    'craftingAutoBonusField', 'craftingManualResultInput', 'craftingAutoBonusInput',
    'craftingOutputPreview', 'craftingModal', 'transferItemName', 'transferItemContext',
    'transferQuantityInput', 'transferItemModal'
].forEach(id => element(id));

element('transferTargetSelect', {
    children: [],
    replaceChildren() { this.children = []; this.value = ''; },
    append(option) {
        this.children.push(option);
        if (!this.value) this.value = option.value;
    }
});

const contextObject = {
    console,
    window: null,
    document: {
        getElementById: id => elements.get(id) || null,
        createElement: () => ({ value: '', textContent: '' }),
        addEventListener() {},
        querySelectorAll: () => []
    },
    localStorage: { getItem: () => null },
    renderIcon: icon => `<span>${icon}</span>`,
    renderInventory() {},
    saveInventory() {},
    showToast() {},
    persistCharacterSheets() {},
    addCombatHistoryEntry(...args) { historyEntries.push(args); }
};
contextObject.window = contextObject;
const context = vm.createContext(contextObject);

const itemsSource = fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8');
const craftingSource = fs.readFileSync(path.join(projectRoot, 'js', 'crafting.js'), 'utf8');

vm.runInContext(`${itemsSource}
let inventory = [];
let combatants = [];
let characterSheets = [];
let selectedInventoryItemId = null;
let appPreferences = { rollModes: { crafting: 'manual' } };
let round = 1;`, context, { filename: 'items.js' });
vm.runInContext(craftingSource, context, { filename: 'crafting.js' });

const recipes = context.getCraftingRecipes();
assert.equal(recipes.length, 85, 'A quantidade de produtos com receita mudou sem atualizar a auditoria.');

const categoryCounts = recipes.reduce((counts, recipe) => {
    const category = context.getCraftingRecipeCategory(recipe);
    counts[category] = (counts[category] || 0) + 1;
    return counts;
}, {});
assert.deepEqual(categoryCounts, { weapons: 29, materials: 5, alchemy: 51 });
assert.equal(context.getCraftingRecipeCategory({ type: 'armor', equipmentSlot: 'body' }), 'armor');
assert.equal(context.getCraftingRecipeCategory({ category: 'misc' }), 'materials');
assert.equal(context.getCraftingRecipeCategory({ category: 'usable' }), 'alchemy');

const incomplete = recipes.filter(recipe => !recipe.complete);
assert.deepEqual(
    Array.from(incomplete, recipe => recipe.product.name),
    ['Fissstech'],
    'Somente a receita desconhecida de Fissstech pode permanecer bloqueada.'
);
assert.deepEqual(
    Array.from(recipes.flatMap(recipe => recipe.missingIngredients)),
    [],
    'Toda matéria-prima nomeada deve existir no catálogo.'
);

const silverPowder = recipes.find(recipe => recipe.product.id === 'podeprata');
assert.equal(silverPowder.outputQuantity, 6);
assert.equal(silverPowder.ingredients[0].item.id, 'prata');

const arrows = recipes.filter(recipe => ['flechadeaco', 'flechadeferro', 'flechadeprata'].includes(recipe.product.id));
assert.equal(arrows.length, 3);
arrows.forEach(recipe => assert.equal(recipe.outputQuantity, 10));

const dimeritiumPowder = recipes.find(recipe => recipe.product.id === 'podedimeritio');
assert.equal(dimeritiumPowder.ingredients.some(ingredient => ingredient.item.id === 'dimeritio'), true);
assert.equal(dimeritiumPowder.ingredients.some(ingredient => ingredient.item.id === dimeritiumPowder.product.id), false);

const parsedDifficulty = context.parseCraftingRecipeLine('2x Ferro (ND 14)');
assert.equal(parsedDifficulty.ingredientName, 'Ferro');
assert.equal(parsedDifficulty.ingredientQuantity, 2);
assert.equal(parsedDifficulty.difficulty, 14);

vm.runInContext(`
inventory = [{ ...predefinedItems.find(item => item.id === 'prata'), quantity: 2 }];
combatants = [
    { id: 'geralt', name: 'Geralt', inventory },
    { id: 'yennefer', name: 'Yennefer', inventory: [] }
];
window.getCharacterCollectionOwner = () => combatants[0];
window.getCharacterCollectionContextInfo = () => ({ name: combatants[0].name });
window.isItemEquippedForCurrentOwner = () => false;
`, context);

context.openCraftingModal('podeprata');
elements.get('craftingQuantityInput').value = '2';
context.confirmCrafting();

const craftedInventory = vm.runInContext('JSON.parse(JSON.stringify(inventory))', context);
assert.equal(craftedInventory.some(item => item.id === 'prata'), false);
assert.equal(craftedInventory.find(item => item.id === 'podeprata')?.quantity, 12);

vm.runInContext(`
inventory = [{ ...predefinedItems.find(item => item.id === 'prata'), quantity: 3 }];
combatants[0].inventory = inventory;
combatants[1].inventory = [];
selectedInventoryItemId = 'prata';
`, context);
context.openTransferItemModal();
elements.get('transferQuantityInput').value = '2';
elements.get('transferTargetSelect').value = 'yennefer';
context.confirmItemTransfer();

const transferState = vm.runInContext(`JSON.parse(JSON.stringify({
    source: inventory,
    target: combatants[1].inventory
}))`, context);
assert.equal(transferState.source.find(item => item.id === 'prata')?.quantity, 1);
assert.equal(transferState.target.find(item => item.id === 'prata')?.quantity, 2);

vm.runInContext(`
inventory = [{ ...predefinedItems.find(item => item.id === 'prata'), quantity: 1 }];
window.isItemEquippedForCurrentOwner = () => true;
`, context);
const reservedState = context.getRecipeCraftingState(silverPowder);
assert.equal(reservedState.maxBatches, 0, 'A última unidade equipada não pode ser consumida.');

vm.runInContext(`
predefinedItems.push({
    id: 'receitateste',
    name: 'Receita de Teste',
    icon: '⚒️',
    category: 'usable',
    type: 'custom',
    craftingDifficulty: 12,
    recipe: ['1x Prata']
});
inventory = [{ ...predefinedItems.find(item => item.id === 'prata'), quantity: 1 }];
combatants[0].inventory = inventory;
window.isItemEquippedForCurrentOwner = () => false;
appPreferences.rollModes.crafting = 'manual';
`, context);
context.openCraftingModal('receitateste');
elements.get('craftingManualResultInput').value = '11';
context.confirmCrafting();
const failedCraft = vm.runInContext('JSON.parse(JSON.stringify(inventory))', context);
assert.equal(failedCraft.find(item => item.id === 'prata')?.quantity, 1, 'Falhas preservam os ingredientes.');
assert.equal(failedCraft.some(item => item.id === 'receitateste'), false);
assert.match(historyEntries.at(-1)?.[0] || '', /Falhou ao criar Receita de Teste/);

vm.runInContext(`
inventory = [{ ...predefinedItems.find(item => item.id === 'prata'), quantity: 1 }];
combatants[0].inventory = inventory;
appPreferences.rollModes.crafting = 'auto';
Math.random = () => 0.9;
`, context);
context.openCraftingModal('receitateste');
elements.get('craftingAutoBonusInput').value = '2';
context.confirmCrafting();
const automaticCraft = vm.runInContext('JSON.parse(JSON.stringify(inventory))', context);
assert.equal(automaticCraft.some(item => item.id === 'prata'), false);
assert.equal(automaticCraft.find(item => item.id === 'receitateste')?.quantity, 1);

console.log('✓ Criação, rendimentos, catálogo e transferência validados.');
