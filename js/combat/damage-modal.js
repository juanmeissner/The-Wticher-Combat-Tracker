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
        window.closeArmorSourceModal?.();
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

        const armorBreakdown = window.getEffectiveArmorBreakdown?.(
            target,
            pendingDamageBodyPart
        );
        const armorHistoryBreakdown = armorBreakdown
            ? {
                manual: armorBreakdown.manual,
                equipment: armorBreakdown.equipment,
                region: armorBreakdown.region,
                shield: armorBreakdown.shield,
                total: armorBreakdown.total,
                equipmentName: armorBreakdown.equipmentSource?.name || '',
                shieldName: armorBreakdown.shieldSource?.name || ''
            }
            : null;

        if (armorBreakdown) armorValue = armorBreakdown.total;
        
        // =========================================
        // REDUZ ARMADURA PRIMEIRO
        // =========================================
        
        let finalDamage;
        const armorAbsorbed = ignoreArmor
            ? 0
            : Math.min(pendingDamageBase, armorValue);

        if (ignoreArmor) {
        
            finalDamage = pendingDamageBase;
        
        } else {
        
            finalDamage =
                pendingDamageBase - armorValue;
        
            if (finalDamage < 0)
                finalDamage = 0;
        
            if (finalDamage === 0) {
        
                closeDamageModals();

                window.addCombatHistoryEntry?.(
                    `Armadura absorveu o dano em ${target.name}`,
                    `${({ head: 'Cabeça', torso: 'Tronco', arm: 'Braço', leg: 'Perna' })[pendingDamageBodyPart] || 'Local'} · ${armorAbsorbed} absorvido · dano final 0`,
                    {
                        type: 'damage',
                        target: { id: target.id, name: target.name },
                        participants: [{ id: target.id, name: target.name }],
                        combat: {
                            baseDamage: pendingDamageBase,
                            finalValue: 0,
                            bodyPart: pendingDamageBodyPart,
                            armorAbsorbed,
                            armorBreakdown: armorHistoryBreakdown
                        }
                    }
                );
        
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
        
        applyDirectDamage(finalDamage, {
            baseDamage: pendingDamageBase,
            bodyPart: pendingDamageBodyPart,
            bodyMultiplier,
            typeMultiplier,
            armorAbsorbed,
            ignoredArmor: ignoreArmor,
            armorBreakdown: armorHistoryBreakdown
        });
    
    }

    function applyArmorDamage() {

        const target =
            combatants.find(c => c.id === selectedId);
    
        if (!target) return;
    
        const armorDamage =
            parseInt(pendingDamageBase) || 0;

        if (window.requestArmorDamageSource?.(
            target,
            pendingDamageBodyPart,
            armorDamage
        )) return;
    }

    function applyDirectDamage(value, historyContext = {}) {

        const oldInput = currentInput;
        
        currentInput = String(value);
        
        // Envia o dano já calculado para a confirmação. Isso evita que o
        // valor original do teclado substitua o resultado após fechar o modal.
        window.applyHP(false, value, historyContext);
        
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
