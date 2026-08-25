const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'equipment.js'), 'utf8');

const inventoryFixture = [
    {
        id: 'steel-sword',
        name: 'Espada de Aço',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6',
        description: 'Espada de Uma Mão',
        quantity: 1
    },
    {
        id: 'silver-sword',
        name: 'Espada de Prata',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6',
        effect: 'Dano de Prata',
        description: 'Espada de Duas Mãos',
        quantity: 1
    },
    {
        id: 'temerian-shield',
        name: 'Escudo Temeriano',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Escudo',
        defense: 3,
        quantity: 1
    },
    {
        id: 'cuirass',
        name: 'Couraça',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 5,
        quantity: 1
    },
    {
        id: 'wolf-helmet',
        name: 'Elmo de Lobo',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Média',
        equipmentSlot: 'head',
        defense: 4,
        quantity: 1
    },
    {
        id: 'wolf-bracers',
        name: 'Braceiras de Lobo',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Média',
        equipmentSlot: 'arms',
        defense: 3,
        quantity: 1
    },
    {
        id: 'wolf-pants',
        name: 'Calças de Lobo',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Média',
        equipmentSlot: 'legs',
        defense: 3,
        quantity: 1
    }
];

const elements = new Map();
const getElement = id => {
    if (!elements.has(id)) {
        elements.set(id, {
            id,
            style: {},
            classList: { toggle() {} },
            textContent: '',
            innerHTML: ''
        });
    }

    return elements.get(id);
};

const context = vm.createContext({
    console,
    structuredClone,
    Math,
    localStorage: {
        getItem() { return null; },
        setItem() {}
    },
    document: { getElementById: getElement }
});

context.__fixtures = { inventory: inventoryFixture };

vm.runInContext(`
    var window = globalThis;
    let inventory = __fixtures.inventory;
    let selectedInventoryItemId = null;
    let activeTurnId = 1;
    let currentInput = '0';
    let characterSheets = [];
    let combatants = [{
        id: 1,
        name: 'Geralt',
        type: 'player',
        armor: { head: 0, torso: 2, arm: 0, leg: 0 },
        inventory
    }];
    let appPreferences = { rollModes: { weapons: 'manual' } };
    const messages = [];
    function showToast(message) { messages.push(message); }
    function renderInventory() {}
    function renderList() {}
    function updateNumpad() {}
    function closeItemDetailsModal() {}
    function closeDamageModals() {}
    function clearDisplay() {}
    function persistCharacterSheets() {}
    window.getCharacterCollectionOwner = () => combatants[0];
    window.persistCharacterCollections = () => {
        combatants[0].inventory = JSON.parse(JSON.stringify(inventory));
    };
    window.savePlayersToStorage = () => {};
    window.trackEquipmentAction = (_label, callback) => callback();
    window.openSessionConfirm = options => options.onConfirm();
`, context);

vm.runInContext(source, context, { filename: 'equipment.js' });

const evaluate = expression => JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context));

vm.runInContext(`
    selectedInventoryItemId = 'steel-sword';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'silver-sword';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'temerian-shield';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'cuirass';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'wolf-helmet';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'wolf-bracers';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'wolf-pants';
    window.performSelectedEquipmentAction();
`, context);

assert.equal(evaluate('combatants[0].equipment.weapons[0]'), 'steel-sword');
assert.equal(evaluate('combatants[0].equipment.weapons[1]'), 'silver-sword');
assert.equal(evaluate('combatants[0].equipment.shield'), 'temerian-shield');
assert.equal(evaluate('combatants[0].equipment.armor.torso'), 'cuirass');
assert.equal(evaluate('combatants[0].equipment.armor.head'), 'wolf-helmet');
assert.equal(evaluate('combatants[0].equipment.armor.arm'), 'wolf-bracers');
assert.equal(evaluate('combatants[0].equipment.armor.leg'), 'wolf-pants');
assert.equal(evaluate("window.getInventoryEquipmentBadge('wolf-pants').label"), 'PERNAS EQUIPADO');
assert.equal(evaluate("window.getInventoryEquipmentBadge('silver-sword').label"), 'RESERVA 1');
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 10);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'head')"), 7);

vm.runInContext('window.cycleActiveWeapon(1)', context);

assert.equal(evaluate('combatants[0].equipment.activeWeaponSlot'), 1);
assert.equal(evaluate('combatants[0].equipment.shield'), null);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 7);

vm.runInContext(`
    selectedInventoryItemId = 'temerian-shield';
    window.performSelectedEquipmentAction();
`, context);

assert.equal(evaluate('combatants[0].equipment.shield'), null);
assert.match(evaluate('messages.at(-1)'), /duas mãos/i);

vm.runInContext('window.cycleActiveWeapon(1)', context);
vm.runInContext(`
    selectedInventoryItemId = 'temerian-shield';
    window.performSelectedEquipmentAction();
`, context);

assert.equal(evaluate('combatants[0].equipment.activeWeaponSlot'), 0);
assert.equal(evaluate('combatants[0].equipment.shield'), 'temerian-shield');

vm.runInContext(`
    window.requestArmorDamageSource(combatants[0], 'torso', 2);
    window.selectArmorDamageSource('shield');
`, context);

assert.equal(evaluate("inventory.find(item => item.id === 'temerian-shield').equipmentDefense"), 1);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 8);

vm.runInContext(`
    let selectedId = 1;
    let pendingDamageBase = 10;
    let pendingDamageBodyPart = 'torso';
    let appliedDamage = null;
    window.applyHP = (_isHealing, value, historyContext) => {
        appliedDamage = { value, historyContext };
    };
`, context);
vm.runInContext(
    fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'damage-modal.js'), 'utf8'),
    context,
    { filename: 'damage-modal.js' }
);
vm.runInContext('applyCalculatedDamage(1)', context);

assert.equal(evaluate('appliedDamage.value'), 2);
assert.equal(evaluate('appliedDamage.historyContext.armorAbsorbed'), 8);
assert.equal(evaluate('appliedDamage.historyContext.armorBreakdown.manual'), 2);
assert.equal(evaluate('appliedDamage.historyContext.armorBreakdown.equipment'), 5);
assert.equal(evaluate('appliedDamage.historyContext.armorBreakdown.region'), 7);
assert.equal(evaluate('appliedDamage.historyContext.armorBreakdown.shield'), 1);

vm.runInContext(`
    combatants[0].armor.torso = 4;
`, context);

assert.equal(evaluate("inventory.find(item => item.id === 'cuirass').equipmentDefense"), 5);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 10);

vm.runInContext(`
    selectedInventoryItemId = 'cuirass';
    window.performSelectedEquipmentAction();
`, context);

assert.equal(evaluate('combatants[0].equipment.armor.torso'), null);
assert.equal(evaluate('combatants[0].armor.torso'), 4);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 5);

vm.runInContext(`
    pendingDamageBase = 5;
    appliedDamage = null;
    applyCalculatedDamage(1);
`, context);

assert.equal(evaluate('appliedDamage'), null);

const roll = evaluate("window.rollDiceExpression('4d6+2', () => 0)");
assert.deepEqual(roll.rolls, [1, 1, 1, 1]);
assert.equal(roll.total, 6);

const multipliedRoll = evaluate("window.rollDiceExpression('6d6*2', () => 0)");
assert.equal(multipliedRoll.subtotal, 6);
assert.equal(multipliedRoll.total, 12);

const attack = evaluate("window.normalizeMonsterAction('Mordida 2d6 Sangramento', 0)");
assert.equal(attack.name, 'Mordida');
assert.equal(attack.damage, '2d6');
assert.equal(attack.details, 'Sangramento');

{
    const catalogContext = vm.createContext({ console, Math });
    vm.runInContext('var window = globalThis;', catalogContext);
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8'),
        catalogContext,
        { filename: 'items.js' }
    );
    vm.runInContext(source, catalogContext, { filename: 'equipment.js' });
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'js', 'bestiary.js'), 'utf8'),
        catalogContext,
        { filename: 'bestiary.js' }
    );

    const catalogAudit = JSON.parse(vm.runInContext(`JSON.stringify((() => {
        const equipment = predefinedItems.filter(item => item.category === 'equipment');
        const unclassified = equipment.filter(item => !window.getEquipmentItemKind(item));
        const armor = equipment.filter(item => item.type === 'armor');
        const slotCounts = armor.reduce((counts, item) => {
            const slot = window.getEquipmentItemSlot(item);
            counts[slot] = (counts[slot] || 0) + 1;
            return counts;
        }, {});
        const invalidWeaponDamage = equipment.filter(item =>
            window.getEquipmentItemKind(item) === 'weapon' &&
            !/^\\d+d\\d+(?:[+-]\\d+)?$/i.test(String(item.damage || '').replaceAll(' ', ''))
        );
        const monsterActions = monsterDatabase.flatMap(monster => window.buildMonsterActions(monster.attacks));
        return {
            equipmentCount: equipment.length,
            unclassified: unclassified.map(item => item.name),
            missingArmorSlots: armor.filter(item => !item.equipmentSlot).map(item => item.name),
            slotCounts,
            invalidWeaponDamage: invalidWeaponDamage.map(item => item.name),
            monsterActionCount: monsterActions.length,
            rollableMonsterActions: monsterActions.filter(action => action.damage).length
        };
    })())`, catalogContext));

    assert.equal(catalogAudit.equipmentCount, 147);
    assert.deepEqual(catalogAudit.unclassified, []);
    assert.deepEqual(catalogAudit.missingArmorSlots, []);
    assert.deepEqual(catalogAudit.slotCounts, { head: 15, body: 22, arms: 22, legs: 22, shield: 9 });
    assert.deepEqual(catalogAudit.invalidWeaponDamage, []);
    assert.equal(catalogAudit.monsterActionCount, 73);
    assert.equal(catalogAudit.rollableMonsterActions, 56);
}

console.log('✓ Equipamentos, escudo, armas reservas, dados e ataques validados.');
