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
        weight: 2.5,
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
        weight: 1.5,
        effect: 'Dano de Prata',
        description: 'Espada de Duas Mãos',
        quantity: 1
    },
    {
        id: 'short-bow',
        name: 'Arco Curto',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        requiredAmmunitionType: 'arrow',
        damage: '3d6+3',
        weight: 2,
        description: 'Arco',
        quantity: 1
    },
    {
        id: 'crossbow',
        name: 'Besta',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        requiredAmmunitionType: 'bolt',
        damage: '4d6+2',
        weight: 3,
        description: 'Besta',
        quantity: 1
    },
    {
        id: 'iron-arrow',
        name: 'Flecha de Ferro',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Flechas',
        ammunitionType: 'arrow',
        damage: '0',
        weight: 1.5,
        quantity: 2
    },
    {
        id: 'steel-arrow',
        name: 'Flecha de Aço',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Flechas',
        ammunitionType: 'arrow',
        damage: '1d6 de Dano Adicional',
        weight: 1.5,
        quantity: 3
    },
    {
        id: 'iron-bolt',
        name: 'Seta de Ferro',
        category: 'equipment',
        type: 'weapon',
        weaponType: 'Setas',
        ammunitionType: 'bolt',
        damage: '0',
        weight: 1.5,
        quantity: 2
    },
    {
        id: 'temerian-shield',
        name: 'Escudo Temeriano',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Escudo',
        defense: 3,
        weight: 1.5,
        quantity: 1
    },
    {
        id: 'cuirass',
        name: 'Couraça',
        category: 'equipment',
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 5,
        weight: 2,
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
        weight: 1,
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
        weight: 2,
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
        weight: 2,
        quantity: 1
    },
    {
        id: 'spare-saddlebags',
        name: 'Alforjes de Teste',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        weight: 4,
        quantity: 2
    },
    {
        id: 'test-horse',
        name: 'Cavalo de Teste',
        category: 'misc',
        type: 'mount',
        transportKind: 'mount',
        weight: 400,
        quantity: 1
    },
    {
        id: 'test-cart',
        name: 'Carroça de Teste',
        category: 'misc',
        type: 'vehicle',
        transportKind: 'vehicle',
        weight: 200,
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
    window.getUsedMountGearQuantity = (_owner, itemId) => itemId === 'spare-saddlebags' ? 1 : 0;
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
assert.equal(evaluate('combatants[0].equipment.version'), 3);
assert.deepEqual(evaluate('combatants[0].equipment.ammunition'), [null, null]);
assert.equal(evaluate('combatants[0].equipment.activeAmmunitionSlot'), 0);
assert.equal(evaluate('combatants[0].equipment.shield'), 'temerian-shield');
assert.equal(evaluate('combatants[0].equipment.armor.torso'), 'cuirass');
assert.equal(evaluate('combatants[0].equipment.armor.head'), 'wolf-helmet');
assert.equal(evaluate('combatants[0].equipment.armor.arm'), 'wolf-bracers');
assert.equal(evaluate('combatants[0].equipment.armor.leg'), 'wolf-pants');
assert.equal(evaluate("window.getInventoryEquipmentBadge('wolf-pants').label"), 'PERNAS EQUIPADO');
assert.equal(evaluate("window.getInventoryEquipmentBadge('silver-sword').label"), 'RESERVA 1');
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 10);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'head')"), 7);
assert.equal(evaluate('window.getEquippedWeightBreakdown(combatants[0]).total'), 12.5);
assert.equal(evaluate('window.getEquippedWeightBreakdown(combatants[0]).weapons'), 4);
assert.equal(evaluate('window.getCarriedWeightMode()'), 'equipped');
assert.equal(evaluate('window.getCharacterCarriedWeightBreakdown(combatants[0]).total'), 12.5);
assert.equal(evaluate('window.getInventoryWeightBreakdown(combatants[0]).total'), 32);
vm.runInContext("appPreferences.carriedWeightMode = 'inventory'", context);
assert.equal(evaluate('window.getCarriedWeightMode()'), 'inventory');
assert.equal(evaluate('window.getCharacterCarriedWeightBreakdown(combatants[0]).total'), 32);
vm.runInContext("appPreferences.carriedWeightMode = 'equipped'", context);
assert.equal(
    evaluate("window.getEquippedWeightBreakdown(combatants[0]).entries.filter(entry => entry.category === 'weapon-reserve').length"),
    1,
    'A arma reserva deve contar como peso equipado.'
);
vm.runInContext(`
    combatants[0].creationMode = 'full';
    window.characterSheetModel = {
        calculateCharacterDerivedValues: (_combatant, options) => ({
            carryingCapacity: 20,
            movement: options.equippedWeight >= 10 ? 7 : 9
        })
    };
`, context);
assert.match(
    evaluate('window.renderCombatantEquipmentPanel(combatants[0])'),
    /12\.5\/20 de carga/
);
assert.match(evaluate('window.renderCombatantEquipmentPanel(combatants[0])'), /Movimento 7/);

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

const disarmedWeapon = evaluate('window.disarmActiveWeapon(combatants[0])');
assert.equal(disarmedWeapon.name, 'Espada de Aço');
assert.equal(disarmedWeapon.replacementName, 'Espada de Prata');
assert.equal(evaluate('combatants[0].equipment.weapons[0]'), null);
assert.equal(evaluate('combatants[0].equipment.weapons[1]'), 'silver-sword');
assert.equal(evaluate('combatants[0].equipment.activeWeaponSlot'), 1);
assert.equal(evaluate("inventory.some(item => item.id === 'steel-sword')"), true);

vm.runInContext(`
    combatants[0].equipment.weapons[0] = 'steel-sword';
    combatants[0].equipment.activeWeaponSlot = 0;
`, context);

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

assert.match(
    evaluate("window.renderEquipmentDetailsAction(inventory.find(item => item.id === 'temerian-shield'))"),
    /Reparar defesa \(1 → 3\)/
);

vm.runInContext("window.repairEquipmentItem('temerian-shield')", context);

assert.equal(evaluate("inventory.find(item => item.id === 'temerian-shield').equipmentDefense"), 3);
assert.equal(evaluate("window.getEffectiveArmorValue(combatants[0], 'torso')"), 7);
assert.doesNotMatch(
    evaluate("window.renderEquipmentDetailsAction(inventory.find(item => item.id === 'temerian-shield'))"),
    /Reparar defesa/
);

vm.runInContext("inventory.find(item => item.id === 'cuirass').equipmentDefense = 2", context);
assert.match(
    evaluate("window.renderEquipmentDetailsAction(inventory.find(item => item.id === 'cuirass'))"),
    /Reparar defesa \(2 → 5\)/
);
vm.runInContext("window.repairEquipmentItem('cuirass')", context);
assert.equal(evaluate("inventory.find(item => item.id === 'cuirass').equipmentDefense"), 5);

vm.runInContext(`
    combatants[0].equipment = {
        version: 3,
        weapons: [null, null, null],
        activeWeaponSlot: 0,
        ammunition: [null, null],
        activeAmmunitionSlot: 0,
        shield: null,
        armor: { head: null, torso: null, arm: null, leg: null }
    };
    selectedInventoryItemId = 'short-bow';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'iron-arrow';
    window.performSelectedEquipmentAction();
    selectedInventoryItemId = 'steel-arrow';
    window.performSelectedEquipmentAction();
`, context);

assert.equal(evaluate('combatants[0].equipment.weapons[0]'), 'short-bow');
assert.deepEqual(evaluate('combatants[0].equipment.ammunition'), ['iron-arrow', 'steel-arrow']);
assert.equal(evaluate("window.getInventoryEquipmentBadge('iron-arrow').label"), 'MUNIÇÃO ATIVA');
assert.equal(evaluate("window.getInventoryEquipmentBadge('steel-arrow').label"), 'MUNIÇÃO RESERVA');
assert.equal(evaluate("window.getRequiredAmmunitionType(inventory.find(item => item.id === 'short-bow'))"), 'arrow');
assert.equal(evaluate("window.getRequiredAmmunitionType(inventory.find(item => item.id === 'crossbow'))"), 'bolt');
assert.equal(evaluate("window.isAmmunitionCompatibleWithWeapon(inventory.find(item => item.id === 'iron-arrow'), inventory.find(item => item.id === 'short-bow'))"), true);
assert.equal(evaluate("window.isAmmunitionCompatibleWithWeapon(inventory.find(item => item.id === 'iron-arrow'), inventory.find(item => item.id === 'crossbow'))"), false);
assert.match(evaluate('window.renderCombatantEquipmentPanel(combatants[0])'), /Flecha de Ferro/);
assert.match(evaluate('window.renderCombatantEquipmentPanel(combatants[0])'), /Gastar uma munição/);
assert.match(evaluate('window.renderCombatantEquipmentPanel(combatants[0])'), /Trocar para a segunda munição/);
assert.equal(evaluate('window.getEquippedWeightBreakdown(combatants[0]).ammunition'), 7.5);

vm.runInContext('window.consumeActiveAmmunition(1)', context);
assert.equal(evaluate("inventory.find(item => item.id === 'iron-arrow').quantity"), 1);
vm.runInContext('window.cycleActiveAmmunition(1)', context);
assert.equal(evaluate('combatants[0].equipment.activeAmmunitionSlot'), 1);
vm.runInContext('window.cycleActiveAmmunition(1)', context);
assert.equal(evaluate('combatants[0].equipment.activeAmmunitionSlot'), 0);
vm.runInContext('window.consumeActiveAmmunition(1)', context);
assert.equal(evaluate("inventory.some(item => item.id === 'iron-arrow')"), false);
assert.equal(evaluate('combatants[0].equipment.ammunition[0]'), null);
assert.equal(evaluate('combatants[0].equipment.activeAmmunitionSlot'), 1);
assert.match(evaluate('messages.at(-1)'), /Flecha de Aço tornou-se ativa/);

vm.runInContext(`
    combatants[0].equipment.weapons = ['crossbow', null, null];
    combatants[0].equipment.activeWeaponSlot = 0;
    combatants[0].equipment.ammunition = ['steel-arrow', 'iron-bolt'];
    combatants[0].equipment.activeAmmunitionSlot = 0;
`, context);
assert.match(evaluate('window.renderCombatantEquipmentPanel(combatants[0])'), /Seta de Ferro/);
assert.equal(evaluate('combatants[0].equipment.activeAmmunitionSlot'), 1);
vm.runInContext('window.consumeActiveAmmunition(1)', context);
assert.equal(evaluate("inventory.find(item => item.id === 'iron-bolt').quantity"), 1);

vm.runInContext(`
    combatants[0].equipment.armor.arm = 'wolf-bracers';
    combatants[0].equipment.armor.leg = 'wolf-pants';
    window.getCriticalEquipmentSlotRestriction = (_owner, slot) =>
        ['arms', 'legs'].includes(slot) ? 'Membro amputado.' : '';
    window.enforceCriticalEquipmentRestrictions(combatants[0]);
`, context);
assert.equal(evaluate('combatants[0].equipment.armor.arm'), null);
assert.equal(evaluate('combatants[0].equipment.armor.leg'), null);
vm.runInContext(`
    selectedInventoryItemId = 'wolf-bracers';
    window.performSelectedEquipmentAction();
`, context);
assert.equal(evaluate('combatants[0].equipment.armor.arm'), null);
assert.match(evaluate('messages.at(-1)'), /Membro amputado/i);

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
    vm.runInContext('var window = globalThis; function renderList() {}', catalogContext);
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
        const equipment = predefinedItems.filter(item => item.category === 'equipment' && item.type !== 'mount-gear');
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
        const monsterAbilities = monsterDatabase.flatMap(monster => window.buildMonsterAbilities(monster.abilities));
        const monsterSkills = monsterDatabase.flatMap(monster => window.buildMonsterSkills(monster.skills));
        const ammunition = equipment.filter(item => window.getEquipmentItemKind(item) === 'ammunition');
        const rangedWeapons = equipment.filter(item => window.getRequiredAmmunitionType(item));
        return {
            equipmentCount: equipment.length,
            unclassified: unclassified.map(item => item.name),
            missingArmorSlots: armor.filter(item => !item.equipmentSlot).map(item => item.name),
            slotCounts,
            invalidWeaponDamage: invalidWeaponDamage.map(item => item.name),
            ammunitionCount: ammunition.length,
            arrowCount: ammunition.filter(item => window.getAmmunitionType(item) === 'arrow').length,
            boltCount: ammunition.filter(item => window.getAmmunitionType(item) === 'bolt').length,
            bowCount: rangedWeapons.filter(item => window.getRequiredAmmunitionType(item) === 'arrow').length,
            crossbowCount: rangedWeapons.filter(item => window.getRequiredAmmunitionType(item) === 'bolt').length,
            invalidWeights: equipment.filter(item => !Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0).map(item => item.name),
            officialWeightCount: equipment.filter(item => item.weightSource === 'rules-sheet').length,
            estimatedWeightCount: equipment.filter(item => item.weightSource === 'estimated').length,
            monsterActionCount: monsterActions.length,
            rollableMonsterActions: monsterActions.filter(action => action.damage).length,
            monsterAbilityCount: monsterAbilities.length,
            monsterSkillCount: monsterSkills.length,
            invalidAbilities: monsterAbilities.filter(ability => !ability.name).length,
            invalidSkills: monsterSkills.filter(skill => !skill.name).length
        };
    })())`, catalogContext));

    assert.equal(catalogAudit.equipmentCount, 150);
    assert.deepEqual(catalogAudit.unclassified, []);
    assert.deepEqual(catalogAudit.missingArmorSlots, []);
    assert.deepEqual(catalogAudit.slotCounts, { head: 15, body: 22, arms: 22, legs: 22, shield: 9 });
    assert.deepEqual(catalogAudit.invalidWeaponDamage, []);
    assert.equal(catalogAudit.ammunitionCount, 6);
    assert.equal(catalogAudit.arrowCount, 3);
    assert.equal(catalogAudit.boltCount, 3);
    assert.equal(catalogAudit.bowCount, 5);
    assert.equal(catalogAudit.crossbowCount, 5);
    assert.deepEqual(catalogAudit.invalidWeights, []);
    assert.equal(catalogAudit.officialWeightCount > 90, true);
    assert.equal(catalogAudit.estimatedWeightCount > 0, true);
    assert.equal(catalogAudit.monsterActionCount, 73);
    assert.equal(catalogAudit.rollableMonsterActions, 56);
    assert.equal(catalogAudit.monsterAbilityCount, 105);
    assert.equal(catalogAudit.monsterSkillCount, 212);
    assert.equal(catalogAudit.invalidAbilities, 0);
    assert.equal(catalogAudit.invalidSkills, 0);

    vm.runInContext(`
        var grifoCombatant = { id: 900, name: 'Grifo 1', type: 'monster', presetMonsterId: 'grifo' };
    `, catalogContext);

    const collapsedAbilities = vm.runInContext(
        'window.renderMonsterAbilitiesPanel(grifoCombatant)',
        catalogContext
    );
    const collapsedSkills = vm.runInContext(
        'window.renderMonsterSkillsPanel(grifoCombatant)',
        catalogContext
    );
    assert.match(collapsedAbilities, /aria-expanded="false"/);
    assert.doesNotMatch(collapsedAbilities, /Um grifo pode dar a sua vez/);
    assert.match(collapsedSkills, /aria-expanded="false"/);
    assert.doesNotMatch(collapsedSkills, /Curta Distância/);

    vm.runInContext(`
        window.toggleMonsterAbilitiesPanel(900);
        window.toggleMonsterSkillsPanel(900);
    `, catalogContext);

    const expandedAbilities = vm.runInContext(
        'window.renderMonsterAbilitiesPanel(grifoCombatant)',
        catalogContext
    );
    const expandedSkills = vm.runInContext(
        'window.renderMonsterSkillsPanel(grifoCombatant)',
        catalogContext
    );
    assert.match(expandedAbilities, /Grito Sônico/);
    assert.match(expandedAbilities, /Um grifo pode dar a sua vez/);
    assert.match(expandedSkills, /Curta Distância/);
    assert.match(expandedSkills, /\+10/);
}

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const mobileSource = fs.readFileSync(path.join(projectRoot, 'mobile.css'), 'utf8');

assert.match(
    indexSource,
    /class="inventory-toolbar"[\s\S]*id="inventoryActions"[\s\S]*id="inventoryList"/,
    'O cabeçalho e as ações devem compartilhar a barra flutuante antes da lista.'
);
assert.match(mobileSource, /\.inventory-toolbar\s*\{[\s\S]*position:\s*sticky;[\s\S]*top:\s*0;/);
assert.match(mobileSource, /\.inventory-toolbar \.inventory-transfer-action\s*\{[\s\S]*grid-column:\s*1 \/ -1;/);

console.log('✓ Equipamentos, ataques, habilidades e perícias dos monstros validados.');
