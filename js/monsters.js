function openMonsterChoiceModal() {

    document.getElementById('monsterChoiceModal').style.display =
        'flex';
}

function closeMonsterChoiceModal() {

    document.getElementById('monsterChoiceModal').style.display =
        'none';
}

function openPresetMonsterModal() {

    closeMonsterChoiceModal();

    const container =
        document.getElementById('presetMonsterList');

    container.innerHTML = '';

    monsterDatabase.forEach(monster => {

        container.innerHTML += `

            <button

                onclick="spawnPresetMonster('${monster.id}')"

                class="p-4 rounded-xl bg-red-700/40 hover:bg-red-600/50 transition-all text-left">

                <div class="font-bold text-lg">
                    ${monster.name}
                </div>

                <div class="text-sm text-slate-300 mt-1">
                    HP ${monster.hp} • CA ${monster.ca}
                </div>

            </button>
        `;
    });

    document.getElementById('presetMonsterModal').style.display =
        'flex';
}

function closePresetMonsterModal() {

    document.getElementById('presetMonsterModal').style.display =
        'none';
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

        atkInfo: monster.atk,

        armor: {
            head: monster.armor.head,
            torso: monster.armor.torso,
            arm: monster.armor.arm,
            leg: monster.armor.leg
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
    
        name: 'Nilfgard',
    
        hp: 40,
        st: 10,
        ca: 13,
    
        armor: {
            head: 5,
            torso: 5,
            arm: 5,
            leg: 5
        },
    
        atk: 'Espada: 6d6+4'
    },

    {
        id: 'grifo',
    
        name: 'Grifo',
    
        hp: 100,
        st: 10,
        ca: 13,
    
        armor: {
            head: 3,
            torso: 3,
            arm: 3,
            leg: 3
        },
    
        atk: 'Garras: 6d6 / Mordida: 7d6 (Sangue) / Investida Aérea: 10d6'
    },

    {
        id: 'lamia',
    
        name: 'Lâmia',
    
        hp: 70,
        st: 10,
        ca: 13,
    
        armor: {
            head: 0,
            torso: 0,
            arm: 0,
            leg: 0
        },
    
        atk: 'Garras: 5d6 / Mordida: 2d6 (Sangue) / Grito: Atordoa'
    },

    {
        id: 'witch',
    
        name: 'Bruxa Sepulcral',
    
        hp: 60,
        st: 10,
        ca: 13,
    
        armor: {
            head: 0,
            torso: 0,
            arm: 0,
            leg: 0
        },
    
        atk: 'Garras: 5d6 / Mordida: 6d6 (Veneno) / Língua: 3d6 (Veneno)'
    },

    {
        id: 'ghoul',
    
        name: 'Carniçal',
    
        hp: 35,
        st: 10,
        ca: 13,
    
        armor: {
            head: 2,
            torso: 2,
            arm: 2,
            leg: 2
        },
    
        atk: 'Garras: 3d6 / Mordida: 3d6+2 (Sangue)'
    },
    
    {
        id: 'drowner',
    
        name: 'Afogador',
    
        hp: 25,
        st: 8,
        ca: 12,
    
        armor: {
            head: 0,
            torso: 0,
            arm: 0,
            leg: 0
        },
    
        atk: 'Garras: 3d6'
    }
    
    ];