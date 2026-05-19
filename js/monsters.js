function openMonsterChoiceModal() {

    document.getElementById('monsterChoiceModal').style.display =
        'flex';
}

// Renderiza emoji OU imagem automaticamente
function renderIcon(icon) {

    if (
        icon.startsWith('http://') ||
        icon.startsWith('https://') ||
        icon.startsWith('./') ||
        icon.startsWith('../')
    ) {

        return `
            <img
                src="${icon}"
                class="w-5 h-5 inline-block object-contain"
            >
        `;
    }

    return `<span>${icon}</span>`;
}


// ÍCONES GLOBAIS DO SISTEMA
const UI_ICONS = {

    armor: {
        head: '',
        torso: '',
        arm: '',
        leg: ''
    },

    details: {
        height: '📏',
        weight: '⚖️',
        habitat: '🌲',
        intelligence: '🧠',
        organization: '👥',
        speed: '💨'
    },

    vulnerability: '☠️',

    ability: '✨',

    attack: '⚔️',

    loot: '💰',

    skill: '🎯'
};

function closeMonsterChoiceModal() {

    document.getElementById('monsterChoiceModal').style.display =
        'none';
}

function closeMonsterDetailsModal() {

    document.getElementById(
        'monsterDetailsModal'
    ).style.display = 'none';
}

function openPresetMonsterModal() {

    closeMonsterChoiceModal();

    document.getElementById(
        'presetMonsterModal'
    ).style.display = 'flex';

    document.getElementById(
        'monsterSearchInput'
    ).value = '';

    filterPresetMonsters();
}

function closePresetMonsterModal() {

    document.getElementById('presetMonsterModal').style.display =
        'none';
}

function filterPresetMonsters() {

    const search =
        document.getElementById(
            'monsterSearchInput'
        ).value.toLowerCase();

    const container =
        document.getElementById(
            'presetMonsterList'
        );

    container.innerHTML = '';

    const filtered =
        monsterDatabase.filter(monster =>

            monster.name
                .toLowerCase()
                .includes(search)
        );

    filtered.forEach(monster => {

        container.innerHTML += `

        <button
    
            onclick="showMonsterDetails('${monster.id}')"
    
            class="p-4
                   rounded-2xl
                   bg-red-900/30
                   border
                   border-red-800/40
                   hover:bg-red-800/40
                   transition-all
                   text-left">
    
            <div class="flex items-center gap-4">
    
                <img
    
                    src="${monster.image}"
    
                    class="w-20
                           h-20
                           rounded-xl
                           object-cover
                           border
                           border-red-700/40">
    
                <div class="flex-1">
    
                    <div class="font-bold text-lg text-white">
    
                        ${monster.name}
    
                    </div>
    
                    <div class="text-sm text-red-300 mt-1">
    
                        HP ${monster.hp}
                        •
                        Ameaça ${monster.threat}
    
                    </div>
    
                    <div class="text-sm text-slate-400 mt-2">
    
                        ${monster.habitat}
    
                    </div>
    
                </div>
    
            </div>
    
        </button>
    `;
    });
}

function toggleMonsterLore(type) {

    const superstition =
        document.getElementById('monsterLoreSuperstition');

    const witcher =
        document.getElementById('monsterLoreWitcher');

    const btnSuperstition =
        document.getElementById('btnLoreSuperstition');

    const btnWitcher =
        document.getElementById('btnLoreWitcher');

    // ESCONDE TUDO

    superstition.classList.add('hidden');
    witcher.classList.add('hidden');

    btnSuperstition.classList.remove(
        'bg-red-700',
        'text-white'
    );

    btnWitcher.classList.remove(
        'bg-red-700',
        'text-white'
    );

    // MOSTRA O ESCOLHIDO

    if (type === 'superstition') {

        superstition.classList.remove('hidden');

        btnSuperstition.classList.add(
            'bg-red-700',
            'text-white'
        );
    }

    if (type === 'witcher') {

        witcher.classList.remove('hidden');

        btnWitcher.classList.add(
            'bg-red-700',
            'text-white'
        );
    }
}

function openCombatMonsterInfo(combatantId) {

    const combatant =
        combatants.find(c => c.id === combatantId);

    if (!combatant) return;

    if (!combatant.presetMonsterId) return;

    showMonsterDetails(
        combatant.presetMonsterId,
        true
    );
}

function showMonsterDetails(monsterId, fromCombat = false) {

    const monster =
        monsterDatabase.find(m => m.id === monsterId);

    if (!monster) return;

    const content =
        document.getElementById(
            'monsterDetailsContent'
        );

    content.innerHTML = `

    ${!fromCombat ? `

        <button
        
            onclick="
                spawnPresetMonster('${monster.id}');
            "
        
            class="w-full
                   p-4
                   rounded-xl
                   bg-red-700
                   hover:bg-red-600
                   font-bold
                   mb-4
                   transition-all">
        
            ➕ Adicionar ao Combate
        
        </button>
        
        ` : ''}


<img

    src="${monster.image}"

    class="w-full
           h-72
           object-contain
           object-top
           rounded-2xl
           border
           border-red-800/40
           mb-4
           bg-black/30">

        <div class="text-3xl font-bold text-white mb-2">

            ${monster.name}

        </div>

            <div class="flex flex-wrap items-center gap-3 mb-4 text-sm font-medium">

                <span class="text-red-400">
                    ❤️ HP ${monster.hp}
                </span>

                <span class="text-white">
                    ☠️ ${monster.threat}
                </span>

                <span class="text-yellow-400">
                    💰 ${monster.reward}
                </span>

            </div>

<div class="mb-5">



    ${monster.armor ? `

    <div class="font-bold text-lg mb-3">

        Armadura

    </div>

        <div class="grid grid-cols-2 gap-3">
        
            <div class="monster-info-card">
        
                <div class="monster-info-title">
                    ${renderIcon(UI_ICONS.armor.head)} Cabeça
                </div>
        
                <div class="text-xl font-bold text-white">
                    ${monster.armor.head}
                </div>
        
            </div>
        
            <div class="monster-info-card">
        
                <div class="monster-info-title">
                    ${renderIcon(UI_ICONS.armor.torso)} Tronco
                </div>
        
                <div class="text-xl font-bold text-white">
                    ${monster.armor.torso}
                </div>
        
            </div>
        
            <div class="monster-info-card">
        
                <div class="monster-info-title">
                    ${renderIcon(UI_ICONS.armor.arm)} Braços
                </div>
        
                <div class="text-xl font-bold text-white">
                    ${monster.armor.arm}
                </div>
        
            </div>
        
            <div class="monster-info-card">
        
                <div class="monster-info-title">
                    ${renderIcon(UI_ICONS.armor.leg)} Pernas
                </div>
        
                <div class="text-xl font-bold text-white">
                    ${monster.armor.leg}
                </div>
        
            </div>
        
        </div>
        ` : ''}
</div>

    <div class="font-bold text-lg mb-3">

        Detalhes

    </div>

        <div class="grid grid-cols-2 gap-3 mb-5">

            <div class="monster-info-card">
                <div class="monster-info-title">
                    Altura
                </div>

                <div>
                    ${monster.height}
                </div>
            </div>

            <div class="monster-info-card">
                <div class="monster-info-title">
                    Peso
                </div>

                <div>
                    ${monster.weight}
                </div>
            </div>

            <div class="monster-info-card">
                <div class="monster-info-title">
                    Habitat
                </div>

                <div>
                    ${monster.habitat}
                </div>
            </div>

            <div class="monster-info-card">
                <div class="monster-info-title">
                    Inteligência
                </div>

                <div>
                    ${monster.intelligence}
                </div>
            </div>

            <div class="monster-info-card">
                <div class="monster-info-title">
                    Organização
                </div>

                <div>
                    ${monster.organization}
                </div>
            </div>

            <div class="monster-info-card">
                <div class="monster-info-title">
                    Velocidade
                </div>

                <div>
                    ${monster.speed}
                </div>
            </div>

        </div>

        <div class="mb-5">

            <div class="font-bold text-lg mb-2">

                Vulnerabilidades

            </div>

            <div class="flex flex-wrap gap-2">

                ${monster.vulnerabilities.map(v => `

                    <div class="bg-red-900/40
                                border
                                border-red-700/40
                                px-3
                                py-1
                                rounded-full
                                text-sm">

                        ${v}

                    </div>

                `).join('')}

            </div>

        </div>

        <div class="mb-5">

            <div class="font-bold text-lg mb-2">

                Habilidades

            </div>

<div class="flex flex-col gap-2">

    ${monster.abilities.map(a => `

<div class="bg-cyan-950/20
            border
            border-cyan-800/20
            px-2.5
            py-1.5
            rounded-sm
            text-[15px]
            leading-snug">

    <span class="text-cyan-300">
        ✦
    </span>

    ${a}

</div>

    `).join('')}

</div>

        </div>

        <div class="mb-5">

            <div class="font-bold text-lg mb-2">

                Ataques

            </div>

            <div class="flex flex-col gap-2">

                ${monster.attacks
                    .filter(a => a && a.trim() !== '')
                    .map(a => `

                        <div class="bg-slate-800
                                    p-3
                                    rounded-xl">

                            ⚔️ ${a}

                        </div>

                    `).join('')}

            </div>

        </div>

        <div class="mb-5">

            <div class="font-bold text-lg mb-2">

                Saque

            </div>

            <div class="flex flex-wrap gap-2">

                ${monster.loot.map(l => `

                    <div class="bg-yellow-900/30
                                border
                                border-yellow-700/30
                                px-3
                                py-1
                                rounded-full
                                text-sm">

                        ${l}

                    </div>

                `).join('')}

            </div>

        </div>

        <div class="mb-2">

            <div class="font-bold text-lg mb-2">

                Perícias

            </div>

            <div class="flex flex-col gap-2">

                ${monster.skills.map(skill => `

                    <div class="bg-slate-800
                                p-2
                                rounded-lg">

                        🎯 ${skill}

                    </div>

                `).join('')}

            </div>

        </div>

        ${monster.superstition || monster.witcherKnowledge ? `

            <div class="mb-5">
            
                <div class="font-bold text-lg mb-3">
            
                    📖 Descrição
            
                </div>
            
                <div class="flex gap-2 mb-3">
            
                    ${monster.superstition ? `
            
                    <button
            
                        id="btnLoreSuperstition"
            
                        onclick="toggleMonsterLore('superstition')"
            
                        class="px-4
                               py-2
                               rounded-xl
                               bg-slate-800
                               hover:bg-red-700
                               transition-all">
            
                        Superstição
            
                    </button>
            
                    ` : ''}
            
                    ${monster.witcherKnowledge ? `
            
                    <button
            
                        id="btnLoreWitcher"
            
                        onclick="toggleMonsterLore('witcher')"
            
                        class="px-4
                               py-2
                               rounded-xl
                               bg-slate-800
                               hover:bg-red-700
                               transition-all">
            
                        Conhecimento Bruxo
            
                    </button>
            
                    ` : ''}
            
                </div>
            
                ${monster.superstition ? `
            
                <div
            
                    id="monsterLoreSuperstition"
            
                    class="hidden
                           bg-slate-900/60
                           border
                           border-red-800/30
                           rounded-2xl
                           p-4
                           whitespace-pre-line
                           leading-relaxed">
            
                    ${monster.superstition}
            
                </div>
            
                ` : ''}
            
                ${monster.witcherKnowledge ? `
            
                <div
            
                    id="monsterLoreWitcher"
            
                    class="hidden
                           bg-slate-900/60
                           border
                           border-cyan-800/30
                           rounded-2xl
                           p-4
                           whitespace-pre-line
                           leading-relaxed">
            
                    ${monster.witcherKnowledge}
            
                </div>
            
                ` : ''}
            
            </div>
            
            ` : ''}

        
    `;

    document.getElementById(
        'monsterDetailsModal'
    ).style.display = 'flex';
}

function spawnPresetMonster(monsterId) {
    

    const monster =
        monsterDatabase.find(m => m.id === monsterId);

    if (!monster) return;

    const newMonster = {

        id: Date.now(),

        presetMonsterId: monster.id,

        name: `${monster.name} ${monsterCounter}`,

        initiative: 0,

        hpMax: monster.hp,
        hpCurrent: monster.hp,

        stMax: monster.st,
        stCurrent: monster.st,

        ca: monster.ca,

        atkInfo: monster.attacks
    .filter(a => a && a.trim() !== '')
    .join(' / '),

        armor: {
            head: monster.armor?.head ?? 0,
            torso: monster.armor?.torso ?? 0,
            arm: monster.armor?.arm ?? 0,
            leg: monster.armor?.leg ?? 0
        },

        type: 'monster',

        statusBrain: false,

        conditions: [],

        deathSaves: {
            success: 0,
            failures: 0
        },

        stabilized: false
    };

    combatants.push(newMonster);

    monsterCounter++;

    sortCombatants();

    savePlayersToStorage();

    renderList(true);

    closePresetMonsterModal();
}

const monsterDatabase = [

    {
        id: 'nilfgardian01',
    
        name: 'Soldado Nilfgard',
    
        image: 'https://static.wikia.nocookie.net/witcher_gamepedia/images/6/69/Tw3_cardart_nilfgaard_black_archer_1.png/revision/latest/scale-to-width-down/290?cb=20150909164804',
    
        hp: 40,
    
        threat: 'Alta',
    
        reward: '300 Coroas',
    
        st: 10,
    
        ca: 13,
    
        armor: {
            head: 5,
            torso: 5,
            arm: 5,
            leg: 5
        },
    
        vulnerabilities: [
            '',
            '',
            '',
            ''
        ],
    
        abilities: [
            '',
            '',
            '',
            '',
            '',
            ''
        ],
    
        attacks: [
            '',
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
            '',
            '',
            ''
        ],
    
        speed: '15m',
    
        height: '2.5m',
    
        weight: '80kg',
    
        habitat: '',
    
        intelligence: '',
    
        organization: ''
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
            Um grifo pode dar a sua vez para soltar um grito que obriga qualquer um dentro de 10m a fazer um teste de resistência a Medo em -1.`,
    
            `Investida
            Se um alvo se move a mais de 10m de distância do grifo, ele pode investir e fazer um poderoso ataque de garra a -4, causando 10d6 de dano e jogando o alvo para trás 8 quadrados.`,
    
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
    
            'Ovo de Grifo (1d6 / 2)',
    
            'Pó Infundido (1d6 / 2)'
        ],
    
        skills: [
    
            'Curta Distância +9',
    
            'Brigar +7',
    
            'Esquivar/Escapar +7',
    
            'Atletismo +7',
    
            'Consciência +10',
    
            'Furtividade +4',
    
            'Sobrevivência no Ermo +8',
    
            'Resistir a Magia +9',
    
            'Tolerância +3',
    
            'Coragem +10'
        ],
    
        speed: `6 Terrestre
    12 Voando`,
    
        height: 'Cerca de 2 metros até o ombro',
    
        weight: 'Em torno de 907 kg',
    
        habitat: 'Altas montanhas e penhascos',
    
        intelligence: 'Tão inteligente quanto um cachorro',
    
        organization: 'Solitário ou em pares'
    },

    {
        id: 'drowner',
    
        name: 'Afogador',
    
        image: 'https://cdna.artstation.com/p/assets/images/images/062/193/626/large/anton-golubev-42.jpg?1682557062',
    
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
            'Coragem +7'
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
    
        image: 'https://static.wikia.nocookie.net/witcher/images/1/18/Gwent_cardart_monsters_ghoul.jpg/revision/latest?cb=20180608165847',
    
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
            'Curta Distância +6',
            'Brigar +6',
            'Esquivar/Escapar +6',
            'Atletismo +7',
            'Consciência +7',
            'Furtividade +4',
            'Sobrevivência no Ermo +6',
            'Resistir a Magia +4',
            'Tolerância +6',
            'Coragem +7'
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
    
        image: 'https://static.wikia.nocookie.net/thewitcher/images/1/12/B3.jpg/revision/latest/scale-to-width-down/230?cb=20160615121658&path-prefix=pt-br',
    
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
            'Atletismo +10',
            'Conscientização +8',
            'Briga +8',
            'Carisma +9',
            'Coragem +6',
            'Engano +10',
            'Esquiva/Escapa +10',
            'Percepção Humana +8',
            'Intimidar +4',
            'Corpo a Corpo +7',
            'Resistir à Coerção +8',
            'Resistir à Magia +9',
            'Sedução +10',
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
    
        image: 'https://static.wikia.nocookie.net/witcher/images/d/d7/Gwent_cardart_monsters_mourntart.jpg/revision/latest?cb=20190523045637',
    
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
            'Curta Distância +8',
            'Brigar +6',
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

        `,
        
        witcherKnowledge: `

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
            'Curta Distância +9',
            'Brigar +8',
            'Esquivar/Escapar +8',
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

        `,
        
        witcherKnowledge: `

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
            'Hipnose — Inimigos sofrem penalidades por 5 rodadas.',
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
            'Brigar +8',
            'Curta Distância +9',
            'Esquivar/Escapar +7',
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
    
    
    ];