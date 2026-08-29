(function initializeCharacterSheetTemplates(global) {
    'use strict';

    function freezeTemplate(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.values(value).forEach(freezeTemplate);
        return Object.freeze(value);
    }

    function cloneTemplate(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function allocations(entries) {
        return Object.fromEntries(
            Object.entries(entries).map(([id, invested]) => [id, { invested }])
        );
    }

    const templates = [
        {
            id: 'wolf-school-witcher',
            icon: '🐺',
            name: 'Bruxo da Escola do Lobo',
            role: 'Duelista versátil',
            summary: 'Combate próximo, sinais e conhecimento de monstros.',
            draft: {
                name: 'Bruxo da Escola do Lobo',
                level: 1,
                raceId: 'witcher',
                professionId: 'witcher',
                specializationId: 'wolf_school',
                attributes: allocations({ strength: 2, intelligence: 2, dexterity: 2, constitution: 6 }),
                professionalSkills: allocations({
                    wolf_school_treinamento_de_bruxo: 4,
                    wolf_school_fonte_magica: 2,
                    wolf_school_preparacao_metodica: 2
                }),
                skills: allocations({
                    physique: 4,
                    fencing: 4,
                    reflex_dodge: 4,
                    spellcasting: 4,
                    monster_lore: 4,
                    alchemy: 3,
                    block: 3,
                    athletics: 3,
                    courage: 2,
                    resist_coercion: 2
                })
            }
        },
        {
            id: 'human-mage',
            icon: '🧙',
            name: 'Mago Humano',
            role: 'Controle e suporte arcano',
            summary: 'Magias iniciais, resistência mágica e alquimia.',
            draft: {
                name: 'Mago Humano',
                level: 1,
                raceId: 'human',
                professionId: 'mage',
                specializationId: 'mage',
                attributes: allocations({ intelligence: 6, constitution: 4, charisma: 2 }),
                professionalSkills: allocations({
                    mage_treinamento_magico: 4,
                    mage_trama_encantada: 3,
                    mage_sobrecarga_arcana: 2,
                    mage_magia_expandida: 2
                }),
                skills: allocations({
                    spellcasting: 4,
                    resist_magic: 4,
                    alchemy: 3,
                    education: 3,
                    perception: 3,
                    physique: 2,
                    persuasion: 2,
                    human_perception: 2
                }),
                learnedAbilityIds: [
                    'cenlly_graig',
                    'cura_magica',
                    'feitico_de_diagnostico',
                    'telepatia',
                    'ritual_de_limpeza'
                ]
            }
        },
        {
            id: 'human-vanguard',
            icon: '🛡️',
            name: 'Guerreiro Vanguarda',
            role: 'Defesa e controle de zona',
            summary: 'Bloqueio, resistência e proteção da linha de frente.',
            draft: {
                name: 'Guerreiro Vanguarda',
                level: 1,
                raceId: 'human',
                professionId: 'warrior',
                specializationId: 'vanguard',
                attributes: allocations({ strength: 4, constitution: 4, dexterity: 3, intelligence: 1 }),
                professionalSkills: allocations({
                    vanguard_muralha_viva: 4,
                    vanguard_impacto_de_escudo: 3,
                    vanguard_reflexo_defensivo: 3,
                    vanguard_postura_irredutivel: 3
                }),
                skills: allocations({
                    block: 4,
                    fencing: 4,
                    physique: 4,
                    athletics: 4,
                    reflex_dodge: 4,
                    tactics: 3,
                    courage: 3,
                    tolerance: 3
                })
            }
        },
        {
            id: 'human-professional-assassin',
            icon: '🗡️',
            name: 'Assassino Profissional',
            role: 'Infiltração e precisão',
            summary: 'Furtividade, lâminas curtas e mobilidade.',
            draft: {
                name: 'Assassino Profissional',
                level: 1,
                raceId: 'human',
                professionId: 'criminal',
                specializationId: 'professional_assassin',
                attributes: allocations({ dexterity: 6, intelligence: 3, strength: 2, constitution: 1 }),
                professionalSkills: allocations({
                    professional_assassin_movimento_silencioso: 4,
                    professional_assassin_olhos_do_predador: 3,
                    professional_assassin_assassinato_furtivo: 4,
                    professional_assassin_reflexos_assassinos: 3
                }),
                skills: allocations({
                    stealth: 4,
                    short_blades: 4,
                    reflex_dodge: 4,
                    athletics: 4,
                    perception: 4,
                    lockpicking: 4,
                    brawl: 2,
                    human_perception: 2
                })
            }
        },
        {
            id: 'human-melitele-cleric',
            icon: '✨',
            name: 'Clérigo de Melitele',
            role: 'Cura e proteção',
            summary: 'Suporte sagrado, primeiros socorros e liderança.',
            draft: {
                name: 'Clérigo de Melitele',
                level: 1,
                raceId: 'human',
                professionId: 'cleric',
                specializationId: 'melitele',
                attributes: allocations({ intelligence: 4, charisma: 4, wisdom: 2, constitution: 2 }),
                professionalSkills: allocations({
                    melitele_iniciado_dos_deuses: 3,
                    melitele_bencao_de_melitele: 3,
                    melitele_toque_restaurador: 3,
                    melitele_maos_cuidadosas: 3
                }),
                skills: allocations({
                    spellcasting: 4,
                    first_aid: 4,
                    resist_magic: 3,
                    leadership: 3,
                    persuasion: 3,
                    education: 3,
                    physique: 2,
                    perception: 3
                }),
                learnedAbilityIds: ['luz_sagrada', 'bencao_do_amor', 'ritual_de_limpeza']
            }
        },
        {
            id: 'human-archer',
            icon: '🏹',
            name: 'Arqueiro Humano',
            role: 'Combate à distância',
            summary: 'Precisão, percepção e reposicionamento ágil.',
            draft: {
                name: 'Arqueiro Humano',
                level: 1,
                raceId: 'human',
                professionId: 'warrior',
                specializationId: 'archer',
                attributes: allocations({ dexterity: 6, intelligence: 2, constitution: 2, wisdom: 2 }),
                professionalSkills: allocations({
                    archer_mira_estavel: 4,
                    archer_mira_precisa: 3,
                    archer_reposicionamento_agil: 3,
                    archer_olho_do_cacador: 2
                }),
                skills: allocations({
                    archery: 4,
                    athletics: 4,
                    reflex_dodge: 4,
                    perception: 4,
                    hunting: 4,
                    survival: 4,
                    tactics: 2,
                    physique: 2
                })
            }
        }
    ].map(freezeTemplate);

    function getById(templateId) {
        return templates.find(template => template.id === templateId) || null;
    }

    function createDraft(templateId) {
        const template = getById(templateId);
        return template ? cloneTemplate(template.draft) : null;
    }

    global.characterSheetTemplates = Object.freeze({
        list: Object.freeze(templates),
        getById,
        createDraft
    });
})(typeof window !== 'undefined' ? window : globalThis);
