const monsterDatabase = [

    {
        id: 'nilfgaardianraso',
    
        name: 'Soldado Raso Nilfgard',
    
        image: 'https://static.wikia.nocookie.net/witcher_gamepedia/images/6/69/Tw3_cardart_nilfgaard_black_archer_1.png/revision/latest/scale-to-width-down/290?cb=20150909164804',
    
        hp: 35,
    
        threat: 'Alta',
    
        reward: '1 Coroas',
    
        st: 10,
    
        ca: 13,
    
        armor: {
            head: 5,
            torso: 5,
            arm: 5,
            leg: 5
        },
    
        vulnerabilities: [
            'Veneno do Enforcado',
            'Sinal Axi',
            '',
            ''
        ],
    
        abilities: [
            `Soldados Treinados
            Soldados são treinados combatentes. Eles podem usar ataques especiais gastando resistência. Eles também podem fazer Golpes Rápidos ou Golpes Fortes gastando 2 de resistência, conforme uma ação extra.   `
        ],
    
        attacks: [
            'Espada 5d6',
            'Arco Longo 4d6',
            '',
            '',
            ''
        ],
    
        loot: [
            '',
            '',
            ''
        ],
    
        skills: [
            'Curta Distância +8',
    
            'Brigar +8',
    
            'Esquivar/Escapar +7',

            'Arco e Flecha +7',
    
            'Atletismo +7',
    
            'Consciência +10',
    
            'Furtividade +4',
    
            'Sobrevivência no Ermo +8',
    
            'Resistir a Magia +9',
    
            'Tolerância +7',
    
            'Coragem +7'
        ],
    
        speed: '15m',
    
        height: '2.5m',
    
        weight: '80kg',
    
        habitat: 'Nilfgaard',
    
        intelligence: 'Nível Humano',
    
        organization: 'Em grupos pequenos, médios ou grandes',

        superstition: `

        `,
        
        witcherKnowledge: `

        `,
    },

    {
        id: 'nilfgaardianknight',
    
        name: 'Cavaleiro Nilfgardiano',
    
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgSaJGYPcZ5wjUnfsGaHQ6g5CNfapQYHIJlA&s',
    
        hp: 35,
    
        threat: 'Alta/Complexo',
    
        reward: '1 Coroas',
    
        st: 10,
    
        ca: 13,
    
        armor: {
            head: 30,
            torso: 30,
            arm: 30,
            leg: 30
        },
    
        vulnerabilities: [
            'Veneno do Enforcado',
            'Sinal Axi',
            'Golpe Forte',
            ''
        ],
    
        abilities: [
            `Soldados Treinados
            Soldados são treinados combatentes. Eles podem usar ataques especiais gastando resistência. Eles também podem fazer Golpes Rápidos ou Golpes Fortes gastando 2 de resistência, conforme uma ação extra.   `
        ],
    
        attacks: [
            'Espada 5d6',
            '',
            '',
            '',
            ''
        ],
    
        loot: [
            '',
            '',
            ''
        ],
    
        skills: [
            'Curta Distância +12',
    
            'Brigar +12',
    
            'Esquivar/Escapar +10',

            'Bloquear +11',
    
            'Atletismo +7',
    
            'Consciência +10',
    
            'Furtividade +4',
    
            'Sobrevivência no Ermo +8',
    
            'Resistir a Magia +9',
    
            'Tolerância +7',
    
            'Coragem +15'
        ],
    
        speed: '15m',
    
        height: '2.5m',
    
        weight: '80kg',
    
        habitat: 'Nilfgaard',
    
        intelligence: 'Nível Humano',
    
        organization: 'Em grupos pequenos, médios ou grandes',

        superstition: `
Uma vanguarda da cavalaria pesada nilfgaardiana em plena carga é verdadeiramente aterrorizante e eles são alguns dos soldados mais emblemáticos dos exércitos do Império, mais do que páreo para a maioria dos oponentes. Punhal 1 1 Grevas Nilfgaardianas Os Cavaleiros do Império recebem algumas das melhores armaduras e armas produzidas pela humanidade no continente hoje, juntamente com as maiores montarias que Nilfgaard tem a oferecer. Machado Eles são verdadeiros soldados de elite e são usados com moderação no campo de batalha, reservados para quebrar posições-chave ou atacar alvos vitais. Semelhante ao resto da doutrina nilfgaardiana, eles favorecem armaduras e armas pesadas, usando uma abordagem agressiva que depende da força bruta para romper as linhas inimigas. A cavalaria mais leve também é usada, especialmente em manobras de flanco ou para assediar posições inimigas e geralmente é implantada em brigadas maiores do que os cavaleiros mais pesados.
        `,
        
        witcherKnowledge: `
Uma carga de cavalaria bem posicionada pode trazer a vitória da ruína. Porém, uma vanguarda comprometida pode ficar atolada e sobrecarregada se seu alvo não for escolhido com cuidado. As brigadas de cavalaria ligeira são os seus soldados mais responsivos e podem ser rapidamente mobilizadas para combater quaisquer eventos imprevistos, como emboscadas, ou para fornecer rapidamente apoio à pressão em batalhas campais.
        `,
    },

    {
        id: 'nilfgaardianinfantary',
    
        name: 'Infantaria Nilfgardiana',
    
        image: 'https://i.pinimg.com/236x/73/a8/d4/73a8d4c0c9cfbae946d78590494726b4.jpg',
    
        hp: 30,
    
        threat: 'Alta/Complexo',
    
        reward: '1 Coroas',
    
        st: 10,
    
        ca: 13,
    
        armor: {
            head: 16,
            torso: 20,
            arm: 14,
            leg: 14
        },
    
        vulnerabilities: [
            'Veneno do Enforcado',
            'Sinal Axi',
            'Golpe Forte',
            ''
        ],
    
        abilities: [
            `Soldados Treinados
            Soldados são treinados combatentes. Eles podem usar ataques especiais gastando resistência. Eles também podem fazer Golpes Rápidos ou Golpes Fortes gastando 2 de resistência, conforme uma ação extra.   `
        ],
    
        attacks: [
            'Espada 5d6',
            'Besta 4d6+2',
            '',
            '',
            ''
        ],
    
        loot: [
            '',
            '',
            ''
        ],
    
        skills: [
            'Curta Distância +10',
    
            'Brigar +10',
    
            'Esquivar/Escapar +8',

            'Bloquear +10',
    
            'Atletismo +7',
    
            'Consciência +10',
    
            'Furtividade +4',
    
            'Sobrevivência no Ermo +8',
    
            'Resistir a Magia +9',
    
            'Tolerância +7',
    
            'Coragem +15'
        ],
    
        speed: '15m',
    
        height: '2.5m',
    
        weight: '80kg',
    
        habitat: 'Nilfgaard',
    
        intelligence: 'Nível Humano',
    
        organization: 'Em grupos pequenos, médios ou grandes',

        superstition: `
A infantaria pesada é o núcleo da máquina de guerra do Império Nilfgaardiano e é uma das principais razões para o sucesso de seus exércitos (na maior parte) em todas as três Guerras do Norte. Os soldados da infantaria do Império são profissionais, apoiados por oficiais competentes treinados na Academia Militar Markus Braibant. Eles também são bem equipados e abastecidos com equipamentos padronizados produzidos por fábricas e enviados para o front em vastos trens de abastecimento. Tudo nas forças armadas nilfgaardianas gira em torno de disciplina e treinamento. Os membros da infantaria podem esperar ser bem apoiados e abastecidos e, por sua vez, devem seguir as ordens imediatamente e com precisão.
`,
        
        witcherKnowledge: `
O núcleo da infantaria *é* o exército do Império, esses soldados são o elemento mais importante do comandante e devem ser tratados como tal. Uma unidade nunca deve ser posicionada fora do alcance de meios de apoio, como unidades de cavalaria, batedores ou artilharia. 
        `,
    },

    {
        id: 'grifo',
    
        name: 'Grifo',
    
        image: 'https://i.redd.it/i-made-a-griffin-from-the-witcher-3-in-the-style-of-the-v0-9wnnor5vy3hd1.png?width=550&format=png&auto=webp&s=968230af0e4251353e13b5d681e8c718161ad2bd',
    
        hp: 100,
    
        threat: 'Difícil Complexo',
    
        reward: '120 Coroas',
    
        st: 10,
    
        ca: 13,
    
        armor: {
            head: 8,
            torso: 8,
            arm: 8,
            leg: 8
        },
    
        vulnerabilities: [
            'Óleo de Híbrido'
        ],
    
        abilities: [
    
            `Grito Sônico
            Um grifo pode dar a sua vez para soltar um grito que obriga qualquer um dentro de 30m a fazer um teste de resistência a Medo ND: 14.`,
    
            `Investida
            Se um alvo se move a mais de 30m de distância do grifo, ele pode investir e fazer um poderoso ataque, causando 10d6 de dano e jogando o alvo para trás 8 quadrados.`,
    
            `Selvagem
            Para os propósitos de Consciência e Sobrevivência no Ermo, o instinto lhe dá uma INT de 8.`,
    
            `Voar
            Um grifo pode voar como movimento. Só pode ser derrubado do ar ao ser atordoado ou sofrer mais de 25 de dano em um único ataque.`,
    
            `Visão Noturna
            Permanece em áreas de pouca luz sem penalidades.`,
    
            `Predador Aéreo
            Inimigos sofrem desvantagem para bloquear seus ataques.`
        ],
    
        attacks: [
    
            'Garras 6d6 (Sangramento CD 15)',
    
            'Mordida 7d6 (Sangramento CD 15)',
    
            'Investida Aérea 10d6',
    
            '',
    
            ''
        ],
    
        loot: [
    
            'Pena de Grifo (1d10)',
    
            'Ovo de Grifo 1x (ND: 16)',
    
            'Pó Infundido (1d6 / 2)'
        ],
    
        skills: [
    
            'Curta Distância +10',
    
            'Brigar +10',
    
            'Esquivar/Escapar +7',
    
            'Atletismo +7',
    
            'Consciência +10',
    
            'Furtividade +4',
    
            'Sobrevivência no Ermo +8',
    
            'Resistir a Magia +9',
    
            'Tolerância +7',
    
            'Coragem +15'
        ],
    
        speed: `6 Terrestre
    12 Voando`,
    
        height: 'Cerca de 2 metros até o ombro',
    
        weight: 'Em torno de 907 kg',
    
        habitat: 'Altas montanhas e penhascos',
    
        intelligence: 'Tão inteligente quanto um cachorro',
    
        organization: 'Solitário ou em pares',

        superstition: `
Você pode imaginar um ser mais majestoso do que um grifo? Heh! Isso é um pensamento perigoso. A maioria dos nobres pensa em grifos como bestas majestosas que você coloca em tabardos e heráldica e tudo mais. Heh! Fazendeiros, por outro lado, morrem de medo deles. O que você vai fazer quando uma bola de pelo de 900 quilos, penas e garras pousar em seu campo e pegar sua vaca? Nada, não é? A maioria das pessoas comuns não fala muito sobre grifos. Para não atraí-los.
        `,
        
        witcherKnowledge: `
Grifos são tecnicamente criaturas muito simples. Eles operam muito como uma combinação entre os dois animais que os compõem: leões e águias. Infelizmente, combinar leões e águias cria um super predador. Grifos são rápidos no chão e rápidos no céu. Eles podem atravessar grandes áreas de terreno difícil voando sobre ele e avistar presas se escondendo, com os olhos de águia. Isso sem levar em conta como eles capturam alvos do tamanho de um cavalo e o soltam de 100 metros no ar. Felizmente, os grifos apenas atacam intrusos em seu território. O problema é que, com a guerra deixando cadáveres por todos os campos e vales abertos, os grifos estão movendo seus territórios das altas montanhas para os picos mais baixos. De repente, pequenas aldeias no sopé das montanhas são um território de grifo, mesmo sem perceber. Se você tiver que lutar contra um grifo, faça um favor e estoque munição de longo alcance e óleo de híbrido. Você precisará da munição porque os grifos gostam de atacar do ar. Um golpe direto com um virote de besta, lança, flecha ou outra arma de longo alcance força o grifo a se reajustar no ar. Se falhar, cairá no chão, sofrerá danos e será mais vulnerável. No chão você tem que tomar cuidado com as garras afiadas. Elas não apenas rasgam, mas deixam grandes ferimentos com sangramentos. Se você se distanciar demais de um grifo, ele encurtará essa distância com uma investida: um ataque tremendamente poderoso, mas impreciso, mais fácil de se esquivar do que os ataques de garras normais. Mas um golpe certeiro desse significa a morte para um homem comum. A última coisa a observar é o grito sônico do grifo. Falhe em resistir a isso e você será uma presa fácil.
        `,
    },

    {
        id: 'drowner',
    
        name: 'Afogador',
    
        image: '',
    
        hp: 25,
    
        threat: 'Simples',
    
        reward: '1 Coroa',
    
        st: 8,
    
        ca: 12,
    

    
        vulnerabilities: [
            'Óleo de Necrófago',
            'Fogo'
        ],
    
        abilities: [
            'Selvagem — Para Consciência e Sobrevivência no Ermo, possui INT 7.',
            'Imunidade a Veneno — Afogadores são imunes a venenos.',
            'Anfíbio — Pode viver indefinidamente debaixo d’água sem penalidades.',
            'Mente Impenetrável — Imune a magias que afetam pensamentos e emoções.'
        ],
    
        attacks: [
            'Garras 3d6',
            '',
            '',
            '',
            ''
        ],
    
        loot: [
            'Cérebro de Afogador',
            'Língua de Afogador',
            'Essência da Água (1d6/2)'
        ],
    
        skills: [
            'Curta Distância +6',
            'Brigar +6',
            'Esquivar/Escapar +5',
            'Atletismo +6',
            'Consciência +8',
            'Furtividade +5',
            'Sobrevivência no Ermo +6',
            'Resistir a Magia +4',
            'Tolerância +6',
            'Coragem +15'
        ],
    
        speed: '6m',
    
        height: 'Altura humana comum',
    
        weight: 'Peso humano comum',
    
        habitat: 'Rios, lagos ou litoral',
    
        intelligence: 'Tão inteligente quanto um peixe',
    
        organization: 'Grupos de 3 a 6',

        superstition: `
O povo comum não sabe muito sobre os afogadores. Contos de velhas esposas dizem que quando um filho da puta malvado morre e seu cadáver acaba em um rio ou lago, ele volta como um afogador. Afogadores são bestas estúpidas que vivem para afogar bastardos azarados e se alimentam de seus cadáveres. Eles não são a fera mais perigosa do mundo, mas eles se juntam e te atacam. Se você vir um afogado, provavelmente há mais dois ou três escondidos na água.
        `,
        
        witcherKnowledge: `
Na verdade, os afogadores não são malfeitores ressuscitados. A maioria das pessoas pensa assim, graças a histórias folclóricas e livros populares sobre o tema dos monstros. Afogadores, como todos os necrófagos, são criaturas de outro plano que vieram para este reino durante a Conjunção das Esferas muitos séculos atrás. Com nenhum nicho ecológico aqui, eles se tornaram uma praga sobre a terra. Afogadores preferem litoral, rios e áreas pantanosas. Eles são anfíbios e passam a maior parte do tempo na água. Quando eles saem, geralmente é para seguir seus estômagos: pegar algo perto da beira da água ou procurar comida em terra. Quando encontram algo para comer, saltam em uma enxurrada de garras, atacando em grupo e cercando sua presa. Um grande grupo de afogadores pode ser infernal para lidar. Eles dominam uma única pessoa atacando com força e de todas as direções. Eles são imunes a veneno devido às águas horríveis, turvas e tóxicas com que eles estão acostumados, e leva um pouco para desencorajá-los. No entanto, eles também são estupidamente burros. Os poucos estudos de afogadores concordam que eles são tão inteligentes quanto um peixe predatório. Eles agem completamente por instinto, não podem, de forma alguma, argumentar e são imunes a feitiços que os afetam mental ou emocionalmente. Isso significa que eles nunca formulam planos mais complexos do que “ataques” e podem se distrair com coisas suficientemente brilhantes, desde que não provem o sangue. Os afogadores também são altamente suscetíveis a fogo, é sua melhor arma. Sendo tremendamente burro, um afogador continuará a lutar enquanto estiver em chamas e não tentará se extinguir até quase estar morto (abaixo de 10 PV).
        `,
    
    },
    
    {
        id: 'ghoul',
    
        name: 'Carniçal',
    
        image: '',
    
        hp: 35,
    
        threat: 'Fácil / Perigoso',
    
        reward: '3 Coroas',
    
        st: 10,
    
        ca: 13,
    
        armor: {
            head: 2,
            torso: 2,
            arm: 2,
            leg: 2
        },
    
        vulnerabilities: [
            'Óleo de Necrófago',
            'Fogo'
        ],
    
        abilities: [
            'Saltar — Não precisa tomar impulso para saltar.',
            'Fúria — Abaixo de 10 PV regenera 3 PV por rodada e ganha ações agressivas.',
            'Visão Noturna — Ignora penalidades em pouca luz.',
            'Selvagem — Sempre que um Carniçal rolar um ataque ou esquiva com vantagem ganha 12 de bonus total.'
        ],
    
        attacks: [
            'Garras 3d6',
            'Mordida 3d6 + 2 Sangramento (CD 15)',
            '',
            '',
            ''
        ],
    
        loot: [
            'Medula de Carniçal (1d6/2)',
            'Garras de Carniçal (2)',
            'Extrato de Veneno (1d6/2)'
        ],
    
        skills: [
            'Curta Distância +8',
            'Brigar +8',
            'Esquivar/Escapar +8',
            'Atletismo +7',
            'Consciência +7',
            'Furtividade +4',
            'Sobrevivência no Ermo +6',
            'Resistir a Magia +4',
            'Tolerância +6',
            'Coragem +15'
        ],
    
        speed: '6m',
    
        height: 'Cerca de 1,25 metros no ombro',
    
        weight: 'Em torno de 86kg',
    
        habitat: 'Campos de batalha e cemitérios',
    
        intelligence: 'Tão inteligente quanto um cachorro',
    
        organization: 'Grupos de 3 a 6',

        superstition: `
Você vê muitos carniçais ao norte hoje em dia. Heh! Eu me lembro de quando você poderia passar a vida inteira sem ver um. Mas com todos os cadáveres apodrecendo nos campos e todo o sangue transbordando em rios e vales, carniçais estão aparecendo por toda parte. A maioria das pessoas presume que são cadáveres, transformados e reanimados por magia. Demônios podres que se alimentam dos mortos e atacam qualquer pessoa que se aproxime. Viajam em grupo e atacam como lobos, circulando suas presas, atacando e mantendo o alvo confuso.
        `,
        
        witcherKnowledge: `
Muito parecido com outros necrófagos, pessoas comuns acham que carniçais são cadáveres reanimados. Eles são na verdade de uma espécie de outra dimensão que age muito como outros animais. Carniçais são catadores que se alimentam de cadáveres deixados para trás em campos de batalha, apesar de atacarem presas frescas, se passarem perto. Você geralmente encontra carniçais em pequenos grupos que muitas vezes brigam por comida quando o perigo já passou. Quando lutar com carniçais, sempre fique de olho nas suas costas. Eles vão atacar juntos e tentar cercá-lo, desequilibrando os seus ataques para flanquear e voltar correndo. Tente atrair um carniçal por vez, para reduzir o número de carniçais atacando. Tenha em mente que carniçais podem saltar a partir de 5m de distância. Pequenos buracos, paredes baixas e similares são muito menos eficazes contra carniçais do que seus irmãos necrófagos lentos. Quando em combates a curta distância, um carniçal golpeia com suas garras, mas se ele agarrar um alvo (ou se o alvo estiver impedido por alguma razão) pode mordê-lo para causar um ferimento com sangramento. Se você derrubar um carniçal abaixo de 10 Pontos de Vida, ele ficará furioso. Nesta fúria o carniçal ataca e suas feridas se fecham rapidamente. Mate o carniçal rapidamente para evitar que ele regenere sua Vitalidade. Também é vital se reposicionar para que os carniçais não consigam se juntar e ganhar bônus no ataque. Se você está lutando em um grupo, fique de costas um para o outro para que os carniçais não te atinja facilmente por trás. Se você precisar atrair um grupo de carniçais de uma área, é melhor começar exumando todos os corpos enterrados. Uma vez exumados, os corpos devem ser movidos para afastar os carniçais.
        `,
    },
    
    {
        id: 'lamia',
    
        name: 'Alpor / Lâmia',
    
        image: '',
    
        hp: 70,
    
        threat: 'Difícil',
    
        reward: '100 Coroas',
    
        st: 10,
    
        ca: 13,
    
    
        vulnerabilities: [
            'Óleo de Vampiro',
            'Poção de Sangue Negro',
            'Substâncias do sangue que bebe'
        ],
    
        abilities: [
            'Regeneração — Recupera 5 PV por rodada.',
            'Ataques Rápidos — Sempre realiza dois ataques.',
            'Ilusão — Pode assumir forma de mulher, gato ou lobo.',
            'Visão Noturna — Ignora penalidades em pouca luz.',
            'Saliva Atordoante — Mordida pode atordoar (CD 15).'
        ],
    
        attacks: [
            'Garras 5d6',
            'Mordida 2d6 Sangramento (CD 15) + Saliva Atordoante',
            'Grito Supersônico — Atordoamento e chance de derrubar (CD 18)',
            '',
            ''
        ],
    
        loot: [
            'Dente de Vampiro',
            'Saliva Atordoante',
            'Sangue de Vampiro'
        ],
    
        skills: [
            'Atletismo +12',
            'Conscientização +8',
            'Briga +12',
            'Carisma +9',
            'Coragem +6',
            'Engano +10',
            'Esquivar/Escapar +12',
            'Percepção Humana +8',
            'Intimidar +4',
            'Corpo a Corpo +12',
            'Resistir à Coerção +9',
            'Resistir à Magia +9',
            'Sedução +12',
            'Furtividade +9'
        ],
    
        speed: '10m',
    
        height: '1,50m a 1,70m',
    
        weight: '55kg a 70kg',
    
        habitat: 'Casas abandonadas, cavernas e assentamentos humanos',
    
        intelligence: 'Nível humano',
    
        organization: 'Solitário',

        superstition: `
Quase nenhum outro monstro inspira tantas histórias quanto o Alpe. Este demônio súcubo pode se transformar em um cachorro preto ou em um sapo venenoso. Os contos contam que eles são lascivos e inclinada a seduzir jovens bonitos, esforçando-se para descrever seu charme e suas vozes belas e sedutoras, bem como sua aversão às virgens. Eles se movem sem barulho e não podem ser tocados pelo vento, nem pela luz solar, pois queima sua pele. Eles também têm uma aversão terrível a gatos.
        `,
        
        witcherKnowledge: `
As Alpor são vampiros que lembram bruxas na aparência. Eles são chamados de fantasmas por alguns, um nome que se ajusta bastante bem, pois, como fantasmas, eles assombram e atormentam os homens, tomando na forma de uma mulher, embora também possam aparecer como animais. Os Alpes são mais frequentemente encontrados rondando perto de aldeias, atacando à noite e são mais ativos quando a lua está cheia. A saliva dos Alpes é um anestésico poderoso e, quando aplicada a um homem adormecido, pode provocar pesadelos horríveis. Alguns sugerem que são a causa de lendas sobre homens que dormem saudáveis e são encontrados pela manhã brancos como a neve, sem uma gota de sangue nas veias. Em combate, os Alpes exibem velocidade sobrenatural e resistência incrível (até mesmo para os padrões dos vampiros). É preciso apontar a espada com grande precisão, pois os Alpes são inigualáveis na arte de evitar golpes. O Sinal Yrden é recomendado porque desacelera o Alp, enfraquecendo seu defesas. Outra estratégia é beber a poção Black Blood, pois os alpes sugam o sangue de suas vítimas para privá-las de forças e regenerar seus próprios poderes. Golden Oriole também pode ser inestimável no fornecimento de imunidade contra a saliva que induz o sono. Ao contrário das bruxas, os Alpes não podem ficar invisíveis, mas, como as bruxas, eles emitem um ruído estridente cuja onda de choque pode incapacitar. Seu maior trunfo é a agilidade e eles podem saltar com uma leveza misteriosa que parece beirar o poder do vôo. Quando na forma humana, eles se misturam facilmente com a comunidade circundante, o que os torna realmente muito perigosos e suas formas animais os ajudam a se misturar onde os humanos seriam muito visíveis.
        `,

    },
    
    {
        id: 'witch',
    
        name: 'Bruxa Sepulcral',
    
        image: '',
    
        hp: 60,
    
        threat: 'Médio / Complexo',
    
        reward: '50 Coroas',
    
        st: 10,
    
        ca: 13,
    
    
        vulnerabilities: [
            'Óleo de Necrófago',
            'Língua Chicote'
        ],
    
        abilities: [
            'Círculo da Caveira — Recebe +3 em ações dentro da área.',
            'Comandar Mortos-Vivos — Controla necrófagos próximos.',
            'Visão Noturna — Ignora penalidades em pouca luz.'
        ],
    
        attacks: [
            'Garras 5d6 Sangramento (CD 15)',
            'Mordida 6d6 Veneno (CD 15)',
            'Língua 3d6 +2 Veneno (CD 16)',
            '',
            ''
        ],
    
        loot: [
            'Orelha da Bruxa Sepulcral (2)',
            'Dentes de Bruxa (1d6/2)',
            'Extrato de Veneno (1d6)',
            'Runa Aleatória',
            'Posses Estranhas (1d6)'
        ],
    
        skills: [
            'Curta Distância +10',
            'Brigar +10',
            'Lançar Feitiços +12',
            'Esquivar/Escapar +8',
            'Atletismo +6',
            'Consciência +8',
            'Furtividade +8',
            'Sobrevivência no Ermo +6',
            'Resistir a Magia +10',
            'Resistir a Coerção +10',
            'Tolerância +7',
            'Coragem +9'
        ],
    
        speed: '8m',
    
        height: '1,75 metros',
    
        weight: '80kg',
    
        habitat: 'Cemitérios ou cavernas',
    
        intelligence: 'Nível humano',
    
        organization: 'Solitário',

        superstition: `
Honestamente, filhos da puta comuns não sabem muito sobre bruxas sepulcrais. Heh! Elas são pesadelos inteligentes o suficiente para conversar, montar armadilhas e atrair crianças. Ouvi dizer que bruxas são o que acontece quando um mago perde o controle. Heh! Duvido disso, mas pode ser ... quem sabe. As bruxas são um dos poucos monstros de que eu já ouvi falar que poderiam usar magia. Ou pelo menos algo assim.
        `,
        
        witcherKnowledge: `
As Bruxas Sepulcrais são um dos poucos necrófagos totalmente sencientes, o que as torna muito perigosas. As bruxas sepulcrais não têm nada a ver com magos. Embora tenham magia, as bruxas sepulcrais são apenas mais uma raça necrófaga da Conjunção das Esferas. Curiosamente, as bruxas sepulcrais são exclusivamente femininas, uma bruxa macho nunca foi vista. A maioria dos livros afirma que as bruxas, como alguns monstros, roubam garotinhas de vilarejos para as transformarem em novas bruxas. Alguns, no entanto, sugerem que as bruxas não são realmente femininas como tais, mas hermafroditas. O que sabemos é que as bruxas são predadores de emboscada que vivem perto de cemitérios e outras fontes de cadáveres podres. Elas estão perfeitamente contentes em comer carniça, mas atacarão presas frescas se tiverem a chance. Quando no ataque, uma bruxa sepulcral vai encurtar a distância a uma velocidade tremenda e atacar com suas garras em forma de foice. Se o alvo recuar para se recuperar, a bruxa vai usar sua língua venenosa como um chicote farpado para enfraquecer a presa. A língua da bruxa pode ser cortada com um golpe bem-sucedido com uma arma branca. As formas mais seguras de atacar uma bruxa sepulcral são manter a distância ou estocar com óleo de necrófago e aproximar-se com uma magia de proteção ou com o Sinal de Quen. As Bruxas Sepulcrais podem ser raciocinais, mas são incrivelmente teimosas e propensas a atacar imediatamente. Se você precisa lutar contra uma bruxa em sua casa, verifique primeiro se há um círculo mágico da caveira ou outros necrófagos que estejam curvados à sua vontade. Lide com eles primeiro, se puder.
        `,

    },
    {
        id: 'werewolf',
    
        name: 'Lobisomem',
    
        image: 'https://static.wikia.nocookie.net/witcher/images/4/46/Tw3_cardart_monsters_werewolf.png/revision/latest/scale-to-width-down/250?cb=20170425203100',
    
        hp: 60,
    
        threat: 'Médio / Complexo',
    
        reward: '50 Coroas',
    
        st: 10,
    
        ca: 14,
    
        armor: {
            head: 8,
            torso: 8,
            arm: 8,
            leg: 8
        },
    
        vulnerabilities: [
            'Óleo Amaldiçoado',
            'Bombas de Pó de Lua',
            'Dano de prata impede regeneração'
        ],
    
        abilities: [
            'Regeneração — Recupera 10 PV por rodada.',
            'Rastrear pelo Cheiro — Pode rastrear sem pistas visuais.',
            'Visão Noturna — Ignora penalidades em pouca luz.',
            'Transformação — 30% de chance de transformação noturna; 100% em lua cheia.'
        ],
    
        attacks: [
            'Garras 4d6 + Brigar',
            'Morder 5d6 + Brigar',
            'Uivo de Lobisomem (CD 18 Medo)',
            '',
            ''
        ],
    
        loot: [
            'Pele de Lobisomem',
            'Saliva de Lobisomem (1d6)',
            'Itens Aleatórios (1d6)'
        ],
    
        skills: [
            'Curta Distância +12',
            'Brigar +12',
            'Esquivar/Escapar +12',
            'Atletismo +8',
            'Consciência +10',
            'Furtividade +9',
            'Sobrevivência no Ermo +9',
            'Resistir a Magia +9',
            'Resistir a Coerção +10',
            'Tolerância +8',
            'Coragem +10'
        ],
    
        speed: '9m',
    
        height: '2,5 metros',
    
        weight: '136kg',
    
        habitat: 'Florestas ou perto de povoados',
    
        intelligence: 'Nível humano',
    
        organization: 'Solitário',

        superstition: `
As lendas dizem que são como pessoas normais até o luar brilhar sobre eles e se transformarem em horríveis monstros irracionais. Eles não fazem nada além de comer carne e beber sangue a noite toda até o sol nascer, quando se transformam de volta. Pior de tudo, se você for mordido, você está fadado a se transformar. Algumas pessoas acham que você pode curar um lobisomem forçando o lobisomem a beber um chá de lobo três vezes por dia durante cinco dias. Outros acreditam que você pode curá-lo apenas exaurindo o lobisomem e depois repreendendo-o. Eu prefiro usar minha besta.
        `,
        
        witcherKnowledge: `
Os lobisomens são feras perigosas e horripilantes que podem permanecer adormecidas dentro de pessoas totalmente razoáveis. Essas feras enormes parecem um cruzamento entre humanos e lobos gigantescos. Eles são monstros impiedosos sem empatia e com uma poderosa sede de sangue. A pior parte dessas feras amaldiçoadas é que elas surgem de pessoas comuns. Lobisomens manifestam toda a crueldade e más intenções da pessoa amaldiçoada. Quando uma pessoa se transforma em um lobisomem, geralmente um processo iniciado pelo surgimento da lua, eles perdem todos os fragmentos de sua humanidade e são deixados apenas com sua inteligência e seus piores e mais viciosos impulsos. Estas bestas são muito difíceis de combater, devido à sua inteligência inata e habilidades regenerativas, que apenas uma bomba Pó de Lua pode parar. Felizmente, é necessária uma maldição para criar um lobisomem, ser mordido por um lobisomem significa apenas que você irá sangrar copiosamente. Se você se encontrar lutando contra um lobisomem, ignore todas as “curas” camponesas inúteis e encontre uma lâmina de prata. Concentrese em desviar dos ataques do lobisomem e contra-ataque com sua lâmina de prata ou feitiços mágicos. Correr de um lobisomem é desaconselhável, eles são muito rápidos e podem rastreá-lo através das condições mais adversas apenas pelo cheiro. Se um amigo sofreu de licantropia, é uma boa ideia amarrá-lo à noite até que você possa acabar com a maldição. Embora possa ser difícil determinar quais ações levaram a qualquer caso de licantropia, você pode restringi-lo. A licantropia é frequentemente uma punição por ações violentas e bestiais. Remover a maldição geralmente requer muita dor e perda pessoal.
        `,

    },
    
    {
        id: 'siren',
    
        name: 'Sereia',
    
        image: 'https://static.wikia.nocookie.net/witcher/images/9/96/Gwent_cardart_skellige_deafening_siren.jpg/revision/latest/scale-to-width-down/250?cb=20211026001142',
    
        hp: 35,
    
        threat: 'Fácil / Complexo',
    
        reward: '2 Coroas',
    
        st: 7,
    
        ca: 13,
    
    
        vulnerabilities: [
            'Óleo de Híbrido'
        ],
    
        abilities: [
            'Ilusão — Assume aparência de mulher bela.',
            'Grito Sônico — Atordoa criaturas em 10m.',
            'Anfíbio — Vive indefinidamente debaixo d’água.',
            'Voar — Pode voar e cair caso seja atordoada.'
        ],
    
        attacks: [
            'Garras 2d6+2',
            'Cauda 3d6+2',
            '',
            '',
            ''
        ],
    
        loot: [
            'Cordas Vocais de Sereia',
            'Essência da Água (1d6)',
            'Itens Comuns (1d6/3)'
        ],
    
        skills: [
            'Curta Distância +7',
            'Brigar +7',
            'Esquivar/Escapar +6',
            'Atletismo +8',
            'Consciência +7',
            'Furtividade +8',
            'Sobrevivência no Ermo +7',
            'Resistir a Magia +6',
            'Resistir a Coerção +6',
            'Tolerância +6',
            'Coragem +5'
        ],
    
        speed: '8m',
    
        height: '3 metros de comprimento',
    
        weight: '120kg',
    
        habitat: 'Mares e litorais',
    
        intelligence: 'Nível humano',
    
        organization: 'Grupos de 3 a 6',

        superstition: `
Sereias são uma história triste. Costumavam ser mulheres bonitas com rabos como peixe e um interesse especial em marinheiros, heh! Porém, aquele tempo se passou. Hoje em dia, uma sereia prefere te esnobar do que beijar, é melhor manter isso em mente. Ninguém sabe por quê, mas provavelmente tem a ver com marinheiros raptando sereias para serem suas esposas. Hoje elas atraem as pessoas com suas músicas, e depois se transformam em monstros horríveis e rasgam a carne de seus ossos. Os marinheiros dizem que se você quer passar pelas sereias no mar, você deve amarrar-se ao mastro para impedir-se de saltar sobre a borda para ir até elas.
        `,
        
        witcherKnowledge: `
Não se amarre ao mastro. Você vai ter uma morte horrível. Ao contrário da crença popular, as sereias não têm magia para obrigar os homens a pular na água e nadar até elas. Elas só podem esconder suas características horripilantes de peixe sob a pele de belas jovens e isso aparentemente é o suficiente para excitados marinheiros que estiveram no mar por mais de ano. Não, uma sereia atrai um navio para perto com um disfarce atraente e, em seguida, salta no ar em asas escamosas para atacar sua presa. Como você pode imaginar, se amarrar ao mastro pode ser uma má ideia. Uma sereia descerá do alto, balançando suas garras (ou a cauda se estiver confiante) antes de subir novamente. Algumas tentarão derrubá-lo na água, onde suas irmãs podem despedaçálo melhor. Infelizmente, as sereias no ar ou na água são muito rápidas e muito ágeis, tornando-as difíceis de capturar ou atacar. Felizmente você pode matar uma sereia no ar com um golpe de arma direto. Neste momento a sereia é incrivelmente vulnerável e geralmente pode ser eliminada por dois homens com armas resistentes. Tecnicamente, as sereias são inteligentes e capazes de pensar e serem diplomatas. Mesmo assim, elas não estão interessadas nisso, elas veem todas as não-sereias como presas. Não é totalmente inédito encontrar uma sereia disposta a falar com você. Nesse caso, seja muito cauteloso: pode estar tentando atraí-lo para uma armadilha. Ainda assim, contos de velhas esposas persistem que as sereias eram amigáveis. É difícil dizer se esses contos se referem às sereias que encontramos na costa agora ou a uma raça que (como muitas outras) foi eliminada nas inúmeras guerras raciais.
        `,

    },
    
    {
        id: 'forestdemon',
    
        name: 'Demônio da Floresta',
    
        image: 'https://static.wikia.nocookie.net/witcher/images/e/eb/Gwent_cardart_monsters_fiend.jpg/revision/latest?cb=20190922191145',
    
        hp: 110,
    
        threat: 'Difícil / Perigoso',
    
        reward: '150 Coroas',
    
        st: 14,
    
        ca: 15,
    
        armor: {
            head: 10,
            torso: 10,
            arm: 10,
            leg: 10
        },
    
        vulnerabilities: [
            'Óleo de Relicto',
            'Bombas de Pó de Lua',
            'Audição Sensível'
        ],
    
        abilities: [
            'Regeneração — Recupera 20 PV por rodada.',
            'Investida — Ataque devastador de chifres causando 10d6.',
            'Massa Maciça — Imune a Aard e efeitos de derrubar.',
            'Hipnose — Inimigos sofrem penalidades por 5 rodadas. (Resistir Magia ND: 18)',
            'Selvagem — INT equivalente a 8.',
            'Desvantagem para bloquear seus ataques.'
        ],
    
        attacks: [
            'Garras 6d6+2',
            'Mordida 7d6 Sangramento (CD 15)',
            'Chifres 8d6',
            'Investida 10d6',
            ''
        ],
    
        loot: [
            'Olhos de Demônio (3)',
            'Quintessência (1d10)',
            'Bosta de Demônio (1d6)'
        ],
    
        skills: [
            'Brigar +12',
            'Bloquear +12',
            'Lançar Feitiços +12',
            'Curta Distância +12',
            'Esquivar/Escapar +8',
            'Atletismo +5',
            'Consciência +10',
            'Furtividade +1',
            'Sobrevivência no Ermo +6',
            'Resistir a Magia +10',
            'Tolerância +7',
            'Coragem +10',
            'Físico +10'
        ],
    
        speed: '7m',
    
        height: '4 metros',
    
        weight: '1500kg',
    
        habitat: 'Áreas remotas no ermo',
    
        intelligence: 'Tão inteligente quanto um cachorro',
    
        organization: 'Solitário',

        superstition: `

        `,
        
        witcherKnowledge: `

        `,
    },

    {
        id: 'umbrenato',
    
        name: 'Umbrenato',
    
        image: '',
    
        hp: 180,
    
        threat: 'Difícil / Mortal',
    
        reward: '400 Coroas',
    
        st: 28,
    
        ca: 17,
    
        armor: {
            head: 12,
            torso: 14,
            arm: 10,
            leg: 10
        },
    
        vulnerabilities: [
            'Óleo de Amaldiçoado',
            'Fogo',
            'Yrden'
        ],
    
        abilities: [
            'Nascimento Profano — Surge quando uma mulher grávida sofre violência extrema e morre sem receber sepultamento adequado junto de seu filho.',
            'Névoa Uterina — Como ação, expele uma névoa densa pela boca e pelo cordão umbilical. Criaturas a até 20m sofrem -4 em Consciência, Percepção, e Perícias relacionadas á batalha.',
            'Sufocamento — Criaturas vivas dentro da névoa devem passar em Tolerância (ND 16) ou ficam Atordoados com a Névoa.',
            'Grito do Não-Nascido — Um grito que mistura o choro de um bebê e o desespero de uma mulher moribunda. Coragem (ND 18) ou a vítima fica Amedrontada por 1d6 rodadas.',
            'Predador Noturno — Recebe +3 em Furtividade e Consciência durante a noite.',
            'Ódio Herdado — Contra homens recebe +2d6 de dano em todos os ataques.'
        ],
    
        attacks: [
            'Garras 6d6',
            'Mordida 7d6 Sangramento (ND 16)',
            'Cordão Umbilical 2d6 Agarrar (Alcance 8m)',
            'Dilacerar 8d6 (alvo agarrado)',
            'Grito do Não-Nascido',
            'Névoa Uterina'
        ],
    
        loot: [
            'Cordão Umbilical Amaldiçoado (1)',
            'Essência Espectral (1d6)',
            'Sangue Profano (1d6)',
            'Mutagênico Vermelho (1d6/2)'
        ],
    
        skills: [
            'Brigar +14',
            'Bloquear +12',
            'Esquivar/Escapar +12',
            'Atletismo +12',
            'Consciência +14',
            'Furtividade +14',
            'Sobrevivência no Ermo +10',
            'Resistir a Magia +15',
            'Tolerância +14',
            'Coragem +14',
            'Físico +14'
        ],
    
        speed: '10m',
    
        height: '3 metros',
    
        weight: '800kg',
    
        habitat: 'Cemitérios abandonados, campos de batalha, florestas e locais de tragédias',
    
        intelligence: 'Tão inteligente quanto um lobo',
    
        organization: 'Solitário',
    
        superstition: `
    
        "Dizem que quando uma mulher grávida é enterrada sem nome e sem oração, algo continua crescendo debaixo da terra."
    
        Camponeses contam histórias de uma criatura que vaga por estradas envolta em névoa. Alguns juram ouvir um bebê chorando antes de desaparecerem. Outros dizem que a criatura caça homens violentos e estupradores, deixando apenas pedaços dos corpos para trás.
    
        Muitos acreditam que a névoa do Umbrenato é o último suspiro da mãe que nunca encontrou descanso.
    
        `,
    
        witcherKnowledge: `
    
        Umbrenatos são amaldiçoados extremamente raros, nascidos da combinação de morte violenta, sofrimento e sepultamento inadequado. Apesar de sua aparência monstruosa, eles não são simples necrófagos. Possuem um instinto sobrenatural guiado pela dor e pelo ressentimento herdado de sua origem.
    
        A característica mais perigosa da criatura é o cordão umbilical mutado que emerge de seu abdômen. A extremidade desenvolve uma boca própria repleta de dentes, capaz de agarrar presas a vários metros de distância e arrastá-las para perto.
    
        Seu grito causa terror até mesmo em veteranos de guerra, enquanto a névoa que expele pode sufocar grupos inteiros de viajantes.
    
        Yrden enfraquece a névoa e reduz sua velocidade. Fogo provoca dor extrema na criatura e impede que regenere tecidos danificados.
    
        A única forma garantida de impedir o retorno de um Umbrenato é localizar os restos mortais da mãe e da criança e conceder-lhes um funeral apropriado.
    
        `,
    },
    
    
    ];