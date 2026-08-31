const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'care-services.js'), 'utf8');
const itemAutomationSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'item-use-automation.js'), 'utf8');
const spellSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'character-spells.js'), 'utf8');
const rulesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'rules-automation.js'), 'utf8');
const enhancementsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'enhancements.js'), 'utf8');
const inventorySource = fs.readFileSync(path.join(__dirname, '..', 'js', 'inventory.js'), 'utf8');
const equipmentSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'equipment.js'), 'utf8');
const interactionsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'interactions.js'), 'utf8');
const sessionFeaturesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'session-features.js'), 'utf8');
const professionalSkillsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'professional-skills-data.js'), 'utf8');

function createContext(overrides = {}) {
    const context = {
        console,
        Date,
        JSON,
        Math,
        Number,
        Object,
        String,
        Array,
        Set,
        Map,
        globalThis: null,
        ...overrides
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

const context = createContext();
const care = context.careServices;

assert.equal(care.CARE_CATALOG.food.options.find(option => option.id === 'simple_meal').recovery.hp, 10);
assert.equal(care.CARE_CATALOG.food.options.find(option => option.id === 'sophisticated_meal').recovery.st, 20);
assert.equal(care.CARE_CATALOG.hygiene.options.find(option => option.id === 'sophisticated_bath').directSkillBonuses.seduction, 3);
assert.equal(care.CARE_CATALOG.lodging.options.find(option => option.id === 'luxury_inn').resources.adrenaline, 2);
assert.equal(care.CARE_CATALOG.lodging.options.find(option => option.id === 'quality_inn').recovery.hp, 40);

assert.deepEqual(
    JSON.parse(JSON.stringify(care.divideCareCost(10, ['1', '2', '3']))),
    [
        { payerId: '1', amount: 4 },
        { payerId: '2', amount: 3 },
        { payerId: '3', amount: 3 }
    ]
);
assert.deepEqual(JSON.parse(JSON.stringify(care.divideCareCost(20, []))), []);
assert.equal(care.normalizeCareAmount(-5), 0);
assert.equal(care.normalizeCareAmount('15'), 15);

const automated = {
    id: 10,
    name: 'Geralt',
    hpCurrent: 20,
    hpMax: 80,
    stCurrent: 10,
    stMax: 50,
    effects: [],
    progression: { adrenaline: 0, luckDice: 0 }
};
const selection = (categoryId, optionId) => ({
    category: care.CARE_CATALOG[categoryId],
    option: care.CARE_CATALOG[categoryId].options.find(option => option.id === optionId),
    totalCost: 0
});

care.applyCareSelectionToCombatant(automated, selection('food', 'no_food'));
care.applyCareSelectionToCombatant(automated, selection('food', 'no_food'));
assert.equal(care.getCareEffect(automated, 'hungry').stacks, 2);
assert.equal(care.getCareSkillModifier(automated, { id: 'athletics' }).total, -2);
assert.equal(care.getCareSkillModifier(automated, { id: 'perception' }).total, 0);

care.applyCareSelectionToCombatant(automated, selection('food', 'good_meal'));
assert.equal(care.getCareEffect(automated, 'hungry'), null);
assert.equal(care.getCareEffect(automated, 'well_fed').stacks, 1);
assert.equal(automated.hpCurrent, 40);
assert.equal(automated.stCurrent, 20);
assert.equal(automated.progression.adrenaline, 1);
assert.equal(care.getCareTemporarySt(automated), 5);
assert.deepEqual(
    JSON.parse(JSON.stringify(care.spendCareTemporarySt(automated, 3))),
    { requested: 3, spent: 3, remaining: 0, availableBefore: 5, availableAfter: 2 }
);

care.applyCareSelectionToCombatant(automated, selection('hygiene', 'sophisticated_bath'));
assert.equal(automated.progression.luckDice, 1);
assert.equal(care.getCareSkillModifier(automated, { id: 'seduction' }).total, 5);

care.applyCareSelectionToCombatant(automated, selection('lodging', 'cheap_inn'), [
    { skillId: 'physique', success: false }
]);
assert.equal(care.getCareSkillModifier(automated, { id: 'physique' }).disadvantage, true);

const requests = care.collectCareAssistedTestRequests(
    [{ id: 1, name: 'Geralt', effects: [], skills: {}, attributes: {} }],
    [selection('lodging', 'strange_inn')]
);
assert.equal(requests.length, 2);
assert.equal(requests[0].skillId, 'physique');
assert.equal(requests[1].skillId, 'intimidation');

const professionalProvider = {
    id: 40,
    name: 'Nenneke',
    hpCurrent: 30,
    hpMax: 50,
    stCurrent: 20,
    stMax: 40,
    effects: [],
    progression: {},
    professionalSkills: {
        melitele_iniciado_dos_deuses: { invested: 2 },
        melitele_cuidado_prolongado: { invested: 2 },
        grey_roads_minstrel_cantar_por_moedas: { invested: 1 },
        grey_roads_minstrel_dormir_leve: { invested: 1 },
        grey_roads_minstrel_balada_do_sobrevivente: { invested: 2 },
        freya_ciclo_de_abundancia: { invested: 2 },
        freya_frutos_de_freya: { invested: 2 }
    }
};
const careAlly = {
    id: 41,
    name: 'Ciri',
    hpCurrent: 20,
    hpMax: 50,
    stCurrent: 20,
    stMax: 40,
    effects: [],
    progression: {}
};
assert.equal(care.getCareProfessionalFeatures(professionalProvider).prolongedCare, 2);
const professionalRequests = care.collectCareAssistedTestRequests(
    [professionalProvider],
    [selection('food', 'good_meal')],
    {
        provider: professionalProvider,
        professional: {
            useDivineInitiate: true,
            divineDifficulty: 15,
            useSingForCoin: true,
            performanceDifficulty: 13
        }
    }
);
assert.equal(professionalRequests.length, 2);
assert.equal(professionalRequests[0].ruleId, 'divine-initiate');
assert.equal(professionalRequests[0].skillTotal, 2);
assert.equal(professionalRequests[1].ruleId, 'sing-for-coin');

const divineCost = care.resolveCareProfessionalCosts(
    [
        { ...selection('food', 'good_meal'), totalCost: 20 },
        { ...selection('hygiene', 'hot_bath'), totalCost: 15 }
    ],
    [{ ruleId: 'divine-initiate', success: true }],
    professionalProvider,
    { useDivineInitiate: true }
);
assert.equal(divineCost.baseTotal, 35);
assert.equal(divineCost.totalCost, 0);

const singingCost = care.resolveCareProfessionalCosts(
    [
        { ...selection('food', 'good_meal'), totalCost: 20 },
        { ...selection('hygiene', 'hot_bath'), totalCost: 15 },
        { ...selection('lodging', 'normal_inn'), totalCost: 10 }
    ],
    [{ ruleId: 'sing-for-coin', success: true }],
    professionalProvider,
    { useSingForCoin: true }
);
assert.equal(singingCost.totalCost, 25);
assert.equal(singingCost.selections.find(entry => entry.category.id === 'food').totalCost, 0);
assert.equal(singingCost.selections.find(entry => entry.category.id === 'hygiene').totalCost, 15);
assert.equal(singingCost.selections.find(entry => entry.category.id === 'lodging').totalCost, 10);

const allyCycle = care.beginCareCycle(careAlly, '2026-09-02T10:00:00.000Z');
const allyProfessionalDetails = care.applyCareProfessionalBenefits(
    professionalProvider,
    careAlly,
    [selection('food', 'good_meal'), selection('lodging', 'cheap_inn')],
    { useFreyaFruits: true },
    allyCycle
);
assert.equal(careAlly.hpCurrent, 25);
assert.match(allyProfessionalDetails.join(' '), /Cuidado Prolongado/);
assert.equal(care.getCareEffect(careAlly, 'survivor_ballad').stacks, 2);
assert.equal(care.getCareEffect(careAlly, 'freya_fruits').stacks, 2);
assert.equal(care.getCareSkillModifier(careAlly, { id: 'athletics' }).total, 2);

const providerCycle = care.beginCareCycle(professionalProvider, '2026-09-02T10:00:00.000Z');
care.setCareStatus(professionalProvider, 'uncomfortable', 1, {}, false);
care.applyCareProfessionalBenefits(
    professionalProvider,
    professionalProvider,
    [selection('food', 'good_meal'), selection('lodging', 'cheap_inn')],
    { useFreyaFruits: false },
    providerCycle
);
assert.equal(care.getCareEffect(professionalProvider, 'uncomfortable'), null);
assert.equal(care.getCareEffect(professionalProvider, 'freya_abundance').stacks, 2);
assert.equal(care.getCareSkillModifier(professionalProvider, { id: 'tolerance' }).total, 2);

const persistent = {
    id: 20,
    name: 'Yennefer',
    hpCurrent: 10,
    hpMax: 60,
    stCurrent: 10,
    stMax: 70,
    effects: [],
    progression: {}
};
const cycleOne = care.beginCareCycle(persistent, '2026-08-30T12:00:00.000Z');
care.applyCareSelectionToCombatant(persistent, selection('food', 'good_meal'));
care.updateCarePersistence(persistent, selection('food', 'good_meal'), cycleOne, '2026-08-30T12:00:00.000Z');
assert.equal(persistent.careState.cycle, 1);
assert.equal(persistent.careState.needs.food.daysWithout, 0);
assert.equal(persistent.careState.benefits.well_fed.expiresAtCycle, 2);
assert.equal(care.getCareEffect(persistent, 'well_fed').automation.careDurationCycles, 1);

const savedCareState = JSON.parse(JSON.stringify(persistent.careState));
const restoredBenefit = { ...persistent, effects: [], careState: savedCareState };
assert.equal(care.restoreCareStateEffects(restoredBenefit), true);
assert.equal(care.getCareEffect(restoredBenefit, 'well_fed').stacks, 1);

care.getCareEffect(persistent, 'well_fed').automation.temporarySt = 2;
const serializedCareState = care.serializeCareState(persistent);
const restoredRemainingResources = { ...persistent, effects: [], careState: serializedCareState };
care.restoreCareStateEffects(restoredRemainingResources);
assert.equal(care.getCareEffect(restoredRemainingResources, 'well_fed').automation.temporarySt, 2);

const cycleTwo = care.beginCareCycle(persistent, '2026-08-31T12:00:00.000Z');
assert.equal(care.getCareEffect(persistent, 'well_fed'), null);
assert.match(cycleTwo.expiredBenefits[0], /Bem Alimentado expirou/);
care.applyCareSelectionToCombatant(persistent, selection('food', 'no_food'));
care.updateCarePersistence(persistent, selection('food', 'no_food'), cycleTwo, '2026-08-31T12:00:00.000Z');
assert.equal(persistent.careState.needs.food.daysWithout, 1);

const restoredHunger = { ...persistent, effects: [], careState: JSON.parse(JSON.stringify(persistent.careState)) };
care.restoreCareStateEffects(restoredHunger);
assert.equal(care.getCareEffect(restoredHunger, 'hungry').stacks, 1);

const consumptionHistory = [];
const consumptionContext = createContext({
    addCombatHistoryEntry: (label, detail, metadata) => consumptionHistory.push({ label, detail, metadata }),
    showToast() {},
    renderList() {},
    renderAutomationCardSummaries() {}
});
const mealOwner = {
    id: 30,
    name: 'Ciri',
    hpCurrent: 10,
    hpMax: 50,
    stCurrent: 5,
    stMax: 40,
    effects: [],
    progression: {}
};
consumptionContext.careServices.applyCareSelectionToCombatant(
    mealOwner,
    {
        category: consumptionContext.careServices.CARE_CATALOG.food,
        option: consumptionContext.careServices.CARE_CATALOG.food.options[0],
        totalCost: 0
    }
);
const consumedMeal = consumptionContext.careServices.consumeCareInventoryItem(mealOwner, {
    id: 'ensopadodeestalagem',
    name: 'Ensopado de Estalagem',
    careConsumable: {
        kind: 'food',
        quality: 'good',
        portionsPerUnit: 1,
        durationCycles: 1,
        categoryId: 'food',
        optionId: 'good_meal'
    }
}, '2026-09-01T12:00:00.000Z');
assert.equal(consumedMeal.applied, true);
assert.equal(mealOwner.hpCurrent, 30);
assert.equal(mealOwner.stCurrent, 15);
assert.equal(consumptionContext.careServices.getCareEffect(mealOwner, 'hungry'), null);
assert.equal(consumptionContext.careServices.getCareEffect(mealOwner, 'well_fed').stacks, 1);
assert.equal(mealOwner.careState.needs.food.lastOption.id, 'good_meal');
assert.equal(mealOwner.careState.lastConsumption.itemId, 'ensopadodeestalagem');
assert.equal(consumptionHistory[0].metadata.effect.type, 'care-consumable');

const drinkOwner = {
    id: 31,
    name: 'Zoltan',
    hpCurrent: 10,
    hpMax: 50,
    stCurrent: 5,
    stMax: 40,
    effects: [],
    progression: {}
};
consumptionContext.careServices.applyCareSelectionToCombatant(
    drinkOwner,
    {
        category: consumptionContext.careServices.CARE_CATALOG.food,
        option: consumptionContext.careServices.CARE_CATALOG.food.options[0],
        totalCost: 0
    }
);
const consumedDrink = consumptionContext.careServices.consumeCareInventoryItem(drinkOwner, {
    id: 'cervejademahakam',
    name: 'Cerveja de Mahakam',
    careConsumable: {
        kind: 'drink',
        quality: 'good',
        alcoholic: true,
        portionsPerUnit: 1,
        effect: 'Consumo alcoólico registrado.'
    }
}, '2026-09-01T13:00:00.000Z');
assert.equal(consumedDrink.applied, true);
assert.equal(drinkOwner.hpCurrent, 10);
assert.equal(drinkOwner.stCurrent, 5);
assert.equal(consumptionContext.careServices.getCareEffect(drinkOwner, 'hungry').stacks, 1);
assert.equal(drinkOwner.careState.lastConsumption.kind, 'drink');

const inventoryMeal = {
    id: 'racaodeviagem',
    name: 'Ração de Viagem',
    category: 'usable',
    quantity: 2,
    careConsumable: {
        kind: 'food',
        quality: 'simple',
        portionsPerUnit: 1,
        durationCycles: 0,
        categoryId: 'food',
        optionId: 'simple_meal'
    }
};
const inventoryOwner = {
    id: 32,
    name: 'Lambert',
    hpCurrent: 10,
    hpMax: 50,
    stCurrent: 5,
    stMax: 40,
    effects: [],
    progression: {}
};
consumptionContext.predefinedItems = [inventoryMeal];
consumptionContext.getCharacterCollectionOwner = () => inventoryOwner;
consumptionContext.isEquipmentItem = () => false;
consumptionContext.persistCharacterCollections = () => {};
consumptionContext.applyConsumedItemToxicity = () => null;
consumptionContext.addEventListener = () => {};
vm.runInContext(inventorySource, consumptionContext, { filename: 'inventory.js' });
vm.runInContext('renderInventory = () => {}', consumptionContext);
vm.runInContext(`inventory = [${JSON.stringify(inventoryMeal)}]`, consumptionContext);
const inventoryConsumption = vm.runInContext(`useItem('racaodeviagem')`, consumptionContext);
assert.equal(inventoryConsumption.used, true);
assert.equal(inventoryConsumption.care.applied, true);
assert.equal(vm.runInContext(`inventory[0].quantity`, consumptionContext), 1);
assert.equal(inventoryOwner.hpCurrent, 20);
assert.equal(inventoryOwner.stCurrent, 10);

let healingCalls = 0;
let modalCalls = 0;
const heartContext = createContext({
    currentInput: '0',
    selectedId: 1,
    combatants: [{ id: 1, type: 'player', hpCurrent: 10 }],
    applyHP: () => { healingCalls += 1; },
    document: {
        getElementById: () => null,
        createElement: () => {
            modalCalls += 1;
            return {
                addEventListener() {},
                setAttribute() {},
                append() {},
                remove() {},
                style: {},
                innerHTML: ''
            };
        },
        body: { append() {} },
        querySelectorAll: () => []
    }
});

assert.equal(heartContext.handleHeartAction(), 'care');
assert.equal(modalCalls, 2);
assert.equal(healingCalls, 0);

heartContext.currentInput = '8';
assert.equal(heartContext.handleHeartAction(), 'healing');
assert.equal(healingCalls, 1);

heartContext.currentInput = '0';
heartContext.combatants[0].hpCurrent = 0;
assert.equal(heartContext.handleHeartAction(), 'healing');
assert.equal(healingCalls, 2);

assert.match(source, /Cada confirmação inicia um novo ciclo diário/);
assert.match(source, /Roubo assistido pelo mestre/);
assert.match(itemAutomationSource, /getCareSkillModifier/);
assert.match(spellSource, /temporaryStSpent/);
assert.match(rulesSource, /getCareTemporarySt/);
assert.match(enhancementsSource, /serializeCareState/);
assert.match(enhancementsSource, /restoreCareStateEffects/);
assert.match(inventorySource, /consumeCareInventoryItem/);
assert.match(inventorySource, /careResult/);
assert.match(equipmentSource, /item\?\.careConsumable \? 'Consumir' : 'Usar'/);
assert.match(interactionsSource, /!result\?\.care\?\.applied/);
assert.match(sessionFeaturesSource, /isCareConsumable \? 'Consumir item\?' : 'Usar item\?'/);
assert.match(sessionFeaturesSource, /type: 'care-consumable'/);
assert.match(source, /INTEGRAÇÕES PROFISSIONAIS/);
assert.match(professionalSkillsSource, /melitele_cuidado_prolongado/);
assert.match(professionalSkillsSource, /grey_roads_minstrel_cantar_por_moedas/);

console.log('care-services tests passed');
