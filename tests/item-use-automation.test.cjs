const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(projectRoot, file), 'utf8');
const source = read(path.join('js', 'item-use-automation.js'));
const conditionsSource = read(path.join('js', 'conditions.js'));
const indexSource = read('index.html');
const workerSource = read(path.join('js', 'service-worker.js'));

const context = vm.createContext({
    console,
    setTimeout(callback) { callback(); return 1; },
    clearTimeout,
    localStorage: { getItem() { return '{}'; } },
    document: {
        getElementById() { return null; },
        querySelectorAll() { return []; },
        querySelector() { return null; }
    },
    combatants: [],
    selectedId: null,
    processAutomatedTurnEffects() { return []; },
    applyInventoryItemEffectOnOwner() { return { applied: false }; },
    addEventListener() {},
    savePlayersToStorage() {},
    renderList() {},
    showToast() {}
});
context.window = context;
context.addAutomationCondition = (target, icon) => {
    const effect = {
        id: icon,
        type: 'condition',
        name: icon,
        remainingTurns: 0,
        initialTurns: 0,
        stacks: 1,
        maxStacks: 5,
        automation: {}
    };
    target.effects ||= [];
    target.effects.push(effect);
    return effect;
};
context.getCombatRollSkillGroup = skillId => ({
    fencing: 'meleeAttack',
    block: 'block',
    reflex_dodge: 'dodge'
})[skillId] || null;

vm.runInContext(source, context, { filename: 'item-use-automation.js' });

const ids = JSON.parse(JSON.stringify(context.itemUseAutomation.targetedItemIds));
[
    'adesivoalquimico', 'cloroformio', 'podecoagulacao', 'fissstech',
    'alucinogeno', 'ervasentorpecentes', 'elixirdepantagran', 'pocaodeperfume',
    'inflamador', 'fluidoesterilizante', 'soprodesucubo', 'lagrimasdetalgar',
    'podelua', 'podedimeritio', 'bafodedragao', 'samun',
    'solucaoacida', 'pobasico', 'venenonegro', 'furiadebredan',
    'saisaromaticos', 'lagrimasdeesposas', 'fogodazerikania',
    'bombadeestilhacos', 'tumbadeadda', 'tintainvisivel',
    'amigodoenvenenador'
].forEach(id => assert.ok(ids.includes(id), `${id} deve usar o fluxo contextual do inventário.`));

const instantIds = JSON.parse(JSON.stringify(context.itemUseAutomation.instantItemIds));
assert.ok(instantIds.includes('solucaoacida'));
assert.ok(instantIds.includes('bombadeestilhacos'));
assert.ok(JSON.parse(JSON.stringify(context.itemUseAutomation.narrativeItemIds)).includes('tintainvisivel'));

let preparedDamage = null;
context.startItemDamageSequence = options => { preparedDamage = options; return true; };
context.ensureEquipmentLoadout = target => target.equipment;
context.applyActiveWeaponDurabilityDamage = (target, amount) => {
    const weapon = target.inventory.find(item => item.id === target.equipment.weapons[target.equipment.activeWeaponSlot]);
    const before = weapon.durabilityDamage || 0;
    weapon.durabilityDamage = before + amount;
    return { name: weapon.name, before, after: weapon.durabilityDamage };
};

const itemOwner = { id: 'owner', name: 'Alquimista', effects: [] };
const acidTarget = {
    id: 'acid-target', name: 'Alvo Ácido', type: 'monster', hpCurrent: 40, hpMax: 40, effects: [],
    inventory: [
        { id: 'helmet', name: 'Elmo', defense: 5, equipmentDefense: 5 },
        { id: 'sword', name: 'Espada', durabilityDamage: 0 }
    ],
    equipment: {
        armor: { head: 'helmet', torso: null, arm: null, leg: null },
        shield: null,
        weapons: ['sword', null, null],
        activeWeaponSlot: 0
    }
};
context.combatants.push(acidTarget);
const acidResult = context.itemUseAutomation.executeInstantItemUse(itemOwner, 'solucaoacida', {
    targetIds: ['acid-target'],
    optionsByTarget: {
        'acid-target': { damageTotal: 14, damageDice: '4d6', damageType: 'acid', ablationTotal: 4 }
    }
});
assert.equal(acidResult.applied, true);
assert.equal(acidTarget.inventory[0].equipmentDefense, 1);
assert.equal(acidTarget.inventory[1].durabilityDamage, 4);
assert.ok(acidTarget.effects.some(effect => effect.id === 'solucaoacida'));
assert.equal(preparedDamage.damage, 14);
assert.equal(preparedDamage.damageType, 'acid');

const poisonTarget = { id: 'poison-target', name: 'Alvo Veneno', type: 'player', hpCurrent: 20, hpMax: 20, effects: [] };
context.combatants.push(poisonTarget);
const poisonResult = context.itemUseAutomation.executeInstantItemUse(itemOwner, 'venenonegro', {
    targetIds: ['poison-target'],
    optionsByTarget: {
        'poison-target': {
            toleranceTest: { naturalRoll: 7, skillTotal: 4, result: 11, difficulty: 18, passed: false }
        }
    }
});
assert.equal(poisonResult.applied, true);
assert.equal(poisonTarget.effects.find(effect => effect.id === '🐍').stacks, 1);

poisonTarget.effects.push({ id: '🍷', type: 'condition', name: 'Intoxicado' });
poisonTarget.effects.push({ id: 'pocaodeperfume', type: 'item', automation: { linkedConditions: ['🍷', '🐍'] } });
const sobrietyResult = context.itemUseAutomation.executeInstantItemUse(itemOwner, 'lagrimasdeesposas', {
    targetIds: ['poison-target'], optionsByTarget: { 'poison-target': {} }
});
assert.equal(sobrietyResult.applied, true);
assert.ok(!poisonTarget.effects.some(effect => effect.id === '🍷'));
assert.ok(!poisonTarget.effects.some(effect => effect.id === 'pocaodeperfume'));
assert.ok(poisonTarget.effects.some(effect => effect.id === '🐍'), 'Lágrimas de Esposas não devem curar venenos não ligados à intoxicação.');

const hallucinating = { effects: [{ id: '🌀', type: 'condition' }] };
const perception = context.getItemConditionSkillModifier(hallucinating, { id: 'perception', attributeId: 'wisdom' });
assert.equal(perception.total, -4);
assert.equal(perception.disadvantage, true);
const attack = context.getItemConditionSkillModifier(hallucinating, { id: 'fencing', attributeId: 'strength' });
assert.equal(attack.disadvantage, true);

const enhancedByPotions = {
    effects: [
        {
            id: 'nevasca', type: 'item',
            automation: { skillBonus: 4, skillIds: ['fencing', 'perception'] }
        },
        { id: 'trovoada', type: 'item', automation: {} }
    ]
};
const enhancedAttack = context.getItemConditionSkillModifier(
    enhancedByPotions,
    { id: 'fencing', attributeId: 'strength' }
);
assert.equal(enhancedAttack.total, 6, 'Nevasca +4 e Trovoada +2 devem acumular em ataques compatíveis.');
assert.match(enhancedAttack.details.join(' '), /Nevasca: \+4/);
assert.match(enhancedAttack.details.join(' '), /Trovoada: \+2/);
assert.equal(
    context.getItemConditionSkillModifier(enhancedByPotions, { id: 'perception', attributeId: 'wisdom' }).total,
    4,
    'Trovoada não deve alterar Percepção.'
);

context.getAutomationEnvironmentBenefits = () => ({
    ignoresDarknessVisionPenalty: true,
    hypnosisImmune: true,
    illusionResistanceBonus: 5,
    breathHoldMultiplier: 1.5,
    ignoresUnderwaterVisionPenalty: true
});
const illusionTest = context.getItemConditionSkillModifier(
    { effects: [] },
    { id: 'resist_magic', attributeId: 'wisdom' },
    { illusion: true }
);
assert.equal(illusionTest.total, 5);
assert.match(illusionTest.details.join(' '), /Gato contra ilusão/);
const environmentOptions = JSON.parse(JSON.stringify(
    context.getItemConditionTestOptions({ effects: [] }, { id: 'perception', attributeId: 'wisdom' })
));
assert.deepEqual(environmentOptions.map(option => option.id), ['illusion', 'darkness', 'underwater']);

const delighted = { effects: [{ id: '🤪', type: 'condition' }] };
assert.equal(context.getItemConditionSkillModifier(delighted, { id: 'seduction', attributeId: 'charisma' }).total, 2);
assert.equal(context.getItemConditionSkillModifier(delighted, { id: 'deduction', attributeId: 'wisdom' }).total, -2);
assert.equal(context.getItemConditionSkillModifier(delighted, { id: 'courage', attributeId: 'strength' }).advantage, true);

const withdrawal = { effects: [{ id: '🥶', type: 'condition', stacks: 3 }] };
const withdrawalTest = context.getItemConditionSkillModifier(withdrawal, { id: 'crafting', attributeId: 'wisdom' });
assert.equal(withdrawalTest.total, -2);
assert.equal(withdrawalTest.disadvantage, true);

const healingTarget = {
    effects: [
        { id: 'fluidoesterilizante', type: 'item' },
        { id: '🥶', type: 'condition', stacks: 4 }
    ]
};
assert.equal(context.getItemConditionHealingMultiplier(healingTarget), 1, 'Cura dobrada e abstinência pela metade devem se anular.');
assert.equal(context.getItemConditionStaminaRecoveryMultiplier(healingTarget), 0.5);

const adhesiveTarget = {
    id: 'target',
    name: 'Alvo',
    effects: [{
        id: 'adesivoalquimico',
        type: 'item',
        name: 'Adesivo Alquímico',
        automation: { adhesiveCountdown: 2 }
    }]
};
context.processAutomatedTurnEffects(adhesiveTarget);
assert.equal(adhesiveTarget.effects[0].automation.adhesiveCountdown, 1);
context.processAutomatedTurnEffects(adhesiveTarget);
assert.ok(adhesiveTarget.effects.some(effect => effect.id === '🕸️'));
assert.ok(!adhesiveTarget.effects.some(effect => effect.id === 'adesivoalquimico'));

const addicted = {
    id: 'addicted',
    name: 'Dependente',
    effects: [{ id: '💉', type: 'condition', stacks: 2 }],
    automation: { fissstechWithdrawalPending: true }
};
context.processAutomatedTurnEffects(addicted);
assert.equal(addicted.automation.fissstechWithdrawalDelay, 10);
for (let turn = 0; turn < 10; turn += 1) {
    context.processAutomatedTurnEffects(addicted);
}
assert.equal(addicted.effects.find(effect => effect.id === '🥶').stacks, 1);
assert.equal(addicted.automation.fissstechWithdrawalPending, false);

assert.match(conditionsSource, /title: 'Grudado'/);
assert.match(conditionsSource, /title: 'Vício em Fisstech'/);
assert.match(conditionsSource, /title: 'Alegria Delirante'/);
assert.match(conditionsSource, /title: 'Cura Potencializada'/);
assert.match(indexSource, /js\/item-use-automation\.js/);
assert.match(workerSource, /js\/item-use-automation\.js/);

console.log('item-use-automation.test.cjs: ok');
