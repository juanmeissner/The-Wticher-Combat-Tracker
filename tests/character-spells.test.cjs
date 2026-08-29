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
const castHistory = [];
context.document = {
    getElementById(id) {
        if (id === 'characterSpellCastModal') return currentModal;
        if (id === 'characterSpellOverloadRoll') return { value: '20', focus() {} };
        if (id === 'characterSpellHealingRoll') return { value: '4', focus() {} };
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

context.openCharacterSpellCast(encodeURIComponent(mage.id), encodeURIComponent('igni'));
context.setCharacterSpellOverload('damage');
const castResult = context.confirmCharacterSpellCast();
assert.equal(castResult.effective.finalCost, 2);
assert.equal(mage.stCurrent, 28);
assert.equal(mage.progression.luckDice, 1, 'Crítico na Sobrecarga deve conceder Dado da Sorte.');
assert.equal(mage.progression.adrenaline, 1, 'Crítico na Sobrecarga em combate deve conceder Adrenalina.');
assert.match(castHistory[0].label, /Yennefer conjurou Igni/);
assert.match(castHistory[0].detail, /Crítico natural/);
assert.equal(castHistory[0].metadata.combat.overload.success, true);

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
assert.match(castHistory[1].detail, /Fórmula de cura: 3 \+ Bônus de Inteligência 3 \+ 1d6 4 = 10/);
assert.equal(castHistory[1].metadata.type, 'healing');
assert.equal(castHistory[1].metadata.combat.finalValue, 10);

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const combatRenderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');
const automationSource = fs.readFileSync(path.join(projectRoot, 'js', 'rules-automation.js'), 'utf8');
const criticalSource = fs.readFileSync(path.join(projectRoot, 'js', 'critical-wounds.js'), 'utf8');

assert.match(indexSource, /character-spells\.css/);
assert.match(indexSource, /js\/character-spells\.js/);
assert.match(serviceWorkerSource, /character-spells\.css/);
assert.match(serviceWorkerSource, /js\/character-spells\.js/);
assert.match(combatRenderSource, /renderCharacterSpellsPanel/);
assert.match(automationSource, /prepareCharacterSpellEffect/);
assert.match(automationSource, /prepaidSpellCast/);
assert.match(automationSource, /ability:ritual_de_vida/);
assert.match(automationSource, /turnHealing: 3, perTurnSt: 3/);
assert.match(criticalSource, /window\.addCombatConsequence = addCombatConsequence/);

console.log('✓ Cards, custos efetivos e integração de conjuração das magias validados.');
