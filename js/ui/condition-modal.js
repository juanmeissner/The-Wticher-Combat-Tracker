let conditionPressTimer = null;
    
    function startConditionPress(icon) {

    conditionPressTimer = setTimeout(() => {
    
        openConditionInfo(icon);
    
    }, 600);
    }

    function cancelConditionPress() {

        clearTimeout(conditionPressTimer);
        }

        function openConditionInfo(icon) {

            const data = conditionDescriptions[icon];
            
            if (!data) return;
            
            document.getElementById('conditionInfoIcon').innerText = icon;
            
            document.getElementById('conditionInfoTitle').innerText =
                data.title;
            
            document.getElementById('conditionInfoDescription').innerText =
                data.desc;
            
            document.getElementById('conditionInfoModal').style.display =
                'flex';
    }

    function closeConditionInfoModal() {

                document.getElementById('conditionInfoModal').style.display =
                    'none';
    }

    window.openModal = openModal;
    window.closeModal = closeModal;
    window.saveEntity = saveEntity;
    window.editCombatant = editCombatant;
    window.removeCombatant = removeCombatant;
    window.cancelDeleteMode = cancelDeleteMode;
    window.toggleBrainStatus = toggleBrainStatus;
    window.hardResetCombat = hardResetCombat;
    window.endCombat = endCombat;
    window.sortCombatants = sortCombatants;
    window.applyHP = applyHP;
    window.applyInitiative = applyInitiative;