// =========================================
// SISTEMA DE DANO LOCALIZADO
// =========================================

function openDamageBodyModal() {

    if (!selectedId) {
        showToast('Por favor, Selecione um alvo!');
        return;
    }
    
    pendingDamageBase = parseInt(currentInput) || 0;
    
    if (pendingDamageBase <= 0) {
        showToast('Por favor, Digite um dano!');
        return;
    }
    
    document.getElementById('damageBodyModal').style.display = 'flex';
    }

function closeDamageModals() {

        document.getElementById('damageBodyModal').style.display = 'none';
        
        document.getElementById('damageTypeModal').style.display = 'none';
    }

    function selectBodyPart(part) {

        pendingDamageBodyPart = part;
        
        document.getElementById('damageBodyModal').style.display = 'none';
        
        document.getElementById('damageTypeModal').style.display = 'flex';
    }

    function applyCalculatedDamage(
        typeMultiplier,
        ignoreArmor = false
    ) {

        const target = combatants.find(c => c.id === selectedId);
        
        if (!target) return;
        
        let armorValue = 0;
        
        // =========================================
        // ARMADURA DA PARTE DO CORPO
        // =========================================
        
        switch (pendingDamageBodyPart) {
        
            case 'head':
                armorValue = target.armor?.head || 0;
                break;
        
            case 'torso':
                armorValue = target.armor?.torso || 0;
                break;
        
            case 'arm':
                armorValue = target.armor?.arm || 0;
                break;
        
            case 'leg':
                armorValue = target.armor?.leg || 0;
                break;
        }
        
        // =========================================
        // REDUZ ARMADURA PRIMEIRO
        // =========================================
        
        let finalDamage;

        if (ignoreArmor) {
        
            finalDamage = pendingDamageBase;
        
        } else {
        
            finalDamage =
                pendingDamageBase - armorValue;
        
            if (finalDamage < 0)
                finalDamage = 0;
        
            if (finalDamage === 0) {
        
                closeDamageModals();
        
                showToast(
                    '🛡️ A armadura absorveu todo o dano!'
                );
        
                return;
            }
        }
        
        // =========================================
        // MULTIPLICADOR DA PARTE DO CORPO
        // =========================================
        
        let bodyMultiplier = 1;
        
        switch (pendingDamageBodyPart) {
        
            case 'head':
                bodyMultiplier = 3;
                break;
        
            case 'torso':
                bodyMultiplier = 1;
                break;
        
            case 'arm':
                bodyMultiplier = 0.5;
                break;
        
            case 'leg':
                bodyMultiplier = 0.5;
                break;
        }
        
        finalDamage *= bodyMultiplier;
        
        // =========================================
        // MULTIPLICADOR DO TIPO DE DANO
        // =========================================
        
        finalDamage *= typeMultiplier;
        
        // =========================================
        // ARREDONDAMENTO
        // =========================================
        
        finalDamage = Math.floor(finalDamage);
        
        closeDamageModals();
        
        applyDirectDamage(finalDamage);
    
    }

    function applyArmorDamage() {

        const target =
            combatants.find(c => c.id === selectedId);
    
        if (!target) return;
    
        const armorDamage =
            parseInt(pendingDamageBase) || 0;
    
        if (!target.armor) {
    
            target.armor = {
                head: 0,
                torso: 0,
                arm: 0,
                leg: 0
            };
        }
    
        switch (pendingDamageBodyPart) {
    
            case 'head':
    
                target.armor.head =
                    Math.max(
                        0,
                        (target.armor.head || 0)
                        - armorDamage
                    );
    
                break;
    
            case 'torso':
    
                target.armor.torso =
                    Math.max(
                        0,
                        (target.armor.torso || 0)
                        - armorDamage
                    );
    
                break;
    
            case 'arm':
    
                target.armor.arm =
                    Math.max(
                        0,
                        (target.armor.arm || 0)
                        - armorDamage
                    );
    
                break;
    
            case 'leg':
    
                target.armor.leg =
                    Math.max(
                        0,
                        (target.armor.leg || 0)
                        - armorDamage
                    );
    
                break;
        }
    
        savePlayersToStorage();
    
        updateCardTargeted(target);
    
        renderList();
    
        clearDisplay();
    
        closeDamageModals();
    
        showToast(
            `🛡️ Armadura reduzida em ${armorDamage}`
        );
    }

    function applyDirectDamage(value) {

        const oldInput = currentInput;
        
        currentInput = String(value);
        
        // Usa o sistema ORIGINAL do tracker
        applyHP(false);
        
        currentInput = oldInput;
        
        updateNumpad();
        }

    function openSTModal() {

            if (!selectedId) {
                showToast('Por favor, Selecione um alvo!');
                return;
            }
            
            const value = parseInt(currentInput) || 0;
            
            if (value <= 0) {
                showToast('Por favor, Digite um valor!');
                return;
            }
            
            document.getElementById('stModal').style.display = 'flex';
    }

    function closeSTModal() {

        document.getElementById('stModal').style.display = 'none';
    }

    function applyST(isHealing) {

        if (!selectedId) {
            showToast('Por favor, Selecione um alvo!');
            return;
        }
        
        const value = parseInt(currentInput) || 0;
        
        const index = combatants.findIndex(c => c.id === selectedId);
        
        if (index !== -1) {
        
            const c = combatants[index];
        
            if (isHealing) {
        
                c.stCurrent = Math.min(c.stMax, c.stCurrent + value);
        
            } else {
        
                c.stCurrent = Math.max(0, c.stCurrent - value);
        
            }
        
            savePlayersToStorage();
        
            updateCardTargeted(c);
        
            clearDisplay();
        
            closeSTModal();
        }
    }