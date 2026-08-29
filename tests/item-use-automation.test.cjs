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
    setTimeout,
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
    'podelua', 'podedimeritio', 'bafodedragao', 'samun'
].forEach(id => assert.ok(ids.includes(id), `${id} deve usar o fluxo contextual do inventário.`));

const hallucinating = { effects: [{ id: '🌀', type: 'condition' }] };
const perception = context.getItemConditionSkillModifier(hallucinating, { id: 'perception', attributeId: 'wisdom' });
assert.equal(perception.total, -4);
assert.equal(perception.disadvantage, true);
const attack = context.getItemConditionSkillModifier(hallucinating, { id: 'fencing', attributeId: 'strength' });
assert.equal(attack.disadvantage, true);

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
assert.equal(addicted.effects.find(effect => effect.id === '🥶').stacks, 1);
assert.equal(addicted.automation.fissstechWithdrawalPending, false);

assert.match(conditionsSource, /title: 'Grudado'/);
assert.match(conditionsSource, /title: 'Vício em Fisstech'/);
assert.match(conditionsSource, /title: 'Alegria Delirante'/);
assert.match(conditionsSource, /title: 'Cura Potencializada'/);
assert.match(indexSource, /js\/item-use-automation\.js/);
assert.match(workerSource, /js\/item-use-automation\.js/);

console.log('item-use-automation.test.cjs: ok');
