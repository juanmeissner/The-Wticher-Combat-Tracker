function openModal(type) {
    const nameInput = document.getElementById('nameInp');
    const hpInp = document.getElementById('hpInp');
    const stInp = document.getElementById('stInp');
    const caInp = document.getElementById('caInp');
    const atkInp = document.getElementById('atkInp');
    
    editingId = null; 
    modalType = type;
    document.getElementById('modalTitle').innerText = type === 'player' ? 'Novo Jogador' : 'Novo Monstro';
    document.getElementById('initInp').value = "";

    if (type === 'monster') {
        nameInput.value = "Inimigo " + monsterCounter;
        hpInp.value = lastMonsterData.hp;
        stInp.value = lastMonsterData.st;
        caInp.value = lastMonsterData.ca;
        atkInp.value = lastMonsterData.atk;
    } else {
        nameInput.value = "Jogador " + playerCounter;
        hpInp.value = lastPlayerData.hp;
        stInp.value = lastPlayerData.st;
        caInp.value = lastPlayerData.ca;
        atkInp.value = lastPlayerData.atk;
    }
    document.getElementById('entityModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('entityModal').style.display = 'none';
}

function saveEntity() {
    const name = document.getElementById('nameInp').value;
    const init = parseInt(document.getElementById('initInp').value) || 0;
    const hp = parseInt(document.getElementById('hpInp').value) || 1;
    const st = parseInt(document.getElementById('stInp').value) || 0;
    const ca = parseInt(document.getElementById('caInp').value) || 10;
    const atk = document.getElementById('atkInp').value || "-";
    const armorHead = parseInt(document.getElementById('armorHeadInp').value) || 0;
    const armorTorso = parseInt(document.getElementById('armorTorsoInp').value) || 0;
    const armorArm = parseInt(document.getElementById('armorArmInp').value) || 0;
    const armorLeg = parseInt(document.getElementById('armorLegInp').value) || 0;

    if (!name) return;

    let newlyAddedId = null;
    let isHighestInit = false;

    if (editingId) {
        const index = combatants.findIndex(c => c.id === editingId);
        if (index !== -1) {
            combatants[index].name = name;
            combatants[index].initiative = init;
            combatants[index].hpMax = hp;
            if (combatants[index].hpCurrent > hp) combatants[index].hpCurrent = hp;
            combatants[index].stMax = st;
            if (combatants[index].stCurrent > st) combatants[index].stCurrent = st;
            combatants[index].ca = ca;
            combatants[index].atkInfo = atk;
            combatants[index].armor = {
            head: armorHead,
            torso: armorTorso,
            arm: armorArm,
            leg: armorLeg
        };
            
            if (combatants[index].type === 'player') savePlayersToStorage();
        }
        editingId = null;
    } 
    else {
        // Verifica se é a maior iniciativa
        if (combatants.length === 0) {
            isHighestInit = true;
        } else {
            const maxInit = Math.max(...combatants.map(c => c.initiative));
            if (init >= maxInit) isHighestInit = true;
        }

        const newEntity = {
            id: Date.now(),
            name,
            initiative: init,
            hpMax: hp,
            hpCurrent: hp,
            stMax: st,
            stCurrent: st,
            ca,
            atkInfo: atk,
            armor: {
            head: armorHead,
            torso: armorTorso,
            arm: armorArm,
            leg: armorLeg
            },
            type: modalType,
            statusBrain: false,
            conditions: [],
            deathSaves: { success: 0, failures: 0 },
            stabilized: false
        };

        combatants.push(newEntity);
        savePlayersToStorage();
        newlyAddedId = newEntity.id;

        if (modalType === 'monster') {
            monsterCounter++;
            lastMonsterData = { hp, st, ca, atk };
        } else {
            playerCounter++;
            lastPlayerData = { hp, st, ca, atk };
            savePlayersToStorage();
        }
    }

    sortCombatants();

    // Configura para ser a vez dele se for a maior iniciativa
    if (newlyAddedId && isHighestInit) {
        activeTurnId = newlyAddedId;
    }
    savePlayersToStorage();
    closeModal();
    renderList(true);
}

function editCombatant(event, id) {
    event.stopPropagation();
    cancelDeleteMode(event);
    
    const c = combatants.find(c => c.id === id);
    if (!c) return;

    editingId = c.id;
    modalType = c.type;
    
    document.getElementById('modalTitle').innerText = 'Editar ' + (c.type === 'player' ? 'Jogador' : 'Monstro');
    document.getElementById('nameInp').value = c.name;
    document.getElementById('initInp').value = c.initiative;
    document.getElementById('hpInp').value = c.hpMax;
    document.getElementById('stInp').value = c.stMax;
    document.getElementById('caInp').value = c.ca;
    document.getElementById('atkInp').value = c.atkInfo;
    document.getElementById('armorHeadInp').value = c.armor?.head || 0;
    document.getElementById('armorTorsoInp').value = c.armor?.torso || 0;
    document.getElementById('armorArmInp').value = c.armor?.arm || 0;
    document.getElementById('armorLegInp').value = c.armor?.leg || 0;
    
    document.getElementById('entityModal').style.display = 'flex';
}