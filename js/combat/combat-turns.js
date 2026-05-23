function nextTurn() {
    if (combatants.length === 0) return;
    
    let currentIndex = combatants.findIndex(c => c.id === activeTurnId);
    let nextIndex = currentIndex;
    let loopGuard = 0;
    let incrementedRound = false;
    
    do {
        nextIndex++;
        if (nextIndex >= combatants.length || currentIndex === -1) { 
            nextIndex = 0; 
            if (currentIndex !== -1 && !incrementedRound) { 
                round++; 
                incrementedRound = true;
            }
        }
        loopGuard++;
        if (loopGuard > combatants.length) break; 
    } while (combatants[nextIndex] && ((combatants[nextIndex].type === 'monster' && combatants[nextIndex].hpCurrent <= 0) || (combatants[nextIndex].type === 'player' && combatants[nextIndex].deathSaves?.failures >= 3)));
    
    activeTurnId = combatants[nextIndex] ? combatants[nextIndex].id : null;
    deleteVisibleId = null;
    renderList(true);
}

function rollMonsterInitiatives() {
    let changed = false;
    combatants.forEach(c => {
        if (c.type === 'monster') {
            c.initiative = Math.floor(Math.random() * 20) + 1;
            changed = true;
        }
    });
    
    if (changed) {
        sortCombatants();
        renderList(true);
        clearDisplay();
    }
}

window.nextTurn = nextTurn;
window.rollMonsterInitiatives = rollMonsterInitiatives;