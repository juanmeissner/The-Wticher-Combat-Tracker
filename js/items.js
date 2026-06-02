// =========================================
// ITENS PRÉ DEFINIDOS
// =========================================

const predefinedItems = [

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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
        description: 'Estanca sangramentos por 2d10 rodadas. Após o tempo, o ferimento volta a sangrar.',
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
        goldValue: 0,
        description: 'Provoca transe eufórico. Serve como anestésico, irá receber apenas metade do dano ao usar e não sofre penalidades relacionadas á dor. Altamente viciante (teste de Resistência ND:20 após cada uso).',
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
        goldValue: 0,
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
        goldValue: 0,
        description: 'Aplicadas em ferimentos, aliviam a dor, reduzindo negativos de ferimentos críticos e de estado próximo da morte em 2. Dura 2d10 rodadas.',
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
        goldValue: 0,
        description: 'Provoca alegria delirante por 2 horas. Usuário sofre -2 em Resistir Coerção.',
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
        goldValue: 0,
        description: 'Teste de Tolerância ND:16. Fracasso causa intoxicação por 1d10 horas.',
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
        description: 'Líquido que torna comidas e bebidas mais apetitosas e realça o cheiro. Aumenta o ND de detectar veneno para 20.',
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
        goldValue: 0,
        description: 'Torna alvos extremamente inflamáveis. 50% de chance de incendiar ao contato com faíscas.',
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
        goldValue: 0,
        description: 'Aumenta a cura de ferimentos e reduz o tempo de recuperação.',
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
        description: 'Role 1d8. Fornece +10 PV mais o resultado do dado em PV temporários até o fim da duração. Não acumula.',
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
        description: 'Sempre que usar um sinal o sinal terá efeito como se tivesse gasto 1d6 pontos em EST extra, podendo ultrapassar os limites dos poderes dos sinais.',
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
        description: 'Role 1d6+3 de dano adicional em ataques físicos.',
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
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
        goldValue: 0,
        description: 'Bloqueia habilidades mágicas de inimigos (Elementais, Magos, Bruxas Sepulcrais) e fecha portais.',
        recipe: [
            'Álcool Anão',
            'Pólvora',
            'Pó de Dimerítio'
        ]
    },

    {
        id: 'bafodedragao',
        name: 'Bafo de Dragão',
        icon: 'https://static.divine-pride.net/images/items/item/22702.png',
        category: 'usable',
        goldValue: 0,
        description: 'Cria fumaça inflamável que causa dano extra com Fogo (Igni).',
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
        goldValue: 0,
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
        description: 'Um Kit com 10 Flechas custa 1 Coroa',
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
        id: 'espadadeacodebruxo',
        name: 'Espada de Prata de Bruxo',
        icon: 'https://static.divine-pride.net/images/items/item/1123.png',
        category: 'equipment',
        goldValue: 2300,
        type: 'weapon',
        weaponType: 'Esgrima',
        damage: '1d6',
        bonus: ' ',
        effect: '3d6 Dano de Prata',
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
        id: 'besta',
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
        id: 'aguaforte',
        name: 'Água-forte',
        icon: 'https://static.divine-pride.net/images/items/item/25783.png',
        category: 'misc',
        goldValue: 0,
        description: 'Liquido',
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
        id: 'mineriodeferro',
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
    }

];