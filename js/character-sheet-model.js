(function initializeCharacterSheetModel(global) {
    'use strict';

    const CHARACTER_SHEET_SCHEMA_VERSION = 1;
    const CHARACTER_RULES_VERSION = 11;
    const CHARACTER_LEVEL_MINIMUM = 1;
    const CHARACTER_ATTRIBUTE_BASE_VALUE = 10;
    const CHARACTER_SKILL_INVESTMENT_CAP = 4;
    const CHARACTER_MOVEMENT_MINIMUM = 5;
    const CHARACTER_MOVEMENT_MAXIMUM = 15;

    const CHARACTER_CREATION_MODES = Object.freeze({
        QUICK: 'quick',
        FULL: 'full'
    });

    const CHARACTER_ATTRIBUTES = Object.freeze([
        Object.freeze({ id: 'strength', name: 'Força', abbreviation: 'FOR' }),
        Object.freeze({ id: 'intelligence', name: 'Inteligência', abbreviation: 'INT' }),
        Object.freeze({ id: 'dexterity', name: 'Destreza', abbreviation: 'DES' }),
        Object.freeze({ id: 'wisdom', name: 'Sabedoria', abbreviation: 'SAB' }),
        Object.freeze({ id: 'charisma', name: 'Carisma', abbreviation: 'CAR' }),
        Object.freeze({ id: 'constitution', name: 'Constituição', abbreviation: 'CON' })
    ]);

    const CHARACTER_SKILLS = Object.freeze([
        Object.freeze({ id: 'block', name: 'Bloquear', attributeId: 'strength', pointCost: 1 }),
        Object.freeze({ id: 'brawl', name: 'Brigar', attributeId: 'strength', pointCost: 1 }),
        Object.freeze({ id: 'staff_spear', name: 'Cajado/Lança', attributeId: 'strength', pointCost: 1 }),
        Object.freeze({ id: 'courage', name: 'Coragem', attributeId: 'strength', pointCost: 1 }),
        Object.freeze({ id: 'fencing', name: 'Esgrima', attributeId: 'strength', pointCost: 1 }),
        Object.freeze({ id: 'short_blades', name: 'Lâminas Curtas', attributeId: 'strength', pointCost: 1 }),
        Object.freeze({ id: 'resist_coercion', name: 'Resistir Coerção', attributeId: 'strength', pointCost: 1 }),

        Object.freeze({ id: 'history_geography', name: 'História e Geografia', attributeId: 'intelligence', pointCost: 1 }),
        Object.freeze({ id: 'investigation', name: 'Investigação', attributeId: 'intelligence', pointCost: 1 }),
        Object.freeze({ id: 'spellcasting', name: 'Lançar Feitiços', attributeId: 'intelligence', pointCost: 2 }),
        Object.freeze({ id: 'nature', name: 'Natureza', attributeId: 'intelligence', pointCost: 1 }),
        Object.freeze({ id: 'tactics', name: 'Táticas', attributeId: 'intelligence', pointCost: 2 }),

        Object.freeze({ id: 'lockpicking', name: 'Abrir Trancas', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'acrobatics', name: 'Acrobacias', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'athletics', name: 'Atletismo', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'archery', name: 'Arco e Flecha', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'stealth', name: 'Furtividade', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'two_handed', name: 'Habilidade com Duas Mãos', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'sleight_of_hand', name: 'Prestidigitação', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'reflex_dodge', name: 'Reflexo/Esquivas', attributeId: 'dexterity', pointCost: 1 }),
        Object.freeze({ id: 'riding', name: 'Cavalgar', attributeId: 'dexterity', pointCost: 1 }),

        Object.freeze({ id: 'business', name: 'Negócios', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'traps', name: 'Armadilhas', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'hunting', name: 'Caça', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'resist_magic', name: 'Resistir Magia', attributeId: 'wisdom', pointCost: 2 }),
        Object.freeze({ id: 'deduction', name: 'Dedução', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'education', name: 'Educação', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'nordic', name: 'Nórdico', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'elder_speech', name: 'Fala Ancestral', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'dwarven', name: 'Anão', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'monster_lore', name: 'Sabedoria sobre Monstros', attributeId: 'wisdom', pointCost: 2 }),
        Object.freeze({ id: 'nilfgaardian', name: 'Nilfgaardiano', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'social_etiquette', name: 'Etiqueta Social', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'streetwise', name: 'Sabedoria das Ruas', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'teaching', name: 'Ensinar', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'alchemy', name: 'Alquimia', attributeId: 'wisdom', pointCost: 2 }),
        Object.freeze({ id: 'perception', name: 'Percepção', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'crafting', name: 'Criar', attributeId: 'wisdom', pointCost: 2 }),
        Object.freeze({ id: 'disguise', name: 'Disfarce', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'first_aid', name: 'Primeiros Socorros', attributeId: 'wisdom', pointCost: 1 }),
        Object.freeze({ id: 'trap_crafting', name: 'Criar Armadilhas', attributeId: 'wisdom', pointCost: 2 }),
        Object.freeze({ id: 'survival', name: 'Sobrevivência', attributeId: 'wisdom', pointCost: 1 }),

        Object.freeze({ id: 'appearance_style', name: 'Aparência e Estilo', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'fine_arts', name: 'Belas Artes', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'leadership', name: 'Liderança', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'deceit', name: 'Ludibriar/Enganar', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'persuasion', name: 'Persuasão', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'human_perception', name: 'Percepção Humana', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'forgery', name: 'Falsificação', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'seduction', name: 'Sedução', attributeId: 'charisma', pointCost: 1 }),
        Object.freeze({ id: 'intimidation', name: 'Intimidação', attributeId: 'charisma', pointCost: 1 }),

        Object.freeze({ id: 'physique', name: 'Físico', attributeId: 'constitution', pointCost: 1 }),
        Object.freeze({ id: 'tolerance', name: 'Tolerância', attributeId: 'constitution', pointCost: 1 })
    ]);

    const CHARACTER_SKILL_DEFINITIONS = Object.freeze(Object.fromEntries(
        CHARACTER_SKILLS.map(skill => [skill.id, skill])
    ));

    const CHARACTER_RACES = Object.freeze([
        Object.freeze({
            id: 'human',
            name: 'Humano',
            monsterCategory: 'Humanoide',
            development: 'ready',
            summary: '+1 CAR, Sedução, Persuasão e Dedução',
            attributeBonuses: Object.freeze({ charisma: 1 }),
            skillBonuses: Object.freeze({ seduction: 1, persuasion: 1, deduction: 1 }),
            effects: Object.freeze({ blindStubbornRerollsPerSession: 3 }),
            traits: Object.freeze([
                Object.freeze({ id: 'trustworthy', name: 'Confiável', description: '+1 em Carisma, Sedução e Persuasão.' }),
                Object.freeze({ id: 'ingenuity', name: 'Ingenuidade', description: '+1 em Dedução.' }),
                Object.freeze({ id: 'blind_stubbornness', name: 'Teimoso Cegamente', description: 'Pode rerrolar uma falha de Resistir à Coerção ou Coragem até 3 vezes por sessão.' })
            ])
        }),
        Object.freeze({
            id: 'elf',
            name: 'Elfo',
            monsterCategory: 'Humanoide',
            development: 'ready',
            summary: '+2 em perícias élficas e +1 Sobrevivência',
            attributeBonuses: Object.freeze({}),
            skillBonuses: Object.freeze({ elder_speech: 2, traps: 2, hunting: 2, archery: 2, survival: 1 }),
            effects: Object.freeze({ quickBowReady: true, commonPlantForaging: true, animalsFriendly: true }),
            traits: Object.freeze([
                Object.freeze({ id: 'ancestral_training', name: 'Treinamento Ancestral', description: '+2 em Fala Ancestral, Armadilhas e Caça.' }),
                Object.freeze({ id: 'elite_archer', name: 'Atirador de Elite', description: '+2 em Arco e Flecha e pode sacar e armar um arco sem gastar uma ação.' }),
                Object.freeze({ id: 'natural_attunement', name: 'Sintonia Natural', description: 'Feras são amigáveis, encontra plantas comuns disponíveis e recebe +1 em Sobrevivência.' })
            ])
        }),
        Object.freeze({
            id: 'dwarf',
            name: 'Anão',
            monsterCategory: 'Humanoide',
            development: 'ready',
            summary: 'Absorção 2, +25 Carga e bônus artesanais',
            blockedProfessionIds: Object.freeze(['mage', 'cleric']),
            attributeBonuses: Object.freeze({}),
            skillBonuses: Object.freeze({ physique: 1, business: 2, crafting: 2 }),
            effects: Object.freeze({ naturalDamageReduction: 2, carryingCapacityBonus: 25 }),
            traits: Object.freeze([
                Object.freeze({ id: 'resistant', name: 'Resistente', description: 'Absorção natural 2, não reduzida por ataques de armas nem por ablação.' }),
                Object.freeze({ id: 'strong', name: 'Forte', description: '+1 em Físico e +25 de Capacidade de Carga.' }),
                Object.freeze({ id: 'artisan_eye', name: 'Olho de Artesão', description: '+2 em Negócios e Criar.' })
            ])
        }),
        Object.freeze({
            id: 'halfling',
            name: 'Ananico',
            monsterCategory: 'Humanoide',
            development: 'ready',
            summary: 'Ágil, rural e resistente à magia',
            blockedProfessionIds: Object.freeze(['mage', 'cleric']),
            attributeBonuses: Object.freeze({}),
            skillBonuses: Object.freeze({ athletics: 1, survival: 2, resist_magic: 5 }),
            effects: Object.freeze({ animalHandlingBonus: 2, canResistMentalMagic: true, magicalPotionsIneffective: true }),
            traits: Object.freeze([
                Object.freeze({ id: 'agile', name: 'Ágil', description: '+1 em Atletismo.' }),
                Object.freeze({ id: 'rural_worker', name: 'Trabalhador Rural', description: '+2 em Sobrevivência e +2 para acalmar, domar ou controlar animais.' }),
                Object.freeze({ id: 'magic_resistance', name: 'Resistência Mágica', description: '+5 em Resistir Magia; pode resistir a magia mental. Poções de Witcher e poções mágicas não funcionam.' })
            ])
        }),
        Object.freeze({
            id: 'witcher',
            name: 'Witcher',
            monsterCategory: 'Humanoide',
            development: 'ready',
            summary: 'Sentidos, mutações e reflexos aprimorados',
            attributeBonuses: Object.freeze({}),
            skillBonuses: Object.freeze({ perception: 1, human_perception: -4, reflex_dodge: 1 }),
            effects: Object.freeze({ noLowLightPenalty: true, scentTracking: true, diseaseImmune: true, canUseMutagens: true }),
            traits: Object.freeze([
                Object.freeze({ id: 'enhanced_senses', name: 'Sentidos Aprimorados', description: 'Sem penalidade em pouca luz, +1 em Percepção e rastreamento pelo cheiro.' }),
                Object.freeze({ id: 'muted_emotions', name: 'Emoções Atenuadas', description: 'Dispensa testes de Coragem contra intimidação e recebe −4 em Percepção Humana.' }),
                Object.freeze({ id: 'resilient_mutation', name: 'Mutação Resiliente', description: 'Imune a doenças, pode usar mutágenos e relaciona Treinamento Bruxo com Sabedoria sobre Monstros.' }),
                Object.freeze({ id: 'lightning_reflexes', name: 'Reflexos Relâmpago', description: '+1 permanente em Reflexo/Esquivas.' })
            ])
        }),
        Object.freeze({
            id: 'vampire',
            name: 'Vampiro',
            monsterCategory: 'Vampiro',
            development: 'in_progress',
            summary: 'Regras raciais ainda em revisão',
            attributeBonuses: Object.freeze({}),
            skillBonuses: Object.freeze({}),
            effects: Object.freeze({}),
            traits: Object.freeze([
                Object.freeze({ id: 'vampire_draft', name: 'Vampiro em desenvolvimento', description: 'As características existentes permanecem como referência e não geram bônus automáticos nesta versão.' })
            ])
        }),
        Object.freeze({
            id: 'werewolf',
            name: 'Lobisomem',
            monsterCategory: 'Amaldiçoado',
            development: 'in_progress',
            summary: 'Regras raciais ainda em construção',
            attributeBonuses: Object.freeze({}),
            skillBonuses: Object.freeze({}),
            effects: Object.freeze({}),
            traits: Object.freeze([
                Object.freeze({ id: 'werewolf_draft', name: 'Lobisomem em desenvolvimento', description: 'Nenhum bônus automático será aplicado até a conclusão das regras raciais.' })
            ])
        })
    ]);

    const CHARACTER_WITCHER_SCHOOLS = Object.freeze([
        Object.freeze({ id: 'wolf_school', name: 'Escola do Lobo' }),
        Object.freeze({ id: 'griffin_school', name: 'Escola do Grifo' }),
        Object.freeze({ id: 'viper_school', name: 'Escola da Víbora' }),
        Object.freeze({ id: 'manticore_school', name: 'Escola da Mantícora' }),
        Object.freeze({ id: 'bear_school', name: 'Escola do Urso' }),
        Object.freeze({ id: 'cat_school', name: 'Escola do Gato' }),
        Object.freeze({ id: 'raven_school', name: 'Escola do Corvo' }),
        Object.freeze({ id: 'lynx_school', name: 'Escola do Lince' })
    ]);

    const CHARACTER_PROFESSIONS = Object.freeze([
        Object.freeze({
            id: 'bard',
            name: 'Bardo',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'grey_roads_minstrel', name: 'Menestrel das Estradas Cinzentas' }),
                Object.freeze({ id: 'battlefield_herald', name: 'Arauto do Campo de Batalha' }),
                Object.freeze({ id: 'golden_court_tongue', name: 'Língua da Corte Dourada' })
            ])
        }),
        Object.freeze({
            id: 'artisan',
            name: 'Artesão',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'artisan', name: 'Artesão' })
            ])
        }),
        Object.freeze({
            id: 'criminal',
            name: 'Criminoso',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'professional_assassin', name: 'Assassino Profissional' }),
                Object.freeze({ id: 'professional_thief', name: 'Ladrão Profissional' }),
                Object.freeze({ id: 'brawler', name: 'Arruaceiro' }),
                Object.freeze({ id: 'duelist', name: 'Duelista' })
            ])
        }),
        Object.freeze({
            id: 'doctor',
            name: 'Doutor',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'doctor', name: 'Doutor' })
            ])
        }),
        Object.freeze({
            id: 'mage',
            name: 'Mago',
            magical: true,
            abilityProfessions: Object.freeze(['Mago', 'Ritual', 'Hex']),
            specializations: Object.freeze([
                Object.freeze({ id: 'mage', name: 'Mago' })
            ])
        }),
        Object.freeze({
            id: 'warrior',
            name: 'Guerreiro',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'man_at_arms', name: 'Homem de Armas' }),
                Object.freeze({ id: 'swordsman', name: 'Espadachim' }),
                Object.freeze({ id: 'archer', name: 'Arqueiro' }),
                Object.freeze({ id: 'vanguard', name: 'Vanguarda' })
            ])
        }),
        Object.freeze({
            id: 'merchant',
            name: 'Mercador',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'merchant', name: 'Mercador' })
            ])
        }),
        Object.freeze({
            id: 'cleric',
            name: 'Clérigo',
            magical: true,
            abilityProfessions: Object.freeze(['Sacerdote', 'Clérigo', 'Ritual', 'Hex']),
            specializations: Object.freeze([
                Object.freeze({ id: 'melitele', name: 'Melitele', abilityProfessions: Object.freeze(['Sacerdote', 'Clérigo', 'Ritual', 'Hex']) }),
                Object.freeze({ id: 'druid', name: 'Druida', abilityProfessions: Object.freeze(['Druida', 'Ritual', 'Hex']) }),
                Object.freeze({ id: 'freya', name: 'Freya', abilityProfessions: Object.freeze(['Sacerdote', 'Clérigo', 'Ritual', 'Hex']) }),
                Object.freeze({ id: 'eternal_fire', name: 'Fogo Eterno', abilityProfessions: Object.freeze(['Sacerdote', 'Clérigo', 'Ritual', 'Hex']) })
            ])
        }),
        Object.freeze({
            id: 'noble',
            name: 'Nobre',
            magical: false,
            specializations: Object.freeze([
                Object.freeze({ id: 'noble', name: 'Nobre' })
            ])
        })
    ]);
    const CHARACTER_PROFESSIONAL_SKILL_TREES = global.characterProfessionalSkillsData?.trees
        || Object.freeze({});
    const CHARACTER_PROFESSIONAL_SKILLS = global.characterProfessionalSkillsData?.skills
        || Object.freeze([]);
    const CHARACTER_PROFESSIONAL_SKILL_DEFINITIONS = Object.freeze(Object.fromEntries(
        CHARACTER_PROFESSIONAL_SKILLS.map(skill => [skill.id, skill])
    ));

    const RACE_ALIASES = Object.freeze({
        human: 'human',
        humano: 'human',
        elf: 'elf',
        elfo: 'elf',
        dwarf: 'dwarf',
        anao: 'dwarf',
        halfling: 'halfling',
        ananico: 'halfling',
        witcher: 'witcher',
        bruxo: 'witcher',
        vampire: 'vampire',
        vampiro: 'vampire',
        werewolf: 'werewolf',
        lobisomem: 'werewolf',
        lobisomen: 'werewolf'
    });

    const PROFESSION_ALIASES = Object.freeze({
        bard: 'bard',
        bardo: 'bard',
        artisan: 'artisan',
        artesao: 'artisan',
        criminal: 'criminal',
        criminoso: 'criminal',
        arruaceiro: 'criminal',
        doctor: 'doctor',
        doutor: 'doctor',
        mage: 'mage',
        mago: 'mage',
        warrior: 'warrior',
        guerreiro: 'warrior',
        homem_de_armas: 'warrior',
        merchant: 'merchant',
        mercador: 'merchant',
        cleric: 'cleric',
        clerigo: 'cleric',
        sacerdote: 'cleric',
        noble: 'noble',
        nobre: 'noble',
        witcher: 'witcher',
        bruxo: 'witcher'
    });

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneCharacterValue(value, fallback) {
        try {
            return JSON.parse(JSON.stringify(value ?? fallback));
        } catch {
            return JSON.parse(JSON.stringify(fallback));
        }
    }

    function normalizeCharacterIdentifier(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_|_$)/g, '');
    }

    function normalizeCharacterLevel(value) {
        const numeric = Number(value);

        if (!Number.isFinite(numeric)) return CHARACTER_LEVEL_MINIMUM;
        return Math.max(CHARACTER_LEVEL_MINIMUM, Math.floor(numeric));
    }

    function getCharacterAttributePointBudget(level) {
        return 12 + (normalizeCharacterLevel(level) - 1);
    }

    function getCharacterSkillPointBudget(level) {
        return 60 + (4 * (normalizeCharacterLevel(level) - 1));
    }

    function getCharacterTrainingPointBudget(level) {
        return 10 + (5 * normalizeCharacterLevel(level));
    }

    function getCharacterBudgets(level) {
        const normalizedLevel = normalizeCharacterLevel(level);

        return {
            level: normalizedLevel,
            attributePoints: getCharacterAttributePointBudget(normalizedLevel),
            skillPoints: getCharacterSkillPointBudget(normalizedLevel),
            trainingPoints: getCharacterTrainingPointBudget(normalizedLevel)
        };
    }

    function getCharacterAttributeDefinition(attributeId) {
        const normalizedId = normalizeCharacterIdentifier(attributeId);
        return CHARACTER_ATTRIBUTES.find(attribute => attribute.id === normalizedId) || null;
    }

    function getCharacterSkillDefinition(skillId) {
        const normalizedId = normalizeCharacterIdentifier(skillId);
        return CHARACTER_SKILL_DEFINITIONS[normalizedId] || null;
    }

    function getCharacterSkillsByAttribute(attributeId) {
        const normalizedId = normalizeCharacterIdentifier(attributeId);
        return CHARACTER_SKILLS.filter(skill => skill.attributeId === normalizedId);
    }

    function normalizeCharacterAttributeInvestment(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return Math.max(0, Math.floor(numeric));
    }

    function normalizeCharacterAdjustment(value) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
    }

    function normalizeCharacterInvestmentRecord(value, normalizeInvestment) {
        const source = isPlainObject(value) ? cloneCharacterValue(value, {}) : { invested: value };

        return {
            ...source,
            invested: normalizeInvestment(source.invested),
            manualAdjustment: normalizeCharacterAdjustment(source.manualAdjustment)
        };
    }

    function normalizeCharacterAttributeAllocations(investments) {
        const source = isPlainObject(investments) ? investments : {};

        return Object.fromEntries(CHARACTER_ATTRIBUTES.map(attribute => [
            attribute.id,
            normalizeCharacterInvestmentRecord(
                source[attribute.id],
                normalizeCharacterAttributeInvestment
            )
        ]));
    }

    function normalizeCharacterSkillAllocations(investments) {
        const source = isPlainObject(investments) ? investments : {};

        return Object.fromEntries(CHARACTER_SKILLS.map(skill => [
            skill.id,
            normalizeCharacterInvestmentRecord(source[skill.id], normalizeSkillInvestment)
        ]));
    }

    function getCharacterProfessionalSkills(specializationId) {
        const normalizedId = normalizeCharacterIdentifier(specializationId);
        return CHARACTER_PROFESSIONAL_SKILL_TREES[normalizedId] || Object.freeze([]);
    }

    function getCharacterProfessionalSkillDefinition(skillId) {
        return CHARACTER_PROFESSIONAL_SKILL_DEFINITIONS[normalizeCharacterIdentifier(skillId)] || null;
    }

    function normalizeCharacterProfessionalSkillAllocations(investments, specializationId) {
        const source = isPlainObject(investments) ? investments : {};

        return Object.fromEntries(getCharacterProfessionalSkills(specializationId).map(skill => [
            skill.id,
            normalizeCharacterInvestmentRecord(source[skill.id], normalizeSkillInvestment)
        ]));
    }

    function calculateCharacterProfessionalSkillPointsSpent(investments, specializationId) {
        const normalized = normalizeCharacterProfessionalSkillAllocations(investments, specializationId);

        return getCharacterProfessionalSkills(specializationId).reduce((total, skill) => (
            total + ((normalized[skill.id]?.invested || 0) * (skill.pointCost || 1))
        ), 0);
    }

    function applyCharacterProfessionalSkillBonuses(specializationId, professionalSkills, skills) {
        const normalizedSkills = normalizeCharacterSkillAllocations(skills);
        const normalizedProfessionalSkills = normalizeCharacterProfessionalSkillAllocations(
            professionalSkills,
            specializationId
        );

        CHARACTER_SKILLS.forEach(skill => {
            normalizedSkills[skill.id].professionBonus = 0;
        });
        getCharacterProfessionalSkills(specializationId).forEach(professionalSkill => {
            const invested = normalizedProfessionalSkills[professionalSkill.id]?.invested || 0;
            if (invested <= 0) return;

            (professionalSkill.generalSkillBonuses || []).forEach(skillId => {
                if (!normalizedSkills[skillId]) return;
                normalizedSkills[skillId].professionBonus += invested;
            });
        });

        return normalizedSkills;
    }

    function calculateCharacterAttributePointsSpent(investments) {
        const normalized = normalizeCharacterAttributeAllocations(investments);
        return Object.values(normalized).reduce((total, entry) => total + entry.invested, 0);
    }

    function sumCharacterBonusLayers(record, { includeAttributeModifier = true } = {}) {
        if (!isPlainObject(record)) return 0;

        return [
            ...(includeAttributeModifier ? ['attributeModifier'] : []),
            'raceBonus',
            'professionBonus',
            'specializationBonus',
            'equipmentBonus',
            'temporaryBonus',
            'manualAdjustment'
        ].reduce((total, field) => total + normalizeCharacterAdjustment(record[field]), 0);
    }

    function getCharacterAttributeTotal(attributeId, investments) {
        const definition = getCharacterAttributeDefinition(attributeId);
        if (!definition) return null;

        const record = normalizeCharacterInvestmentRecord(
            investments?.[definition.id],
            normalizeCharacterAttributeInvestment
        );
        return CHARACTER_ATTRIBUTE_BASE_VALUE + record.invested + sumCharacterBonusLayers(record);
    }

    function getCharacterAttributeModifier(attributeId, investments) {
        const total = getCharacterAttributeTotal(attributeId, investments);
        if (total === null) return null;

        return Math.floor(Math.max(0, total - CHARACTER_ATTRIBUTE_BASE_VALUE) / 2);
    }

    function getCharacterSkillBreakdown(skillId, investments, attributeInvestments) {
        const definition = getCharacterSkillDefinition(skillId);
        if (!definition) return null;

        const record = normalizeCharacterInvestmentRecord(
            investments?.[definition.id],
            normalizeSkillInvestment
        );
        const attributeModifier = attributeInvestments === undefined
            ? normalizeCharacterAdjustment(record.attributeModifier)
            : getCharacterAttributeModifier(definition.attributeId, attributeInvestments);
        const bonuses = {
            attributeModifier: attributeModifier || 0,
            raceBonus: normalizeCharacterAdjustment(record.raceBonus),
            professionBonus: normalizeCharacterAdjustment(record.professionBonus),
            specializationBonus: normalizeCharacterAdjustment(record.specializationBonus),
            equipmentBonus: normalizeCharacterAdjustment(record.equipmentBonus),
            temporaryBonus: normalizeCharacterAdjustment(record.temporaryBonus),
            manualAdjustment: normalizeCharacterAdjustment(record.manualAdjustment)
        };
        const bonusTotal = Object.values(bonuses).reduce((total, bonus) => total + bonus, 0);

        return {
            skillId: definition.id,
            attributeId: definition.attributeId,
            invested: record.invested,
            ...bonuses,
            bonusTotal,
            total: record.invested + bonusTotal
        };
    }

    function getCharacterSkillTotal(skillId, investments, attributeInvestments) {
        const breakdown = getCharacterSkillBreakdown(skillId, investments, attributeInvestments);

        return breakdown?.total ?? null;
    }

    function getCharacterProfessionalSkillTotal(skillId, investments) {
        return getCharacterProfessionalSkillBreakdown(skillId, investments)?.total ?? 0;
    }

    function calculateCharacterDerivedValues(value = {}, options = {}) {
        const source = isPlainObject(value) ? value : {};
        const identity = isPlainObject(source.identity) ? source.identity : source;
        const level = normalizeCharacterLevel(identity.level ?? source.level);
        const raceId = normalizeCharacterRaceId(identity.raceId ?? source.raceId);
        const professionId = raceId === 'witcher'
            ? 'witcher'
            : normalizeCharacterProfessionId(identity.professionId ?? source.professionId);
        const specializationId = normalizeCharacterIdentifier(
            identity.specializationId ?? source.specializationId
        );
        const attributes = source.attributes || {};
        const skills = source.skills || {};
        const professionalSkills = source.professionalSkills || {};
        const constitutionBonus = getCharacterAttributeModifier('constitution', attributes) || 0;
        const strengthBonus = getCharacterAttributeModifier('strength', attributes) || 0;
        const intelligenceBonus = getCharacterAttributeModifier('intelligence', attributes) || 0;
        const strengthTotal = getCharacterAttributeTotal('strength', attributes)
            ?? CHARACTER_ATTRIBUTE_BASE_VALUE;
        const constitutionInvested = normalizeCharacterAttributeInvestment(
            attributes?.constitution?.invested ?? attributes?.constitution
        );
        const constitutionBase = CHARACTER_ATTRIBUTE_BASE_VALUE + constitutionInvested;
        const physiqueTotal = getCharacterSkillTotal('physique', skills, attributes) || 0;
        const spellcastingTotal = getCharacterSkillTotal('spellcasting', skills, attributes) || 0;
        const athleticsTotal = getCharacterSkillTotal('athletics', skills, attributes) || 0;
        const professionalTotal = skillId => getCharacterProfessionalSkillTotal(
            skillId,
            professionalSkills
        );
        const equippedWeight = Math.max(0, Number(options.equippedWeight ?? source.equippedWeight) || 0);
        const racialCarryBonus = Number(
            source.raceEffects?.carryingCapacityBonus
            ?? getCharacterRaceEffects(raceId)?.carryingCapacityBonus
        ) || 0;

        const hpMaximum = Math.max(1, Math.floor(
            ((constitutionBonus + physiqueTotal) * level)
            + 10
            + constitutionBase
        ));

        let stFormula = 'physical';
        let stClassBonus = 0;
        let runeSourceMaximum = 0;
        let stMaximum = 0;
        let expandedMagic = 0;

        if (professionId === 'witcher') {
            stFormula = 'witcher';
            if (specializationId === 'wolf_school') {
                stClassBonus = professionalTotal('wolf_school_fonte_magica') * 2;
            }
            if (specializationId === 'griffin_school') {
                runeSourceMaximum = professionalTotal('griffin_school_fonte_runica') * 2;
            }
            stMaximum = constitutionBonus
                + physiqueTotal
                + spellcastingTotal
                + intelligenceBonus
                + stClassBonus;
        } else if (professionId === 'mage') {
            stFormula = 'mage';
            stClassBonus = professionalTotal('mage_sobrecarga_arcana') * 10;
            expandedMagic = professionalTotal('mage_magia_expandida');
            stMaximum = constitutionBonus
                + physiqueTotal
                + spellcastingTotal
                + (level * 2)
                + stClassBonus;
        } else if (professionId === 'cleric') {
            stFormula = specializationId === 'druid' ? 'druid' : 'cleric';
            stMaximum = constitutionBonus
                + physiqueTotal
                + spellcastingTotal
                + (level * 2);
        } else {
            // Guerreiro, Criminoso e caminhos não mágicos usam a reserva física.
            stMaximum = constitutionBonus
                + physiqueTotal
                + level
                + athleticsTotal
                + 10;
        }

        stMaximum = Math.max(0, Math.floor(stMaximum));
        const carryingCapacity = Math.max(0, Math.round((
            (strengthTotal / 2)
            + physiqueTotal
            + strengthBonus
            + racialCarryBonus
        ) * 10) / 10);
        const movementBeforeWeight = (athleticsTotal * 2)
            + 4
            + physiqueTotal
            + strengthBonus;
        const movementWeightPenalty = equippedWeight;
        const movementBeforeLimits = movementBeforeWeight - movementWeightPenalty;
        const movement = Math.min(
            CHARACTER_MOVEMENT_MAXIMUM,
            Math.max(CHARACTER_MOVEMENT_MINIMUM, Math.floor(movementBeforeLimits))
        );
        const excessWeight = Math.max(
            0,
            Math.round((equippedWeight - carryingCapacity) * 100) / 100
        );
        const isEncumbered = excessWeight > 0;

        return {
            level,
            hpMaximum,
            stMaximum,
            runeSourceMaximum,
            expandedMagic,
            carryingCapacity,
            movement,
            equippedWeight,
            excessWeight,
            isEncumbered,
            stFormula,
            breakdown: {
                constitutionBonus,
                constitutionInvested,
                constitutionBase,
                strengthTotal,
                strengthBonus,
                intelligenceBonus,
                physiqueTotal,
                spellcastingTotal,
                athleticsTotal,
                stClassBonus,
                racialCarryBonus,
                movementBeforeWeight,
                movementWeightPenalty,
                movementBeforeLimits
            }
        };
    }

    function getCharacterAllocationSummary(level, attributes, skills, options = {}) {
        const budgets = getCharacterBudgets(level);
        const attributePointsSpent = calculateCharacterAttributePointsSpent(attributes);
        const commonSkillPointsSpent = calculateCharacterSkillPointsSpent(
            skills,
            CHARACTER_SKILL_DEFINITIONS
        );
        const professionalSkillPointsSpent = isPlainObject(options.professionalSkills)
            ? calculateCharacterProfessionalSkillPointsSpent(
                options.professionalSkills,
                options.specializationId
            )
            : Math.max(0, Math.floor(Number(options.professionalSkillPointsSpent) || 0));
        const skillPointsSpent = commonSkillPointsSpent + professionalSkillPointsSpent;

        return {
            ...budgets,
            attributePointsSpent,
            attributePointsRemaining: budgets.attributePoints - attributePointsSpent,
            commonSkillPointsSpent,
            professionalSkillPointsSpent,
            skillPointsSpent,
            skillPointsRemaining: budgets.skillPoints - skillPointsSpent
        };
    }

    function getCharacterNaturalRollResult(naturalRoll, options = {}) {
        const numericRoll = Number(naturalRoll);
        const validRoll = Number.isInteger(numericRoll) && numericRoll >= 1 && numericRoll <= 20;
        const isCritical = validRoll && numericRoll === 20;
        const inCombat = options?.inCombat === true;

        return {
            naturalRoll: validRoll ? numericRoll : null,
            classification: isCritical ? 'critical' : (validRoll ? 'normal' : 'invalid'),
            label: isCritical ? 'Crítico' : (validRoll ? 'Resultado normal' : 'Rolagem inválida'),
            luckDiceGained: isCritical ? 1 : 0,
            adrenalineGained: isCritical && inCombat ? 1 : 0
        };
    }

    function resolveCharacterSkillTest(options = {}) {
        const naturalResult = getCharacterNaturalRollResult(options.naturalRoll, {
            inCombat: options.inCombat === true
        });
        const skillTotal = Number(options.skillTotal);
        const modifier = Number(options.modifier ?? 0);
        const target = Number(options.target);

        if (naturalResult.classification === 'invalid') {
            return { valid: false, reason: 'invalid-roll', ...naturalResult };
        }

        if (!Number.isFinite(skillTotal) || !Number.isFinite(modifier)) {
            return { valid: false, reason: 'invalid-bonus', ...naturalResult };
        }

        if (!Number.isFinite(target)) {
            return { valid: false, reason: 'invalid-target', ...naturalResult };
        }

        const finalResult = naturalResult.naturalRoll + skillTotal + modifier;

        return {
            valid: true,
            ...naturalResult,
            skillTotal,
            modifier,
            target,
            finalResult,
            success: finalResult >= target,
            margin: finalResult - target
        };
    }

    function getCharacterSkillPointCost(skill) {
        if (!skill) return 1;

        const explicitCost = Number(skill.pointCost ?? skill.costMultiplier ?? skill.weight);
        if (Number.isFinite(explicitCost) && explicitCost > 0) return Math.max(1, Math.floor(explicitCost));

        return /\(\s*2\s*\)/.test(String(skill.name || skill.label || '')) ? 2 : 1;
    }

    function normalizeSkillInvestment(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return Math.min(CHARACTER_SKILL_INVESTMENT_CAP, Math.max(0, Math.floor(numeric)));
    }

    function calculateCharacterSkillPointsSpent(investments, skillDefinitions = {}) {
        if (!isPlainObject(investments)) return 0;

        return Object.entries(investments).reduce((total, [skillId, rawInvestment]) => {
            const investment = isPlainObject(rawInvestment)
                ? normalizeSkillInvestment(rawInvestment.invested)
                : normalizeSkillInvestment(rawInvestment);
            const definition = isPlainObject(skillDefinitions)
                ? skillDefinitions[skillId]
                : null;

            return total + (investment * getCharacterSkillPointCost(definition));
        }, 0);
    }

    function normalizeCharacterRaceId(value) {
        const normalized = normalizeCharacterIdentifier(value);
        return RACE_ALIASES[normalized] || '';
    }

    function getCharacterRaceDefinition(value) {
        const raceId = normalizeCharacterRaceId(value);
        return CHARACTER_RACES.find(race => race.id === raceId) || null;
    }

    function getDefaultMonsterCategoryForRace(value) {
        return getCharacterRaceDefinition(value)?.monsterCategory || '';
    }

    function getCharacterRaceTraits(value) {
        return cloneCharacterValue(getCharacterRaceDefinition(value)?.traits, []);
    }

    function getCharacterRaceEffects(value) {
        return cloneCharacterValue(getCharacterRaceDefinition(value)?.effects, {});
    }

    function applyCharacterRaceBonuses(raceId, attributes, skills) {
        const race = getCharacterRaceDefinition(raceId);
        const normalizedAttributes = normalizeCharacterAttributeAllocations(attributes);
        const normalizedSkills = normalizeCharacterSkillAllocations(skills);

        CHARACTER_ATTRIBUTES.forEach(attribute => {
            normalizedAttributes[attribute.id].raceBonus = normalizeCharacterAdjustment(
                race?.attributeBonuses?.[attribute.id]
            );
        });
        CHARACTER_SKILLS.forEach(skill => {
            normalizedSkills[skill.id].raceBonus = normalizeCharacterAdjustment(
                race?.skillBonuses?.[skill.id]
            );
        });

        return {
            attributes: normalizedAttributes,
            skills: normalizedSkills,
            traits: getCharacterRaceTraits(raceId),
            effects: getCharacterRaceEffects(raceId)
        };
    }

    function normalizeCharacterProfessionId(value) {
        const normalized = normalizeCharacterIdentifier(value);
        return PROFESSION_ALIASES[normalized] || '';
    }

    function getCharacterProfessionDefinition(value) {
        const professionId = normalizeCharacterProfessionId(value);
        return CHARACTER_PROFESSIONS.find(profession => profession.id === professionId) || null;
    }

    function isCharacterProfessionAvailableForRace(professionId, raceId) {
        const normalizedRaceId = normalizeCharacterRaceId(raceId);
        const normalizedProfessionId = normalizeCharacterProfessionId(professionId);

        if (!getCharacterProfessionDefinition(normalizedProfessionId)) return false;
        if (!normalizedRaceId) return true;
        if (normalizedRaceId === 'witcher') return false;

        const blocked = getCharacterRaceDefinition(normalizedRaceId)?.blockedProfessionIds || [];
        return !blocked.includes(normalizedProfessionId);
    }

    function getAvailableCharacterProfessions(raceId) {
        return CHARACTER_PROFESSIONS.filter(profession => (
            isCharacterProfessionAvailableForRace(profession.id, raceId)
        ));
    }

    function getCharacterSpecializations(professionId, raceId = '') {
        if (normalizeCharacterRaceId(raceId) === 'witcher') return CHARACTER_WITCHER_SCHOOLS;
        return getCharacterProfessionDefinition(professionId)?.specializations || Object.freeze([]);
    }

    function getCharacterSpecializationDefinition(professionId, specializationId, raceId = '') {
        const normalizedId = normalizeCharacterIdentifier(specializationId);
        return getCharacterSpecializations(professionId, raceId)
            .find(specialization => (
                specialization.id === normalizedId
                || normalizeCharacterIdentifier(specialization.name) === normalizedId
            )) || null;
    }

    function normalizeCharacterAbilityProfession(value) {
        return normalizeCharacterIdentifier(value);
    }

    function getCharacterAbilityCatalog(catalog = global.predefinedAbilities) {
        const source = Array.isArray(catalog) ? catalog : [];
        const seen = new Set();

        return source.filter(ability => {
            const id = String(ability?.id || '').trim();
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }

    function getCharacterAbilityAccessProfile(value = {}) {
        const source = isPlainObject(value?.identity) ? value.identity : value;
        const raceId = normalizeCharacterRaceId(source?.raceId ?? value?.raceId);
        const professionId = raceId === 'witcher'
            ? 'witcher'
            : normalizeCharacterProfessionId(source?.professionId ?? value?.professionId);
        const specializationId = normalizeCharacterIdentifier(
            source?.specializationId ?? value?.specializationId
        );

        if (raceId === 'witcher' || professionId === 'witcher') {
            return {
                raceId,
                professionId: 'witcher',
                specializationId,
                isMagical: true,
                automaticProfessions: ['bruxo'],
                learnableProfessions: []
            };
        }

        const profession = getCharacterProfessionDefinition(professionId);
        const specialization = getCharacterSpecializationDefinition(
            professionId,
            specializationId,
            raceId
        );
        const abilityProfessions = specialization?.abilityProfessions
            || profession?.abilityProfessions
            || [];

        if (profession?.magical && abilityProfessions.length) {
            return {
                raceId,
                professionId,
                specializationId,
                isMagical: true,
                automaticProfessions: [],
                learnableProfessions: abilityProfessions.map(normalizeCharacterAbilityProfession)
            };
        }

        return {
            raceId,
            professionId,
            specializationId,
            isMagical: false,
            automaticProfessions: [],
            learnableProfessions: []
        };
    }

    function getCharacterAbilityLearningOptions(value, catalog = global.predefinedAbilities) {
        const access = getCharacterAbilityAccessProfile(value);
        const automatic = new Set(access.automaticProfessions);
        const learnable = new Set(access.learnableProfessions);

        return getCharacterAbilityCatalog(catalog)
            .map(ability => {
                const professionId = normalizeCharacterAbilityProfession(ability.profession);
                if (professionId === 'regras') return null;

                const isAutomatic = automatic.has(professionId);
                const isLearnable = learnable.has(professionId);
                if (!isAutomatic && !isLearnable) return null;

                return {
                    ...ability,
                    unlockCost: Math.max(0, Math.floor(Number(ability.unlockCost) || 0)),
                    accessMode: isAutomatic ? 'automatic' : 'learnable'
                };
            })
            .filter(Boolean);
    }

    function getCharacterAutomaticAbilityIds(value, catalog = global.predefinedAbilities) {
        return getCharacterAbilityLearningOptions(value, catalog)
            .filter(ability => ability.accessMode === 'automatic')
            .map(ability => ability.id);
    }

    function normalizeCharacterLearnedAbilityIds(
        abilityIds,
        value,
        catalog = global.predefinedAbilities
    ) {
        const requestedIds = new Set((Array.isArray(abilityIds) ? abilityIds : [])
            .map(entry => String(isPlainObject(entry) ? entry.id : entry || '').trim())
            .filter(Boolean));

        return getCharacterAbilityLearningOptions(value, catalog)
            .filter(ability => ability.accessMode === 'learnable' && requestedIds.has(ability.id))
            .map(ability => ability.id);
    }

    function calculateCharacterTrainingPointsSpent(
        abilityIds,
        value,
        catalog = global.predefinedAbilities
    ) {
        const learnedIds = new Set(normalizeCharacterLearnedAbilityIds(abilityIds, value, catalog));

        return getCharacterAbilityLearningOptions(value, catalog).reduce((total, ability) => (
            ability.accessMode === 'learnable' && learnedIds.has(ability.id)
                ? total + ability.unlockCost
                : total
        ), 0);
    }

    function getCharacterTrainingSummary(
        level,
        abilityIds,
        value,
        catalog = global.predefinedAbilities
    ) {
        const trainingPoints = getCharacterTrainingPointBudget(level);
        const learnedAbilityIds = normalizeCharacterLearnedAbilityIds(abilityIds, value, catalog);
        const trainingPointsSpent = calculateCharacterTrainingPointsSpent(
            learnedAbilityIds,
            value,
            catalog
        );

        return {
            trainingPoints,
            trainingPointsSpent,
            trainingPointsRemaining: trainingPoints - trainingPointsSpent,
            learnedAbilityIds,
            learnedCount: learnedAbilityIds.length,
            automaticAbilityIds: getCharacterAutomaticAbilityIds(value, catalog)
        };
    }

    function buildCharacterAbilities(
        abilityIds,
        value,
        catalog = global.predefinedAbilities
    ) {
        const learnedIds = normalizeCharacterLearnedAbilityIds(abilityIds, value, catalog);
        const includedIds = new Set([
            ...getCharacterAutomaticAbilityIds(value, catalog),
            ...learnedIds
        ]);

        return getCharacterAbilityCatalog(catalog)
            .filter(ability => includedIds.has(ability.id))
            .map(ability => cloneCharacterValue(ability, {}));
    }

    function getCharacterProfessionalSkillBreakdown(
        skillId,
        investments,
        _attributeInvestments
    ) {
        const definition = getCharacterProfessionalSkillDefinition(skillId);
        if (!definition) return null;

        const record = normalizeCharacterInvestmentRecord(
            investments?.[definition.id],
            normalizeSkillInvestment
        );
        const bonuses = {
            attributeModifier: 0,
            raceBonus: normalizeCharacterAdjustment(record.raceBonus),
            professionBonus: normalizeCharacterAdjustment(record.professionBonus),
            specializationBonus: normalizeCharacterAdjustment(record.specializationBonus),
            equipmentBonus: normalizeCharacterAdjustment(record.equipmentBonus),
            temporaryBonus: normalizeCharacterAdjustment(record.temporaryBonus),
            manualAdjustment: normalizeCharacterAdjustment(record.manualAdjustment)
        };
        const bonusTotal = Object.values(bonuses).reduce((total, bonus) => total + bonus, 0);

        return {
            skillId: definition.id,
            attributeId: definition.attributeId,
            invested: record.invested,
            ...bonuses,
            bonusTotal,
            total: record.invested + bonusTotal
        };
    }

    function inferLegacyCharacterRaceId(source) {
        if (!isPlainObject(source)) return '';

        const explicitRace = normalizeCharacterRaceId(
            source.raceId
            || source.identity?.raceId
            || source.race
            || source.raceName
        );

        if (explicitRace) return explicitRace;
        return String(source.monsterCategory || '').trim() === 'Vampiro' ? 'vampire' : '';
    }

    function normalizeCreationMode(value) {
        return value === CHARACTER_CREATION_MODES.FULL
            ? CHARACTER_CREATION_MODES.FULL
            : CHARACTER_CREATION_MODES.QUICK;
    }

    function createFullCharacterFoundation(options = {}) {
        const source = isPlainObject(options) ? options : {};
        const level = normalizeCharacterLevel(source.level ?? source.identity?.level);
        const raceId = normalizeCharacterRaceId(source.raceId ?? source.identity?.raceId);
        const identity = isPlainObject(source.identity) ? cloneCharacterValue(source.identity, {}) : {};
        const progression = isPlainObject(source.progression)
            ? cloneCharacterValue(source.progression, {})
            : {};
        const requestedProfessionId = normalizeCharacterProfessionId(
            identity.professionId ?? source.professionId
        );
        const professionId = raceId === 'witcher'
            ? 'witcher'
            : (isCharacterProfessionAvailableForRace(requestedProfessionId, raceId)
                ? requestedProfessionId
                : '');
        const specialization = getCharacterSpecializationDefinition(
            professionId,
            identity.specializationId ?? source.specializationId,
            raceId
        );
        const racialFoundation = applyCharacterRaceBonuses(
            raceId,
            source.attributes,
            source.skills
        );
        const attributes = racialFoundation.attributes;
        const professionalSkills = normalizeCharacterProfessionalSkillAllocations(
            source.professionalSkills,
            specialization?.id
        );
        const skills = applyCharacterProfessionalSkillBonuses(
            specialization?.id,
            professionalSkills,
            racialFoundation.skills
        );
        const commonSkillPointsSpent = calculateCharacterSkillPointsSpent(
            skills,
            CHARACTER_SKILL_DEFINITIONS
        );
        const hasProfessionalAllocations = Object.values(professionalSkills)
            .some(record => Number(record?.invested) > 0);
        const previousSkillPointsSpent = Math.max(0, Number(progression.skillPointsSpent) || 0);
        const professionalSkillPointsSpent = hasProfessionalAllocations
            ? calculateCharacterProfessionalSkillPointsSpent(professionalSkills, specialization?.id)
            : Math.max(
                0,
                Number(progression.professionalSkillPointsSpent)
                || (previousSkillPointsSpent - commonSkillPointsSpent)
                || 0
            );
        const abilityContext = {
            raceId,
            professionId,
            specializationId: specialization?.id || ''
        };
        const abilityCatalog = getCharacterAbilityCatalog();
        const requestedAbilityIds = Array.isArray(source.learnedAbilityIds)
            ? source.learnedAbilityIds
            : cloneCharacterValue(source.abilities, []);
        const learnedAbilityIds = normalizeCharacterLearnedAbilityIds(
            requestedAbilityIds,
            abilityContext,
            abilityCatalog
        );
        const officialAbilities = buildCharacterAbilities(
            learnedAbilityIds,
            abilityContext,
            abilityCatalog
        );
        const existingAbilities = cloneCharacterValue(source.abilities, []);
        const existingAbilitiesById = new Map(existingAbilities.map(ability => [ability?.id, ability]));
        const refreshedOfficialAbilities = officialAbilities.map(ability => {
            const existingAbility = existingAbilitiesById.get(ability.id);
            return existingAbility && Object.prototype.hasOwnProperty.call(existingAbility, 'active')
                ? { ...ability, active: existingAbility.active }
                : ability;
        });
        const officialAbilityIds = new Set(refreshedOfficialAbilities.map(ability => ability.id));
        const preservedAbilities = existingAbilities
            .filter(ability => ability?.id && !officialAbilityIds.has(ability.id));
        const abilities = [...refreshedOfficialAbilities, ...preservedAbilities];
        const calculatedTrainingPointsSpent = calculateCharacterTrainingPointsSpent(
            learnedAbilityIds,
            abilityContext,
            abilityCatalog
        );

        return {
            schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
            rulesVersion: CHARACTER_RULES_VERSION,
            creationMode: CHARACTER_CREATION_MODES.FULL,
            raceId,
            identity: {
                ...identity,
                name: String(identity.name ?? source.name ?? '').trim(),
                level,
                raceId,
                professionId,
                specializationId: specialization?.id || ''
            },
            attributes,
            skills,
            professionalSkills,
            learnedAbilityIds,
            abilities,
            progression: {
                ...progression,
                attributePointsSpent: calculateCharacterAttributePointsSpent(attributes),
                commonSkillPointsSpent,
                professionalSkillPointsSpent,
                skillPointsSpent: commonSkillPointsSpent + professionalSkillPointsSpent,
                trainingPointsSpent: abilityCatalog.length
                    ? calculatedTrainingPointsSpent
                    : Math.max(0, Number(source.progression?.trainingPointsSpent) || 0),
                luckDice: Math.max(0, Number(progression.luckDice) || 0),
                adrenaline: Math.max(0, Number(progression.adrenaline) || 0)
            },
            traits: cloneCharacterValue(source.traits, []),
            racialTraits: racialFoundation.traits,
            raceEffects: racialFoundation.effects,
            automationState: cloneCharacterValue(source.automationState, {})
        };
    }

    function normalizeCharacterSheet(source) {
        const original = isPlainObject(source) ? cloneCharacterValue(source, {}) : {};
        const creationMode = normalizeCreationMode(original.creationMode);
        const raceId = inferLegacyCharacterRaceId(original);
        const normalized = {
            ...original,
            schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
            rulesVersion: CHARACTER_RULES_VERSION,
            creationMode,
            raceId
        };

        if (creationMode === CHARACTER_CREATION_MODES.FULL) {
            Object.assign(normalized, createFullCharacterFoundation({
                ...original,
                raceId
            }));

            if (!normalized.monsterCategory && raceId) {
                normalized.monsterCategory = getDefaultMonsterCategoryForRace(raceId);
            }
        }

        return normalized;
    }

    function migrateCharacterSheets(sheets) {
        const sourceSheets = Array.isArray(sheets) ? sheets : [];
        const normalizedSheets = sourceSheets.map(normalizeCharacterSheet);
        const changed = JSON.stringify(sourceSheets) !== JSON.stringify(normalizedSheets);

        return {
            sheets: normalizedSheets,
            changed,
            schemaVersion: CHARACTER_SHEET_SCHEMA_VERSION,
            rulesVersion: CHARACTER_RULES_VERSION
        };
    }

    global.characterSheetModel = Object.freeze({
        CHARACTER_SHEET_SCHEMA_VERSION,
        CHARACTER_RULES_VERSION,
        CHARACTER_LEVEL_MINIMUM,
        CHARACTER_ATTRIBUTE_BASE_VALUE,
        CHARACTER_SKILL_INVESTMENT_CAP,
        CHARACTER_MOVEMENT_MINIMUM,
        CHARACTER_MOVEMENT_MAXIMUM,
        CHARACTER_CREATION_MODES,
        CHARACTER_ATTRIBUTES,
        CHARACTER_SKILLS,
        CHARACTER_SKILL_DEFINITIONS,
        CHARACTER_RACES,
        CHARACTER_WITCHER_SCHOOLS,
        CHARACTER_PROFESSIONS,
        CHARACTER_PROFESSIONAL_SKILL_TREES,
        CHARACTER_PROFESSIONAL_SKILLS,
        CHARACTER_PROFESSIONAL_SKILL_DEFINITIONS,
        normalizeCharacterIdentifier,
        normalizeCharacterLevel,
        getCharacterAttributePointBudget,
        getCharacterSkillPointBudget,
        getCharacterTrainingPointBudget,
        getCharacterBudgets,
        getCharacterAttributeDefinition,
        getCharacterSkillDefinition,
        getCharacterSkillsByAttribute,
        normalizeCharacterAttributeInvestment,
        normalizeCharacterAttributeAllocations,
        normalizeCharacterSkillAllocations,
        getCharacterProfessionalSkills,
        getCharacterProfessionalSkillDefinition,
        normalizeCharacterProfessionalSkillAllocations,
        calculateCharacterProfessionalSkillPointsSpent,
        applyCharacterProfessionalSkillBonuses,
        calculateCharacterAttributePointsSpent,
        getCharacterAttributeTotal,
        getCharacterAttributeModifier,
        getCharacterSkillBreakdown,
        getCharacterSkillTotal,
        getCharacterProfessionalSkillTotal,
        calculateCharacterDerivedValues,
        getCharacterAllocationSummary,
        getCharacterNaturalRollResult,
        resolveCharacterSkillTest,
        getCharacterSkillPointCost,
        normalizeSkillInvestment,
        calculateCharacterSkillPointsSpent,
        normalizeCharacterRaceId,
        getCharacterRaceDefinition,
        getDefaultMonsterCategoryForRace,
        getCharacterRaceTraits,
        getCharacterRaceEffects,
        applyCharacterRaceBonuses,
        normalizeCharacterProfessionId,
        getCharacterProfessionDefinition,
        isCharacterProfessionAvailableForRace,
        getAvailableCharacterProfessions,
        getCharacterSpecializations,
        getCharacterSpecializationDefinition,
        normalizeCharacterAbilityProfession,
        getCharacterAbilityCatalog,
        getCharacterAbilityAccessProfile,
        getCharacterAbilityLearningOptions,
        getCharacterAutomaticAbilityIds,
        normalizeCharacterLearnedAbilityIds,
        calculateCharacterTrainingPointsSpent,
        getCharacterTrainingSummary,
        buildCharacterAbilities,
        getCharacterProfessionalSkillBreakdown,
        inferLegacyCharacterRaceId,
        createFullCharacterFoundation,
        normalizeCharacterSheet,
        migrateCharacterSheets
    });
})(typeof window !== 'undefined' ? window : globalThis);
