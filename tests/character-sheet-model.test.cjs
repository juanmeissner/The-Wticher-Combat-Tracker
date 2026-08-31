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
const source = fs.readFileSync(
    path.join(projectRoot, 'js', 'character-sheet-model.js'),
    'utf8'
);
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorkerSource = fs.readFileSync(
    path.join(projectRoot, 'js', 'service-worker.js'),
    'utf8'
);
const context = vm.createContext({ console });

vm.runInContext(professionalDescriptionsSource, context, {
    filename: 'professional-skills-descriptions.js'
});
vm.runInContext(professionalSkillsSource, context, { filename: 'professional-skills-data.js' });
vm.runInContext(source, context, { filename: 'character-sheet-model.js' });
vm.runInContext(abilitiesSource, context, { filename: 'abilities-data.js' });

const model = context.characterSheetModel;

assert.ok(model, 'O modelo de ficha deve ser exposto globalmente.');
assert.ok(
    indexSource.indexOf('professional-skills-descriptions.js') < indexSource.indexOf('js/professional-skills-data.js'),
    'As descrições devem ser carregadas antes do catálogo profissional.'
);
assert.ok(
    indexSource.indexOf('js/professional-skills-data.js') < indexSource.indexOf('js/character-sheet-model.js'),
    'O catálogo profissional deve ser carregado antes do modelo de ficha.'
);
assert.ok(
    indexSource.indexOf('js/character-sheet-model.js') < indexSource.indexOf('js/enhancements.js'),
    'O modelo deve ser carregado antes da persistência das fichas.'
);
assert.match(
    serviceWorkerSource,
    /\.\/js\/character-sheet-model\.js/,
    'O modelo deve estar disponível no modo offline.'
);
assert.equal(model.CHARACTER_SHEET_SCHEMA_VERSION, 1);
assert.equal(model.CHARACTER_RULES_VERSION, 11);
assert.equal(model.CHARACTER_ATTRIBUTE_BASE_VALUE, 10);
assert.equal(model.CHARACTER_SKILL_INVESTMENT_CAP, 4);
assert.equal(model.CHARACTER_ATTRIBUTES.length, 6);
assert.equal(model.CHARACTER_SKILLS.length, 53);
assert.equal(model.CHARACTER_SKILLS.filter(skill => skill.pointCost === 2).length, 7);
assert.equal(model.CHARACTER_PROFESSIONAL_SKILLS.length, 280);
assert.equal(Object.keys(model.CHARACTER_PROFESSIONAL_SKILL_TREES).length, 28);
assert.deepEqual(
    JSON.parse(JSON.stringify(context.characterProfessionalSkillsData.automationSummary)),
    { automatic: 29, assisted: 68, reminder: 108, reference: 75 },
    'Toda habilidade profissional deve pertencer a um lote de automação.'
);
assert.equal(model.getCharacterProfessionalSkillDefinition('melitele_cuidado_prolongado').automation.status, 'implemented');
assert.equal(model.getCharacterProfessionalSkillDefinition('melitele_iniciado_dos_deuses').automation.status, 'implemented');
assert.equal(model.getCharacterProfessionalSkillDefinition('grey_roads_minstrel_cantar_por_moedas').automation.batch, 5);
assert.equal(
    model.CHARACTER_PROFESSIONAL_SKILLS.every(skill => (
        ['automatic', 'assisted', 'reminder', 'reference'].includes(skill.automation?.mode)
        && Number.isInteger(skill.automation?.batch)
    )),
    true
);
assert.equal(
    model.CHARACTER_PROFESSIONAL_SKILLS
        .filter(skill => skill.automation?.mode === 'reminder')
        .every(skill => Array.isArray(skill.automation.triggers) && skill.automation.triggers.length > 0),
    true,
    'Todo lembrete profissional deve declarar ao menos um contexto.'
);
assert.equal(model.getCharacterProfessionalSkills('archer').length, 10);
assert.equal(new Set(model.CHARACTER_PROFESSIONAL_SKILLS.map(skill => skill.id)).size, 280);
assert.equal(
    model.CHARACTER_PROFESSIONAL_SKILLS.every(skill => skill.description.trim().length > 0),
    true,
    'Todas as habilidades profissionais devem possuir descrição.'
);
assert.equal(professionalDescriptionsSource.includes(String.fromCodePoint(0xfffd)), false);
assert.equal(professionalSkillsSource.includes(String.fromCodePoint(0xfffd)), false);
const selectableTreeIds = [
    ...model.CHARACTER_WITCHER_SCHOOLS.map(entry => entry.id),
    ...model.CHARACTER_PROFESSIONS.flatMap(profession => profession.specializations.map(entry => entry.id))
];
assert.deepEqual(
    [...new Set(selectableTreeIds)].sort(),
    Object.keys(model.CHARACTER_PROFESSIONAL_SKILL_TREES).sort(),
    'Toda especialização selecionável deve possuir exatamente uma árvore profissional.'
);
assert.equal(
    model.CHARACTER_PROFESSIONAL_SKILLS.every(skill => (
        skill.generalSkillBonuses.every(skillId => Boolean(model.getCharacterSkillDefinition(skillId)))
    )),
    true,
    'Todos os bônus profissionais devem apontar para IDs válidos de perícias gerais.'
);
assert.equal(model.getCharacterSkillsByAttribute('wisdom').length, 21);
assert.equal(model.getCharacterSkillDefinition('spellcasting').pointCost, 2);
assert.equal(model.CHARACTER_MOVEMENT_MINIMUM, 5);
assert.equal(model.CHARACTER_MOVEMENT_MAXIMUM, 15);

const abilityCatalog = context.predefinedAbilities;
assert.equal(Array.isArray(abilityCatalog), true);
assert.equal(abilityCatalog.length, 168);
assert.equal(new Set(abilityCatalog.map(ability => ability.id)).size, 168);
assert.equal(
    model.getCharacterAbilityLearningOptions(
        { raceId: 'witcher', professionId: 'witcher', specializationId: 'wolf_school' },
        abilityCatalog
    ).length,
    9
);
assert.equal(
    model.getCharacterAbilityLearningOptions(
        { raceId: 'human', professionId: 'mage', specializationId: 'mage' },
        abilityCatalog
    ).length,
    117
);
assert.equal(
    model.getCharacterAbilityLearningOptions(
        { raceId: 'human', professionId: 'cleric', specializationId: 'druid' },
        abilityCatalog
    ).length,
    46
);
assert.equal(
    model.getCharacterAbilityLearningOptions(
        { raceId: 'human', professionId: 'warrior', specializationId: 'archer' },
        abilityCatalog
    ).length,
    0
);

const mageAbilityContext = { raceId: 'human', professionId: 'mage', specializationId: 'mage' };
const mageLearningOptions = model.getCharacterAbilityLearningOptions(mageAbilityContext, abilityCatalog);
const beginnerMageAbility = mageLearningOptions.find(ability => ability.profession === 'Mago' && ability.unlockCost === 1);
const professionalMageAbility = mageLearningOptions.find(ability => ability.profession === 'Mago' && ability.unlockCost === 2);
const ritualAbility = mageLearningOptions.find(ability => ability.profession === 'Ritual');
const trainingSummary = model.getCharacterTrainingSummary(
    1,
    [beginnerMageAbility.id, beginnerMageAbility.id, professionalMageAbility.id, ritualAbility.id],
    mageAbilityContext,
    abilityCatalog
);
assert.equal(trainingSummary.trainingPoints, 15);
assert.equal(trainingSummary.learnedCount, 3);
assert.equal(
    trainingSummary.trainingPointsSpent,
    beginnerMageAbility.unlockCost + professionalMageAbility.unlockCost + ritualAbility.unlockCost
);
assert.equal(trainingSummary.automaticAbilityIds.length, 0);
assert.equal(
    model.buildCharacterAbilities(
        [],
        { raceId: 'witcher', professionId: 'witcher', specializationId: 'wolf_school' },
        abilityCatalog
    ).length,
    9,
    'Witchers devem receber automaticamente todas as habilidades oficiais de Bruxo.'
);

assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterBudgets(1))),
    { level: 1, attributePoints: 12, skillPoints: 60, trainingPoints: 15 }
);
assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterBudgets(3))),
    { level: 3, attributePoints: 14, skillPoints: 68, trainingPoints: 25 }
);
assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterBudgets(100))),
    { level: 100, attributePoints: 111, skillPoints: 456, trainingPoints: 510 }
);
assert.equal(model.normalizeCharacterLevel(0), 1);
assert.equal(model.normalizeCharacterLevel('4.9'), 4);
assert.equal(model.normalizeCharacterLevel('sem nível'), 1);

const attributeAllocations = model.normalizeCharacterAttributeAllocations({
    strength: { invested: 5 },
    intelligence: 2.8,
    constitution: { invested: -3 }
});
assert.equal(attributeAllocations.strength.invested, 5);
assert.equal(attributeAllocations.intelligence.invested, 2);
assert.equal(attributeAllocations.constitution.invested, 0);
assert.equal(model.calculateCharacterAttributePointsSpent(attributeAllocations), 7);
assert.equal(model.getCharacterAttributeTotal('strength', attributeAllocations), 15);
assert.equal(model.getCharacterAttributeModifier('strength', {}), 0);
assert.equal(model.getCharacterAttributeModifier('strength', { strength: { invested: 1 } }), 0);
assert.equal(model.getCharacterAttributeModifier('strength', { strength: { invested: 2 } }), 1);
assert.equal(model.getCharacterAttributeModifier('strength', { strength: { invested: 4 } }), 2);

const skillAllocations = model.normalizeCharacterSkillAllocations({
    spellcasting: { invested: 4 },
    tactics: { invested: 8 },
    perception: { invested: 3 }
});
assert.equal(skillAllocations.tactics.invested, 4);
assert.equal(model.getCharacterSkillTotal('perception', skillAllocations), 3);
assert.equal(
    model.getCharacterSkillTotal('brawl', { brawl: { invested: 1 } }, { strength: { invested: 4 } }),
    3,
    'A perícia deve somar um ponto de bônus para cada dois pontos do atributo acima de 10.'
);
assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterSkillBreakdown(
        'archery',
        { archery: { invested: 2, raceBonus: 1 } },
        { dexterity: { invested: 6 } }
    ))),
    {
        skillId: 'archery',
        attributeId: 'dexterity',
        invested: 2,
        attributeModifier: 3,
        raceBonus: 1,
        professionBonus: 0,
        specializationBonus: 0,
        equipmentBonus: 0,
        temporaryBonus: 0,
        manualAdjustment: 0,
        bonusTotal: 4,
        total: 6
    },
    'A decomposição deve separar investimento, bônus por origem e total final.'
);
assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterAllocationSummary(1, attributeAllocations, skillAllocations))),
    {
        level: 1,
        attributePoints: 12,
        skillPoints: 60,
        trainingPoints: 15,
        attributePointsSpent: 7,
        attributePointsRemaining: 5,
        commonSkillPointsSpent: 19,
        professionalSkillPointsSpent: 0,
        skillPointsSpent: 19,
        skillPointsRemaining: 41
    }
);
assert.equal(
    model.getCharacterAllocationSummary(1, attributeAllocations, skillAllocations, {
        professionalSkillPointsSpent: 10
    }).skillPointsRemaining,
    31,
    'Perícias comuns e profissionais devem consumir o mesmo orçamento.'
);

const professionalAllocations = model.normalizeCharacterProfessionalSkillAllocations({
    archer_mira_estavel: { invested: 3 },
    archer_tiro_incapacitante: { invested: 8 }
}, 'archer');
assert.equal(professionalAllocations.archer_tiro_incapacitante.invested, 4);
assert.equal(model.calculateCharacterProfessionalSkillPointsSpent(professionalAllocations, 'archer'), 7);
assert.equal(
    model.getCharacterAllocationSummary(1, {}, {}, {
        professionalSkills: professionalAllocations,
        specializationId: 'archer'
    }).skillPointsRemaining,
    53
);
assert.equal(
    model.getCharacterProfessionalSkillBreakdown(
        'archer_mira_estavel',
        professionalAllocations,
        { dexterity: { invested: 6 } }
    ).total,
    3,
    'Habilidades profissionais devem usar apenas o nível investido, sem bônus de atributo.'
);
assert.equal(
    model.getCharacterProfessionalSkillBreakdown(
        'archer_mira_estavel',
        professionalAllocations,
        { dexterity: { invested: 6 } }
    ).attributeModifier,
    0
);
const witcherProfessionalBonuses = model.applyCharacterProfessionalSkillBonuses(
    'wolf_school',
    { wolf_school_treinamento_de_bruxo: { invested: 2 } },
    {}
);
assert.equal(witcherProfessionalBonuses.block.professionBonus, 2);
assert.equal(witcherProfessionalBonuses.monster_lore.professionBonus, 2);
assert.equal(witcherProfessionalBonuses.spellcasting.professionBonus, 2);
assert.equal(witcherProfessionalBonuses.archery.professionBonus, 0);
assert.equal(
    model.getCharacterSkillTotal('block', witcherProfessionalBonuses, {}),
    2,
    'Bônus concedidos pela habilidade profissional devem aparecer nas perícias gerais.'
);

assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterNaturalRollResult(20))),
    {
        naturalRoll: 20,
        classification: 'critical',
        label: 'Crítico',
        luckDiceGained: 1,
        adrenalineGained: 0
    }
);
assert.equal(model.getCharacterNaturalRollResult(20, { inCombat: true }).adrenalineGained, 1);
assert.equal(model.getCharacterNaturalRollResult(19, { inCombat: true }).luckDiceGained, 0);
assert.equal(model.getCharacterNaturalRollResult(21).classification, 'invalid');
assert.deepEqual(
    JSON.parse(JSON.stringify(model.resolveCharacterSkillTest({
        naturalRoll: 20,
        skillTotal: 6,
        modifier: -1,
        target: 22,
        inCombat: true
    }))),
    {
        valid: true,
        naturalRoll: 20,
        classification: 'critical',
        label: 'Crítico',
        luckDiceGained: 1,
        adrenalineGained: 1,
        skillTotal: 6,
        modifier: -1,
        target: 22,
        finalResult: 25,
        success: true,
        margin: 3
    },
    'O teste deve somar d20, total da perícia e modificador, preservando as recompensas do crítico.'
);
assert.equal(model.resolveCharacterSkillTest({ naturalRoll: 10, skillTotal: 2, target: 15 }).success, false);
assert.equal(model.resolveCharacterSkillTest({ naturalRoll: 21, skillTotal: 2, target: 15 }).valid, false);

assert.equal(model.getCharacterSkillPointCost({ name: 'Percepção' }), 1);
assert.equal(model.getCharacterSkillPointCost({ name: 'Alquimia (2)' }), 2);
assert.equal(model.getCharacterSkillPointCost({ name: 'Criar', pointCost: 2 }), 2);
assert.equal(model.normalizeSkillInvestment(8), 4);
assert.equal(model.normalizeSkillInvestment(-2), 0);
assert.equal(model.calculateCharacterSkillPointsSpent(
    {
        percepcao: { invested: 3 },
        alquimia: { invested: 2 },
        criar: 9
    },
    {
        percepcao: { name: 'Percepção' },
        alquimia: { name: 'Alquimia (2)' },
        criar: { name: 'Criar', pointCost: 2 }
    }
), 15, 'Perícias pesadas custam dois pontos e o investimento é limitado a quatro.');

assert.equal(model.normalizeCharacterRaceId('Ananico'), 'halfling');
assert.equal(model.normalizeCharacterRaceId('Lobisomen'), 'werewolf');
assert.equal(model.getDefaultMonsterCategoryForRace('Witcher'), 'Humanoide');
assert.equal(model.getDefaultMonsterCategoryForRace('Vampiro'), 'Vampiro');
assert.equal(model.getDefaultMonsterCategoryForRace('Lobisomem'), 'Amaldiçoado');
assert.equal(model.getCharacterRaceDefinition('Vampiro').development, 'in_progress');
assert.equal(model.isCharacterProfessionAvailableForRace('mage', 'dwarf'), false);
assert.equal(model.isCharacterProfessionAvailableForRace('cleric', 'halfling'), false);
assert.equal(model.isCharacterProfessionAvailableForRace('warrior', 'dwarf'), true);
assert.equal(model.getAvailableCharacterProfessions('dwarf').length, 7);

const humanFoundation = model.applyCharacterRaceBonuses('human', {}, {});
assert.equal(model.getCharacterAttributeTotal('charisma', humanFoundation.attributes), 11);
assert.equal(model.getCharacterAttributeModifier('charisma', humanFoundation.attributes), 0);
assert.equal(model.getCharacterSkillTotal('seduction', humanFoundation.skills), 1);
assert.equal(model.getCharacterSkillTotal('deduction', humanFoundation.skills), 1);

const elfFoundation = model.applyCharacterRaceBonuses(
    'elf',
    { strength: { invested: 2 } },
    { archery: { invested: 3 }, physique: { invested: 1 } }
);
assert.equal(model.getCharacterSkillTotal('archery', elfFoundation.skills), 5);
assert.equal(elfFoundation.skills.archery.invested, 3);
assert.equal(
    model.getCharacterAllocationSummary(1, elfFoundation.attributes, elfFoundation.skills).skillPointsSpent,
    4,
    'Bônus raciais não devem consumir o orçamento de perícias.'
);

const dwarfFoundation = model.applyCharacterRaceBonuses(
    'dwarf',
    elfFoundation.attributes,
    elfFoundation.skills
);
assert.equal(dwarfFoundation.skills.archery.raceBonus, 0, 'Trocar raça deve remover o bônus racial anterior.');
assert.equal(model.getCharacterSkillTotal('archery', dwarfFoundation.skills), 3);
assert.equal(model.getCharacterSkillTotal('physique', dwarfFoundation.skills), 2);
assert.equal(dwarfFoundation.effects.naturalDamageReduction, 2);
assert.equal(dwarfFoundation.effects.carryingCapacityBonus, 25);
assert.equal(model.applyCharacterRaceBonuses('vampire', {}, {}).skills.brawl.raceBonus, 0);

const mageDerivedFoundation = model.createFullCharacterFoundation({
    name: 'Yennefer',
    level: 4,
    raceId: 'human',
    professionId: 'mage',
    specializationId: 'mage',
    attributes: {
        strength: { invested: 2 },
        intelligence: { invested: 6 },
        dexterity: { invested: 2 },
        constitution: { invested: 4 }
    },
    professionalSkills: {
        mage_sobrecarga_arcana: { invested: 2 },
        mage_magia_expandida: { invested: 3 }
    },
    skills: {
        physique: { invested: 2 },
        spellcasting: { invested: 4 },
        athletics: { invested: 3 }
    }
});
const mageDerived = model.calculateCharacterDerivedValues(mageDerivedFoundation, {
    equippedWeight: 10
});
assert.equal(mageDerived.hpMaximum, 48);
assert.equal(mageDerived.breakdown.constitutionBase, 14);
assert.equal(mageDerived.stMaximum, 41);
assert.equal(mageDerived.carryingCapacity, 11);
assert.equal(mageDerived.movement, 7);
assert.equal(mageDerived.breakdown.movementBeforeWeight, 17);
assert.equal(mageDerived.breakdown.movementWeightPenalty, 10);
assert.equal(mageDerived.excessWeight, 0);
assert.equal(mageDerived.isEncumbered, false);
assert.equal(mageDerived.breakdown.stClassBonus, 20);
assert.equal(mageDerived.expandedMagic, 3);

const encumberedMageDerived = model.calculateCharacterDerivedValues(mageDerivedFoundation, {
    equippedWeight: 20
});
assert.equal(encumberedMageDerived.movement, 5, 'O Movimento base não pode ficar abaixo de 5.');
assert.equal(encumberedMageDerived.excessWeight, 9);
assert.equal(encumberedMageDerived.isEncumbered, true);

const mageProfessionalBonuses = model.applyCharacterProfessionalSkillBonuses(
    'mage',
    { mage_treinamento_magico: { invested: 2 } },
    {}
);
assert.equal(mageProfessionalBonuses.spellcasting.professionBonus, 2);
assert.equal(mageProfessionalBonuses.resist_magic.professionBonus, 2);
assert.equal(mageProfessionalBonuses.alchemy.professionBonus, 2);

const manAtArmsBonuses = model.applyCharacterProfessionalSkillBonuses(
    'man_at_arms',
    { man_at_arms_durao_como_aco: { invested: 3 } },
    {}
);
assert.equal(manAtArmsBonuses.physique.professionBonus, 3);
assert.equal(manAtArmsBonuses.tolerance.professionBonus, 3);

const dwarfDerivedFoundation = model.createFullCharacterFoundation({
    name: 'Borin',
    level: 1,
    raceId: 'dwarf',
    professionId: 'warrior',
    specializationId: 'vanguard',
    attributes: { strength: { invested: 2 }, constitution: { invested: 2 } },
    skills: { physique: { invested: 2 } }
});
const dwarfDerived = model.calculateCharacterDerivedValues(dwarfDerivedFoundation);
assert.equal(dwarfDerived.hpMaximum, 27);
assert.equal(dwarfDerived.breakdown.constitutionBase, 12);
assert.equal(dwarfDerived.carryingCapacity, 36);
assert.equal(dwarfDerived.breakdown.racialCarryBonus, 25);

const wolfDerivedFoundation = model.createFullCharacterFoundation({
    name: 'Geralt',
    level: 2,
    raceId: 'witcher',
    specializationId: 'wolf_school',
    attributes: { intelligence: { invested: 4 }, constitution: { invested: 2 } },
    professionalSkills: {
        wolf_school_treinamento_de_bruxo: { invested: 2 },
        wolf_school_fonte_magica: { invested: 3 }
    },
    skills: { physique: { invested: 2 }, spellcasting: { invested: 2 } }
});
const wolfDerived = model.calculateCharacterDerivedValues(wolfDerivedFoundation);
assert.equal(wolfDerived.stMaximum, 18);
assert.equal(wolfDerived.breakdown.stClassBonus, 6);

const griffinDerivedFoundation = model.createFullCharacterFoundation({
    name: 'Coën',
    raceId: 'witcher',
    specializationId: 'griffin_school',
    professionalSkills: { griffin_school_fonte_runica: { invested: 2 } }
});
const griffinDerived = model.calculateCharacterDerivedValues(griffinDerivedFoundation);
assert.equal(griffinDerived.runeSourceMaximum, 4);
assert.match(
    fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8'),
    /rune-source-container[\s\S]*Fonte Rúnica/,
    'A Fonte Rúnica deve aparecer como recurso separado no card de combate.'
);
assert.match(
    fs.readFileSync(path.join(projectRoot, 'js', 'enhancements.js'), 'utf8'),
    /copyCharacterFoundation\(combatant, sheet\);\s*(?:window\.restoreCareStateEffects\?\.\(combatant\);\s*)?refreshCharacterDerivedValues\(combatant\);/,
    'O combatente importado deve receber imediatamente seus recursos derivados.'
);
assert.equal(griffinDerived.breakdown.stClassBonus, 0);

assert.equal(model.normalizeCharacterProfessionId('Sacerdote'), 'cleric');
assert.equal(model.normalizeCharacterProfessionId('Clérigo'), 'cleric');
assert.equal(model.getCharacterSpecializations('cleric').length, 4);
assert.equal(model.getCharacterSpecializationDefinition('cleric', 'Druida').id, 'druid');
assert.deepEqual(
    JSON.parse(JSON.stringify(model.getCharacterSpecializationDefinition('cleric', 'druid').abilityProfessions)),
    ['Druida', 'Ritual', 'Hex']
);
assert.equal(
    model.CHARACTER_PROFESSIONS.reduce((total, profession) => total + profession.specializations.length, 0),
    20
);
assert.equal(model.CHARACTER_WITCHER_SCHOOLS.length, 8);

const legacySheet = {
    id: 'sheet-legacy',
    name: 'Dettlaff',
    hpMax: 80,
    hpCurrent: 47,
    stMax: 30,
    stCurrent: 18,
    monsterCategory: 'Vampiro',
    inventory: [{ id: 'sangue', quantity: 2 }],
    abilities: [{ id: 'quen' }],
    equipment: { weapons: ['espada', null, null] }
};
const migration = model.migrateCharacterSheets([legacySheet]);
const migratedSheet = migration.sheets[0];

assert.equal(migration.changed, true);
assert.equal(migratedSheet.schemaVersion, 1);
assert.equal(migratedSheet.rulesVersion, 11);
assert.equal(migratedSheet.creationMode, 'quick');
assert.equal(migratedSheet.raceId, 'vampire');
assert.equal(migratedSheet.hpCurrent, 47);
assert.equal(migratedSheet.inventory[0].id, 'sangue');
assert.equal(migratedSheet.equipment.weapons[0], 'espada');
assert.equal(legacySheet.schemaVersion, undefined, 'A migração deve ser pura e não alterar a origem.');
migratedSheet.inventory[0].quantity = 9;
assert.equal(legacySheet.inventory[0].quantity, 2, 'Coleções migradas não devem compartilhar referências com a origem.');
migratedSheet.inventory[0].quantity = 2;

const repeatedMigration = model.migrateCharacterSheets(migration.sheets);
assert.equal(repeatedMigration.changed, false, 'A migração deve ser idempotente.');

const fullSheet = model.normalizeCharacterSheet({
    id: 'sheet-full',
    name: 'Geralt',
    creationMode: 'full',
    raceId: 'Witcher',
    identity: {
        name: 'Geralt',
        level: 3,
        professionId: 'Witcher',
        specializationId: 'Escola do Lobo'
    },
    attributes: { strength: { invested: 2 } },
    progression: { attributePointsSpent: 2 }
});

assert.equal(fullSheet.creationMode, 'full');
assert.equal(fullSheet.identity.level, 3);
assert.equal(fullSheet.identity.raceId, 'witcher');
assert.equal(fullSheet.identity.professionId, 'witcher');
assert.equal(fullSheet.identity.specializationId, 'wolf_school');
assert.equal(fullSheet.monsterCategory, 'Humanoide');
assert.equal(fullSheet.attributes.strength.invested, 2);
assert.equal(fullSheet.skills.perception.raceBonus, 1);
assert.equal(fullSheet.skills.human_perception.raceBonus, -4);
assert.equal(fullSheet.racialTraits.length, 4);
assert.equal(fullSheet.abilities.length, 9);
assert.equal(fullSheet.learnedAbilityIds.length, 0);
assert.equal(fullSheet.progression.trainingPointsSpent, 0);

const mageSheet = model.createFullCharacterFoundation({
    name: 'Yennefer',
    level: 1,
    raceId: 'human',
    professionId: 'mage',
    specializationId: 'mage',
    learnedAbilityIds: [beginnerMageAbility.id, professionalMageAbility.id]
});
assert.deepEqual(
    JSON.parse(JSON.stringify(mageSheet.learnedAbilityIds)),
    [beginnerMageAbility.id, professionalMageAbility.id]
);
assert.equal(mageSheet.abilities.length, 2);
assert.equal(
    mageSheet.progression.trainingPointsSpent,
    beginnerMageAbility.unlockCost + professionalMageAbility.unlockCost
);

const restrictedDwarf = model.createFullCharacterFoundation({
    name: 'Borin',
    raceId: 'dwarf',
    professionId: 'mage',
    specializationId: 'mage'
});
assert.equal(restrictedDwarf.identity.professionId, '');
assert.equal(restrictedDwarf.identity.specializationId, '');

const persisted = JSON.parse(JSON.stringify([migratedSheet, fullSheet]));
const restored = model.migrateCharacterSheets(persisted);

assert.equal(restored.changed, false, 'Dados persistidos no esquema atual não devem ser regravados.');
assert.equal(restored.sheets[0].hpCurrent, 47);
assert.equal(restored.sheets[1].identity.specializationId, 'wolf_school');

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

const integrationStorage = createStorage({
    dnd_character_sheets: JSON.stringify([legacySheet])
});
const integrationContext = vm.createContext({
    console,
    localStorage: integrationStorage
});

vm.runInContext(`
    var window = globalThis;
    window.addEventListener = () => {};
    let combatants = [{
        id: 91,
        name: 'Dettlaff',
        type: 'player',
        hpMax: 80,
        hpCurrent: 47,
        stMax: 30,
        stCurrent: 18,
        monsterCategory: 'Vampiro',
        inventory: [{ id: 'sangue', quantity: 2 }],
        abilities: [{ id: 'quen' }],
        equipment: { weapons: ['espada', null, null] }
    }];
    let inventory = [];
    let abilitiesInventory = [];
    let expandedMagic = 0;
    let activeTurnId = null;
    function renderSessionToolsView() {}
    function showToast() {}
    function sortCombatants() {}
    function savePlayersToStorage() {}
    function renderList() {}
    function closeSessionTools() {}
`, integrationContext);
vm.runInContext(professionalSkillsSource, integrationContext, { filename: 'professional-skills-data.js' });
vm.runInContext(source, integrationContext, { filename: 'character-sheet-model.js' });
vm.runInContext(
    fs.readFileSync(path.join(projectRoot, 'js', 'enhancements.js'), 'utf8'),
    integrationContext,
    { filename: 'enhancements.js' }
);
vm.runInContext('migrateCharacterSheetSchema()', integrationContext);
vm.runInContext('syncCombatantsToCharacterSheets()', integrationContext);

const stage10BackupRaw = integrationStorage.getItem('dnd_character_sheets_backup_stage10_v11');
const stage10Backup = JSON.parse(stage10BackupRaw);
assert.ok(stage10Backup.createdAt, 'A consolidação deve criar um backup local datado.');
assert.equal(stage10Backup.rulesVersion, 11);
assert.equal(stage10Backup.sheets.length, 1);
assert.equal(stage10Backup.sheets[0].schemaVersion, undefined, 'O backup deve preservar a ficha anterior à migração.');
vm.runInContext('migrateCharacterSheetSchema()', integrationContext);
assert.equal(
    integrationStorage.getItem('dnd_character_sheets_backup_stage10_v11'),
    stage10BackupRaw,
    'O backup da Etapa 10 não deve ser sobrescrito em execuções posteriores.'
);

const integratedSheet = JSON.parse(integrationStorage.getItem('dnd_character_sheets'))[0];
assert.equal(integratedSheet.creationMode, 'quick');
assert.equal(integratedSheet.schemaVersion, 1);
assert.equal(integratedSheet.raceId, 'vampire');
assert.equal(integratedSheet.hpCurrent, 47);
assert.equal(integratedSheet.inventory[0].id, 'sangue');
assert.equal(integratedSheet.equipment.weapons[0], 'espada');
assert.equal(vm.runInContext('combatants[0].creationMode', integrationContext), 'quick');
assert.equal(vm.runInContext('combatants[0].raceId', integrationContext), 'vampire');

const savedFullSheet = JSON.parse(vm.runInContext(`JSON.stringify(createFullCharacterSheetFromDraft({
    name: 'Yennefer',
    level: 4,
    raceId: 'human',
    professionId: 'mage',
    specializationId: 'mage',
    attributes: { intelligence: { invested: 6 } },
    professionalSkills: { mage_treinamento_magico: { invested: 2 } },
    skills: { spellcasting: { invested: 4 }, perception: { invested: 2 } }
}))`, integrationContext));
const sheetsAfterFullSave = JSON.parse(integrationStorage.getItem('dnd_character_sheets'));

assert.equal(savedFullSheet.creationMode, 'full');
assert.equal(savedFullSheet.identity.level, 4);
assert.equal(savedFullSheet.identity.professionId, 'mage');
assert.equal(savedFullSheet.identity.specializationId, 'mage');
assert.equal(savedFullSheet.attributes.intelligence.invested, 6);
assert.equal(savedFullSheet.skills.spellcasting.invested, 4);
assert.equal(savedFullSheet.professionalSkills.mage_treinamento_magico.invested, 2);
assert.equal(savedFullSheet.progression.attributePointsSpent, 6);
assert.equal(savedFullSheet.progression.professionalSkillPointsSpent, 2);
assert.equal(savedFullSheet.progression.skillPointsSpent, 12);
assert.equal(savedFullSheet.attributes.charisma.raceBonus, 1);
assert.equal(savedFullSheet.skills.deduction.raceBonus, 1);
assert.equal(savedFullSheet.racialTraits.length, 3);
assert.equal(savedFullSheet.hpCurrent, savedFullSheet.hpMax);
assert.equal(savedFullSheet.stCurrent, savedFullSheet.stMax);
assert.ok(sheetsAfterFullSave.some(sheet => sheet.id === savedFullSheet.id));

const renderedSheetList = vm.runInContext(`
    (() => {
        const dialog = { classList: { remove() {} }, innerHTML: '' };
        renderCharacterSheetsView(dialog);
        return dialog.innerHTML;
    })()
`, integrationContext);
assert.match(renderedSheetList, /Humano · Mago/);
assert.match(renderedSheetList, /Completa · Nv\. 4/);
assert.match(renderedSheetList, /Regras v11/);
assert.match(renderedSheetList, /Movimento/);
assert.match(renderedSheetList, /Carga/);

vm.runInContext(`
    (() => {
        const sheet = characterSheets.find(entry => entry.id === ${JSON.stringify(savedFullSheet.id)});
        sheet.hpCurrent = 5;
        sheet.stCurrent = 3;
        sheet.professionalSkills.mage_sobrecarga_arcana = { invested: 2 };
        refreshCharacterDerivedValues(sheet);
    })()
`, integrationContext);
const recalculatedFullSheet = JSON.parse(vm.runInContext(
    `JSON.stringify(characterSheets.find(entry => entry.id === ${JSON.stringify(savedFullSheet.id)}))`,
    integrationContext
));
assert.equal(recalculatedFullSheet.hpCurrent, 5, 'Recalcular o máximo não deve curar HP atual.');
assert.equal(recalculatedFullSheet.stCurrent, 3, 'Recalcular o máximo não deve restaurar EST atual.');
assert.equal(recalculatedFullSheet.stMax > savedFullSheet.stMax, true);

const savedCountBeforeCombatOnly = sheetsAfterFullSave.length;
const combatOnly = JSON.parse(vm.runInContext(`JSON.stringify(addFullCharacterDraftToCombat({
    name: 'Ciri',
    level: 2,
    raceId: 'witcher',
    specializationId: 'wolf_school'
}))`, integrationContext));

assert.equal(combatOnly.characterPersistence, 'combat-only');
assert.equal(combatOnly.creationMode, 'full');
assert.equal(combatOnly.identity.professionId, 'witcher');
assert.equal(combatOnly.identity.specializationId, 'wolf_school');
assert.equal(combatOnly.skills.perception.raceBonus, 1);
assert.equal(combatOnly.racialTraits.length, 4);
vm.runInContext('syncCombatantsToCharacterSheets()', integrationContext);
assert.equal(
    JSON.parse(integrationStorage.getItem('dnd_character_sheets')).length,
    savedCountBeforeCombatOnly,
    'Uma ficha usada somente no combate não deve ser salva implicitamente.'
);

console.log('✓ Modelo, orçamentos, migração e persistência das fichas validados.');
