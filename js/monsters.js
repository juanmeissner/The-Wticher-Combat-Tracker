function openMonsterChoiceModal() {

    const modal =
        document.getElementById(
            'monsterChoiceModal'
        );

    modal.style.display = 'flex';

    resetModalScroll('monsterChoiceModal');
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

function getMonsterImage(monster) {

    if (
        monster.image &&
        monster.image.trim() !== ''
    ) {
        return monster.image;
    }

    return `img/monsters/${monster.id}.png`;
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

    const modal =
        document.getElementById(
            'presetMonsterModal'
        );

    modal.style.display = 'flex';

    resetModalScroll('presetMonsterModal');

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
    
                    src="${getMonsterImage(monster)}"
    
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

    src="${getMonsterImage(monster)}"

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

                        🔶 ${skill}

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

    resetModalScroll('monsterDetailsModal');
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

    showToast(`👹 ${newMonster.name} foi adicionado ao combate!`);

    monsterCounter++;

    sortCombatants();

    savePlayersToStorage();

    renderList(true);

    closePresetMonsterModal();
}

function resetModalScroll(modalId) {

    const modal =
        document.getElementById(modalId);

    if (!modal) return;

    modal.scrollTop = 0;

    // procura conteúdo interno scrollável
    const scrollables =
        modal.querySelectorAll(
            '.overflow-y-auto'
        );

    scrollables.forEach(el => {

        el.scrollTop = 0;
    });
}