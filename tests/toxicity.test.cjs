const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(projectRoot, file), 'utf8');
const context = vm.createContext({
    console,
    conditionDescriptions: {
        '💫': { title: 'Atordoado', active: 0, stack: 1, augment: 'debuff' },
        '🚫': { title: 'Incapacitado', active: 0, stack: 1, augment: 'debuff' }
    },
    renderList() {}
});

context.window = context;
context.characterSheetModel = {
    getCharacterSkillTotal(skillId, skills) {
        return skillId === 'tolerance' ? Number(skills?.tolerance?.total || 0) : 0;
    }
};

vm.runInContext(read(path.join('js', 'items.js')), context, { filename: 'items.js' });
vm.runInContext(read(path.join('js', 'toxicity.js')), context, { filename: 'toxicity.js' });

const system = context.toxicitySystem;
assert.ok(system, 'O sistema de toxicidade deve expor sua API de domínio.');

const expectedPotionToxicity = {
    sanguepreto: 25,
    gato: 25,
    baleiaassassina: 25,
    papafigo: 50,
    bosquedemaribor: 50,
    andorinha: 50,
    corujadomato: 50,
    nevasca: 75,
    luacheia: 75,
    filtrodepetri: 75,
    trovoada: 75,
    melbranco: 0
};

Object.entries(expectedPotionToxicity).forEach(([id, toxicity]) => {
    context.__itemId = id;
    const item = vm.runInContext('predefinedItems.find(item => item.id === __itemId)', context);
    assert.ok(item?.potion, `${id} deve estar classificada como poção.`);
    assert.equal(item.toxicity, toxicity, `${id} deve ter a toxicidade correta.`);
});

const consumer = {
    id: 'geralt',
    name: 'Geralt',
    toxicityCurrent: 80,
    effects: [
        { id: 'andorinha', type: 'item', name: 'Andorinha' },
        { id: 'quen', type: 'ability', name: 'Quen' }
    ]
};

context.__consumer = consumer;
context.__potion = vm.runInContext("predefinedItems.find(item => item.id === 'gato')", context);
context.__whiteHoney = vm.runInContext("predefinedItems.find(item => item.id === 'melbranco')", context);

const consumed = system.applyConsumedItemToxicity(consumer, context.__potion);
assert.equal(consumed.added, 25);
assert.equal(consumer.toxicityCurrent, 105);
context.appendToxicityItemUseDetail('Efeito Gato aplicado em Geralt por 20 rodadas');
const consumedDetail = context.consumeToxicityItemUseDetail();
assert.match(consumedDetail, /80% → 105%/);
assert.match(consumedDetail, /Efeito Gato aplicado em Geralt por 20 rodadas/);

const cleansed = system.applyConsumedItemToxicity(consumer, context.__whiteHoney);
assert.equal(cleansed.kind, 'cleanse');
assert.equal(consumer.toxicityCurrent, 0);
assert.deepEqual(JSON.parse(JSON.stringify(consumer.effects.map(effect => effect.id))), ['quen']);
assert.match(context.consumeToxicityItemUseDetail(), /Andorinha/);

const controlled = {
    identity: { level: 4 },
    professionalSkills: {
        manticore_school_toxicidade_controlada: { invested: 2 }
    }
};
assert.deepEqual(
    JSON.parse(JSON.stringify(system.getAdjustedToxicityThresholds(controlled))),
    {
        controlledLevel: 2,
        shift: 50,
        warning: 150,
        impaired: 175,
        severe: 200,
        unconscious: 225,
        overdose: 250
    }
);

const severe = {
    id: 'severe',
    name: 'Lambert',
    identity: { level: 2 },
    hpCurrent: 40,
    hpMax: 40,
    toxicityCurrent: 150,
    skills: { tolerance: { total: 4 } },
    effects: []
};
const severeRolls = [];
const severeResult = system.processCombatantToxicityTurn(severe, {
    rollDice(notation) {
        severeRolls.push(notation);
        return notation === '1d6' ? 5 : 10;
    }
});

assert.deepEqual(severeRolls, ['1d6', '1d20'], '150% deve rolar somente 1d6 de dano e o teste de atordoamento.');
assert.equal(severe.hpCurrent, 35);
assert.equal(severe.toxicityCurrent, 144, 'Deve reduzir Tolerância total + nível ao final do processamento.');
assert.ok(severe.effects.some(effect => effect.id === '💫'));
assert.equal(severeResult[0].damage.damage, 5);
assert.match(severeResult[0].history.detail, /Dano: 1d6 = 5/);

const overdose = {
    id: 'overdose',
    name: 'Eskel',
    identity: { level: 1 },
    hpCurrent: 30,
    hpMax: 30,
    toxicityCurrent: 200,
    skills: { tolerance: { total: 0 } },
    effects: []
};
const overdoseRolls = [];
system.processCombatantToxicityTurn(overdose, {
    rollDice(notation) {
        overdoseRolls.push(notation);
        return notation === '1d6' ? 4 : 1;
    }
});

assert.deepEqual(overdoseRolls, ['1d6', '1d20', '1d20', '1d20']);
assert.equal(overdose.hpCurrent, 0);
assert.deepEqual(JSON.parse(JSON.stringify(overdose.deathSaves)), { success: 0, failures: 0 });
assert.ok(overdose.effects.some(effect => effect.id === '💫'));
assert.ok(overdose.effects.some(effect => effect.id === '🚫'));
assert.equal(overdose.toxicityCurrent, 199);

const belowControlledThreshold = {
    identity: { level: 1 },
    hpCurrent: 20,
    toxicityCurrent: 149,
    skills: { tolerance: { total: 0 } },
    professionalSkills: {
        manticore_school_toxicidade_controlada: { invested: 2 }
    },
    effects: []
};
let controlledRollCount = 0;
system.processCombatantToxicityTurn(belowControlledThreshold, {
    rollDice() {
        controlledRollCount++;
        return 1;
    }
});
assert.equal(controlledRollCount, 0, 'A habilidade deve deslocar todos os limiares antes de processar efeitos.');
assert.equal(belowControlledThreshold.toxicityCurrent, 148);

const impaired = { toxicityCurrent: 125 };
assert.equal(system.getToxicitySkillModifier(impaired, { attributeId: 'strength' }).total, -2);
assert.equal(system.getToxicitySkillModifier(impaired, { attributeId: 'intelligence' }).total, 0);

const indexSource = read('index.html');
const workerSource = read(path.join('js', 'service-worker.js'));
const sessionSource = read(path.join('js', 'session-features.js'));
const enhancementsSource = read(path.join('js', 'enhancements.js'));
const inventorySource = read(path.join('js', 'inventory.js'));
const interactionsSource = read(path.join('js', 'interactions.js'));
const automationSource = read(path.join('js', 'rules-automation.js'));
assert.match(indexSource, /toxicity\.css/);
assert.match(indexSource, /js\/toxicity\.js/);
assert.match(workerSource, /witcher-combat-tracker-v85/);
assert.match(workerSource, /toxicity\.css/);
assert.match(workerSource, /js\/toxicity\.js/);
assert.match(sessionSource, /processCombatantToxicityTurn/);
assert.match(sessionSource, /consumeToxicityItemUseDetail/);
assert.match(enhancementsSource, /toxicityCurrent/);
assert.match(inventorySource, /applyInventoryItemEffectOnOwner/);
assert.match(inventorySource, /catalogItem\.potion \|\| catalogItem\.oil/);
assert.match(inventorySource, /appendToxicityItemUseDetail/);
assert.match(interactionsSource, /result\?\.used === false/);
assert.match(automationSource, /function applyInventoryItemEffectOnOwner/);
assert.match(automationSource, /item\?\.oil/);
assert.match(automationSource, /effectKind: isActiveOil \? 'oil' : \(isActivePotion \? 'potion' : 'item'\)/);
assert.match(automationSource, /refreshed: Boolean\(previousEffect\)/);
assert.match(sessionSource, /itemDefinition\.potion \|\| itemDefinition\.oil/);

context.__inventoryEvents = [];
context.__inventoryOwner = { id: 'geralt', name: 'Geralt' };
context.addEventListener = () => {};
context.getCharacterCollectionOwner = () => context.__inventoryOwner;
context.isEquipmentItem = () => false;
context.persistCharacterCollections = () => context.__inventoryEvents.push('persist');
context.showToast = () => {};
context.applyInventoryItemEffectOnOwner = () => {
    context.__inventoryEvents.push('effect');
    return {
        applied: true,
        refreshed: false,
        effect: { remainingTurns: 20 }
    };
};
context.applyConsumedItemToxicity = () => {
    context.__inventoryEvents.push('toxicity');
    return { kind: 'increase', added: 25 };
};
context.appendToxicityItemUseDetail = () => context.__inventoryEvents.push('detail');

vm.runInContext(inventorySource, context, { filename: 'inventory.js' });
vm.runInContext(`renderInventory = () => __inventoryEvents.push('render')`, context);
vm.runInContext(`inventory = [{ id: 'gato', name: 'Gato', quantity: 1 }]`, context);

const inventoryUseResult = vm.runInContext(`useItem('gato')`, context);
assert.equal(inventoryUseResult.used, true);
assert.equal(inventoryUseResult.effect.applied, true);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.__inventoryEvents)),
    ['effect', 'toxicity', 'detail', 'persist', 'render'],
    'O efeito deve ser confirmado antes de consumir a poção e registrar sua toxicidade.'
);
assert.equal(vm.runInContext('inventory.length', context), 0);

context.__inventoryEvents.length = 0;
context.applyInventoryItemEffectOnOwner = () => ({
    applied: false,
    blocked: true,
    reason: 'papafigo'
});
vm.runInContext(`inventory = [{ id: 'gato', name: 'Gato', quantity: 1 }]`, context);
const blockedInventoryUse = vm.runInContext(`useItem('gato')`, context);
assert.equal(blockedInventoryUse.used, false);
assert.equal(vm.runInContext('inventory[0].quantity', context), 1);
assert.deepEqual(JSON.parse(JSON.stringify(context.__inventoryEvents)), []);

const expectedActiveOils = [
    'oleodefera',
    'oleodeamaldicoado',
    'oleodedraconideo',
    'oleodeelemental',
    'venenodoenforcado',
    'oleodehibrido',
    'oleodeinsetoide',
    'oleodenecrofago',
    'oleodeogroide',
    'oleoderelicto',
    'oleodeespectro',
    'oleodevampiro'
];

expectedActiveOils.forEach(id => {
    context.__itemId = id;
    const item = vm.runInContext('predefinedItems.find(entry => entry.id === __itemId)', context);
    assert.equal(item?.oil, true, `${id} deve estar classificado como óleo ativo.`);
    assert.equal(item?.active, 20, `${id} deve permanecer ativo por 20 rodadas.`);
});

context.__inventoryEvents.length = 0;
context.applyInventoryItemEffectOnOwner = (_owner, id) => {
    context.__inventoryEvents.push(`effect:${id}`);
    return {
        applied: true,
        refreshed: false,
        effectKind: 'oil',
        effect: { remainingTurns: 20 }
    };
};
context.applyConsumedItemToxicity = () => {
    context.__inventoryEvents.push('toxicity-check');
    return null;
};
context.appendToxicityItemUseDetail = () => context.__inventoryEvents.push('detail');
vm.runInContext(`inventory = [{ id: 'oleodenecrofago', name: 'Óleo de necrófago', quantity: 1 }]`, context);

const oilInventoryUse = vm.runInContext(`useItem('oleodenecrofago')`, context);
assert.equal(oilInventoryUse.used, true);
assert.equal(oilInventoryUse.effect.effectKind, 'oil');
assert.equal(vm.runInContext('inventory.length', context), 0);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.__inventoryEvents)),
    ['effect:oleodenecrofago', 'toxicity-check', 'detail', 'persist', 'render'],
    'Usar um óleo pelo inventário deve aplicar o efeito antes de consumir a unidade.'
);

console.log('toxicity tests: ok');
