(function initializeProfessionalSkillsData(global) {
    'use strict';

    const ATTRIBUTE_ALIASES = Object.freeze({
        for: 'strength',
        str: 'strength',
        int: 'intelligence',
        des: 'dexterity',
        dex: 'dexterity',
        sab: 'wisdom',
        car: 'charisma',
        con: 'constitution'
    });

    const TREE_SKILL_NAMES = Object.freeze({
        noble: Object.freeze([
            'Notoriedade (CAR)', 'Diletante (INT)', 'Disfarce Especialista (CAR)', 'Anfitrião (CAR)',
            'Comando (CAR)', 'Servos (CAR)', 'Propriedades (INT)', 'Resoluto (CON)',
            'Cavaleiro (CAR)', 'Amortecedor Blindado (DES)'
        ]),
        artisan: Object.freeze([
            'Remendo Improvisado (SAB)', 'Catálogo Extenso (INT)', 'Oficial de Ofício (SAB)',
            'Artesanato Magistral (SAB)', 'Farmácia Mental (INT)', 'Dose Dupla (SAB)',
            'Adaptação (SAB)', 'Aprimoramento (SAB)', 'Revestimento de Prata (SAB)',
            'Precisão Cirúrgica (SAB)'
        ]),
        brawler: Object.freeze([
            'Paranoia Treinada (INT)', 'Analisar a Área (INT)', 'Chave Mental (INT)',
            'Sumir do Mapa (INT)', 'Ponto Fraco (CAR)', 'Homem Marcado (CAR)',
            'Reunir Aliados (CAR)', 'Mira Cuidadosa (DES)', 'Arrancar Olho (DES)',
            'Golpe do Assassino (DES)'
        ]),
        doctor: Object.freeze([
            'Mãos Curativas (SAB)', 'Diagnóstico (INT)', 'Análise (INT)', 'Cirurgia Eficaz (SAB)',
            'Tenda de Cura (SAB)', 'Improvisação (INT)', 'Remédio Herbal (SAB)',
            'Ferimento Sangrento (INT)', 'Carnificina Prática (INT)', 'Ferimento Incapacitante (INT)'
        ]),
        mage: Object.freeze([
            'Treinamento Mágico (INT)', 'Trama Encantada (CAR)', 'Quebra de Conjuração (INT)',
            'Selo de Contenção (INT)', 'Rede Arcana (CAR)', 'Destilação Avançada (SAB)',
            'Olhar do Véu (INT)', 'Sobrecarga Arcana (INT)', 'Imutável (CON)',
            'Magia Expandida (INT)'
        ]),
        man_at_arms: Object.freeze([
            'Durão como Aço (CON)', 'Alcance Extremo (DES)', 'Tiro Duplo (DES)',
            'Mira Precisa (DES)', 'Cão de Caça (INT)', 'Armadilha Improvisada (SAB)',
            'Consciência Tática (INT)', 'Fúria (CAR)', 'Zweihand (CON)', 'Ignorar a Dor (CON)'
        ]),
        merchant: Object.freeze([
            'Olho do Mundo (INT)', 'Faro de Pechincha (INT)', 'Língua Afiada (CAR)',
            'Palavra de Mercador (CAR)', 'Rede de Corvos (CAR)', 'Informante Pago (INT)',
            'Mapas Esquecidos (INT)', 'Nome nas Ruas (CAR)', 'Mercado Negro (INT)',
            'Contrato de Ferro (CAR)'
        ]),
        melitele: Object.freeze([
            'Iniciado dos Deuses (CAR)', 'Bênção de Melitele (CAR)', 'Autoridade Divina (CAR)',
            'Precognição (CAR)', 'Toque Restaurador (INT)', 'Ler a Natureza (INT)',
            'Ervas de Melitele (INT)', 'Mãos Cuidadosas (DES)', 'Proteção Maternal (CON)',
            'Cuidado Prolongado (INT)'
        ]),
        raven_school: Object.freeze([
            'Treinamento de Bruxo', 'Defesa Adaptativa (DES)', 'Esquiva do Corvo (DES)',
            'Golpe Rápido (FOR)', 'Combo Mortal (FOR)', 'Redemoinho (FOR)',
            'Ataque em Salto (DES)', 'Aparar Flechas (DES)', 'Pressão Implacável (FOR)',
            'Passo Sombrio (DES)'
        ]),
        lynx_school: Object.freeze([
            'Treinamento de Bruxo', 'Esquiva Felina (DES)', 'Fúria Descontrolada (CON)',
            'Golpe Rasgante (FOR)', 'Dança Caótica (DES)', 'Predador Implacável (FOR)',
            'Ataque em Salto (DES)', 'Reflexos Sobre-Humanos (DES)', 'Sede de Sangue (FOR)',
            'Desprezo pela Dor (CON)'
        ]),
        wolf_school: Object.freeze([
            'Treinamento de Bruxo', 'Redemoinho Controlado (FOR)', 'Fonte Mágica (INT)',
            'Defesa Adaptativa (DES)', 'Golpe Preparado (FOR)', 'Frenesi (CON)',
            'Preparação Metódica (INT)', 'Aparar Flechas (DES)', 'Golpe Rápido (FOR)',
            'Redemoinho (FOR)'
        ]),
        griffin_school: Object.freeze([
            'Treinamento de Bruxo', 'Concentração Arcana (INT)', 'Fonte Rúnica (INT)',
            'Aard Intensificado (INT)', 'Igni Controlado (INT)', 'Quen Reativo (INT)',
            'Yrden de Combate (INT)', 'Axii Dominante (CAR)', 'Mestre dos Sinais (INT)',
            'Foco do Grifo (INT)'
        ]),
        viper_school: Object.freeze([
            'Treinamento de Bruxo', 'Passos da Víbora (DES)', 'Combo Mortal (DES)',
            'Ataque em Redemoinho Leve (DES)', 'Perfuração Precisa (DES)',
            'Veneno Aprimorado (INT)', 'Corte nas Artérias (FOR)', 'Dança das Lâminas (DES)',
            'Assassinato da Víbora (DES)', 'Dupla Empunhadura (DES)'
        ]),
        manticore_school: Object.freeze([
            'Treinamento de Bruxo', 'Sangue Alquímico (CON)', 'Arsenal Preparado (INT)',
            'Pele de Mantícora (CON)', 'Reflexo Alquímico (DES)', 'Contra-Ataque Tóxico (DES)',
            'Bomba Reativa (INT)', 'Pulso de Adrenalina (CON)', 'Toxicidade Controlada (CON)',
            'Última Mistura (INT)'
        ]),
        bear_school: Object.freeze([
            'Treinamento de Bruxo', 'Pele Endurecida (CON)', 'Força Bruta (FOR)',
            'Golpe Demolidor (FOR)', 'Impacto Quebrador (FOR)', 'Resistência Inabalável (CON)',
            'Abalo Sísmico (FOR)', 'Provocação Ameaçadora (CAR)', 'Fôlego do Urso (CON)',
            'Colosso Imóvel (CON)'
        ]),
        cat_school: Object.freeze([
            'Treinamento de Bruxo', 'Esquiva Felina (DES)', 'Execução Implacável (FOR)',
            'Golpe Rasgante (FOR)', 'Dança Caótica (DES)', 'Predador Implacável (FOR)',
            'Ataque em Salto (DES)', 'Reflexos Sobre-Humanos (DES)', 'Sede de Sangue (CON)',
            'Desprezo pela Dor (CON)'
        ]),
        grey_roads_minstrel: Object.freeze([
            'Cantar por Moedas (CAR)', 'Ouvido do Povo (CAR)', 'Presença Familiar (CAR)',
            'Canção do Trabalho (CAR)', 'Dormir Leve (INT)', 'Repertório Triste (CAR)',
            'Passar o Chapéu (CAR)', 'Histórias da Estrada (INT)', 'Amigo de Taverna (CAR)',
            'Balada do Sobrevivente (CAR)'
        ]),
        battlefield_herald: Object.freeze([
            'Chamado às Armas (CAR)', 'Discurso de Sangue e Lama (CAR)', 'Ritmo de Marcha (CAR)',
            'Grito de Firmeza (CAR)', 'Canção dos Caídos (CAR)', 'Olhos do Veterano (INT)',
            'Pressão Psicológica (CAR)', 'Manter a Linha (CAR)', 'Voz Sobre o Caos (CAR)',
            'Últimas Palavras (CAR)'
        ]),
        golden_court_tongue: Object.freeze([
            'Etiqueta Nobre (INT)', 'Palavras Medidas (CAR)', 'Leitor de Sala (INT)',
            'Elogio Velado (CAR)', 'Veneno Social (CAR)', 'Rumor Elegante (CAR)',
            'Audiência Privada (CAR)', 'Pressão de Corte (CAR)', 'Fama Controlada (CAR)',
            'Arquitetar Intriga (INT)'
        ]),
        professional_assassin: Object.freeze([
            'Movimento Silencioso (DES)', 'Olhos do Predador (INT)', 'Assassinato Furtivo (DES)',
            'Execução Precisa (DES)', 'Reflexos Assassinos (DES)', 'Dança Letal (DES)',
            'Silêncio Após o Corte (DES)', 'Janela Fatal (INT)', 'Saída Limpa (DES)',
            'Anatomia Prática (INT)'
        ]),
        professional_thief: Object.freeze([
            'Olhos de Oportunista (INT)', 'Leitura de Multidão (INT)', 'Janela Perfeita (DES)',
            'Mãos Invisíveis (DES)', 'Troca Rápida (DES)', 'Engano Natural (CAR)',
            'Rastro Falso (INT)', 'Saída Improvisada (DES)', 'Memória de Cofres (INT)',
            'Cálculo de Risco (INT)'
        ]),
        duelist: Object.freeze([
            'Dança da Lâmina (DES)', 'Marcação de Passos (INT)', 'Respiração Controlada (CON)',
            'Erro Anunciado (INT)', 'Esquiva de Contato (DES)', 'Guarda Aberta (DES)',
            'Mestre da Lâmina Viva (DES)', 'Passo Fantasma (DES)', 'Provocação Mortal (CAR)',
            'Mestre do Duelo (FOR)'
        ]),
        swordsman: Object.freeze([
            'Leitura de Brecha (INT)', 'Golpe Direcionado (FOR)', 'Bloqueio Punitivo (FOR)',
            'Pressão Constante (FOR)', 'Ritmo de Combate (DES)', 'Fenda Mortal (FOR)',
            'Contra-Golpe Técnico (DES)', 'Domínio da Arma (FOR)', 'Postura do Duelista (DES)',
            'Finalização Calculada (INT)'
        ]),
        archer: Object.freeze([
            'Mira Estável (DES)', 'Tiro Incapacitante (DES)', 'Controle de Alcance (INT)',
            'Mira Precisa (DES)', 'Reposicionamento Ágil (DES)', 'Chuva de Flechas (DES)',
            'Tiro de Supressão (DES)', 'Olho do Caçador (INT)', 'Tiro Carregado (DES)',
            'Execução à Distância (DES)'
        ]),
        vanguard: Object.freeze([
            'Muralha Viva (CON)', 'Impacto de Escudo (FOR)', 'Escudada Atordoante (FOR)',
            'Reflexo Defensivo (DES)', 'Postura Irredutível (CON)', 'Controle de Zona (INT)',
            'Queda Forçada (FOR)', 'Guarda Protetora (INT)', 'Ancoragem (CON)',
            'Bastião de Guerra (CON)'
        ]),
        druid: Object.freeze([
            'Manto da Terra (CON)', 'Raízes Protetoras (INT)', 'Equilíbrio Natural (CON)',
            'Ciclo da Vida (INT)', 'Solo Sagrado (CAR)', 'Ler a Natureza (INT)',
            'Pacto Animal (CAR)', 'Instinto Primitivo (DES)', 'Vínculo Natural (CAR)',
            'Controle Natural (INT)'
        ]),
        freya: Object.freeze([
            'Precognição (CAR)', 'Presságio de Freya (INT)', 'Sopro de Freya (CON)',
            'Ritual de Purificação (CON)', 'Palavra da Deusa (CAR)', 'Ervas de Freya (INT)',
            'Bênção da Colheita (INT)', 'Ciclo de Abundância (CON)', 'Frutos de Freya (CAR)',
            'Solo Fértil'
        ]),
        eternal_fire: Object.freeze([
            'Autoridade Divina (CAR)', 'Chama Purificadora (INT)', 'Fervor Fanático (CAR)',
            'Julgamento Ardente (INT)', 'Aura de Intolerância (CAR)', 'Marca da Heresia (INT)',
            'Execução Sagrada (FOR)', 'Olhar do Julgamento (CAR)', 'Caça aos Hereges (INT)',
            'Símbolo Ardente (CAR)'
        ])
    });

    const GENERAL_SKILL_BONUS_TARGETS = Object.freeze({
        mage_treinamento_magico: Object.freeze(['spellcasting', 'resist_magic', 'alchemy']),
        man_at_arms_durao_como_aco: Object.freeze(['physique', 'tolerance']),
        noble_resoluto: Object.freeze(['courage', 'resist_coercion']),
        mage_trama_encantada: Object.freeze([
            'deceit', 'seduction', 'intimidation', 'persuasion', 'human_perception'
        ]),
        raven_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        lynx_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        wolf_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        griffin_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        viper_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        manticore_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        bear_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        cat_school_treinamento_de_bruxo: Object.freeze([
            'monster_lore', 'fencing', 'block', 'reflex_dodge', 'spellcasting',
            'alchemy', 'courage', 'resist_coercion', 'intimidation', 'investigation'
        ]),
        raven_school_esquiva_do_corvo: Object.freeze(['reflex_dodge']),
        lynx_school_esquiva_felina: Object.freeze(['reflex_dodge']),
        cat_school_esquiva_felina: Object.freeze(['reflex_dodge']),
        viper_school_passos_da_vibora: Object.freeze(['reflex_dodge']),
        griffin_school_mestre_dos_sinais: Object.freeze(['spellcasting']),
        viper_school_dupla_empunhadura: Object.freeze(['two_handed']),
        druid_pacto_animal: Object.freeze(['survival'])
    });

    const AUTOMATIC_PROFESSIONAL_FEATURES = new Set([
        'mage_sobrecarga_arcana',
        'mage_magia_expandida',
        'wolf_school_fonte_magica',
        'griffin_school_fonte_runica',
        'manticore_school_toxicidade_controlada'
    ]);

    const AUTOMATION_LABELS = Object.freeze({
        automatic: 'Automático',
        assisted: 'Assistido',
        reminder: 'Lembrete',
        reference: 'Referência'
    });

    function normalizeIdentifier(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_|_$)/g, '');
    }

    function inferProfessionalReminderTriggers(description) {
        const text = String(description || '').toLocaleLowerCase('pt-BR');
        const triggers = new Set();

        if (/abaixo de 50%|menos de 50%|metade (?:dos )?pv|pv.*metade|abaixo da metade/.test(text)) triggers.add('low-hp');
        if (/poção|poções|toxicidade|alquímic/.test(text)) triggers.add('potion-active');
        if (/envenen|veneno/.test(text)) triggers.add('poisoned');
        if (/elimina|eliminar|derrota|derrotar|matar|abater/.test(text)) triggers.add('defeat');
        if (/sofrer dano|sofre dano|receber dano|recebe dano|for atingido|ao ser atingido/.test(text)) triggers.add('damage-taken');
        if (/causar dano|causa dano|acertar|ao atingir|ataque bem-sucedido|ataques bem-sucedidos/.test(text)) triggers.add('damage-dealt');
        if (/bloquear|bloqueio|aparar|esquivar|esquiva/.test(text)) triggers.add('defense');
        if (/conjurar|lançar (?:um )?sinal|usar (?:um )?sinal|magia/.test(text)) triggers.add('ability-use');
        if (/usar (?:uma )?poção|consumir|bomba|óleo/.test(text)) triggers.add('item-use');
        if (/descanso|dormir|repouso/.test(text)) triggers.add('rest');
        if (/início (?:do|de) turno|no seu turno|por turno|por rodada|durante (?:o )?turno|durante (?:a )?rodada/.test(text)) triggers.add('turn');

        if (triggers.size === 0) triggers.add('turn');
        return Object.freeze([...triggers]);
    }

    function classifyProfessionalAutomation(id, description, generalSkillBonuses) {
        if (generalSkillBonuses.length > 0 || AUTOMATIC_PROFESSIONAL_FEATURES.has(id)) {
            return Object.freeze({
                mode: 'automatic',
                label: AUTOMATION_LABELS.automatic,
                status: 'implemented',
                batch: 1
            });
        }

        const normalizedDescription = String(description || '').toLocaleLowerCase('pt-BR');
        if (/faça (?:um )?teste|role\b|\bcd\s*\d|contra (?:a )?cd|resultado do teste/.test(normalizedDescription)) {
            return Object.freeze({
                mode: 'assisted',
                label: AUTOMATION_LABELS.assisted,
                status: 'planned',
                batch: 2
            });
        }

        if (/\bquando\b|\bao\b|\bapós\b|\benquanto\b|\bse\b|\buma vez\b|\bgaste\b|\bpode gastar\b/.test(normalizedDescription)) {
            return Object.freeze({
                mode: 'reminder',
                label: AUTOMATION_LABELS.reminder,
                status: 'planned',
                batch: 3,
                triggers: inferProfessionalReminderTriggers(description)
            });
        }

        return Object.freeze({
            mode: 'reference',
            label: AUTOMATION_LABELS.reference,
            status: 'planned',
            batch: 4
        });
    }

    function createProfessionalSkill(treeId, rawName, index) {
        const match = String(rawName).match(/\s*[([](FOR|STR|INT|DES|DEX|SAB|CAR|CON)[)\]]\s*$/i);
        const abbreviation = match?.[1]?.toLowerCase() || '';
        const name = String(rawName).replace(/\s*[([](FOR|STR|INT|DES|DEX|SAB|CAR|CON)[)\]]\s*$/i, '').trim();
        const id = `${treeId}_${normalizeIdentifier(name)}`;
        const description = String(global.characterProfessionalSkillDescriptions?.[treeId]?.[index] || '').trim();
        const generalSkillBonuses = GENERAL_SKILL_BONUS_TARGETS[id] || Object.freeze([]);

        return Object.freeze({
            id,
            treeId,
            name,
            description,
            attributeId: ATTRIBUTE_ALIASES[abbreviation] || null,
            generalSkillBonuses,
            automation: classifyProfessionalAutomation(id, description, generalSkillBonuses),
            pointCost: 1,
            maxInvestment: 4,
            order: index
        });
    }

    const trees = Object.freeze(Object.fromEntries(
        Object.entries(TREE_SKILL_NAMES).map(([treeId, names]) => [
            treeId,
            Object.freeze(names.map((name, index) => createProfessionalSkill(treeId, name, index)))
        ])
    ));
    const skills = Object.freeze(Object.values(trees).flat());
    const automationSummary = Object.freeze(skills.reduce((summary, skill) => {
        summary[skill.automation.mode] += 1;
        return summary;
    }, { automatic: 0, assisted: 0, reminder: 0, reference: 0 }));

    global.characterProfessionalSkillsData = Object.freeze({ trees, skills, automationSummary });
})(typeof window !== 'undefined' ? window : globalThis);
