const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'spell-damage-automation.js'), 'utf8');
const openedTargets = [];
const context = vm.createContext({
    console,
    combatants: [
        { id: 'caster', name: 'Yennefer' },
        { id: 'one', name: 'Alvo 1' },
        { id: 'two', name: 'Alvo 2' }
    ],
    selectedId: 'caster',
    currentInput: '',
    setTimeout(callback) { callback(); },
    openDamageBodyModal() { openedTargets.push(this.selectedId); },
    updateNumpad() {},
    setPendingAutomationDamageContext() {},
    showToast() {},
    renderList() {}
});
context.window = context;
vm.runInContext(source, context, { filename: 'spell-damage-automation.js' });

assert.equal(context.startSpellDamageSequence({
    casterId: 'caster',
    abilityId: 'igni',
    abilityName: 'Igni',
    damage: 12,
    damageType: 'fire',
    targetIds: ['one', 'two'],
    roll: { notation: '2d6', total: 12 }
}), true);
assert.deepEqual(openedTargets, ['one']);
assert.equal(context.currentInput, '12');
assert.equal(context.getPendingSpellDamageContext().damageType, 'fire');
assert.equal(context.getPendingSpellDamageContext().spellDamage.targetId, 'one');

context.completeSpellDamageStep();
assert.deepEqual(openedTargets, ['one', 'two']);
assert.equal(context.getPendingSpellDamageContext().spellDamage.targetId, 'two');

context.completeSpellDamageStep();
assert.equal(context.spellDamageAutomation.getActiveSequence(), null);
assert.equal(context.selectedId, 'caster');

assert.equal(context.startItemDamageSequence({
    sourceId: 'caster',
    sourceName: 'Yennefer',
    effectId: 'fogodazerikania',
    effectName: 'Fogo da Zerikânia',
    damage: 28,
    damageType: 'fire',
    targetIds: ['one'],
    roll: { formula: '8d6', total: 28 }
}), true);
const itemContext = context.getPendingSpellDamageContext();
assert.equal(itemContext.damageSource.kind, 'item');
assert.equal(itemContext.itemDamage.itemId, 'fogodazerikania');
assert.equal(itemContext.itemDamage.targetId, 'one');
assert.equal(itemContext.spellDamage, undefined);
context.completeSpellDamageStep();

const automationSource = fs.readFileSync(path.join(projectRoot, 'js', 'rules-automation.js'), 'utf8');
const damageSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'damage-modal.js'), 'utf8');
assert.match(automationSource, /prepareAutomatedLocalizedDamage/);
assert.match(automationSource, /adjustedDamage \+= 20/);
assert.match(automationSource, /adjustedDamage \*= 2/);
assert.match(damageSource, /localizedAutomation\.adjustedDamage/);

const rulesContext = vm.createContext({
    console,
    predefinedItems: [],
    predefinedAbilities: [],
    monsterDatabase: [],
    combatants: [],
    activeTurnId: null,
    selectedId: null,
    currentInput: '',
    localStorage: { getItem() { return '{}'; } },
    confirm() { return true; },
    prompt() { return '1'; },
    setTimeout() {},
    addEventListener() {},
    showToast() {},
    savePlayersToStorage() {},
    renderList() {},
    document: { getElementById() { return null; } }
});
rulesContext.window = rulesContext;
vm.runInContext(automationSource, rulesContext, { filename: 'rules-automation.js' });
['nevasca', 'gato', 'baleiaassassina', 'bosquedemaribor', 'trovoada'].forEach(itemId => {
    assert.equal(rulesContext.isAutomationManagedEffect('item', itemId), true, `${itemId} deve possuir automação gerenciada.`);
});
const mariborTarget = { effects: [{ id: 'bosquedemaribor', type: 'item', name: 'Bosque de Maribor', automation: {} }] };
assert.deepEqual(
    JSON.parse(JSON.stringify(rulesContext.getAutomationAdrenalineGain(mariborTarget, 1))),
    { base: 1, multiplier: 2, bonus: 1, total: 2, source: 'Bosque de Maribor' }
);
const aquaticTarget = { effects: [{ id: 'baleiaassassina', type: 'item', name: 'Baleia Assassina', automation: {} }] };
assert.deepEqual(
    JSON.parse(JSON.stringify(rulesContext.calculateAutomationBreathDuration(aquaticTarget, 10))),
    { base: 10, multiplier: 1.5, total: 15 }
);
const catTarget = { name: 'Geralt', effects: [{ id: 'gato', type: 'item', name: 'Gato', automation: {} }] };
assert.equal(rulesContext.getAutomationEnvironmentBenefits(catTarget).hypnosisImmune, true);
assert.equal(rulesContext.getAutomationEnvironmentBenefits(catTarget).illusionResistanceBonus, 5);
assert.equal(rulesContext.addAutomationCondition(catTarget, '😍'), null, 'Gato deve bloquear Enfeitiçado/Hipnose.');
const fireTarget = {
    id: 'fire-target',
    name: 'Alvo inflamável',
    type: 'monster',
    hpCurrent: 100,
    effects: [
        { id: 'bafodedragao', type: 'item' },
        { id: 'inflamador', type: 'item' },
        { id: 'fissstech', type: 'item' }
    ]
};
const preparedFire = rulesContext.prepareAutomatedLocalizedDamage(fireTarget, 10, { damageType: 'fire' });
assert.equal(preparedFire.adjustedDamage, 60, 'Bafo +20 deve ocorrer antes de Inflamador ×2.');
assert.equal(preparedFire.fireBonus, 20);
assert.equal(preparedFire.fireMultiplier, 2);
rulesContext.combatants.push(fireTarget);
rulesContext.setPendingAutomationDamageContext({
    damageType: 'fire',
    prelocalizedAutomation: preparedFire
});
const finalResolution = rulesContext.resolveAutomatedDamage(fireTarget, 180);
assert.equal(finalResolution.fissstechSuppressed, 90, 'Fisstech deve suprimir metade do dano já localizado.');
assert.equal(finalResolution.remainingDamage, 90);

console.log('✓ Sequência de alvos e preparação do dano mágico validadas.');
