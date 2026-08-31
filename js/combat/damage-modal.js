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
        window.closeCriticalDamageModal?.();
    }

    function selectBodyPart(part) {

        pendingDamageBodyPart = part;
        
        document.getElementById('damageBodyModal').style.display = 'none';

        if (window.openPreparedCriticalDamageFlow?.()) return;
        
        document.getElementById('damageTypeModal').style.display = 'flex';
    }

    function applyCalculatedDamage(
        typeMultiplier,
        ignoreArmor = false
    ) {

        const target = combatants.find(c => c.id === selectedId);
        
        if (!target) return;
        
        const originalBaseDamage = Math.max(0, Number(pendingDamageBase) || 0);
        const spellDamageContext = {
            ...(window.peekPendingAutomationDamageContext?.() || {}),
            ...(window.getPendingSpellDamageContext?.() || {})
        };
        const localizedAutomation = window.prepareAutomatedLocalizedDamage?.(
            target,
            originalBaseDamage,
            spellDamageContext
        ) || {
            requestedDamage: originalBaseDamage,
            adjustedDamage: originalBaseDamage,
            damageType: spellDamageContext.damageType || '',
            fireBonus: 0,
            fireMultiplier: 1,
            message: ''
        };
        const localizedBaseDamage = localizedAutomation.adjustedDamage;
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
            : Math.min(localizedBaseDamage, armorValue);

        if (ignoreArmor) {
        
            finalDamage = localizedBaseDamage;
        
        } else {
        
            finalDamage =
                localizedBaseDamage - armorValue;
        
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
                            baseDamage: originalBaseDamage,
                            localizedBaseDamage,
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

                window.setPendingAutomationDamageContext?.({});
                window.completeSpellDamageStep?.();
        
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
            baseDamage: originalBaseDamage,
            localizedBaseDamage,
            bodyPart: pendingDamageBodyPart,
            bodyMultiplier,
            typeMultiplier,
            armorAbsorbed,
            ignoredArmor: ignoreArmor,
            armorBreakdown: armorHistoryBreakdown,
            damageType: localizedAutomation.damageType,
            prelocalizedAutomation: localizedAutomation,
            damageSource: spellDamageContext.damageSource || null,
            spellDamage: spellDamageContext.spellDamage || null,
            itemDamage: spellDamageContext.itemDamage || null
        });
    
    }

    function applyArmorDamage() {

        if (window.getPendingSpellDamageContext?.().damageSource) {
            showToast('Para dano direto de magia, escolha Dano Cheio, Dividido, Dobrado, Crítico ou Ignorar Armadura.');
            return;
        }

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

        window.setPendingAutomationDamageContext?.(historyContext);
        
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
                const temporaryPayment = window.spendCareTemporarySt?.(c, value) || { remaining: value };
                c.stCurrent = Math.max(0, c.stCurrent - Math.max(0, Number(temporaryPayment.remaining) || 0));
        
            }
        
            savePlayersToStorage();
        
            updateCardTargeted(c);
            window.renderAutomationCardSummaries?.();
        
            clearDisplay();
        
            closeSTModal();
        }
    }

    window.applyDirectDamage = applyDirectDamage;
