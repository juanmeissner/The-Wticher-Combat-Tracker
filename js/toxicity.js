(function initializeToxicitySystem(global) {
    'use strict';

    const CONTROLLED_TOXICITY_SKILL_ID = 'manticore_school_toxicidade_controlada';
    const PHYSICAL_ATTRIBUTE_IDS = new Set(['strength', 'dexterity', 'constitution']);
    const BASE_THRESHOLDS = Object.freeze({
        warning: 100,
        impaired: 125,
        severe: 150,
        unconscious: 175,
        overdose: 200
    });

    let pendingItemUseDetail = '';

    function clampNonNegative(value) {
        return Math.max(0, Number(value) || 0);
    }

    function getItemDefinition(itemOrId) {
        const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
        const catalog = typeof predefinedItems !== 'undefined' ? predefinedItems : [];
        return catalog.find(item => item.id === id) || (typeof itemOrId === 'object' ? itemOrId : null);
    }

    function isPotionItem(itemOrId) {
        const item = getItemDefinition(itemOrId);
        return Boolean(item?.potion || Number.isFinite(Number(item?.toxicity)) || item?.clearsToxicity);
    }

    function getToxicityCurrent(character) {
        return clampNonNegative(character?.toxicityCurrent);
    }

    function getControlledToxicityLevel(character) {
        const record = character?.professionalSkills?.[CONTROLLED_TOXICITY_SKILL_ID];
        if (typeof record === 'number') return clampNonNegative(record);
        if (record && typeof record === 'object') return clampNonNegative(record.invested);
        return 0;
    }

    function getAdjustedToxicityThresholds(character) {
        const controlledLevel = getControlledToxicityLevel(character);
        const shift = controlledLevel * 25;

        return {
            controlledLevel,
            shift,
            warning: BASE_THRESHOLDS.warning + shift,
            impaired: BASE_THRESHOLDS.impaired + shift,
            severe: BASE_THRESHOLDS.severe + shift,
            unconscious: BASE_THRESHOLDS.unconscious + shift,
            overdose: BASE_THRESHOLDS.overdose + shift
        };
    }

    function getToxicityToleranceTotal(character) {
        const model = global.characterSheetModel;
        const total = model?.getCharacterSkillTotal?.(
            'tolerance',
            character?.skills,
            character?.attributes
        );
        return clampNonNegative(total);
    }

    function getCharacterLevel(character) {
        return Math.max(1, Number.parseInt(
            character?.identity?.level ?? character?.progression?.level ?? character?.level,
            10
        ) || 1);
    }

    function getToxicityTurnReduction(character) {
        return getToxicityToleranceTotal(character) + getCharacterLevel(character);
    }

    function getToxicityTier(character) {
        const current = getToxicityCurrent(character);
        const thresholds = getAdjustedToxicityThresholds(character);

        if (current >= thresholds.overdose) return 'overdose';
        if (current >= thresholds.unconscious) return 'critical';
        if (current >= thresholds.severe) return 'severe';
        if (current >= thresholds.impaired) return 'impaired';
        if (current >= thresholds.warning) return 'warning';
        return 'stable';
    }

    function getNextToxicityThreshold(character) {
        const current = getToxicityCurrent(character);
        const thresholds = getAdjustedToxicityThresholds(character);
        return [
            ['100%', thresholds.warning],
            ['125%', thresholds.impaired],
            ['150%', thresholds.severe],
            ['175%', thresholds.unconscious],
            ['200%', thresholds.overdose]
        ].find(([, value]) => current < value) || ['200%+', thresholds.overdose];
    }

    function removePotionEffects(character) {
        if (!Array.isArray(character?.effects)) return [];

        const removed = character.effects
            .filter(effect => effect.type === 'item' && isPotionItem(effect.id))
            .map(effect => effect.name || getItemDefinition(effect.id)?.name || effect.id);

        if (removed.length) {
            character.effects = character.effects.filter(
                effect => !(effect.type === 'item' && isPotionItem(effect.id))
            );
        }

        return removed;
    }

    function applyConsumedItemToxicity(character, itemOrId) {
        const item = getItemDefinition(itemOrId);
        pendingItemUseDetail = '';

        if (!character || !item || !isPotionItem(item)) return null;

        const before = getToxicityCurrent(character);

        if (item.clearsToxicity) {
            const removedEffects = removePotionEffects(character);
            character.toxicityCurrent = 0;
            pendingItemUseDetail = [
                `Toxicidade de ${character.name || 'personagem'}: ${before}% → 0%`,
                removedEffects.length
                    ? `Efeitos de poções removidos: ${removedEffects.join(', ')}`
                    : 'Nenhum efeito de poção estava ativo'
            ].join(' · ');
            global.renderList?.(false);

            return {
                kind: 'cleanse',
                before,
                after: 0,
                removedEffects
            };
        }

        const added = clampNonNegative(item.toxicity);
        if (!added) return null;

        character.toxicityCurrent = before + added;
        const thresholds = getAdjustedToxicityThresholds(character);
        pendingItemUseDetail = [
            `Toxicidade de ${character.name || 'personagem'}: ${before}% → ${character.toxicityCurrent}%`,
            `${item.name}: +${added}%`,
            thresholds.shift > 0
                ? `Toxicidade Controlada: limiares +${thresholds.shift}%`
                : ''
        ].filter(Boolean).join(' · ');
        global.renderList?.(false);

        return {
            kind: 'increase',
            before,
            after: character.toxicityCurrent,
            added,
            itemId: item.id
        };
    }

    function consumeToxicityItemUseDetail() {
        const detail = pendingItemUseDetail;
        pendingItemUseDetail = '';
        return detail;
    }

    function appendToxicityItemUseDetail(detail) {
        const normalizedDetail = String(detail || '').trim();
        if (!normalizedDetail) return pendingItemUseDetail;

        pendingItemUseDetail = [pendingItemUseDetail, normalizedDetail]
            .filter(Boolean)
            .join(' · ');

        return pendingItemUseDetail;
    }

    function addOrRefreshCondition(character, id, remainingTurns = 0) {
        if (!character) return false;
        if (!Array.isArray(character.effects)) character.effects = [];

        const existing = character.effects.find(effect => effect.type === 'condition' && effect.id === id);
        const definition = typeof conditionDescriptions !== 'undefined'
            ? conditionDescriptions[id]
            : null;

        if (existing) {
            existing.remainingTurns = Math.max(
                clampNonNegative(existing.remainingTurns),
                clampNonNegative(remainingTurns)
            );
            existing.initialTurns = Math.max(
                clampNonNegative(existing.initialTurns),
                clampNonNegative(remainingTurns)
            );
            return false;
        }

        character.effects.push({
            id,
            type: 'condition',
            name: definition?.title || id,
            remainingTurns: clampNonNegative(remainingTurns),
            initialTurns: clampNonNegative(remainingTurns),
            stacks: 1,
            maxStacks: definition?.stack || 1,
            augment: definition?.augment || 'debuff',
            automationSource: 'toxicity'
        });
        return true;
    }

    function rollToxicityDice(notation, label, options) {
        if (typeof options?.rollDice === 'function') {
            return clampNonNegative(options.rollDice(notation, label));
        }

        return clampNonNegative(
            global.rollAutomationDice?.('negativeConditions', notation, label)
        );
    }

    function performToxicityResistance(character, cd, label, options) {
        const natural = rollToxicityDice('1d20', `${label} — Tolerância CD ${cd}`, options);
        const tolerance = getToxicityToleranceTotal(character);
        const total = natural + tolerance;

        return {
            cd,
            natural,
            tolerance,
            total,
            success: total >= cd
        };
    }

    function applyToxicityDamage(character, amount) {
        const before = clampNonNegative(character?.hpCurrent);
        const damage = Math.min(before, clampNonNegative(amount));

        character.hpCurrent = Math.max(0, before - damage);
        if (before > 0 && character.hpCurrent === 0) {
            character.deathSaves = { success: 0, failures: 0 };
            character.stabilized = false;
        }

        return { before, after: character.hpCurrent, damage };
    }

    function processCombatantToxicityTurn(character, options = {}) {
        const currentBefore = getToxicityCurrent(character);
        if (!character || currentBefore <= 0) return [];

        const thresholds = getAdjustedToxicityThresholds(character);
        const details = [`Toxicidade inicial: ${currentBefore}%`];
        const tests = [];
        const appliedConditions = [];
        let damageResult = null;
        let damageNotation = '';
        let enteredDeathState = false;

        // O dano usa apenas a faixa mais alta alcançada. As demais consequências
        // continuam cumulativas, sem somar 1d4 + 1d6 no mesmo turno.
        if (currentBefore >= thresholds.severe) {
            damageNotation = '1d6';
            damageResult = applyToxicityDamage(
                character,
                rollToxicityDice(damageNotation, 'Dano de toxicidade', options)
            );
        } else if (currentBefore >= thresholds.impaired) {
            damageNotation = '1d4';
            damageResult = applyToxicityDamage(
                character,
                rollToxicityDice(damageNotation, 'Dano de toxicidade', options)
            );
        } else if (currentBefore >= thresholds.warning) {
            const warningTest = performToxicityResistance(character, 14, 'Toxicidade 100%', options);
            tests.push({ name: 'Limiar 100%', ...warningTest });
            if (!warningTest.success) {
                damageNotation = '1d4';
                damageResult = applyToxicityDamage(
                    character,
                    rollToxicityDice(damageNotation, 'Dano de toxicidade', options)
                );
            }
        }

        if (currentBefore >= thresholds.impaired) {
            details.push('Penalidade ativa: -2 em testes físicos');
        }

        if (currentBefore >= thresholds.severe) {
            const stunTest = performToxicityResistance(character, 16, 'Toxicidade 150%', options);
            tests.push({ name: 'Atordoamento', ...stunTest });
            if (!stunTest.success) {
                addOrRefreshCondition(character, '💫', 1);
                appliedConditions.push('Atordoado por 1 turno');
            }
        }

        if (currentBefore >= thresholds.unconscious) {
            const unconsciousTest = performToxicityResistance(character, 18, 'Toxicidade 175%', options);
            tests.push({ name: 'Inconsciência', ...unconsciousTest });
            if (!unconsciousTest.success) {
                addOrRefreshCondition(character, '🚫');
                appliedConditions.push('Incapacitado');
            }
        }

        if (currentBefore >= thresholds.overdose) {
            const overdoseTest = performToxicityResistance(character, 18, 'Overdose 200%', options);
            tests.push({ name: 'Overdose', ...overdoseTest });
            if (!overdoseTest.success) {
                const hpBeforeOverdose = clampNonNegative(character.hpCurrent);
                character.hpCurrent = 0;
                character.deathSaves = { success: 0, failures: 0 };
                character.stabilized = false;
                enteredDeathState = hpBeforeOverdose > 0;
                appliedConditions.push('Estado de Morte por overdose');
            }
        }

        if (damageResult) {
            details.push(
                `Dano: ${damageNotation} = ${damageResult.damage}`,
                `PV: ${damageResult.before} → ${damageResult.after}`
            );
        } else if (currentBefore >= thresholds.warning) {
            details.push('Dano evitado no teste de Tolerância');
        }

        tests.forEach(test => {
            details.push(
                `${test.name}: ${test.natural} + ${test.tolerance} Tolerância = ${test.total} contra CD ${test.cd} — ${test.success ? 'sucesso' : 'falha'}`
            );
        });
        appliedConditions.forEach(condition => details.push(`Consequência: ${condition}`));

        const reduction = getToxicityTurnReduction(character);
        character.toxicityCurrent = Math.max(0, currentBefore - reduction);
        details.push(
            `Redução do turno: ${reduction}% (Tolerância ${getToxicityToleranceTotal(character)} + nível ${getCharacterLevel(character)})`,
            `Toxicidade final: ${character.toxicityCurrent}%`
        );
        if (thresholds.shift > 0) {
            details.push(`Toxicidade Controlada: limiares elevados em ${thresholds.shift}%`);
        }

        global.savePlayersToStorage?.();

        const consequence = Boolean(damageResult || tests.length || appliedConditions.length);
        const summary = `Toxicidade ${currentBefore}% → ${character.toxicityCurrent}%${damageResult ? ` · -${damageResult.damage} PV` : ''}`;
        if (consequence) {
            global.showToast?.(`☣ ${character.name}: ${summary}`);
        }
        const history = consequence ? {
            label: enteredDeathState
                ? `${character.name}: Estado de Morte por overdose`
                : `${character.name}: Toxicidade ${currentBefore}% → ${character.toxicityCurrent}%`,
            detail: details.join('\n'),
            metadata: {
                type: damageResult ? 'damage' : 'condition',
                target: { id: character.id, name: character.name },
                participants: [{ id: character.id, name: character.name }],
                condition: { id: 'toxicity', name: 'Toxicidade' },
                combat: {
                    toxicityBefore: currentBefore,
                    toxicityAfter: character.toxicityCurrent,
                    damageDice: damageNotation,
                    finalValue: damageResult?.damage || 0,
                    enteredDeathState,
                    thresholds
                }
            }
        } : null;

        return [{ summary, history, details, tests, damage: damageResult }];
    }

    function getToxicitySkillModifier(character, skill) {
        const current = getToxicityCurrent(character);
        const thresholds = getAdjustedToxicityThresholds(character);
        const isPhysical = PHYSICAL_ATTRIBUTE_IDS.has(skill?.attributeId);

        if (!isPhysical || current < thresholds.impaired) {
            return { total: 0, details: [] };
        }

        return {
            total: -2,
            details: [`Toxicidade ${current}%: -2 em teste físico`]
        };
    }

    function renderCombatantToxicityIndicator(character) {
        const current = getToxicityCurrent(character);
        if (!current) return '';

        const tier = getToxicityTier(character);
        const thresholds = getAdjustedToxicityThresholds(character);
        const [, nextThreshold] = getNextToxicityThreshold(character);
        const scaleMaximum = Math.max(thresholds.overdose, current);
        const fill = Math.min(100, (current / scaleMaximum) * 100);
        const title = [
            `Toxicidade: ${current}%`,
            `Próximo limiar: ${nextThreshold}%`,
            `Redução no turno: ${getToxicityTurnReduction(character)}%`,
            thresholds.shift ? `Limiar adicional: +${thresholds.shift}%` : ''
        ].filter(Boolean).join(' · ');

        return `
            <div class="toxicity-indicator toxicity-tier-${tier}" title="${title}">
                <div class="toxicity-indicator-line">
                    <span aria-hidden="true">☣</span>
                    <strong>${current}%</strong>
                    <small>TOX</small>
                </div>
                <span class="toxicity-indicator-track" aria-hidden="true">
                    <span style="width: ${fill}%"></span>
                </span>
            </div>
        `;
    }

    global.toxicitySystem = Object.freeze({
        BASE_THRESHOLDS,
        CONTROLLED_TOXICITY_SKILL_ID,
        isPotionItem,
        getToxicityCurrent,
        getControlledToxicityLevel,
        getAdjustedToxicityThresholds,
        getToxicityToleranceTotal,
        getToxicityTurnReduction,
        getToxicityTier,
        applyConsumedItemToxicity,
        appendToxicityItemUseDetail,
        processCombatantToxicityTurn,
        getToxicitySkillModifier
    });
    global.applyConsumedItemToxicity = applyConsumedItemToxicity;
    global.consumeToxicityItemUseDetail = consumeToxicityItemUseDetail;
    global.appendToxicityItemUseDetail = appendToxicityItemUseDetail;
    global.processCombatantToxicityTurn = processCombatantToxicityTurn;
    global.getToxicitySkillModifier = getToxicitySkillModifier;
    global.renderCombatantToxicityIndicator = renderCombatantToxicityIndicator;
})(typeof window !== 'undefined' ? window : globalThis);
