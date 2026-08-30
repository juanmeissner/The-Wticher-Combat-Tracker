const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const sources = [
    'professional-skills-descriptions.js',
    path.join('js', 'professional-skills-data.js'),
    path.join('js', 'character-sheet-model.js'),
    path.join('js', 'character-skill-tests.js')
].map(file => ({ file, source: fs.readFileSync(path.join(projectRoot, file), 'utf8') }));
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const equipmentCss = fs.readFileSync(path.join(projectRoot, 'equipment.css'), 'utf8');
const combatRenderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');

const context = vm.createContext({ console, encodeURIComponent, decodeURIComponent });
vm.runInContext('var window = globalThis; var combatants = [];', context);
sources.forEach(({ file, source }) => vm.runInContext(source, context, { filename: file }));

const model = context.characterSheetModel;
const skillTests = context.characterSkillTests;
const professionalSkill = model.getCharacterProfessionalSkills('archer')[0];
const combatant = {
    id: 7,
    name: 'Milva',
    type: 'player',
    creationMode: 'full',
    identity: { specializationId: 'archer' },
    attributes: {},
    skills: {
        perception: { invested: 2 },
        archery: { invested: 0 }
    },
    professionalSkills: {
        [professionalSkill.id]: { invested: 3 }
    },
    progression: { luckDice: 2, adrenaline: 1 }
};

assert.ok(skillTests, 'O módulo de testes deve expor seus utilitários de domínio.');
assert.deepEqual(
    JSON.parse(JSON.stringify(skillTests.getCharacterSkillEntries(combatant).map(skill => skill.id))),
    ['perception'],
    'O painel deve exibir somente perícias gerais com total diferente de zero.'
);
assert.equal(skillTests.getCharacterProfessionalSkillEntries(combatant).length, 1);
context.toggleCharacterSkillsPanel('7');
context.toggleCharacterProfessionalSkillsPanel('7');
assert.match(context.renderCharacterSkillsPanel(combatant), /Percepção/);
assert.match(context.renderCharacterSkillsPanel(combatant), /1 ativas/);
assert.match(context.renderCharacterProfessionalSkillsPanel(combatant), new RegExp(professionalSkill.name));
assert.equal(context.renderCharacterSkillsPanel({ ...combatant, creationMode: 'quick' }), '');
assert.equal(context.renderCharacterSkillsPanel({ ...combatant, type: 'monster' }), '');
assert.match(context.renderCharacterResourcesPanel(combatant), /🎲 2 · ⚡ 1/);
assert.match(
    context.renderCharacterResourcesPanel({ ...combatant, creationMode: 'quick' }),
    /RECURSOS/,
    'Fichas rápidas também devem consultar os recursos de combate.'
);
assert.equal(context.renderCharacterResourcesPanel({ ...combatant, type: 'monster' }), '');

const assistedProfessionalSkill = model.getCharacterProfessionalSkillDefinition('noble_comando');
const assistedCombatant = {
    id: 8,
    name: 'Anna Henrietta',
    type: 'player',
    creationMode: 'full',
    identity: { specializationId: 'noble' },
    attributes: {},
    skills: {},
    professionalSkills: {
        [assistedProfessionalSkill.id]: { invested: 2 },
        noble_diletante: { invested: 1 }
    },
    progression: { luckDice: 0, adrenaline: 0 }
};
context.toggleCharacterProfessionalSkillsPanel('8');
const assistedPanel = context.renderCharacterProfessionalSkillsPanel(assistedCombatant);
assert.match(assistedPanel, /Comando/);
assert.match(assistedPanel, /Realizar teste/);
assert.match(assistedPanel, /openCharacterProfessionalSkillTest/);
assert.match(assistedPanel, /REFERÊNCIA/);

const historyEntries = [];
const formElements = {
    characterSkillTarget: { value: '15', focus() {} },
    characterSkillModifier: { value: '0' },
    characterSkillNaturalRoll: { value: '20', focus() {} },
    characterSkillComparison: { value: 'difficulty' },
    characterSkillTestModal: { remove() {} }
};
context.document = {
    getElementById: id => formElements[id] || null
};
context.addCombatHistoryEntry = (label, detail, metadata) => {
    historyEntries.push({ label, detail, metadata });
};
context.savePlayersToStorage = () => {};
context.renderList = () => {};
context.showToast = () => {};
context.__resourceCombatant = combatant;
context.__assistedCombatant = assistedCombatant;
vm.runInContext('combatants.push(__resourceCombatant, __assistedCombatant)', context);

context.toggleCharacterResourcesPanel('7');
const expandedResources = context.renderCharacterResourcesPanel(combatant);
assert.match(expandedResources, /Dado da Sorte/);
assert.match(expandedResources, /Adrenalina/);
assert.match(expandedResources, /adjustCharacterCombatResource/);
assert.equal(context.adjustCharacterCombatResource('7', 'luckDice', 1), true);
assert.equal(combatant.progression.luckDice, 3);
assert.match(historyEntries[0].label, /Dado da Sorte atualizado 2 → 3/);
assert.match(historyEntries[0].detail, /Ajuste manual: \+1/);
historyEntries.length = 0;

const professionalCritical = context.executeCharacterSkillTest(
    encodeURIComponent('8'),
    encodeURIComponent(assistedProfessionalSkill.id),
    'professional'
);
assert.equal(professionalCritical.finalResult, 22);
assert.equal(professionalCritical.classification, 'critical');
assert.equal(assistedCombatant.progression.luckDice, 1);
assert.equal(assistedCombatant.progression.adrenaline, 1);
assert.equal(historyEntries.length, 1);
assert.match(historyEntries[0].detail, /habilidade profissional assistida/);
assert.match(historyEntries[0].detail, /Regra de referência: Comando/);
assert.equal(historyEntries[0].metadata.type, 'skill-test');
assert.equal(historyEntries[0].metadata.combat.testKind, 'professional');

const lowHpReminderSkill = model.getCharacterProfessionalSkillDefinition(
    'lynx_school_furia_descontrolada'
);
const reminderCombatant = {
    id: 9,
    name: 'Gaetan',
    type: 'player',
    creationMode: 'full',
    identity: { specializationId: 'lynx_school' },
    hpCurrent: 20,
    hpMax: 50,
    attributes: {},
    skills: {},
    professionalSkills: {
        [lowHpReminderSkill.id]: { invested: 2 }
    },
    effects: [],
    conditions: []
};
context.activeTurnId = 9;
const reminderPresentation = skillTests.getProfessionalReminderPresentation(
    lowHpReminderSkill,
    reminderCombatant
);
assert.equal(reminderPresentation.relevant, true);
assert.deepEqual(
    JSON.parse(JSON.stringify(reminderPresentation.relevantTriggers)),
    ['low-hp']
);
context.toggleCharacterProfessionalSkillsPanel('9');
const reminderPanel = context.renderCharacterProfessionalSkillsPanel(reminderCombatant);
assert.match(reminderPanel, /has-relevant-reminders/);
assert.match(reminderPanel, /is-contextually-relevant/);
assert.match(reminderPanel, /PV baixo/);
assert.match(reminderPanel, /is-relevant/);

const critical = model.resolveCharacterSkillTest({
    naturalRoll: 20,
    skillTotal: 4,
    modifier: 0,
    target: 15,
    inCombat: true
});
skillTests.applyCharacterSkillTestRewards(combatant, critical);
assert.equal(combatant.progression.luckDice, 4);
assert.equal(combatant.progression.adrenaline, 2);

context.getAutomationAdrenalineGain = (_combatant, base) => ({
    base,
    multiplier: 2,
    bonus: base,
    total: base * 2,
    source: 'Bosque de Maribor'
});
const mariborCritical = model.resolveCharacterSkillTest({
    naturalRoll: 20,
    skillTotal: 4,
    modifier: 0,
    target: 15,
    inCombat: true
});
skillTests.applyCharacterSkillTestRewards(combatant, mariborCritical);
assert.equal(combatant.progression.adrenaline, 4, 'Bosque de Maribor deve conceder um dado adicional de Adrenalina.');
assert.equal(mariborCritical.appliedAdrenalineGained, 2);
assert.equal(mariborCritical.adrenalineBonusSource, 'Bosque de Maribor');

assert.ok(
    indexSource.indexOf('js/character-sheet-model.js') < indexSource.indexOf('js/character-skill-tests.js'),
    'O modelo deve carregar antes do assistente de testes.'
);
assert.match(serviceWorkerSource, /js\/character-skill-tests\.js/);
assert.match(equipmentCss, /character-skills-panel/);
assert.match(equipmentCss, /character-resources-panel/);
assert.match(equipmentCss, /character-skill-test-dialog/);
assert.match(equipmentCss, /character-professional-test-button/);
assert.match(equipmentCss, /character-professional-reminder-tags/);
assert.match(equipmentCss, /character-skill-context-options/);
assert.match(combatRenderSource, /renderCharacterResourcesPanel/);

console.log('✓ Painéis de ficha completa, testes e recompensas de crítico validados.');
