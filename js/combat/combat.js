function removeCombatant(event, id) {
    event.stopPropagation();
    const index = combatants.findIndex(c => c.id === id);
    if (index === -1) return;
    
    const entity = combatants[index];

    if (id === activeTurnId) {
        let nextIndex = index + 1;
        if (nextIndex >= combatants.length) nextIndex = 0;
        activeTurnId = combatants.length > 1 ? combatants[nextIndex].id : null;
    }

    if (selectedId === id) {
        selectedId = null;
        document.getElementById('targetName').innerText = "Nenhum";
    }
    
    combatants.splice(index, 1);
    savePlayersToStorage();
    
    deleteVisibleId = null;
    renderList();
}

function cancelDeleteMode(event) {
    if (event) event.stopPropagation();
    deleteVisibleId = null;
    renderList();
}

function toggleBrainStatus() {
    if (!selectedId) { showToast('⚠️ Selecione um alvo!'); return; }
    const index = combatants.findIndex(c => c.id === selectedId);
    if (index !== -1) {
        combatants[index].statusBrain = !combatants[index].statusBrain;
        savePlayersToStorage();
        updateCardTargeted(combatants[index]); // Atualiza DOM sem piscar a tela
    }
}


function endCombat() {
    if (didEndCombatLongPress) {
        didEndCombatLongPress = false;
        return;
    }

    combatants = combatants.filter(c => c.type === 'player');
    combatants.forEach(c => {
        c.initiative = 0;
        c.hpCurrent = c.hpMax; 
        c.statusBrain = false; 
        c.conditions = []; 
        c.deathSaves = { success: 0, failures: 0 };
        c.stabilized = false;
    });
    
    savePlayersToStorage(); 
    
    activeTurnId = combatants.length > 0 ? combatants[0].id : null;
    round = 1;
    monsterCounter = 1;
    lastMonsterData = { hp: "", ca: "", atk: "" };
    selectedId = null;
    deleteVisibleId = null;
    document.getElementById('targetName').innerText = "Nenhum";
    sortCombatants();
    renderList(true);
}

function hardResetCombat() {

    // =========================================
    // LIMPA COMBATE
    // =========================================

    combatants = [];

    // =========================================
    // LIMPA STORAGE
    // =========================================

    localStorage.removeItem('dnd_players');
    localStorage.removeItem('dnd_monsterCounter');
    localStorage.removeItem('dnd_playerCounter');

    // =========================================
    // RESET TURNOS
    // =========================================

    activeTurnId = null;
    selectedId = null;
    deleteVisibleId = null;

    round = 1;

    // =========================================
    // RESET CONTADORES
    // =========================================

    monsterCounter = 1;
    playerCounter = 1;

    // =========================================
    // RESET ÚLTIMOS DADOS
    // =========================================

    lastMonsterData = {
        hp: "",
        st: "",
        ca: "",
        atk: "",
        armor: {
            head: 0,
            torso: 0,
            arm: 0,
            leg: 0
        }
    };

    lastPlayerData = {
        hp: "",
        st: "",
        ca: "",
        atk: "",
        armor: {
            head: 0,
            torso: 0,
            arm: 0,
            leg: 0
        }
    };

    // =========================================
    // RESET UI
    // =========================================

    document.getElementById('targetName').innerText = "Nenhum";

    clearDisplay();

    // =========================================
    // RENDER
    // =========================================

    renderList(true);

    // =========================================
    // FEEDBACK
    // =========================================

    showToast('🔥 Combate resetado completamente!');
    }

    function sortCombatants() {
        combatants.sort((a, b) => {
            const aEliminated = (a.type === 'monster' && a.hpCurrent <= 0) || (a.type === 'player' && a.deathSaves?.failures >= 3);
            const bEliminated = (b.type === 'monster' && b.hpCurrent <= 0) || (b.type === 'player' && b.deathSaves?.failures >= 3);

            if (aEliminated && !bEliminated) return 1;
            if (!aEliminated && bEliminated) return -1;

            if (b.initiative !== a.initiative) return b.initiative - a.initiative;
            if (a.type === 'player' && b.type === 'monster') return -1;
            if (a.type === 'monster' && b.type === 'player') return 1;
            return a.id - b.id; 
        });
    }

    function applyHP(isHealing) {   
        if (!selectedId) { showToast('Por favor,  Selecione um alvo!'); return; }
        const value = parseInt(currentInput) || 0;
        
        const index = combatants.findIndex(c => c.id === selectedId);
        if (index !== -1) {
            const c = combatants[index];
            const oldHP = c.hpCurrent;
            const oldFailures = c.deathSaves?.failures || 0;
            let triggerConcentration = false;
            
            if (!c.deathSaves) c.deathSaves = { success: 0, failures: 0 };

            if (isHealing) {
                if (c.hpCurrent <= 0 && value === 0) {
                    if (oldFailures < 3) {
                        c.deathSaves.success += 1;
                        if (c.deathSaves.success >= 3) {
                            c.deathSaves = { success: 0, failures: 0 };
                            c.stabilized = true;
                            showToast('ðŸ›¡ï¸� Estabilizado!');
                        }
                    }
                } else if (value > 0) {
                    c.hpCurrent = Math.min(c.hpMax, c.hpCurrent + value);
                    c.deathSaves = { success: 0, failures: 0 };
                    c.stabilized = false;
                } else {
                    return; // Zero e HP normal ignora
                }
            } else {
                if (c.hpCurrent <= 0 && value === 0) {
                    if (oldFailures < 3) {
                        c.deathSaves.failures = Math.min(3, c.deathSaves.failures + 1);
                        c.stabilized = false;
                        if (c.deathSaves.failures >= 3) showToast('â˜ ï¸� Morto!');
                    }
                } else if (value > 0) {
                    c.hpCurrent = Math.max(0, c.hpCurrent - value);
                    c.stabilized = false;
                    if (c.hpCurrent <= 0 && oldHP > 0) {
                        c.statusBrain = false;
                        c.deathSaves = { success: 0, failures: 0 };
                    } else if (c.hpCurrent <= 0 && oldHP <= 0) {
                        if (oldFailures < 3) {
                            c.deathSaves.failures = Math.min(3, c.deathSaves.failures + 1); // Dano com 0 HP soma falha
                            if (c.deathSaves.failures >= 3) showToast('â˜ ï¸� Morto!');
                        }
                    } else if (c.statusBrain && oldHP > 0) {
                        triggerConcentration = true;
                    }
                } else {
                    return; // Zero e HP normal ignora
                }
            }
            
            const newFailures = c.deathSaves.failures;
            savePlayersToStorage();
            
            const monsterDiedOrRevived = c.type === 'monster' && ((oldHP > 0 && c.hpCurrent <= 0) || (oldHP <= 0 && c.hpCurrent > 0));
            const playerDiedOrRevived = c.type === 'player' && ((oldFailures < 3 && newFailures >= 3) || (oldFailures >= 3 && newFailures < 3));

            if (monsterDiedOrRevived || playerDiedOrRevived) {
                sortCombatants(); 
                renderList(false);
            } else {
                updateCardTargeted(c); 
            }
            
            clearDisplay();

            if (triggerConcentration) {
                askConcentration(c.id);
            }
        }
    }

    function applyInitiative() {
        if (didInitLongPress) {
            didInitLongPress = false;
            return;
        }

        if (!selectedId) { showToast('âš ï¸� Selecione um alvo!'); return; }
        const value = parseInt(currentInput);
        const index = combatants.findIndex(c => c.id === selectedId);
        if (index !== -1) {
            combatants[index].initiative = value;
            
            savePlayersToStorage();
            
            sortCombatants();
            renderList(true);
            clearDisplay();
        }
    }

    window.openModal = openModal;
    window.closeModal = closeModal;
    window.saveEntity = saveEntity;
    window.editCombatant = editCombatant;
    window.removeCombatant = removeCombatant;
    window.openMonsterChoiceModal = openMonsterChoiceModal;
    window.closeMonsterChoiceModal = closeMonsterChoiceModal;
    window.selectCombatant = selectCombatant;
    window.renderList = renderList;
    window.applyHP = applyHP;
    window.nextTurn = nextTurn;