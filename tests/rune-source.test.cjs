const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const automationSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'rules-automation.js'),
    'utf8'
);
const sessionSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'session-features.js'),
    'utf8'
);
const context = vm.createContext({
    console,
    predefinedAbilities: [
        { id: 'quen', profession: 'Bruxo', category: 'Bruxo' },
        { id: 'cura', profession: 'Mago', category: 'Iniciante' },
        { id: 'cura_magica', name: 'Cura Mágica', cost: '15', profession: 'Mago', category: 'Iniciante' }
    ],
    combatants: [],
    monsterDatabase: [],
    localStorage: { getItem: () => null },
    savePlayersToStorage() {},
    renderList() {},
    showToast() {},
    window: {
        addEventListener() {},
        setTimeout() {},
        prompt() { return '4'; },
        trackCombatAction(_label, callback) { return callback(); },
        characterSpellCasting: {
            calculateSpellHealing() {
                return {
                    valid: true,
                    base: 3,
                    dice: '1d6',
                    roll: 4,
                    attributeLabel: 'Bônus de Inteligência',
                    attributeBonus: 3,
                    total: 10
                };
            }
        }
    }
});

vm.runInContext(automationSource, context, { filename: 'rules-automation.js' });

assert.equal(vm.runInContext("isAutomationWitcherSign('ability', 'quen')", context), true);
assert.equal(vm.runInContext("isAutomationWitcherSign('ability', 'cura')", context), false);
assert.equal(vm.runInContext("isAutomationWitcherSign('item', 'quen')", context), false);

const prioritized = JSON.parse(vm.runInContext(`
    (() => {
        const caster = { stCurrent: 5, runeSourceCurrent: 3 };
        const metadata = { staminaCost: 4, prioritizeRuneSource: true };
        const spent = spendAutomationEnergy(caster, metadata);
        return JSON.stringify({ spent, caster, metadata });
    })()
`, context));

assert.equal(prioritized.spent, true);
assert.equal(prioritized.caster.runeSourceCurrent, 0);
assert.equal(prioritized.caster.stCurrent, 4);
assert.equal(prioritized.metadata.runeSourceSpent, 3);
assert.equal(prioritized.metadata.staminaSpent, 1);

const regularSpell = JSON.parse(vm.runInContext(`
    (() => {
        const caster = { stCurrent: 5, runeSourceCurrent: 3 };
        const metadata = { staminaCost: 2, prioritizeRuneSource: false };
        const spent = spendAutomationEnergy(caster, metadata);
        return JSON.stringify({ spent, caster, metadata });
    })()
`, context));

assert.equal(regularSpell.spent, true);
assert.equal(regularSpell.caster.runeSourceCurrent, 3, 'Magias comuns não consomem Fonte Rúnica.');
assert.equal(regularSpell.caster.stCurrent, 3);
assert.equal(regularSpell.metadata.runeSourceSpent, undefined);

const insufficient = JSON.parse(vm.runInContext(`
    (() => {
        const caster = { stCurrent: 1, runeSourceCurrent: 1 };
        const metadata = { staminaCost: 3, prioritizeRuneSource: true };
        const spent = spendAutomationEnergy(caster, metadata);
        return JSON.stringify({ spent, caster });
    })()
`, context));

assert.equal(insufficient.spent, false);
assert.equal(insufficient.caster.runeSourceCurrent, 1);
assert.equal(insufficient.caster.stCurrent, 1);

const preparedQuen = JSON.parse(vm.runInContext(`
    (() => {
        const target = { id: 'target', name: 'Alvo', effects: [] };
        const caster = { id: 'caster', name: 'Bruxo', stCurrent: 10 };
        const prepared = prepareCharacterSpellEffect(target, caster, 'quen', {
            baseCost: 4,
            finalCost: 2
        });
        const consumed = consumeCharacterSpellEffect(target, 'quen');
        return JSON.stringify({ prepared, consumed });
    })()
`, context));

assert.equal(preparedQuen.prepared.managed, true);
assert.equal(preparedQuen.prepared.metadata.magicShieldHp, 20);
assert.equal(preparedQuen.prepared.metadata.staminaCost, 0, 'A conjuração pré-paga não pode descontar EST novamente.');
assert.equal(preparedQuen.consumed.metadata.spellCast.finalCost, 2);

const healingConfigs = JSON.parse(vm.runInContext(`JSON.stringify({
    blessing: getAutomationConfig('ability', 'bencao_de_cura'),
    ritual: getAutomationConfig('ability', 'ritual_de_vida')
})`, context));
assert.equal(healingConfigs.blessing.turnHealing, 3);
assert.equal(healingConfigs.blessing.perTurnSt, 3);
assert.equal(healingConfigs.blessing.staminaCost, 5);
assert.equal(healingConfigs.ritual.turnHealing, 3);
assert.equal(healingConfigs.ritual.duration, 10);

const recurringHealing = JSON.parse(vm.runInContext(`
    (() => {
        const caster = { id: 'druid', name: 'Druida', stCurrent: 9, effects: [] };
        const target = {
            id: 'ally',
            name: 'Aliado',
            hpCurrent: 10,
            hpMax: 30,
            stCurrent: 20,
            effects: [{
                id: 'bencao_de_cura',
                type: 'ability',
                name: 'Bênção de Cura',
                automation: {
                    turnHealing: 3,
                    perTurnSt: 3,
                    staminaPayerId: 'druid'
                }
            }]
        };
        combatants.push(caster, target);
        const changes = processAutomatedTurnEffects(target);
        return JSON.stringify({ caster, target, changes });
    })()
`, context));
assert.equal(recurringHealing.caster.stCurrent, 6, 'A manutenção deve consumir EST do conjurador.');
assert.equal(recurringHealing.target.stCurrent, 20, 'O alvo curado não deve pagar a manutenção.');
assert.equal(recurringHealing.target.hpCurrent, 13);
assert.match(recurringHealing.changes.join(' '), /\+3 HP/);

const instantHealing = JSON.parse(vm.runInContext(`
    (() => {
        const caster = { id: 'mage', name: 'Maga', stCurrent: 20 };
        const target = {
            id: 'wounded',
            name: 'Ferido',
            hpCurrent: 10,
            hpMax: 40,
            deathSaves: { success: 1, failures: 2 },
            stabilized: true,
            effects: []
        };
        const ability = predefinedAbilities.find(entry => entry.id === 'cura_magica');
        const result = applyInstantAbilityHealing(target, caster, ability);
        return JSON.stringify({ caster, target, result });
    })()
`, context));
assert.equal(instantHealing.result.healed, 10);
assert.equal(instantHealing.target.hpCurrent, 20);
assert.equal(instantHealing.caster.stCurrent, 5);
assert.deepEqual(instantHealing.target.deathSaves, { success: 0, failures: 0 });

assert.match(
    sessionSource,
    /target\.runeSourceCurrent\s*=\s*Math\.min\([\s\S]*runeSourceBefore \+ value/,
    'Regenerar ST também deve recuperar a Fonte Rúnica até o limite.'
);
assert.match(sessionSource, /Fonte Rúnica: \$\{runeSourceBefore\} → \$\{runeSourceAfter\}/);

console.log('✓ Prioridade e regeneração da Fonte Rúnica validadas.');
