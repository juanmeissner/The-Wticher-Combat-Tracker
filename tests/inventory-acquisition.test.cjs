const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const inventorySource = fs.readFileSync(path.join(projectRoot, 'js', 'inventory.js'), 'utf8');
const stored = new Map();
const history = [];

const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    predefinedItems: [
        { id: 'coroa', name: 'Coroa', category: 'misc', goldValue: 1, description: 'Moeda.', recipe: [] },
        { id: 'pocao', name: 'Poção de Teste', category: 'usable', goldValue: 15, description: 'Descrição do catálogo.', recipe: [] },
        { id: 'flecha', name: 'Flecha de Ferro', category: 'equipment', goldValue: 5, weight: 0.1, weightSource: 'rules-sheet', acquisitionPackSize: 10, acquisitionUnitLabel: 'kit', acquisitionContentLabel: 'flechas', description: 'Kit com 10 flechas.', recipe: [] },
        { id: 'alforje', name: 'Alforje', category: 'equipment', type: 'mount-gear', transportKind: 'mount-gear', mountSlot: 'saddlebags', capacity: 60, description: 'Carga.', recipe: [] },
        { id: 'carroca', name: 'Carroça', category: 'misc', type: 'vehicle', transportKind: 'vehicle', hp: 60, capacity: 150, requiredMounts: 1, movementModifier: -2, description: 'Veículo.', recipe: [] }
    ],
    document: {
        getElementById() { return null; },
        querySelectorAll() { return []; },
        querySelector() { return null; },
        addEventListener() {}
    },
    localStorage: {
        getItem(key) { return stored.get(key) ?? null; },
        setItem(key, value) { stored.set(key, String(value)); }
    },
    showToast() {}
});
context.window = context;
context.window.addEventListener = () => {};
context.addCombatHistoryEntry = (...args) => history.push(args);
context.getCharacterCollectionOwner = () => ({ id: 'geralt', name: 'Geralt' });

vm.runInContext(`${inventorySource}
globalThis.__setInventory = value => { inventory = value; };
globalThis.__getInventory = () => inventory;
globalThis.__getInventoryDisplayItem = getInventoryDisplayItem;
globalThis.__getTransportItemDetailFacts = getTransportItemDetailFacts;
globalThis.__synchronizeInventoryCatalogWeights = synchronizeInventoryCatalogWeights;`, context, { filename: 'inventory.js' });

context.__setInventory([{ ...context.predefinedItems[0], quantity: 1, moneyValue: 100 }]);

let result = context.acquireInventoryItem('pocao', 2, { purchased: true, unitPrice: 15 });
assert.equal(result.acquired, true);
assert.equal(result.total, 30);
assert.equal(context.__getInventory().find(item => item.id === 'coroa').moneyValue, 70);
assert.equal(context.__getInventory().find(item => item.id === 'pocao').quantity, 2);
assert.match(history.at(-1)[1], /Total debitado: 30 Coroas/);

result = context.acquireInventoryItem('pocao', 3, { purchased: false, unitPrice: 999 });
assert.equal(result.acquired, true);
assert.equal(result.total, 0);
assert.equal(context.__getInventory().find(item => item.id === 'coroa').moneyValue, 70);
assert.equal(context.__getInventory().find(item => item.id === 'pocao').quantity, 5);

result = context.acquireInventoryItem('pocao', 5, { purchased: true, unitPrice: 20 });
assert.equal(result.acquired, false);
assert.equal(result.reason, 'insufficient-crowns');
assert.equal(context.__getInventory().find(item => item.id === 'coroa').moneyValue, 70);
assert.equal(context.__getInventory().find(item => item.id === 'pocao').quantity, 5);

result = context.acquireInventoryItem('flecha', 2, { purchased: true, unitPrice: 5 });
assert.equal(result.acquired, true);
assert.equal(result.acquisitionUnits, 2);
assert.equal(result.packSize, 10);
assert.equal(result.quantity, 20);
assert.equal(result.total, 10);
assert.equal(context.__getInventory().find(item => item.id === 'coroa').moneyValue, 60);
assert.equal(context.__getInventory().find(item => item.id === 'flecha').quantity, 20);
assert.match(history.at(-1)[1], /2 kits · 10 flechas por kit/);
assert.match(history.at(-1)[1], /Total debitado: 10 Coroas/);

const staleItem = { id: 'pocao', name: 'Poção de Teste', category: 'usable', quantity: 1, description: '' };
assert.equal(context.__getInventoryDisplayItem(staleItem).description, 'Descrição do catálogo.');
assert.match(Array.from(context.__getTransportItemDetailFacts(context.predefinedItems[3])).join(' | '), /Concede 60 de capacidade de carga/);
assert.match(Array.from(context.__getTransportItemDetailFacts(context.predefinedItems[4])).join(' | '), /Capacidade: 150 de peso/);
assert.match(Array.from(context.__getTransportItemDetailFacts(context.predefinedItems[4])).join(' | '), /Exige 1 cavalo/);
assert.match(Array.from(context.__getTransportItemDetailFacts(context.predefinedItems[4])).join(' | '), /Movimento: -2/);

const legacyAmmunition = [{ id: 'flecha', name: 'Flecha de Ferro', weight: 1.5, weightSource: 'estimated' }];
assert.equal(context.__synchronizeInventoryCatalogWeights(legacyAmmunition), 1);
assert.equal(legacyAmmunition[0].weight, 0.1);
assert.equal(legacyAmmunition[0].weightSource, 'rules-sheet');

console.log('✓ Detalhes, aquisição gratuita e compra com Coroas validados.');
