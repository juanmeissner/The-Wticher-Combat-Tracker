function decreaseEffectTurn(combatantId,type,id){

    const combatant =
        combatants.find(c=>c.id===combatantId);

    if(!combatant) return;

    const effect =
        combatant.effects.find(e=>

            e.id===id &&
            e.type===type

        );

    if(!effect) return;

    if(effect.remainingTurns>0){

        effect.remainingTurns--;

    }

    savePlayersToStorage();

    renderList(false);

}

function increaseEffectTurn(combatantId,type,id){

    const combatant =
        combatants.find(c=>c.id===combatantId);

    if(!combatant) return;

    const effect =
        combatant.effects.find(e=>

            e.id===id &&
            e.type===type

        );

    if(!effect) return;

    effect.remainingTurns++;

    if(effect.initialTurns<effect.remainingTurns){

        effect.initialTurns=
            effect.remainingTurns;

    }

    savePlayersToStorage();

    renderList(false);

}

function increaseEffectStack(combatantId,type,id){

    const combatant =
        combatants.find(c=>c.id===combatantId);

    if(!combatant) return;

    const effect =
        combatant.effects.find(e=>

            e.id===id &&
            e.type===type

        );

    if(!effect) return;

    if(effect.stacks < effect.maxStacks){

        effect.stacks++;

        savePlayersToStorage();

        renderList(false);

    }

}

window.increaseEffectStack = increaseEffectStack;

function decreaseEffectStack(combatantId,type,id){

    const combatant =
        combatants.find(c=>c.id===combatantId);

    if(!combatant) return;

    const effect =
        combatant.effects.find(e=>

            e.id===id &&
            e.type===type

        );

    if(!effect) return;

    if(effect.stacks>1){

        effect.stacks--;

    }else{

        removeEffect(combatantId,type,id);

        return;

    }

    savePlayersToStorage();

    renderList(false);

}

window.decreaseEffectStack = decreaseEffectStack;

function updateRoundEffects() {

    combatants.forEach(combatant => {

        if (!combatant.effects)
            return;

        combatant.effects = combatant.effects.filter(effect => {

            if (effect.remainingTurns === 0)
                return true;

            effect.remainingTurns--;

            if (effect.remainingTurns > 0)
                return true;

            return false;

        });

    });

    savePlayersToStorage();

}

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
        
                updateRoundEffects();
        
            }
        
        }
        loopGuard++;
        if (loopGuard > combatants.length) break; 
    } while (combatants[nextIndex] && ((combatants[nextIndex].type === 'monster' && combatants[nextIndex].hpCurrent <= 0) || (combatants[nextIndex].type === 'player' && combatants[nextIndex].deathSaves?.failures >= 3)));
    
    activeTurnId = combatants[nextIndex]
    ? combatants[nextIndex].id
    : null;

    deleteVisibleId = null;

    savePlayersToStorage();

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