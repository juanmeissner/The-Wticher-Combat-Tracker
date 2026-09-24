(function initializeCharacterNeeds(global) {
    'use strict';

    const NEEDS_STATE_VERSION = 1;
    const NEED_MAXIMUM = 1000;
    const NEED_DECAY_PER_MINUTE = 1;
    const MANUAL_ADJUSTMENT_STEP = 50;
    const MAX_PROCESSED_TRANSACTIONS = 24;

    const NEED_CONDITION_THRESHOLDS = Object.freeze([
        Object.freeze({ maximum: 0, stacks: 3, label: 'Esgotado' }),
        Object.freeze({ maximum: 250, stacks: 2, label: 'Crítico' }),
        Object.freeze({ maximum: 500, stacks: 1, label: 'Baixo' })
    ]);

    const NEED_CONDITION_RULES = Object.freeze({
        hunger: Object.freeze({ statusId: 'hungry', statusName: 'Faminto', positiveStatusId: 'well_fed' }),
        thirst: Object.freeze({ statusId: 'dehydrated', statusName: 'Desidratado', positiveStatusId: '' }),
        sleep: Object.freeze({ statusId: 'sleep_deprivation', statusName: 'Privação de Sono', positiveStatusId: 'well_rested' }),
        hygiene: Object.freeze({ statusId: 'poor_hygiene', statusName: 'Falta de Higiene', positiveStatusId: 'refreshed' })
    });

    const NEED_BENEFIT_RULES = Object.freeze({
        hunger: Object.freeze({ statusId: 'well_fed', statusName: 'Bem Alimentado', minimumExclusive: 500 }),
        sleep: Object.freeze({ statusId: 'well_rested', statusName: 'Bem Descansado', minimumExclusive: 500 }),
        hygiene: Object.freeze({ statusId: 'refreshed', statusName: 'Revigorado', minimumExclusive: 500 })
    });

    const NEED_STATUS_IDS = Object.freeze({
        hungry: 'hunger',
        well_fed: 'hunger',
        dehydrated: 'thirst',
        sleep_deprivation: 'sleep',
        well_rested: 'sleep',
        poor_hygiene: 'hygiene',
        refreshed: 'hygiene'
    });

    const NEED_STATUS_ICONS = Object.freeze({
        '🍽️': 'hungry',
        '🍲': 'well_fed',
        '💧': 'dehydrated',
        '🥱': 'sleep_deprivation',
        '🌙': 'well_rested',
        '🧼': 'poor_hygiene',
        '🛁': 'refreshed'
    });

    const NEED_CRITICAL_CONSEQUENCES = Object.freeze({
        hunger: Object.freeze({
            title: 'Fome extrema',
            guidance: 'Teste de Tolerância e possível dano devem ser resolvidos pelo mestre.'
        }),
        thirst: Object.freeze({
            title: 'Desidratação extrema',
            guidance: 'Teste de Tolerância, possível dano e incapacidade devem ser resolvidos pelo mestre.'
        }),
        sleep: Object.freeze({
            title: 'Exaustão extrema',
            guidance: 'Teste para permanecer acordado e possível inconsciência devem ser resolvidos pelo mestre.'
        }),
        hygiene: Object.freeze({
            title: 'Higiene crítica',
            guidance: 'Risco de doença ou infecção deve ser avaliado e resolvido pelo mestre.'
        })
    });

    const NEED_DEFINITIONS = Object.freeze([
        Object.freeze({ id: 'hunger', name: 'Fome', icon: '🍖' }),
        Object.freeze({ id: 'thirst', name: 'Sede', icon: '💧' }),
        Object.freeze({ id: 'sleep', name: 'Sono', icon: '🌙' }),
        Object.freeze({ id: 'hygiene', name: 'Higiene', icon: '🧼' })
    ]);

    function clampNeedValue(value) {
        return Math.min(NEED_MAXIMUM, Math.max(0, Math.round(Number(value) || 0)));
    }

    function createInitialNeedsState(referenceMinute = null) {
        return {
            version: NEEDS_STATE_VERSION,
            maximum: NEED_MAXIMUM,
            decayPerMinute: NEED_DECAY_PER_MINUTE,
            values: Object.fromEntries(NEED_DEFINITIONS.map(definition => [definition.id, NEED_MAXIMUM])),
            updatedAtMinute: Number.isFinite(Number(referenceMinute)) ? Math.floor(Number(referenceMinute)) : null,
            processedTransactions: []
        };
    }

    function normalizeNeedsState(source, referenceMinute = null) {
        const initial = createInitialNeedsState(referenceMinute);
        const current = source && typeof source === 'object' ? source : {};
        const values = current.values && typeof current.values === 'object' ? current.values : {};
        return {
            ...initial,
            ...current,
            version: NEEDS_STATE_VERSION,
            maximum: NEED_MAXIMUM,
            decayPerMinute: NEED_DECAY_PER_MINUTE,
            values: Object.fromEntries(NEED_DEFINITIONS.map(definition => [
                definition.id,
                values[definition.id] === undefined
                    ? NEED_MAXIMUM
                    : clampNeedValue(values[definition.id])
            ])),
            updatedAtMinute: Number.isFinite(Number(current.updatedAtMinute))
                ? Math.floor(Number(current.updatedAtMinute))
                : initial.updatedAtMinute,
            processedTransactions: Array.isArray(current.processedTransactions)
                ? current.processedTransactions.map(String).slice(-MAX_PROCESSED_TRANSACTIONS)
                : []
        };
    }

    function ensureNeedsState(combatant, referenceMinute = null) {
        if (!combatant || (combatant.type && combatant.type !== 'player')) return null;
        combatant.needsState = normalizeNeedsState(combatant.needsState, referenceMinute);
        return combatant.needsState;
    }

    function serializeNeedsState(combatant) {
        const state = ensureNeedsState(combatant);
        return state ? JSON.parse(JSON.stringify(state)) : null;
    }

    function getNeedValue(combatant, needId) {
        const state = ensureNeedsState(combatant);
        if (!state || !NEED_DEFINITIONS.some(definition => definition.id === needId)) return 0;
        return clampNeedValue(state.values[needId]);
    }

    function getNeedPercentage(combatant, needId) {
        return Math.round((getNeedValue(combatant, needId) / NEED_MAXIMUM) * 100);
    }

    function getNeedTone(value) {
        const percentage = Math.round((clampNeedValue(value) / NEED_MAXIMUM) * 100);
        if (percentage <= 0) return 'critical';
        if (percentage < 25) return 'danger';
        if (percentage < 50) return 'warning';
        if (percentage < 75) return 'attention';
        return 'healthy';
    }

    function getNeedConditionStacks(value) {
        const normalized = clampNeedValue(value);
        return NEED_CONDITION_THRESHOLDS.find(threshold => normalized <= threshold.maximum)?.stacks || 0;
    }

    function getNeedConditionState(needId, value) {
        const rule = NEED_CONDITION_RULES[String(needId)];
        if (!rule) return null;
        const normalized = clampNeedValue(value);
        const threshold = NEED_CONDITION_THRESHOLDS.find(entry => normalized <= entry.maximum) || null;
        return {
            ...rule,
            needId: String(needId),
            value: normalized,
            percentage: Math.round((normalized / NEED_MAXIMUM) * 100),
            stacks: threshold?.stacks || 0,
            severity: threshold?.label || 'Saudável'
        };
    }

    function getNeedBenefitState(needId, value) {
        const rule = NEED_BENEFIT_RULES[String(needId)];
        if (!rule) return null;
        const normalized = clampNeedValue(value);
        return {
            ...rule,
            needId: String(needId),
            value: normalized,
            percentage: Math.round((normalized / NEED_MAXIMUM) * 100),
            active: normalized > rule.minimumExclusive
        };
    }

    function getCriticalNeedState(needId, value) {
        const rule = NEED_CRITICAL_CONSEQUENCES[String(needId)];
        if (!rule || clampNeedValue(value) > 0) return null;
        const definition = NEED_DEFINITIONS.find(entry => entry.id === String(needId));
        return {
            needId: String(needId),
            needName: definition?.name || String(needId),
            icon: definition?.icon || '⚠️',
            ...rule
        };
    }

    function getNeedEffectStatusId(effect) {
        const explicit = String(effect?.automation?.careStatusId || '');
        if (NEED_STATUS_IDS[explicit]) return explicit;
        return NEED_STATUS_ICONS[String(effect?.id || '')] || '';
    }

    function formatTemporaryResources(effect) {
        const temporaryHp = Math.max(0, Number(effect?.automation?.temporaryHp) || 0);
        const temporarySt = Math.max(0, Number(effect?.automation?.temporarySt) || 0);
        const resources = [];
        if (temporaryHp) resources.push(`${temporaryHp} PV temporários`);
        if (temporarySt) resources.push(`${temporarySt} EST temporários`);
        return resources.length ? ` Mantém ${resources.join(' e ')}.` : '';
    }

    function getNeedEffectDescription(combatant, effect) {
        const statusId = getNeedEffectStatusId(effect);
        const needId = NEED_STATUS_IDS[statusId];
        if (!needId || !combatant) return '';

        const definition = NEED_DEFINITIONS.find(entry => entry.id === needId);
        const percentage = getNeedPercentage(combatant, needId);
        const stacks = Math.max(0, Number(effect?.stacks) || 0);
        const critical = getCriticalNeedState(needId, getNeedValue(combatant, needId));
        const prefix = `${definition?.name || needId} em ${percentage}%.`;

        if (statusId === 'hungry') {
            return `${prefix} Penalidade atual: −${stacks} em perícias físicas.${critical ? ` ${critical.title}: ${critical.guidance}` : ''}`;
        }
        if (statusId === 'dehydrated') {
            return `${prefix} Penalidade atual: −${stacks} em perícias físicas e de concentração.${critical ? ` ${critical.title}: ${critical.guidance}` : ''}`;
        }
        if (statusId === 'sleep_deprivation') {
            return `${prefix} Penalidade atual: −${stacks} em perícias físicas e de concentração, incluindo Físico.${critical ? ` ${critical.title}: ${critical.guidance}` : ''}`;
        }
        if (statusId === 'poor_hygiene') {
            return `${prefix} Penalidade atual: −${stacks} em Aparência e Estilo, Persuasão, Sedução e Etiqueta Social.${critical ? ` ${critical.title}: ${critical.guidance}` : ''}`;
        }
        if (statusId === 'well_fed') {
            return `${prefix} Bem Alimentado está ativo.${formatTemporaryResources(effect)}`;
        }
        if (statusId === 'well_rested') {
            return `${prefix} Bem Descansado está ativo.${formatTemporaryResources(effect)}`;
        }
        if (statusId === 'refreshed') {
            const direct = effect?.automation?.directSkillBonuses || {};
            const bonuses = [
                ['Sedução', 'seduction'],
                ['Persuasão', 'persuasion'],
                ['Belas Artes', 'fine_arts'],
                ['Aparência e Estilo', 'appearance_style']
            ].map(([name, skillId]) => `${name} +${stacks + Math.max(0, Number(direct[skillId]) || 0)}`);
            return `${prefix} Bônus atuais: ${bonuses.join(', ')}.${formatTemporaryResources(effect)}`;
        }
        return '';
    }

    function removePersistedBenefit(combatant, statusId) {
        const benefits = combatant?.careState?.benefits;
        if (!benefits || typeof benefits !== 'object') return;
        delete benefits[statusId];
    }

    function syncNeedConditions(combatant, options = {}) {
        if (!combatant || !global.careServices) {
            return { changed: false, available: Boolean(global.careServices), changes: [] };
        }
        if (!Array.isArray(combatant.effects)) combatant.effects = [];
        const state = ensureNeedsState(combatant, options.referenceMinute);
        if (!state) return { changed: false, available: true, changes: [] };

        const changes = [];
        let changed = false;
        NEED_DEFINITIONS.forEach(definition => {
            const condition = getNeedConditionState(definition.id, state.values[definition.id]);
            const previous = global.careServices.getCareEffect?.(combatant, condition.statusId);
            const previousStacks = Math.max(0, Number(previous?.stacks) || 0);
            const previousSystemManaged = String(previous?.systemManaged || '');

            if (condition.stacks <= 0) {
                const removed = global.careServices.removeCareStatus?.(combatant, condition.statusId);
                if (removed) {
                    changed = true;
                    changes.push({
                        needId: definition.id,
                        needName: definition.name,
                        statusId: condition.statusId,
                        statusName: condition.statusName,
                        beforeStacks: previousStacks,
                        afterStacks: 0,
                        action: 'removed'
                    });
                }
                return;
            }

            const result = global.careServices.setCareStatus?.(
                combatant,
                condition.statusId,
                condition.stacks,
                {
                    id: `continuous-${definition.id}`,
                    note: `Controlado automaticamente pela barra de ${definition.name}.`
                },
                false
            );
            if (!result?.effect) return;
            result.effect.systemManaged = 'care-needs';
            result.effect.automation = {
                ...(result.effect.automation || {}),
                continuousNeedId: definition.id,
                continuousNeedValue: condition.value,
                continuousNeedPercentage: condition.percentage,
                continuousNeedSeverity: condition.severity
            };
            if (previousStacks !== condition.stacks) {
                changed = true;
                changes.push({
                    needId: definition.id,
                    needName: definition.name,
                    statusId: condition.statusId,
                    statusName: condition.statusName,
                    beforeStacks: previousStacks,
                    afterStacks: condition.stacks,
                    action: previousStacks ? 'updated' : 'applied'
                });
            }
            if (previousSystemManaged !== 'care-needs') changed = true;
        });

        Object.entries(NEED_BENEFIT_RULES).forEach(([needId, rule]) => {
            const benefit = getNeedBenefitState(needId, state.values[needId]);
            const effect = global.careServices.getCareEffect?.(combatant, rule.statusId);
            if (!effect) return;

            if (!benefit.active) {
                const removed = global.careServices.removeCareStatus?.(combatant, rule.statusId);
                if (!removed) return;
                removePersistedBenefit(combatant, rule.statusId);
                changed = true;
                changes.push({
                    needId,
                    needName: NEED_DEFINITIONS.find(entry => entry.id === needId)?.name || needId,
                    statusId: rule.statusId,
                    statusName: rule.statusName,
                    beforeStacks: Math.max(0, Number(removed.stacks) || 0),
                    afterStacks: 0,
                    action: 'expired',
                    kind: 'benefit'
                });
                return;
            }

            effect.automation = {
                ...(effect.automation || {}),
                careDurationMode: 'need-threshold',
                continuousNeedId: needId,
                continuousNeedMinimumExclusive: rule.minimumExclusive,
                continuousNeedPercentage: benefit.percentage
            };
        });

        if (changed && options.refresh !== false) {
            global.refreshCombatantPanel?.(String(combatant.id), 'effects');
        }
        return { changed, available: true, changes };
    }

    function getNeedSummaries(combatant) {
        const state = ensureNeedsState(combatant);
        if (!state) return [];
        return NEED_DEFINITIONS.map(definition => {
            const value = clampNeedValue(state.values[definition.id]);
            return {
                ...definition,
                value,
                maximum: NEED_MAXIMUM,
                percentage: Math.round((value / NEED_MAXIMUM) * 100),
                tone: getNeedTone(value),
                condition: getNeedConditionState(definition.id, value),
                benefit: getNeedBenefitState(definition.id, value),
                critical: getCriticalNeedState(definition.id, value)
            };
        });
    }

    function hasProcessedTransaction(state, transactionId) {
        return Boolean(transactionId && state.processedTransactions.includes(String(transactionId)));
    }

    function rememberTransaction(state, transactionId) {
        if (!transactionId) return;
        const normalized = String(transactionId);
        state.processedTransactions = state.processedTransactions
            .filter(entry => entry !== normalized)
            .concat(normalized)
            .slice(-MAX_PROCESSED_TRANSACTIONS);
    }

    function getPlayers(context) {
        return (context?.combatants || []).filter(combatant => combatant?.type === 'player');
    }

    function isNeedPaused(context, combatant, needId) {
        const paused = context?.pausedNeeds?.[needId];
        if (paused === true || paused === '*') return true;
        return Array.isArray(paused) && paused.some(combatantId => (
            String(combatantId) === String(combatant?.id)
        ));
    }

    function previewNeedsDecay(context) {
        const minutes = Math.max(0, Math.floor(Number(context?.minutes) || 0));
        const players = getPlayers(context);
        if (!minutes || !players.length) return null;
        const amount = Math.min(NEED_MAXIMUM, minutes * NEED_DECAY_PER_MINUTE);
        const pausedNames = NEED_DEFINITIONS
            .filter(definition => players.every(player => isNeedPaused(context, player, definition.id)))
            .map(definition => definition.name);
        const activeNames = NEED_DEFINITIONS
            .filter(definition => !pausedNames.includes(definition.name))
            .map(definition => definition.name);
        const forecasts = players.map(player => {
            const state = normalizeNeedsState(player.needsState, context.beforeMinute);
            const needs = NEED_DEFINITIONS.map(definition => {
                const before = clampNeedValue(state.values[definition.id]);
                const after = isNeedPaused(context, player, definition.id)
                    ? before
                    : clampNeedValue(before - amount);
                const beforeCondition = getNeedConditionState(definition.id, before);
                const afterCondition = getNeedConditionState(definition.id, after);
                const benefit = NEED_BENEFIT_RULES[definition.id];
                const activeBenefit = benefit
                    ? global.careServices?.getCareEffect?.(player, benefit.statusId)
                    : null;
                return {
                    ...definition,
                    before,
                    after,
                    beforePercentage: Math.round((before / NEED_MAXIMUM) * 100),
                    afterPercentage: Math.round((after / NEED_MAXIMUM) * 100),
                    paused: isNeedPaused(context, player, definition.id),
                    beforeStacks: beforeCondition?.stacks || 0,
                    afterStacks: afterCondition?.stacks || 0,
                    benefitExpiring: Boolean(activeBenefit && benefit && after <= benefit.minimumExclusive),
                    critical: before > 0 && after === 0 ? getCriticalNeedState(definition.id, after) : null
                };
            });
            return { id: player.id, name: player.name, needs };
        });
        const thresholdCrossings = forecasts.flatMap(entry => entry.needs)
            .filter(entry => entry.beforeStacks !== entry.afterStacks || entry.benefitExpiring);
        const criticalConsequences = forecasts.flatMap(entry => entry.needs)
            .filter(entry => entry.critical)
            .map(entry => entry.critical);
        const detail = forecasts.map(entry => (
            `${entry.name}: ${entry.needs.map(need => `${need.name} ${need.beforePercentage}% → ${need.afterPercentage}%${need.paused ? ' (pausado)' : ''}`).join(' · ')}`
        )).join('\n');
        const warning = criticalConsequences.length
            ? ` · ⚠️ ${criticalConsequences.length} estado${criticalConsequences.length === 1 ? '' : 's'} crítico${criticalConsequences.length === 1 ? '' : 's'} exigirá${criticalConsequences.length === 1 ? '' : 'ão'} resolução do mestre`
            : thresholdCrossings.length
                ? ` · ${thresholdCrossings.length} limiar${thresholdCrossings.length === 1 ? '' : 'es'} será${thresholdCrossings.length === 1 ? '' : 'ão'} cruzado${thresholdCrossings.length === 1 ? '' : 's'}`
                : '';
        return {
            summary: `${players.length} personagem${players.length === 1 ? '' : 'ns'} perderá${players.length === 1 ? '' : 'ão'} até ${amount} ponto${amount === 1 ? '' : 's'} de ${activeNames.join(', ') || 'necessidades'}${pausedNames.length ? `; ${pausedNames.join(', ')} pausado${pausedNames.length === 1 ? '' : 's'}` : ''}${warning}`,
            detail,
            participants: players.map(player => ({ id: player.id, name: player.name })),
            minutes,
            amount,
            forecasts,
            thresholdCrossings,
            criticalConsequences,
            severity: criticalConsequences.length ? 'critical' : thresholdCrossings.length ? 'warning' : 'normal'
        };
    }

    function applyNeedsDecay(context) {
        const minutes = Math.max(0, Math.floor(Number(context?.minutes) || 0));
        const players = getPlayers(context);
        if (!minutes || !players.length) return null;

        const amount = minutes * NEED_DECAY_PER_MINUTE;
        const changes = [];
        let initialized = false;

        players.forEach(player => {
            const hadState = Boolean(player.needsState && typeof player.needsState === 'object');
            const state = ensureNeedsState(player, context.beforeMinute);
            initialized ||= !hadState;
            if (hasProcessedTransaction(state, context.transactionId)) return;

            const before = Object.fromEntries(NEED_DEFINITIONS.map(definition => [
                definition.id,
                clampNeedValue(state.values[definition.id])
            ]));
            NEED_DEFINITIONS.forEach(definition => {
                state.values[definition.id] = isNeedPaused(context, player, definition.id)
                    ? before[definition.id]
                    : clampNeedValue(before[definition.id] - amount);
            });
            state.updatedAtMinute = Number.isFinite(Number(context.afterMinute))
                ? Math.floor(Number(context.afterMinute))
                : state.updatedAtMinute;
            rememberTransaction(state, context.transactionId);

            const valueChanged = NEED_DEFINITIONS.some(definition => (
                state.values[definition.id] !== before[definition.id]
            ));
            const conditionResult = syncNeedConditions(player, {
                refresh: false,
                referenceMinute: context.afterMinute
            });
            if (!valueChanged && !conditionResult.changed) return;
            const criticalConsequences = NEED_DEFINITIONS
                .filter(definition => before[definition.id] > 0 && state.values[definition.id] === 0)
                .map(definition => getCriticalNeedState(definition.id, 0))
                .filter(Boolean);
            changes.push({
                player,
                before,
                after: { ...state.values },
                conditionChanges: conditionResult.changes,
                criticalConsequences
            });
        });

        if (!changes.length && !initialized) return null;

        global.savePlayersToStorage?.();
        changes.forEach(({ player }) => {
            global.refreshCombatantPanel?.(String(player.id), 'resources');
        });
        changes.filter(change => change.conditionChanges.length).forEach(({ player }) => {
            global.refreshCombatantPanel?.(String(player.id), 'effects');
        });

        const detail = changes.map(({ player, before, after, criticalConsequences }) => {
            const values = NEED_DEFINITIONS.map(definition => {
                const initialPercentage = Math.round((before[definition.id] / NEED_MAXIMUM) * 100);
                const finalPercentage = Math.round((after[definition.id] / NEED_MAXIMUM) * 100);
                const paused = isNeedPaused(context, player, definition.id) ? ' · pausado' : '';
                return `${definition.name} ${initialPercentage}% → ${finalPercentage}%${paused}`;
            });
            const critical = criticalConsequences.length
                ? `\n⚠️ ${criticalConsequences.map(entry => `${entry.title}: ${entry.guidance}`).join(' · ')}`
                : '';
            return `${player.name}: ${values.join(' · ')}${critical}`;
        }).join('\n');

        const relevantChanges = changes.flatMap(change => change.conditionChanges || []);
        const criticalConsequences = changes.flatMap(change => (
            change.criticalConsequences.map(entry => ({ ...entry, combatantId: change.player.id, combatantName: change.player.name }))
        ));
        if ((relevantChanges.length || criticalConsequences.length) && typeof global.addCombatHistoryEntry === 'function') {
            const participants = changes.map(change => ({ id: change.player.id, name: change.player.name }));
            global.addCombatHistoryEntry(
                'Necessidades: limiares atualizados',
                detail,
                {
                    type: 'condition',
                    participants,
                    condition: { id: 'continuous-needs', name: 'Fome, Sede, Sono e Higiene' }
                }
            );
        }

        return {
            summary: `Necessidades processadas por ${minutes} minuto${minutes === 1 ? '' : 's'} para ${changes.length} personagem${changes.length === 1 ? '' : 'ns'}`,
            detail: detail ? `Fome, Sede, Sono e Higiene:\n${detail}` : '',
            minutes,
            amount,
            participants: changes.length,
            conditionChanges: relevantChanges,
            criticalConsequences
        };
    }

    function restoreNeeds(combatant, recovery = {}, options = {}) {
        const state = ensureNeedsState(
            combatant,
            options.referenceMinute ?? global.campaignClock?.describeMinute?.().epochMinute
        );
        if (!state) return { changed: false, combatant, changes: [] };

        const changes = NEED_DEFINITIONS.map(definition => {
            const requested = Math.max(0, Math.round(Number(recovery?.[definition.id]) || 0));
            if (!requested) return null;
            const before = clampNeedValue(state.values[definition.id]);
            const after = clampNeedValue(before + requested);
            state.values[definition.id] = after;
            return {
                ...definition,
                requested,
                applied: after - before,
                before,
                after,
                beforePercentage: Math.round((before / NEED_MAXIMUM) * 100),
                afterPercentage: Math.round((after / NEED_MAXIMUM) * 100)
            };
        }).filter(Boolean);

        const valuesChanged = changes.some(change => change.applied > 0);
        state.updatedAtMinute = Number.isFinite(Number(options.referenceMinute))
            ? Math.floor(Number(options.referenceMinute))
            : (Number(global.campaignClock?.describeMinute?.().epochMinute) || state.updatedAtMinute);

        const conditionResult = syncNeedConditions(combatant, {
            refresh: false,
            referenceMinute: state.updatedAtMinute
        });
        const changed = valuesChanged || conditionResult.changed;
        if (!changed) return { changed: false, combatant, changes, conditionChanges: conditionResult.changes };

        if (options.persist !== false) global.savePlayersToStorage?.();
        if (options.refresh !== false) {
            global.refreshCombatantPanel?.(String(combatant.id), 'resources');
            if (conditionResult.changed) global.refreshCombatantPanel?.(String(combatant.id), 'effects');
        }
        return { changed: true, combatant, changes, conditionChanges: conditionResult.changes };
    }

    function findCombatant(combatantId) {
        const entries = typeof combatants !== 'undefined' && Array.isArray(combatants)
            ? combatants
            : (Array.isArray(global.combatants) ? global.combatants : []);
        return entries.find(entry => String(entry?.id) === String(combatantId)) || null;
    }

    function adjustNeed(combatantOrId, needId, delta, options = {}) {
        const combatant = combatantOrId && typeof combatantOrId === 'object'
            ? combatantOrId
            : findCombatant(combatantOrId);
        const definition = NEED_DEFINITIONS.find(entry => entry.id === String(needId));
        if (!combatant || combatant.type !== 'player' || !definition) return null;

        const state = ensureNeedsState(combatant, global.campaignClock?.describeMinute?.().epochMinute);
        const before = clampNeedValue(state.values[definition.id]);
        const after = clampNeedValue(before + Number(delta || 0));
        if (before === after) return { changed: false, combatant, definition, before, after };

        state.values[definition.id] = after;
        state.updatedAtMinute = Number(global.campaignClock?.describeMinute?.().epochMinute) || state.updatedAtMinute;
        const conditionResult = syncNeedConditions(combatant, { refresh: false });
        global.savePlayersToStorage?.();
        global.refreshCombatantPanel?.(String(combatant.id), 'resources');
        if (conditionResult.changed) global.refreshCombatantPanel?.(String(combatant.id), 'effects');

        if (!options.silent) {
            const beforePercentage = Math.round((before / NEED_MAXIMUM) * 100);
            const afterPercentage = Math.round((after / NEED_MAXIMUM) * 100);
            global.addCombatHistoryEntry?.(
                `${combatant.name}: ${definition.name} ${beforePercentage}% → ${afterPercentage}%`,
                `${definition.name}: ${before}/${NEED_MAXIMUM} → ${after}/${NEED_MAXIMUM} · ajuste manual`,
                {
                    type: 'participant',
                    source: { id: combatant.id, name: combatant.name },
                    target: { id: combatant.id, name: combatant.name },
                    resource: { key: definition.id, before, after, delta: after - before }
                }
            );
            global.showToast?.(`${definition.icon} ${definition.name}: ${beforePercentage}% → ${afterPercentage}%.`);
        }

        return { changed: true, combatant, definition, before, after, conditionChanges: conditionResult.changes };
    }

    function adjustNeedByStep(combatantId, needId, direction) {
        if (global.collaborationSession?.isPlayer?.()) {
            global.showToast?.('🔒 O mestre controla os ajustes manuais das necessidades.');
            return false;
        }
        const combatant = findCombatant(combatantId);
        const definition = NEED_DEFINITIONS.find(entry => entry.id === String(needId));
        if (!combatant || !definition) return false;
        const delta = Number(direction) < 0 ? -MANUAL_ADJUSTMENT_STEP : MANUAL_ADJUSTMENT_STEP;
        const before = getNeedValue(combatant, definition.id);
        const after = clampNeedValue(before + delta);
        if (before === after) return false;
        const beforePercentage = Math.round((before / NEED_MAXIMUM) * 100);
        const afterPercentage = Math.round((after / NEED_MAXIMUM) * 100);
        const label = `${combatant.name}: ${definition.name} ${beforePercentage}% → ${afterPercentage}%`;
        const detail = `${definition.name}: ${before}/${NEED_MAXIMUM} → ${after}/${NEED_MAXIMUM} · ajuste manual`;
        const action = () => adjustNeed(combatant, definition.id, delta, { silent: true });
        const metadata = {
            type: 'participant',
            source: { id: combatant.id, name: combatant.name },
            target: { id: combatant.id, name: combatant.name },
            resource: { key: definition.id, before, after, delta: after - before }
        };

        if (typeof global.trackCombatAction === 'function') {
            global.trackCombatAction(label, action, detail, metadata);
        } else {
            action();
            global.addCombatHistoryEntry?.(label, detail, metadata);
        }
        global.showToast?.(`${definition.icon} ${definition.name}: ${beforePercentage}% → ${afterPercentage}%.`);
        return true;
    }

    global.campaignClock?.registerTimeProcessor?.({
        id: 'character-continuous-needs',
        name: 'Fome, Sede, Sono e Higiene',
        preview: previewNeedsDecay,
        apply: applyNeedsDecay
    });

    const api = Object.freeze({
        NEEDS_STATE_VERSION,
        NEED_MAXIMUM,
        NEED_DECAY_PER_MINUTE,
        MANUAL_ADJUSTMENT_STEP,
        NEED_DEFINITIONS,
        NEED_CONDITION_THRESHOLDS,
        NEED_CONDITION_RULES,
        NEED_BENEFIT_RULES,
        NEED_CRITICAL_CONSEQUENCES,
        createInitialNeedsState,
        normalizeNeedsState,
        ensureNeedsState,
        serializeNeedsState,
        getNeedValue,
        getNeedPercentage,
        getNeedTone,
        getNeedConditionStacks,
        getNeedConditionState,
        getNeedBenefitState,
        getCriticalNeedState,
        getNeedEffectDescription,
        getNeedSummaries,
        previewNeedsDecay,
        applyNeedsDecay,
        restoreNeeds,
        syncNeedConditions,
        adjustNeed,
        adjustNeedByStep
    });

    global.characterNeeds = api;
    global.adjustCharacterNeed = adjustNeedByStep;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
