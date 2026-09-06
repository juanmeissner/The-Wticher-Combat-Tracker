const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const sourceFiles = [
    'professional-skills-descriptions.js',
    path.join('js', 'professional-skills-data.js'),
    path.join('js', 'abilities', 'abilities-data.js'),
    path.join('js', 'character-sheet-model.js'),
    path.join('js', 'character-skill-tests.js'),
    path.join('js', 'character-spells.js')
];
const context = vm.createContext({
    console,
    encodeURIComponent,
    decodeURIComponent,
    localStorage: { getItem: () => null }
});
vm.runInContext(
    "var window = globalThis; var combatants = []; var activeTurnId = 'mage-1'; var selectedId = 'target-1';",
    context
);
sourceFiles.forEach(file => vm.runInContext(
    fs.readFileSync(path.join(projectRoot, file), 'utf8'),
    context,
    { filename: file }
));

const casting = context.characterSpellCasting;
assert.ok(casting, 'A camada de conjuração deve expor seus cálculos de domínio.');

assert.equal(casting.parseSpellCost('8 EST').mode, 'fixed');
assert.equal(casting.parseSpellCost('8 EST').defaultValue, 8);
assert.equal(casting.parseSpellCost('1 a 5 EST').mode, 'range');
assert.equal(casting.parseSpellCost('1 a 5 EST').max, 5);
assert.equal(casting.parseSpellCost({ id: 'axii', cost: 'Variável' }).max, 15);
assert.equal(casting.parseSpellCost('Sem custo').mode, 'free');
assert.equal(casting.parseSpellCost('2 EST × horas').mode, 'formula');

const mage = {
    id: 'mage-1',
    name: 'Yennefer',
    type: 'player',
    creationMode: 'full',
    stCurrent: 30,
    stMax: 50,
    learnedAbilityIds: ['igni'],
    abilities: [{ id: 'igni', name: 'Igni antigo', description: 'Descrição desatualizada.' }],
    professionalSkills: {
        mage_magia_expandida: { invested: 2 },
        mage_sobrecarga_arcana: { invested: 3 }
    }
};
const target = { id: 'target-1', name: 'Alvo', type: 'monster' };
context.__mage = mage;
context.__target = target;
vm.runInContext('combatants.push(__mage, __target)', context);

const knownSpells = casting.getKnownCharacterSpells(mage);
assert.equal(knownSpells.length, 1, 'O painel deve listar somente magias conhecidas.');
assert.equal(knownSpells[0].name, 'Igni', 'O catálogo atual deve prevalecer sobre cópias antigas da ficha.');

const syntheticSpell = {
    id: 'test-spell',
    name: 'Magia de teste',
    cost: '8 EST',
    damage: '4d6',
    range: '12m',
    duration: '3 rodadas'
};
const effective = casting.calculateEffectiveSpell(mage, syntheticSpell, 8);
assert.equal(effective.finalCost, 4, 'Magia Expandida deve reduzir 2 EST por nível.');
assert.match(effective.modifiers[0].label, /Magia Expandida Nv\. 2/);

const overloaded = casting.calculateEffectiveSpell(mage, syntheticSpell, 8, { overloadEffect: 'damage' });
assert.equal(overloaded.finalCost, 8, 'Sobrecarga deve dobrar o custo já modificado.');
assert.equal(overloaded.damage, '4d6 ×2');
assert.match(overloaded.modifiers.at(-1).label, /Dano/);
assert.deepEqual(
    JSON.parse(JSON.stringify(casting.getArcaneOverloadOptions(mage, syntheticSpell).options.map(option => option.id))),
    ['damage', 'range', 'duration']
);

const witcher = {
    type: 'player',
    creationMode: 'full',
    stCurrent: 6,
    runeSourceCurrent: 3
};
const quen = context.predefinedAbilities.find(ability => ability.id === 'quen');
const spent = casting.spendSpellEnergy(witcher, quen, 5);
assert.equal(spent.runeSourceSpent, 3, 'Sinais devem consumir a Fonte Rúnica primeiro.');
assert.equal(spent.staminaSpent, 2);
assert.equal(witcher.runeSourceCurrent, 0);
assert.equal(witcher.stCurrent, 4);

context.toggleCharacterSpellsPanel(encodeURIComponent(mage.id));
const panel = casting.renderCharacterSpellsPanel(mage);
assert.match(panel, /MAGIAS/);
assert.match(panel, /1 conhecida/);
assert.match(panel, /Igni/);
assert.match(panel, /Conjurar/);
assert.doesNotMatch(panel, /Quen/);

assert.equal(casting.renderCharacterSpellsPanel({ ...mage, creationMode: 'quick' }), '');
assert.equal(casting.renderCharacterSpellsPanel({ ...mage, type: 'monster' }), '');

let currentModal = null;
let overloadRollValue = '20';
const castHistory = [];
context.document = {
    getElementById(id) {
        if (id === 'characterSpellCastModal') return currentModal;
        if (id === 'characterSpellOverloadRoll') return { value: overloadRollValue, focus() {} };
        if (id === 'characterSpellHealingRoll') return { value: '4', focus() {} };
        if (id === 'characterSpellDamageRoll') return { value: '6', focus() {} };
        return null;
    },
    createElement() {
        return {
            addEventListener() {},
            remove() { currentModal = null; },
            set innerHTML(value) { this.markup = value; },
            get innerHTML() { return this.markup || ''; }
        };
    },
    body: { appendChild(element) { currentModal = element; } }
};
context.trackCombatAction = (label, callback, detail, metadata) => {
    const result = callback();
    castHistory.push({
        label: typeof label === 'function' ? label() : label,
        detail: typeof detail === 'function' ? detail() : detail,
        metadata: typeof metadata === 'function' ? metadata() : metadata
    });
    return result;
};
context.savePlayersToStorage = () => {};
context.renderList = () => {};
context.showToast = () => {};
mage.progression = { luckDice: 0, adrenaline: 0 };

vm.runInContext("selectedId = 'mage-1'", context);
context.openCharacterSpellCast(encodeURIComponent(mage.id), encodeURIComponent('igni'));
assert.doesNotMatch(
    currentModal.markup,
    /value="mage-1"\s+checked/,
    'O próprio conjurador deve aparecer, mas não vir marcado em magias de múltiplos alvos.'
);
assert.match(currentModal.markup, /value="mage-1"/, 'O conjurador deve continuar disponível como alvo manual.');
context.closeCharacterSpellCast();
vm.runInContext("selectedId = 'target-1'", context);
context.openCharacterSpellCast(encodeURIComponent(mage.id), encodeURIComponent('igni'));
context.setCharacterSpellOverload('damage');
context.updateCharacterSpellDamageField(encodeURIComponent(target.id), 'naturalRoll', '19');
context.updateCharacterSpellDamageField(encodeURIComponent(target.id), 'damage', '6');
context.updateCharacterSpellDamageField(encodeURIComponent(target.id), 'bodyPart', 'torso');
const castResult = context.confirmCharacterSpellCast();
assert.equal(castResult.effective.finalCost, 2);
assert.equal(castResult.damage.total, 12, 'Sobrecarga deve dobrar o dano informado de Igni.');
assert.equal(castResult.damage.entries[0].naturalRoll, 19);
assert.equal(castResult.damage.entries[0].bodyPart, 'torso');
assert.equal(mage.stCurrent, 28);
assert.equal(mage.progression.luckDice, 1, 'Crítico na Sobrecarga deve conceder Dado da Sorte.');
assert.equal(mage.progression.adrenaline, 1, 'Crítico na Sobrecarga em combate deve conceder Adrenalina.');
assert.match(castHistory[0].label, /Yennefer conjurou Igni/);
assert.match(castHistory[0].detail, /Crítico natural/);
assert.equal(castHistory[0].metadata.combat.overload.success, true);
assert.equal(castHistory[0].metadata.combat.spellDamage.total, 12);

const igniDamageRule = casting.getSpellDamageRule(
    context.predefinedAbilities.find(ability => ability.id === 'igni'),
    3
);
assert.equal(igniDamageRule.notation, '3d6');
assert.equal(igniDamageRule.multiple, true, 'Cone deve permitir múltiplos alvos.');
assert.equal(igniDamageRule.damageType, 'fire');

const cenllyRule = casting.getSpellDamageRule(
    context.predefinedAbilities.find(ability => ability.id === 'cenlly_graig'),
    6
);
assert.equal(cenllyRule.mode, 'multi-hit');
assert.equal(cenllyRule.multiple, false, 'As rajadas devem compartilhar um único alvo.');
assert.equal(cenllyRule.multiHit.maxHits, 5);
assert.equal(cenllyRule.multiHit.extraCostPerHit, 1);
const multiHitDamage = casting.calculateMultiHitSpellDamage(cenllyRule, [
    { naturalRoll: '14', damage: '7', bodyPart: 'torso' },
    { naturalRoll: '20', damage: '9', bodyPart: 'head' }
], { success: true, effect: 'damage' });
assert.equal(multiHitDamage.valid, true);
assert.equal(multiHitDamage.hits[0].damage, 14, 'Sobrecarga deve modificar cada impacto individualmente.');
assert.equal(multiHitDamage.hits[1].critical, true, 'O 20 natural deve marcar somente seu próprio impacto como crítico.');
assert.equal(multiHitDamage.hits[1].bodyPart, 'head');
assert.equal(multiHitDamage.total, 32);

const combinedMultiHitDamage = casting.calculateMultiHitSpellDamage(cenllyRule, [
    { naturalRoll: '20', damage: '12', bodyPart: 'head' }
], { success: true, effect: 'damage' }, { strongStrike: true, doubledEffect: true });
assert.equal(combinedMultiHitDamage.hits[0].damage, 48, 'Golpe Forte e Sobrecarga devem resultar em dano ×4 antes do crítico e da região.');
assert.equal(combinedMultiHitDamage.totalMultiplier, 4);
assert.equal(combinedMultiHitDamage.doubledEffect, true);
assert.equal(casting.calculateMultiHitSpellDamage(
    cenllyRule,
    Array.from({ length: 6 }, () => ({ naturalRoll: '10', damage: '5', bodyPart: 'torso' })),
    null,
    { doubledEffect: false }
).valid, false, 'Sem Efeito Dobrado o limite deve permanecer em cinco impactos.');
assert.equal(casting.calculateMultiHitSpellDamage(
    cenllyRule,
    Array.from({ length: 10 }, () => ({ naturalRoll: '10', damage: '5', bodyPart: 'torso' })),
    null,
    { doubledEffect: true }
).valid, true, 'Efeito Dobrado deve permitir até dez impactos.');

const preparedMultiHitSequences = [];
context.startSpellMultiHitSequence = options => {
    preparedMultiHitSequences.push(options);
    return true;
};
mage.learnedAbilityIds.push('cenlly_graig');
vm.runInContext("activeTurnId = 'mage-1'; selectedId = 'target-1';", context);
context.openCharacterSpellCast(encodeURIComponent(mage.id), encodeURIComponent('cenlly_graig'));
assert.match(currentModal.markup, /Quantidade de impactos/);
assert.match(currentModal.markup, /D20 natural/);
assert.match(currentModal.markup, /Local do acerto/);
context.updateCharacterSpellHitCount(2);
context.updateCharacterSpellHitField(0, 'naturalRoll', '14');
context.updateCharacterSpellHitField(0, 'damage', '7');
context.updateCharacterSpellHitField(0, 'bodyPart', 'torso');
context.updateCharacterSpellHitField(1, 'naturalRoll', '20');
context.updateCharacterSpellHitField(1, 'damage', '8');
context.updateCharacterSpellHitField(1, 'bodyPart', 'head');
const multiHitCast = context.confirmCharacterSpellCast(() => 0.5);
assert.equal(multiHitCast.effective.finalCost, 4, 'O custo efetivo deve incluir +1 EST para cada uma das duas rajadas.');
assert.equal(mage.stCurrent, 24);
assert.equal(preparedMultiHitSequences.length, 1);
assert.equal(preparedMultiHitSequences[0].hits.length, 2);
assert.equal(preparedMultiHitSequences[0].hits[1].critical, true);
assert.equal(preparedMultiHitSequences[0].hits[1].bodyPart, 'head');

mage.progression.adrenaline = 2;
overloadRollValue = '19';
vm.runInContext("activeTurnId = 'mage-1'; selectedId = 'target-1';", context);
context.openCharacterSpellCast(encodeURIComponent(mage.id), encodeURIComponent('cenlly_graig'));
context.toggleCharacterSpellAdrenaline('strongStrike', true);
context.toggleCharacterSpellAdrenaline('doubledEffect', true);
assert.match(currentModal.markup, /option value="10"/);
context.updateCharacterSpellHitField(0, 'naturalRoll', '12');
context.updateCharacterSpellHitField(0, 'damage', '6');
context.updateCharacterSpellHitField(0, 'bodyPart', 'torso');
const adrenalineCast = context.confirmCharacterSpellCast(() => 0.5);
assert.equal(adrenalineCast.damage.hits[0].damage, 12, 'Golpe Forte deve dobrar o dano informado.');
assert.equal(adrenalineCast.adrenaline.spent, 2);
assert.equal(mage.progression.adrenaline, 0);

const healer = {
    id: 'healer-1',
    name: 'Triss',
    type: 'player',
    creationMode: 'full',
    stCurrent: 30,
    stMax: 40,
    learnedAbilityIds: ['cura_magica'],
    abilities: [],
    attributes: {
        intelligence: { invested: 6 }
    },
    professionalSkills: {}
};
const woundedTarget = {
    id: 'target-heal',
    name: 'Geralt',
    type: 'player',
    hpCurrent: 10,
    hpMax: 40,
    deathSaves: { success: 1, failures: 1 },
    stabilized: true
};
context.__healer = healer;
context.__woundedTarget = woundedTarget;
vm.runInContext(
    "combatants.push(__healer, __woundedTarget); activeTurnId = 'healer-1'; selectedId = 'target-heal';",
    context
);

assert.equal(casting.getSpellHealingAttributeBonus(healer, casting.getSpellHealingRule('cura_magica')), 3);
assert.deepEqual(
    JSON.parse(JSON.stringify(casting.calculateSpellHealing(
        healer,
        context.predefinedAbilities.find(ability => ability.id === 'cura_magica'),
        4
    ))),
    {
        valid: true,
        abilityId: 'cura_magica',
        base: 3,
        dice: '1d6',
        roll: 4,
        attributeId: 'intelligence',
        attributeLabel: 'Bônus de Inteligência',
        attributeBonus: 3,
        total: 10
    }
);

context.openCharacterSpellCast(encodeURIComponent(healer.id), encodeURIComponent('cura_magica'));
const healingCast = context.confirmCharacterSpellCast();
assert.equal(healingCast.healing.total, 10);
assert.equal(healingCast.healing.healed, 10);
assert.equal(woundedTarget.hpCurrent, 20);
assert.deepEqual(JSON.parse(JSON.stringify(woundedTarget.deathSaves)), { success: 0, failures: 0 });
assert.equal(woundedTarget.stabilized, false);
assert.equal(healer.stCurrent, 15);
assert.match(castHistory.at(-1).detail, /Fórmula de cura: 3 \+ Bônus de Inteligência 3 \+ 1d6 4 = 10/);
assert.equal(castHistory.at(-1).metadata.type, 'healing');
assert.equal(castHistory.at(-1).metadata.combat.finalValue, 10);

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const combatRenderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');
const automationSource = fs.readFileSync(path.join(projectRoot, 'js', 'rules-automation.js'), 'utf8');
const criticalSource = fs.readFileSync(path.join(projectRoot, 'js', 'critical-wounds.js'), 'utf8');
const spellStyles = fs.readFileSync(path.join(projectRoot, 'character-spells.css'), 'utf8');

assert.match(indexSource, /character-spells\.css/);
assert.match(indexSource, /js\/character-spells\.js/);
assert.match(indexSource, /js\/spell-damage-automation\.js/);
assert.match(serviceWorkerSource, /character-spells\.css/);
assert.match(serviceWorkerSource, /js\/character-spells\.js/);
assert.match(serviceWorkerSource, /js\/spell-damage-automation\.js/);
assert.match(combatRenderSource, /renderCharacterSpellsPanel/);
assert.match(automationSource, /prepareCharacterSpellEffect/);
assert.match(automationSource, /prepaidSpellCast/);
assert.match(automationSource, /effectMultiplier/);
assert.match(automationSource, /ability:ritual_de_vida/);
assert.match(automationSource, /turnHealing: 3, perTurnSt: 3/);
assert.match(criticalSource, /window\.addCombatConsequence = addCombatConsequence/);
assert.match(spellStyles, /character-spell-hit-fields select option/);
assert.match(spellStyles, /color-scheme:\s*dark/);

console.log('✓ Cards, custos efetivos e integração de conjuração das magias validados.');
