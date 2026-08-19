const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'character-collections.js'), 'utf8');

function createStorage(initial = {}) {
    const data = new Map(Object.entries(initial));

    return {
        getItem(key) {
            return data.has(key) ? data.get(key) : null;
        },
        setItem(key, value) {
            data.set(key, String(value));
        },
        removeItem(key) {
            data.delete(key);
        }
    };
}

function createHarness({
    combatants,
    activeTurnId,
    inventory = [],
    abilities = [],
    expandedMagic = 0,
    characterSheets = [],
    activeCharacterSheetId = null,
    storage = {}
}) {
    const context = vm.createContext({
        console,
        structuredClone,
        localStorage: createStorage(storage),
        document: {
            getElementById() { return null; },
            querySelectorAll() { return []; }
        }
    });

    context.__fixtures = {
        combatants,
        activeTurnId,
        inventory,
        abilities,
        expandedMagic,
        characterSheets,
        activeCharacterSheetId
    };

    vm.runInContext(`
        var window = globalThis;
        let combatants = __fixtures.combatants;
        let activeTurnId = __fixtures.activeTurnId;
        let inventory = __fixtures.inventory;
        let abilitiesInventory = __fixtures.abilities;
        let expandedMagic = __fixtures.expandedMagic;
        let selectedInventoryItemId = null;
        let selectedAbilityId = null;
        let characterSheets = __fixtures.characterSheets;
        let activeCharacterSheetId = __fixtures.activeCharacterSheetId;
        function renderInventory() {}
        function renderAbilities() {}
        function updateAbilitiesHeader() {}
        function showToast() {}
        function persistCharacterSheets() {}
        function savePlayersToStorage() {}
        window.savePlayersToStorage = savePlayersToStorage;
    `, context);

    vm.runInContext(source, context, { filename: 'character-collections.js' });
    return context;
}

function read(context, expression) {
    return JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context));
}

{
    const context = createHarness({
        combatants: [
            { id: 1, name: 'Geralt', type: 'player', inventory: [], abilities: [], expandedMagic: 0 },
            { id: 2, name: 'Yennefer', type: 'player', inventory: [], abilities: [], expandedMagic: 0 }
        ],
        activeTurnId: 1
    });

    vm.runInContext('window.initializeCharacterCollections()', context);
    assert.equal(read(context, 'window.getCharacterCollectionContextInfo()').name, 'Geralt');

    vm.runInContext(`
        inventory.push({ id: 'espada-bruxo', name: 'Espada de Bruxo', quantity: 1 });
        abilitiesInventory.push({ id: 'quen', name: 'Quen' });
        expandedMagic = 2;
        window.persistCharacterCollections();
        activeTurnId = 2;
        window.followActiveTurnCharacterCollectionContext();
    `, context);

    assert.deepEqual(read(context, 'inventory'), []);
    assert.deepEqual(read(context, 'abilitiesInventory'), []);
    assert.equal(read(context, 'expandedMagic'), 0);

    vm.runInContext(`
        inventory.push({ id: 'cloroformio', name: 'Clorofórmio', quantity: 1 });
        abilitiesInventory.push({ id: 'teletransporte', name: 'Teletransporte' });
        window.persistCharacterCollections();
        activeTurnId = 1;
        window.followActiveTurnCharacterCollectionContext();
    `, context);

    assert.equal(read(context, 'inventory[0].id'), 'espada-bruxo');
    assert.equal(read(context, 'abilitiesInventory[0].id'), 'quen');
    assert.equal(read(context, 'expandedMagic'), 2);
    assert.equal(read(context, 'combatants[1].inventory[0].id'), 'cloroformio');

    vm.runInContext(`
        window.selectCharacterCollectionOwner('combatant:2');
    `, context);
    assert.equal(read(context, 'inventory[0].id'), 'cloroformio');

    vm.runInContext('window.ensureActiveTurnCharacterCollectionContext()', context);
    assert.equal(read(context, 'window.getCharacterCollectionContextInfo()').name, 'Geralt');
    assert.equal(read(context, 'inventory[0].id'), 'espada-bruxo');
}

{
    const context = createHarness({
        combatants: [
            { id: 10, name: 'Ficha antiga', type: 'player' },
            { id: 11, name: 'Outro personagem', type: 'player' }
        ],
        activeTurnId: 10,
        inventory: [{ id: 'item-antigo', name: 'Item antigo', quantity: 1 }],
        abilities: [{ id: 'magia-antiga', name: 'Magia antiga' }],
        expandedMagic: 1
    });

    vm.runInContext(`
        window.initializeCharacterCollections({
            inventory,
            abilities: abilitiesInventory,
            expandedMagic
        });
    `, context);

    assert.equal(read(context, 'combatants[0].inventory[0].id'), 'item-antigo');
    assert.equal(read(context, 'combatants[0].abilities[0].id'), 'magia-antiga');
    assert.equal(read(context, 'combatants[0].expandedMagic'), 1);
    assert.deepEqual(read(context, 'combatants[1].inventory'), []);
}

{
    const context = createHarness({
        combatants: [
            {
                id: 20,
                sheetId: 'sheet-geralt',
                name: 'Geralt',
                type: 'player',
                inventory: [],
                abilities: [],
                expandedMagic: 0
            }
        ],
        activeTurnId: 20,
        characterSheets: [
            {
                id: 'sheet-geralt',
                name: 'Geralt',
                inventory: [],
                abilities: [],
                expandedMagic: 0
            }
        ],
        activeCharacterSheetId: 'sheet-geralt'
    });

    vm.runInContext(`
        window.initializeCharacterCollections();
        inventory.push({ id: 'pocao-andorinha', name: 'Andorinha', quantity: 2 });
        abilitiesInventory.push({ id: 'igni', name: 'Igni' });
        expandedMagic = 3;
        window.persistCharacterCollections();
    `, context);

    assert.equal(read(context, 'characterSheets[0].inventory[0].id'), 'pocao-andorinha');
    assert.equal(read(context, 'characterSheets[0].abilities[0].id'), 'igni');
    assert.equal(read(context, 'characterSheets[0].expandedMagic'), 3);
}

console.log('✓ Coleções individuais por personagem e migração legada validadas.');
