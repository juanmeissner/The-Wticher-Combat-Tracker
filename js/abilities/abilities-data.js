const predefinedAbilities = [

    {
        id: 'igni',

        name: 'Igni',

        icon: '🔥',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Fogo',

        duration: 'Imediata',

        defense: 'Esquivar',

        damage: '1d6 × EST gasta',

        cost: '1 a 5 EST',

        range: 'Cone de 4,5 metros',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            '1d6 de dano por ST gasto.',

        description:
            'Igni dispara uma onda de faíscas e fogo que provoca 1d6 de dano por ponto de EST gasto e tem uma chance de 10% × EST de incendiar qualquer coisa atingida. Igni sempre provoca dano ao tronco, a menos que usado à queima-roupa. Quando usado à queima-roupa, Igni pode ser mirado em locais do corpo.'
    },

    {
        id: 'aard',

        name: 'Aard',

        icon: '💨',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Ar',

        duration: 'Imediata',

        defense: 'Esquivar / Bloquear',

        damage: '1d4 × EST gasta',

        cost: '1 a 5 EST',

        range: 'Cone de 4,5 metros',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Onda telecinética.',

        description:
            'Aard dispara uma onda de força telecinética, causando 1d4 de dano por EST, desequilibrando criaturas com uma chance de 10% delas serem derrubadas/prostradas. A porcentagem sobe em 10% por cada ponto de EST gasto. Caso o oponente caia no chão deve rolar 1d10 para cada alvo para verificar o que eles bateram ao cair no chão.'
    },

    {
        id: 'quen',

        name: 'Quen',

        icon: '🌿',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Terra',

        duration: '10 Rodadas ou exaustão',

        defense: 'Nenhuma',

        damage: '',

        cost: '1 a 10 EST',

        range: '',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Escudo protetor.',

        description:
            'A habilidade Quen cria um escudo protetor com 5 Pontos de Vida por ponto de Estamina gasto. Este escudo absorve todo o dano, tanto letal quanto não-letal, até esgotar seus PV. Se o escudo for destruído, o dano restante atinge o usuário normalmente, afetando sua armadura e resistências antes de reduzir seus PV ou EST. Quen protege contra ataques e feitiços que podem ser bloqueados, mas não é eficaz contra envenenamento, doenças ou sufocamento. O usuário não pode lançar Quen novamente até que o escudo atual se esgote ou sua duração termine.'
    },

    {
        id: 'yrden',

        name: 'Yrden',

        icon: '🔮',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Arcano',

        duration: '1d6 rodadas',

        defense: 'Nenhuma',

        damage: '',

        cost: '1 a 5 EST',

        range: 'Raio de 3 metros',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Círculo mágico de contenção.',

        description:
            'Yrden cria um círculo mágico grande no chão à sua volta. Qualquer coisa que pisar dentro do círculo sofre uma negativa em Destreza e Esquiva igual ao número de EST gasto até deixar o círculo. Qualquer criatura incorpórea que entrar no círculo se torna corpórea.'
    },

    {
        id: 'axii',

        name: 'Axii',

        icon: '🔮',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Arcano',

        duration: 'Até ser superado',

        defense: 'Resistir Magia',

        damage: '',

        cost: 'Variável',

        range: '8 quadrados',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Atordoamento mental.',

        description:
            'Axii atordoa o oponente até que ele consiga fazer um teste de resistência a Atordoamento em -1. Por cada 2 pontos de EST adicionais gastos depois de 1, o teste de resistência a Atordoamento fica mais difícil em 1 ponto.'
    },

    {
        id: 'igni_labareda',

        name: 'Igni Labareda de Fogo',

        icon: '🔥',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Fogo',

        duration: 'Ativo (Metade da EST gasta)',

        defense: 'Esquivar / Bloquear',

        damage: '1d6 × EST gasta',

        cost: '1 a 10 EST',

        range: '3 quadrados',

        action: 'Principal',

        unlockCost: 0,

        shortDescription:
            'Labareda contínua de fogo.',

        description:
            'Igni agora produz uma labareda constante de faíscas e fogo que sai da sua mão e faz 1d6 de dano por ponto de EST gasto, além de possuir 75% de chance de incendiar o oponente. A labareda deve ser mantida a cada rodada com metade do valor de EST utilizado no lançamento inicial. Você pode trocar de alvo durante o turno.'
    },

    {
        id: 'aard_varredura',

        name: 'Varredura Aard',

        icon: '💨',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Ar',

        duration: 'Imediata',

        defense: 'Esquivar / Bloquear',

        damage: '1d6 × EST gasta',

        cost: '1 a 5 EST',

        range: 'Raio de 4,5 metros',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Explosão telecinética em área.',

        description:
            'Aard explode a força telecinética à sua volta. Por cada ponto de EST gasto, tudo atingido possui 10% de chance de ser derrubado e ficar desequilibrado. A explosão ocorre em todas as direções como uma esfera. Criaturas voadoras atingidas são derrubadas do ar. Role 1d10 para cada alvo derrubado para determinar onde foi ferido, e 1d6 × EST para o dano. Alvos encostados no bruxo recebem o dobro de dano.'
    },

    {
        id: 'quen_ampliado',

        name: 'Quen Ampliado',

        icon: '🌿',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Terra',

        duration: 'Renovado com EST',

        defense: '',

        damage: '',

        cost: 'Variável',

        range: '',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Escudo expandido.',

        description:
            'Quen cria um escudo luminoso ao redor do usuário com 10 pontos de vida por ponto de EST gasto. Para manter o escudo ativo nas rodadas seguintes é necessário gastar a mesma quantidade de EST. O escudo protege o usuário e pode incluir uma pessoa próxima. Enquanto ativo, bloqueia qualquer coisa tangível. O usuário deve se mover lentamente, sem correr. Quando o escudo se esgota ou é destruído, tudo ao redor é empurrado 2 metros e sofre 1d6 de dano.'
    },

    {
        id: 'axii_marionete',

        name: 'Axii Marionete',

        icon: '🔮',

        profession: 'Bruxo',

        category: 'Bruxo',

        type: 'Arcano',

        duration: 'Até ser removido ou acabar EST',

        defense: 'Resistir Magia',

        damage: '',

        cost: 'Variável',

        range: '8 quadrados',

        action: 'Bonus',

        unlockCost: 0,

        shortDescription:
            'Controle mental.',

        description:
            'Axii controla a mente de um oponente, tornando-o aliado por um número de rodadas igual aos pontos de EST gastos. A cada rodada o alvo pode fazer um teste de Resistir Magia contra o teste de Lançar Feitiços do usuário para tentar se libertar.'
    },

    {
        id: 'cenlly_graig',
    
        name: 'Cenlly Graig',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '2d6 * ponto acima da defesa',
    
        cost: '6',
    
        range: '8 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Rajadas de pedras afiadas.',
    
        description:
            'Cenlly Graig arremessa pedras afiadas contra o oponente. A cada 1 ponto obtido acima do valor de Esquivar/Bloquear do alvo (máximo 5), você realiza uma rajada causando 2d6 de dano cada e possui uma chance única de 10% de causar sangramento. Cada rajada conta como um ataque separado ao determinar local e dano causado.'
    },
    
    {
        id: 'espinho_de_barro',
    
        name: 'Espinho de Barro',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '5d6',
    
        cost: '5',
    
        range: '8 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Estalagmite perfurante.',
    
        description:
            'O Espinho de Barro cria uma estalagmite para perfurar o alvo. O espinho provoca 5d6 de dano e permanece até ser destruído. Pode ser destruído com 20 pontos de dano.'
    },
    
    {
        id: 'prisao_de_talfryn',
    
        name: 'Prisão de Talfryn',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Até ser destruído',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '',
    
        cost: '3',
    
        range: '10 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Raízes aprisionam o alvo.',
    
        description:
            'A Prisão de Talfryn aprisiona o alvo com raízes resistentes. As raízes suportam até 15 pontos de dano antes de se romperem. Para escapar, o alvo deve realizar um teste de Esquivar/Escapar contra um ND igual ao teste original de Lançar Feitiços.'
    },
    
    {
        id: 'pena_de_luthien',
    
        name: 'Pena de Luthien',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '2',
    
        range: 'Indefinido',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Escreve em qualquer superfície.',
    
        description:
            'A Pena de Luthien permite escrever ou desenhar em qualquer superfície sólida.'
    },
    
    {
        id: 'sopro_de_korath',
    
        name: 'Sopro de Korath',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '3d6',
    
        cost: '2',
    
        range: 'Cone de 4,5 metros',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Cone de areia quente cegante.',
    
        description:
            'O Sopro de Korath quebra uma pedra próxima ou superfície de terra e dispara areia quente em um cone à frente do usuário. Oponentes que falharem na defesa ficam cegos por 1d6 rodadas. O feitiço também revela alvos invisíveis.'
    },
    
    {
        id: 'feitico_de_diagnostico',
    
        name: 'Feitiço de Diagnóstico',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '3',
    
        range: '5 metros',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Analisa condições físicas.',
    
        description:
            'Permite avaliar rapidamente a Vitalidade de um alvo, descobrir quantos Pontos de Vida ainda possui, identificar ferimentos críticos e detectar doenças ou venenos.'
    },
    
    {
        id: 'cura_magica',
    
        name: 'Cura Mágica',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: 'Contato',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Estimula regeneração natural.',
    
        description:
            'A Cura Mágica estimula a regeneração natural do alvo em uma taxa de 3 + Coeficiente de Inteligência + 1d6. O feitiço também pode ser utilizado repetidamente para tratar ferimentos críticos.'
    },
    
    {
        id: 'codi_bywyd',
    
        name: 'Codi Bywyd',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '2',
    
        range: 'Contato',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Acelera crescimento de plantas.',
    
        description:
            'Codi Bywyd acelera o crescimento de uma planta pequena desde a semente até a maturidade em um único turno. Pode ser usado para cultivar ervas e plantas alquímicas, mas não funciona em árvores ou plantas de grande porte.'
    },

    {
        id: 'telepatia',
    
        name: 'Telepatia',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Ativo',
    
        defense: '',
    
        damage: '',
    
        cost: 'Sem custo',
    
        range: 'Até 60 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Comunicação mental à distância.',
    
        description:
            'A Telepatia permite se comunicar mentalmente com outra pessoa enquanto o feitiço durar. A comunicação ignora barreiras idiomáticas.'
    },
    
    {
        id: 'desmaterializar_objeto',
    
        name: 'Desmaterializar Objeto',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '4',
    
        range: '15 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Transporta objetos magicamente.',
    
        description:
            'Permite desmaterializar qualquer objeto e transportá-lo para um lugar já visitado ou próximo do conjurador. O feitiço pode ser lançado novamente para invocar o objeto de volta.'
    },
    
    {
        id: 'manipulacao_da_mente',
    
        name: 'Manipulação da Mente',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '1d10 rodadas',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '3',
    
        range: '5 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Controla emoções do alvo.',
    
        description:
            'Permite forçar o alvo a sentir ódio, amor, depressão ou euforia enquanto o feitiço durar.'
    },
    
    {
        id: 'bussola_magica',
    
        name: 'Bússola Mágica',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Indeterminado',
    
        defense: '',
    
        damage: '',
    
        cost: '3',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Determina direções instantaneamente.',
    
        description:
            'Permite determinar instantaneamente a direção de um lugar já visitado ou localizar o Norte.'
    },
    
    {
        id: 'glamour',
    
        name: 'Glamour',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '1 Dia',
    
        defense: '',
    
        damage: '',
    
        cost: '5',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Ilusão de beleza encantadora.',
    
        description:
            'Cria uma ilusão ao redor do conjurador tornando-o extremamente belo. Enquanto ativo, concede +3 em Sedução, Carisma e Liderança.'
    },
    
    {
        id: 'desfazer',
    
        name: 'Desfazer',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: 'Variável',
    
        range: '10 metros',
    
        action: 'Hibrido',
    
        unlockCost: 1,
    
        shortDescription:
            'Anula magias e rituais.',
    
        description:
            'Permite anular um feitiço, ritual ou hex dentro do alcance. Pode ser usada defensivamente para bloquear ataques mágicos. Para cancelar a magia, o conjurador deve superar a jogada de Lançar Feitiços do adversário e gastar EST equivalente à metade do resultado utilizado para quebrar a magia.'
    },
    
    {
        id: 'po_para_cegar',
    
        name: 'Pó para Cegar',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '1d10 rodadas',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '',
    
        cost: '3',
    
        range: '6 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cega o alvo com pó mágico.',
    
        description:
            'Arremessa um pó mágico nos olhos do alvo, deixando-o cego enquanto durar o feitiço.'
    },
    
    {
        id: 'espelho_de_afan',
    
        name: 'Espelho de Afan',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Indeterminado',
    
        defense: '',
    
        damage: '',
    
        cost: '7',
    
        range: '10 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria cópias ilusórias.',
    
        description:
            'Cria 1d10 cópias ilusórias do conjurador. As cópias são intangíveis, controladas mentalmente e não exigem ações para serem manipuladas.'
    },
    
    {
        id: 'misseis_magicos',
    
        name: 'Mísseis Mágicos',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: 'Desfazer Magia',
    
        damage: '1d6 + coef. INT',
    
        cost: '10',
    
        range: '30 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Dardos de energia arcana.',
    
        description:
            'Cria três + coeficiente de INT dardos brilhantes de energia mística. Cada dardo causa 1d6 + coeficiente de INT de dano e pode atingir um ou vários alvos simultaneamente.'
    },
    
    {
        id: 'recuperacao_alquimica',
    
        name: 'Recuperação Alquímica',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '3',
    
        range: '3 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Recupera substâncias alquímicas.',
    
        description:
            'Permite revitalizar a potência de uma substância alquímica gasta. Ao lançar o feitiço, recupera uma Substância Alquímica de um projeto alquímico que falhou.'
    },
    
    {
        id: 'defeito',
    
        name: 'Defeito',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '1 Dia',
    
        defense: 'Desfazer Magia',
    
        damage: '',
    
        cost: '5',
    
        range: '5 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Ilusão que prejudica aparência.',
    
        description:
            'Cria uma pequena ilusão perceptível em um alvo, tornando-o pouco atraente. O alvo sofre -3 em Sedução, Carisma e Liderança.'
    },
    
    {
        id: 'a_morte_de_fergus',
    
        name: 'A Morte de Fergus',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '10 Rodadas',
    
        defense: 'Resistir Magia',
    
        damage: '1d4 por turno',
    
        cost: '4',
    
        range: '3 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Agulhas mágicas torturantes.',
    
        description:
            'Convoca agulhas mágicas que torturam o alvo continuamente. Enquanto ativo, permite usar Conjuração de Feitiços no lugar de Intimidação para interrogar o alvo.'
    },
    
    {
        id: 'segure_a_lingua',
    
        name: 'Segure a Língua',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '10 Rodadas',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '5',
    
        range: '10 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Impede o alvo de falar.',
    
        description:
            'Sela magicamente os lábios do alvo e paralisa sua língua, impedindo-o de falar e dificultando conjurações mágicas.'
    },
    
    {
        id: 'tela_magica',
    
        name: 'Tela Mágica',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Até ser desfeita',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '1',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Oculta objetos com ilusões.',
    
        description:
            'Cria uma ilusão visual em uma área de 2 metros cúbicos para ocultar ou alterar a aparência de itens.'
    },
    
    {
        id: 'reabrir_portal',
    
        name: 'Reabrir Portal',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: '1d6 Turnos',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Reativa portais fechados.',
    
        description:
            'Permite localizar e reabrir temporariamente um portal fechado. Portais permanentes exigem CD 16 e temporários CD 20.'
    },
    
    {
        id: 'metodo_de_savolla',
    
        name: 'Método de Savolla',
    
        icon: '🔮',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '5',
    
        range: '1 quadrado',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Extrai compostos mutagênicos.',
    
        description:
            'Facilita a extração de compostos mutagênicos de cadáveres, separando os tecidos e permitindo extração com dificuldade reduzida.'
    },

    {
        id: 'onda_de_fogo',
    
        name: 'Onda de Fogo',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '3d6',
    
        cost: '4',
    
        range: 'Cone de 4,5 metros',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Cone flamejante devastador.',
    
        description:
            'Dispara um cone de fogo de 4,5 metros causando 3d6 de dano aos alvos que falharem em esquivar ou bloquear. Possui 50% de chance de incendiar o alvo.'
    },
    
    {
        id: 'tanio_ilchar',
    
        name: 'Tanio Ilchar',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '3d6',
    
        cost: '3',
    
        range: '8 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Explosão flamejante em área.',
    
        description:
            'Cria uma rajada de fogo em uma área de 2m por 2m causando 3d6 de dano. Possui 80% de chance de incendiar qualquer alvo dentro da área.'
    },
    
    {
        id: 'erguer_chamas',
    
        name: 'Erguer Chamas',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: 'Ativa (1 ~ 2 EST) por quadro',
    
        defense: '',
    
        damage: 'Variável',
    
        cost: '1 a 2 EST por quadro',
    
        range: '',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Manipula e intensifica fogo.',
    
        description:
            'Permite controlar fogo existente, espalhando-o em até 2 metros por rodada. Fogo baixo causa 1d6 ao redor e 2d6 no centro. Fogo alto causa 2d6 ao redor e 3d6 no centro, exigindo testes de Lançar Feitiço para manutenção.'
    },
    
    {
        id: 'lampejo_magico',
    
        name: 'Lampejo Mágico',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '2',
    
        range: 'Raio de 8 Metros',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Flash de luz cegante.',
    
        description:
            'Cria um clarão ofuscante acima do conjurador. Todos em um raio de 8 metros devem resistir à magia ou ficam cegos por 1d6 rodadas.'
    },
    
    {
        id: 'tormento_de_cadfan',
    
        name: 'Tormento de Cadfan',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: '1d6 Rodadas',
    
        defense: 'Nenhuma',
    
        damage: '2d6',
    
        cost: '4',
    
        range: '8 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Superaquece metais.',
    
        description:
            'Superaquece itens metálicos forçando o alvo a largá-los ou sofrer 2d6 de dano. Também pode encantar armas para causar +2d6 de dano e 50% de chance de incendiar.'
    },
    
    {
        id: 'marca_de_fogo',
    
        name: 'Marca de Fogo',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: '1d6',
    
        cost: '4',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Marca ardente permanente.',
    
        description:
            'Marca o alvo com um símbolo ou palavra em qualquer parte exposta do corpo, causando 1d6 de dano e deixando uma cicatriz permanente.'
    },
    
    {
        id: 'aine_verseos',
    
        name: 'Aine Verseos',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: '5 Rodadas',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '2',
    
        range: 'Raio de 6 Metros',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Aura luminosa protetora.',
    
        description:
            'Cria uma área de luz intensa ao redor do conjurador. Qualquer alvo dentro da luz realiza testes de esquiva com vantagem.'
    },
    
    {
        id: 'aenye',
    
        name: 'Aenye',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '4d6',
    
        cost: '5',
    
        range: '12 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Poderosa bola de fogo.',
    
        description:
            'Arremessa uma esfera de fogo puro contra um alvo, causando 4d6 de dano e possuindo 75% de chance de incendiar.'
    },
    
    {
        id: 'zefiro',
    
        name: 'Zéfiro',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: '1d6',
    
        cost: '5',
    
        range: 'Raio de 6 Metros',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Rajada de vento destrutiva.',
    
        description:
            'Dispara um golpe de vento que empurra o alvo por metros equivalentes aos pontos acima da defesa. Caso colida com algo, sofre dano adicional de colisão.'
    },
    
    {
        id: 'telecinese',
    
        name: 'Telecinese',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: 'Ativa 2 EST',
    
        defense: 'Nenhuma',
    
        damage: 'Indefinido',
    
        cost: '2',
    
        range: '12 quadrados',
    
        action: 'Hibrido',
    
        unlockCost: 1,
    
        shortDescription:
            'Manipula objetos à distância.',
    
        description:
            'Permite erguer e manipular objetos remotamente como se estivessem sendo segurados fisicamente.'
    },
    
    {
        id: 'tempestade_estatica',
    
        name: 'Tempestade Estática',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: '1d10 Rodadas',
    
        defense: 'Nenhuma',
    
        damage: '2d6 ou 1d6 por rodada',
    
        cost: '5',
    
        range: 'Raio de 6 Metros',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Eletricidade em área.',
    
        description:
            'Infunde eletricidade em uma área ao redor do conjurador. Alvos usando metal sofrem 2d6 por rodada, enquanto os demais sofrem 1d6.'
    },
    
    {
        id: 'abrigo_de_urien',
    
        name: 'Abrigo de Urien',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: '6 Horas',
    
        defense: '',
    
        damage: '',
    
        cost: '5',
    
        range: 'Raio de 8 Metros',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Neutraliza clima extremo.',
    
        description:
            'Anula efeitos extremos do clima em um raio de 8 metros, removendo chuva, neve, calor ou frio extremos.'
    },
    
    {
        id: 'arejar',
    
        name: 'Arejar',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: '2 EST * Horas',
    
        defense: '',
    
        damage: '',
    
        cost: '2 EST * Horas',
    
        range: 'Raio de 4,5 metros',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Purifica o ar.',
    
        description:
            'Remove fumaça, venenos e poluentes do ar em uma área ao redor do conjurador enquanto o feitiço durar.'
    },
    
    {
        id: 'sopro_de_bronwyn',
    
        name: 'Sopro de Bronwyn',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: 'Imediata',
    
        defense: 'Esquivar',
    
        damage: '1d6',
    
        cost: '2',
    
        range: '10 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Explosão de vento violenta.',
    
        description:
            'Derruba o alvo e o empurra conforme os pontos acima da defesa. Caso colida com algo, sofre dano adicional.'
    },
    
    {
        id: 'bolsa_de_ar',
    
        name: 'Bolsa de Ar',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: '2 EST * Horas',
    
        defense: '',
    
        damage: '',
    
        cost: '3',
    
        range: 'Si mesmo ou aliado',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria ar respirável.',
    
        description:
            'Cria um bolsão de ar fresco de 1 metro de raio embaixo d’água ou em ambientes sem oxigênio.'
    },
    
    {
        id: 'adenydd',
    
        name: 'Adenydd',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: 'Ativa',
    
        defense: '',
    
        damage: '',
    
        cost: '4',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Permite planar.',
    
        description:
            'Deixa o conjurador mais leve, permitindo planar durante quedas e evitando dano de impacto.'
    },
    
    {
        id: 'arco_de_bronwyn',
    
        name: 'Arco de Bronwyn',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '4d6',
    
        cost: '5',
    
        range: '40 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Impulsiona projéteis com vento.',
    
        description:
            'Permite impulsionar armas de arremesso, flechas, virotes ou bombas utilizando magia. Flechas e dardos recebem +4d6 de dano.'
    },
    
    {
        id: 'revestimento_de_po',
    
        name: 'Revestimento de Pó',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Ar',
    
        duration: 'Ativa',
    
        defense: 'Esquivar',
    
        damage: '',
    
        cost: '3',
    
        range: '20 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Revela invisibilidade.',
    
        description:
            'Levanta poeira em uma grande área revelando criaturas invisíveis e anulando seus benefícios de invisibilidade.'
    },

    {
        id: 'rhewi',
    
        name: 'Rhewi',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '1d10 Rodadas',
    
        defense: 'Esquivar',
    
        damage: '1d6',
    
        cost: '2',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Prende o alvo em gelo.',
    
        description:
            'Rhewi cria uma camada grossa de gelo em volta do alvo para prendê-lo enquanto durar o feitiço. O alvo é considerado congelado. Se usado em um alvo não vivo, o alvo não pode ser manipulado ou movido, causando 1d6 de dano de gelo por turno.'
    },
    
    {
        id: 'puro_dwr',
    
        name: 'Puro Dwr',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '1d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '2',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Purifica água.',
    
        description:
            'Puro Dwr permite que você purifique 1 metro cúbico de água. Isso remove veneno e doença, mas não força criaturas vivas a saírem. Em grandes corpos de água poluída, a contaminação retorna após o término do feitiço.'
    },
    
    {
        id: 'chao_de_gelo',
    
        name: 'Chão de Gelo',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '2d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '5',
    
        range: '16 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria área escorregadia.',
    
        description:
            'O chão de gelo cria uma área congelada com raio de 8 metros. Qualquer criatura que atravessar a área deve fazer um teste de Atletismo contra seu teste de Lançar Feitiços ou cair.'
    },
    
    {
        id: 'aguaceiro',
    
        name: 'Aguaceiro',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '2d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: '16 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria chuva intensa.',
    
        description:
            'Aguaceiro cria uma área de chuva com raio de 20 metros que apaga fogo. Dano de fogo passa a ser rolado com desvantagem, enquanto habilidades elétricas derivadas de ar recebem vantagem.'
    },
    
    {
        id: 'nevoa_de_dormyn',
    
        name: 'Névoa de Dormyn',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '2d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: '16 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria névoa densa.',
    
        description:
            'Criada por Dormyn de Gemmera, esta névoa cobre uma área com raio de 10 metros, reduzindo Percepção em -3 e limitando a visão a 4 metros.'
    },
    
    {
        id: 'maldicao_de_sedna',
    
        name: 'Maldição de Sedna',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '2d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: '40 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria redemoinho mortal.',
    
        description:
            'A Maldição de Sedna cria um poderoso redemoinho numa área de 6x6 quadrados. Criaturas próximas devem testar Nadar contra seu teste de Lançar Feitiços ou serão puxadas para baixo da água e começarão a sufocar.'
    },
    
    {
        id: 'controle_da_agua',
    
        name: 'Controle da Água',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: '2d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: '40 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Manipula correntes de água.',
    
        description:
            'Permite controlar a velocidade e direção de correntes de água. Pode reduzir velocidade de nadadores, aumentar velocidade de embarcações ou interromper correntes.'
    },
    
    {
        id: 'granizo_de_carys',
    
        name: 'Granizo de Carys',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '1d6 * Resultado',
    
        cost: '10',
    
        range: '10 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Rajadas congelantes.',
    
        description:
            'Criado por Carys de Cintra, este feitiço lança rajadas de gelo em alta velocidade. Para cada ponto acima da defesa do alvo (máximo 10), causa 1d6 de dano e possui 10% de chance de congelamento. Cada rajada é tratada como ataque separado.'
    },
    
    {
        id: 'jato_de_agua',
    
        name: 'Jato de Água',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Iniciante',
    
        type: 'Água',
    
        duration: 'Imediata',
    
        defense: 'Esquivar / Bloquear',
    
        damage: '4d6',
    
        cost: '3',
    
        range: '8 quadrados',
    
        action: 'Principal',
    
        unlockCost: 1,
    
        shortDescription:
            'Dispara água pressurizada.',
    
        description:
            'Jato de Água cria um gêiser controlado que pode causar dano cortante, perfurante ou de concussão. Caso o alvo falhe na defesa, sofre 4d6 de dano e é derrubado.'
    },
    
    {
        id: 'sangue_ferver',
    
        name: 'Sangue Ferver',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: '1d10 Rodadas',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '3',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Enfurece criaturas.',
    
        description:
            'Sangue Ferver faz um animal ou monstro não senciente entrar em fúria contra um alvo escolhido, atacando-o até o fim da duração.'
    },
    
    {
        id: 'amigo_das_criaturas_selvagens',
    
        name: 'Amigo das Criaturas Selvagens',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: '1d6 Horas',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '1',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Acalma animais.',
    
        description:
            'Concede +3 em Conduzir Animal. Também pode acalmar animais caso o teste de Lançar Feitiços supere Resistir Magia x3 do alvo.'
    },
    
    {
        id: 'visao_da_natureza',
    
        name: 'Visão da Natureza',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '6',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Detecta criaturas sobrenaturais.',
    
        description:
            'Permite enxergar criaturas não naturais a até 50 quadrados, inclusive através de obstáculos. Elas aparecem como versões luminosas.'
    },
    
    {
        id: 'doenca_amaldicoada',
    
        name: 'Doença Amaldiçoada',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: 'Variável',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Infecta o alvo.',
    
        description:
            'A doença amaldiçoada causa efeitos diferentes conforme a quantidade de EST usada. 2 EST causa desequilíbrio, 4 EST provoca atordoamento e 6 EST aplica uma doença devastadora tratada como veneno.'
    },
    
    {
        id: 'dadiva_da_natureza',
    
        name: 'Dádiva da Natureza',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: 'Variável',
    
        range: '1 quadrado',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria alimento natural.',
    
        description:
            'Faz crescer plantas comestíveis suficientes para sustentar um número de pessoas igual aos pontos de EST gastos por 1 dia.'
    },
    
    {
        id: 'sigilo_do_recondito',
    
        name: 'Sigilo do Recôndito',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Até ser desfeito',
    
        defense: '',
    
        damage: '',
    
        cost: '2',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Oculta área natural.',
    
        description:
            'Cobre uma área com galhos e folhagem, concedendo +5 em Furtividade. Quem estiver dentro fica imóvel. A vegetação pode ser destruída com 10 pontos de dano.'
    },
    
    {
        id: 'bencao_da_boa_fortuna',
    
        name: 'Bênção da Boa Fortuna',
    
        icon: '✨',
    
        profession: 'Clérigo',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Até utilizar o bônus',
    
        defense: '',
    
        damage: '',
    
        cost: '1',
    
        range: '10 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Concede bônus em ações.',
    
        description:
            'A bênção da boa fortuna concede bônus em rolagens igual à metade do valor obtido acima do ND da jogada, até o máximo de 5.'
    },
    
    {
        id: 'luz_sagrada',
    
        name: 'Luz Sagrada',
    
        icon: '✨',
    
        profession: 'Clérigo',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: '3d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '1',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria luz divina.',
    
        description:
            'A luz sagrada ilumina a área ao redor como uma tocha, sem produzir calor ou fogo.'
    },
    
    {
        id: 'aguas_da_clareza',
    
        name: 'Águas da Clareza',
    
        icon: '✨',
    
        profession: 'Clérigo',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Imediata',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '1',
    
        range: '5 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Remove intoxicação.',
    
        description:
            'As águas da clareza deixam um alvo sóbrio imediatamente, anulando álcool e substâncias alquímicas intoxicantes.'
    },
    
    {
        id: 'bencao_de_amor',
    
        name: 'Bênção de Amor',
    
        icon: '✨',
    
        profession: 'Clérigo',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: '2d10 Rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '2',
    
        range: '5 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Aumenta carisma.',
    
        description:
            'Concede +3 em Carisma e Sedução ao alvo pela duração da invocação.'
    },
    
    {
        id: 'camaras_do_conhecimento',
    
        name: 'Câmaras do Conhecimento',
    
        icon: '✨',
    
        profession: 'Clérigo',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '3',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Acessa memórias.',
    
        description:
            'Permite acessar memórias e conhecimentos armazenados na mente como se estivessem sendo revividos naquele momento.'
    },
    
    {
        id: 'teia_de_mentiras',
    
        name: 'Teia de Mentiras',
    
        icon: '✨',
    
        profession: 'Clérigo',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Resistir Magia',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '3',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 1,
    
        shortDescription:
            'Confunde a mente do alvo.',
    
        description:
            'Teia de Mentiras faz o alvo questionar informações e memórias, deixando-o atordoado até conseguir uma jogada abaixo de sua INT.'
    },

    {
        id: 'sangue_ferver',
    
        name: 'Sangue Ferver',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Aleatório (1d10 rodadas)',
    
        defense: 'VONTx3 da criatura',
    
        damage: 'Nenhum',
    
        cost: '3',
    
        range: '8m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Enfurece criaturas.',
    
        description:
            'Faz com que um monstro não-senciente dentro do alcance entre em frenesi e ataque um alvo escolhido até a duração terminar.'
    },
    
    {
        id: 'doenca_amaldicoada',
    
        name: 'Doença Amaldiçoada',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Até passar no teste de Tolerância',
    
        defense: 'Resistir a Magia',
    
        damage: 'Nenhum',
    
        cost: 'Variável',
    
        range: '8m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Aplica doenças progressivas.',
    
        description:
            'Causa uma doença progressiva conforme os pontos de EST gastos: 2 pontos causam tosse e desequilíbrio; 4 pontos deixam o alvo violentamente doente e Atordoado; 6 pontos aplicam uma doença devastadora tratada como veneno.'
    },
    
    {
        id: 'amigo_das_criaturas_selvagens',
    
        name: 'Amigo das Criaturas Selvagens',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: '16 horas',
    
        defense: 'VONTx3 da criatura',
    
        damage: 'Nenhum',
    
        cost: '1',
    
        range: '5m ou si mesmo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Acalma e compreende animais.',
    
        description:
            'Concede +3 em Conduzir Animal e permite acalmar um animal caso a jogada de Lançar Feitiços supere a VONTx3 da criatura.'
    },
    
    {
        id: 'dadiva_da_natureza',
    
        name: 'Dádiva da Natureza',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: 'Nenhum',
    
        cost: 'Variável',
    
        range: '2m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria alimento natural.',
    
        description:
            'Cria plantas comestíveis suficientes para sustentar um número de pessoas igual aos pontos de EST gastos durante 1 dia.'
    },
    
    {
        id: 'visao_da_natureza',
    
        name: 'Visão da Natureza',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Ativo (1 EST)',
    
        defense: 'Nenhuma',
    
        damage: 'Nenhum',
    
        cost: '1',
    
        range: 'Si mesmo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Detecta criaturas sobrenaturais.',
    
        description:
            'Permite ver criaturas não naturais até 50 metros, mesmo através de obstáculos. Monstros aparecem como versões luminosas de si mesmos.'
    },
    
    {
        id: 'sigilo_do_recondito',
    
        name: 'Sigilo do Recôndito',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Iniciante',
    
        type: 'Terra',
    
        duration: 'Até ser desfeito',
    
        defense: 'Nenhuma',
    
        damage: 'Nenhum',
    
        cost: '2',
    
        range: 'Si mesmo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria camuflagem natural.',
    
        description:
            'Cobre uma área de 3 metros com galhos, folhagem e elementos naturais, concedendo +5 em Furtividade. A área perde o efeito se for revelada ou sofrer 10 pontos de dano.'
    },
    
    {
        id: 'bencao_da_boa_fortuna',
    
        name: 'Bênção da Boa Fortuna',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Até gastar',
    
        defense: 'ND:12',
    
        damage: '',
    
        cost: '1',
    
        range: '10m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Concede pontos de sorte.',
    
        description:
            'Concede ao alvo pontos de SORTE iguais à metade do valor obtido acima da ND da jogada, até o máximo de 5.'
    },
    
    {
        id: 'luz_sagrada',
    
        name: 'Luz Sagrada',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: '3d10 rodadas',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '1',
    
        range: 'Si mesmo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Ilumina como uma tocha.',
    
        description:
            'Ilumina a área como uma tocha enquanto o conjurador estiver concentrado. Não provoca dano nem pode incendiar objetos.'
    },
    
    {
        id: 'aguas_da_clareza',
    
        name: 'Águas da Clareza',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Imediata',
    
        defense: 'Resistir a Magia',
    
        damage: '',
    
        cost: '1',
    
        range: '5m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Remove intoxicação.',
    
        description:
            'Remove imediatamente intoxicação e efeitos químicos negativos do alvo.'
    },
    
    {
        id: 'bencao_do_amor',
    
        name: 'Bênção do Amor',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: '1d10 rodadas',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '2',
    
        range: '5m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Aumenta charme e empatia.',
    
        description:
            'Concede +3 em Carisma e Sedução ao alvo durante a duração.'
    },
    
    {
        id: 'camaras_do_conhecimento',
    
        name: 'Câmaras do Conhecimento',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '3',
    
        range: 'Si mesmo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Acessa memórias profundas.',
    
        description:
            'Permite acessar conhecimentos e memórias armazenadas na mente como se estivessem sendo vividas novamente.'
    },
    
    {
        id: 'teia_de_mentiras',
    
        name: 'Teia de Mentiras',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Iniciante',
    
        type: 'Sagrado',
    
        duration: 'Jogada de INT termina',
    
        defense: 'Resistir a Magia',
    
        damage: '',
    
        cost: '3',
    
        range: '8m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Confunde a mente do alvo.',
    
        description:
            'Confunde a mente do alvo, fazendo-o questionar memórias e informações até conseguir resistir com um teste abaixo da própria INT.'
    },
    
    {
        id: 'ritual_de_limpeza',
    
        name: 'Ritual de Limpeza',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '3',
    
        range: 'Toque',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Purifica doenças e venenos.',
    
        description:
            'Remove venenos ou doenças do alvo através de um teste de Criar Ritual. Álcool e drogas possuem ND 10, venenos ND 15 e doenças graves ND 18.'
    },
    
    {
        id: 'mensagem_magica',
    
        name: 'Mensagem Mágica',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Permanente',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '3',
    
        range: 'Ilimitado',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Armazena mensagens mágicas.',
    
        description:
            'Grava uma mensagem mágica em uma pedra preciosa ou vidro marcado com sigilo. Ao ativar o gatilho definido, uma ilusão do conjurador transmite a mensagem.'
    },
    
    {
        id: 'ritual_de_vida',
    
        name: 'Ritual de Vida',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Única',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '5',
    
        range: 'Círculo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Cria círculo regenerativo.',
    
        description:
            'Cria um círculo mágico que concede regeneração de 3 Pontos de Vida por turno por até 10 rodadas enquanto o alvo permanecer dentro da área.'
    },
    
    {
        id: 'ritual_de_magia',
    
        name: 'Ritual de Magia',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Única',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '3',
    
        range: 'Círculo',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Amplifica poder mágico.',
    
        description:
            'Cria um círculo mágico que aumenta a tolerância mágica e concede bônus à perícia Criar Ritual por 5 horas.'
    },
    
    {
        id: 'hidromancia',
    
        name: 'Hidromancia',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Ativo (2 Vigor)',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '5',
    
        range: 'Visual',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Observa eventos pela água.',
    
        description:
            'Permite observar eventos do passado ou presente através de uma porção de água. O ND varia conforme o tempo observado.'
    },
    
    {
        id: 'piromancia',
    
        name: 'Piromancia',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Ativo (4 Vigor)',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '5',
    
        range: 'Visual',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Observa eventos nas chamas.',
    
        description:
            'Permite visualizar eventos do passado ou presente através do fogo. Eventos recentes são vistos com maior precisão.'
    },
    
    {
        id: 'jarro_de_feiticos',
    
        name: 'Jarro de Feitiços',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: 'Efeito variável conforme feitiço',
    
        cost: '5',
    
        range: 'Objeto',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Armazena feitiços em recipientes.',
    
        description:
            'Cria um vórtice mágico dentro de um jarro de argila. Quando quebrado, libera um feitiço aleatório previamente definido no ritual.'
    },
    
    {
        id: 'sessao_espirita',
    
        name: 'Sessão Espírita',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: 'Permanente',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '5',
    
        range: '20m',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Invoca espíritos dos mortos.',
    
        description:
            'Permite contato com o espírito de uma pessoa morta, que surge como um espectro consciente capaz de falar sobre memórias, emoções e identidade.'
    },
    
    {
        id: 'telecomunicacao',
    
        name: 'Telecomunicação',
    
        icon: '🕯️',
    
        profession: 'Ritual',
    
        category: 'Iniciante',
    
        type: 'Ritual',
    
        duration: '1 hora',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '3',
    
        range: 'Ilimitado',
    
        action: '',
    
        unlockCost: 1,
    
        shortDescription:
            'Comunicação mágica à distância.',
    
        description:
            'Permite comunicação entre duas pessoas utilizando Telecomunicadores, desde que estejam no mesmo continente.'
    },

    {
        id: 'tecnica_de_eilhart',
    
        name: 'Técnica de Eilhart',
    
        icon: '🟣',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '12',
    
        range: '3 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Extrai informações da mente.',
    
        description:
            'Nomeado em homenagem à sua criadora, Phillipa Eilhart, este feitiço cruel permite penetrar a mente do alvo e arrancar informações. Se o teste de Lançar Feitiços for bem-sucedido, o conjurador obtém uma informação do alvo. Se o alvo falhar criticamente na defesa, perde 1 ponto de INT permanentemente.'
    },
    
    {
        id: 'ilusao',
    
        name: 'Ilusão',
    
        icon: '🟣',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Arcano',
    
        duration: '3d10 rodadas',
    
        defense: 'Resistir Magia',
    
        damage: '',
    
        cost: '8',
    
        range: '20 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Cria ilusões visuais.',
    
        description:
            'Permite criar qualquer ilusão visual dentro do alcance. Quem falhar em Resistir a Magia vê a ilusão e acredita nela. A ilusão não pode ser tocada, cheirada ou escutada.'
    },
    
    {
        id: 'teletransporte',
    
        name: 'Teletransporte',
    
        icon: '🟣',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '',
    
        cost: '10',
    
        range: 'Indeterminado',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Move-se instantaneamente.',
    
        description:
            'Permite se teletransportar instantaneamente para um local conhecido. Não é possível levar outras pessoas. Requer um teste de Lançar Feitiços ND:15. Em caso de falha, o conjurador surge em um local aleatório a 1d10 km de distância. Pode ser usado como reação.'
    },
    
    {
        id: 'bolas_das_sombras',
    
        name: 'Bolas das Sombras',
    
        icon: '🟣',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Arcano',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '8d6',
    
        cost: '15',
    
        range: '10 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Projéteis de energia sombria.',
    
        description:
            'Cria uma bola de energia sombria em cada mão. As esferas podem ser arremessadas contra até dois inimigos diferentes, causando 8d6 de dano.'
    },
    
    {
        id: 'teoria_de_elgan',
    
        name: 'Teoria de Elgan',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Terra',
    
        duration: '2d10 rodadas',
    
        defense: '',
    
        damage: '',
    
        cost: '10',
    
        range: '8 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Magnetiza metais.',
    
        description:
            'Descoberta por Elgan de Verden, esta magia magnetiza um objeto metálico. Qualquer metal a até 2 metros é atraído e grudado nele. É necessário um teste de Físico ND:18 para remover os objetos presos.'
    },
    
    {
        id: 'rhwystr_graig',
    
        name: 'Rhwystr Graig',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Terra',
    
        duration: 'Até ser destruída',
    
        defense: '',
    
        damage: '',
    
        cost: '15',
    
        range: '10 quadrados',
    
        action: 'Hibrido',
    
        unlockCost: 2,
    
        shortDescription:
            'Cria uma parede de pedra.',
    
        description:
            'Cria uma parede de pedra de 2x3 metros com 30 pontos de PP em qualquer local dentro do alcance. A parede permanece até ser destruída. Pode ser usada como reação.'
    },
    
    {
        id: 'terremoto_de_stammelford',
    
        name: 'Terremoto de Stammelford',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Terra',
    
        duration: '1d10 rodadas',
    
        defense: 'Esquivar',
    
        damage: '',
    
        cost: '12',
    
        range: '20 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Destrói e abala o terreno.',
    
        description:
            'Faz o chão tremer em um raio de 8 metros, criando terreno acidentado que reduz Reflexo em -2 e MA em -3. Criaturas podem afundar no solo e sufocar até escaparem com Atletismo.'
    },
    
    {
        id: 'trovao_de_alzur',
    
        name: 'Trovão de Alzur',
    
        icon: '💨',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Ar',
    
        duration: 'Imediata',
    
        defense: 'Esquivar',
    
        damage: '8d6',
    
        cost: '15',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Relâmpago devastador.',
    
        description:
            'Dispara um poderoso relâmpago que causa 8d6 de dano e possui 75% de chance de incendiar o alvo. O raio atravessa inimigos, perdendo 1d6 de dano a cada alvo atravessado.'
    },
    
    {
        id: 'gwynt_troelli',
    
        name: 'Gwynt Troelli',
    
        icon: '💨',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Ar',
    
        duration: 'Ativa 4 EST',
    
        defense: '',
    
        damage: '',
    
        cost: '12',
    
        range: 'Si mesmo ao redor',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Barreira de vento.',
    
        description:
            'Cria uma barreira de vento em um raio de 3 metros que bloqueia projéteis e ataques à distância. Projéteis bloqueados são arremessados aleatoriamente.'
    },
    
    {
        id: 'sufocar',
    
        name: 'Sufocar',
    
        icon: '💨',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Ar',
    
        duration: 'Ativa 4 EST',
    
        defense: 'Resistir Magia',
    
        damage: '1d10 por turno',
    
        cost: '14',
    
        range: '6 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Asfixia o alvo.',
    
        description:
            'Sufoca o alvo causando 1d10 de dano por turno. Enquanto sufoca, o alvo fica desequilibrado. O efeito termina se o conjurador perder a concentração.'
    },
    
    {
        id: 'escudo_de_demetia',
    
        name: 'Escudo de Demetia',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Fogo',
    
        duration: '',
    
        defense: '',
    
        damage: '',
    
        cost: '12',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Escudo mágico flamejante.',
    
        description:
            'Cria um escudo de fogo mágico que bloqueia feitiços de água e destrói projéteis. Criaturas vivas não conseguem atravessar a área protegida.'
    },
    
    {
        id: 'vortice_flamejante',
    
        name: 'Vórtice Flamejante',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Fogo',
    
        duration: 'Ativo 4 EST',
    
        defense: 'Esquivar',
    
        damage: '8d6',
    
        cost: '15',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Tornado de fogo destrutivo.',
    
        description:
            'Cria um tornado flamejante móvel. Alvos atingidos sofrem 8d6 de dano e possuem 50% de chance de incendiar.'
    },
    
    {
        id: 'seirff_haul',
    
        name: 'Seirff Haul',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Fogo',
    
        duration: '2d10',
    
        defense: '',
    
        damage: '1d6 por serpente',
    
        cost: '10',
    
        range: '7 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Serpentes de fogo mágico.',
    
        description:
            'Cria serpentes de fogo que agarram o alvo, causando dano contínuo e incêndio até que ele escape.'
    },
    
    {
        id: 'anialwch',
    
        name: 'Anialwch',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Água',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '4d6',
    
        cost: '8',
    
        range: '7 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Desidrata o alvo.',
    
        description:
            'Absorve líquidos do corpo do alvo, causando 4d6 de dano ignorando armaduras e reduzindo a EST em 4d6.'
    },
    
    {
        id: 'granizo_de_merigold',
    
        name: 'Granizo de Merigold',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Água',
    
        duration: 'Ativo 4 EST',
    
        defense: '',
    
        damage: '3d6',
    
        cost: '15',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Tempestade congelante.',
    
        description:
            'Cria uma tempestade de granizo em grande área. Alvos devem resistir ou sofrem 3d6 de dano por rodada.'
    },
    
    {
        id: 'ondas_de_naglfar',
    
        name: 'Ondas de Naglfar',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Profissional',
    
        type: 'Água',
    
        duration: 'Imediata',
    
        defense: '',
    
        damage: '4d6',
    
        cost: '10',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Onda congelante.',
    
        description:
            'Cria uma onda de gelo mágico que se espalha em área. Quem falhar na defesa fica congelado e sofre 4d6 de dano.'
    },
    
    {
        id: 'bencao_de_cura',
    
        name: 'Bênção de Cura',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Profissional',
    
        type: 'Terra',
    
        duration: 'Ativo (3 EST)',
    
        defense: 'Nenhuma',
    
        damage: 'Nenhum',
    
        cost: '5',
    
        range: '2m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Acelera a regeneração.',
    
        description:
            'Acelera a cura natural do alvo, restaurando 3 pontos de vida por rodada e ajudando na recuperação de ferimentos críticos.'
    },
    
    {
        id: 'reservatorio_primal',
    
        name: 'Reservatório Primal',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Profissional',
    
        type: 'Terra',
    
        duration: '2d6 rodadas',
    
        defense: 'Resistir a Magia',
    
        damage: 'Nenhum',
    
        cost: '6',
    
        range: '5m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Conecta ao poder primal.',
    
        description:
            'Conecta o alvo ao poder primal, concedendo +2 em dano corpo a corpo e penalidade de -2 em INT.'
    },
    
    {
        id: 'fios_da_vida',
    
        name: 'Fios da Vida',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Profissional',
    
        type: 'Terra',
    
        duration: 'Ativo (2 EST)',
    
        defense: 'Nenhuma',
    
        damage: 'Nenhum',
    
        cost: '4',
    
        range: '10m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Enxerga energia vital.',
    
        description:
            'Permite visualizar a energia vital dos alvos, revelando pontos de vida restantes e ferimentos críticos.'
    },
    
    {
        id: 'fogo_purificador',
    
        name: 'Fogo Purificador',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Profissional',
    
        type: 'Sagrado',
    
        duration: 'Até ser apagado',
    
        defense: 'Resistir a Magia',
    
        damage: '3d6',
    
        cost: '6',
    
        range: '10m',
    
        action: 'Principal',
    
        unlockCost: 2,
    
        shortDescription:
            'Chamas sagradas.',
    
        description:
            'Incendeia o alvo com fogo sagrado, causando 3d6 de dano e mantendo o alvo em chamas.'
    },
    
    {
        id: 'fortificacao_sagrada',
    
        name: 'Fortificação Sagrada',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Profissional',
    
        type: 'Sagrado',
    
        duration: 'Imediata',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '5',
    
        range: '10m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Refaz resistência mágica.',
    
        description:
            'Envolve o alvo com energia sagrada permitindo um novo teste contra um feitiço ativo.'
    },
    
    {
        id: 'luz_da_verdade',
    
        name: 'Luz da Verdade',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Profissional',
    
        type: 'Sagrado',
    
        duration: 'Ativo (2 EST)',
    
        defense: 'Resistir a Magia',
    
        damage: '',
    
        cost: '4',
    
        range: '5m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Força a verdade.',
    
        description:
            'Cria uma luz sagrada que obriga o alvo a responder com sinceridade enquanto falhar em resistir.'
    },
    
    {
        id: 'consagrar',
    
        name: 'Consagrar',
    
        icon: '📜',
    
        profession: 'Ritual',
    
        category: 'Profissional',
    
        type: 'Ritual',
    
        duration: 'Até ser desfeito',
    
        defense: 'Resistir a Magia',
    
        damage: '',
    
        cost: '12',
    
        range: 'Raio de 10m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Afasta monstros.',
    
        description:
            'Cria um círculo mágico que impede monstros de entrarem caso falhem em Resistir a Magia.'
    },
    
    {
        id: 'barreira_magica',
    
        name: 'Barreira Mágica',
    
        icon: '📜',
    
        profession: 'Ritual',
    
        category: 'Profissional',
    
        type: 'Ritual',
    
        duration: 'Ativa (2 EST)',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '10',
    
        range: 'Raio de 10m',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Escudo ritualístico.',
    
        description:
            'Cria uma barreira circular que absorve até 50 pontos de dano físico ou mágico.'
    },
    
    {
        id: 'oniromancia',
    
        name: 'Oniromancia',
    
        icon: '📜',
    
        profession: 'Ritual',
    
        category: 'Profissional',
    
        type: 'Ritual',
    
        duration: '10 rodadas',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '8',
    
        range: 'Sonho compartilhado',
    
        action: 'Bonus',
    
        unlockCost: 2,
    
        shortDescription:
            'Explora sonhos.',
    
        description:
            'Permite acessar sonhos para descobrir segredos e verdades ocultas sobre eventos do passado e presente.'
    },

    {
        id: 'comando_mental',
    
        name: 'Comando Mental',
    
        icon: '🧠',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Arcano',
    
        duration: 'Até a tarefa ser feita',
    
        defense: '',
    
        damage: '',
    
        cost: '25',
    
        range: '5 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Implanta ordens irresistíveis.',
    
        description:
            'Permite plantar uma ordem na mente de um alvo. Esse comando deve ser executado perfeitamente pelo alvo. Se o comando for algo que a pessoa nunca faria, ela recebe +5 no teste de Resistir a Magia.'
    },
    
    {
        id: 'portal_vertical',
    
        name: 'Portal Vertical',
    
        icon: '🧠',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Arcano',
    
        duration: 'Ativo 6 EST',
    
        defense: '',
    
        damage: '',
    
        cost: '22',
    
        range: '7 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Abre portais dimensionais.',
    
        description:
            'Cria um portal flutuante de 1m por 2m até 10m de você. Atravessar o portal permite se teletransportar para qualquer lugar lembrado. O portal pode transportar qualquer coisa que caiba nele. Encerrar o portal enquanto algo estiver parcialmente dentro corta o alvo ao meio, causando desmembramento equivalente a um Ferimento Crítico. Também pode ser usado para locais desconhecidos, como Teletransporte.'
    },
    
    {
        id: 'polimorfismo',
    
        name: 'Polimorfismo',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Terra',
    
        duration: 'Até ser lançado novamente',
    
        defense: '',
    
        damage: '',
    
        cost: '22',
    
        range: 'Si mesmo',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Transforma o conjurador em animal.',
    
        description:
            'Permite assumir a forma de uma serpente, gato, pássaro ou cachorro. Enquanto transformado, você utiliza as estatísticas físicas do animal escolhido. Todos os itens carregados são transformados junto. O feitiço deve ser lançado novamente para retornar à forma humana.'
    },
    
    {
        id: 'transmutacao',
    
        name: 'Transmutação',
    
        icon: '🌿',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Terra',
    
        duration: 'Permanente',
    
        defense: '',
    
        damage: '',
    
        cost: '30',
    
        range: 'Metal',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Altera metais e minerais.',
    
        description:
            'Permite mudar as propriedades de minerais e metais. Você pode transformar uma unidade de metal em qualquer outro metal ou aperfeiçoar pedras preciosas para uso mágico. Dimerítio e metais em contato com ele não podem ser transformados.'
    },
    
    {
        id: 'dervixe',
    
        name: 'Dervixe',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Ar',
    
        duration: 'Ativo 6 EST',
    
        defense: 'Esquivar',
    
        damage: '1d6 * Quadrados arremessado',
    
        cost: '22',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 3,
    
        shortDescription:
            'Cria um tornado devastador.',
    
        description:
            'Cria um tornado com raio de 8m que redireciona projéteis e ataques à distância. O tornado funciona como Zéfiro contra qualquer alvo até 2 quadrados de distância, arremessando inimigos conforme o resultado acima da defesa. O dano causado é de 1d6 para cada quadrado que o alvo for lançado.'
    },
    
    {
        id: 'tempestade_de_raios',
    
        name: 'Tempestade de Raios',
    
        icon: '🌪️',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Ar',
    
        duration: 'Ativo 6 EST',
    
        defense: 'Esquivar',
    
        damage: '8d6',
    
        cost: '25',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 3,
    
        shortDescription:
            'Invoca uma tempestade elétrica.',
    
        description:
            'Cria uma tempestade de raios em um raio de 12 metros. Qualquer criatura na área possui 35% de chance de ser atingida por um raio. Caso falhe na defesa, sofre 8d6 de dano no tronco e possui 75% de chance de ser incendiada.'
    },
    
    {
        id: 'fogo_de_melgar',
    
        name: 'Fogo de Melgar',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Esquivar',
    
        damage: '8d6',
    
        cost: '25',
    
        range: '40 quadrados',
    
        action: 'Principal',
    
        unlockCost: 3,
    
        shortDescription:
            'Faz chover bolas de fogo.',
    
        description:
            'Permite invocar uma chuva de bolas de fogo sobre uma área gigantesca. Alvos na área possuem 70% de chance de serem atingidos. Caso falhem na defesa, sofrem 8d6 de dano em uma parte aleatória do corpo e têm 70% de chance de serem incendiados.'
    },
    
    {
        id: 'efeito_espelho',
    
        name: 'Efeito Espelho',
    
        icon: '🔥',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Fogo',
    
        duration: 'Imediata',
    
        defense: 'Esquivar ou Bloquear',
    
        damage: '10d6',
    
        cost: '25',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 3,
    
        shortDescription:
            'Dispara um raio solar devastador.',
    
        description:
            'Cria um raio de luz cegante que provoca 10d6 de dano. O feitiço destrói praticamente qualquer bloqueio, podendo apenas ser refletido por superfícies reflexivas. O raio refletido segue em direção aleatória. Em locais sem luz solar direta, o dano é reduzido pela metade.'
    },
    
    {
        id: 'partir_agua',
    
        name: 'Partir Água',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Água',
    
        duration: 'Ativo 6 EST',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '25',
    
        range: '20 quadrados',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Separa grandes massas de água.',
    
        description:
            'Permite abrir uma área gigantesca dentro de um corpo d’água, empurrando toda a água e criaturas para os lados. Você pode atravessar livremente a abertura sem desfazer o efeito. A área pode ser criada em qualquer orientação, inclusive vertical.'
    },
    
    {
        id: 'tryferi_gaeaf',
    
        name: 'Tryferi Gaeaf',
    
        icon: '💧',
    
        profession: 'Mago',
    
        category: 'Mestre',
    
        type: 'Água',
    
        duration: '1d10 rodadas',
    
        defense: 'Esquivar ou Bloquear',
    
        damage: '5d6',
    
        cost: '22',
    
        range: '20 quadrados',
    
        action: 'Principal',
    
        unlockCost: 3,
    
        shortDescription:
            'Dispara estacas de gelo.',
    
        description:
            'Permite disparar diversas estacas de gelo em um raio de 12m, igual à metade de seu valor em Lançar Feitiços. Cada estaca causa 5d6 de dano e, caso atravesse armadura, congela o alvo e provoca 2 de dano por rodada até ser removida.'
    },
    
    {
        id: 'moldar_a_natureza',
    
        name: 'Moldar a Natureza',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Mestre',
    
        type: 'Terra',
    
        duration: '1d10 rodadas',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '12',
    
        range: '10m',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Cria um golem natural.',
    
        description:
            'Transforma uma árvore próxima em um golem obediente durante a duração do feitiço. Quando o efeito termina, o golem volta a ser árvore. Caso destruído, gera 2d10 unidades de madeira.'
    },
    
    {
        id: 'cancao_do_ceu',
    
        name: 'Canção do Céu',
    
        icon: '🌿',
    
        profession: 'Druida',
    
        category: 'Mestre',
    
        type: 'Terra',
    
        duration: 'Ativo (5 EST)',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '10',
    
        range: '50m',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Controla o clima da região.',
    
        description:
            'Permite alterar o clima para céu limpo, chuva, ventania, tempestade ou outras condições. Ventania aplica –2 DES em ataques à distância e tempestades possuem chance de atingir criaturas com raios.'
    },
    
    {
        id: 'portal_divino',
    
        name: 'Portal Divino',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mestre',
    
        type: 'Sagrado',
    
        duration: '1 rodada',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '12',
    
        range: 'N/C',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Abre um portal sagrado.',
    
        description:
            'Cria um portal vertical por um breve instante permitindo viajar para qualquer local lembrado. Caso o destino seja desconhecido, funciona da mesma forma que o feitiço Portal Vertical.'
    },
    
    {
        id: 'sabedoria_divina',
    
        name: 'Sabedoria Divina',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mestre',
    
        type: 'Sagrado',
    
        duration: 'Ativo (5 EST)',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '10',
    
        range: '50m',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Recebe respostas divinas.',
    
        description:
            'Permite obter uma resposta guiada por poder divino para uma pergunta. O feitiço não prevê o futuro e a dificuldade depende do quão secreta é a informação.'
    },
    
    {
        id: 'compressao_de_artefato',
    
        name: 'Compressão de Artefato',
    
        icon: '📜',
    
        profession: 'Ritual',
    
        category: 'Mestre',
    
        type: 'Ritual',
    
        duration: 'Até ser revertido',
    
        defense: 'Tolerância',
    
        damage: '6d6',
    
        cost: '16',
    
        range: '10m',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Comprime seres e objetos.',
    
        description:
            'Comprime uma criatura ou objeto em um invólucro reduzido a 1/10 do tamanho original. O alvo permanece inconsciente enquanto durar o efeito. O processo é extremamente doloroso e pode causar alterações permanentes.'
    },
    
    {
        id: 'criar_golem',
    
        name: 'Criar Golem',
    
        icon: '📜',
    
        profession: 'Ritual',
    
        category: 'Mestre',
    
        type: 'Ritual',
    
        duration: 'Permanente',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '15',
    
        range: 'Toque',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Cria um golem permanente.',
    
        description:
            'Cria um golem permanente que serve fielmente ao conjurador até sua destruição. O golem executa ordens simples e continua realizando sua última ordem indefinidamente.'
    },
    
    {
        id: 'ilusao_interativa',
    
        name: 'Ilusão Interativa',
    
        icon: '📜',
    
        profession: 'Ritual',
    
        category: 'Mestre',
    
        type: 'Ritual',
    
        duration: 'Foco ativo',
    
        defense: 'Resistir a Magia ou Tolerância',
    
        damage: '',
    
        cost: '12',
    
        range: 'Raio de 20m',
    
        action: 'Bonus',
    
        unlockCost: 3,
    
        shortDescription:
            'Cria ilusões totalmente sensoriais.',
    
        description:
            'Cria uma ilusão completa com elementos visuais, auditivos, olfativos e táteis. A ilusão parece totalmente real, permitindo interação física simulada. Criaturas afetadas devem resistir para não acreditarem nela.'
    },

    {
        id: 'bencao_da_morte',
    
        name: 'Benção da Morte',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mor',
    
        type: 'Sagrado',
    
        duration: 'Imediata',
    
        defense: 'Resistir a Magia',
    
        damage: '',
    
        cost: '16',
    
        range: '10m',
    
        action: 'Bonus',
    
        unlockCost: 4,
    
        shortDescription:
            'Condena o alvo à morte.',
    
        description:
            'Você invoca o poder da Aranha Cabeça-Leonina, cortando as conexões que mantêm o alvo vivo neste mundo. O alvo deve realizar um teste de Resistir a Magia. Caso falhe, sofre os efeitos da Morte como se tivesse entrado em estado de morte normal. Um sucesso em Primeiros Socorros ou Magias de Cura com ND 16 restaura imediatamente os Pontos de Vida anteriores do alvo.'
    },
    
    {
        id: 'descanso_que_cura',
    
        name: 'Descanso que Cura',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mor',
    
        type: 'Sagrado',
    
        duration: '1 dia',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '16',
    
        range: '5m',
    
        action: 'Bonus',
    
        unlockCost: 4,
    
        shortDescription:
            'Sono restaurador divino.',
    
        description:
            'Com o poder de Melitele, a Deusa Mãe, você coloca um número de pessoas igual à sua perícia em Lançar Feitiços em um descanso profundo. Durante o efeito, permanecem inconscientes ao ambiente. Ao despertar, retornam com vitalidade completa. Ferimentos críticos tratados são fechados, mas penalidades permanentes de Ferimentos Críticos Fatais permanecem.'
    },
    
    {
        id: 'julgamento_eterno',
    
        name: 'Julgamento Eterno',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mor',
    
        type: 'Sagrado',
    
        duration: 'Até ser apagado',
    
        defense: 'Resistir a Magia',
    
        damage: 'Dobro do dano normal de fogo',
    
        cost: '16',
    
        range: '10m',
    
        action: 'Principal',
    
        unlockCost: 4,
    
        shortDescription:
            'Incendeia com fogo sagrado.',
    
        description:
            'Com o poder do Fogo Eterno, o alvo explode em chamas brancas brilhantes com tons vermelhos. O fogo causa o dobro do dano normal de fogo e não pode ser apagado exceto por magia ou submersão completa em água por 3 rodadas.'
    },
    
    {
        id: 'sorte_do_pai',
    
        name: 'Sorte do Pai',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mor',
    
        type: 'Sagrado',
    
        duration: '1 hora',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '16',
    
        range: 'Si mesmo/10m',
    
        action: 'Bonus',
    
        unlockCost: 4,
    
        shortDescription:
            'Manipula a providência divina.',
    
        description:
            'Com o poder de Kreve, o Pai Todo-Poderoso, você invoca providência divina. Durante a duração, pode gastar pontos de SORTE equivalentes à sua perícia em Lançar Feitiços vezes 3 para aumentar jogadas próprias ou conceder bônus e penalidades em jogadas de criaturas até 10m.'
    },
    
    {
        id: 'bravura_de_freya',
    
        name: 'Bravura de Freya',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mor',
    
        type: 'Sagrado',
    
        duration: '20 rodadas',
    
        defense: 'Nenhuma',
    
        damage: '',
    
        cost: '16',
    
        range: 'Raio de 20m',
    
        action: 'Bonus',
    
        unlockCost: 4,
    
        shortDescription:
            'Concede vitalidade divina.',
    
        description:
            'Você invoca o espírito de Freya, criando um brilho em um raio de 20m. Alvos escolhidos recebem +25 Pontos de Vida enquanto permanecerem dentro da área iluminada. Ao sair da área, o efeito desaparece.'
    },
    
    {
        id: 'chama_branca',
    
        name: 'Chama Branca',
    
        icon: '✨',
    
        profession: 'Sacerdote',
    
        category: 'Mor',
    
        type: 'Sagrado',
    
        duration: '1 hora',
    
        defense: 'Resistir a Magia',
    
        damage: '',
    
        cost: '16',
    
        range: 'Raio de 10m',
    
        action: 'Bonus',
    
        unlockCost: 4,
    
        shortDescription:
            'Invoca fogo sagrado imortal.',
    
        description:
            'Você cria uma Chama Branca que ilumina uma área com luz ofuscante. Qualquer criatura que toque a chama é descongelada. A chama não pode ser apagada por água ou vento. Feitiços em área contra o conjurador sofrem penalidades dobradas.'
    },

    {
        id: 'hex_das_sombras',
        name: 'Hex das Sombras',
        icon: '🕯️',
        category: 'Hex',
        type: 'Hex',
        profession: 'Hex',
        description: 'A Hex das Sombras cria sussurros nas sombras e silhuetas em esquinas. O alvo deve realizar testes aleatórios de Consciência, sempre com a sensação de estar sendo observado. Esses testes nunca revelam a verdade, apenas visões distorcidas.\n\nPerigo: baixo.\n\nPara se livrar, o alvo deve trazer uma tigela de água limpa, um galho de mirto branco e um pote de tinta, lavar o galho sob a lua crescente e mergulhá-lo na tinta enquanto respira fundo.',
        shortDescription: 'Sussurros e paranoia constante',
        duration: 'Indeterminada',
        defense: 'Consciência',
        damage: 'Nenhum',
        consumption: '4',
        range: '10m',
        action: 'Hex',
        unlockCost: '1',
        cost: '4'
    },
    
    {
        id: 'comichao_eterno',
        name: 'Comichão Eterno',
        icon: '🦠',
        category: 'Hex',
        type: 'Hex',
        profession: 'Hex',
        description: 'O Eterno Comichão causa pústulas inflamadas e irritação constante, perturbando órgãos genitais e o ânus do alvo. O efeito causa desconforto contínuo e penalidades cumulativas.\n\nPerigo: baixo.\n\nPara se livrar, o alvo deve usar um cogumelo skinner, pequena cianita e briônia, acender uma fogueira e aplicar as ervas enquanto palavras mágicas são recitadas.',
        shortDescription: 'Irritação constante e pústulas',
        duration: 'Até ser curado',
        defense: 'Nenhuma',
        damage: 'Nenhum',
        consumption: '4',
        range: '10m',
        action: 'Hex',
        unlockCost: '1',
        cost: '4'
    },
    
    {
        id: 'sorte_do_capeta',
        name: 'Sorte do Capeta',
        icon: '🎲',
        category: 'Hex',
        type: 'Hex',
        profession: 'Hex',
        description: 'A Sorte do Capeta atormenta o alvo com momentos extremos de sorte e azar. Em situações de alto estresse, o alvo deve realizar teste de Resistir Coerção com ND maior ou igual a 15, caso contrário sofre consequências aleatórias.\n\nPerigo: médio.\n\nPara se livrar, o alvo deve martelar um prego prateado em madeira por duas horas, untá-lo com óleo de vinagre, fixar o prego no cabelo, botar fogo nos cabelos e respirar profundamente.',
        shortDescription: 'Azar e sorte extremos',
        duration: '1 semana',
        defense: 'Resistir Coerção',
        damage: 'Nenhum',
        consumption: '8',
        range: '10m',
        action: 'Hex',
        unlockCost: '1',
        cost: '8'
    },
    
    {
        id: 'pesadelo',
        name: 'Pesadelo',
        icon: '🌑',
        category: 'Hex',
        type: 'Hex',
        profession: 'Hex',
        description: 'O Pesadelo força o alvo a reviver o mesmo sonho aterrador todas as noites. O alvo deve realizar teste de Resistir Coerção contra ND igual à jogada de Criar Hex feita contra ele. Em falha, não recupera PV ou EST durante a noite e perde metade da Estamina se dormir menos de 4 horas.\n\nPerigo: médio.\n\nPara se livrar, o alvo deve juntar velas, ossos de besta e minério incandescente, realizando um ritual noturno completo.',
        shortDescription: 'Sonhos aterradores recorrentes',
        duration: 'Até ser quebrado',
        defense: 'Resistir Coerção',
        damage: 'Nenhum',
        consumption: '8',
        range: '10m',
        action: 'Hex',
        unlockCost: '1',
        cost: '8'
    },
    
    {
        id: 'beijo_da_pesta',
        name: 'Beijo de Pesta',
        icon: '☣️',
        category: 'Hex',
        type: 'Hex',
        profession: 'Hex',
        description: 'O Beijo da Pesta retira a habilidade do alvo de combater doenças. Ao contato com pessoa doente, há 75% de chance de adoecer. O cheiro do alvo torna-se levemente nauseante. Para resistir, deve passar em teste de Tolerância ND 16 ou ficar com náuseas.\n\nPerigo: alto.\n\nPara se livrar, o alvo deve juntar argila de rio, carvão e pó infundido, criar um totem e passar por uma série de palavras mágicas e rituais até o efeito cessar.',
        shortDescription: 'Maldição ligada a doenças',
        duration: 'Até ser curado',
        defense: 'Tolerância',
        damage: 'Nenhum',
        consumption: '12',
        range: '10m',
        action: 'Hex',
        unlockCost: '1',
        cost: '12'
    },
    
    {
        id: 'hex_da_besta',
        name: 'Hex da Besta',
        icon: '🐺',
        category: 'Hex',
        type: 'Hex',
        profession: 'Hex',
        description: 'A Hex da Besta faz com que animais hostilizem o alvo. Animais agem de forma agressiva, impondo -3 em Conduzir Animal. Criaturas a até 10m têm 50% de chance de atacar.\n\nPerigo: alto.\n\nPara se livrar, o alvo deve coletar visco, fosforo, unidades de óleo de corvo e calêndula, sacrificar um animal, enrolar o corpo em visco e realizar oferenda ritualística ao pôr do sol.',
        shortDescription: 'Animais tornam-se agressivos',
        duration: 'Até ser quebrado',
        defense: 'Nenhuma',
        damage: 'Nenhum',
        consumption: '12',
        range: '10m',
        action: 'Hex',
        unlockCost: '1',
        cost: '12'
    },

];