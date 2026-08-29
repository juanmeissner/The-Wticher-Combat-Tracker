(function initializeItemUseAutomation(global) {
    'use strict';

    const TARGETED_ITEMS = new Set([
        'adesivoalquimico',
        'cloroformio',
        'podecoagulacao',
        'fissstech',
        'alucinogeno',
        'ervasentorpecentes',
        'elixirdepantagran',
        'pocaodeperfume',
        'inflamador',
        'fluidoesterilizante',
        'soprodesucubo',
        'lagrimasdetalgar',
        'podelua',
        'podedimeritio',
        'bafodedragao',
        'samun'
    ]);

    const MULTI_TARGET_ITEMS = new Set([
        'adesivoalquimico',
        'lagrimasdetalgar',
        'podelua',
        'podedimeritio',
        'bafodedragao'
    ]);

    const OWNER_FIRST_ITEMS = new Set([
        'podecoagulacao',
        'fissstech',
        'ervasentorpecentes',
        'elixirdepantagran',
        'fluidoesterilizante'
    ]);

    let pendingUse = null;
    let pendingExecution = null;
    let currentTargetOptions = null;

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function clone(value, fallback = null) {
        try {
            return JSON.parse(JSON.stringify(value ?? fallback));
        } catch {
            return fallback;
        }
    }

    function getCombatants() {
        return typeof combatants !== 'undefined' && Array.isArray(combatants) ? combatants : [];
    }

    function isEliminated(combatant) {
        return (combatant.type === 'monster' && Number(combatant.hpCurrent) <= 0) ||
            (combatant.type === 'player' && Number(combatant.deathSaves?.failures) >= 3);
    }

    function getEligibleTargets() {
        return getCombatants().filter(combatant => !isEliminated(combatant));
    }

    function getTargetById(id) {
        return getCombatants().find(combatant => String(combatant.id) === String(id)) || null;
    }

    function getItemRollMode() {
        try {
            return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.items || 'manual';
        } catch {
            return 'manual';
        }
    }

    function rollItemDie(sides, label) {
        if (getItemRollMode() === 'auto') {
            return Math.floor(Math.random() * sides) + 1;
        }

        const raw = global.prompt(`${label}\nInforme o resultado de 1d${sides} (1 a ${sides}).`, '');
        if (raw === null) return null;
        const value = Number.parseInt(raw, 10);
        if (!Number.isInteger(value) || value < 1 || value > sides) {
            global.showToast?.(`Informe um resultado entre 1 e ${sides}.`);
            return null;
        }
        return value;
    }

    function getToleranceTotal(target) {
        const model = global.characterSheetModel;
        if (!model || !target) return 0;
        const breakdown = model.getCharacterSkillBreakdown?.(
            'tolerance',
            target.skills,
            target.attributes
        );
        return Number(breakdown?.total) || 0;
    }

    function closeInventoryItemTargetModal() {
        document.getElementById('inventoryItemTargetModal')?.remove();
        pendingUse = null;
    }

    function getDefaultTargetId(itemId, owner) {
        const eligible = getEligibleTargets();
        const ownerTarget = eligible.find(target => String(target.id) === String(owner?.id));
        const selectedTarget = eligible.find(target => (
            typeof selectedId !== 'undefined' && String(target.id) === String(selectedId)
        ));

        if (OWNER_FIRST_ITEMS.has(itemId) && ownerTarget) return String(ownerTarget.id);
        if (selectedTarget) return String(selectedTarget.id);
        if (ownerTarget) return String(ownerTarget.id);
        return eligible[0] ? String(eligible[0].id) : '';
    }

    function getSelectedTargetIds() {
        return pendingUse ? [...pendingUse.selectedIds] : [];
    }

    function renderTargetSpecificOptions() {
        const container = document.getElementById('inventoryItemTargetOptions');
        if (!container || !pendingUse) return;

        const target = getTargetById(getSelectedTargetIds()[0]);
        const itemId = pendingUse.item.id;
        const fragments = [];

        if (itemId === 'fissstech' && target) {
            const tolerance = getToleranceTotal(target);
            fragments.push(`
                <div class="item-use-rule-note">
                    <strong>Teste de dependência</strong>
                    <span>${escapeHtml(target.name)} fará Tolerância ND 20 com total ${tolerance >= 0 ? '+' : ''}${tolerance}. A rolagem seguirá a configuração de itens.</span>
                </div>
            `);
        }

        if (itemId === 'ervasentorpecentes' && target) {
            const wounds = (target.criticalWounds || []).filter(wound => (
                (wound.state || 'normal') === 'normal' &&
                !global.getCriticalWoundDefinition?.(wound.woundId)?.cannotStabilize
            ));
            fragments.push(wounds.length ? `
                <label class="item-use-select-field">
                    <span>Ferimento crítico que será estabilizado</span>
                    <select id="inventoryItemWoundSelect">
                        ${wounds.map(wound => {
                            const definition = global.getCriticalWoundDefinition?.(wound.woundId);
                            return `<option value="${escapeHtml(wound.instanceId)}">${escapeHtml(definition?.name || wound.woundId)}</option>`;
                        }).join('')}
                    </select>
                </label>
            ` : `
                <div class="item-use-rule-note is-warning">
                    <strong>Nenhum ferimento estabilizável</strong>
                    <span>O Alucinado ainda será aplicado por 20 rodadas, mas não há ferimento crítico normal para estabilizar.</span>
                </div>
            `);
        }

        if (itemId === 'soprodesucubo') {
            fragments.push(`
                <fieldset class="item-use-mode-field">
                    <legend>Forma de aplicação</legend>
                    <label><input type="radio" name="succubusMode" value="skin" checked> Na pele · +2 em Sedução</label>
                    <label><input type="radio" name="succubusMode" value="drink"> Na bebida · −5 em Resistir à Sedução</label>
                </fieldset>
            `);
        }

        container.innerHTML = fragments.join('');
    }

    function selectInventoryItemUseTarget(targetId, checked) {
        if (!pendingUse) return;
        const id = String(targetId);

        if (pendingUse.multiple) {
            if (checked) pendingUse.selectedIds.add(id);
            else pendingUse.selectedIds.delete(id);
        } else {
            pendingUse.selectedIds = new Set([id]);
            document.querySelectorAll('#inventoryItemTargetModal input[name="inventoryItemTarget"]')
                .forEach(input => { input.checked = String(input.value) === id; });
        }

        renderTargetSpecificOptions();
    }

    function setAllInventoryItemUseTargets(checked) {
        if (!pendingUse?.multiple) return;
        const ids = getEligibleTargets().map(target => String(target.id));
        pendingUse.selectedIds = new Set(checked ? ids : []);
        document.querySelectorAll('#inventoryItemTargetModal input[name="inventoryItemTarget"]')
            .forEach(input => { input.checked = checked; });
    }

    function buildExecutionOptions(itemId, targetIds) {
        const optionsByTarget = {};

        targetIds.forEach(targetId => {
            optionsByTarget[targetId] = {};
        });

        if (itemId === 'pocaodeperfume') {
            const hours = rollItemDie(10, 'Poção de Perfume — duração');
            if (hours === null) return null;
            targetIds.forEach(targetId => {
                optionsByTarget[targetId] = { hours, duration: hours * 60 };
            });
        }

        if (itemId === 'fissstech') {
            const target = getTargetById(targetIds[0]);
            const naturalRoll = rollItemDie(20, 'Fisstech — teste de Tolerância ND 20');
            if (naturalRoll === null) return null;
            const toleranceTotal = getToleranceTotal(target);
            optionsByTarget[targetIds[0]] = {
                toleranceNaturalRoll: naturalRoll,
                toleranceTotal,
                toleranceResult: naturalRoll + toleranceTotal,
                tolerancePassed: naturalRoll + toleranceTotal >= 20
            };
        }

        if (itemId === 'ervasentorpecentes') {
            optionsByTarget[targetIds[0]].woundInstanceId =
                document.getElementById('inventoryItemWoundSelect')?.value || '';
        }

        if (itemId === 'soprodesucubo') {
            optionsByTarget[targetIds[0]].succubusMode =
                document.querySelector('input[name="succubusMode"]:checked')?.value || 'skin';
        }

        return optionsByTarget;
    }

    function confirmInventoryItemUseTargets() {
        if (!pendingUse) return;
        const targetIds = getSelectedTargetIds();
        if (!targetIds.length) {
            global.showToast?.('Selecione ao menos um alvo.');
            return;
        }

        const optionsByTarget = buildExecutionOptions(pendingUse.item.id, targetIds);
        if (!optionsByTarget) return;

        const callback = pendingUse.onConfirm;
        pendingExecution = {
            itemId: pendingUse.item.id,
            targetIds,
            optionsByTarget
        };
        closeInventoryItemTargetModal();
        callback();
    }

    function beginInventoryItemUseFlow(item, owner, onConfirm) {
        if (!TARGETED_ITEMS.has(item?.id) || typeof onConfirm !== 'function') return false;
        const targets = getEligibleTargets();
        if (!targets.length) {
            global.showToast?.('Adicione ao combate ao menos um alvo válido antes de usar este item.');
            return true;
        }

        const multiple = MULTI_TARGET_ITEMS.has(item.id);
        const defaultTargetId = getDefaultTargetId(item.id, owner);
        pendingUse = {
            item,
            owner,
            onConfirm,
            multiple,
            selectedIds: new Set(defaultTargetId ? [defaultTargetId] : [])
        };

        document.getElementById('inventoryItemTargetModal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'inventoryItemTargetModal';
        modal.className = 'session-overlay item-use-target-overlay';
        modal.addEventListener('click', event => {
            if (event.target === modal) closeInventoryItemTargetModal();
        });
        modal.innerHTML = `
            <section class="session-dialog item-use-target-dialog" role="dialog" aria-modal="true" aria-labelledby="inventoryItemTargetTitle">
                <div class="session-dialog-header">
                    <div>
                        <small>USAR ITEM</small>
                        <h2 id="inventoryItemTargetTitle">${escapeHtml(item.name)}</h2>
                    </div>
                    <button type="button" class="session-close" data-item-use-close aria-label="Fechar">×</button>
                </div>
                <p>${multiple ? 'Marque todos os participantes atingidos.' : 'Escolha quem receberá ou renovará o efeito.'}</p>
                ${multiple ? `
                    <div class="item-use-target-tools">
                        <button type="button" data-item-use-all>Selecionar todos</button>
                        <button type="button" data-item-use-none>Limpar</button>
                    </div>
                ` : ''}
                <div class="item-use-target-list" role="group" aria-label="Alvos disponíveis">
                    ${targets.map(target => {
                        const id = String(target.id);
                        const checked = pendingUse.selectedIds.has(id);
                        return `
                            <label class="item-use-target-option">
                                <input type="${multiple ? 'checkbox' : 'radio'}" name="inventoryItemTarget" value="${escapeHtml(id)}" ${checked ? 'checked' : ''}>
                                <span>
                                    <strong>${escapeHtml(target.name)}</strong>
                                    <small>${target.type === 'monster' ? 'Inimigo' : 'Personagem'} · HP ${Math.max(0, Number(target.hpCurrent) || 0)}/${Math.max(0, Number(target.hpMax) || 0)}</small>
                                </span>
                            </label>
                        `;
                    }).join('')}
                </div>
                <div id="inventoryItemTargetOptions"></div>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" data-item-use-cancel>Cancelar</button>
                    <button type="button" class="session-primary" data-item-use-confirm>Aplicar e consumir</button>
                </div>
            </section>
        `;

        document.body.appendChild(modal);
        modal.querySelectorAll('input[name="inventoryItemTarget"]').forEach(input => {
            input.addEventListener('change', () => selectInventoryItemUseTarget(input.value, input.checked));
        });
        modal.querySelector('[data-item-use-close]')?.addEventListener('click', closeInventoryItemTargetModal);
        modal.querySelector('[data-item-use-cancel]')?.addEventListener('click', closeInventoryItemTargetModal);
        modal.querySelector('[data-item-use-confirm]')?.addEventListener('click', confirmInventoryItemUseTargets);
        modal.querySelector('[data-item-use-all]')?.addEventListener('click', () => setAllInventoryItemUseTargets(true));
        modal.querySelector('[data-item-use-none]')?.addEventListener('click', () => setAllInventoryItemUseTargets(false));
        renderTargetSpecificOptions();
        modal.querySelector('input[name="inventoryItemTarget"]:checked')?.focus();
        return true;
    }

    function getCondition(target, icon) {
        return (target?.effects || []).find(effect => effect.type === 'condition' && effect.id === icon) || null;
    }

    function ensureStackCondition(target, icon, delta, maximum = 5) {
        if (!target) return null;
        target.effects ||= [];
        let effect = getCondition(target, icon);
        const next = Math.max(0, Math.min(maximum, (Number(effect?.stacks) || 0) + delta));

        if (next <= 0) {
            target.effects = target.effects.filter(current => current !== effect);
            return null;
        }

        if (!effect) effect = global.addAutomationCondition?.(target, icon) || null;
        if (!effect) return null;
        effect.stacks = next;
        effect.maxStacks = maximum;
        effect.remainingTurns = 0;
        effect.initialTurns = 0;
        return effect;
    }

    function syncWithdrawalExhaustion(target) {
        const withdrawal = getCondition(target, '🥶');
        const exhausted = getCondition(target, '😮');
        const automatedExhaustion = exhausted?.automation?.fissstechWithdrawal;

        if (Number(withdrawal?.stacks) >= 5 && !exhausted) {
            const effect = global.addAutomationCondition?.(target, '😮');
            if (effect) effect.automation = { ...(effect.automation || {}), fissstechWithdrawal: true };
        } else if (Number(withdrawal?.stacks) < 5 && automatedExhaustion) {
            target.effects = target.effects.filter(effect => effect !== exhausted);
        }
    }

    function applyFissstechUse(target, appliedEffect, options) {
        ensureStackCondition(target, '🥶', -1);
        let addiction = getCondition(target, '💉');
        if (!options.tolerancePassed) addiction = ensureStackCondition(target, '💉', 1);

        target.automation = {
            ...(target.automation || {}),
            fissstechWithdrawalPending: Boolean(addiction)
        };
        appliedEffect.automation = {
            ...(appliedEffect.automation || {}),
            toleranceTest: {
                naturalRoll: options.toleranceNaturalRoll,
                skillTotal: options.toleranceTotal,
                result: options.toleranceResult,
                difficulty: 20,
                passed: Boolean(options.tolerancePassed)
            }
        };
        syncWithdrawalExhaustion(target);
    }

    function stabilizeSelectedWound(target, instanceId) {
        if (!instanceId) return '';
        const instance = (target.criticalWounds || []).find(wound => wound.instanceId === instanceId);
        const definition = global.getCriticalWoundDefinition?.(instance?.woundId);
        if (!instance || !definition) return '';
        global.setCriticalWoundState?.(target.id, instanceId, 'stabilized');
        return definition.name;
    }

    function installInventoryApplicationWrapper() {
        const original = global.applyInventoryItemEffectOnOwner;
        if (typeof original !== 'function' || original.itemUseAutomationWrapped) return;

        const wrapped = (owner, itemId) => {
            const execution = pendingExecution?.itemId === itemId ? pendingExecution : null;
            if (!execution) return original(owner, itemId);
            pendingExecution = null;

            const results = [];
            const detailLines = [];
            execution.targetIds.forEach(targetId => {
                const target = getTargetById(targetId);
                if (!target) return;
                currentTargetOptions = execution.optionsByTarget[targetId] || {};
                const result = original(target, itemId);
                currentTargetOptions = null;
                if (!result?.applied) return;

                if (itemId === 'fissstech') {
                    applyFissstechUse(target, result.effect, execution.optionsByTarget[targetId]);
                    const test = result.effect.automation?.toleranceTest;
                    detailLines.push(
                        `${target.name}: Tolerância ${test.naturalRoll} + ${test.skillTotal} = ${test.result} contra ND 20 · ${test.passed ? 'sucesso' : 'falha; Vício aumentado'}`
                    );
                }

                if (itemId === 'ervasentorpecentes') {
                    const woundName = stabilizeSelectedWound(
                        target,
                        execution.optionsByTarget[targetId].woundInstanceId
                    );
                    detailLines.push(woundName
                        ? `${target.name}: ${woundName} estabilizado; Alucinado por 20 rodadas`
                        : `${target.name}: Alucinado por 20 rodadas; nenhum ferimento estabilizado`);
                } else {
                    const duration = Math.max(0, Number(result.effect?.remainingTurns) || 0);
                    detailLines.push(`${target.name}: ${result.refreshed ? 'efeito renovado' : 'efeito aplicado'}${duration ? ` por ${duration} rodadas` : ''}`);
                }

                results.push({ ...result, target });
            });

            global.savePlayersToStorage?.();
            global.renderList?.(false);
            return {
                applied: results.length > 0,
                blocked: results.length === 0,
                reason: results.length ? '' : 'no-target-applied',
                refreshed: results.some(result => result.refreshed),
                effect: results[0]?.effect || null,
                effectKind: 'item',
                targets: results.map(result => ({ id: result.target.id, name: result.target.name })),
                summary: detailLines.join('\n')
            };
        };
        wrapped.itemUseAutomationWrapped = true;
        global.applyInventoryItemEffectOnOwner = wrapped;
    }

    function installTurnAutomationWrapper() {
        const original = global.processAutomatedTurnEffects;
        if (typeof original !== 'function' || original.itemUseAutomationWrapped) return;

        const wrapped = combatant => {
            const changes = original(combatant) || [];
            if (!combatant) return changes;

            const adhesive = (combatant.effects || []).find(effect => (
                effect.type === 'item' &&
                effect.id === 'adesivoalquimico' &&
                Number(effect.automation?.adhesiveCountdown) > 0
            ));
            if (adhesive) {
                adhesive.automation.adhesiveCountdown -= 1;
                if (adhesive.automation.adhesiveCountdown <= 0) {
                    combatant.effects = combatant.effects.filter(effect => effect !== adhesive);
                    global.addAutomationCondition?.(combatant, '🕸️');
                    changes.push(`${adhesive.name}: endureceu; ${combatant.name} ficou Grudado`);
                } else {
                    changes.push(`${adhesive.name}: endurece em ${adhesive.automation.adhesiveCountdown} turno`);
                }
            }

            const fissstechActive = (combatant.effects || []).some(effect => (
                effect.type === 'item' && effect.id === 'fissstech'
            ));
            if (combatant.automation?.fissstechWithdrawalPending && !fissstechActive) {
                const addictionStacks = Number(getCondition(combatant, '💉')?.stacks) || 0;
                const withdrawalStacks = Number(getCondition(combatant, '🥶')?.stacks) || 0;
                if (addictionStacks > withdrawalStacks) {
                    ensureStackCondition(combatant, '🥶', 1);
                    changes.push(`Abstinência de Fisstech: +1 pilha`);
                }
                combatant.automation.fissstechWithdrawalPending = false;
            }

            syncWithdrawalExhaustion(combatant);
            global.savePlayersToStorage?.();
            return changes;
        };
        wrapped.itemUseAutomationWrapped = true;
        global.processAutomatedTurnEffects = wrapped;
    }

    function getCombatSkillGroup(skillId) {
        return global.getCombatRollSkillGroup?.(skillId) || null;
    }

    function getItemConditionSkillModifier(combatant, skill) {
        const result = { total: 0, details: [], advantage: false, disadvantage: false };
        if (!combatant || !skill) return result;

        const skillId = String(skill.id || '');
        const combatGroup = getCombatSkillGroup(skillId);
        const attackOrDefense = ['meleeAttack', 'rangedAttack', 'block', 'dodge'].includes(combatGroup);
        const perceptionTest = ['perception', 'human_perception', 'deduction'].includes(skillId);

        if (getCondition(combatant, '🌀')) {
            const penalty = skillId === 'perception'
                ? -4
                : ['deduction', 'human_perception'].includes(skillId) ? -2 : 0;
            result.total += penalty;
            if (penalty) result.details.push(`Alucinado: ${penalty}`);
            if (attackOrDefense || perceptionTest) {
                result.disadvantage = true;
                result.details.push('Alucinado: desvantagem');
            }
        }

        if (getCondition(combatant, '🙈') && (attackOrDefense || perceptionTest)) {
            result.disadvantage = true;
            result.details.push('Cego: desvantagem; Percepção exclusivamente visual falha automaticamente');
        }

        if (getCondition(combatant, '🤪')) {
            if (['seduction', 'persuasion'].includes(skillId) || skill.attributeId === 'charisma') {
                result.total += 2;
                result.details.push('Alegria Delirante: +2 social');
            }
            if (['deduction', 'human_perception', 'resist_coercion'].includes(skillId)) {
                result.total -= 2;
                result.details.push('Alegria Delirante: −2 de discernimento');
            }
            if (skillId === 'courage') {
                result.advantage = true;
                result.details.push('Alegria Delirante: vantagem em Coragem');
            }
        }

        const withdrawalStacks = Number(getCondition(combatant, '🥶')?.stacks) || 0;
        if (withdrawalStacks === 1 && ['perception', 'tolerance'].includes(skillId)) {
            result.total -= 2;
            result.details.push('Abstinência 1: −2');
        } else if (withdrawalStacks >= 2) {
            result.total -= 2;
            result.details.push(`Abstinência ${withdrawalStacks}: −2 em todos os testes`);
        }
        if (withdrawalStacks >= 3) {
            result.disadvantage = true;
            result.details.push(`Abstinência ${withdrawalStacks}: desvantagem`);
        }

        const succubus = (combatant.effects || []).find(effect => effect.type === 'item' && effect.id === 'soprodesucubo');
        if (succubus?.automation?.succubusMode === 'skin' && skillId === 'seduction') {
            result.total += 2;
            result.details.push('Sopro de Súcubo na pele: +2');
        }
        if (succubus?.automation?.succubusMode === 'drink' && skillId === 'resist_coercion') {
            result.total -= 5;
            result.details.push('Sopro de Súcubo na bebida: −5');
        }

        if (result.advantage && result.disadvantage) {
            result.advantage = false;
            result.disadvantage = false;
            result.details.push('Vantagem e desvantagem se anulam');
        }
        return result;
    }

    function getItemConditionHealingMultiplier(combatant) {
        let multiplier = (combatant?.effects || []).some(effect => (
            (effect.type === 'item' && effect.id === 'fluidoesterilizante') ||
            (effect.type === 'condition' && effect.id === '🧴')
        )) ? 2 : 1;
        if ((Number(getCondition(combatant, '🥶')?.stacks) || 0) >= 4) multiplier *= 0.5;
        return multiplier;
    }

    function getItemConditionStaminaRecoveryMultiplier(combatant) {
        return (Number(getCondition(combatant, '🥶')?.stacks) || 0) >= 4 ? 0.5 : 1;
    }

    global.beginInventoryItemUseFlow = beginInventoryItemUseFlow;
    global.closeInventoryItemTargetModal = closeInventoryItemTargetModal;
    global.selectInventoryItemUseTarget = selectInventoryItemUseTarget;
    global.setAllInventoryItemUseTargets = setAllInventoryItemUseTargets;
    global.confirmInventoryItemUseTargets = confirmInventoryItemUseTargets;
    global.getPendingInventoryItemAutomationOptions = () => currentTargetOptions || {};
    global.getItemConditionSkillModifier = getItemConditionSkillModifier;
    global.getItemConditionHealingMultiplier = getItemConditionHealingMultiplier;
    global.getItemConditionStaminaRecoveryMultiplier = getItemConditionStaminaRecoveryMultiplier;
    global.itemUseAutomation = Object.freeze({
        targetedItemIds: Object.freeze([...TARGETED_ITEMS]),
        multiTargetItemIds: Object.freeze([...MULTI_TARGET_ITEMS]),
        getItemConditionSkillModifier,
        getItemConditionHealingMultiplier,
        getItemConditionStaminaRecoveryMultiplier
    });

    installInventoryApplicationWrapper();
    installTurnAutomationWrapper();
    global.addEventListener?.('load', installInventoryApplicationWrapper);
})(window);
