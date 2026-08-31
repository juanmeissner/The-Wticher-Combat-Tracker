const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const professionalDescriptionsSource = fs.readFileSync(
    path.join(projectRoot, 'professional-skills-descriptions.js'),
    'utf8'
);
const professionalSkillsSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'professional-skills-data.js'),
    'utf8'
);
const abilitiesSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'abilities', 'abilities-data.js'),
    'utf8'
);
const modelSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'character-sheet-model.js'),
    'utf8'
);
const templatesSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'character-sheet-templates.js'),
    'utf8'
);
const wizardSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'character-sheet-wizard.js'),
    'utf8'
);
const enhancementsSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'enhancements.js'),
    'utf8'
);
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorkerSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'service-worker.js'),
    'utf8'
);
const wizardCss = fs.readFileSync(
    path.join(projectRoot, 'character-sheet-wizard.css'),
    'utf8'
);
const inventorySource = fs.readFileSync(path.join(projectRoot, 'js', 'inventory.js'), 'utf8');
const abilitiesLogicSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'abilities', 'abilities.js'),
    'utf8'
);
const abilitiesModalSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'ui', 'abilities-modal.js'),
    'utf8'
);

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));

    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        }
    };
}

const localStorage = createStorage();
const context = vm.createContext({ console, localStorage });

vm.runInContext('var window = globalThis;', context);
vm.runInContext(professionalDescriptionsSource, context, {
    filename: 'professional-skills-descriptions.js'
});
vm.runInContext(professionalSkillsSource, context, { filename: 'professional-skills-data.js' });
vm.runInContext(modelSource, context, { filename: 'character-sheet-model.js' });
vm.runInContext(templatesSource, context, { filename: 'character-sheet-templates.js' });
vm.runInContext(abilitiesSource, context, { filename: 'abilities-data.js' });
vm.runInContext(wizardSource, context, { filename: 'character-sheet-wizard.js' });

const wizard = context.characterSheetWizard;

assert.ok(wizard, 'O assistente deve expor seus utilitários de domínio.');
assert.equal(wizard.WIZARD_STEPS.length, 9);
const normalizedDraft = wizard.createCharacterWizardDraft({
    step: 2.9,
    name: 'Geralt de Rívia',
    level: '3.8',
    raceId: 'Witcher',
    professionId: 'Mago',
    specializationId: 'Escola do Lobo',
    attributes: { strength: { invested: 3 } },
    skills: { spellcasting: { invested: 2 }, perception: 9 }
});

assert.equal(normalizedDraft.draftVersion, 4);
assert.equal(normalizedDraft.step, 2);
assert.equal(normalizedDraft.name, 'Geralt de Rívia');
assert.equal(normalizedDraft.level, 3);
assert.equal(normalizedDraft.raceId, 'witcher');
assert.equal(normalizedDraft.professionId, 'witcher');
assert.equal(normalizedDraft.specializationId, 'wolf_school');
assert.equal(normalizedDraft.attributes.strength.invested, 3);
assert.equal(normalizedDraft.skills.spellcasting.invested, 2);
assert.equal(normalizedDraft.skills.perception.invested, 4);
assert.equal(normalizedDraft.skillGroup, 'strength');
assert.ok(Number.isFinite(Date.parse(normalizedDraft.updatedAt)));

const editingDraft = wizard.createCharacterWizardDraft({
    editingSheetId: 'sheet-geralt',
    name: 'Geralt',
    level: 5,
    raceId: 'witcher',
    specializationId: 'wolf_school',
    progression: { adrenaline: 2, luckDice: 1 },
    abilities: [{ id: 'quen', active: true }]
});
assert.equal(editingDraft.editingSheetId, 'sheet-geralt');
assert.equal(editingDraft.progression.adrenaline, 2);
assert.equal(editingDraft.abilities[0].active, true);

const migratedDraft = wizard.createCharacterWizardDraft({
    draftVersion: 1,
    step: 4,
    name: 'Rascunho anterior',
    raceId: 'human',
    professionId: 'warrior',
    specializationId: 'archer'
});
assert.equal(migratedDraft.step, 5, 'O rascunho anterior deve continuar na etapa de perícias gerais.');
assert.equal(migratedDraft.draftVersion, 4);

const migratedStageFiveDraft = wizard.createCharacterWizardDraft({
    draftVersion: 2,
    step: 6,
    name: 'Rascunho da etapa anterior',
    raceId: 'human',
    professionId: 'mage',
    specializationId: 'mage'
});
assert.equal(migratedStageFiveDraft.step, 8, 'A revisão antiga deve continuar na revisão após inserir Magias e Valores.');

const migratedStageSevenDraft = wizard.createCharacterWizardDraft({
    draftVersion: 3,
    step: 7,
    name: 'Rascunho da etapa anterior',
    raceId: 'witcher',
    specializationId: 'griffin_school'
});
assert.equal(migratedStageSevenDraft.step, 8, 'A revisão da versão anterior deve permanecer na revisão.');

const mageDraft = wizard.createCharacterWizardDraft({
    name: 'Yennefer',
    level: 1,
    raceId: 'human',
    professionId: 'mage',
    specializationId: 'mage',
    learnedAbilityIds: ['magia_inexistente', context.predefinedAbilities.find(ability => ability.profession === 'Mago').id]
});
assert.equal(mageDraft.learnedAbilityIds.length, 1);

const restrictedDraft = wizard.createCharacterWizardDraft({
    name: 'Borin',
    raceId: 'dwarf',
    professionId: 'mage',
    specializationId: 'mage',
    skills: { physique: { invested: 2 } }
});
assert.equal(restrictedDraft.professionId, '');
assert.equal(restrictedDraft.specializationId, '');
assert.equal(restrictedDraft.skills.physique.invested, 2);
assert.equal(restrictedDraft.skills.physique.raceBonus, 1);

const savedDraft = wizard.createCharacterWizardDraft({
    step: 3,
    name: 'Yennefer',
    level: 4,
    raceId: 'human',
    professionId: 'mage',
    specializationId: 'mage',
    updatedAt: '2026-08-26T00:00:00.000Z'
});
localStorage.setItem(wizard.CHARACTER_SHEET_DRAFT_KEY, JSON.stringify(savedDraft));

assert.equal(wizard.hasCharacterWizardProgress(wizard.readCharacterWizardDraft()), true);
assert.equal(wizard.readCharacterWizardDraft().name, 'Yennefer');
assert.equal(wizard.readCharacterWizardDraft().level, 4);
wizard.clearCharacterWizardDraft();
assert.equal(wizard.readCharacterWizardDraft(), null);

assert.ok(
    indexSource.indexOf('professional-skills-descriptions.js') < indexSource.indexOf('js/professional-skills-data.js'),
    'As descrições profissionais devem carregar antes do catálogo.'
);
assert.ok(
    indexSource.indexOf('js/character-sheet-model.js') < indexSource.indexOf('js/character-sheet-templates.js'),
    'Os modelos prontos devem carregar depois das regras da ficha.'
);
assert.ok(
    indexSource.indexOf('character-sheet-wizard.css') < indexSource.indexOf('js/character-sheet-wizard.js'),
    'Os estilos do assistente devem ser carregados antes do script.'
);
assert.ok(
    indexSource.indexOf('js/enhancements.js') < indexSource.indexOf('js/character-sheet-wizard.js'),
    'O assistente deve carregar depois das integrações de fichas.'
);
assert.match(
    indexSource,
    /onclick="createNewCharacterSheet\(\)"[^>]+title="Criar personagem"/,
    'O botão de personagem do pad deve abrir o mesmo seletor usado por Nova ficha.'
);
assert.match(serviceWorkerSource, /character-sheet-wizard\.css/);
assert.match(serviceWorkerSource, /js\/character-sheet-wizard\.js/);
assert.match(serviceWorkerSource, /js\/character-sheet-templates\.js/);
assert.match(serviceWorkerSource, /js\/professional-skills-data\.js/);
assert.match(serviceWorkerSource, /professional-skills-descriptions\.js/);
assert.match(wizardCss, /@media \(max-width: 520px\)/);
assert.match(wizardCss, /character-choice-grid/);
assert.match(wizardCss, /character-template-grid/);
assert.match(wizardCss, /character-attribute-grid/);
assert.match(wizardCss, /character-skill-list/);
assert.match(wizardCss, /character-skill-group-bonus/);
assert.match(wizardCss, /character-professional-heading/);
assert.match(wizardCss, /character-professional-description/);
assert.match(wizardCss, /character-wizard-professional-copy/);
assert.match(wizardCss, /character-wizard-skill-copy/);
assert.match(wizardCss, /\.character-allocation-card,\s*\.character-skill-row\s*\{[^}]*flex-direction: column/s);
assert.match(wizardCss, /character-ability-card/);
assert.match(wizardCss, /character-ability-toolbar/);
assert.match(wizardSource, /Bônus de.*aplicado a todas as/);
assert.match(wizardSource, /skill\.description/);
assert.match(wizardSource, /toggleCharacterWizardAbility/);
assert.match(wizardSource, /selectCharacterWizardAbilityTier/);
assert.match(wizardSource, /getCharacterTrainingSummary/);
assert.doesNotMatch(wizardSource, /atributo vinculado/);
assert.match(wizardSource, /getCharacterSkillBreakdown/);
assert.match(wizardSource, /adjustCharacterWizardProfessionalSkill/);
assert.match(wizardSource, /renderCharacterWizardStep\(\{ preserveScroll: true \}\)/);
assert.match(wizardSource, /global\.requestAnimationFrame\(restoreScroll\)/);
assert.match(wizardSource, /global\.setTimeout\?\.\(restoreScroll, 80\)/);
assert.match(wizardCss, /character-race-detail/);
assert.match(wizardCss, /character-review-trait-list/);
assert.match(wizardCss, /character-derived-grid/);
assert.match(wizardSource, /calculateCharacterDerivedValues/);
assert.match(wizardSource, /PASSO 8 DE 9/);
assert.match(wizardSource, /Modelo pronto/);
assert.match(wizardSource, /startCharacterSheetTemplate/);
assert.match(wizardSource, /EDITAR FICHA COMPLETA/);
assert.match(wizardSource, /editSheetId/);
assert.match(wizardSource, /updateFullCharacterSheetFromDraft/);
assert.match(wizardSource, /Salvar alterações/);
assert.match(indexSource, /id="movementInp"/);
assert.match(enhancementsSource, /id="sheetMovement"/);

const inventoryModalAdd = inventorySource.slice(
    inventorySource.indexOf('function addInventoryItemFromModal'),
    inventorySource.indexOf('function renderInventory()')
);
assert.match(inventoryModalAdd, /showCatalogItemDetails\(itemId\)/);
assert.doesNotMatch(inventoryModalAdd, /closeInventoryModal/);

const addAbilityLogic = abilitiesLogicSource.slice(
    abilitiesLogicSource.indexOf('function addAbility'),
    abilitiesLogicSource.indexOf('function removeSelectedAbility')
);
assert.match(addAbilityLogic, /showToast/);
assert.doesNotMatch(addAbilityLogic, /closeAbilitiesModal/);
assert.match(abilitiesModalSource, /addAbility\(id\);\s*openAbilityDetails\(id\);/);
assert.doesNotMatch(abilitiesModalSource, /addAbility\(id\);\s*closeAbilityDetailsModal\(\);/);

console.log('✓ Fluxo, rascunho, responsividade e recursos offline do assistente validados.');
