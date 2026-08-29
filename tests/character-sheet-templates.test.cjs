const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
vm.runInContext('var window = globalThis;', context);

[
    'professional-skills-descriptions.js',
    'js/professional-skills-data.js',
    'js/abilities/abilities-data.js',
    'js/character-sheet-model.js',
    'js/character-sheet-templates.js'
].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(projectRoot, file), 'utf8'), context, {
        filename: file
    });
});

const model = context.characterSheetModel;
const catalog = context.characterSheetTemplates;
const abilities = context.predefinedAbilities;

assert.ok(catalog, 'O catálogo de modelos prontos deve ser exposto globalmente.');
assert.equal(catalog.list.length, 6, 'A Etapa 10 deve oferecer seis construções iniciais.');
assert.equal(new Set(catalog.list.map(template => template.id)).size, catalog.list.length);
assert.equal(Object.isFrozen(catalog.list), true);

catalog.list.forEach(template => {
    assert.ok(template.name);
    assert.ok(template.role);
    assert.ok(template.summary);
    assert.equal(Object.isFrozen(template), true);

    const firstDraft = catalog.createDraft(template.id);
    const secondDraft = catalog.createDraft(template.id);
    assert.notEqual(firstDraft, secondDraft, `${template.id} deve criar rascunhos independentes.`);
    assert.notEqual(firstDraft.attributes, secondDraft.attributes);

    const foundation = model.createFullCharacterFoundation(firstDraft);
    const allocation = model.getCharacterAllocationSummary(
        foundation.identity.level,
        foundation.attributes,
        foundation.skills,
        {
            professionalSkills: foundation.professionalSkills,
            specializationId: foundation.identity.specializationId
        }
    );
    const training = model.getCharacterTrainingSummary(
        foundation.identity.level,
        foundation.learnedAbilityIds,
        {
            raceId: foundation.raceId,
            professionId: foundation.identity.professionId,
            specializationId: foundation.identity.specializationId
        },
        abilities
    );

    assert.equal(foundation.creationMode, 'full');
    assert.equal(foundation.identity.name, template.name);
    assert.equal(foundation.identity.level, 1);
    assert.ok(foundation.raceId);
    assert.ok(foundation.identity.professionId);
    assert.ok(foundation.identity.specializationId);
    assert.equal(allocation.attributePointsSpent, 12);
    assert.ok(allocation.skillPointsSpent > 0);
    assert.ok(allocation.skillPointsRemaining >= 0, `${template.id} excedeu o orçamento de perícias.`);
    assert.ok(training.trainingPointsRemaining >= 0, `${template.id} excedeu os pontos de treino.`);
    assert.ok(Object.values(foundation.attributes).every(entry => entry.invested <= 12));
    assert.ok(Object.values(foundation.skills).every(entry => entry.invested <= 4));
    assert.ok(Object.values(foundation.professionalSkills).every(entry => entry.invested <= 4));

    firstDraft.name = 'Mutação de teste';
    assert.equal(catalog.createDraft(template.id).name, template.name);
});

assert.equal(catalog.getById('modelo-inexistente'), null);
assert.equal(catalog.createDraft('modelo-inexistente'), null);

console.log('✓ Modelos prontos, orçamentos e isolamento dos rascunhos validados.');
