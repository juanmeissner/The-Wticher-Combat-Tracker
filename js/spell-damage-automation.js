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
            roll: activeSequence.roll,
            multiHit: Boolean(activeSequence.multiHit),
            hitIndex: activeSequence.currentEntry?.index
        };
        return {
            damageType: activeSequence.damageType,
            damageSource,
            skipConfirmation: Boolean(activeSequence.multiHit || activeSequence.prepared),
            ...(activeSequence.sourceKind === 'spell' ? {
                spellDamage: {
                    casterId: activeSequence.sourceId,
                    abilityId: activeSequence.effectId,
                    abilityName: activeSequence.effectName,
                    targetId: activeSequence.current.id,
                    roll: activeSequence.roll,
                    multiHit: Boolean(activeSequence.multiHit),
                    prepared: Boolean(activeSequence.prepared),
                    hitIndex: activeSequence.currentEntry?.index,
                    naturalRoll: activeSequence.currentEntry?.naturalRoll,
                    bodyPart: activeSequence.currentEntry?.bodyPart
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
        const unit = activeSequence.multiHit ? 'impacto' : 'alvo';
        restorePreviousInteraction();
        activeSequence = null;
        global.setPendingAutomationDamageContext?.({});
        if (typeof renderList === 'function') renderList(false);
        global.showToast?.(message || `✨ Dano de ${effectName || 'efeito'} concluído em ${completed}/${total} ${unit}${total === 1 ? '' : 's'}.`);
    }

    function beginNextSpellDamageTarget() {
        if (!activeSequence || activeSequence.awaiting) return;
        const usesPreparedEntries = Boolean(activeSequence.multiHit || activeSequence.prepared);
        const currentEntry = usesPreparedEntries ? activeSequence.remaining.shift() : null;
        const targetId = usesPreparedEntries ? currentEntry?.targetId : activeSequence.remaining.shift();
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
        activeSequence.currentEntry = currentEntry;
        activeSequence.awaiting = true;
        selectedId = target.id;
        currentInput = String(currentEntry?.damage ?? activeSequence.damage);
        global.updateNumpad?.();
        if (usesPreparedEntries) {
            const damageContext = getPendingSpellDamageContext();
            if (currentEntry.critical) {
                global.showToast?.(`💥 ${activeSequence.effectName}: impacto ${currentEntry.index + 1} crítico em ${target.name}.`);
                const opened = global.openContextualCriticalDamageFlow?.({
                    targetId: target.id,
                    sourceId: activeSequence.sourceId,
                    baseDamage: currentEntry.damage,
                    bodyPart: currentEntry.bodyPart,
                    damageContext
                });
                if (opened) return;
            } else {
                const applied = global.applyPreparedLocalizedDamage?.({
                    targetId: target.id,
                    damage: currentEntry.damage,
                    bodyPart: currentEntry.bodyPart,
                    typeMultiplier: 1,
                    ignoreArmor: false,
                    historyContext: damageContext
                });
                if (applied !== false) return;
            }
            cancelSpellDamageSequence('Não foi possível aplicar a sequência de impactos.');
            return;
        }
        global.showToast?.(`⚔️ ${activeSequence.effectName}: escolha o local do dano em ${target.name}.`);
        global.openDamageBodyModal?.();
    }

    function completeSpellDamageStep() {
        if (!activeSequence?.awaiting) return;
        activeSequence.awaiting = false;
        activeSequence.completed += 1;
        activeSequence.current = null;
        activeSequence.currentEntry = null;
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

    function startSpellMultiHitSequence(options = {}) {
        const targetId = String(options.targetId ?? '');
        const hits = Array.isArray(options.hits)
            ? options.hits
                .slice(0, 10)
                .map((hit, index) => ({
                    index,
                    targetId,
                    naturalRoll: Math.max(1, Math.min(20, Math.floor(Number(hit?.naturalRoll) || 1))),
                    damage: Math.max(0, Math.floor(Number(hit?.damage) || 0)),
                    bodyPart: ['head', 'torso', 'arm', 'leg'].includes(hit?.bodyPart) ? hit.bodyPart : 'torso',
                    critical: Number(hit?.naturalRoll) === 20
                }))
            : [];
        if (!targetId || !hits.length || hits.some(hit => !hit.damage)) return false;

        if (activeSequence) cancelSpellDamageSequence('A sequência anterior de dano foi substituída.');
        activeSequence = {
            sourceKind: 'spell',
            sourceId: String(options.casterId ?? ''),
            sourceName: String(options.casterName || ''),
            effectId: String(options.abilityId ?? ''),
            effectName: String(options.abilityName || 'Magia'),
            damage: 0,
            damageType: String(options.damageType || ''),
            roll: options.roll || null,
            remaining: hits,
            total: hits.length,
            completed: 0,
            current: null,
            currentEntry: null,
            awaiting: false,
            multiHit: true,
            previousSelectedId: typeof selectedId !== 'undefined' ? selectedId : null,
            previousInput: typeof currentInput !== 'undefined' ? currentInput : ''
        };
        beginNextSpellDamageTarget();
        return true;
    }

    function startPreparedSpellDamageSequence(options = {}) {
        const entries = Array.isArray(options.entries)
            ? options.entries.map((entry, index) => ({
                index,
                targetId: String(entry?.targetId ?? ''),
                naturalRoll: Math.max(1, Math.min(20, Math.floor(Number(entry?.naturalRoll) || 1))),
                damage: Math.max(0, Math.floor(Number(entry?.damage) || 0)),
                bodyPart: ['head', 'torso', 'arm', 'leg'].includes(entry?.bodyPart) ? entry.bodyPart : 'torso',
                critical: Number(entry?.naturalRoll) === 20
            }))
            : [];
        if (!entries.length || entries.some(entry => !entry.targetId || !entry.damage)) return false;

        if (activeSequence) cancelSpellDamageSequence('A sequência anterior de dano foi substituída.');
        activeSequence = {
            sourceKind: 'spell',
            sourceId: String(options.casterId ?? ''),
            sourceName: String(options.casterName || ''),
            effectId: String(options.abilityId ?? ''),
            effectName: String(options.abilityName || 'Magia'),
            damage: 0,
            damageType: String(options.damageType || ''),
            roll: options.roll || null,
            remaining: entries,
            total: entries.length,
            completed: 0,
            current: null,
            currentEntry: null,
            awaiting: false,
            prepared: true,
            previousSelectedId: typeof selectedId !== 'undefined' ? selectedId : null,
            previousInput: typeof currentInput !== 'undefined' ? currentInput : ''
        };
        beginNextSpellDamageTarget();
        return true;
    }

    global.startSpellDamageSequence = startSpellDamageSequence;
    global.startItemDamageSequence = startItemDamageSequence;
    global.startSpellMultiHitSequence = startSpellMultiHitSequence;
    global.startPreparedSpellDamageSequence = startPreparedSpellDamageSequence;
    global.completeSpellDamageStep = completeSpellDamageStep;
    global.cancelSpellDamageSequence = cancelSpellDamageSequence;
    global.getPendingSpellDamageContext = getPendingSpellDamageContext;
    global.spellDamageAutomation = Object.freeze({
        startSpellDamageSequence,
        startItemDamageSequence,
        startSpellMultiHitSequence,
        startPreparedSpellDamageSequence,
        completeSpellDamageStep,
        cancelSpellDamageSequence,
        getPendingSpellDamageContext,
        getActiveSequence: () => activeSequence
    });
})(typeof window !== 'undefined' ? window : globalThis);
