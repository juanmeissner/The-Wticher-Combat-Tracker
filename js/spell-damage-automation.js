(function initializeSpellDamageAutomation(global) {
    'use strict';

    let activeSequence = null;

    function getCombatants() {
        return typeof combatants !== 'undefined' && Array.isArray(combatants) ? combatants : [];
    }

    function getPendingSpellDamageContext() {
        if (!activeSequence?.current) return {};
        const damageSource = {
            kind: activeSequence.sourceKind,
            sourceId: activeSequence.sourceId,
            sourceName: activeSequence.sourceName,
            id: activeSequence.effectId,
            name: activeSequence.effectName,
            targetId: activeSequence.current.id,
            roll: activeSequence.roll
        };
        return {
            damageType: activeSequence.damageType,
            damageSource,
            ...(activeSequence.sourceKind === 'spell' ? {
                spellDamage: {
                    casterId: activeSequence.sourceId,
                    abilityId: activeSequence.effectId,
                    abilityName: activeSequence.effectName,
                    targetId: activeSequence.current.id,
                    roll: activeSequence.roll
                }
            } : {}),
            ...(activeSequence.sourceKind === 'item' ? {
                itemDamage: {
                    ownerId: activeSequence.sourceId,
                    itemId: activeSequence.effectId,
                    itemName: activeSequence.effectName,
                    targetId: activeSequence.current.id,
                    roll: activeSequence.roll
                }
            } : {})
        };
    }

    function restorePreviousInteraction() {
        if (!activeSequence) return;
        if (typeof selectedId !== 'undefined') selectedId = activeSequence.previousSelectedId;
        if (typeof currentInput !== 'undefined') currentInput = activeSequence.previousInput;
        global.updateNumpad?.();
    }

    function finishSequence(message = '') {
        if (!activeSequence) return;
        const completed = activeSequence.completed;
        const total = activeSequence.total;
        const effectName = activeSequence.effectName;
        restorePreviousInteraction();
        activeSequence = null;
        global.setPendingAutomationDamageContext?.({});
        if (typeof renderList === 'function') renderList(false);
        global.showToast?.(message || `✨ Dano de ${effectName || 'efeito'} concluído em ${completed}/${total} alvo${total === 1 ? '' : 's'}.`);
    }

    function beginNextSpellDamageTarget() {
        if (!activeSequence || activeSequence.awaiting) return;
        const targetId = activeSequence.remaining.shift();
        if (targetId === undefined) {
            finishSequence();
            return;
        }

        const target = getCombatants().find(entry => String(entry.id) === String(targetId));
        if (!target) {
            beginNextSpellDamageTarget();
            return;
        }

        activeSequence.current = target;
        activeSequence.awaiting = true;
        selectedId = target.id;
        currentInput = String(activeSequence.damage);
        global.updateNumpad?.();
        global.showToast?.(`⚔️ ${activeSequence.effectName}: escolha o local do dano em ${target.name}.`);
        global.openDamageBodyModal?.();
    }

    function completeSpellDamageStep() {
        if (!activeSequence?.awaiting) return;
        activeSequence.awaiting = false;
        activeSequence.completed += 1;
        activeSequence.current = null;
        global.setPendingAutomationDamageContext?.({});
        global.setTimeout(beginNextSpellDamageTarget, 0);
    }

    function cancelSpellDamageSequence(message = 'Sequência de dano cancelada.') {
        if (!activeSequence) return;
        restorePreviousInteraction();
        activeSequence = null;
        global.setPendingAutomationDamageContext?.({});
        global.showToast?.(message);
    }

    function startSpellDamageSequence(options = {}) {
        const damage = Math.max(0, Math.floor(Number(options.damage) || 0));
        const targetIds = [...new Set((options.targetIds || []).map(String))];
        if (!damage || !targetIds.length) return false;

        if (activeSequence) cancelSpellDamageSequence('A sequência anterior de dano foi substituída.');
        activeSequence = {
            sourceKind: String(options.sourceKind || 'spell'),
            sourceId: String(options.sourceId ?? options.casterId ?? ''),
            sourceName: String(options.sourceName || ''),
            effectId: String(options.effectId ?? options.abilityId ?? ''),
            effectName: String(options.effectName ?? options.abilityName ?? 'Efeito'),
            damage,
            damageType: String(options.damageType || ''),
            roll: options.roll || null,
            remaining: targetIds,
            total: targetIds.length,
            completed: 0,
            current: null,
            awaiting: false,
            previousSelectedId: typeof selectedId !== 'undefined' ? selectedId : null,
            previousInput: typeof currentInput !== 'undefined' ? currentInput : ''
        };
        beginNextSpellDamageTarget();
        return true;
    }

    function startItemDamageSequence(options = {}) {
        return startSpellDamageSequence({ ...options, sourceKind: 'item' });
    }

    global.startSpellDamageSequence = startSpellDamageSequence;
    global.startItemDamageSequence = startItemDamageSequence;
    global.completeSpellDamageStep = completeSpellDamageStep;
    global.cancelSpellDamageSequence = cancelSpellDamageSequence;
    global.getPendingSpellDamageContext = getPendingSpellDamageContext;
    global.spellDamageAutomation = Object.freeze({
        startSpellDamageSequence,
        startItemDamageSequence,
        completeSpellDamageStep,
        cancelSpellDamageSequence,
        getPendingSpellDamageContext,
        getActiveSequence: () => activeSequence
    });
})(typeof window !== 'undefined' ? window : globalThis);
