const CRITICAL_SEVERITIES = Object.freeze([
    Object.freeze({ id: 'simple', name: 'Simples', minMargin: 7, maxMargin: 9, bonusDamage: 3 }),
    Object.freeze({ id: 'complicated', name: 'Complicado', minMargin: 10, maxMargin: 12, bonusDamage: 5 }),
    Object.freeze({ id: 'difficult', name: 'Difícil', minMargin: 13, maxMargin: 14, bonusDamage: 8 }),
    Object.freeze({ id: 'deadly', name: 'Mortal', minMargin: 15, maxMargin: null, bonusDamage: 10 })
]);

const CRITICAL_WOUNDS = Object.freeze([
    Object.freeze({
        id: 'simple-cracked-jaw', severity: 'simple', region: 'head', name: 'Mandíbula Trincada',
        description: 'O golpe trincou sua mandíbula, tornando difícil falar claramente. Você sofre −2 em Perícias Mágicas e Combate Verbal.',
        stabilized: 'Você sofre −1 em Perícias Mágicas e Combate Verbal.',
        treated: 'Você sofre −1 em Perícias Mágicas.'
    }),
    Object.freeze({
        id: 'simple-disfiguring-scar', severity: 'simple', region: 'head', name: 'Cicatriz Desfigurante',
        description: 'O golpe mutilou seu rosto. Você sofre −3 em Combate Verbal empático: Carisma, Persuasão, Sedução, Liderança, Ludibriar/Enganar, Etiqueta Social e Intimidação.',
        stabilized: 'Você sofre −1 em Combate Verbal empático.',
        treated: 'Você sofre −1 em Sedução.'
    }),
    Object.freeze({
        id: 'simple-cracked-ribs', severity: 'simple', region: 'torso', name: 'Costelas Trincadas',
        description: 'O golpe trincou suas costelas. Você sofre −2 em Físico.',
        stabilized: 'Você sofre −1 em Físico.',
        treated: 'Você sofre −10 na Capacidade de Carga.'
    }),
    Object.freeze({
        id: 'simple-foreign-object', severity: 'simple', region: 'torso', name: 'Objeto Estranho',
        description: 'Uma peça de roupa ou armadura ficou alojada no ferimento. Recuperação e Cura Crítica ficam em 1/4 do total.',
        stabilized: 'Recuperação e Cura Crítica são divididas pela metade.',
        treated: 'Você sofre −2 em Recuperação e −1 em Cura Crítica.'
    }),
    Object.freeze({
        id: 'simple-twisted-arm', severity: 'simple', region: 'arm', name: 'Braço Torcido',
        description: 'O golpe torceu seu braço. Você sofre −2 em ações que usam esse braço.',
        stabilized: 'Você sofre −1 em ações que usam esse braço.',
        treated: 'Você sofre −1 em Físico.'
    }),
    Object.freeze({
        id: 'simple-twisted-leg', severity: 'simple', region: 'leg', name: 'Perna Torcida',
        description: 'O golpe torceu sua perna. Você sofre −2 em Esquivar/Escapar e Atletismo, e seu Movimento fica pela metade.',
        stabilized: 'Você sofre −1 em Esquivar/Escapar e Atletismo, e seu Movimento é reduzido em 1/4.',
        treated: 'Você sofre −1 em Atletismo.'
    }),
    Object.freeze({
        id: 'complicated-minor-head-wound', severity: 'complicated', region: 'head', name: 'Ferimento Menor na Cabeça',
        description: 'O golpe sacudiu seu cérebro. Você sofre −2 em Inteligência e Constituição e fica Atordoado.',
        stabilized: 'Você sofre −1 em Inteligência e Constituição.',
        treated: 'Você sofre −1 em Constituição.',
        conditions: Object.freeze(['💫'])
    }),
    Object.freeze({
        id: 'complicated-lost-teeth', severity: 'complicated', region: 'head', name: 'Dentes Perdidos',
        description: 'O golpe arrancou 1d10 dentes. Você sofre −3 em Perícias Mágicas e Combate Verbal.',
        stabilized: 'Você sofre −2 em Perícias Mágicas e Combate Verbal.',
        treated: 'Você sofre −1 em Perícias Mágicas e Combate Verbal.'
    }),
    Object.freeze({
        id: 'complicated-ruptured-spleen', severity: 'complicated', region: 'torso', name: 'Ruptura do Baço',
        description: 'O baço começa a sangrar profusamente. Faça um teste de resistência a Atordoamento a cada 5 rodadas.',
        stabilized: 'Faça um teste de resistência a Atordoamento a cada 10 rodadas.',
        treated: 'Você sofre −2 em Atordoamento.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'complicated-broken-ribs', severity: 'complicated', region: 'torso', name: 'Costelas Quebradas',
        description: 'O golpe quebrou suas costelas. Você sofre −2 em Constituição e −1 em Força e Destreza.',
        stabilized: 'Você sofre −1 em Constituição e Força.',
        treated: 'Você sofre −1 em Constituição.'
    }),
    Object.freeze({
        id: 'complicated-fractured-arm', severity: 'complicated', region: 'arm', name: 'Braço Fraturado',
        description: 'O golpe fraturou seu braço. Você sofre −3 em ações que usam esse braço.',
        stabilized: 'Você sofre −2 em ações que usam esse braço.',
        treated: 'Você sofre −1 em ações que usam esse braço.'
    }),
    Object.freeze({
        id: 'complicated-fractured-leg', severity: 'complicated', region: 'leg', name: 'Perna Fraturada',
        description: 'O golpe fraturou sua perna. Você sofre −3 em Movimento, Esquivar/Escapar e Atletismo.',
        stabilized: 'Você sofre −2 em Movimento, Esquivar/Escapar e Atletismo.',
        treated: 'Você sofre −1 em Movimento, Esquivar/Escapar e Atletismo.'
    }),
    Object.freeze({
        id: 'difficult-skull-fracture', severity: 'difficult', region: 'head', name: 'Fratura de Crânio',
        description: 'O crânio foi fraturado. Você sofre −1 em INT e DES, sangra e recebe dano quádruplo em novos ferimentos na cabeça.',
        stabilized: 'Você sofre −1 em INT e DES e recebe dano quádruplo em novos ferimentos na cabeça.',
        treated: 'Você recebe dano quádruplo em novos ferimentos na cabeça.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'difficult-concussion', severity: 'difficult', region: 'head', name: 'Concussão',
        description: 'Faça um teste de resistência a Atordoamento a cada 1d6 rodadas. Você sofre −2 em Inteligência, Destreza e Reflexo/Esquivas.',
        stabilized: 'Você sofre −1 em Inteligência, Destreza e Reflexo/Esquivas.',
        treated: 'Você sofre −1 em Inteligência e Destreza.'
    }),
    Object.freeze({
        id: 'difficult-torn-stomach', severity: 'difficult', region: 'torso', name: 'Estômago Rasgado',
        description: 'O estômago foi rasgado. Você sofre −2 em todas as ações e 4 pontos de dano ácido por rodada.',
        stabilized: 'Você sofre −2 em todas as ações.',
        treated: 'Você sofre −1 em todas as ações.'
    }),
    Object.freeze({
        id: 'difficult-hole-in-chest', severity: 'difficult', region: 'torso', name: 'Buraco no Peito',
        description: 'O ferimento rasgou o pulmão. Você sofre −3 em Constituição e Movimento e começa a sufocar.',
        stabilized: 'Você sofre −2 em Constituição e Movimento.',
        treated: 'Você sofre −1 em Constituição e Movimento.'
    }),
    Object.freeze({
        id: 'difficult-open-arm-fracture', severity: 'difficult', region: 'arm', name: 'Fratura Exposta no Braço',
        description: 'O braço fica inútil e o ferimento causa Sangramento.',
        stabilized: 'O braço continua inútil.',
        treated: 'O braço deve permanecer em tipoia, mas pode segurar objetos.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'difficult-open-leg-fracture', severity: 'difficult', region: 'leg', name: 'Fratura Exposta na Perna',
        description: 'A perna fica inútil. Movimento, Esquivar/Escapar e Atletismo ficam em 1/4 e o ferimento causa Sangramento.',
        stabilized: 'Movimento, Esquivar/Escapar e Atletismo ficam pela metade.',
        treated: 'Você sofre −2 em Movimento, Esquivar/Escapar e Atletismo.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'deadly-broken-spine', severity: 'deadly', region: 'head', name: 'Coluna Quebrada / Decapitado',
        description: 'O golpe quebra o pescoço ou separa a cabeça dos ombros. Morte imediata.',
        stabilized: 'Este ferimento não pode ser estabilizado.',
        treated: 'Este ferimento não pode ser tratado.',
        immediateDeath: true,
        cannotStabilize: true,
        cannotTreat: true
    }),
    Object.freeze({
        id: 'deadly-damaged-eye', severity: 'deadly', region: 'head', name: 'Olho Danificado',
        description: 'O globo ocular foi ferido. Você sofre −5 em Consciência baseada em visão, −4 em DES e Sangramento.',
        stabilized: 'Você sofre −3 em Consciência baseada em visão e −2 em DES.',
        treated: 'Você sofre −1 permanente em Consciência baseada em visão e DES.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'deadly-heart-damage', severity: 'deadly', region: 'torso', name: 'Dano no Coração',
        description: 'Faça imediatamente um teste de resistência à Morte. Se sobreviver, você sangra e considera 1/4 de EST, Movimento e Constituição.',
        stabilized: 'EST, Movimento e Constituição ficam reduzidos pela metade.',
        treated: 'Você sofre +2 de dano de Sangramento por rodada permanentemente.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'deadly-septic-shock', severity: 'deadly', region: 'torso', name: 'Choque Séptico',
        description: 'Considere 1/4 da EST, sofra −3 em Inteligência, Constituição, Força e Destreza e fique Envenenado.',
        stabilized: 'EST fica reduzida pela metade e você sofre −1 em Inteligência, Constituição, Força e Destreza.',
        treated: 'Você sofre −5 em EST permanentemente.',
        conditions: Object.freeze(['🐍'])
    }),
    Object.freeze({
        id: 'deadly-severed-arm', severity: 'deadly', region: 'arm', name: 'Braço Desmembrado',
        description: 'O braço foi arrancado ou danificado além do reparo. Ele não pode ser usado e o ferimento causa Sangramento.',
        stabilized: 'O braço permanece inútil.',
        treated: 'O braço pode ser substituído por uma prótese.',
        conditions: Object.freeze(['🩸'])
    }),
    Object.freeze({
        id: 'deadly-severed-leg', severity: 'deadly', region: 'leg', name: 'Perna Desmembrada',
        description: 'A perna foi arrancada ou danificada além do reparo. Movimento, Esquivar/Escapar e Atletismo ficam em 1/4. O ferimento causa Sangramento.',
        stabilized: 'Movimento, Esquivar/Escapar e Atletismo permanecem em 1/4.',
        treated: 'A perna pode ser substituída por uma prótese.',
        conditions: Object.freeze(['🩸'])
    })
]);

const CRITICAL_REGION_INFO = Object.freeze({
    head: Object.freeze({ name: 'Cabeça', icon: '🧠', multiplier: 3 }),
    torso: Object.freeze({ name: 'Tronco', icon: '🫀', multiplier: 1 }),
    arm: Object.freeze({ name: 'Braço', icon: '🦾', multiplier: 0.5 }),
    leg: Object.freeze({ name: 'Perna', icon: '🦵', multiplier: 0.5 })
});

const CRITICAL_STATE_INFO = Object.freeze({
    normal: Object.freeze({ name: 'Normal', next: 'stabilized', action: 'Estabilizar' }),
    stabilized: Object.freeze({ name: 'Estabilizado', next: 'treated', action: 'Tratar' }),
    treated: Object.freeze({ name: 'Tratado', next: 'cured', action: 'Marcar curado' }),
    cured: Object.freeze({ name: 'Curado', next: null, action: '' })
});

const CRITICAL_WOUND_PENALTIES = Object.freeze({
    'simple-cracked-jaw': Object.freeze({
        normal: { skills: { spellcasting: -2, persuasion: -2, seduction: -2, leadership: -2, deceit: -2, social_etiquette: -2, intimidation: -2 } },
        stabilized: { skills: { spellcasting: -1, persuasion: -1, seduction: -1, leadership: -1, deceit: -1, social_etiquette: -1, intimidation: -1 } },
        treated: { skills: { spellcasting: -1 } }
    }),
    'simple-disfiguring-scar': Object.freeze({
        normal: { skills: { persuasion: -3, seduction: -3, leadership: -3, deceit: -3, social_etiquette: -3, intimidation: -3 } },
        stabilized: { skills: { persuasion: -1, seduction: -1, leadership: -1, deceit: -1, social_etiquette: -1, intimidation: -1 } },
        treated: { skills: { seduction: -1 } }
    }),
    'simple-cracked-ribs': Object.freeze({
        normal: { skills: { physique: -2 } },
        stabilized: { skills: { physique: -1 } }
    }),
    'simple-twisted-leg': Object.freeze({
        normal: { skills: { athletics: -2, reflex_dodge: -2 } },
        stabilized: { skills: { athletics: -1, reflex_dodge: -1 } },
        treated: { skills: { athletics: -1 } }
    }),
    'complicated-minor-head-wound': Object.freeze({
        normal: { attributes: { intelligence: -2, constitution: -2 } },
        stabilized: { attributes: { intelligence: -1, constitution: -1 } },
        treated: { attributes: { constitution: -1 } }
    }),
    'complicated-lost-teeth': Object.freeze({
        normal: { skills: { spellcasting: -3, persuasion: -3, seduction: -3, leadership: -3, deceit: -3, social_etiquette: -3, intimidation: -3 } },
        stabilized: { skills: { spellcasting: -2, persuasion: -2, seduction: -2, leadership: -2, deceit: -2, social_etiquette: -2, intimidation: -2 } },
        treated: { skills: { spellcasting: -1, persuasion: -1, seduction: -1, leadership: -1, deceit: -1, social_etiquette: -1, intimidation: -1 } }
    }),
    'complicated-broken-ribs': Object.freeze({
        normal: { attributes: { constitution: -2, strength: -1, dexterity: -1 } },
        stabilized: { attributes: { constitution: -1, strength: -1 } },
        treated: { attributes: { constitution: -1 } }
    }),
    'complicated-fractured-leg': Object.freeze({
        normal: { skills: { athletics: -3, reflex_dodge: -3 } },
        stabilized: { skills: { athletics: -2, reflex_dodge: -2 } },
        treated: { skills: { athletics: -1, reflex_dodge: -1 } }
    }),
    'difficult-skull-fracture': Object.freeze({
        normal: { attributes: { intelligence: -1, dexterity: -1 } },
        stabilized: { attributes: { intelligence: -1, dexterity: -1 } }
    }),
    'difficult-concussion': Object.freeze({
        normal: { attributes: { intelligence: -2, dexterity: -2 }, skills: { reflex_dodge: -2 } },
        stabilized: { attributes: { intelligence: -1, dexterity: -1 }, skills: { reflex_dodge: -1 } },
        treated: { attributes: { intelligence: -1, dexterity: -1 } }
    }),
    'difficult-torn-stomach': Object.freeze({
        normal: { all: -2 },
        stabilized: { all: -2 },
        treated: { all: -1 }
    }),
    'difficult-hole-in-chest': Object.freeze({
        normal: { attributes: { constitution: -3 } },
        stabilized: { attributes: { constitution: -2 } },
        treated: { attributes: { constitution: -1 } }
    }),
    'difficult-open-leg-fracture': Object.freeze({
        treated: { skills: { athletics: -2, reflex_dodge: -2 } }
    }),
    'deadly-damaged-eye': Object.freeze({
        normal: { attributes: { dexterity: -4 }, skills: { perception: -5 } },
        stabilized: { attributes: { dexterity: -2 }, skills: { perception: -3 } },
        treated: { attributes: { dexterity: -1 }, skills: { perception: -1 } }
    }),
    'deadly-septic-shock': Object.freeze({
        normal: { attributes: { intelligence: -3, constitution: -3, strength: -3, dexterity: -3 } },
        stabilized: { attributes: { intelligence: -1, constitution: -1, strength: -1, dexterity: -1 } }
    })
});

const COMBAT_ROLL_SKILL_GROUPS = Object.freeze({
    meleeAttack: Object.freeze(['brawl', 'staff_spear', 'fencing', 'short_blades', 'two_handed']),
    rangedAttack: Object.freeze(['archery']),
    block: Object.freeze(['block']),
    dodge: Object.freeze(['reflex_dodge'])
});

const COMBAT_ROLL_OUTCOME_TABLES = Object.freeze({
    meleeAttackFumble: Object.freeze([
        Object.freeze({ min: 1, max: 5, title: 'Sem vacilo grave', description: 'O ataque falha sem uma consequência adicional.' }),
        Object.freeze({ min: 6, max: 6, title: 'Desequilibrado', description: 'O atacante perde a postura e fica Desequilibrado.', condition: '⚖️', target: 'self' }),
        Object.freeze({ min: 7, max: 7, title: 'Arma presa', description: 'A arma fica presa e exige uma rodada para ser recuperada.', incident: 'Arma presa por 1 rodada', target: 'self' }),
        Object.freeze({ min: 8, max: 8, title: 'Arma danificada', description: 'A arma ativa sofre 1d10 de dano de durabilidade.', extraDice: '1d10', weaponWear: true, target: 'self' }),
        Object.freeze({ min: 9, max: 9, title: 'Feriu a si mesmo', description: 'O atacante atinge a si mesmo; informe o dano da arma e resolva a região normalmente.', incident: 'Autoacerto: resolver dano e região', target: 'self' }),
        Object.freeze({ min: 10, max: 10, title: 'Acertou outro alvo', description: 'O golpe atinge um alvo aleatório ao alcance; escolha quem foi atingido e resolva a região.', incident: 'Ataque desviou para este alvo', target: 'other' })
    ]),
    rangedAttackFumble: Object.freeze([
        Object.freeze({ min: 1, max: 5, title: 'Sem vacilo grave', description: 'O ataque falha sem uma consequência adicional.' }),
        Object.freeze({ min: 6, max: 6, title: 'Munição quebrada', description: 'Uma munição equipada é destruída.', consumeAmmo: true, target: 'self' }),
        Object.freeze({ min: 7, max: 7, title: 'Arma travada', description: 'A corda escapa, a besta trava ou a arma arremessada cai. A correção exige uma rodada.', incident: 'Arma à distância travada por 1 rodada', target: 'self' }),
        Object.freeze({ min: 8, max: 8, title: 'Ricochete em aliado', description: 'O disparo ricocheteia em um aliado; escolha o atingido e resolva dano e região.', incident: 'Ricochete: resolver dano e região', target: 'other' }),
        Object.freeze({ min: 9, max: 9, title: 'Posição revelada', description: 'A posição é revelada e o atacante recebe −2 na próxima ação.', incident: 'Posição revelada · −2 na próxima ação', target: 'self' }),
        Object.freeze({ min: 10, max: 10, title: 'Arma avariada', description: 'O atacante sofre 1d4 de dano e a arma fica inutilizável até ser reparada.', extraDice: '1d4', selfDamage: true, weaponUnusable: true, incident: 'Arma inutilizável até reparo', target: 'self' })
    ]),
    blockFumble: Object.freeze([
        Object.freeze({ min: 1, max: 5, title: 'Sem vacilo grave', description: 'A defesa falha sem uma consequência adicional.' }),
        Object.freeze({ min: 6, max: 6, title: 'Arma danificada', description: 'A arma ou escudo usado na defesa sofre 1d6 de dano de durabilidade.', extraDice: '1d6', weaponWear: true, target: 'self' }),
        Object.freeze({ min: 7, max: 7, title: 'Arma derrubada', description: 'A arma é derrubada e voa 1d6 metros.', extraDice: '1d6', incident: 'Arma derrubada', extraLabel: 'Distância em metros', disarm: true, target: 'self' }),
        Object.freeze({ min: 8, max: 8, title: 'Derrubado e atordoado', description: 'O defensor fica Caído e deve realizar um teste de resistência a Atordoamento.', conditions: Object.freeze(['🧎']), incident: 'Teste de resistência a Atordoamento', target: 'self' }),
        Object.freeze({ min: 9, max: 9, title: 'Arma muito danificada', description: 'A arma ou escudo sofre 2d6 de dano de durabilidade.', extraDice: '2d6', weaponWear: true, target: 'self' }),
        Object.freeze({ min: 10, max: 10, title: 'Ricochete contra si', description: 'O ataque bloqueado ricocheteia no defensor; resolva o dano e a região.', incident: 'Ricochete contra si: resolver dano e região', target: 'self' })
    ]),
    dodgeFumble: Object.freeze([
        Object.freeze({ min: 1, max: 5, title: 'Sem vacilo grave', description: 'A esquiva falha sem uma consequência adicional.' }),
        Object.freeze({ min: 6, max: 6, title: 'Desequilibrado', description: 'O defensor fica Desequilibrado.', condition: '⚖️', target: 'self' }),
        Object.freeze({ min: 7, max: 7, title: 'Caído', description: 'O defensor termina a esquiva Caído.', condition: '🧎', target: 'self' }),
        Object.freeze({ min: 8, max: 8, title: 'Caído e atordoado', description: 'O defensor fica Caído e deve realizar um teste de resistência a Atordoamento.', condition: '🧎', incident: 'Teste de resistência a Atordoamento', target: 'self' }),
        Object.freeze({ min: 9, max: 9, title: 'Impacto não letal', description: 'O defensor fica Caído, sofre 1d6 de dano não letal na cabeça e deve testar Atordoamento.', condition: '🧎', extraDice: '1d6', selfDamage: true, damageKind: 'não letal na cabeça', incident: 'Teste de resistência a Atordoamento', target: 'self' }),
        Object.freeze({ min: 10, max: 10, title: 'Impacto letal', description: 'O defensor fica Caído, sofre 1d6 de dano letal na cabeça e deve testar Atordoamento.', condition: '🧎', extraDice: '1d6', selfDamage: true, damageKind: 'letal na cabeça', incident: 'Teste de resistência a Atordoamento', target: 'self' })
    ]),
    blockCritical: Object.freeze([
        Object.freeze({ min: 1, max: 5, title: 'Defesa precisa', description: 'O bloqueio é crítico, mas não gera uma consequência adicional.' }),
        Object.freeze({ min: 6, max: 6, title: 'Oponente derrubado', description: 'O oponente fica Caído.', condition: '🧎', target: 'other' }),
        Object.freeze({ min: 7, max: 7, title: 'Abertura para contra-ataque', description: 'O bloqueio cria uma abertura imediata para contra-atacar.', incident: 'Abertura para contra-ataque imediato', target: 'self' }),
        Object.freeze({ min: 8, max: 8, title: 'Oponente desarmado', description: 'A arma do oponente voa 1d6 metros.', extraDice: '1d6', extraLabel: 'Distância em metros', incident: 'Arma derrubada', disarm: true, target: 'other' }),
        Object.freeze({ min: 9, max: 9, title: 'Arma rebate no oponente', description: 'A arma do oponente rebate contra ele; resolva o dano e a região.', incident: 'Arma rebateu: resolver dano e região', target: 'other' }),
        Object.freeze({ min: 10, max: 10, title: 'Domínio total', description: 'O oponente fica desarmado e Caído, e o defensor recebe um ataque imediato.', conditions: Object.freeze(['🧎']), incident: 'Ataque imediato contra o oponente desarmado e Caído', incidentTarget: 'actor', disarm: true, target: 'other' })
    ]),
    dodgeCritical: Object.freeze([
        Object.freeze({ min: 1, max: 5, title: 'Esquiva precisa', description: 'A esquiva é crítica, mas não gera uma consequência adicional.' }),
        Object.freeze({ min: 6, max: 6, title: 'Reposicionamento', description: 'O defensor pode se reposicionar 1,5 metro.', incident: 'Reposicionamento livre de 1,5 m', target: 'self' }),
        Object.freeze({ min: 7, max: 7, title: 'Vantagem ofensiva', description: 'O defensor recebe vantagem em sua próxima ação ofensiva.', incident: 'Vantagem na próxima ação ofensiva', target: 'self' }),
        Object.freeze({
            min: 8,
            max: 8,
            title: 'Oponente exposto',
            description: 'Escolha: o oponente fica Desequilibrado ou perde sua próxima reação.',
            target: 'other',
            choices: Object.freeze([
                Object.freeze({ id: 'unbalanced', label: 'Deixar Desequilibrado', condition: '⚖️', conditionTurns: 1 }),
                Object.freeze({ id: 'lose-reaction', label: 'Remover a próxima reação', incident: 'Perde a próxima reação' })
            ])
        }),
        Object.freeze({
            min: 9,
            max: 9,
            title: 'Queda ou impacto',
            description: 'Escolha: o oponente fica Caído ou sofre 1d6 de dano de impacto.',
            target: 'other',
            choices: Object.freeze([
                Object.freeze({ id: 'knockdown', label: 'Derrubar o oponente', condition: '🧎' }),
                Object.freeze({ id: 'impact-damage', label: 'Causar 1d6 de impacto', extraDice: '1d6', extraLabel: 'Dano de impacto', targetDamage: true })
            ])
        }),
        Object.freeze({ min: 10, max: 10, title: 'Esquiva perfeita', description: 'O defensor se reposiciona livremente e recebe um ataque imediato com vantagem.', incident: 'Reposicionamento livre · ataque imediato com vantagem', target: 'self' })
    ])
});

const CRITICAL_WOUND_RESOURCE_EFFECTS = Object.freeze({
    'simple-cracked-ribs': Object.freeze({
        treated: Object.freeze({ carryingFlat: -10 })
    }),
    'simple-twisted-leg': Object.freeze({
        normal: Object.freeze({ movementMultiplier: 0.5 }),
        stabilized: Object.freeze({ movementMultiplier: 0.75 })
    }),
    'complicated-fractured-leg': Object.freeze({
        normal: Object.freeze({ movementFlat: -3 }),
        stabilized: Object.freeze({ movementFlat: -2 }),
        treated: Object.freeze({ movementFlat: -1 })
    }),
    'difficult-hole-in-chest': Object.freeze({
        normal: Object.freeze({ movementFlat: -3 }),
        stabilized: Object.freeze({ movementFlat: -2 }),
        treated: Object.freeze({ movementFlat: -1 })
    }),
    'difficult-open-leg-fracture': Object.freeze({
        normal: Object.freeze({ movementMultiplier: 0.25 }),
        stabilized: Object.freeze({ movementMultiplier: 0.5 }),
        treated: Object.freeze({ movementFlat: -2 })
    }),
    'deadly-severed-leg': Object.freeze({
        normal: Object.freeze({ movementMultiplier: 0.25 }),
        stabilized: Object.freeze({ movementMultiplier: 0.25 }),
        treated: Object.freeze({ movementMultiplier: 0.25 })
    }),
    'deadly-heart-damage': Object.freeze({
        normal: Object.freeze({ stMultiplier: 0.25, movementMultiplier: 0.25 }),
        stabilized: Object.freeze({ stMultiplier: 0.5, movementMultiplier: 0.5 })
    }),
    'deadly-septic-shock': Object.freeze({
        normal: Object.freeze({ stMultiplier: 0.25 }),
        stabilized: Object.freeze({ stMultiplier: 0.5 }),
        treated: Object.freeze({ stFlat: -5 })
    })
});

const CRITICAL_WOUND_SKILL_MULTIPLIERS = Object.freeze({
    'difficult-open-leg-fracture': Object.freeze({
        normal: Object.freeze({ athletics: 0.25, reflex_dodge: 0.25 }),
        stabilized: Object.freeze({ athletics: 0.5, reflex_dodge: 0.5 })
    }),
    'deadly-severed-leg': Object.freeze({
        normal: Object.freeze({ athletics: 0.25, reflex_dodge: 0.25 }),
        stabilized: Object.freeze({ athletics: 0.25, reflex_dodge: 0.25 }),
        treated: Object.freeze({ athletics: 0.25, reflex_dodge: 0.25 })
    })
});

const CRITICAL_WOUND_ATTRIBUTE_MULTIPLIERS = Object.freeze({
    'deadly-heart-damage': Object.freeze({
        normal: Object.freeze({ constitution: 0.25 }),
        stabilized: Object.freeze({ constitution: 0.5 })
    })
});

const CRITICAL_WOUND_EQUIPMENT_RESTRICTIONS = Object.freeze({
    'difficult-open-arm-fracture': Object.freeze({ normal: true, stabilized: true }),
    'deadly-severed-arm': Object.freeze({ normal: true, stabilized: true, treated: true })
});

const CRITICAL_WOUND_BLOCKED_EQUIPMENT_SLOTS = Object.freeze({
    'deadly-severed-arm': Object.freeze({ normal: Object.freeze(['arms']), stabilized: Object.freeze(['arms']), treated: Object.freeze(['arms']) }),
    'deadly-severed-leg': Object.freeze({ normal: Object.freeze(['legs']), stabilized: Object.freeze(['legs']), treated: Object.freeze(['legs']) })
});

const CRITICAL_TREATMENT_METHODS = Object.freeze({
    first_aid: Object.freeze({ id: 'first_aid', name: 'Primeiros Socorros', kind: 'general' }),
    healing_hands: Object.freeze({ id: 'doctor_maos_curativas', name: 'Mãos Curativas', kind: 'professional' }),
    assisted: Object.freeze({ id: 'assisted', name: 'Item, magia ou outro auxílio', kind: 'manual' })
});

const expandedCriticalWoundPanels = new Set();
const expandedCombatConsequencePanels = new Set();
let pendingCriticalDamage = null;
let pendingCombatRollOutcome = null;
let pendingCriticalTreatment = null;

function escapeCriticalHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getCriticalSeverity(margin) {
    const value = Math.max(0, Math.floor(Number(margin) || 0));
    return [...CRITICAL_SEVERITIES].reverse().find(severity => value >= severity.minMargin) || null;
}

function getCriticalWoundsFor(severityId, region) {
    return CRITICAL_WOUNDS.filter(wound => wound.severity === severityId && wound.region === region);
}

function getCriticalWound(woundId) {
    return CRITICAL_WOUNDS.find(wound => wound.id === woundId) || null;
}

function getCriticalWoundSkillModifier(combatant, skill, professional = false, skillTotal = 0, breakdown = null) {
    const activeWounds = Array.isArray(combatant?.criticalWounds)
        ? combatant.criticalWounds.filter(instance => instance.state !== 'cured')
        : [];
    const details = [];
    let total = 0;
    let multiplier = 1;

    activeWounds.forEach(instance => {
        const wound = getCriticalWound(instance.woundId);
        const state = instance.state || 'normal';
        const penalties = CRITICAL_WOUND_PENALTIES[instance.woundId]?.[state];
        if (!wound) return;

        const woundMultiplier = Number(CRITICAL_WOUND_SKILL_MULTIPLIERS[instance.woundId]?.[state]?.[skill?.id]);
        if (Number.isFinite(woundMultiplier) && woundMultiplier > 0) {
            multiplier = Math.min(multiplier, woundMultiplier);
        }
        if (!penalties) return;

        const allPenalty = Number(penalties.all) || 0;
        const skillPenalty = Number(penalties.skills?.[skill?.id]) || 0;
        const attributePenalty = professional
            ? 0
            : Number(penalties.attributes?.[skill?.attributeId]) || 0;
        const woundTotal = allPenalty + skillPenalty + attributePenalty;
        if (!woundTotal) return;

        total += woundTotal;
        details.push(`${wound.name}: ${woundTotal}`);
    });

    if (!professional && skill?.attributeId) {
        const attributeEffect = activeWounds.reduce((strongest, instance) => {
            const state = instance.state || 'normal';
            const attributeMultiplier = Number(
                CRITICAL_WOUND_ATTRIBUTE_MULTIPLIERS[instance.woundId]?.[state]?.[skill.attributeId]
            );
            if (!Number.isFinite(attributeMultiplier) || attributeMultiplier >= strongest.multiplier) return strongest;
            return { multiplier: attributeMultiplier, woundId: instance.woundId };
        }, { multiplier: 1, woundId: '' });
        if (attributeEffect.multiplier < 1) {
            const model = window.characterSheetModel;
            const attributeTotal = model?.getCharacterAttributeTotal?.(skill.attributeId, combatant?.attributes);
            const baseModifier = Number.isFinite(Number(breakdown?.attributeModifier))
                ? Number(breakdown.attributeModifier)
                : model?.getCharacterAttributeModifier?.(skill.attributeId, combatant?.attributes);
            if (Number.isFinite(Number(attributeTotal)) && Number.isFinite(Number(baseModifier))) {
                const reducedTotal = Math.floor(Number(attributeTotal) * attributeEffect.multiplier);
                const reducedModifier = Math.floor(Math.max(0, reducedTotal - 10) / 2);
                const attributePenalty = reducedModifier - Number(baseModifier);
                if (attributePenalty) {
                    total += attributePenalty;
                    details.push(`${getCriticalWound(attributeEffect.woundId)?.name || 'Ferimento'}: atributo em ${attributeEffect.multiplier === 0.25 ? '1/4' : '1/2'} (${attributePenalty})`);
                }
            }
        }
    }

    if (multiplier < 1) {
        const base = Math.max(0, Number(skillTotal) || 0);
        const multiplierPenalty = Math.floor(base * multiplier) - base;
        total += multiplierPenalty;
        details.push(`limite do ferimento: ${multiplier === 0.25 ? '1/4' : '1/2'} (${multiplierPenalty})`);
    }

    return { total, details, multiplier };
}

function getCriticalBodyMultiplier(combatant, region) {
    const standard = CRITICAL_REGION_INFO[region]?.multiplier || 1;
    if (region !== 'head') return standard;

    const hasSkullFracture = (combatant?.criticalWounds || []).some(instance =>
        instance.woundId === 'difficult-skull-fracture' && instance.state !== 'cured'
    );
    return hasSkullFracture ? 4 : standard;
}

function calculateCriticalDamage(baseDamage, region, severityOrMargin, bodyMultiplierOverride = null) {
    const base = Math.max(0, Math.floor(Number(baseDamage) || 0));
    const regionInfo = CRITICAL_REGION_INFO[region] || CRITICAL_REGION_INFO.torso;
    const severity = typeof severityOrMargin === 'object'
        ? severityOrMargin
        : getCriticalSeverity(severityOrMargin);
    const hasMultiplierOverride = bodyMultiplierOverride !== null &&
        bodyMultiplierOverride !== undefined &&
        Number.isFinite(Number(bodyMultiplierOverride));
    const bodyMultiplier = hasMultiplierOverride
        ? Math.max(0, Number(bodyMultiplierOverride))
        : regionInfo.multiplier;
    const doubledDamage = base * 2;
    const localizedDamage = Math.floor(doubledDamage * bodyMultiplier);
    const woundBonus = Math.max(0, Number(severity?.bonusDamage) || 0);

    return {
        baseDamage: base,
        doubledDamage,
        bodyMultiplier,
        localizedDamage,
        woundBonus,
        finalDamage: localizedDamage + woundBonus
    };
}

function getCombatRollSkillGroup(skillId) {
    return Object.entries(COMBAT_ROLL_SKILL_GROUPS)
        .find(([, skillIds]) => skillIds.includes(String(skillId)))?.[0] || null;
}

function getCombatRollOutcomeContext(skillId, naturalRoll) {
    const group = getCombatRollSkillGroup(skillId);
    const roll = Number(naturalRoll);
    if (!group || (roll !== 1 && roll !== 20)) return null;

    if (roll === 1) {
        const tableId = group === 'meleeAttack'
            ? 'meleeAttackFumble'
            : group === 'rangedAttack'
                ? 'rangedAttackFumble'
                : group === 'block'
                    ? 'blockFumble'
                    : 'dodgeFumble';
        return { group, kind: 'fumble', tableId, title: 'Vacilo de combate', icon: '💢' };
    }

    if (group === 'block' || group === 'dodge') {
        return {
            group,
            kind: 'defense-critical',
            tableId: group === 'block' ? 'blockCritical' : 'dodgeCritical',
            title: 'Crítico de defesa',
            icon: '🛡️'
        };
    }

    if (group === 'meleeAttack' || group === 'rangedAttack') {
        return {
            group,
            kind: 'attack-critical',
            tableId: null,
            title: 'Ataque crítico preparado',
            icon: '💥'
        };
    }

    return null;
}

function getPreparedAttackCritical(combatant) {
    const prepared = combatant?.preparedCriticalAttack;
    if (!prepared || typeof prepared !== 'object') return null;
    if (!['meleeAttack', 'rangedAttack'].includes(prepared.group)) return null;
    return prepared;
}

function syncPreparedAttackCriticalFromSkillTest(combatant, skill, result) {
    const group = getCombatRollSkillGroup(skill?.id);
    if (!combatant || !['meleeAttack', 'rangedAttack'].includes(group)) {
        return { status: 'ignored', prepared: null };
    }

    const previous = getPreparedAttackCritical(combatant);
    const preparesCritical = Number(result?.naturalRoll) === 20 && result?.success === true;
    if (!preparesCritical) {
        if (previous) delete combatant.preparedCriticalAttack;
        return { status: previous ? 'cleared' : 'unchanged', prepared: null, previous };
    }

    const adrenalineAfter = Math.max(0, Number(combatant.progression?.adrenaline) || 0);
    const prepared = {
        id: `prepared-critical-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sourceId: String(combatant.id),
        skillId: String(skill.id),
        skillName: String(skill.name || skill.id),
        group,
        naturalRoll: 20,
        margin: Math.max(0, Math.floor(Number(result.margin) || 0)),
        defenseTarget: Math.max(0, Number(result.target) || 0),
        finalResult: Math.max(0, Number(result.finalResult) || 0),
        adrenalineAlreadyGranted: true,
        adrenalineBefore: Math.max(0, adrenalineAfter - 1),
        adrenalineAfter,
        createdAt: new Date().toISOString()
    };
    combatant.preparedCriticalAttack = prepared;
    return { status: 'prepared', prepared, previous };
}

function getCombatRollOutcome(tableId, roll) {
    const value = Math.min(10, Math.max(1, Math.floor(Number(roll) || 0)));
    return (COMBAT_ROLL_OUTCOME_TABLES[tableId] || [])
        .find(outcome => value >= outcome.min && value <= outcome.max) || null;
}

function rollCriticalDice(expression, random = Math.random) {
    const match = String(expression || '').trim().match(/^(\d+)d(\d+)$/i);
    if (!match) return null;
    const count = Math.max(1, Number(match[1]) || 1);
    const sides = Math.max(2, Number(match[2]) || 2);
    const rolls = Array.from({ length: count }, () => Math.floor(random() * sides) + 1);
    return { expression: `${count}d${sides}`, rolls, total: rolls.reduce((sum, value) => sum + value, 0) };
}

function getCriticalWoundResourceModifiers(combatant) {
    const activeWounds = Array.isArray(combatant?.criticalWounds)
        ? combatant.criticalWounds.filter(instance => (instance.state || 'normal') !== 'cured')
        : [];
    const result = {
        stMultiplier: 1,
        movementMultiplier: 1,
        stFlat: 0,
        movementFlat: 0,
        carryingFlat: 0,
        reasons: []
    };

    activeWounds.forEach(instance => {
        const state = instance.state || 'normal';
        const effect = CRITICAL_WOUND_RESOURCE_EFFECTS[instance.woundId]?.[state];
        const wound = getCriticalWound(instance.woundId);
        if (!effect || !wound) return;

        if (Number.isFinite(Number(effect.stMultiplier))) {
            result.stMultiplier = Math.min(result.stMultiplier, Number(effect.stMultiplier));
        }
        if (Number.isFinite(Number(effect.movementMultiplier))) {
            result.movementMultiplier = Math.min(result.movementMultiplier, Number(effect.movementMultiplier));
        }
        result.stFlat += Number(effect.stFlat) || 0;
        result.movementFlat += Number(effect.movementFlat) || 0;
        result.carryingFlat += Number(effect.carryingFlat) || 0;
        result.reasons.push(wound.name);
    });

    return result;
}

function applyCriticalWoundDerivedModifiers(combatant, derived) {
    if (!derived || typeof derived !== 'object') return derived;
    const modifiers = getCriticalWoundResourceModifiers(combatant);
    const baseSt = Math.max(0, Number(derived.stMaximum) || 0);
    const baseMovement = Math.max(0, Number(derived.movement) || 0);
    const baseCarrying = Math.max(0, Number(derived.carryingCapacity) || 0);
    const stMaximum = Math.max(0, Math.floor((baseSt * modifiers.stMultiplier) + modifiers.stFlat));
    const movement = Math.max(1, Math.floor((baseMovement * modifiers.movementMultiplier) + modifiers.movementFlat));
    const carryingCapacity = Math.max(0, baseCarrying + modifiers.carryingFlat);

    return {
        ...derived,
        stMaximum,
        movement,
        carryingCapacity,
        criticalWoundModifiers: {
            ...modifiers,
            baseStMaximum: baseSt,
            baseMovement,
            baseCarryingCapacity: baseCarrying
        }
    };
}

function hasUnusableArmFromCriticalWound(combatant) {
    return (combatant?.criticalWounds || []).some(instance => {
        const state = instance.state || 'normal';
        return state !== 'cured' && Boolean(CRITICAL_WOUND_EQUIPMENT_RESTRICTIONS[instance.woundId]?.[state]);
    });
}

function getCriticalWoundBlockedEquipmentSlots(combatant) {
    const blocked = new Set();

    (combatant?.criticalWounds || []).forEach(instance => {
        const state = instance.state || 'normal';
        if (state === 'cured') return;
        (CRITICAL_WOUND_BLOCKED_EQUIPMENT_SLOTS[instance.woundId]?.[state] || [])
            .forEach(slot => blocked.add(slot));
    });

    return [...blocked];
}

function getCriticalEquipmentSlotRestriction(combatant, slot) {
    const normalizedSlot = String(slot || '').toLocaleLowerCase('en-US');
    if (!getCriticalWoundBlockedEquipmentSlots(combatant).includes(normalizedSlot)) return '';

    const label = normalizedSlot === 'arms' ? 'braços' : 'pernas';
    return `${combatant?.name || 'O participante'} possui uma amputação sem prótese e não pode equipar proteção de ${label}.`;
}

function syncCriticalWoundResourceLimits(combatant) {
    if (!combatant) return null;

    if (combatant.creationMode === 'full' && typeof window.refreshCharacterDerivedValues === 'function') {
        return window.refreshCharacterDerivedValues(combatant, { persist: false });
    }

    const modifiers = getCriticalWoundResourceModifiers(combatant);
    const hasResourcePenalty = modifiers.stMultiplier !== 1 || modifiers.movementMultiplier !== 1 || modifiers.stFlat !== 0 || modifiers.movementFlat !== 0 || modifiers.carryingFlat !== 0;
    const storedBase = combatant.criticalWoundBaseResources;

    if (!hasResourcePenalty) {
        if (storedBase) {
            combatant.stMax = Math.max(0, Number(storedBase.stMax) || 0);
            combatant.movement = Math.max(0, Number(storedBase.movement) || 0);
            combatant.carryingCapacity = Math.max(0, Number(storedBase.carryingCapacity) || 0);
            combatant.stCurrent = Math.min(combatant.stMax, Math.max(0, Number(combatant.stCurrent) || 0));
            delete combatant.criticalWoundBaseResources;
        }
        return modifiers;
    }

    if (!storedBase) {
        combatant.criticalWoundBaseResources = {
            stMax: Math.max(0, Number(combatant.stMax) || 0),
            movement: Math.max(0, Number(combatant.movement) || 0),
            carryingCapacity: Math.max(0, Number(combatant.carryingCapacity) || 0)
        };
    }

    const base = combatant.criticalWoundBaseResources;
    combatant.stMax = Math.max(0, Math.floor((base.stMax * modifiers.stMultiplier) + modifiers.stFlat));
    combatant.movement = Math.max(1, Math.floor((base.movement * modifiers.movementMultiplier) + modifiers.movementFlat));
    combatant.carryingCapacity = Math.max(0, base.carryingCapacity + modifiers.carryingFlat);
    combatant.stCurrent = Math.min(combatant.stMax, Math.max(0, Number(combatant.stCurrent) || 0));
    return modifiers;
}

function getCriticalWoundImpactLines(instance, wound) {
    if (!instance || !wound || (instance.state || 'normal') === 'cured') return [];
    const state = instance.state || 'normal';
    const lines = [];
    const resource = CRITICAL_WOUND_RESOURCE_EFFECTS[instance.woundId]?.[state];

    if (resource?.stMultiplier === 0.25) lines.push('EST máximo reduzido a 1/4');
    else if (resource?.stMultiplier === 0.5) lines.push('EST máximo reduzido à metade');
    if (resource?.stFlat) lines.push(`${resource.stFlat} no EST máximo`);
    if (resource?.movementFlat) lines.push(`${resource.movementFlat} no Movimento`);
    if (resource?.carryingFlat) lines.push(`${resource.carryingFlat} na Capacidade de Carga`);
    if (resource?.movementMultiplier === 0.25) lines.push('Movimento reduzido a 1/4');
    else if (resource?.movementMultiplier === 0.5) lines.push('Movimento reduzido à metade');
    else if (resource?.movementMultiplier === 0.75) lines.push('Movimento reduzido em 1/4');
    if (instance.woundId === 'deadly-heart-damage' && state === 'normal') lines.push('Constituição considerada em 1/4 nos testes');
    else if (instance.woundId === 'deadly-heart-damage' && state === 'stabilized') lines.push('Constituição considerada pela metade nos testes');
    if (CRITICAL_WOUND_EQUIPMENT_RESTRICTIONS[instance.woundId]?.[state]) {
        lines.push('Um braço inutilizado · armas de duas mãos bloqueadas');
    }
    if (instance.details?.teethLost) lines.push(`${instance.details.teethLost} dente${instance.details.teethLost === 1 ? '' : 's'} perdido${instance.details.teethLost === 1 ? '' : 's'}`);
    if (instance.check?.label) lines.push(instance.check.label);
    if (instance.woundId === 'difficult-hole-in-chest' && state === 'normal') lines.push('Sufocando · resolver a cada turno');
    if (instance.woundId === 'deadly-heart-damage' && state === 'normal') lines.push('Teste de resistência à Morte pendente');
    return lines;
}

function addCombatConsequence(combatant, consequence) {
    if (!combatant || !consequence?.title) return null;
    combatant.combatConsequences ||= [];
    const entry = {
        id: `consequence-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: consequence.title,
        description: consequence.description || '',
        sourceId: String(consequence.sourceId || ''),
        createdRound: typeof round !== 'undefined' ? round : 1,
        createdAt: new Date().toISOString()
    };
    combatant.combatConsequences.push(entry);
    return entry;
}

function applyCombatOutcomeCondition(target, icon, sourceToken) {
    if (!target || !icon) return '';
    return ensureCriticalCondition(target, icon, sourceToken || `combat-outcome-${Date.now()}`);
}

function getCriticalModal() {
    return document.getElementById('criticalDamageModal');
}

function getCriticalContent() {
    return document.getElementById('criticalDamageContent');
}

function getCombatOutcomeTargetOptions(actor) {
    return (typeof combatants !== 'undefined' ? combatants : [])
        .filter(combatant => String(combatant.id) !== String(actor?.id) && Number(combatant.hpCurrent) > 0);
}

function openCombatRollOutcomeFlow(payload = {}) {
    const actor = combatants.find(combatant => String(combatant.id) === String(payload.combatantId));
    const context = getCombatRollOutcomeContext(payload.skillId, payload.naturalRoll);
    const modal = getCriticalModal();
    if (!actor || !context || !modal) return false;

    pendingCriticalDamage = null;
    pendingCombatRollOutcome = {
        actorId: String(actor.id),
        actorName: actor.name,
        skillId: String(payload.skillId),
        skillName: String(payload.skillName || payload.skillId),
        naturalRoll: Number(payload.naturalRoll),
        ...context
    };

    const title = document.getElementById('criticalDamageTitle');
    if (title) title.textContent = context.title;
    modal.style.display = 'flex';
    renderCombatRollOutcomeChoice();
    return true;
}

function renderCombatRollOutcomeChoice() {
    const content = getCriticalContent();
    const flow = pendingCombatRollOutcome;
    if (!content || !flow) return;

    content.innerHTML = `
        <div class="critical-context">
            <span>${escapeCriticalHtml(flow.actorName)}</span>
            <strong>${escapeCriticalHtml(flow.icon)}</strong>
            <span>${escapeCriticalHtml(flow.skillName)}</span>
        </div>
        <div class="critical-rule-summary">
            <strong>${flow.kind === 'fumble' ? 'Resultado natural 1' : 'Resultado natural 20'}</strong>
            <span>Resolva a tabela contextual com 1d10. Esta etapa não adiciona controles permanentes ao pad.</span>
        </div>
        <button type="button" class="critical-primary-button" onclick="rollCombatRollOutcome()">🎲 Rolar 1d10 agora</button>
        <label class="critical-field">
            <span>Ou informe o resultado do d10</span>
            <input id="combatOutcomeRollInput" type="number" min="1" max="10" inputmode="numeric" placeholder="1 a 10">
        </label>
        <button type="button" class="critical-secondary-button" onclick="submitCombatRollOutcome()">Continuar com o valor informado</button>
    `;
}

function rollCombatRollOutcome(random = Math.random) {
    const result = rollCriticalDice('1d10', random);
    if (!result) return;
    resolveCombatRollOutcome(result.total);
}

function submitCombatRollOutcome() {
    const input = document.getElementById('combatOutcomeRollInput');
    const value = Number(input?.value);
    if (!Number.isInteger(value) || value < 1 || value > 10) {
        showToast('Informe um resultado entre 1 e 10.');
        input?.focus();
        return;
    }
    resolveCombatRollOutcome(value);
}

function resolveCombatRollOutcome(value) {
    if (!pendingCombatRollOutcome) return;
    const roll = Math.min(10, Math.max(1, Math.floor(Number(value) || 0)));
    const outcome = getCombatRollOutcome(pendingCombatRollOutcome.tableId, roll);
    if (!outcome) return;
    pendingCombatRollOutcome.roll = roll;
    pendingCombatRollOutcome.outcome = outcome;
    pendingCombatRollOutcome.choiceId = outcome.choices?.[0]?.id || '';
    renderCombatRollOutcomeReview();
}

function getCombatOutcomeResolution(flow = pendingCombatRollOutcome) {
    const outcome = flow?.outcome;
    if (!outcome) return null;
    const choice = (outcome.choices || []).find(entry => entry.id === flow.choiceId)
        || outcome.choices?.[0]
        || null;
    return choice ? { ...outcome, ...choice, choice } : { ...outcome, choice: null };
}

function setCombatOutcomeChoice(choiceId) {
    if (!pendingCombatRollOutcome?.outcome?.choices?.some(choice => choice.id === choiceId)) return;
    pendingCombatRollOutcome.choiceId = choiceId;
    renderCombatRollOutcomeReview();
}

function rollCombatOutcomeExtra(random = Math.random) {
    const expression = getCombatOutcomeResolution()?.extraDice;
    const result = rollCriticalDice(expression, random);
    const input = document.getElementById('combatOutcomeExtraInput');
    if (input && result) input.value = String(result.total);
}

function renderCombatRollOutcomeReview() {
    const content = getCriticalContent();
    const flow = pendingCombatRollOutcome;
    const outcome = flow?.outcome;
    const resolution = getCombatOutcomeResolution(flow);
    const actor = combatants.find(combatant => String(combatant.id) === String(flow?.actorId));
    if (!content || !flow || !outcome || !resolution || !actor) return;

    const possibleTargets = outcome.target === 'other' ? getCombatOutcomeTargetOptions(actor) : [];
    const preferredTarget = possibleTargets.find(entry => String(entry.id) === String(selectedId)) || possibleTargets[0];
    const retainedTarget = possibleTargets.find(entry => String(entry.id) === String(flow.targetId));
    flow.targetId = outcome.target === 'other'
        ? String(retainedTarget?.id || preferredTarget?.id || '')
        : String(actor.id);

    content.innerHTML = `
        <div class="critical-severity-banner ${flow.kind === 'fumble' ? 'critical-severity-difficult' : 'critical-severity-simple'}">
            <span>${flow.icon} d10 = ${flow.roll}</span>
            <strong>${escapeCriticalHtml(outcome.title)}</strong>
        </div>
        <article class="critical-review-wound">
            <strong>${escapeCriticalHtml(outcome.title)}</strong>
            <p>${escapeCriticalHtml(outcome.description)}</p>
        </article>
        ${outcome.choices?.length ? `
            <div class="critical-outcome-choices" role="group" aria-label="Escolha o efeito aplicado">
                ${outcome.choices.map(choice => `
                    <button
                        type="button"
                        class="critical-wound-choice ${choice.id === flow.choiceId ? 'is-selected' : ''}"
                        onclick="setCombatOutcomeChoice('${escapeCriticalHtml(choice.id)}')"
                    >
                        <strong>${choice.id === flow.choiceId ? '✓ ' : ''}${escapeCriticalHtml(choice.label)}</strong>
                    </button>
                `).join('')}
            </div>
        ` : ''}
        ${outcome.target === 'other' ? `
            <label class="critical-field">
                <span>Participante afetado</span>
                <select id="combatOutcomeTargetSelect" onchange="setCombatOutcomeTarget(this.value)">
                    ${possibleTargets.length
                        ? possibleTargets.map(target => `<option value="${escapeCriticalHtml(target.id)}" ${String(target.id) === flow.targetId ? 'selected' : ''}>${escapeCriticalHtml(target.name)}</option>`).join('')
                        : '<option value="">Nenhum outro participante disponível</option>'}
                </select>
            </label>
        ` : ''}
        ${resolution.extraDice ? `
            <label class="critical-field">
                <span>${escapeCriticalHtml(resolution.extraLabel || `Resultado de ${resolution.extraDice}`)}</span>
                <div class="critical-inline-roll">
                    <input id="combatOutcomeExtraInput" type="number" min="0" inputmode="numeric" placeholder="Informe o resultado">
                    <button type="button" onclick="rollCombatOutcomeExtra()">🎲 Rolar</button>
                </div>
            </label>
        ` : ''}
        <button type="button" class="critical-confirm-button" onclick="applyCombatRollOutcome()">Aplicar resultado</button>
        <button type="button" class="critical-back-button" onclick="renderCombatRollOutcomeChoice()">← Alterar d10</button>
    `;
}

function setCombatOutcomeTarget(targetId) {
    if (pendingCombatRollOutcome) pendingCombatRollOutcome.targetId = String(targetId || '');
}

function applyCombatRollOutcome() {
    const flow = pendingCombatRollOutcome;
    const outcome = flow?.outcome;
    const resolution = getCombatOutcomeResolution(flow);
    const actor = combatants.find(combatant => String(combatant.id) === String(flow?.actorId));
    const selectedTargetId = document.getElementById('combatOutcomeTargetSelect')?.value || flow?.targetId;
    const target = outcome?.target === 'other'
        ? combatants.find(combatant => String(combatant.id) === String(selectedTargetId))
        : actor;
    if (!flow || !outcome || !resolution || !actor || !target) {
        showToast('Selecione o participante afetado para aplicar este resultado.');
        return;
    }

    const extraInput = document.getElementById('combatOutcomeExtraInput');
    const extraValue = resolution.extraDice ? Number(extraInput?.value) : 0;
    if (resolution.extraDice && (!extraInput?.value.trim() || !Number.isFinite(extraValue) || extraValue < 0)) {
        showToast(`Informe ou role ${resolution.extraDice}.`);
        extraInput?.focus();
        return;
    }

    const sourceToken = `combat-outcome-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const conditions = [...new Set([resolution.condition, ...(resolution.conditions || [])].filter(Boolean))];
    const details = [
        `${flow.kind === 'fumble' ? 'Vacilo' : 'Crítico de defesa'}: ${flow.skillName}`,
        `Tabela: d10 = ${flow.roll}`,
        `Resultado: ${outcome.title}`,
        ...(resolution.choice ? [`Escolha aplicada: ${resolution.choice.label}`] : []),
        outcome.description
    ];
    let appliedDamage = 0;
    let ammunitionResult = null;
    let weaponWearResult = null;
    let unusableWeapon = null;
    let disarmResult = null;
    let damageResolution = null;

    const mutate = () => {
        conditions.forEach(icon => {
            applyCombatOutcomeCondition(target, icon, sourceToken);
            if (icon === resolution.condition && Number(resolution.conditionTurns) > 0) {
                const applied = target.effects?.find(effect => effect.type === 'condition' && effect.id === icon);
                if (applied) {
                    applied.remainingTurns = Math.max(Number(applied.remainingTurns) || 0, resolution.conditionTurns);
                    applied.initialTurns = Math.max(Number(applied.initialTurns) || 0, resolution.conditionTurns);
                }
            }
        });

        const damageTarget = resolution.selfDamage ? actor : resolution.targetDamage ? target : null;
        if (damageTarget && extraValue > 0) {
            const beforeHp = Math.max(0, Number(damageTarget.hpCurrent) || 0);
            const automated = window.resolveAutomatedDamage?.(damageTarget, Math.floor(extraValue))
                || { remainingDamage: Math.floor(extraValue), message: '' };
            damageTarget.hpCurrent = Math.max(0, beforeHp - automated.remainingDamage);
            appliedDamage = beforeHp - damageTarget.hpCurrent;
            damageResolution = {
                targetName: damageTarget.name,
                requested: Math.floor(extraValue),
                applied: appliedDamage,
                absorption: automated.message || ''
            };
            if (beforeHp > 0 && damageTarget.hpCurrent === 0) {
                damageTarget.deathSaves = { success: 0, failures: 0 };
                damageTarget.stabilized = false;
            }
        }

        if (resolution.weaponWear && extraValue > 0) {
            weaponWearResult = window.applyActiveWeaponDurabilityDamage?.(actor, Math.floor(extraValue)) || null;
        }
        if (resolution.weaponUnusable) {
            unusableWeapon = window.markActiveWeaponUnusable?.(actor) || null;
        }
        if (resolution.consumeAmmo) {
            ammunitionResult = window.consumeActiveAmmunitionForOutcome?.(actor, 1) || null;
        }
        if (resolution.disarm) {
            disarmResult = window.disarmActiveWeapon?.(target) || null;
        }
        if (resolution.incident) {
            const incidentTarget = resolution.incidentTarget === 'actor' ? actor : target;
            addCombatConsequence(incidentTarget, {
                title: outcome.title,
                description: `${resolution.incident}${resolution.extraDice ? ` · ${resolution.extraLabel || resolution.extraDice}: ${extraValue}` : ''}`,
                sourceId: actor.id
            });
        }

        savePlayersToStorage();
        renderList(false);
    };

    const detailFactory = () => {
        if (conditions.length) details.push(`Condições: ${conditions.map(icon => conditionDescriptions?.[icon]?.title || icon).join(', ')}`);
        if (resolution.extraDice) details.push(`${resolution.extraLabel || resolution.extraDice}: ${extraValue}`);
        if (damageResolution) {
            details.push(`Dano aplicado em ${damageResolution.targetName}: ${damageResolution.applied}`);
            if (resolution.damageKind) details.push(`Tipo de dano: ${resolution.damageKind}`);
            if (damageResolution.absorption) details.push(`Proteção: ${damageResolution.absorption}`);
        }
        if (weaponWearResult) details.push(`${weaponWearResult.name}: desgaste ${weaponWearResult.before} → ${weaponWearResult.after}`);
        if (unusableWeapon) details.push(`${unusableWeapon.name}: inutilizável até reparo`);
        if (ammunitionResult) details.push(`${ammunitionResult.name}: ${ammunitionResult.before} → ${ammunitionResult.after}`);
        if (disarmResult) {
            details.push(`${target.name}: ${disarmResult.name} foi desequipada`);
            if (disarmResult.replacementName) details.push(`Nova arma ativa: ${disarmResult.replacementName}`);
        } else if (resolution.disarm) {
            details.push(`${target.name}: nenhuma arma equipada para derrubar`);
        }
        return details.join('\n');
    };
    const label = `${actor.name}: ${flow.kind === 'fumble' ? 'Vacilo' : 'Crítico de defesa'} — ${outcome.title}`;
    const metadataFactory = () => ({
        type: conditions.length ? 'condition' : 'effect',
        source: { id: actor.id, name: actor.name },
        target: { id: target.id, name: target.name },
        participants: [{ id: actor.id, name: actor.name }, { id: target.id, name: target.name }],
        combat: {
            tableId: flow.tableId,
            roll: flow.roll,
            outcome: outcome.title,
            choice: resolution.choice?.label || '',
            extraValue,
            appliedDamage
        }
    });

    const hasMutation = conditions.length || resolution.selfDamage || resolution.targetDamage || resolution.weaponWear || resolution.weaponUnusable || resolution.consumeAmmo || resolution.disarm || resolution.incident;
    if (hasMutation && typeof window.trackCombatAction === 'function') {
        window.trackCombatAction(label, mutate, detailFactory, metadataFactory);
    } else {
        mutate();
        window.addCombatHistoryEntry?.(label, detailFactory(), metadataFactory());
    }

    closeCriticalDamageModal();
    showToast(`${flow.icon} ${outcome.title} aplicado a ${target.name}.`);
}

function closeCriticalDamageModal() {
    const modal = getCriticalModal();
    if (modal) modal.style.display = 'none';
    pendingCriticalDamage = null;
    pendingCombatRollOutcome = null;
    const title = typeof document !== 'undefined' ? document.getElementById('criticalDamageTitle') : null;
    if (title) title.textContent = 'Crítico e ferimento';
}

function renderCriticalMarginStep() {
    const content = getCriticalContent();
    const target = combatants.find(combatant => String(combatant.id) === pendingCriticalDamage?.targetId);
    const source = combatants.find(combatant => String(combatant.id) === pendingCriticalDamage?.sourceId);
    const regionInfo = CRITICAL_REGION_INFO[pendingCriticalDamage?.bodyPart];

    if (!content || !target || !source || !regionInfo) return;
    const bodyMultiplier = getCriticalBodyMultiplier(target, pendingCriticalDamage.bodyPart);
    const initialMargin = Math.max(0, Number(pendingCriticalDamage.margin) || 0);
    const prepared = pendingCriticalDamage.preparedCritical;

    content.innerHTML = `
        <div class="critical-context">
            <span>${escapeCriticalHtml(source.name)}</span>
            <strong>→</strong>
            <span>${escapeCriticalHtml(target.name)}</span>
        </div>
        <div class="critical-rule-summary">
            <strong>${regionInfo.icon} ${escapeCriticalHtml(regionInfo.name)} ×${bodyMultiplier}</strong>
            <span>${pendingCriticalDamage.baseDamage} de dano base será dobrado e ignorará a armadura.</span>
            ${prepared ? `<span>💥 Preparado por 20 natural em ${escapeCriticalHtml(prepared.skillName)} · margem ${initialMargin} transportada.</span>` : ''}
        </div>
        <label class="critical-field">
            <span>Por quanto o ataque venceu a defesa?</span>
            <input id="criticalMarginInput" type="number" min="0" step="1" inputmode="numeric" value="${initialMargin}" oninput="updateCriticalMarginPreview(this.value)">
        </label>
        <div id="criticalMarginPreview" class="critical-margin-preview" aria-live="polite"></div>
        <button type="button" class="critical-primary-button" onclick="continueCriticalMargin()">Continuar</button>
    `;

    updateCriticalMarginPreview(initialMargin);
    document.getElementById('criticalMarginInput')?.focus();
}

function updateCriticalMarginPreview(value) {
    const preview = document.getElementById('criticalMarginPreview');
    if (!preview) return;

    const severity = getCriticalSeverity(value);
    preview.innerHTML = severity
        ? `<strong>Crítico ${escapeCriticalHtml(severity.name)}</strong><span>+${severity.bonusDamage} de dano do ferimento</span>`
        : '<strong>Margem insuficiente</strong><span>Um ferimento crítico começa com margem 7.</span>';
}

function openCriticalDamageFlow(options = {}) {
    const target = combatants.find(combatant => String(combatant.id) === String(selectedId));
    const source = combatants.find(combatant => String(combatant.id) === String(activeTurnId));
    const baseDamage = Math.max(0, Math.floor(Number(pendingDamageBase) || 0));
    const bodyPart = pendingDamageBodyPart;

    if (!target || !baseDamage || !CRITICAL_REGION_INFO[bodyPart]) {
        showToast('Não foi possível preparar o dano crítico.');
        return;
    }

    if (!source) {
        showToast('Defina o personagem do turno para receber a Adrenalina do crítico.');
        return;
    }


    const preparedCritical = getPreparedAttackCritical(source);
    const usePrepared = options.usePrepared !== false && Boolean(preparedCritical);

    pendingCriticalDamage = {
        targetId: String(target.id),
        sourceId: String(source.id),
        baseDamage,
        bodyPart,
        margin: usePrepared ? preparedCritical.margin : 7,
        severityId: '',
        woundId: '',
        selectionMode: 'manual',
        roll: '',
        preparedCritical: usePrepared ? { ...preparedCritical } : null
    };

    document.getElementById('damageTypeModal').style.display = 'none';
    const modal = getCriticalModal();
    if (modal) modal.style.display = 'flex';
    renderCriticalMarginStep();
    return true;
}

function openPreparedCriticalDamageFlow() {
    const source = combatants.find(combatant => String(combatant.id) === String(activeTurnId));
    if (!getPreparedAttackCritical(source)) return false;
    return openCriticalDamageFlow({ usePrepared: true });
}

function continueCriticalMargin() {
    if (!pendingCriticalDamage) return;

    const margin = Math.max(0, Math.floor(Number(document.getElementById('criticalMarginInput')?.value) || 0));
    const severity = getCriticalSeverity(margin);
    if (!severity) {
        if (pendingCriticalDamage.preparedCritical) {
            pendingCriticalDamage.margin = margin;
            pendingCriticalDamage.severityId = '';
            pendingCriticalDamage.woundId = '';
            renderCriticalNoWoundReviewStep();
            return;
        }
        showToast('A margem mínima para um ferimento crítico é 7.');
        return;
    }

    pendingCriticalDamage.margin = margin;
    pendingCriticalDamage.severityId = severity.id;
    renderCriticalSelectionStep();
}

function renderCriticalNoWoundReviewStep() {
    const content = getCriticalContent();
    const target = combatants.find(combatant => String(combatant.id) === pendingCriticalDamage?.targetId);
    const regionInfo = CRITICAL_REGION_INFO[pendingCriticalDamage?.bodyPart];
    const calculation = calculateCriticalDamage(
        pendingCriticalDamage?.baseDamage,
        pendingCriticalDamage?.bodyPart,
        null,
        getCriticalBodyMultiplier(target, pendingCriticalDamage?.bodyPart)
    );
    if (!content || !target || !regionInfo) return;

    content.innerHTML = `
        <div class="critical-severity-banner critical-severity-simple">
            <span>${regionInfo.icon} ${escapeCriticalHtml(regionInfo.name)} · 20 natural</span>
            <strong>Margem ${pendingCriticalDamage.margin}</strong>
        </div>
        <article class="critical-review-wound">
            <strong>Crítico sem ferimento adicional</strong>
            <p>A margem ficou abaixo de 7. O ataque ainda dobra o dano, ignora a armadura e usa o multiplicador do local, mas não aplica um ferimento da tabela.</p>
        </article>
        <div class="critical-calculation">
            <span>Dano base</span><strong>${calculation.baseDamage}</strong>
            <span>Crítico ×2</span><strong>${calculation.doubledDamage}</strong>
            <span>${escapeCriticalHtml(regionInfo.name)} ×${calculation.bodyMultiplier}</span><strong>${calculation.localizedDamage}</strong>
            <span>Ferimento crítico</span><strong>+0</strong>
            <span class="critical-total-label">Dano final · armadura ignorada</span><strong class="critical-total-value">${calculation.finalDamage}</strong>
        </div>
        <button type="button" class="critical-confirm-button" onclick="confirmCriticalDamage()">Aplicar crítico</button>
        <button type="button" class="critical-back-button" onclick="renderCriticalMarginStep()">← Alterar margem</button>
    `;
}

function renderCriticalSelectionStep() {
    const content = getCriticalContent();
    const severity = CRITICAL_SEVERITIES.find(item => item.id === pendingCriticalDamage?.severityId);
    const wounds = getCriticalWoundsFor(severity?.id, pendingCriticalDamage?.bodyPart);
    const regionInfo = CRITICAL_REGION_INFO[pendingCriticalDamage?.bodyPart];
    if (!content || !severity || !regionInfo || !wounds.length) return;

    content.innerHTML = `
        <div class="critical-severity-banner critical-severity-${severity.id}">
            <span>Crítico ${escapeCriticalHtml(severity.name)}</span>
            <strong>Margem ${pendingCriticalDamage.margin} · +${severity.bonusDamage} dano</strong>
        </div>
        <p class="critical-step-copy">${regionInfo.icon} O acerto foi em <strong>${escapeCriticalHtml(regionInfo.name)}</strong>. Escolha como definir o ferimento.</p>
        <button type="button" class="critical-primary-button" onclick="rollCriticalWound()">🎲 Sortear entre os ferimentos da região</button>
        <button type="button" class="critical-secondary-button" onclick="showCriticalWoundChoices()">☝️ Informar o ferimento manualmente</button>
        <button type="button" class="critical-back-button" onclick="renderCriticalMarginStep()">← Alterar margem</button>
    `;
}

function rollCriticalWound() {
    if (!pendingCriticalDamage) return;
    const wounds = getCriticalWoundsFor(pendingCriticalDamage.severityId, pendingCriticalDamage.bodyPart);
    if (!wounds.length) return;

    const roll = Math.floor(Math.random() * wounds.length) + 1;
    pendingCriticalDamage.woundId = wounds[roll - 1].id;
    pendingCriticalDamage.selectionMode = 'roll';
    pendingCriticalDamage.roll = wounds.length > 1 ? `1d${wounds.length}: ${roll}` : 'Resultado único da região';
    renderCriticalReviewStep();
}

function showCriticalWoundChoices() {
    const content = getCriticalContent();
    const wounds = getCriticalWoundsFor(pendingCriticalDamage?.severityId, pendingCriticalDamage?.bodyPart);
    if (!content || !wounds.length) return;

    content.innerHTML = `
        <p class="critical-step-copy">Selecione o ferimento crítico aplicado:</p>
        <div class="critical-wound-choice-list">
            ${wounds.map(wound => `
                <button type="button" class="critical-wound-choice" onclick="chooseCriticalWound('${escapeCriticalHtml(wound.id)}')">
                    <strong>${escapeCriticalHtml(wound.name)}</strong>
                    <span>${escapeCriticalHtml(wound.description)}</span>
                </button>
            `).join('')}
        </div>
        <button type="button" class="critical-back-button" onclick="renderCriticalSelectionStep()">← Voltar</button>
    `;
}

function chooseCriticalWound(woundId) {
    const wound = getCriticalWound(woundId);
    if (!pendingCriticalDamage || !wound) return;
    if (wound.severity !== pendingCriticalDamage.severityId || wound.region !== pendingCriticalDamage.bodyPart) return;

    pendingCriticalDamage.woundId = wound.id;
    pendingCriticalDamage.selectionMode = 'manual';
    pendingCriticalDamage.roll = 'Escolha manual';
    renderCriticalReviewStep();
}

function renderCriticalReviewStep() {
    const content = getCriticalContent();
    const wound = getCriticalWound(pendingCriticalDamage?.woundId);
    const severity = CRITICAL_SEVERITIES.find(item => item.id === pendingCriticalDamage?.severityId);
    const target = combatants.find(combatant => String(combatant.id) === pendingCriticalDamage?.targetId);
    const bodyMultiplier = getCriticalBodyMultiplier(target, pendingCriticalDamage?.bodyPart);
    const calculation = calculateCriticalDamage(
        pendingCriticalDamage?.baseDamage,
        pendingCriticalDamage?.bodyPart,
        severity,
        bodyMultiplier
    );
    const regionInfo = CRITICAL_REGION_INFO[pendingCriticalDamage?.bodyPart];
    if (!content || !wound || !severity || !regionInfo) return;

    const conditions = (wound.conditions || [])
        .map(icon => conditionDescriptions?.[icon]?.title || icon)
        .join(', ');

    content.innerHTML = `
        <div class="critical-severity-banner critical-severity-${severity.id}">
            <span>${regionInfo.icon} ${escapeCriticalHtml(regionInfo.name)} · Crítico ${escapeCriticalHtml(severity.name)}</span>
            <strong>${escapeCriticalHtml(pendingCriticalDamage.roll)}</strong>
        </div>
        <article class="critical-review-wound">
            <strong>${escapeCriticalHtml(wound.name)}</strong>
            <p>${escapeCriticalHtml(wound.description)}</p>
            ${conditions ? `<small>Condições automáticas: ${escapeCriticalHtml(conditions)}</small>` : ''}
            ${wound.immediateDeath ? '<small class="critical-lethal-warning">☠️ Este resultado causa morte imediata.</small>' : ''}
        </article>
        <div class="critical-calculation">
            <span>Dano base</span><strong>${calculation.baseDamage}</strong>
            <span>Crítico ×2</span><strong>${calculation.doubledDamage}</strong>
            <span>${escapeCriticalHtml(regionInfo.name)} ×${calculation.bodyMultiplier}</span><strong>${calculation.localizedDamage}</strong>
            <span>Ferimento ${escapeCriticalHtml(severity.name)}</span><strong>+${calculation.woundBonus}</strong>
            <span class="critical-total-label">Dano final · armadura ignorada</span><strong class="critical-total-value">${calculation.finalDamage}</strong>
        </div>
        <button type="button" class="critical-confirm-button" onclick="confirmCriticalDamage()">Aplicar crítico</button>
        <button type="button" class="critical-back-button" onclick="renderCriticalSelectionStep()">← Escolher outro ferimento</button>
    `;
}

function confirmCriticalDamage() {
    const flow = pendingCriticalDamage;
    const wound = getCriticalWound(flow?.woundId);
    const severity = CRITICAL_SEVERITIES.find(item => item.id === flow?.severityId);
    const withoutWound = Boolean(flow?.preparedCritical && !severity && !wound && Number(flow.margin) < 7);
    if (!flow || (!withoutWound && (!wound || !severity))) return;

    const target = combatants.find(combatant => String(combatant.id) === flow.targetId);
    const calculation = calculateCriticalDamage(
        flow.baseDamage,
        flow.bodyPart,
        severity || null,
        getCriticalBodyMultiplier(target, flow.bodyPart)
    );
    const critical = {
        sourceId: flow.sourceId,
        margin: flow.margin,
        severityId: severity?.id || '',
        severityName: severity?.name || '',
        woundId: wound?.id || '',
        woundName: wound?.name || '',
        woundDescription: wound?.description || '',
        woundBonus: calculation.woundBonus,
        doubledDamage: calculation.doubledDamage,
        localizedDamage: calculation.localizedDamage,
        finalDamage: calculation.finalDamage,
        selectionMode: flow.selectionMode,
        roll: flow.roll,
        conditions: [...(wound?.conditions || [])],
        immediateDeath: Boolean(wound?.immediateDeath),
        preparedCriticalId: flow.preparedCritical?.id || '',
        preparedFromNatural20: Boolean(flow.preparedCritical),
        preparedSkillId: flow.preparedCritical?.skillId || '',
        preparedSkillName: flow.preparedCritical?.skillName || '',
        adrenalineAlreadyGranted: Boolean(flow.preparedCritical?.adrenalineAlreadyGranted),
        adrenalineBefore: flow.preparedCritical?.adrenalineBefore,
        adrenalineAfter: flow.preparedCritical?.adrenalineAfter
    };

    closeCriticalDamageModal();
    window.applyDirectDamage?.(calculation.finalDamage, {
        baseDamage: calculation.baseDamage,
        bodyPart: flow.bodyPart,
        bodyMultiplier: calculation.bodyMultiplier,
        typeMultiplier: 2,
        armorAbsorbed: 0,
        ignoredArmor: true,
        critical
    });
}

function createCriticalWoundInstance(wound, critical) {
    const instance = {
        instanceId: `critical-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        woundId: wound.id,
        severityId: wound.severity,
        region: wound.region,
        state: 'normal',
        sourceId: String(critical.sourceId || ''),
        margin: Math.max(0, Number(critical.margin) || 0),
        appliedAt: new Date().toISOString()
    };

    if (wound.id === 'complicated-lost-teeth') {
        instance.details = { teethLost: rollCriticalDice('1d10')?.total || 1 };
    }
    if (wound.id === 'complicated-ruptured-spleen') {
        instance.check = {
            kind: 'stun-resistance',
            elapsedTurns: 0,
            interval: 5,
            label: 'Teste de Atordoamento a cada 5 rodadas'
        };
    }
    if (wound.id === 'difficult-concussion') {
        const interval = rollCriticalDice('1d6')?.total || 1;
        instance.check = {
            kind: 'stun-resistance',
            elapsedTurns: 0,
            interval,
            label: `Próximo teste de Atordoamento em ${interval} rodada${interval === 1 ? '' : 's'}`
        };
    }
    if (wound.id === 'deadly-heart-damage') {
        instance.check = {
            kind: 'death-resistance',
            pending: true,
            label: 'Teste imediato de resistência à Morte'
        };
    }

    return instance;
}

function ensureCriticalCondition(target, icon, woundInstanceId) {
    target.effects ||= [];
    const data = conditionDescriptions?.[icon];
    if (!data) return '';

    let effect = target.effects.find(current => current.type === 'condition' && current.id === icon);
    if (!effect) {
        effect = {
            id: icon,
            type: 'condition',
            name: data.title,
            remainingTurns: data.active,
            initialTurns: data.active,
            stacks: 0,
            maxStacks: data.stack,
            augment: data.augment,
            automation: {
                criticalWoundOnly: true,
                criticalWoundBaseStacks: 0,
                criticalWoundSources: []
            }
        };
        target.effects.push(effect);
    }

    effect.automation ||= {};
    if (!Array.isArray(effect.automation.criticalWoundSources)) {
        effect.automation.criticalWoundSources = [];
        effect.automation.criticalWoundBaseStacks = Math.max(0, Number(effect.stacks) || 0);
        effect.automation.criticalWoundOnly = false;
    }

    if (!effect.automation.criticalWoundSources.includes(woundInstanceId)) {
        effect.automation.criticalWoundSources.push(woundInstanceId);
        effect.stacks = Math.min(
            Math.max(1, Number(effect.maxStacks) || 1),
            Math.max(0, Number(effect.stacks) || 0) + 1
        );
    }

    return data.title;
}

function releaseCriticalCondition(target, icon, woundInstanceId) {
    const effectIndex = (target.effects || []).findIndex(current => current.type === 'condition' && current.id === icon);
    if (effectIndex < 0) return;

    const effect = target.effects[effectIndex];
    const automation = effect.automation || {};
    const sources = Array.isArray(automation.criticalWoundSources)
        ? automation.criticalWoundSources.filter(id => id !== woundInstanceId)
        : [];
    automation.criticalWoundSources = sources;

    const baseStacks = Math.max(0, Number(automation.criticalWoundBaseStacks) || 0);
    effect.stacks = Math.max(baseStacks, Math.max(0, Number(effect.stacks) || 0) - 1);

    if (!sources.length && automation.criticalWoundOnly && baseStacks === 0) {
        target.effects.splice(effectIndex, 1);
    }
}

function restoreCriticalWoundConditions(target) {
    if (!target || !Array.isArray(target.criticalWounds)) return target;

    target.criticalWounds
        .filter(instance => (instance.state || 'normal') === 'normal')
        .forEach(instance => {
            const wound = getCriticalWound(instance.woundId);
            (wound?.conditions || []).forEach(icon =>
                ensureCriticalCondition(target, icon, instance.instanceId)
            );
        });

    syncCriticalWoundResourceLimits(target);
    window.enforceCriticalEquipmentRestrictions?.(target);

    return target;
}

function applyCriticalDamageBefore(target, critical) {
    const wound = getCriticalWound(critical?.woundId);
    const source = combatants.find(combatant => String(combatant.id) === String(critical?.sourceId));
    if (!target || !critical || critical.applied) return;

    if (source) {
        source.progression ||= {};
        critical.sourceName = source.name;
        if (critical.adrenalineAlreadyGranted) {
            critical.adrenalineBefore = Math.max(0, Number(critical.adrenalineBefore) || 0);
            critical.adrenalineAfter = Math.max(
                critical.adrenalineBefore,
                Number(critical.adrenalineAfter) || Number(source.progression.adrenaline) || 0
            );
            critical.adrenalineReused = true;
        } else {
            critical.adrenalineBefore = Math.max(0, Number(source.progression.adrenaline) || 0);
            source.progression.adrenaline = critical.adrenalineBefore + 1;
            critical.adrenalineAfter = source.progression.adrenaline;
        }

        const prepared = getPreparedAttackCritical(source);
        if (critical.preparedCriticalId && prepared?.id === critical.preparedCriticalId) {
            delete source.preparedCriticalAttack;
            critical.preparedCriticalConsumed = true;
        }
    }

    if (!wound) {
        critical.applied = true;
        critical.advancedConsequences = [];
        savePlayersToStorage();
        window.refreshSessionStatus?.();
        return;
    }

    target.criticalWounds ||= [];
    const instance = createCriticalWoundInstance(wound, critical);
    target.criticalWounds.push(instance);
    critical.woundInstanceId = instance.instanceId;
    critical.conditionsApplied = (wound.conditions || [])
        .map(icon => ensureCriticalCondition(target, icon, instance.instanceId))
        .filter(Boolean);
    critical.advancedConsequences = getCriticalWoundImpactLines(instance, wound);
    critical.applied = true;

    syncCriticalWoundResourceLimits(target);
    window.enforceCriticalEquipmentRestrictions?.(target);

    savePlayersToStorage();
    window.refreshSessionStatus?.();
}

function applyCriticalDamageAfter(target, critical) {
    const wound = getCriticalWound(critical?.woundId);
    if (!target || !wound || !critical?.applied) return;

    if (wound.immediateDeath) {
        target.hpCurrent = 0;
        target.stabilized = false;
        target.deathSaves ||= { success: 0, failures: 0 };
        if (target.type === 'player') target.deathSaves.failures = 3;
        critical.deathApplied = true;
    }

    syncCriticalWoundResourceLimits(target);
    window.enforceCriticalEquipmentRestrictions?.(target);

    savePlayersToStorage();
    window.sortCombatants?.();
    renderList(false);
}

function getCriticalWoundStateDescription(instance, wound) {
    if (instance.state === 'stabilized') return wound.stabilized;
    if (instance.state === 'treated') return wound.treated;
    if (instance.state === 'cured') return 'O ferimento foi marcado como curado.';
    return wound.description;
}

function toggleCriticalWoundsPanel(combatantId) {
    const key = String(combatantId);
    if (expandedCriticalWoundPanels.has(key)) expandedCriticalWoundPanels.delete(key);
    else expandedCriticalWoundPanels.add(key);
    renderList(false);
}

function applyCriticalWoundStateChange(target, instance, wound, nextState) {
    const beforeState = instance.state || 'normal';

    if (beforeState === 'normal' && nextState !== 'normal') {
        (wound.conditions || []).forEach(icon => releaseCriticalCondition(target, icon, instance.instanceId));
    } else if (beforeState !== 'normal' && nextState === 'normal') {
        (wound.conditions || []).forEach(icon => ensureCriticalCondition(target, icon, instance.instanceId));
    }

    instance.state = nextState;
    instance.updatedAt = new Date().toISOString();
    if (instance.woundId === 'complicated-ruptured-spleen' && instance.check) {
        instance.check.interval = nextState === 'stabilized' ? 10 : 5;
        instance.check.elapsedTurns = 0;
        instance.check.label = nextState === 'stabilized'
            ? 'Teste de Atordoamento a cada 10 rodadas'
            : 'Teste de Atordoamento a cada 5 rodadas';
    }
    if (nextState !== 'normal' && ['difficult-concussion', 'deadly-heart-damage'].includes(instance.woundId)) {
        delete instance.check;
    }
    syncCriticalWoundResourceLimits(target);
    window.enforceCriticalEquipmentRestrictions?.(target);
    savePlayersToStorage();
    renderList(false);
}

function setCriticalWoundState(combatantId, instanceId, nextState) {
    const target = combatants.find(combatant => String(combatant.id) === String(combatantId));
    const instance = target?.criticalWounds?.find(wound => wound.instanceId === instanceId);
    const wound = getCriticalWound(instance?.woundId);
    if (!target || !instance || !wound || !CRITICAL_STATE_INFO[nextState]) return;

    if (wound.cannotStabilize && nextState === 'stabilized') {
        showToast('Este ferimento não pode ser estabilizado.');
        return;
    }
    if (wound.cannotTreat && (nextState === 'treated' || nextState === 'cured')) {
        showToast('Este ferimento não pode ser tratado.');
        return;
    }

    const beforeState = instance.state || 'normal';
    const beforeLabel = CRITICAL_STATE_INFO[beforeState]?.name || beforeState;
    const afterLabel = CRITICAL_STATE_INFO[nextState].name;
    const action = () => applyCriticalWoundStateChange(target, instance, wound, nextState);
    const metadata = {
        type: 'condition',
        target: { id: target.id, name: target.name },
        participants: [{ id: target.id, name: target.name }],
        effect: { id: wound.id, type: 'critical-wound', name: wound.name, action: afterLabel.toLowerCase() }
    };
    const tracker = window.trackCombatAction || window.trackEquipmentAction;

    if (typeof tracker === 'function') {
        tracker(
            `${target.name}: ${wound.name} ${afterLabel.toLowerCase()}`,
            action,
            `Ferimento crítico ${wound.name}\nEstado: ${beforeLabel} → ${afterLabel}\n${getCriticalWoundStateDescription({ ...instance, state: nextState }, wound)}`,
            metadata
        );
    } else {
        action();
        window.addCombatHistoryEntry?.(
            `${target.name}: ${wound.name} ${afterLabel.toLowerCase()}`,
            `Estado: ${beforeLabel} → ${afterLabel}`,
            metadata
        );
    }
}

function getCriticalTreatmentRollMode() {
    if (typeof appPreferences !== 'undefined') return appPreferences.rollModes?.skills || 'manual';
    try {
        return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.skills || 'manual';
    } catch {
        return 'manual';
    }
}

function getCriticalTreatmentMethodTotal(healer, methodId) {
    const method = CRITICAL_TREATMENT_METHODS[methodId] || CRITICAL_TREATMENT_METHODS.assisted;
    const model = window.characterSheetModel;
    if (!healer || !model || method.kind === 'manual') {
        return { method, total: 0, baseTotal: 0, woundModifier: 0, woundDetails: [] };
    }

    const professional = method.kind === 'professional';
    const definition = professional
        ? model.getCharacterProfessionalSkillDefinition?.(method.id)
        : model.getCharacterSkillDefinition?.(method.id);
    const breakdown = professional
        ? model.getCharacterProfessionalSkillBreakdown?.(method.id, healer.professionalSkills, healer.attributes)
        : model.getCharacterSkillBreakdown?.(method.id, healer.skills, healer.attributes);
    const baseTotal = Math.max(0, Number(breakdown?.total) || 0);
    const wound = window.getCriticalWoundSkillModifier?.(
        healer,
        definition || { id: method.id },
        professional,
        baseTotal,
        breakdown
    ) || { total: 0, details: [] };

    return {
        method,
        definition,
        breakdown,
        baseTotal,
        woundModifier: Number(wound.total) || 0,
        woundDetails: wound.details || [],
        total: baseTotal + (Number(wound.total) || 0)
    };
}

function getCriticalTreatmentMethodsForHealer(healer) {
    const methods = [getCriticalTreatmentMethodTotal(healer, 'first_aid')];
    const healingHands = getCriticalTreatmentMethodTotal(healer, 'healing_hands');
    if (healingHands.baseTotal > 0) methods.push(healingHands);
    methods.push(getCriticalTreatmentMethodTotal(healer, 'assisted'));
    return methods;
}

function calculateCriticalTreatmentTest(options = {}) {
    const naturalRoll = Number(options.naturalRoll);
    const skillTotal = Number(options.skillTotal) || 0;
    const modifier = Number(options.modifier) || 0;
    const difficulty = Number(options.difficulty);
    if (!Number.isInteger(naturalRoll) || naturalRoll < 1 || naturalRoll > 20 || !Number.isFinite(difficulty)) {
        return { valid: false };
    }

    const finalResult = naturalRoll + skillTotal + modifier;
    return {
        valid: true,
        naturalRoll,
        skillTotal,
        modifier,
        difficulty,
        finalResult,
        margin: finalResult - difficulty,
        success: finalResult >= difficulty,
        critical: naturalRoll === 20
    };
}

function closeCriticalTreatmentModal() {
    pendingCriticalTreatment = null;
    document.getElementById('criticalTreatmentModal')?.remove();
}

function refreshCriticalTreatmentMethodOptions() {
    const healerId = document.getElementById('criticalTreatmentHealer')?.value;
    const healer = combatants.find(entry => String(entry.id) === String(healerId));
    const select = document.getElementById('criticalTreatmentMethod');
    const summary = document.getElementById('criticalTreatmentMethodSummary');
    if (!select) return;

    const previous = select.value;
    const methods = getCriticalTreatmentMethodsForHealer(healer);
    select.innerHTML = methods.map(entry => `
        <option value="${escapeCriticalHtml(entry.method === CRITICAL_TREATMENT_METHODS.healing_hands ? 'healing_hands' : entry.method.id)}">
            ${escapeCriticalHtml(entry.method.name)}${entry.method.kind === 'manual' ? '' : ` · ${entry.total >= 0 ? '+' : ''}${entry.total}`}
        </option>
    `).join('');
    if ([...select.options].some(option => option.value === previous)) select.value = previous;

    const selected = getCriticalTreatmentMethodTotal(healer, select.value);
    if (summary) {
        summary.textContent = selected.method.kind === 'manual'
            ? 'Informe no modificador o bônus concedido pelo item, magia ou recurso usado.'
            : `Base ${selected.baseTotal >= 0 ? '+' : ''}${selected.baseTotal}${selected.woundModifier ? ` · ferimentos ${selected.woundModifier}` : ''} · total ${selected.total >= 0 ? '+' : ''}${selected.total}`;
    }
}

function openCriticalWoundTreatment(combatantId, instanceId, nextState) {
    document.getElementById('criticalTreatmentModal')?.remove();
    const target = combatants.find(entry => String(entry.id) === String(combatantId));
    const instance = target?.criticalWounds?.find(entry => entry.instanceId === instanceId);
    const wound = getCriticalWound(instance?.woundId);
    if (!target || !instance || !wound || !CRITICAL_STATE_INFO[nextState]) return;

    if (wound.cannotStabilize && nextState === 'stabilized') {
        showToast('Este ferimento não pode ser estabilizado.');
        return;
    }
    if (wound.cannotTreat && (nextState === 'treated' || nextState === 'cured')) {
        showToast('Este ferimento não pode ser tratado.');
        return;
    }

    if (nextState === 'cured') {
        setCriticalWoundState(combatantId, instanceId, nextState);
        return;
    }

    pendingCriticalTreatment = { combatantId, instanceId, nextState };
    const activeHealer = combatants.find(entry => typeof activeTurnId !== 'undefined' && String(entry.id) === String(activeTurnId));
    const healer = activeHealer || target;
    const progressKey = `${instance.state || 'normal'}:${nextState}`;
    const storedProgress = instance.treatment?.progress?.[progressKey];
    const rollMode = getCriticalTreatmentRollMode();
    const modal = document.createElement('div');
    modal.id = 'criticalTreatmentModal';
    modal.className = 'session-overlay';
    modal.addEventListener('click', event => {
        if (event.target === modal) closeCriticalTreatmentModal();
    });
    modal.innerHTML = `
        <section class="session-dialog critical-treatment-dialog" role="dialog" aria-modal="true" aria-labelledby="criticalTreatmentTitle">
            <div class="session-dialog-header">
                <div><small>TRATAMENTO MÉDICO</small><h2 id="criticalTreatmentTitle">${escapeCriticalHtml(CRITICAL_STATE_INFO[instance.state || 'normal'].action)} ${escapeCriticalHtml(wound.name)}</h2></div>
                <button type="button" class="session-close" onclick="closeCriticalTreatmentModal()" aria-label="Fechar">×</button>
            </div>
            <p class="critical-treatment-patient">Paciente: <strong>${escapeCriticalHtml(target.name)}</strong> · ${escapeCriticalHtml(CRITICAL_STATE_INFO[instance.state || 'normal'].name)} → ${escapeCriticalHtml(CRITICAL_STATE_INFO[nextState].name)}</p>
            <p class="critical-treatment-rule">A planilha deixa o ND e a quantidade de sucessos sob definição do mestre. Falhas ficam registradas e não avançam o ferimento.</p>
            <div class="critical-treatment-grid">
                <label><span>Responsável</span><select id="criticalTreatmentHealer" onchange="refreshCriticalTreatmentMethodOptions()">${combatants.map(entry => `<option value="${escapeCriticalHtml(entry.id)}"${String(entry.id) === String(healer.id) ? ' selected' : ''}>${escapeCriticalHtml(entry.name)}</option>`).join('')}</select></label>
                <label><span>Perícia ou recurso</span><select id="criticalTreatmentMethod" onchange="refreshCriticalTreatmentMethodOptions()"></select><small id="criticalTreatmentMethodSummary"></small></label>
                <label><span>ND definido pelo mestre</span><input id="criticalTreatmentDifficulty" type="number" inputmode="numeric" min="1" placeholder="Ex.: 16"></label>
                ${rollMode === 'manual' ? '<label><span>Resultado natural do d20</span><input id="criticalTreatmentNaturalRoll" type="number" inputmode="numeric" min="1" max="20" placeholder="1 a 20"></label>' : '<div class="critical-treatment-auto-roll"><strong>🎲 Rolagem automática</strong><small>Usa a preferência dos testes de perícia.</small></div>'}
                <label><span>Modificador adicional</span><input id="criticalTreatmentModifier" type="number" inputmode="numeric" value="0" placeholder="Tenda, Diagnóstico, item..."></label>
                <label><span>Sucessos necessários</span><input id="criticalTreatmentRequired" type="number" inputmode="numeric" min="1" value="${Math.max(1, Number(storedProgress?.required) || 1)}"></label>
                ${nextState === 'treated' ? '<label><span>Tempo de recuperação (opcional)</span><div class="critical-treatment-recovery"><input id="criticalTreatmentRecoveryAmount" type="number" inputmode="numeric" min="0" placeholder="Quantidade"><select id="criticalTreatmentRecoveryUnit"><option value="rounds">rodadas</option><option value="hours">horas</option><option value="days">dias</option></select></div></label>' : ''}
            </div>
            ${storedProgress?.successes ? `<p class="critical-treatment-progress">Progresso salvo: <strong>${storedProgress.successes}/${storedProgress.required}</strong> sucessos.</p>` : ''}
            <div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeCriticalTreatmentModal()">Cancelar</button><button type="button" class="session-primary" onclick="executeCriticalWoundTreatment()">Realizar teste</button></div>
        </section>
    `;
    document.body.appendChild(modal);
    refreshCriticalTreatmentMethodOptions();
    document.getElementById('criticalTreatmentDifficulty')?.focus();
}

function executeCriticalWoundTreatment(random = Math.random) {
    const pending = pendingCriticalTreatment;
    const target = combatants.find(entry => String(entry.id) === String(pending?.combatantId));
    const instance = target?.criticalWounds?.find(entry => entry.instanceId === pending?.instanceId);
    const wound = getCriticalWound(instance?.woundId);
    const healer = combatants.find(entry => String(entry.id) === String(document.getElementById('criticalTreatmentHealer')?.value));
    if (!pending || !target || !instance || !wound || !healer) return null;

    const difficultyInput = document.getElementById('criticalTreatmentDifficulty');
    const difficulty = Number(difficultyInput?.value);
    if (!difficultyInput?.value.trim() || difficulty < 1) {
        showToast('Informe o ND definido pelo mestre.');
        difficultyInput?.focus();
        return null;
    }

    const rollMode = getCriticalTreatmentRollMode();
    const naturalInput = document.getElementById('criticalTreatmentNaturalRoll');
    const naturalRoll = rollMode === 'auto' ? Math.floor(random() * 20) + 1 : Number(naturalInput?.value);
    if (rollMode === 'manual' && (!naturalInput?.value.trim() || naturalRoll < 1 || naturalRoll > 20)) {
        showToast('Informe um resultado natural entre 1 e 20.');
        naturalInput?.focus();
        return null;
    }

    const methodId = document.getElementById('criticalTreatmentMethod')?.value || 'first_aid';
    const methodResult = getCriticalTreatmentMethodTotal(healer, methodId);
    const modifier = Number(document.getElementById('criticalTreatmentModifier')?.value || 0);
    const required = Math.max(1, Math.floor(Number(document.getElementById('criticalTreatmentRequired')?.value) || 1));
    const result = calculateCriticalTreatmentTest({ naturalRoll, skillTotal: methodResult.total, modifier, difficulty });
    if (!result.valid) return null;

    const beforeState = instance.state || 'normal';
    const progressKey = `${beforeState}:${pending.nextState}`;
    const currentSuccesses = Math.max(0, Number(instance.treatment?.progress?.[progressKey]?.successes) || 0);
    const successes = currentSuccesses + (result.success ? 1 : 0);
    const completed = result.success && successes >= required;
    const afterState = completed ? pending.nextState : beforeState;
    const recoveryAmount = Math.max(0, Number(document.getElementById('criticalTreatmentRecoveryAmount')?.value) || 0);
    const recoveryUnit = document.getElementById('criticalTreatmentRecoveryUnit')?.value || 'rounds';
    const criticalReward = result.critical && window.characterSkillTests?.applyCharacterSkillTestRewards;
    const attempt = {
        id: `critical-treatment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fromState: beforeState,
        toState: pending.nextState,
        healerId: healer.id,
        healerName: healer.name,
        methodId,
        methodName: methodResult.method.name,
        naturalRoll: result.naturalRoll,
        skillTotal: result.skillTotal,
        modifier: result.modifier,
        difficulty: result.difficulty,
        finalResult: result.finalResult,
        margin: result.margin,
        success: result.success,
        critical: result.critical,
        createdAt: new Date().toISOString()
    };
    const action = () => {
        instance.treatment ||= { attempts: [], progress: {} };
        instance.treatment.attempts ||= [];
        instance.treatment.progress ||= {};
        instance.treatment.attempts.push(attempt);
        instance.treatment.progress[progressKey] = { successes, required };
        if (recoveryAmount > 0) instance.treatment.recovery = { amount: recoveryAmount, unit: recoveryUnit, setAt: new Date().toISOString() };
        if (criticalReward) window.characterSkillTests.applyCharacterSkillTestRewards(healer, {
            valid: true,
            luckDiceGained: 1,
            adrenalineGained: 1
        });
        if (completed) applyCriticalWoundStateChange(target, instance, wound, pending.nextState);
        else {
            savePlayersToStorage();
            renderList(false);
        }
    };
    const resultLabel = completed
        ? `${CRITICAL_STATE_INFO[pending.nextState].name.toLowerCase()}`
        : result.success ? `progresso ${successes}/${required}` : 'falha';
    const detail = [
        `Paciente: ${target.name}`,
        `Ferimento: ${wound.name}`,
        `Responsável: ${healer.name}`,
        `Método: ${methodResult.method.name}`,
        `Rolagem: ${result.naturalRoll}${result.critical ? ' (20 natural — Crítico)' : ''} + ${result.skillTotal} + ${result.modifier} = ${result.finalResult}`,
        `ND: ${result.difficulty} · Margem: ${result.margin >= 0 ? '+' : ''}${result.margin}`,
        `Resultado: ${result.success ? 'Sucesso' : 'Falha'}`,
        `Progresso: ${successes}/${required} sucessos`,
        `Estado: ${CRITICAL_STATE_INFO[beforeState].name} → ${CRITICAL_STATE_INFO[afterState].name}`,
        ...(recoveryAmount > 0 ? [`Recuperação prevista: ${recoveryAmount} ${recoveryUnit === 'days' ? 'dias' : recoveryUnit === 'hours' ? 'horas' : 'rodadas'}`] : []),
        ...(methodResult.woundDetails || []).map(entry => `Penalidade do responsável: ${entry}`),
        ...(result.critical ? ['Recompensas do responsável: +1 Dado da Sorte · +1 Adrenalina'] : [])
    ].join('\n');
    const metadata = {
        type: 'condition',
        source: { id: healer.id, name: healer.name },
        target: { id: target.id, name: target.name },
        participants: [{ id: healer.id, name: healer.name }, { id: target.id, name: target.name }],
        effect: { id: wound.id, type: 'critical-wound-treatment', name: wound.name, action: resultLabel }
    };
    const tracker = window.trackCombatAction || window.trackEquipmentAction;
    if (typeof tracker === 'function') tracker(`${healer.name} > ${target.name}: ${wound.name} — ${resultLabel}`, action, detail, metadata);
    else {
        action();
        window.addCombatHistoryEntry?.(`${healer.name} > ${target.name}: ${wound.name} — ${resultLabel}`, detail, metadata);
    }

    closeCriticalTreatmentModal();
    showToast(result.success
        ? completed ? `🩹 ${wound.name}: ${CRITICAL_STATE_INFO[pending.nextState].name}.` : `🩹 Sucesso registrado: ${successes}/${required}.`
        : `⚠️ Falha no tratamento de ${wound.name}.`);
    return { ...result, successes, required, completed };
}

function renderCombatantCriticalWoundsPanel(combatant) {
    const wounds = Array.isArray(combatant?.criticalWounds) ? combatant.criticalWounds : [];
    if (!wounds.length) return '';

    const expanded = expandedCriticalWoundPanels.has(String(combatant.id));
    const activeCount = wounds.filter(instance => instance.state !== 'cured').length;

    return `
        <section class="critical-wounds-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Ferimentos críticos de ${escapeCriticalHtml(combatant.name)}">
            <button type="button" class="combat-subpanel-header critical-wounds-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleCriticalWoundsPanel('${escapeCriticalHtml(combatant.id)}')">
                <span>${expanded ? '▼' : '▶'} FERIMENTOS CRÍTICOS</span>
                <small>${activeCount} ativo${activeCount === 1 ? '' : 's'} · ${wounds.length} registrado${wounds.length === 1 ? '' : 's'}</small>
            </button>
            ${expanded ? `
                <div class="critical-wound-card-list">
                    ${wounds.map(instance => {
                        const wound = getCriticalWound(instance.woundId);
                        const severity = CRITICAL_SEVERITIES.find(item => item.id === wound?.severity);
                        const region = CRITICAL_REGION_INFO[wound?.region];
                        const state = CRITICAL_STATE_INFO[instance.state] || CRITICAL_STATE_INFO.normal;
                        const nextState = state.next;
                        const actionDisabled =
                            (wound?.cannotStabilize && nextState === 'stabilized') ||
                            (wound?.cannotTreat && (nextState === 'treated' || nextState === 'cured'));
                        const progressKey = `${instance.state || 'normal'}:${nextState}`;
                        const treatmentProgress = instance.treatment?.progress?.[progressKey];
                        const recovery = instance.treatment?.recovery;
                        if (!wound || !severity || !region) return '';

                        return `
                            <article class="critical-wound-card critical-wound-state-${escapeCriticalHtml(instance.state || 'normal')}">
                                <div class="critical-wound-card-heading">
                                    <span>${region.icon}</span>
                                    <div><strong>${escapeCriticalHtml(wound.name)}</strong><small>${escapeCriticalHtml(severity.name)} · ${escapeCriticalHtml(region.name)}</small></div>
                                    <em>${escapeCriticalHtml(state.name)}</em>
                                </div>
                                 <p>${escapeCriticalHtml(getCriticalWoundStateDescription(instance, wound))}</p>
                                ${getCriticalWoundImpactLines(instance, wound).length ? `
                                    <ul class="critical-wound-impact-list">
                                        ${getCriticalWoundImpactLines(instance, wound).map(line => `<li>${escapeCriticalHtml(line)}</li>`).join('')}
                                    </ul>
                                ` : ''}
                                ${treatmentProgress?.successes ? `<p class="critical-wound-treatment-status">🩹 Tratamento: ${treatmentProgress.successes}/${treatmentProgress.required} sucessos</p>` : ''}
                                ${recovery?.amount ? `<p class="critical-wound-treatment-status">⏳ Recuperação prevista: ${recovery.amount} ${recovery.unit === 'days' ? 'dias' : recovery.unit === 'hours' ? 'horas' : 'rodadas'}</p>` : ''}
                                 ${nextState ? `
                                    <button type="button" ${actionDisabled ? 'disabled' : ''} onclick="event.stopPropagation(); openCriticalWoundTreatment('${escapeCriticalHtml(combatant.id)}', '${escapeCriticalHtml(instance.instanceId)}', '${escapeCriticalHtml(nextState)}')">
                                        ${actionDisabled ? 'Sem tratamento possível' : escapeCriticalHtml(state.action)}
                                    </button>
                                ` : ''}
                            </article>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </section>
    `;
}

function processCriticalWoundTurnChecks(combatant, random = Math.random) {
    const events = [];
    (combatant?.criticalWounds || []).forEach(instance => {
        const state = instance.state || 'normal';
        if (state === 'cured') return;
        const wound = getCriticalWound(instance.woundId);
        if (!wound) return;

        if (instance.woundId === 'complicated-ruptured-spleen' && ['normal', 'stabilized'].includes(state)) {
            instance.check ||= { kind: 'stun-resistance', elapsedTurns: 0, interval: state === 'normal' ? 5 : 10 };
            instance.check.interval = state === 'normal' ? 5 : 10;
            instance.check.elapsedTurns = Math.max(0, Number(instance.check.elapsedTurns) || 0) + 1;
            const remaining = instance.check.interval - instance.check.elapsedTurns;
            instance.check.label = remaining > 0
                ? `Teste de Atordoamento em ${remaining} rodada${remaining === 1 ? '' : 's'}`
                : 'Teste de resistência a Atordoamento agora';
            if (instance.check.elapsedTurns >= instance.check.interval) {
                events.push({
                    kind: 'test-reminder',
                    woundId: instance.woundId,
                    woundName: wound.name,
                    summary: `${wound.name}: teste de resistência a Atordoamento agora`
                });
                instance.check.elapsedTurns = 0;
            }
        }

        if (instance.woundId === 'difficult-concussion' && state === 'normal') {
            instance.check ||= { kind: 'stun-resistance', elapsedTurns: 0, interval: rollCriticalDice('1d6', random)?.total || 1 };
            instance.check.elapsedTurns = Math.max(0, Number(instance.check.elapsedTurns) || 0) + 1;
            const remaining = instance.check.interval - instance.check.elapsedTurns;
            instance.check.label = remaining > 0
                ? `Teste de Atordoamento em ${remaining} rodada${remaining === 1 ? '' : 's'}`
                : 'Teste de resistência a Atordoamento agora';
            if (instance.check.elapsedTurns >= instance.check.interval) {
                events.push({
                    kind: 'test-reminder',
                    woundId: instance.woundId,
                    woundName: wound.name,
                    summary: `${wound.name}: teste de resistência a Atordoamento agora`
                });
                instance.check.elapsedTurns = 0;
                instance.check.interval = rollCriticalDice('1d6', random)?.total || 1;
            }
        }

        if (instance.woundId === 'difficult-hole-in-chest' && state === 'normal') {
            events.push({
                kind: 'suffocation',
                woundId: instance.woundId,
                woundName: wound.name,
                summary: `${wound.name}: resolver Sufocamento neste turno`
            });
        }

        if (instance.woundId === 'deadly-heart-damage' && state === 'normal' && instance.check?.pending) {
            events.push({
                kind: 'death-test',
                woundId: instance.woundId,
                woundName: wound.name,
                summary: `${wound.name}: teste de resistência à Morte pendente`
            });
            instance.check.pending = false;
            instance.check.label = 'Teste de resistência à Morte solicitado';
        }
    });

    if (events.length) savePlayersToStorage();
    return events;
}

function toggleCombatConsequencesPanel(combatantId) {
    const key = String(combatantId);
    if (expandedCombatConsequencePanels.has(key)) expandedCombatConsequencePanels.delete(key);
    else expandedCombatConsequencePanels.add(key);
    renderList(false);
}

function resolveCombatConsequence(combatantId, consequenceId) {
    const target = combatants.find(combatant => String(combatant.id) === String(combatantId));
    const consequence = target?.combatConsequences?.find(entry => entry.id === consequenceId);
    if (!target || !consequence) return;

    const action = () => {
        target.combatConsequences = target.combatConsequences.filter(entry => entry.id !== consequenceId);
        savePlayersToStorage();
        renderList(false);
    };
    const label = `${target.name}: consequência resolvida — ${consequence.title}`;
    if (typeof window.trackCombatAction === 'function') {
        window.trackCombatAction(label, action, consequence.description, {
            type: 'effect',
            target: { id: target.id, name: target.name },
            participants: [{ id: target.id, name: target.name }]
        });
    } else action();
}

function renderCombatantCombatConsequencesPanel(combatant) {
    const consequences = Array.isArray(combatant?.combatConsequences) ? combatant.combatConsequences : [];
    if (!consequences.length) return '';
    const expanded = expandedCombatConsequencePanels.has(String(combatant.id));
    return `
        <section class="combat-consequences-panel ${expanded ? '' : 'is-collapsed'}" aria-label="Consequências de combate de ${escapeCriticalHtml(combatant.name)}">
            <button type="button" class="combat-subpanel-header combat-consequences-header" aria-expanded="${expanded}" onclick="event.stopPropagation(); toggleCombatConsequencesPanel('${escapeCriticalHtml(combatant.id)}')">
                <span>${expanded ? '▼' : '▶'} CONSEQUÊNCIAS</span>
                <small>${consequences.length} pendente${consequences.length === 1 ? '' : 's'}</small>
            </button>
            ${expanded ? `
                <div class="combat-consequence-list">
                    ${consequences.map(entry => `
                        <article class="combat-consequence-card">
                            <div><strong>${escapeCriticalHtml(entry.title)}</strong><p>${escapeCriticalHtml(entry.description)}</p></div>
                            <button type="button" onclick="event.stopPropagation(); resolveCombatConsequence('${escapeCriticalHtml(combatant.id)}', '${escapeCriticalHtml(entry.id)}')">Resolver</button>
                        </article>
                    `).join('')}
                </div>
            ` : ''}
        </section>
    `;
}

window.CRITICAL_SEVERITIES = CRITICAL_SEVERITIES;
window.CRITICAL_WOUNDS = CRITICAL_WOUNDS;
window.COMBAT_ROLL_OUTCOME_TABLES = COMBAT_ROLL_OUTCOME_TABLES;
window.getCriticalSeverity = getCriticalSeverity;
window.getCriticalWoundsFor = getCriticalWoundsFor;
window.getCriticalWoundDefinition = getCriticalWound;
window.getCriticalWoundSkillModifier = getCriticalWoundSkillModifier;
window.getCriticalBodyMultiplier = getCriticalBodyMultiplier;
window.calculateCriticalDamage = calculateCriticalDamage;
window.getCombatRollSkillGroup = getCombatRollSkillGroup;
window.getCombatRollOutcomeContext = getCombatRollOutcomeContext;
window.getCombatRollOutcome = getCombatRollOutcome;
window.getPreparedAttackCritical = getPreparedAttackCritical;
window.syncPreparedAttackCriticalFromSkillTest = syncPreparedAttackCriticalFromSkillTest;
window.openCombatRollOutcomeFlow = openCombatRollOutcomeFlow;
window.renderCombatRollOutcomeChoice = renderCombatRollOutcomeChoice;
window.rollCombatRollOutcome = rollCombatRollOutcome;
window.submitCombatRollOutcome = submitCombatRollOutcome;
window.rollCombatOutcomeExtra = rollCombatOutcomeExtra;
window.setCombatOutcomeChoice = setCombatOutcomeChoice;
window.setCombatOutcomeTarget = setCombatOutcomeTarget;
window.applyCombatRollOutcome = applyCombatRollOutcome;
window.getCriticalWoundResourceModifiers = getCriticalWoundResourceModifiers;
window.applyCriticalWoundDerivedModifiers = applyCriticalWoundDerivedModifiers;
window.hasUnusableArmFromCriticalWound = hasUnusableArmFromCriticalWound;
window.getCriticalWoundBlockedEquipmentSlots = getCriticalWoundBlockedEquipmentSlots;
window.getCriticalEquipmentSlotRestriction = getCriticalEquipmentSlotRestriction;
window.syncCriticalWoundResourceLimits = syncCriticalWoundResourceLimits;
window.processCriticalWoundTurnChecks = processCriticalWoundTurnChecks;
window.openCriticalDamageFlow = openCriticalDamageFlow;
window.openPreparedCriticalDamageFlow = openPreparedCriticalDamageFlow;
window.closeCriticalDamageModal = closeCriticalDamageModal;
window.updateCriticalMarginPreview = updateCriticalMarginPreview;
window.continueCriticalMargin = continueCriticalMargin;
window.renderCriticalMarginStep = renderCriticalMarginStep;
window.renderCriticalSelectionStep = renderCriticalSelectionStep;
window.rollCriticalWound = rollCriticalWound;
window.showCriticalWoundChoices = showCriticalWoundChoices;
window.chooseCriticalWound = chooseCriticalWound;
window.confirmCriticalDamage = confirmCriticalDamage;
window.applyCriticalDamageBefore = applyCriticalDamageBefore;
window.applyCriticalDamageAfter = applyCriticalDamageAfter;
window.restoreCriticalWoundConditions = restoreCriticalWoundConditions;
window.addCombatConsequence = addCombatConsequence;
window.toggleCriticalWoundsPanel = toggleCriticalWoundsPanel;
window.setCriticalWoundState = setCriticalWoundState;
window.getCriticalTreatmentMethodTotal = getCriticalTreatmentMethodTotal;
window.getCriticalTreatmentMethodsForHealer = getCriticalTreatmentMethodsForHealer;
window.calculateCriticalTreatmentTest = calculateCriticalTreatmentTest;
window.openCriticalWoundTreatment = openCriticalWoundTreatment;
window.executeCriticalWoundTreatment = executeCriticalWoundTreatment;
window.refreshCriticalTreatmentMethodOptions = refreshCriticalTreatmentMethodOptions;
window.closeCriticalTreatmentModal = closeCriticalTreatmentModal;
window.renderCombatantCriticalWoundsPanel = renderCombatantCriticalWoundsPanel;
window.toggleCombatConsequencesPanel = toggleCombatConsequencesPanel;
window.resolveCombatConsequence = resolveCombatConsequence;
window.renderCombatantCombatConsequencesPanel = renderCombatantCombatConsequencesPanel;
