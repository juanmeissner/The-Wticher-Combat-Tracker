const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'character-collections.js'), 'utf8');
assert.match(source, /collaborationSession\?\.getSession/);
assert.match(source, /linkedParticipantId/);
const equipmentSource = fs.readFileSync(path.join(projectRoot, 'js', 'equipment.js'), 'utf8');

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

    vm.runInContext(equipmentSource, context, { filename: 'equipment.js' });
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
                expandedMagic: 0,
                equipment: {}
            }
        ],
        activeTurnId: 20,
        characterSheets: [
            {
                id: 'sheet-geralt',
                name: 'Geralt',
                inventory: [],
                abilities: [],
                expandedMagic: 0,
                equipment: {}
            }
        ],
        activeCharacterSheetId: 'sheet-geralt'
    });

    vm.runInContext(`
        window.initializeCharacterCollections();
        inventory.push({ id: 'pocao-andorinha', name: 'Andorinha', quantity: 2 });
        abilitiesInventory.push({ id: 'igni', name: 'Igni' });
        expandedMagic = 3;
        combatants[0].equipment = {
            version: 1,
            weapons: ['espada-bruxo', null, null],
            activeWeaponSlot: 0,
            shield: null,
            armor: { head: null, torso: null, arm: null, leg: null }
        };
        window.persistCharacterCollections();
    `, context);

    assert.equal(read(context, 'characterSheets[0].inventory[0].id'), 'pocao-andorinha');
    assert.equal(read(context, 'characterSheets[0].abilities[0].id'), 'igni');
    assert.equal(read(context, 'characterSheets[0].expandedMagic'), 3);
    assert.equal(read(context, 'characterSheets[0].equipment.weapons[0]'), 'espada-bruxo');
}

{
    const geraltInventory = [{
        id: 'wolf-pants',
        name: 'Calças de Lobo',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Média',
        equipmentSlot: 'legs',
        defense: 3,
        quantity: 1
    }];
    const yenneferInventory = [{
        id: 'hood',
        name: 'Capuz Élfico',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Leve',
        equipmentSlot: 'head',
        defense: 2,
        quantity: 1
    }];
    const context = createHarness({
        combatants: [
            {
                id: 31,
                name: 'Geralt',
                type: 'player',
                inventory: geraltInventory,
                abilities: [],
                equipment: {
                    version: 1,
                    weapons: [null, null, null],
                    activeWeaponSlot: 0,
                    shield: null,
                    armor: { head: null, torso: null, arm: null, leg: 'wolf-pants' }
                }
            },
            {
                id: 32,
                name: 'Yennefer',
                type: 'player',
                inventory: yenneferInventory,
                abilities: [],
                equipment: {
                    version: 1,
                    weapons: [null, null, null],
                    activeWeaponSlot: 0,
                    shield: null,
                    armor: { head: 'hood', torso: null, arm: null, leg: null }
                }
            }
        ],
        activeTurnId: 31
    });

    vm.runInContext('window.initializeCharacterCollections()', context);
    assert.equal(read(context, 'combatants[0].equipment.armor.leg'), 'wolf-pants');
    assert.equal(read(context, "window.getInventoryEquipmentBadge('wolf-pants').label"), 'PERNAS EQUIPADO');

    vm.runInContext(`
        activeTurnId = 32;
        window.followActiveTurnCharacterCollectionContext();
    `, context);
    assert.equal(read(context, 'combatants[1].equipment.armor.head'), 'hood');
    assert.equal(read(context, "window.getInventoryEquipmentBadge('hood').label"), 'CABEÇA EQUIPADO');

    vm.runInContext(`
        activeTurnId = 31;
        window.followActiveTurnCharacterCollectionContext();
    `, context);
    assert.equal(read(context, 'combatants[0].equipment.armor.leg'), 'wolf-pants');
    assert.equal(read(context, "window.getInventoryEquipmentBadge('wolf-pants').label"), 'PERNAS EQUIPADO');
}

console.log('✓ Coleções individuais por personagem e migração legada validadas.');
