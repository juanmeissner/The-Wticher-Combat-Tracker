// =========================================
// ITENS PRÉ DEFINIDOS
// =========================================

const predefinedItems = [

    // =====================================
    // ALIMENTOS E BEBIDAS
    // Cada unidade do inventário representa uma porção.
    // =====================================

    {
        id: 'racaodeviagem',
        name: 'Ração de Viagem',
        icon: '🥖',
        category: 'usable',
        goldValue: 10,
        description: 'Uma porção simples e resistente para viagens. Conta como Refeição Simples ao ser consumida.',
        shortDescription: 'Alimento · Refeição Simples · 1 porção',
        recipe: [
            '1x Cereais',
            '1x Carne Seca',
            '1x Sal'
        ],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: {
            kind: 'food',
            quality: 'simple',
            portionsPerUnit: 1,
            durationCycles: 0,
            categoryId: 'food',
            optionId: 'simple_meal'
        }
    },

    {
        id: 'ensopadodeestalagem',
        name: 'Ensopado de Estalagem',
        icon: '🍲',
        category: 'usable',
        goldValue: 20,
        description: 'Uma refeição quente e completa. Conta como Refeição Boa ao ser consumida.',
        shortDescription: 'Alimento · Refeição Boa · 1 porção',
        recipe: [
            '1x Carne',
            '1x Legumes',
            '1x Ervas Culinárias',
            '1x Água Potável'
        ],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: {
            kind: 'food',
            quality: 'good',
            portionsPerUnit: 1,
            durationCycles: 1,
            categoryId: 'food',
            optionId: 'good_meal'
        }
    },

    {
        id: 'banquetedetoussaint',
        name: 'Banquete de Toussaint',
        icon: '🍗',
        category: 'usable',
        goldValue: 60,
        description: 'Uma refeição sofisticada e abundante. Conta como Refeição Sofisticada ao ser consumida.',
        shortDescription: 'Alimento · Refeição Sofisticada · 1 porção',
        recipe: [
            '2x Carne Nobre',
            '2x Legumes',
            '1x Ervas Culinárias',
            '1x Vinho de Toussaint',
            '1x Mel'
        ],
        craftYield: 4,
        craftingCategory: 'culinary',
        careConsumable: {
            kind: 'food',
            quality: 'sophisticated',
            portionsPerUnit: 1,
            durationCycles: 1,
            categoryId: 'food',
            optionId: 'sophisticated_meal'
        }
    },

    {
        id: 'aguapotavel',
        name: 'Água Potável',
        icon: '💧',
        category: 'usable',
        goldValue: 1,
        description: 'Uma porção de água própria para consumo. O uso é registrado, mas não substitui uma refeição.',
        shortDescription: 'Bebida · Sem efeito de refeição · 1 porção',
        recipe: [
            '2x Água Bruta',
            '1x Carvão'
        ],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: {
            kind: 'drink',
            quality: 'simple',
            portionsPerUnit: 1,
            durationCycles: 0,
            effect: 'Hidratação registrada; não substitui uma refeição.'
        }
    },

    {
        id: 'cervejademahakam',
        name: 'Cerveja de Mahakam',
        icon: '🍺',
        category: 'usable',
        goldValue: 3,
        description: 'Uma porção de bebida alcoólica anã. O uso é registrado, mas não substitui uma refeição.',
        shortDescription: 'Bebida alcoólica · 1 porção',
        recipe: [
            '2x Cereais',
            '1x Lúpulo',
            '1x Levedura',
            '1x Água Potável'
        ],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: {
            kind: 'drink',
            quality: 'good',
            alcoholic: true,
            portionsPerUnit: 1,
            durationCycles: 0,
            effect: 'Consumo alcoólico registrado; efeitos adicionais ficam a critério do mestre.'
        }
    },

    {
        id: 'vinhodetoussaint',
        name: 'Vinho de Toussaint',
        icon: '🍷',
        category: 'usable',
        goldValue: 10,
        description: 'Uma porção de vinho refinado. O uso é registrado, mas não substitui uma refeição.',
        shortDescription: 'Bebida alcoólica sofisticada · 1 porção',
        recipe: [
            '2x Uvas de Toussaint',
            '1x Levedura'
        ],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: {
            kind: 'drink',
            quality: 'sophisticated',
            alcoholic: true,
            portionsPerUnit: 1,
            durationCycles: 0,
            effect: 'Consumo alcoólico registrado; efeitos adicionais ficam a critério do mestre.'
        }
    },

    {
        id: 'paorustico',
        name: 'Pão Rústico',
        icon: '🍞',
        category: 'usable',
        goldValue: 6,
        description: 'Pão simples de viagem. Conta como Refeição Simples ao ser consumido.',
        shortDescription: 'Alimento · Refeição Simples · 1 porção',
        recipe: ['2x Farinha', '1x Levedura', '1x Água Potável', '1x Sal'],
        craftYield: 3,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'simple', portionsPerUnit: 1, durationCycles: 0, categoryId: 'food', optionId: 'simple_meal' }
    },

    {
        id: 'sopadelegumes',
        name: 'Sopa de Legumes',
        icon: '🥣',
        category: 'usable',
        goldValue: 8,
        description: 'Sopa leve preparada com vegetais. Conta como Refeição Simples ao ser consumida.',
        shortDescription: 'Alimento · Refeição Simples · 1 porção',
        recipe: ['1x Batata', '1x Cenoura', '1x Cebola', '1x Água Potável', '1x Sal'],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'simple', portionsPerUnit: 1, durationCycles: 0, categoryId: 'food', optionId: 'simple_meal' }
    },

    {
        id: 'coelhoassadocomervas',
        name: 'Coelho Assado com Ervas',
        icon: '🍖',
        category: 'usable',
        goldValue: 20,
        description: 'Carne de coelho assada com ervas e manteiga. Conta como Refeição Boa ao ser consumida.',
        shortDescription: 'Alimento · Refeição Boa · 1 porção',
        recipe: ['1x Carne de Coelho', '1x Ervas Culinárias', '1x Manteiga', '1x Sal'],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'good', portionsPerUnit: 1, durationCycles: 1, categoryId: 'food', optionId: 'good_meal' }
    },

    {
        id: 'ensopadodeveado',
        name: 'Ensopado de Veado',
        icon: '🍲',
        category: 'usable',
        goldValue: 25,
        description: 'Ensopado nutritivo de caça e vegetais. Conta como Refeição Boa ao ser consumido.',
        shortDescription: 'Alimento · Refeição Boa · 1 porção',
        recipe: ['1x Carne de Veado', '1x Batata', '1x Cenoura', '1x Cebola', '1x Ervas Culinárias', '1x Água Potável'],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'good', portionsPerUnit: 1, durationCycles: 1, categoryId: 'food', optionId: 'good_meal' }
    },

    {
        id: 'porcoassadocomalho',
        name: 'Porco Assado com Alho',
        icon: '🥓',
        category: 'usable',
        goldValue: 22,
        description: 'Carne de porco assada com alho e ervas. Conta como Refeição Boa ao ser consumida.',
        shortDescription: 'Alimento · Refeição Boa · 1 porção',
        recipe: ['1x Carne de Porco', '1x Alho', '1x Ervas Culinárias', '1x Sal'],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'good', portionsPerUnit: 1, durationCycles: 1, categoryId: 'food', optionId: 'good_meal' }
    },

    {
        id: 'omeletecomcogumelos',
        name: 'Omelete com Cogumelos',
        icon: '🍳',
        category: 'usable',
        goldValue: 18,
        description: 'Omelete reforçada com cogumelos comestíveis. Conta como Refeição Boa ao ser consumida.',
        shortDescription: 'Alimento · Refeição Boa · 1 porção',
        recipe: ['2x Ovos', '1x Cogumelos Comestíveis', '1x Manteiga', '1x Sal'],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'good', portionsPerUnit: 1, durationCycles: 1, categoryId: 'food', optionId: 'good_meal' }
    },

    {
        id: 'tortadecarne',
        name: 'Torta de Carne',
        icon: '🥧',
        category: 'usable',
        goldValue: 28,
        description: 'Torta recheada com carne de porco e ovos. Conta como Refeição Boa ao ser consumida.',
        shortDescription: 'Alimento · Refeição Boa · 1 porção',
        recipe: ['2x Farinha', '1x Carne de Porco', '1x Ovos', '1x Manteiga', '1x Sal'],
        craftYield: 2,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'good', portionsPerUnit: 1, durationCycles: 1, categoryId: 'food', optionId: 'good_meal' }
    },

    {
        id: 'estufadorealdacaca',
        name: 'Estufado Real da Caça',
        icon: '🍛',
        category: 'usable',
        goldValue: 60,
        description: 'Estufado abundante com três carnes, vinho e vegetais. Conta como Refeição Sofisticada ao ser consumido.',
        shortDescription: 'Alimento · Refeição Sofisticada · 1 porção',
        recipe: ['1x Carne de Coelho', '1x Carne de Veado', '1x Carne de Porco', '2x Legumes', '1x Ervas Culinárias', '1x Vinho de Toussaint'],
        craftYield: 4,
        craftingCategory: 'culinary',
        careConsumable: { kind: 'food', quality: 'sophisticated', portionsPerUnit: 1, durationCycles: 1, categoryId: 'food', optionId: 'sophisticated_meal' }
    },

    // =====================================
    // USÁVEIS
    // =====================================

    {
        id: 'solucaoacida',
        name: 'Solução Ácida',
        icon: 'https://static.divine-pride.net/images/items/item/22542.png',
        category: 'usable',
        goldValue: 10,
        description: 'Provoca 4d6 de dano ao ser arremessada; 1d6 de dano de ablação a armas/armaduras. Espalha-se num cone de 3m.',
        recipe: [
            'Água-forte',
            'Enxofre',
            'Água Ducal'
        ]
    },

    {
        id: 'tumbadeadda',
        name: 'Tumba de Adda',
        icon: 'https://static.divine-pride.net/images/items/item/11573.png',
        category: 'usable',
        goldValue: 0,
        description: 'Preserva comidas e corpos. Perecíveis tratados não apodrecem por 1d10 dias (corpo humano = 2 doses).',
        recipe: [
            'Pedra de Amolar',
            'Verbena',
            'Cera de Ogro'
        ]
    },

    {
        id: 'adesivoalquimico',
        name: 'Adesivo Alquímico',
        icon: 'https://static.divine-pride.net/images/items/item/12475.png',
        category: 'usable',
        active: 0,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Fica grudado até passar em teste Físico de ND: 16',
        description: 'Gruda objetos e pessoas após 2 rodadas. Para separar, é necessário teste de Físico ND:16. Arremessável..',
        recipe: [
            'Visco',
            'Água-forte',
            'Água Ducal'
        ]
    },

    {
        id: 'pobasico',
        name: 'Pó Básico',
        icon: 'https://static.divine-pride.net/images/items/item/656.png',
        category: 'usable',
        goldValue: 0,
        description: 'Anula o efeito da solução ácida ou remove o dano de um ferimento crítico de estômago rasgado.',
        recipe: [
            'Extrato de Mandrágora',
            'Heléboro',
            'Scleroderma'
        ]
    },

    {
        id: 'venenonegro',
        name: 'Veneno Negro',
        icon: 'https://static.divine-pride.net/images/items/item/22613.png',
        category: 'usable',
        goldValue: 0,
        description: 'Envenena se ingerido ou em contato com sangue. Teste de Tolerância ND:18 para resistir.',
        recipe: [
            'Extrato de Veneno',
            'Raiz de Mandrágora',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'furiadebredan',
        name: 'Fúria de Bredan',
        icon: 'https://static.divine-pride.net/images/items/item/12424.png',
        category: 'usable',
        goldValue: 0,
        description: 'Explode ao contato com o ar, causando 3d6 de dano num raio de 4m, e causando 3 de dano em armaduras, os alvos terão que passar em um teste de tolerância para não incendiar.',
        recipe: [
            'Fósforo',
            'Fragmentos Lunares',
            'Polvora'
        ]
    },

    {
        id: 'cloroformio',
        name: 'Clorofórmio',
        icon: 'https://static.divine-pride.net/images/items/item/103649.png',
        category: 'usable',
        active: 0,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Induz inconsciência por respiração. Teste de resistência a Desmaiado ND 18 com penalidade de -2',
        description: 'Induz inconsciência por respiração. Teste de resistência a Desmaiado ND 18 com penalidade de -2.',
        recipe: [
            'Água Destilada',
            'Água Ducal',
            'Enxofre'
        ]
    },

    {
        id: 'podecoagulacao',
        name: 'Pó de Coagulação',
        icon: 'https://static.divine-pride.net/images/items/item/14614.png',
        category: 'usable',
        active: 10,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Estanca sangramentos por 10 rodadas. Após o tempo, o ferimento volta a sangrar.',
        description: 'Estanca sangramentos por 10 rodadas. Após o tempo, o ferimento volta a sangrar.',
        recipe: [
            'Folhas de Bálisa',
            'Mofo Verde',
            'Cal'
        ]
    },

    {
        id: 'fissstech',
        name: 'Fissstech',
        icon: 'https://static.divine-pride.net/images/items/item/22545.png',
        category: 'usable',
        active: 15,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Transe eufórico por 15 turnos: reduz pela metade o dano final que alcançaria o usuário e suprime penalidades de dor.',
        description: 'Provoca transe eufórico por 15 turnos. Depois de escudos, armadura e multiplicadores, reduz pela metade o dano que alcançaria o usuário e informa quanto foi suprimido. Altamente viciante: teste de Tolerância ND 20 após cada uso.',
        recipe: [
            '?',
            '?',
            '?'
        ]
    },

    {
        id: 'alucinogeno',
        name: 'Alucinógeno',
        icon: 'https://static.divine-pride.net/images/items/item/12419.png',
        category: 'usable',
        active: 0,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Alucinações até passar em teste de resistência ND 18',
        description: 'Causa alucinações até o alvo passar em um teste de resistência ND 18. Pode ser jogado ou dissolvido em bebida.',
        recipe: [
            'Seiva Branca',
            'Visco',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'tintainvisivel',
        name: 'Tinta Invisível',
        icon: 'https://static.divine-pride.net/images/items/item/11501.png',
        category: 'usable',
        goldValue: 0,
        description: 'Permite escrever mensagens invisíveis, visíveis apenas ao serem aquecidas por 1 turno.',
        recipe: [
            'Sempre-viva Anã',
            'Óleo Escurecedor',
            'Pó Espectral'
        ]
    },

    {
        id: 'ervasentorpecentes',
        name: 'Ervas Entorpecentes',
        icon: 'https://static.divine-pride.net/images/items/item/11551.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Alivia a dor e reduz negativo de ferimentos críticos e estado próximo da morte em 2',
        description: 'Aplicadas em ferimentos, aliviam a dor, reduzindo negativos de ferimentos críticos e de estado próximo da morte em 2. Dura 20 rodadas.',
        recipe: [
            'Quelidônia',
            'Fruta de Uva-Espim',
            'Pequena Cicuta',
            'Heleboro'
        ]
    },

    {
        id: 'elixirdepantagran',
        name: 'Elixir de Pantagran',
        icon: 'https://static.divine-pride.net/images/items/item/22612.png',
        category: 'usable',
        active: 0,
        timeDuration: { amount: 2, unit: 'hours' },
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Alegria delirante por 2 horas: favorece interações sociais e Coragem, mas prejudica discernimento e autocontrole.',
        description: 'Aplica Alegria Delirante por 2 horas: +2 em interações de Carisma, Sedução e Persuasão, com vantagem em Coragem e resistência a Medo; −2 em Dedução, Percepção Humana e Resistir à Coerção.',
        recipe: [
            'Essência de Luz',
            'Água Ducal',
            'Pétalas de Mirto Branco'
        ]
    },

    {
        id: 'pocaodeperfume',
        name: 'Poção de Perfume',
        icon: 'https://static.divine-pride.net/images/items/item/12131.png',
        category: 'usable',
        active: 0,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Teste de Tolerância ND:19. Fracasso causa intoxicação por 1d10 horas.',
        description: 'Teste de Tolerância ND:19. Fracasso causa intoxicação por 1d10 horas.',
        recipe: [
            'Folhas de Aloe',
            'Pétalas de Verbena',
            'Água Ducal',
            'Folhas de Balisa'
        ]
    },

    {
        id: 'amigodoenvenenador',
        name: 'Amigo do Envenenador',
        icon: 'https://static.divine-pride.net/images/items/item/12418.png',
        category: 'usable',
        goldValue: 0,
        description: 'Líquido que torna comidas e bebidas mais apetitosas e realça o cheiro. Aumenta o ND de detectar veneno para 24.',
        recipe: [
            'Folhas de Bálisa',
            'Fruta de Bálisa',
            'Solução de Mercúrio',
            'Mel'
        ]
    },

    {
        id: 'inflamador',
        name: 'Inflamador',
        icon: 'https://static.divine-pride.net/images/items/item/23077.png',
        category: 'usable',
        active: 0,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Torna alvos extremamente inflamáveis. 50% de chance de incendiar ao contato com faíscas dano de fogo causa o dobro.',
        description: 'Torna alvos extremamente inflamáveis. 50% de chance de incendiar ao contato com faíscas dano de fogo causa o dobro.',
        recipe: [
            'Óleo Escurecedor',
            'Fósforo',
            'Fogo da Zerikânia'
        ]
    },

    {
        id: 'saisaromaticos',
        name: 'Sais Aromáticos',
        icon: 'https://static.divine-pride.net/images/items/item/11600.png',
        category: 'usable',
        goldValue: 0,
        description: 'Acorda imediatamente pessoas ou criaturas inconscientes ou atordoadas. Cada frasco permite 25 usos.',
        recipe: [
            'Enxofre',
            'Raiz de Pimenta',
            'Folhas de Aloe'
        ]
    },

    {
        id: 'fluidoesterilizante',
        name: 'Fluido Esterilizante',
        icon: 'https://static.divine-pride.net/images/items/item/11517.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Dobra toda cura real de HP recebida por 20 rodadas; não afeta PV temporários nem Escudo Mágico.',
        description: 'Aplica Cura Potencializada por 20 rodadas. Toda cura real de HP recebida é dobrada, sem aumentar PV temporários ou Escudo Mágico e sem ultrapassar o HP máximo.',
        recipe: [
            'Água Ducal',
            'Pétalas de Ginatía',
            'Água Purificada'
        ]
    },

    {
        id: 'soprodesucubo',
        name: 'Sopro de Súcubo',
        icon: 'https://static.divine-pride.net/images/items/item/23547.png',
        category: 'usable',
        active: 30,
        stack: 1,
        augment: "control",
        goldValue: 0,
        shortDescription: 'Recebe +2 em Sedução na pele; -5 na Resistência a Sedução na bebida.',
        description: 'Recebe +2 em Sedução na pele; -5 na Resistência a Sedução na bebida.',
        recipe: [
            'Essência de Luz',
            'Fruta de Uva-Espim',
            'Água Ducal',
            'Alcool Anão'
        ]
    },

    {
        id: 'lagrimasdetalgar',
        name: 'Lágrimas de Talgar',
        icon: 'https://static.divine-pride.net/images/items/item/11517.png',
        category: 'usable',
        active: 0,
        stack: 1,
        augment: "control",
        goldValue: 0,
        shortDescription: 'Congela imediatamente alvos atingidos. Itens congelados sofrem o dobro de dano de ablação.',
        description: 'Congela imediatamente alvos atingidos. Itens congelados sofrem o dobro de dano de ablação.',
        recipe: [
            'Fragmentos Lunares',
            'Pó Espectral',
            'Água Purificada'
        ]
    },

    {
        id: 'lagrimasdeesposas',
        name: 'Lágrimas de Esposas',
        icon: 'https://static.divine-pride.net/images/items/item/12422.png',
        category: 'usable',
        goldValue: 0,
        description: 'Cura estados de intoxicação instantaneamente, deixando o usuário sóbrio.',
        recipe: [
            'Pétalas de Heléboro',
            'Água Ducal',
            'Raiz de Pimenta Dioica'
        ]
    },

    {
        id: 'fogodazerikania',
        name: 'Fogo da Zerikânia',
        icon: 'https://static.divine-pride.net/images/items/item/102455.png',
        category: 'usable',
        goldValue: 0,
        description: 'Explode e incendeia tudo que tocar; causa 8d6 de dano de explosão e incendeia por 1d10 turnos, causa 8 de dano em armadura. Espalha-se em um círculo de 5m ao ser arremessado; pode ampliar o efeito se usado com algo inflamável.',
        recipe: [
            'Polvora',
            'Óleo Escurecedor',
            'Fósforo',
            'Alcool Anão'
        ]
    },

    {
        id: 'sanguepreto',
        name: 'Sangue Preto',
        icon: 'https://static.divine-pride.net/images/items/item/23078.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 25,
        goldValue: 0,
        shortDescription: 'Envenena criaturas vampíricas e necrófagas que o beberem, 1d6 de dano por rodada até um teste de Tolerância; impede cura natural e exige teste de resistência a cada turno para não ficar atordoado (ND 20).',
        description: 'O sangue do bruxo envenena criaturas vampíricas e necrófagas que o beberem, causando 1d6 de dano por rodada até um teste de Tolerância; impede cura natural e exige teste de resistência a cada turno para não ficar atordoado (ND 20).',
        recipe: [
            'Verbena',
            'Espírito Anão',
            'Cogumelo Sewant',
            'Sangue Carníçal'
        ]
    },

    {
        id: 'nevasca',
        name: 'Nevasca',
        icon: 'https://static.divine-pride.net/images/items/item/12245.png',
        category: 'usable',
        active: 10,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 75,
        goldValue: 0,
        shortDescription: '1d6 em todos os sentidos, Reflexo, Defesa, Audição, Percepção, Esquiva, Atletismo, Acrobacias, Lançar Feitiços, Habilidades com armas como Esgrima etc...',
        description: '1d6 em todos os sentidos, Reflexo, Defesa, Audição, Percepção, Esquiva, Atletismo, Acrobacias, Lançar Feitiços, Habilidades com armas como Esgrima etc...',
        recipe: [
            'Mitro Branco',
            'Água Destilada',
            'Cérebro de Afogador',
            'Sangue de Vampiro'
        ]
    },

    {
        id: 'gato',
        name: 'Gato',
        icon: 'https://static.divine-pride.net/images/items/item/503.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 25,
        goldValue: 0,
        shortDescription: 'Nenhuma penalidade por escuridão ou pouca luz; não pode ser hipnotizado; +5 contra ilusões.',
        description: 'Nenhuma penalidade por escuridão ou pouca luz; não pode ser hipnotizado; +5 contra ilusões.',
        recipe: [
            'Fruta de Uva-Espim',
            'Água Destilada',
            'Dente de Vampiro'
        ]
    },

    {
        id: 'luacheia',
        name: 'Lua Cheia',
        icon: 'https://static.divine-pride.net/images/items/item/546.png',
        category: 'usable',
        active: 20,
        stack: 30,
        augment: "buff",
        potion: true,
        toxicity: 75,
        goldValue: 0,
        shortDescription: 'Role 1d20. Fornece +10 PV mais o resultado do dado em PV temporários até o fim da duração. Não acumula.',
        description: 'Role 1d20. Fornece +10 PV mais o resultado do dado em PV temporários até o fim da duração. Não acumula.',
        recipe: [
            'Água Destilada',
            'Aconito',
            'Saliva de Lobisomem'
        ]
    },

    {
        id: 'papafigo',
        name: 'Papa-figo',
        icon: 'https://static.divine-pride.net/images/items/item/12119.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 50,
        goldValue: 0,
        shortDescription: 'Fornece imunidade a venenos e neutraliza quaisquer poções no sistema.',
        description: 'Fornece imunidade a venenos e neutraliza quaisquer poções no sistema.',
        recipe: [
            'Água Destilada',
            'Quelidônia',
            'Saliva de Endriga'
        ]
    },

    {
        id: 'baleiaassassina',
        name: 'Baleia Assassina',
        icon: 'https://static.divine-pride.net/images/items/item/12118.png',
        category: 'usable',
        active: 30,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 25,
        goldValue: 0,
        shortDescription: 'Aumenta em 50% a habilidade de segurar a respiração e nega penalidades de visão subaquática.',
        description: 'Aumenta em 50% a habilidade de segurar a respiração e nega penalidades de visão subaquática.',
        recipe: [
            'Água Destilada',
            'Língua de Afogador',
            'Cérebro de Afogador'
        ]
    },

    {
        id: 'bosquedemaribor',
        name: 'Bosque de Maribor',
        icon: 'https://static.divine-pride.net/images/items/item/12120.png',
        category: 'usable',
        active: 10,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 50,
        goldValue: 0,
        shortDescription: 'Toda vez que ganhar um dado de adrenalina, adicione um dado extra.',
        description: 'Toda vez que ganhar um dado de adrenalina, adicione um dado extra.',
        recipe: [
            'Água Destilada',
            'Medula Óssea de Carníçal',
            'Raiz de Mandrágora'
        ]
    },

    {
        id: 'filtrodepetri',
        name: 'Filtro de Petri',
        icon: 'https://static.divine-pride.net/images/items/item/12121.png',
        category: 'usable',
        active: 5,
        stack: 6,
        augment: "buff",
        potion: true,
        toxicity: 75,
        goldValue: 0,
        shortDescription: 'Role 1d6 e acrescente no EST gasto do sinal, pode ultrapassar os limites dos poderes dos sinais, dura 5 turnos.',
        description: 'Sempre que usar um sinal o sinal terá efeito como se tivesse gasto 1d6 pontos em EST extra, podendo ultrapassar os limites dos poderes dos sinais, dura 5 turnos.',
        recipe: [
            'Água Destilada',
            'Pó Infundido',
            'Visco'
        ]
    },

    {
        id: 'andorinha',
        name: 'Andorinha',
        icon: 'https://static.divine-pride.net/images/items/item/505.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 50,
        goldValue: 0,
        shortDescription: 'Regenera 1d6 PV por rodada. Em rodadas em que for atacado, não regenera. Não acumula.',
        description: 'Regenera 1d6 PV por rodada. Em rodadas em que for atacado, não regenera. Não acumula.',
        recipe: [
            'Água Destilada',
            'Quelidônia',
            'Cérebro de Afogador'
        ]
    },

    {
        id: 'corujadomato',
        name: 'Coruja-do-mato',
        icon: 'https://static.divine-pride.net/images/items/item/11504.png',
        category: 'usable',
        active: 20,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 50,
        goldValue: 0,
        shortDescription: 'A cada turno recupera 1d6 de EST.',
        description: 'A cada turno recupera 1d6 de EST.',
        recipe: [
            'Água Destilada',
            'Veneno de Aracna',
            'Raiz de Pimenta Dioica'
        ]
    },

    {
        id: 'trovoada',
        name: 'Trovoada',
        icon: 'https://static.divine-pride.net/images/items/item/11548.png',
        category: 'usable',
        active: 5,
        stack: 1,
        augment: "buff",
        potion: true,
        toxicity: 75,
        goldValue: 0,
        shortDescription: 'Recebe bonus crítico +2 em Ataque, Esquiva e Bloqueio.',
        description: 'Recebe bonus crítico +2 em Ataque, Esquiva e Bloqueio.',
        recipe: [
            'Água Destilada',
            'Garra de Carníçal',
            'Fruta Balisa'
        ]
    },

    {
        id: 'melbranco',
        name: 'Mel Branco',
        icon: 'https://static.divine-pride.net/images/items/item/12428.png',
        category: 'usable',
        potion: true,
        toxicity: 0,
        clearsToxicity: true,
        goldValue: 0,
        description: 'Remove toxicidade e todos os efeitos de poções.',
        recipe: [
            'Água Destilada',
            'Madressilva',
            'Hidromel',
            'Mofo Verde'
        ]
    },

    {
        id: 'oleodefera',
        name: 'Óleo de fera',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra feras',
        description: 'Ganha +12 de dano contra feras',
        recipe: [
            'Sebo',
            'Folhas de Aloe',
            'Extrato de Veneno'
        ]
    },

    {
        id: 'oleodeamaldicoado',
        name: 'Óleo de amaldiçoado',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra amaldiçoados',
        description: 'Ganha +12 de dano contra amaldiçoados',
        recipe: [
            'Verbena',
            'Mofo Verde',
            'Pó de Prata',
            'Mitro Branco'
        ]
    },

    {
        id: 'oleodedraconideo',
        name: 'Óleo de draconídeo',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra draconídeos',
        description: 'Ganha +12 de dano contra draconídeos',
        recipe: [
            'Olhos de Wyvern',
            'Extrato de Veneno',
            'Cogumelos de Esgoto'
        ]
    },

    {
        id: 'oleodeelemental',
        name: 'Óleo de elemental',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra elemental',
        description: 'Ganha +12 de dano contra elemental',
        recipe: [
            'Coração de Golem',
            'Folhas de Aloe'
        ]
    },

    {
        id: 'venenodoenforcado',
        name: 'Veneno do Enforcado',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra humanoides',
        description: 'Ganha +12 de dano contra humanoides',
        recipe: [
            'Pequena Cicuta',
            'Extrato de Veneno'
        ]
    },

    {
        id: 'oleodehibrido',
        name: 'Óleo de híbrido',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra híbrido',
        description: 'Ganha +12 de dano contra híbrido',
        recipe: [
            'Sempre-viva Anã',
            'Língua de Bruxa Sepulcral'
        ]
    },

    {
        id: 'oleodeinsetoide',
        name: 'Óleo de insetoide',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra insetoides',
        description: 'Ganha +12 de dano contra insetoides',
        recipe: [
            'Veneno de Aracna',
            'Olhos de Aracna',
            'Extrato de Veneno',
            'Pequena Cicuta'
        ]
    },

    {
        id: 'oleodenecrofago',
        name: 'Óleo de necrófago',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra necrófago',
        description: 'Ganha +12 de dano contra necrófago',
        recipe: [
            'Extrato de Veneno',
            'Saliva de Vampiro'
        ]
    },

    {
        id: 'oleodeogroide',
        name: 'Óleo de ogroide',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra ogroides',
        description: 'Ganha +12 de dano contra ogroides',
        recipe: [
            'Bosta de Demônio',
            'Folhas de Aloe'
        ]
    },

    {
        id: 'oleoderelicto',
        name: 'Óleo de relicto',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra relicto',
        description: 'Ganha +12 de dano contra relicto',
        recipe: [
            'Ginátia',
            'Sal Mineral Refinado'
        ]
    },

    {
        id: 'oleodeespectro',
        name: 'Óleo de espectro',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra espectro',
        description: 'Ganha +12 de dano contra espectro',
        recipe: [
            'Pó de Prata',
            'Essência de Luz'
        ]
    },

    {
        id: 'oleodevampiro',
        name: 'Óleo de vampiro',
        icon: 'https://static.divine-pride.net/images/items/item/14535.png',
        category: 'usable',
        oil: true,
        active: 20,
        stack: 1,
        augment: "buff",
        goldValue: 0,
        shortDescription: 'Ganha +12 de dano contra vampiro',
        description: 'Ganha +12 de dano contra vampiro',
        recipe: [
            'Verbena',
            'Saliva de Lobisomem',
            'Pó de Prata',
            'Sangue de Carniçal'
        ]
    },

    {
        id: 'podelua',
        name: 'Pó de Lua',
        icon: 'https://static.divine-pride.net/images/items/item/22703.png',
        category: 'usable',
        active: 5,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Impede que inimigos se tornem intangíveis ou invisíveis, impede regeneração de vida de vampiros e lobisomens.',
        description: 'Impede que inimigos se tornem intangíveis ou invisíveis; útil contra Espectros e outras aparições, impede regeneração de vida de vampiros e lobisomens.',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Pó de Prata'
        ]
    },

    {
        id: 'podedimeritio',
        name: 'Pó de Dimerítio',
        icon: 'https://static.divine-pride.net/images/items/item/22706.png',
        category: 'usable',
        active: 5,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Bloqueia habilidades mágicas de inimigos e fecha portais.',
        description: 'Bloqueia habilidades mágicas de inimigos (Elementais, Magos, Bruxas Sepulcrais) e fecha portais.',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Dimerítio'
        ]
    },

    {
        id: 'bafodedragao',
        name: 'Bafo de Dragão',
        icon: 'https://static.divine-pride.net/images/items/item/22702.png',
        category: 'usable',
        active: 3,
        stack: 1,
        augment: "control",
        goldValue: 0,
        shortDescription: 'Cria fumaça inflamável: dano de Fogo recebe +20 antes de ser dobrado por Inflamador.',
        description: 'Cria fumaça inflamável por 3 rodadas. Todo dano de Fogo recebido ganha +20; se Inflamador também estiver ativo, o bônus é somado antes de o dano ser dobrado.',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Enxofre',
            'Óleo Escurecedor'
        ]
    },

    {
        id: 'samun',
        name: 'Samun',
        icon: 'https://static.divine-pride.net/images/items/item/22705.png',
        category: 'usable',
        active: 5,
        stack: 1,
        augment: "debuff",
        goldValue: 0,
        shortDescription: 'Cega inimigos temporariamente, facilitando o combate.',
        description: 'Cega inimigos temporariamente, facilitando o combate.',
        recipe: [
            'Álcool Anão',
            'Fósforo',
            'Seiva Branca'
        ]
    },

    {
        id: 'bombadeestilhacos',
        name: 'Bomba de Estilhaços',
        icon: 'https://static.divine-pride.net/images/items/item/22707.png',
        category: 'usable',
        goldValue: 0,
        description: 'Causa dano físico em área; ideal para destruir ninhos de monstros ou grupos de inimigos, causa um dano de 5d6 e dano de 5 em armaduras, role o local do dano.',
        recipe: [
            'Álcool Anão',
            'Salitre',
            'Nitrato de Prata',
            'Estilhaços de Ferro',
            'Polvora'
        ]
    },


    // =====================================
    // OBJETOS MÁGICOS
    // =====================================

    /*
    {
        id: 'medalhaodaprotecao',
        name: 'Medalhão do Proteção',
        icon: 'https://static.divine-pride.net/images/items/item/2601.png',
        category: 'usable',
        goldValue: 0,
        description: 'Enquanto estiver sendo usado, reduz pela metade todos os efeitos de maldições ativas sobre o portador. Não remove a maldição, apenas a enfraquece.'
    },

    {
        id: 'aneldeobsidiana',
        name: 'Anel de Obsidiana Negra',
        icon: 'https://static.divine-pride.net/images/items/item/2615.png',
        category: 'usable',
        goldValue: 0,
        description: 'Permite enxergar espectros, fantasmas e criaturas invisíveis durante 10 minutos. Pode ser utilizado uma vez á cada 1 hora.'
    },

    {
    id: 'espelhoquebrado',
    name: 'Espelho Quebrado de Lara',
    icon: 'https://static.divine-pride.net/images/items/item/7308.png',
    category: 'usable',
    goldValue: 0,
    description: 'Reflete a verdadeira aparência de qualquer criatura metamórfica, doppler, vampiro superior ou ser ocultando sua identidade através de magia.'
    },

    {
    id: 'velaexorcista',
    name: 'Vela Exorcista',
    icon: 'https://static.divine-pride.net/images/items/item/7135.png',
    category: 'usable',
    goldValue: 0,
    description: 'Quando acesa durante um ritual, reduz drasticamente a influência de espíritos hostis. Espectros sofrem desvantagem em testes para possuir ou amaldiçoar criaturas.'
    },

    {
    id: 'correntedelunaprata',
    name: 'Corrente da Lua Prateada',
    icon: 'https://static.divine-pride.net/images/items/item/2614.png',
    category: 'usable',
    goldValue: 0,
    description: 'Quando utilizada para prender uma criatura amaldiçoada, impede transformações, teletransporte ou fuga mágica.'
    },

    {
    id: 'agulhadestino',
    name: 'Agulha do Destino',
    icon: 'https://static.divine-pride.net/images/items/item/1201.png',
    category: 'usable',
    goldValue: 0,
    description: 'Quando mergulhada em sangue, aponta constantemente para a criatura da qual aquele sangue foi retirado.'
    },

    {
    id: 'braceletedeselo',
    name: 'Bracelete de Selo',
    icon: 'https://static.divine-pride.net/images/items/item/2629.png',
    category: 'usable',
    goldValue: 0,
    description: 'Impede que o usuário seja transformado em licantropo, striga ou qualquer outra criatura através de maldição enquanto estiver equipado.'
    },

    {
    id: 'moedadojuramento',
    name: 'Moeda do Juramento',
    icon: 'https://static.divine-pride.net/images/items/item/7539.png',
    category: 'usable',
    goldValue: 0,
    description: 'Quando duas pessoas seguram a moeda enquanto fazem um juramento, ambas sabem instantaneamente caso uma delas quebre sua palavra.'
    },

    {
    id: 'sinodeferrofrio',
    name: 'Sino de Ferro Frio',
    icon: 'https://static.divine-pride.net/images/items/item/7157.png',
    category: 'usable',
    goldValue: 0,
    description: 'Seu toque afasta espectros menores, aparições e almas inquietas por alguns minutos.'
    },


    */
    // =====================================
    // EQUIPAMENTOS
    // =====================================


    // =====================================
    // ARMAS
    // =====================================
    {
        id: 'flechadeferro',
        name: 'Flecha de Ferro',
        icon: 'https://static.divine-pride.net/images/items/item/1750.png',
        category: 'equipment',
        goldValue: 5,
        type: 'weapon',
        weaponType: 'Flechas',
        damage: '0',
        bonus: ' ',
        effect: ' ',
        description: 'Kit com 10 Flechas de Ferro por 5 Coroas.',
        recipe: [
            '1x Ferro cria 10 Flechas',
            '',
            ''
        ]
    },

    {
        id: 'flechadeaco',
        name: 'Flecha de Aço',
        icon: 'https://static.divine-pride.net/images/items/item/1753.png',
        category: 'equipment',
        goldValue: 30,
        type: 'weapon',
        weaponType: 'Flechas',
        damage: '1d6 de Dano Adicional',
        bonus: ' ',
        effect: ' ',
        description: '10 Flechas por 30 Coroa.',
        recipe: [
            '1x Aço cria 10 Flechas',
            '',
            ''
        ]
    },

    {
        id: 'flechadeprata',
        name: 'Flecha de Prata',
        icon: 'https://static.divine-pride.net/images/items/item/1751.png',
        category: 'equipment',
        goldValue: 60,
        type: 'weapon',
        weaponType: 'Flechas',
        damage: 'Dano de Prata',
        bonus: ' ',
        effect: 'Dano de Prata',
        description: '10 Flechas por 60 Coroas.',
        recipe: [
            '1x Prata cria 10 Flechas',
            '',
            ''
        ]
    },

    {
        id: 'setadeferro',
        name: 'Seta de Ferro',
        icon: 'https://static.divine-pride.net/images/items/item/1750.png',
        category: 'equipment',
        goldValue: 5,
        type: 'weapon',
        weaponType: 'Setas',
        damage: '0',
        bonus: '',
        effect: '',
        description: 'Kit com 10 Setas de Ferro para besta por 5 Coroas.',
        recipe: [
            '1x Ferro cria 10 Setas',
            '',
            ''
        ]
    },

    {
        id: 'setadeaco',
        name: 'Seta de Aço',
        icon: 'https://static.divine-pride.net/images/items/item/1753.png',
        category: 'equipment',
        goldValue: 30,
        type: 'weapon',
        weaponType: 'Setas',
        damage: '1d6 de Dano Adicional',
        bonus: '',
        effect: '',
        description: 'Kit com 10 setas de aço para besta.',
        recipe: [
            '1x Aço cria 10 Setas',
            '',
            ''
        ]
    },

    {
        id: 'setadeprata',
        name: 'Seta de Prata',
        icon: 'https://static.divine-pride.net/images/items/item/1751.png',
        category: 'equipment',
        goldValue: 60,
        type: 'weapon',
        weaponType: 'Setas',
        damage: 'Dano de Prata',
        bonus: '',
        effect: 'Dano de Prata',
        description: 'Kit com 10 setas de prata para besta.',
        recipe: [
            '1x Prata cria 10 Setas',
            '',
            ''
        ]
    },

    {
        id: 'espadadeacodebruxo',
        name: 'Espada de Aço de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/600021.png',
        category: 'equipment',
        goldValue: 800,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6+2',
        bonus: ' ',
        effect: ' ',
        description: 'Espada de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'espadadepratadebruxo',
        name: 'Espada de Prata de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/1123.png',
        category: 'equipment',
        goldValue: 2300,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6',
        bonus: ' ',
        effect: 'Dano de Prata',
        description: 'Espada de Duas Mãos',
        recipe: [
            '20x Prata',
            '',
            ''
        ]
    },

    {
        id: 'espadalongadeferro',
        name: 'Espada Longa de Ferro',
        icon: 'https://static.divine-pride.net/images/items/item/1135.png',
        category: 'equipment',
        goldValue: 160,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '2d6+2',
        bonus: ' ',
        effect: 'Sangramento 20%',
        description: 'Espada de Duas Mãos',
        recipe: [
            '5x Ferro ',
            '',
            ''
        ]
    },

    {
        id: 'espadadecavaleiro',
        name: 'Espada de Cavaleiro',
        icon: 'https://static.divine-pride.net/images/items/item/600032.png',
        category: 'equipment',
        goldValue: 270,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '2d6+4',
        bonus: ' ',
        effect: 'Sangramento 20%',
        description: 'Espada de Uma Mão',
        recipe: [
            '10x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'gleddyf',
        name: 'Gleddyf',
        icon: 'https://static.divine-pride.net/images/items/item/1159.png',
        category: 'equipment',
        goldValue: 285,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '3d6+2',
        bonus: ' ',
        effect: 'Sangramento 30%',
        description: 'Espada de Duas Mãos',
        recipe: [
            '13x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'falcionedocacador',
        name: 'Falcione do Caçador',
        icon: 'https://static.divine-pride.net/images/items/item/1114.png',
        category: 'equipment',
        goldValue: 325,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '3d6+2',
        bonus: ' ',
        effect: 'Sangramento 30%',
        description: 'Espada de Uma Mão',
        recipe: [
            '14x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'krigsverd',
        name: 'Krigsverd',
        icon: 'https://static.divine-pride.net/images/items/item/1169.png',
        category: 'equipment',
        goldValue: 570,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6+4',
        bonus: '2',
        effect: 'Sangramento 40%',
        description: 'Espada de Uma Mão',
        recipe: [
            '17x Aço',
            '',
            ''
        ]
    },

    {
        id: 'esboda',
        name: 'Esboda',
        icon: 'https://static.divine-pride.net/images/items/item/1137.png',
        category: 'equipment',
        goldValue: 650,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '1',
        effect: 'Sangramento 50%',
        description: 'Espada de Uma Mão',
        recipe: [
            '5x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'kord',
        name: 'Kord',
        icon: 'https://static.divine-pride.net/images/items/item/21039.png',
        category: 'equipment',
        goldValue: 725,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '',
        effect: 'Sangramento 50%',
        description: 'Espada de Uma Mão',
        recipe: [
            '6x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'laminadevicovaro',
        name: 'Lâmina de Vicovaro',
        icon: 'https://static.divine-pride.net/images/items/item/1192.png',
        category: 'equipment',
        goldValue: 955,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6+4',
        bonus: '',
        effect: 'Sangramento 50% / Balanceada',
        description: 'Espada de Duas Mãos',
        recipe: [
            '7x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'torrwr',
        name: 'Torrwr',
        icon: 'https://static.divine-pride.net/images/items/item/13422.png',
        category: 'equipment',
        goldValue: 1075,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '',
        effect: 'Sangramento 70%',
        description: 'Espada de Duas Mãos',
        recipe: [
            '8x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'adaga',
        name: 'Adaga',
        icon: 'https://static.divine-pride.net/images/items/item/13052.png',
        category: 'equipment',
        goldValue: 50,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '1d6+2',
        bonus: '',
        effect: 'Crítico +1',
        description: 'Adaga',
        recipe: [
            '1x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'estilete',
        name: 'Estilete',
        icon: 'https://static.divine-pride.net/images/items/item/1216.png',
        category: 'equipment',
        goldValue: 275,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '1d6',
        bonus: '2',
        effect: 'Crítico +1 / Porte Velado',
        description: 'Adaga',
        recipe: [
            '4x Aço',
            '',
            ''
        ]
    },

    {
        id: 'punhal',
        name: 'Punhal',
        icon: 'https://static.divine-pride.net/images/items/item/1219.png',
        category: 'equipment',
        goldValue: 350,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '2d6+2',
        bonus: '1',
        effect: 'Crítico +2 / Sangramento 25%',
        description: 'Adaga',
        recipe: [
            '2x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'jambiya',
        name: 'Jambiya',
        icon: 'https://static.divine-pride.net/images/items/item/28746.png',
        category: 'equipment',
        goldValue: 440,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '2d6+2',
        bonus: '2',
        effect: 'Crítico +2 / Perfura 2 de Armadura',
        description: 'Adaga',
        recipe: [
            '3x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'machadodemao',
        name: 'Machado de Mão',
        icon: 'https://static.divine-pride.net/images/items/item/520024.png',
        category: 'equipment',
        goldValue: 205,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '2d6+1',
        bonus: '',
        effect: 'Sangramento 20%',
        description: 'Machado de Uma Mão',
        recipe: [
            '13x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'machadodebatalha',
        name: 'Machado de Batalha',
        icon: 'https://static.divine-pride.net/images/items/item/28144.png',
        category: 'equipment',
        goldValue: 525,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '',
        effect: 'Sangramento 50%',
        description: 'Machado de Uma Mão',
        recipe: [
            '15x Aço',
            '',
            ''
        ]
    },

    {
        id: 'machadoberserker',
        name: 'Machado Berserker',
        icon: 'https://static.divine-pride.net/images/items/item/1395.png',
        category: 'equipment',
        goldValue: 960,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '',
        effect: 'Sangramento 60% / Perfura Armadura 6',
        description: 'Machado de Duas Mãos',
        recipe: [
            '7x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'soqueira',
        name: 'Soqueira',
        icon: 'https://static.divine-pride.net/images/items/item/560006.png',
        category: 'equipment',
        goldValue: 50,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '1d6',
        bonus: '1',
        effect: 'Adiciona a Soco',
        description: 'Soqueira',
        recipe: [
            '1x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'maca',
        name: 'Maça',
        icon: 'https://static.divine-pride.net/images/items/item/1543.png',
        category: 'equipment',
        goldValue: 525,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '5d6',
        bonus: '',
        effect: 'Perfura Armadura 5 / Atordoamento 30%',
        description: 'Maça de Uma Mão',
        recipe: [
            '13x Aço',
            '',
            ''
        ]
    },

    {
        id: 'martelodasterrasaltas',
        name: 'Martelo das Terras Altas',
        icon: 'https://static.divine-pride.net/images/items/item/1548.png',
        category: 'equipment',
        goldValue: 1100,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '6d6+2',
        bonus: '',
        effect: 'Perfura Armadura 6 / Atordoamento 50%',
        description: 'Martelo de Duas Mãos',
        recipe: [
            '9x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'lanca',
        name: 'Lança',
        icon: 'https://static.divine-pride.net/images/items/item/530040.png',
        category: 'equipment',
        goldValue: 375,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '3d6',
        bonus: '1',
        effect: 'Perfura Armadura 3',
        description: 'Lança de Duas Mãos',
        recipe: [
            '15x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'achadearma',
        name: 'Acha de Arma',
        icon: 'https://static.divine-pride.net/images/items/item/1417.png',
        category: 'equipment',
        goldValue: 460,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '4d6+2',
        bonus: '',
        effect: 'Perfura Armadura 4',
        description: 'Lança de Duas Mãos',
        recipe: [
            '12x Aço',
            '',
            ''
        ]
    },

    {
        id: 'alabardavermelha',
        name: 'Alabarda Vermelha',
        icon: 'https://static.divine-pride.net/images/items/item/1465.png',
        category: 'equipment',
        goldValue: 865,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '6d6+3',
        bonus: '',
        effect: 'Perfura Armadura 6',
        description: 'Lança de Duas Mãos',
        recipe: [
            '6x Aço Negro',
            '',
            ''
        ]
    },

    {
        id: 'cajado',
        name: 'Cajado',
        icon: 'https://static.divine-pride.net/images/items/item/550108.png',
        category: 'equipment',
        goldValue: 335,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '1d6+2',
        bonus: '',
        effect: 'Foco 1',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '12x Ferro',
            '',
            ''
        ]
    },

    {
        id: 'cajadodepastor',
        name: 'Cajado de Pastor',
        icon: 'https://static.divine-pride.net/images/items/item/26121.png',
        category: 'equipment',
        goldValue: 550,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '2d6',
        bonus: '',
        effect: 'Foco 1 / Agarradora',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'cajadodeferro',
        name: 'Cajado de Ferro',
        icon: 'https://static.divine-pride.net/images/items/item/1627.png',
        category: 'equipment',
        goldValue: 675,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '3d6',
        bonus: '',
        effect: 'Foco 2 / Atordoamento 50%',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '9x Ferro Negro',
            '',
            ''
        ]
    },

    {
        id: 'cajadodecristal',
        name: 'Cajado de Cristal',
        icon: 'https://static.divine-pride.net/images/items/item/1472.png',
        category: 'equipment',
        goldValue: 2335,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '2d6+2',
        bonus: '',
        effect: 'Foco 3 / Foco Maior',
        description: 'Cajado de Duas Mãos',
        recipe: [
            '7x Aço Negro',
            '1x Cristal',
            ''
        ]
    },

    {
        id: 'arcocurto',
        name: 'Arco Curto',
        icon: 'https://static.divine-pride.net/images/items/item/1703.png',
        category: 'equipment',
        goldValue: 290,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '3d6+3',
        bonus: '',
        effect: '10 Quadros',
        description: 'Arco',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'arcolongo',
        name: 'Arco Longo',
        icon: 'https://static.divine-pride.net/images/items/item/18186.png',
        category: 'equipment',
        goldValue: 475,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '4d6',
        bonus: '',
        effect: '20 Quadros',
        description: 'Arco',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'arcodeguerra',
        name: 'Arco de Guerra',
        icon: 'https://static.divine-pride.net/images/items/item/1708.png',
        category: 'equipment',
        goldValue: 835,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '6d6',
        bonus: '',
        effect: '30 Quadros',
        description: 'Arco',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'bestademão',
        name: 'Besta de Mão',
        icon: 'https://static.divine-pride.net/images/items/item/1712.png',
        category: 'equipment',
        goldValue: 285,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '2d6+2',
        bonus: '1',
        effect: '10 Quadros',
        description: 'Besta de Uma Mão',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'besta',
        name: 'Besta',
        icon: 'https://static.divine-pride.net/images/items/item/700063.png',
        category: 'equipment',
        goldValue: 455,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '4d6+2',
        bonus: '1',
        effect: '15 Quadros',
        description: 'Besta',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'bestadecacadordemonstros',
        name: 'Besta de Caçador de Monstros',
        icon: 'https://static.divine-pride.net/images/items/item/18110.png',
        category: 'equipment',
        goldValue: 1125,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '6d6',
        bonus: '1',
        effect: '20 Quadros',
        description: 'Besta',
        recipe: [
            '',
            '',
            ''
        ]
    },

    // =====================================
    // ARMAS ÉLFICAS
    // =====================================

    {
        id: 'espadadodestino',
        name: 'Espada do Destino',
        icon: 'https://static.divine-pride.net/images/items/item/21063.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6',
        bonus: '0',
        effect: 'Prata / Sangramento 40%',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'espadadeprataelficadebruxo',
        name: 'Espada de Prata Élfica de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/600056.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '0',
        effect: 'Sangramento 60% / Crítico +1',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'espadadeacometeorodebruxo',
        name: 'Espada de Aço Meteoro de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/1171.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '0',
        effect: 'Sangramento 60% / Crítico +1',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'messerelfica',
        name: 'Messer Élfica',
        icon: 'https://static.divine-pride.net/images/items/item/21052.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '3d6+4',
        bonus: '2',
        effect: 'Sangramento 30%',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'espadadecavalariavrihedd',
        name: 'Espada de Cavalaria Vrihedd',
        icon: 'https://static.divine-pride.net/images/items/item/21051.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '4d6+4',
        bonus: '3',
        effect: 'Sangramento 40%',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'espadadeaconegro',
        name: 'Espada de Aço Negro',
        icon: 'https://static.divine-pride.net/images/items/item/1193.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6',
        bonus: '1',
        effect: 'Sangramento 50% / Balanceada / Aço Negro',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'gwyhyranao',
        name: 'Gwyhyr Anão',
        icon: 'https://static.divine-pride.net/images/items/item/1175.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6+4',
        bonus: '3',
        effect: 'Sangramento 50% / Crítico +1 / Balanceada / Aço Negro',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'laminatirtochair',
        name: 'Lâmina Tir Tochair',
        icon: 'https://static.divine-pride.net/images/items/item/1188.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6',
        bonus: '3',
        effect: 'Sangramento 60% / Crítico +1 / Balanceada / Meteorito',
        description: 'Espada',
        recipe: ['', '', '']
    },
    {
        id: 'adagarondel',
        name: 'Adaga Rondel',
        icon: 'https://static.divine-pride.net/images/items/item/1230.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '3d6+2',
        bonus: '2',
        effect: 'Crítico +3 / Perfura Armadura 2 / Foco +2',
        description: 'Adaga',
        recipe: ['', '', '']
    },
    {
        id: 'cuteloanao',
        name: 'Cutelo Anão',
        icon: 'https://static.divine-pride.net/images/items/item/1239.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Lâminas Curtas',
        damage: '3d6',
        bonus: '2',
        effect: 'Crítico +3',
        description: 'Cutelo',
        recipe: ['', '', '']
    },
    {
        id: 'machadodeanao',
        name: 'Machado de Anão',
        icon: 'https://static.divine-pride.net/images/items/item/28130.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '5d6+3',
        bonus: '3',
        effect: 'Sangramento 50% / Crítico +1',
        description: 'Machado',
        recipe: ['', '', '']
    },
    {
        id: 'machadonegro',
        name: 'Machado Negro',
        icon: 'https://static.divine-pride.net/images/items/item/28139.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '6d6+2',
        bonus: '2',
        effect: 'Sangramento 60% / Crítico +1 / Balanceada / Aço Negro',
        description: 'Machado',
        recipe: ['', '', '']
    },
    {
        id: 'martelodemahakam',
        name: 'Martelo de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/16007.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '5d6',
        bonus: '2',
        effect: 'Perfura Armadura 6 / Atordoamento 60%',
        description: 'Martelo',
        recipe: ['', '', '']
    },
    {
        id: 'macacomcorrente',
        name: 'Maça com Corrente',
        icon: 'https://static.divine-pride.net/images/items/item/590050.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '6d6',
        bonus: '1',
        effect: 'Perfura Armadura 6 / Atordoamento 60% / Agarradora',
        description: 'Maça',
        recipe: ['', '', '']
    },
    {
        id: 'marteloanaocomhaste',
        name: 'Martelo Anão com Haste',
        icon: 'https://static.divine-pride.net/images/items/item/590049.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Brigar',
        damage: '5d6+2',
        bonus: '0',
        effect: 'Longo Alcance / Perfura Armadura 6 / Atordoamento 60%',
        description: 'Martelo',
        recipe: ['', '', '']
    },
    {
        id: 'glaiveelfica',
        name: 'Glaive Élfica',
        icon: 'https://static.divine-pride.net/images/items/item/530028.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Cajado/Lança',
        damage: '4d6+3',
        bonus: '2',
        effect: 'Longo Alcance / Foco +2 / Sangramento 40%',
        description: 'Glaive',
        recipe: ['', '', '']
    },
    {
        id: 'arcodeviagemelfico',
        name: 'Arco de Viagem Élfico',
        icon: 'https://static.divine-pride.net/images/items/item/1732.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '4d6',
        bonus: '1',
        effect: 'Longo Alcance / Crítico +1 / Foco +2',
        description: 'Arco',
        recipe: ['', '', '']
    },
    {
        id: 'zefharelfico',
        name: 'Zefhar Élfico',
        icon: 'https://static.divine-pride.net/images/items/item/18123.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '6d6',
        bonus: '2',
        effect: 'Longo Alcance / Crítico +1 / Foco +2',
        description: 'Arco',
        recipe: ['', '', '']
    },
    {
        id: 'bestademaodegnomo',
        name: 'Besta de Mão de Gnomo',
        icon: 'https://static.divine-pride.net/images/items/item/1722.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '2d6',
        bonus: '3',
        effect: 'Recarga Lenta / Longo Alcance / Foco +2',
        description: 'Besta',
        recipe: ['', '', '']
    },
    {
        id: 'bestapesadadeanao',
        name: 'Besta Pesada de Anão',
        icon: 'https://static.divine-pride.net/images/items/item/700009.png',
        category: 'equipment',
        goldValue: 0,
        type: 'weapon',
        weaponType: 'Arco e Flecha',
        damage: '5d6',
        bonus: '3',
        effect: 'Recarga Lenta / Longo Alcance / Foco +2',
        description: 'Besta',
        recipe: ['', '', '']
    },

    // =====================================
    // ARMADURAS
    // =====================================

    {
        id: 'jaquetao',
        name: 'Jaquetão',
        icon: 'https://static.divine-pride.net/images/items/item/15220.png',
        category: 'equipment',
        goldValue: 100,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 2,
        bonus: ' ',
        description: 'Armadura leve.',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'jaquetaodeaedirn',
        name: 'Jaquetão de Aedirn',
        icon: 'https://static.divine-pride.net/images/items/item/32656.png',
        category: 'equipment',
        goldValue: 175,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura leve.',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'jaquetaodetecidoduplo',
        name: 'Jaquetão de Tecido duplo',
        icon: 'https://static.divine-pride.net/images/items/item/2399.png',
        category: 'equipment',
        goldValue: 250,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura leve.',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'couraca',
        name: 'Couraça',
        icon: 'https://static.divine-pride.net/images/items/item/15283.png',
        category: 'equipment',
        goldValue: 300,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradealabardeiroredaniano',
        name: 'Armadura de alabardeiro redaniano',
        icon: 'https://static.divine-pride.net/images/items/item/2312.png',
        category: 'equipment',
        goldValue: 400,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'jaquetalyrianadecouro',
        name: 'Jaqueta lyriana de couro',
        icon: 'https://static.divine-pride.net/images/items/item/15180.png',
        category: 'equipment',
        goldValue: 525,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradeplaca',
        name: 'Armadura de placa',
        icon: 'https://static.divine-pride.net/images/items/item/2376.png',
        category: 'equipment',
        goldValue: 625,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 12,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armadurapesadadailhahindar',
        name: 'Armadura pesada da ilha hindar',
        icon: 'https://static.divine-pride.net/images/items/item/2341.png',
        category: 'equipment',
        goldValue: 750,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 14,
        bonus: ' ',
        description: 'Armadura Pesada',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradeplacanilfgardiana',
        name: 'Armadura de placa nilfgardiana',
        icon: 'https://static.divine-pride.net/images/items/item/450120.png',
        category: 'equipment',
        goldValue: 850,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 16,
        bonus: ' ',
        description: 'Armadura Pesada',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradeurso',
        name: 'Armadura de Urso',
        icon: 'https://static.divine-pride.net/images/items/item/450350.png',
        category: 'equipment',
        goldValue: 1813,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 12,
        bonus: ' ',
        description: 'Armadura Pesada',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradegato',
        name: 'Armadura de Gato',
        icon: 'https://static.divine-pride.net/images/items/item/450177.png',
        category: 'equipment',
        goldValue: 713,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura Leve',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradegrifo',
        name: 'Armadura de Grifo',
        icon: 'https://static.divine-pride.net/images/items/item/450101.png',
        category: 'equipment',
        goldValue: 1571,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armadurademanticora',
        name: 'Armadura de Manticora',
        icon: 'https://static.divine-pride.net/images/items/item/450093.png',
        category: 'equipment',
        goldValue: 1052,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradevibora',
        name: 'Armadura de Vibora',
        icon: 'https://static.divine-pride.net/images/items/item/450102.png',
        category: 'equipment',
        goldValue: 842,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura Leve',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradelobo',
        name: 'Armadura de Lobo',
        icon: 'https://static.divine-pride.net/images/items/item/450071.png',
        category: 'equipment',
        goldValue: 1302,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armaduradecorvo',
        name: 'Armadura de Corvo',
        icon: 'https://static.divine-pride.net/images/items/item/450067.png',
        category: 'equipment',
        goldValue: 990,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 3,
        bonus: ' ',
        description: 'Armadura Leve',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'capuzdearqueirodeverden',
        name: 'Capuz de Arqueiro de Verden',
        icon: 'https://static.divine-pride.net/images/items/item/19499.png',
        category: 'equipment',
        goldValue: 100,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 2,
        bonus: ' ',
        description: 'Armadura Leve',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'capuzdetecidoduplo',
        name: 'Capuz de tecido duplo',
        icon: 'https://static.divine-pride.net/images/items/item/420155.png',
        category: 'equipment',
        goldValue: 175,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura Leve',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'capuzcomprotecaodeolhos',
        name: 'Capuz com proteção de olhos',
        icon: 'https://static.divine-pride.net/images/items/item/420110.png',
        category: 'equipment',
        goldValue: 200,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura Leve',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'toucadecotademalha',
        name: 'Touca de Cota de malha',
        icon: 'https://static.divine-pride.net/images/items/item/5128.png',
        category: 'equipment',
        goldValue: 250,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'capuzblindado',
        name: 'Capuz blindado',
        icon: 'https://static.divine-pride.net/images/items/item/18820.png',
        category: 'equipment',
        goldValue: 350,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'armettemeriano',
        name: 'Armet temeriano',
        icon: 'https://static.divine-pride.net/images/items/item/18652.png',
        category: 'equipment',
        goldValue: 475,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura Média',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'grandeelmo',
        name: 'Grande elmo',
        icon: 'https://static.divine-pride.net/images/items/item/19366.png',
        category: 'equipment',
        goldValue: 575,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 12,
        bonus: ' ',
        description: 'Armadura Pesada',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'elmoskellige',
        name: 'Elmo Skellige',
        icon: 'https://static.divine-pride.net/images/items/item/400053.png',
        category: 'equipment',
        goldValue: 700,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 14,
        bonus: ' ',
        description: 'Armadura Pesada',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'elmonilfgardiano',
        name: 'Elmo Nilfgardiano',
        icon: 'https://static.divine-pride.net/images/items/item/5808.png',
        category: 'equipment',
        goldValue: 900,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 16,
        bonus: ' ',
        description: 'Armadura Pesada',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'escudodemadeira',
        name: 'Escudo de Madeira',
        icon: 'https://static.divine-pride.net/images/items/item/2135.png',
        category: 'equipment',
        goldValue: 50,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 1,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'broqueldeaco',
        name: 'Broquel de Aço',
        icon: 'https://static.divine-pride.net/images/items/item/2103.png',
        category: 'equipment',
        goldValue: 150,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 2,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'escudotemeriano',
        name: 'Escudo Temeriano',
        icon: 'https://static.divine-pride.net/images/items/item/28900.png',
        category: 'equipment',
        goldValue: 225,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 3,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'escudodesaqueadorskellige',
        name: 'Escudo de Saqueador Skellige',
        icon: 'https://static.divine-pride.net/images/items/item/2147.png',
        category: 'equipment',
        goldValue: 325,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 4,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'escudokaedweni',
        name: 'Escudo Kaedweni',
        icon: 'https://static.divine-pride.net/images/items/item/28953.png',
        category: 'equipment',
        goldValue: 400,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 5,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'escudolagrimadeaco',
        name: 'Escudo Lagrima de Aço',
        icon: 'https://static.divine-pride.net/images/items/item/460014.png',
        category: 'equipment',
        goldValue: 400,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 6,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'pavise',
        name: 'Pavise',
        icon: 'https://static.divine-pride.net/images/items/item/460037.png',
        category: 'equipment',
        goldValue: 500,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 7,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'pavisenilfgardiano',
        name: 'Pavise Nilfgardiano',
        icon: 'https://static.divine-pride.net/images/items/item/460016.png',
        category: 'equipment',
        goldValue: 600,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 8,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'escudopipanilfgardiano',
        name: 'Escudo Pipa Nilfgardiano',
        icon: 'https://static.divine-pride.net/images/items/item/28941.png',
        category: 'equipment',
        goldValue: 750,
        type: 'armor',
        weaponType: 'Escudo',
        defense: 9,
        bonus: ' ',
        description: 'Escudo',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'calcasdecavalaria',
        name: 'Calças de cavalaria',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 75,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 2,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasacolchoadas',
        name: 'Calças acolchoadas',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 125,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdetecidoduplo',
        name: 'Calças de tecido duplo',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 225,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasblindadas',
        name: 'Calças blindadas',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 250,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'grevasredaniana',
        name: 'Grevas redaniana',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 400,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcaslyrianasdecouro',
        name: 'Calças lyrianas de couro',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 525,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'grevasdeplaca',
        name: 'Grevas de placa',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 625,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 12,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'chaussespesadasdehindas',
        name: 'Chausses pesadas de hindas',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 650,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 14,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'grevasnilfgardianas',
        name: 'Grevas Nilfgardianas',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 850,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 16,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'calcasdeurso',
        name: 'Calças de Urso',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 1813,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 12,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdegato',
        name: 'Calças de Gato',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 713,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdegrifo',
        name: 'Calças de Grifo',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 1571,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdemanticora',
        name: 'Calças de Manticora',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 1052,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdevibora',
        name: 'Calças de Vibora',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 842,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdelobo',
        name: 'Calças de Lobo',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 1302,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'calcasdecorvo',
        name: 'Calças de Corvo',
        icon: 'https://static.divine-pride.net/images/items/item/22052.png',
        category: 'equipment',
        goldValue: 990,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 3,
        bonus: ' ',
        description: 'Armadura para pernas',
        recipe: [
            '',
            '',
            ''
        ]
    },

    {
        id: 'braceirasdacavalaria',
        name: 'Braceiras da cavalaria',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 50,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 2,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasacolchoadas',
        name: 'Braceiras acolchoadas',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 100,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdetecidoduplo',
        name: 'Braceiras de tecido duplo',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 175,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasblindadas',
        name: 'Braceiras blindadas',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 200,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'armaduradebracosredanianas',
        name: 'Armadura de Braços Redanianas',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 350,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceiraslyrianasdecouro',
        name: 'Braceiras Lyrianas de couro',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 475,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'armaduradeplacasparabraco',
        name: 'Armadura de Placas para braço',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 550,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 12,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceiraspesadasdehindar',
        name: 'Braceiras pesadas de hindar',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 625,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 14,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'armaduradebracosnilfgardianas',
        name: 'Armadura de braços nilfgardianas',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 750,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 16,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdeurso',
        name: 'Braceiras de Urso',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 1813,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 12,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdegato',
        name: 'Braceiras de Gato',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 713,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 4,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdegrifo',
        name: 'Braceiras de Grifo',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 1571,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 10,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdemanticora',
        name: 'Braceiras de Manticora',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 1052,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdevibora',
        name: 'Braceiras de Vibora',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 842,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 6,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdelobo',
        name: 'Braceiras de Lobo',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 1302,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 8,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },
    
    {
        id: 'braceirasdecorvo',
        name: 'Braceiras de Corvo',
        icon: 'https://static.divine-pride.net/images/items/item/2984.png',
        category: 'equipment',
        goldValue: 990,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 3,
        bonus: ' ',
        description: 'Armadura para braços',
        recipe: [
            '',
            '',
            ''
        ]
    },

    // =====================================
    // EQUIPAMENTOS ÉLFICOS
    // =====================================

    {
        id: 'cotademalhaelfica',
        name: 'Cota Élfica',
        icon: 'https://static.divine-pride.net/images/items/item/450089.png',
        category: 'equipment',
        goldValue: 3950,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 10,
        bonus: '',
        description: '+1 Esquiva e Furtividade. Reduz penalidades de terreno difícil em 2m.',
        recipe: ['', '', '']
    },
    {
        id: 'braceiraselficas',
        name: 'Braceiras Élficas',
        icon: 'https://static.divine-pride.net/images/items/item/450089.png',
        category: 'equipment',
        goldValue: 3320,
        type: 'armor',
        weaponType: 'Braceiras',
        defense: 10,
        bonus: '',
        description: '+1 Crítico em Arco e Flecha.',
        recipe: ['', '', '']
    },
    {
        id: 'capuzelfico',
        name: 'Capuz Élfico',
        icon: 'https://static.divine-pride.net/images/items/item/450089.png',
        category: 'equipment',
        goldValue: 3280,
        type: 'armor',
        weaponType: 'Cabeça',
        defense: 10,
        bonus: '',
        description: '+2 Percepção e +2 Furtividade. Não sofre penalidades em pouca luz.',
        recipe: ['', '', '']
    },
    {
        id: 'calcaselficas',
        name: 'Calças Élficas',
        icon: 'https://static.divine-pride.net/images/items/item/450089.png',
        category: 'equipment',
        goldValue: 340,
        type: 'armor',
        weaponType: 'Pernas',
        defense: 10,
        bonus: '',
        description: '+1 Crítico em Esquiva.',
        recipe: ['', '', '']
    },
    {
        id: 'armaduravrihedd',
        name: 'Armadura Vrihedd',
        icon: 'https://static.divine-pride.net/images/items/item/450168.png',
        category: 'equipment',
        goldValue: 1800,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 15,
        bonus: '',
        description: '+1 Crítico em Bloquear. +1 Acerto com Espadas.',
        recipe: ['', '', '']
    },
    {
        id: 'braceirasvrihedd',
        name: 'Braceiras Vrihedd',
        icon: 'https://static.divine-pride.net/images/items/item/450168.png',
        category: 'equipment',
        goldValue: 520,
        type: 'armor',
        weaponType: 'Braceiras',
        defense: 15,
        bonus: '',
        description: '+1 Crítico com Espadas.',
        recipe: ['', '', '']
    },
    {
        id: 'elmovrihedd',
        name: 'Elmo Vrihedd',
        icon: 'https://static.divine-pride.net/images/items/item/450168.png',
        category: 'equipment',
        goldValue: 460,
        type: 'armor',
        weaponType: 'Cabeça',
        defense: 15,
        bonus: '',
        description: 'Dano crítico na cabeça reduzido em -10.',
        recipe: ['', '', '']
    },
    {
        id: 'grevasvrihedd',
        name: 'Grevas Vrihedd',
        icon: 'https://static.divine-pride.net/images/items/item/450168.png',
        category: 'equipment',
        goldValue: 520,
        type: 'armor',
        weaponType: 'Pernas',
        defense: 15,
        bonus: '',
        description: 'Com um inimigo próximo pode se afastar sem receber ataque de oportunidade.',
        recipe: ['', '', '']
    },
    {
        id: 'armadurademahakam',
        name: 'Armadura de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/2375.png',
        category: 'equipment',
        goldValue: 1850,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 16,
        bonus: '',
        description: '+1 Crítico em Bloquear.',
        recipe: ['', '', '']
    },
    {
        id: 'braceirasdemahakam',
        name: 'Braceiras de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/2375.png',
        category: 'equipment',
        goldValue: 5580,
        type: 'armor',
        weaponType: 'Braceiras',
        defense: 16,
        bonus: '',
        description: '+2 Bloquear.',
        recipe: ['', '', '']
    },
    {
        id: 'elmodemahakam',
        name: 'Elmo de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/2375.png',
        category: 'equipment',
        goldValue: 520,
        type: 'armor',
        weaponType: 'Cabeça',
        defense: 16,
        bonus: '',
        description: '+2 Crítico em Bloquear golpes na cabeça.',
        recipe: ['', '', '']
    },
    {
        id: 'grevasdemahakam',
        name: 'Grevas de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/2375.png',
        category: 'equipment',
        goldValue: 560,
        type: 'armor',
        weaponType: 'Pernas',
        defense: 16,
        bonus: '',
        description: 'Se conseguir bloquear um ataque de oportunidade você poderá dar um contra-ataque.',
        recipe: ['', '', '']
    },
    {
        id: 'armaduradeaconegroanao',
        name: 'Armadura de Aço Negro',
        icon: 'https://static.divine-pride.net/images/items/item/15346.png',
        category: 'equipment',
        goldValue: 2400,
        type: 'armor',
        weaponType: 'Armadura Pesada',
        defense: 16,
        bonus: '',
        description: '+1 Crítico em Bloquear.',
        recipe: ['', '', '']
    },
    {
        id: 'braceirasdeaconegro',
        name: 'Braceiras de Aço Negro',
        icon: 'https://static.divine-pride.net/images/items/item/15346.png',
        category: 'equipment',
        goldValue: 700,
        type: 'armor',
        weaponType: 'Braceiras',
        defense: 16,
        bonus: '',
        description: 'Bloquear com sucesso permite contra-atacar.',
        recipe: ['', '', '']
    },
    {
        id: 'elmodeaconegro',
        name: 'Elmo de Aço Negro',
        icon: 'https://static.divine-pride.net/images/items/item/15346.png',
        category: 'equipment',
        goldValue: 620,
        type: 'armor',
        weaponType: 'Cabeça',
        defense: 16,
        bonus: '',
        description: 'Defesa crítica em ataques na cabeça +1, pode contra-atacar sempre que receber um ataque na cabeça.',
        recipe: ['', '', '']
    },
    {
        id: 'grevasdeaconegro',
        name: 'Grevas de Aço Negro',
        icon: 'https://static.divine-pride.net/images/items/item/15346.png',
        category: 'equipment',
        goldValue: 640,
        type: 'armor',
        weaponType: 'Pernas',
        defense: 16,
        bonus: '',
        description: 'Você sempre poderá contra-atacar um ataque de oportunidade.',
        recipe: ['', '', '']
    },

    {
        id: 'armaduraelficadebruxo',
        name: 'Armadura Élfica de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/15366.png',
        category: 'equipment',
        goldValue: 4200,
        type: 'armor',
        weaponType: 'Armadura Leve',
        defense: 10,
        bonus: '',
        description: 'A cada Esquiva bem-sucedida, recebe +1 de Bonus Crítico no seu próximo turno.',
        recipe: ['', '', '']
    },
    {
        id: 'braceiraselficasdebruxo',
        name: 'Braceiras Élficas de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/15366.png',
        category: 'equipment',
        goldValue: 1100,
        type: 'armor',
        weaponType: 'Braceiras',
        defense: 10,
        bonus: '',
        description: 'Esquivar permite contra-atacar o inimigo no mesmo local que ele tentou te acertar.',
        recipe: ['', '', '']
    },
    {
        id: 'capuzelficodebruxo',
        name: 'Capuz Élfico de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/15366.png',
        category: 'equipment',
        goldValue: 900,
        type: 'armor',
        weaponType: 'Cabeça',
        defense: 10,
        bonus: '',
        description: 'Após uma esquiva bem sucedida, uma vez por turno você pode contra-atacar, e seu ataque irá acertar caso o oponente não tirar crítico.',
        recipe: ['', '', '']
    },
    {
        id: 'calcaselficasdebruxo',
        name: 'Calças Élficas de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/15366.png',
        category: 'equipment',
        goldValue: 950,
        type: 'armor',
        weaponType: 'Pernas',
        defense: 10,
        bonus: '',
        description: 'Sempre que contra-atacar um inimigo você pode se mover 1 quadrado.',
        recipe: ['', '', '']
    },
    {
        id: 'armaduraanaadebruxo',
        name: 'Armadura Anã de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/450086.png',
        category: 'equipment',
        goldValue: 4600,
        type: 'armor',
        weaponType: 'Armadura Média',
        defense: 16,
        bonus: '',
        description: 'Após um Bloqueio bem sucedido, uma vez por turno você pode contra-atacar, e seu ataque será um Ataque Forte.',
        recipe: ['', '', '']
    },
    {
        id: 'braceirasanaasdebruxo',
        name: 'Braceiras Anãs de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/450086.png',
        category: 'equipment',
        goldValue: 1200,
        type: 'armor',
        weaponType: 'Braceiras',
        defense: 16,
        bonus: '',
        description: 'Recebe +1 Crítico para Ataque Forte e Bloqueio.',
        recipe: ['', '', '']
    },
    {
        id: 'elmodebruxomahakam',
        name: 'Capuz Anão de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/450086.png',
        category: 'equipment',
        goldValue: 1000,
        type: 'armor',
        weaponType: 'Cabeça',
        defense: 16,
        bonus: '',
        description: 'Recebe +2 em Bloquear contra ataques que atinjam sua cabeça e +1 na margem crítico de defesa na cabeça.',
        recipe: ['', '', '']
    },
    {
        id: 'grevasanaasdebruxo',
        name: 'Grevas Anãs de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/450086.png',
        category: 'equipment',
        goldValue: 950,
        type: 'armor',
        weaponType: 'Pernas',
        defense: 16,
        bonus: '',
        description: 'Ignora a primeira tentativa de Empurrão ou Derrubar sofrida a cada combate.',
        recipe: ['', '', '']
    },

    // =====================================
    // ETC
    // =====================================

    {
        id: 'ossosdeferas',
        name: 'Ossos de Feras',
        icon: 'https://static.divine-pride.net/images/items/item/932.png',
        category: 'misc',
        goldValue: 0,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'courodevaca',
        name: 'Couro de Vaca',
        icon: 'https://static.divine-pride.net/images/items/item/919.png',
        category: 'misc',
        goldValue: 0,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'courodraconideo',
        name: 'Couro Draconídeo',
        icon: 'https://static.divine-pride.net/images/items/item/6403.png',
        category: 'misc',
        goldValue: 0,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'escamasdedraconideo',
        name: 'Escamas de Draconídeo',
        icon: 'https://static.divine-pride.net/images/items/item/1036.png',
        category: 'misc',
        goldValue: 0,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'penas',
        name: 'Penas',
        icon: 'https://static.divine-pride.net/images/items/item/7079.png',
        category: 'misc',
        goldValue: 1,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'courofortalecido',
        name: 'Couro Fortalecido',
        icon: 'https://static.divine-pride.net/images/items/item/1001158.png',
        category: 'misc',
        goldValue: 10,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'couro',
        name: 'Couro',
        icon: 'https://static.divine-pride.net/images/items/item/919.png',
        category: 'misc',
        goldValue: 3,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'courolyriano',
        name: 'Couro Lyriano',
        icon: 'https://static.divine-pride.net/images/items/item/6603.png',
        category: 'misc',
        goldValue: 5,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'courodelobo',
        name: 'Couro de Lobo',
        icon: 'https://static.divine-pride.net/images/items/item/919.png',
        category: 'misc',
        goldValue: 0,
        description: 'Partes de animais',
        recipe: []
    },
    
    {
        id: 'oleoescurecedor',
        name: 'Óleo Escurecedor',
        icon: 'https://static.divine-pride.net/images/items/item/6216.png',
        category: 'misc',
        goldValue: 4,
        description: 'Óleo',
        recipe: []
    },
    
    {
        id: 'oleodedraco',
        name: 'Óleo de Draco',
        icon: 'https://static.divine-pride.net/images/items/item/25232.png',
        category: 'misc',
        goldValue: 0,
        description: 'Óleo',
        recipe: []
    },
    
    {
        id: 'gorduradeester',
        name: 'Gordura de Éster',
        icon: 'https://static.divine-pride.net/images/items/item/7457.png',
        category: 'misc',
        goldValue: 0,
        description: 'Óleo',
        recipe: []
    },
    
    {
        id: 'quintessencia',
        name: 'Quintessência',
        icon: 'https://static.divine-pride.net/images/items/item/1000552.png',
        category: 'misc',
        goldValue: 0,
        description: 'Liquido',
        recipe: []
    },
    
    {
        id: 'ceradeogro',
        name: 'Cera de Ogro',
        icon: 'https://static.divine-pride.net/images/items/item/979.png',
        category: 'misc',
        goldValue: 0,
        description: 'Partes de Monstro',
        recipe: []
    },
    
    {
        id: 'pedradeamolar',
        name: 'Pedra de Amolar',
        icon: 'https://static.divine-pride.net/images/items/item/7096.png',
        category: 'misc',
        goldValue: 5,
        description: 'Os próximos 5 ataques de armas que tenham lamina irão causar 1d6 adicional.',
        recipe: []
    },
    
    
    {
        id: 'argiladerio',
        name: 'Argila de Rio',
        icon: 'https://static.divine-pride.net/images/items/item/25619.png',
        category: 'misc',
        goldValue: 0,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'pedra',
        name: 'Pedra',
        icon: 'https://static.divine-pride.net/images/items/item/7049.png',
        category: 'misc',
        goldValue: 0,
        description: 'Natureza',
        recipe: []
    },
        
    {
        id: 'pozerrikano',
        name: 'Pó Zerrikano',
        icon: 'https://static.divine-pride.net/images/items/item/7574.png',
        category: 'misc',
        goldValue: 3,
        description: 'Minério',
        recipe: []
    },
    
    {
        id: 'linhodetecido',
        name: 'Linho de Tecido',
        icon: 'https://static.divine-pride.net/images/items/item/1059.png',
        category: 'misc',
        goldValue: 3,
        description: 'Tecido',
        recipe: []
    },
    
    {
        id: 'madeiraendurecida',
        name: 'Madeira Endurecida',
        icon: 'https://static.divine-pride.net/images/items/item/7068.png',
        category: 'misc',
        goldValue: 2,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'linho',
        name: 'Linho',
        icon: 'https://static.divine-pride.net/images/items/item/7166.png',
        category: 'misc',
        goldValue: 4,
        description: 'Tecido',
        recipe: []
    },
    
    {
        id: 'linha',
        name: 'Linha',
        icon: 'https://static.divine-pride.net/images/items/item/7285.png',
        category: 'misc',
        goldValue: 1,
        description: 'Tecido',
        recipe: []
    },

    {
        id: 'aguaforte',
        name: 'Água-forte',
        icon: 'https://static.divine-pride.net/images/items/item/6386.png',
        category: 'misc',
        goldValue: 2,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'aguaducal',
        name: 'Água Ducal',
        icon: 'https://static.divine-pride.net/images/items/item/6386.png',
        category: 'misc',
        goldValue: 2,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'aguadestilada',
        name: 'Água Destilada',
        icon: 'https://static.divine-pride.net/images/items/item/1000552.png',
        category: 'misc',
        goldValue: 2,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'aguapurificada',
        name: 'Água Purificada',
        icon: 'https://static.divine-pride.net/images/items/item/1000552.png',
        category: 'misc',
        goldValue: 2,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'aconito',
        name: 'Aconito',
        icon: 'https://static.divine-pride.net/images/items/item/7763.png',
        category: 'misc',
        goldValue: 2,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'bostadedemonio',
        name: 'Bosta de Demônio',
        icon: 'https://static.divine-pride.net/images/items/item/764.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'cerebrodeafogador',
        name: 'Cérebro de Afogador',
        icon: 'https://static.divine-pride.net/images/items/item/764.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
        
    {
        id: 'cogumelosewant',
        name: 'Cogumelo Sewant',
        icon: 'https://static.divine-pride.net/images/items/item/1070.png',
        category: 'misc',
        goldValue: 0,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'cogumelosdeesgoto',
        name: 'Cogumelos de Esgoto',
        icon: 'https://static.divine-pride.net/images/items/item/6542.png',
        category: 'misc',
        goldValue: 0,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'coracaodegolem',
        name: 'Coração de Golem',
        icon: 'https://static.divine-pride.net/images/items/item/953.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'dentedevampiro',
        name: 'Dente de Vampiro',
        icon: 'https://static.divine-pride.net/images/items/item/913.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'enxofre',
        name: 'Enxofre',
        icon: 'https://static.divine-pride.net/images/items/item/25488.png',
        category: 'misc',
        goldValue: 1,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'essenciadeluz',
        name: 'Essência de Luz',
        icon: 'https://static.divine-pride.net/images/items/item/7178.png',
        category: 'misc',
        goldValue: 5,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'espiritoanaoalcool',
        name: 'Espírito Anão (Álcool)',
        icon: 'https://static.divine-pride.net/images/items/item/7487.png',
        category: 'misc',
        goldValue: 2,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'extratodeveneno',
        name: 'Extrato de Veneno',
        icon: 'https://static.divine-pride.net/images/items/item/7565.png',
        category: 'misc',
        goldValue: 1,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'figadodetroll',
        name: 'Fígado de Troll',
        icon: 'https://static.divine-pride.net/images/items/item/950.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
        
    {
        id: 'folhasdealoe',
        name: 'Folhas de Aloe',
        icon: 'https://static.divine-pride.net/images/items/item/704.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'folhasdebalisa',
        name: 'Folhas de Bálisa',
        icon: 'https://static.divine-pride.net/images/items/item/7100.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'fragmentoslunares',
        name: 'Fragmentos Lunares',
        icon: 'https://static.divine-pride.net/images/items/item/6362.png',
        category: 'misc',
        goldValue: 1,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'frutadebalisa',
        name: 'Fruta de Bálisa',
        icon: 'https://static.divine-pride.net/images/items/item/6258.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'frutadeuvaespim',
        name: 'Fruta de Uva-Espim',
        icon: 'https://static.divine-pride.net/images/items/item/6417.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'garradecarnical',
        name: 'Garra de Carníçal',
        icon: 'https://static.divine-pride.net/images/items/item/1043.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'ginatia',
        name: 'Ginátia',
        icon: 'https://static.divine-pride.net/images/items/item/6563.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'heleboropetalas',
        name: 'Heléboro (Pétalas)',
        icon: 'https://static.divine-pride.net/images/items/item/7763.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'linguadeafogador',
        name: 'Língua de Afogador',
        icon: 'https://static.divine-pride.net/images/items/item/1015.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'linguadebruxasepulcral',
        name: 'Língua de Bruxa Sepulcral',
        icon: 'https://static.divine-pride.net/images/items/item/903.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'madressilva',
        name: 'Madressilva',
        icon: 'https://static.divine-pride.net/images/items/item/25266.png',
        category: 'misc',
        goldValue: 0,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'medulaosseadecarnical',
        name: 'Medula Óssea de Carníçal',
        icon: 'https://static.divine-pride.net/images/items/item/25766.png',
        category: 'misc',
        goldValue: 0,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'mitrobranco',
        name: 'Mitro Branco',
        icon: 'https://static.divine-pride.net/images/items/item/25342.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'mofoverde',
        name: 'Mofo Verde',
        icon: 'https://static.divine-pride.net/images/items/item/7565.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
        
    {
        id: 'olhosdearacna',
        name: 'Olhos de Aracna',
        icon: 'https://static.divine-pride.net/images/items/item/7263.png',
        category: 'misc',
        goldValue: 3,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'olhosdewyvern',
        name: 'Olhos de Wyvern',
        icon: 'https://static.divine-pride.net/images/items/item/7337.png',
        category: 'misc',
        goldValue: 3,
        description: 'Monstro',
        recipe: []
    },
    
    {
        id: 'ovodewyvern',
        name: 'Ovo de Wyvern',
        icon: 'https://static.divine-pride.net/images/items/item/6093.png',
        category: 'misc',
        goldValue: 1,
        description: 'Monstro',
        recipe: []
    },
        
    {
        id: 'pequenacicuta',
        name: 'Pequena Cicuta',
        icon: 'https://static.divine-pride.net/images/items/item/7937.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'petalasdeginatia',
        name: 'Pétalas de Ginatía',
        icon: 'https://static.divine-pride.net/images/items/item/25157.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'petalasdeheleboro',
        name: 'Pétalas de Heléboro',
        icon: 'https://static.divine-pride.net/images/items/item/25157.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'petalasdemirtobranco',
        name: 'Pétalas de Mirto Branco',
        icon: 'https://static.divine-pride.net/images/items/item/25157.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'petalasdeverbena',
        name: 'Pétalas de Verbena',
        icon: 'https://static.divine-pride.net/images/items/item/25157.png',
        category: 'misc',
        goldValue: 1,
        description: 'Natureza',
        recipe: []
    },
    
    {
        id: 'poespectral',
        name: 'Pó Espectral',
        icon: 'https://static.divine-pride.net/images/items/item/1057.png',
        category: 'misc',
        goldValue: 5,
        description: 'Mineral / Alquímico',
        recipe: []
    },
    
    {
        id: 'poinfundido',
        name: 'Pó Infundido',
        icon: 'https://static.divine-pride.net/images/items/item/6247.png',
        category: 'misc',
        goldValue: 10,
        description: 'Mineral / Alquímico, um pó obtido de cristais preciosos',
        recipe: []
    },

    {
        id: 'polvora',
        name: 'Pólvora',
        icon: 'https://static.divine-pride.net/images/items/item/7204.png',
        category: 'misc',
        goldValue: 10,
        description: 'Mineral / Alquímico',
        recipe: []
    },

    {
        id: 'carvao',
        name: 'Carvão',
        icon: 'https://static.divine-pride.net/images/items/item/1003.png',
        category: 'misc',
        goldValue: 1,
        description: 'Ingrediente utilizado muito em forjas',
        recipe: []
    },

    {
        id: 'carvaonegro',
        name: 'Carvão Negro',
        icon: 'https://static.divine-pride.net/images/items/item/6251.png',
        category: 'misc',
        goldValue: 10,
        description: 'Ingrediente utilizado muito em forjas',
        recipe: []
    },

    // =====================================
    // MINÉRIOS
    // =====================================

    {
        id: 'mineriodeferro',
        name: 'Minério de Ferro',
        icon: 'https://static.divine-pride.net/images/items/item/1002.png',
        category: 'misc',
        goldValue: 10,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'ferro',
        name: 'Ferro',
        icon: 'https://static.divine-pride.net/images/items/item/998.png',
        category: 'misc',
        goldValue: 15,
        description: 'Minério',
        recipe: [
            '1x Minério de Ferro'
        ]
    },

    {
        id: 'aco',
        name: 'Aço',
        icon: 'https://static.divine-pride.net/images/items/item/999.png',
        category: 'misc',
        goldValue: 25,
        description: 'Minério',
        recipe: [
            '1x Minério de Ferro',
            '1x Carvão'
        ]
    },

    {
        id: 'mineriodeferronegro',
        name: 'Minério de Ferro Negro',
        icon: 'https://static.divine-pride.net/images/items/item/757.png',
        category: 'misc',
        goldValue: 25,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'ferronegro',
        name: 'Ferro Negro',
        icon: 'https://static.divine-pride.net/images/items/item/7075.png',
        category: 'misc',
        goldValue: 50,
        description: 'Minério',
        recipe: [
            '1x Minério de Ferro Negro'
        ]
    },
    
    {
        id: 'aconegro',
        name: 'Aço Negro',
        icon: 'https://static.divine-pride.net/images/items/item/6747.png',
        category: 'misc',
        goldValue: 100,
        description: 'Minério',
        recipe: [
            '1x Minério de Ferro Negro',
            '1x Carvão'
        ]
    },

    {
        id: 'acodemahakam',
        name: 'Aço de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/1002.png',
        category: 'misc',
        goldValue: 30,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'acodetretogor',
        name: 'Aço de Tretogor',
        icon: 'https://static.divine-pride.net/images/items/item/7524.png',
        category: 'misc',
        goldValue: 35,
        description: 'Minério',
        recipe: []
    },
    
    {
        id: 'dimeritio',
        name: 'Dimerítio',
        icon: 'https://static.divine-pride.net/images/items/item/7095.png',
        category: 'misc',
        goldValue: 100,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'dimeritiodemahakam',
        name: 'Dimerítio de Mahakam',
        icon: 'https://static.divine-pride.net/images/items/item/7075.png',
        category: 'misc',
        goldValue: 100,
        description: 'Minério',
        recipe: []
    },
    
    {
        id: 'pedrapreciosa',
        name: 'Pedra Preciosa',
        icon: 'https://static.divine-pride.net/images/items/item/7974.png',
        category: 'misc',
        goldValue: 1000,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'cristal',
        name: 'Cristal',
        icon: 'https://static.divine-pride.net/images/items/item/6623.png',
        category: 'misc',
        goldValue: 600,
        description: 'Minério',
        recipe: []
    },
    
    {
        id: 'minerioincandescente',
        name: 'Minério Incandescente',
        icon: 'https://static.divine-pride.net/images/items/item/25272.png',
        category: 'misc',
        goldValue: 40,
        description: 'Minério',
        recipe: []
    },
    
    {
        id: 'ouro',
        name: 'Ouro',
        icon: 'https://static.divine-pride.net/images/items/item/969.png',
        category: 'misc',
        goldValue: 500,
        description: 'Minério',
        recipe: []
    },
    
    {
        id: 'meteorito',
        name: 'Meteorito',
        icon: 'https://static.divine-pride.net/images/items/item/7232.png',
        category: 'misc',
        goldValue: 60,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'mineriodeprata',
        name: 'Minério de Prata',
        icon: 'https://static.divine-pride.net/images/items/item/1002.png',
        category: 'misc',
        goldValue: 30,
        description: '1x Minério de Prata cria 1x Prata',
        recipe: []
    },

    {
        id: 'prata',
        name: 'Prata',
        icon: 'https://static.divine-pride.net/images/items/item/7229.png',
        category: 'misc',
        goldValue: 60,
        description: 'Minério',
        recipe: []
    },

    {
        id: 'podeprata',
        name: 'Pó de Prata',
        icon: 'https://static.divine-pride.net/images/items/item/22706.png',
        category: 'misc',
        goldValue: 10,
        description: 'Pó de prata que pode ser utilizado para diversas finalidades alquimicas.',
        recipe: [
            '1x Prata cria 6x Pó de Prata.'
        ]
    },

    {
        id: 'coroa',
        name: 'Coroa',
        icon: 'https://static.divine-pride.net/images/items/item/7683.png',
        category: 'misc',
        goldValue: 1,
        description: 'Moeda local.',
        recipe: []
    },

    // =====================================
    // INGREDIENTES DE CRIAÇÃO E ALQUIMIA
    // =====================================
    ...[
        ['verbena', 'Verbena', '🌿', 'Erva usada em preparados alquímicos e óleos.'],
        ['visco', 'Visco', '🌿', 'Ingrediente vegetal adesivo usado em alquimia.'],
        ['extratodemandragora', 'Extrato de Mandrágora', '🧪', 'Extrato alquímico concentrado de mandrágora.'],
        ['scleroderma', 'Scleroderma', '🍄', 'Fungo utilizado como reagente alquímico.'],
        ['raizdemandragora', 'Raiz de Mandrágora', '🌱', 'Raiz de alto valor para poções e preparados.'],
        ['fosforo', 'Fósforo', '🧂', 'Reagente inflamável usado em bombas e compostos.'],
        ['cal', 'Cal', '⚪', 'Composto mineral usado em preparados médicos e alquímicos.'],
        ['seivabranca', 'Seiva Branca', '💧', 'Seiva vegetal usada em alucinógenos e bombas.'],
        ['semprevivaana', 'Sempre-viva Anã', '🌼', 'Planta resistente usada em óleos e tintas.'],
        ['quelidonia', 'Quelidônia', '🌿', 'Erva medicinal usada em poções de bruxo.'],
        ['solucaodemercurio', 'Solução de Mercúrio', '🧪', 'Solução metálica empregada em compostos alquímicos.'],
        ['mel', 'Mel', '🍯', 'Ingrediente natural usado em alimentos e alquimia.'],
        ['raizdepimenta', 'Raiz de Pimenta', '🌱', 'Raiz aromática usada em sais e preparados.'],
        ['raizdepimentadioica', 'Raiz de Pimenta Dioica', '🌱', 'Raiz picante utilizada em poções e antídotos.'],
        ['sanguedecarnical', 'Sangue de Carniçal', '🩸', 'Componente de monstro usado em poções e óleos.'],
        ['sanguedevampiro', 'Sangue de Vampiro', '🩸', 'Componente vampírico raro usado em alquimia.'],
        ['salivadelobisomem', 'Saliva de Lobisomem', '🧫', 'Componente de amaldiçoado usado em poções e óleos.'],
        ['salivadeendriga', 'Saliva de Endriga', '🧫', 'Componente insetoide usado em poções.'],
        ['venenodearacna', 'Veneno de Aracna', '☠️', 'Veneno de monstro usado em óleos e poções.'],
        ['hidromel', 'Hidromel', '🍺', 'Bebida fermentada usada como base alquímica.'],
        ['sebo', 'Sebo', '🫙', 'Gordura usada como base para óleos.'],
        ['salivadevampiro', 'Saliva de Vampiro', '🧫', 'Componente vampírico usado em óleo de necrófago.'],
        ['salmineralrefinado', 'Sal Mineral Refinado', '🧂', 'Sal purificado usado em óleos especiais.'],
        ['salitre', 'Salitre', '🧂', 'Reagente explosivo usado na fabricação de bombas.'],
        ['nitratodeprata', 'Nitrato de Prata', '⚗️', 'Sal de prata usado em explosivos especializados.'],
        ['estilhacosdeferro', 'Estilhaços de Ferro', '🔩', 'Fragmentos metálicos usados em bombas de estilhaços.'],
        ['cereais', 'Cereais', '🌾', 'Grãos usados em rações, pães e bebidas fermentadas.'],
        ['carneseca', 'Carne Seca', '🥩', 'Carne conservada para viagens e refeições simples.'],
        ['sal', 'Sal', '🧂', 'Tempero e conservante básico usado na culinária.'],
        ['carne', 'Carne', '🥩', 'Porção de carne fresca usada em refeições quentes.'],
        ['legumes', 'Legumes', '🥕', 'Seleção de vegetais usada em ensopados e banquetes.'],
        ['ervasculinarias', 'Ervas Culinárias', '🌿', 'Ervas aromáticas usadas para temperar refeições.'],
        ['carnenobre', 'Carne Nobre', '🍖', 'Corte selecionado para refeições sofisticadas.'],
        ['aguabruta', 'Água Bruta', '🪣', 'Água coletada que precisa ser tratada antes do consumo.'],
        ['lupulo', 'Lúpulo', '🌿', 'Flor amarga usada na produção de cerveja.'],
        ['levedura', 'Levedura', '🧫', 'Fermento usado na produção de bebidas.'],
        ['uvasdetoussaint', 'Uvas de Toussaint', '🍇', 'Uvas de alta qualidade usadas nos vinhos de Toussaint.'],
        ['carnedecoelho', 'Carne de Coelho', '🐇', 'Carne de caça leve usada em assados e estufados.'],
        ['carnedeveado', 'Carne de Veado', '🦌', 'Carne de caça nutritiva usada em ensopados.'],
        ['carnedeporco', 'Carne de Porco', '🐖', 'Carne versátil usada em assados, tortas e estufados.'],
        ['batata', 'Batata', '🥔', 'Tubérculo usado em sopas e ensopados.'],
        ['cebola', 'Cebola', '🧅', 'Ingrediente aromático básico da culinária.'],
        ['cenoura', 'Cenoura', '🥕', 'Vegetal usado em sopas e ensopados.'],
        ['alho', 'Alho', '🧄', 'Tempero aromático usado em carnes e molhos.'],
        ['cogumeloscomestiveis', 'Cogumelos Comestíveis', '🍄', 'Cogumelos seguros para refeições e recheios.'],
        ['farinha', 'Farinha', '🌾', 'Cereais moídos para pães e massas.', ['2x Cereais'], 2, 'culinary'],
        ['ovos', 'Ovos', '🥚', 'Ingrediente usado em omeletes, massas e tortas.'],
        ['leite', 'Leite', '🥛', 'Ingrediente fresco usado em preparos culinários.'],
        ['manteiga', 'Manteiga', '🧈', 'Gordura culinária produzida a partir de leite.', ['2x Leite'], 1, 'culinary']
    ].map(([id, name, icon, description, recipe = [], craftYield = 1, craftingCategory = '']) => ({
        id,
        name,
        icon,
        category: 'misc',
        type: 'material',
        craftingMaterial: true,
        goldValue: 0,
        description,
        recipe,
        ...(recipe.length ? { craftYield, craftingCategory } : {})
    }))

];

// Cada proteção possui um slot explícito. O subtipo descreve o peso/material e
// não deve ser usado para decidir qual parte do corpo o item protege.
const PREDEFINED_ARMOR_SLOTS = Object.freeze({
    head: [
        'capuzdearqueirodeverden', 'capuzdetecidoduplo', 'capuzcomprotecaodeolhos',
        'toucadecotademalha', 'capuzblindado', 'armettemeriano', 'grandeelmo',
        'elmoskellige', 'elmonilfgardiano', 'capuzelfico', 'elmovrihedd',
        'elmodemahakam', 'elmodeaconegro', 'capuzelficodebruxo', 'elmodebruxomahakam'
    ],
    body: [
        'jaquetao', 'jaquetaodeaedirn', 'jaquetaodetecidoduplo', 'couraca',
        'armaduradealabardeiroredaniano', 'jaquetalyrianadecouro', 'armaduradeplaca',
        'armadurapesadadailhahindar', 'armaduradeplacanilfgardiana', 'armaduradeurso',
        'armaduradegato', 'armaduradegrifo', 'armadurademanticora', 'armaduradevibora',
        'armaduradelobo', 'armaduradecorvo', 'cotademalhaelfica', 'armaduravrihedd',
        'armadurademahakam', 'armaduradeaconegroanao', 'armaduraelficadebruxo',
        'armaduraanaadebruxo'
    ],
    arms: [
        'braceirasdacavalaria', 'braceirasacolchoadas', 'braceirasdetecidoduplo',
        'braceirasblindadas', 'armaduradebracosredanianas', 'braceiraslyrianasdecouro',
        'armaduradeplacasparabraco', 'braceiraspesadasdehindar',
        'armaduradebracosnilfgardianas', 'braceirasdeurso', 'braceirasdegato',
        'braceirasdegrifo', 'braceirasdemanticora', 'braceirasdevibora',
        'braceirasdelobo', 'braceirasdecorvo', 'braceiraselficas', 'braceirasvrihedd',
        'braceirasdemahakam', 'braceirasdeaconegro', 'braceiraselficasdebruxo',
        'braceirasanaasdebruxo'
    ],
    legs: [
        'calcasdecavalaria', 'calcasacolchoadas', 'calcasdetecidoduplo', 'calcasblindadas',
        'grevasredaniana', 'calcaslyrianasdecouro', 'grevasdeplaca',
        'chaussespesadasdehindas', 'grevasnilfgardianas', 'calcasdeurso', 'calcasdegato',
        'calcasdegrifo', 'calcasdemanticora', 'calcasdevibora', 'calcasdelobo',
        'calcasdecorvo', 'calcaselficas', 'grevasvrihedd', 'grevasdemahakam',
        'grevasdeaconegro', 'calcaselficasdebruxo', 'grevasanaasdebruxo'
    ],
    shield: [
        'escudodemadeira', 'broqueldeaco', 'escudotemeriano',
        'escudodesaqueadorskellige', 'escudokaedweni', 'escudolagrimadeaco',
        'pavise', 'pavisenilfgardiano', 'escudopipanilfgardiano'
    ]
});

// Pesos importados da coluna "Peso" da aba Items da planilha de regras.
// Equipamentos especiais sem peso preenchido na planilha recebem uma estimativa
// conservadora pela classe da armadura ou pelo número de mãos da arma.
const PREDEFINED_EQUIPMENT_WEIGHTS = Object.freeze({
    flechadeferro: 0.1,
    flechadeaco: 0.1,
    flechadeprata: 0.1,
    setadeferro: 0.1,
    setadeaco: 0.1,
    setadeprata: 0.1,
    espadadeacodebruxo: 2.5,
    espadadepratadebruxo: 1.5,
    espadalongadeferro: 1.5,
    espadadecavaleiro: 2.5,
    gleddyf: 3,
    falcionedocacador: 2,
    krigsverd: 2,
    esboda: 1.5,
    kord: 1.5,
    laminadevicovaro: 1.5,
    torrwr: 2.5,
    adaga: 0.5,
    estilete: 0.5,
    punhal: 1,
    jambiya: 0.5,
    machadodemao: 1,
    machadodebatalha: 2,
    machadoberserker: 3,
    soqueira: 0.5,
    maca: 2,
    martelodasterrasaltas: 3,
    lanca: 3.5,
    achadearma: 3,
    alabardavermelha: 4,
    cajado: 3,
    cajadodepastor: 3.5,
    cajadodeferro: 4,
    cajadodecristal: 2.5,
    arcocurto: 1,
    arcolongo: 2,
    arcodeguerra: 3,
    'bestademão': 0.5,
    besta: 3,
    bestadecacadordemonstros: 4,
    jaquetao: 1,
    jaquetaodeaedirn: 1,
    jaquetaodetecidoduplo: 1.5,
    couraca: 2,
    armaduradealabardeiroredaniano: 3,
    jaquetalyrianadecouro: 2,
    armaduradeplaca: 4,
    armadurapesadadailhahindar: 5,
    armaduradeplacanilfgardiana: 5,
    armaduradeurso: 5,
    armaduradegato: 0.5,
    armaduradegrifo: 2,
    armadurademanticora: 2,
    armaduradevibora: 1,
    armaduradelobo: 2,
    armaduradecorvo: 1,
    capuzdearqueirodeverden: 0.5,
    capuzdetecidoduplo: 0.5,
    capuzcomprotecaodeolhos: 0.5,
    toucadecotademalha: 1,
    capuzblindado: 1,
    armettemeriano: 2,
    grandeelmo: 2.5,
    elmoskellige: 2.5,
    elmonilfgardiano: 3,
    escudodemadeira: 0.5,
    broqueldeaco: 1,
    escudotemeriano: 1.5,
    escudodesaqueadorskellige: 2,
    escudokaedweni: 2.5,
    escudolagrimadeaco: 3,
    pavise: 4,
    pavisenilfgardiano: 5,
    escudopipanilfgardiano: 6,
    calcasdecavalaria: 1,
    calcasacolchoadas: 1,
    calcasdetecidoduplo: 1.5,
    calcasblindadas: 2,
    grevasredaniana: 3,
    calcaslyrianasdecouro: 2,
    grevasdeplaca: 4,
    chaussespesadasdehindas: 5,
    grevasnilfgardianas: 4,
    calcasdeurso: 5,
    calcasdegato: 0.5,
    calcasdegrifo: 2,
    calcasdemanticora: 2,
    calcasdevibora: 1,
    calcasdelobo: 2,
    calcasdecorvo: 1,
    braceirasdacavalaria: 0.5,
    braceirasacolchoadas: 1,
    braceirasdetecidoduplo: 1,
    braceirasblindadas: 1.5,
    armaduradebracosredanianas: 2,
    braceiraslyrianasdecouro: 1.5,
    armaduradeplacasparabraco: 3,
    braceiraspesadasdehindar: 4,
    armaduradebracosnilfgardianas: 3,
    braceirasdeurso: 5,
    braceirasdegato: 0.5,
    braceirasdegrifo: 2,
    braceirasdemanticora: 2,
    braceirasdevibora: 1,
    braceirasdelobo: 2,
    braceirasdecorvo: 1
});

function estimatePredefinedEquipmentWeight(item) {
    if (item.type === 'weapon') return Number(item.hands) === 2 ? 3 : 1.5;

    const armorClass = `${item.weaponType || ''} ${item.description || ''}`.toLocaleLowerCase('pt-BR');
    const slot = item.equipmentSlot;
    if (armorClass.includes('pesada')) return slot === 'head' ? 3 : 5;
    if (armorClass.includes('média') || armorClass.includes('media')) return slot === 'head' ? 1 : 2;
    return slot === 'head' ? 0.5 : 1;
}

predefinedItems.push(
    {
        id: 'cavalocomum',
        name: 'Cavalo Comum',
        icon: '🐴',
        category: 'misc',
        type: 'mount',
        transportKind: 'mount',
        hp: 35,
        movement: 12,
        goldValue: 100,
        description: 'Montaria equilibrada para viagens e deslocamentos cotidianos. Enquanto estiver montado, seu Movimento substitui o Movimento do cavaleiro. Para transportar carga, equipe alforjes.',
        recipe: []
    },
    {
        id: 'cavalodemontaria',
        name: 'Cavalo de Montaria',
        icon: '🏇',
        category: 'misc',
        type: 'mount',
        transportKind: 'mount',
        hp: 30,
        movement: 15,
        goldValue: 180,
        description: 'Cavalo leve e veloz, criado para percorrer grandes distâncias com rapidez. É a melhor escolha para mobilidade, mas possui menos HP que montarias robustas. Para transportar carga, equipe alforjes.',
        recipe: []
    },
    {
        id: 'cavalodecarga',
        name: 'Cavalo de Carga',
        icon: '🐎',
        category: 'misc',
        type: 'mount',
        transportKind: 'mount',
        hp: 45,
        movement: 10,
        goldValue: 140,
        description: 'Cavalo robusto para estradas longas e transporte. Possui mais HP, porém é menos veloz. Sua capacidade de carga depende dos alforjes equipados.',
        recipe: []
    },
    {
        id: 'cavalodeguerra',
        name: 'Cavalo de Guerra',
        icon: '🐴',
        category: 'misc',
        type: 'mount',
        transportKind: 'mount',
        hp: 55,
        movement: 13,
        goldValue: 300,
        description: 'Montaria resistente e treinada para combate, combinando HP elevado e boa mobilidade. Para transportar carga, equipe alforjes.',
        recipe: []
    },
    {
        id: 'selasimples',
        name: 'Sela Simples',
        icon: '🪑',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'saddle',
        weight: 5,
        goldValue: 25,
        description: 'Sela básica para montar com segurança. Ocupa a posição de Sela da montaria.',
        recipe: []
    },
    {
        id: 'seladeviagem',
        name: 'Sela de Viagem',
        icon: '🪑',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'saddle',
        weight: 4,
        goldValue: 55,
        description: 'Sela confortável e mais leve, adequada para viagens longas. Ocupa a posição de Sela da montaria.',
        recipe: []
    },
    {
        id: 'seladeguerra',
        name: 'Sela de Guerra',
        icon: '⚔️',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'saddle',
        weight: 7,
        goldValue: 90,
        description: 'Sela reforçada para manter o cavaleiro firme durante manobras e combates. Ocupa a posição de Sela da montaria.',
        recipe: []
    },
    {
        id: 'alforjespequenos',
        name: 'Alforjes Pequenos',
        icon: '🧳',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'saddlebags',
        capacity: 30,
        weight: 2,
        goldValue: 30,
        description: 'Concede 30 pontos de capacidade de carga à montaria, permitindo armazenar até 30 de peso em seu inventário próprio.',
        recipe: []
    },
    {
        id: 'alforjesgrandes',
        name: 'Alforjes Grandes',
        icon: '🧳',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'saddlebags',
        capacity: 60,
        weight: 4,
        goldValue: 65,
        description: 'Concede 60 pontos de capacidade de carga à montaria, permitindo armazenar até 60 de peso em seu inventário próprio.',
        recipe: []
    },
    {
        id: 'alforjesreforcados',
        name: 'Alforjes Reforçados',
        icon: '🧳',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'saddlebags',
        capacity: 90,
        weight: 6,
        goldValue: 110,
        description: 'Concede 90 pontos de capacidade de carga à montaria, permitindo armazenar até 90 de peso em seu inventário próprio.',
        recipe: []
    },
    {
        id: 'bardaleve',
        name: 'Barda Leve',
        icon: '🛡️',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'barding',
        defense: 2,
        weight: 10,
        goldValue: 100,
        description: 'Proteção leve para a montaria. Absorve até 2 pontos de cada dano recebido antes de atingir o HP da montaria.',
        recipe: []
    },
    {
        id: 'bardapesada',
        name: 'Barda Pesada',
        icon: '🛡️',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'barding',
        defense: 5,
        movementModifier: -1,
        weight: 20,
        goldValue: 220,
        description: 'Proteção pesada para a montaria. Absorve até 5 pontos de cada dano recebido antes de atingir o HP e reduz o Movimento em 1.',
        recipe: []
    },
    {
        id: 'ferradurasdeviagem',
        name: 'Ferraduras de Viagem',
        icon: '🧲',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'horseshoes',
        movementModifier: 1,
        weight: 1,
        goldValue: 45,
        description: 'Aumenta o Movimento da montaria em 1.',
        recipe: []
    },
    {
        id: 'ferradurasdecorrida',
        name: 'Ferraduras de Corrida',
        icon: '🏇',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'horseshoes',
        movementModifier: 2,
        weight: 1,
        goldValue: 90,
        description: 'Ferraduras leves e bem ajustadas que aumentam o Movimento da montaria em 2.',
        recipe: []
    },
    {
        id: 'ferraduraselficas',
        name: 'Ferraduras Élficas',
        icon: '✨',
        category: 'equipment',
        type: 'mount-gear',
        transportKind: 'mount-gear',
        mountSlot: 'horseshoes',
        movementModifier: 3,
        weight: 1,
        goldValue: 180,
        description: 'Ferraduras élficas de acabamento excepcional que aumentam o Movimento da montaria em 3.',
        recipe: []
    },
    {
        id: 'carrocasimples',
        name: 'Carroça Simples',
        icon: '🛒',
        category: 'misc',
        type: 'vehicle',
        transportKind: 'vehicle',
        hp: 60,
        requiredMounts: 1,
        capacity: 150,
        movementModifier: -2,
        goldValue: 180,
        description: 'Veículo simples com inventário próprio. Exige 1 cavalo atrelado, armazena até 150 de peso e reduz o Movimento do conjunto em 2.',
        recipe: []
    },
    {
        id: 'carrocareforcada',
        name: 'Carroça Reforçada',
        icon: '🛒',
        category: 'misc',
        type: 'vehicle',
        transportKind: 'vehicle',
        hp: 80,
        requiredMounts: 1,
        capacity: 250,
        movementModifier: -3,
        goldValue: 320,
        description: 'Carroça resistente com inventário próprio. Exige 1 cavalo atrelado, armazena até 250 de peso e reduz o Movimento do conjunto em 3.',
        recipe: []
    },
    {
        id: 'carruagemcomum',
        name: 'Carruagem Comum',
        icon: '🚋',
        category: 'misc',
        type: 'vehicle',
        transportKind: 'vehicle',
        hp: 70,
        requiredMounts: 2,
        capacity: 200,
        movementModifier: -2,
        goldValue: 450,
        description: 'Carruagem para transporte de passageiros e carga. Exige 2 cavalos atrelados, armazena até 200 de peso e reduz o Movimento do conjunto em 2.',
        recipe: []
    },
    {
        id: 'carruagemluxuosa',
        name: 'Carruagem Luxuosa',
        icon: '👑',
        category: 'misc',
        type: 'vehicle',
        transportKind: 'vehicle',
        hp: 80,
        requiredMounts: 2,
        capacity: 250,
        movementModifier: -2,
        goldValue: 800,
        description: 'Carruagem luxuosa e resistente com inventário próprio. Exige 2 cavalos atrelados, armazena até 250 de peso e reduz o Movimento do conjunto em 2.',
        recipe: []
    }
);

Object.entries(PREDEFINED_ARMOR_SLOTS).forEach(([equipmentSlot, itemIds]) => {
    itemIds.forEach(itemId => {
        const item = predefinedItems.find(entry => entry.id === itemId);
        if (item) item.equipmentSlot = equipmentSlot;
    });
});

predefinedItems.forEach(item => {
    const weaponType = String(item.weaponType || '').toLocaleLowerCase('pt-BR');
    const description = `${item.name || ''} ${item.description || ''}`.toLocaleLowerCase('pt-BR');

    if (weaponType === 'flechas') {
        item.equipmentSlot = 'ammunition';
        item.ammunitionType = 'arrow';
        item.acquisitionPackSize = 10;
        item.acquisitionUnitLabel = 'kit';
        item.acquisitionContentLabel = 'flechas';
    } else if (weaponType === 'setas' || weaponType === 'virotes') {
        item.equipmentSlot = 'ammunition';
        item.ammunitionType = 'bolt';
        item.acquisitionPackSize = 10;
        item.acquisitionUnitLabel = 'kit';
        item.acquisitionContentLabel = 'setas';
    } else if (item.type === 'weapon' && weaponType === 'arco e flecha') {
        item.rangedWeaponType = description.includes('besta') ? 'crossbow' : 'bow';
        item.requiredAmmunitionType = item.rangedWeaponType === 'crossbow' ? 'bolt' : 'arrow';
    }
});

predefinedItems
    .filter(item => item.category === 'equipment')
    .forEach(item => {
        if (item.type === 'mount-gear') return;
        const officialWeight = PREDEFINED_EQUIPMENT_WEIGHTS[item.id];
        item.weight = Number.isFinite(officialWeight)
            ? officialWeight
            : estimatePredefinedEquipmentWeight(item);
        item.weightSource = Number.isFinite(officialWeight) ? 'rules-sheet' : 'estimated';
    });

function estimatePredefinedInventoryItemWeight(item) {
    const normalized = `${item?.id || ''} ${item?.name || ''} ${item?.type || ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const transportKind = String(item?.transportKind || '').toLowerCase();

    // Estes valores representam o peso próprio do recurso. Montarias e veículos
    // nunca entram na carga pessoal, mas mantêm peso cadastrado para usos futuros.
    if (transportKind === 'mount') return Math.max(250, (Number(item?.hp) || 35) * 10);
    if (transportKind === 'vehicle') return Math.max(150, (Number(item?.capacity) || 100) * 1.5);

    if (item?.id === 'coroa') return 0.01;
    if (item?.category === 'usable') {
        if (item?.careConsumable?.kind === 'food') return 0.5;
        if (item?.careConsumable?.kind === 'drink') return 0.5;
        if (/(bomba|solucao acida|furia de bredan|fogo da zerikania|po de lua|po de dimeritio|bafo de dragao|samun)/.test(normalized)) return 1;
        return 0.1;
    }

    if (item?.category === 'misc') {
        if (/(minerio|ferro|aco|prata|ouro|meteorito|dimeritio|carvao|pedra|cristal)/.test(normalized)) return 1;
        if (/(madeira|couro|ossos|argila|linho|linha|cera|sebo|gordura|carne|cereais|farinha|legumes|batata|cebola|cenoura|ovos|leite|manteiga|sal)/.test(normalized)) return 0.5;
        if (/(agua|alcool|hidromel|vinho|cerveja)/.test(normalized)) return 0.5;
        if (/(folha|petala|raiz|erva|cogumelo|verbena|visco|aconito|ginatia|heleboro|quelidonia|mandragora)/.test(normalized)) return 0.1;
        return 0.25;
    }

    return 0.1;
}

predefinedItems.forEach(item => {
    if (Number.isFinite(Number(item.weight))) {
        if (!item.weightSource) item.weightSource = 'catalog';
        return;
    }
    item.weight = Math.round(estimatePredefinedInventoryItemWeight(item) * 100) / 100;
    item.weightSource = 'estimated';
});
