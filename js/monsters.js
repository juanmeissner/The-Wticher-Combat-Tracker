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

function showMonsterDetails(monsterId) {

    const monster =
        monsterDatabase.find(m => m.id === monsterId);

    if (!monster) return;

    const content =
        document.getElementById(
            'monsterDetailsContent'
        );

    content.innerHTML = `

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
    
        organization: 'Grupos de 3 a 6'
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
            'Selvagem — Para Consciência e Sobrevivência, possui INT 6.'
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
    
        organization: 'Grupos de 3 a 6'
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
    
        organization: 'Solitário'
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
    
        organization: 'Solitário'
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
    
        organization: 'Solitário'
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
    
        organization: 'Grupos de 3 a 6'
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
    
        organization: 'Solitário'
    },
    
    
    ];