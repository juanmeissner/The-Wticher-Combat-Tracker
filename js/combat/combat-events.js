    // Lógica de Eventos Delegados
    function handleCardPressStart(e) {
        const card = e.target.closest('.combat-card');
        if (!card || deleteVisibleId || e.target.closest('.delete-overlay')) return;
        const id = parseInt(card.id.split('-')[1]);
        pressTimer = setTimeout(() => {
            deleteVisibleId = id;
            renderList();
        }, 1000); 
    }

    function handleCardPressEnd() {
        clearTimeout(pressTimer);
    }

    function handleListClick(e) {
        if (e.target.closest('.eliminated-divider')) {
            showEliminated = !showEliminated;
            renderList();
            return;
        }

        if (e.target.closest('.delete-overlay')) return;

        const card = e.target.closest('.combat-card');
        if (card && !deleteVisibleId) {
            const id = parseInt(card.id.split('-')[1]);
            const c = combatants.find(comp => comp.id === id);
            if (c) selectCombatant(c.id, c.name);
        }
    }

    function startEndCombatPress(event) {
        didEndCombatLongPress = false;
        endCombatPressTimer = window.setTimeout(() => {
            didEndCombatLongPress = true;
            hardResetCombat();
        }, 1000); 
    }

    function cancelEndCombatPress(event) {
        window.clearTimeout(endCombatPressTimer);
    }

    function startInitPress(event) {
        didInitLongPress = false;
        initPressTimer = window.setTimeout(() => {
            didInitLongPress = true;
            rollMonsterInitiatives();
        }, 1000);
    }

    function cancelInitPress(event) {
        window.clearTimeout(initPressTimer);
    }

    window.handleCardPressStart = handleCardPressStart;
    window.handleCardPressEnd = handleCardPressEnd;
    window.handleListClick = handleListClick;
    
    window.startEndCombatPress = startEndCombatPress;
    window.cancelEndCombatPress = cancelEndCombatPress;
    
    window.startInitPress = startInitPress;
    window.cancelInitPress = cancelInitPress;