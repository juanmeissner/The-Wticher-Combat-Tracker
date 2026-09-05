(function initializeTemporalEffects(global) {
    'use strict';

    const TEMPORAL_EFFECT_VERSION = 1;
    const UNIT_MINUTES = Object.freeze({ minutes: 1, hours: 60, days: 1440, weeks: 10080 });
    const LEGACY_TEMPORAL_EFFECTS = Object.freeze({
        'item:elixirdepantagran': Object.freeze({ amount: 2, unit: 'hours', legacyTurns: 120 }),
        'ability:descanso_que_cura': Object.freeze({ amount: 1, unit: 'days' }),
        'ability:ritual_de_magia': Object.freeze({ amount: 5, unit: 'hours' }),
        'ability:telecomunicacao': Object.freeze({ amount: 1, unit: 'hours' }),
        'ability:sorte_do_capeta': Object.freeze({ amount: 1, unit: 'weeks' }),
        'ability:hex_corvo_faminto': Object.freeze({ amount: 2, unit: 'weeks' }),
        'ability:hex_murmurios_da_floresta': Object.freeze({ amount: 1, unit: 'weeks' }),
        'ability:hex_sede_cinzas': Object.freeze({ amount: 3, unit: 'days' }),
        'ability:hex_espelho_partido': Object.freeze({ amount: 1, unit: 'weeks' })
    });

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeDuration(value) {
        if (!value || typeof value !== 'object') return null;
        const unit = String(value.unit || '').toLowerCase();
        const amount = Number(value.amount);
        if (!UNIT_MINUTES[unit] || !Number.isFinite(amount) || amount <= 0) return null;
        return { unit, amount };
    }

    function durationToMinutes(value) {
        const duration = normalizeDuration(value);
        return duration ? Math.max(1, Math.round(duration.amount * UNIT_MINUTES[duration.unit])) : 0;
    }

    function getCurrentMinute() {
        return Number(global.campaignClock?.describeMinute?.().epochMinute) || 0;
    }

    function attachTemporalEffect(effect, duration, options = {}) {
        if (!effect) return null;
        const normalized = normalizeDuration(duration || effect.automation?.timeDuration || effect.timeDuration);
        if (!normalized) return null;
        const startedAtMinute = Number.isFinite(Number(options.startedAtMinute))
            ? Math.floor(Number(options.startedAtMinute))
            : getCurrentMinute();
        const durationMinutes = durationToMinutes(normalized);
        effect.temporal = {
            version: TEMPORAL_EFFECT_VERSION,
            unit: normalized.unit,
            amount: normalized.amount,
            startedAtMinute,
            expiresAtMinute: startedAtMinute + durationMinutes
        };
        effect.remainingTurns = 0;
        effect.initialTurns = 0;
        return effect.temporal;
    }

    function getCatalogDuration(effect) {
        const key = `${effect?.type || ''}:${effect?.id || ''}`;
        const source = effect?.type === 'ability'
            ? global.predefinedAbilities?.find?.(entry => entry.id === effect.id)
            : global.predefinedItems?.find?.(entry => entry.id === effect.id);
        return normalizeDuration(effect?.automation?.timeDuration)
            || normalizeDuration(effect?.timeDuration)
            || normalizeDuration(source?.timeDuration)
            || normalizeDuration(LEGACY_TEMPORAL_EFFECTS[key]);
    }

    function migrateTemporalEffects(combatants = global.combatants || []) {
        let changed = false;
        (Array.isArray(combatants) ? combatants : []).forEach(combatant => {
            (combatant.effects || []).forEach(effect => {
                if (effect.temporal?.expiresAtMinute) return;
                const duration = getCatalogDuration(effect);
                if (!duration) return;
                const legacy = LEGACY_TEMPORAL_EFFECTS[`${effect.type}:${effect.id}`];
                if (legacy?.legacyTurns && Number(effect.remainingTurns) !== legacy.legacyTurns && !effect.automation?.timeDuration) return;
                attachTemporalEffect(effect, duration);
                changed = true;
            });
        });
        if (changed) {
            global.savePlayersToStorage?.();
            global.persistCharacterCollections?.();
        }
        return changed;
    }

    function getTemporalEffectRemaining(effect, atMinute = getCurrentMinute()) {
        const expiresAtMinute = Number(effect?.temporal?.expiresAtMinute);
        if (!Number.isFinite(expiresAtMinute)) return null;
        return Math.max(0, Math.ceil(expiresAtMinute - Number(atMinute || 0)));
    }

    function formatCompactDuration(minutes) {
        const value = Math.max(0, Math.ceil(Number(minutes) || 0));
        if (value >= 1440 && value % 1440 === 0) return `${value / 1440}d`;
        if (value >= 60) {
            const hours = Math.floor(value / 60);
            const rest = value % 60;
            return rest ? `${hours}h ${rest}min` : `${hours}h`;
        }
        return `${value}min`;
    }

    function formatEffectDurationLabel(effect) {
        const remaining = getTemporalEffectRemaining(effect);
        if (remaining === null) {
            return Number(effect?.remainingTurns) === 0
                ? '∞ Permanente'
                : `${effect.remainingTurns} Rodadas`;
        }
        const expiry = global.campaignClock?.formatDateShort?.(effect.temporal.expiresAtMinute) || '';
        return `${formatCompactDuration(remaining)}${expiry ? ` · até ${expiry}` : ''}`;
    }

    function getExpiringEffects(combatants, afterMinute, beforeMinute = null) {
        const entries = [];
        (Array.isArray(combatants) ? combatants : []).forEach(combatant => {
            (combatant.effects || []).forEach(effect => {
                const expires = Number(effect?.temporal?.expiresAtMinute);
                if (!Number.isFinite(expires) || expires > afterMinute) return;
                if (beforeMinute !== null && expires <= beforeMinute) return;
                const linked = effect.automation?.linkedEffect;
                if (linked && (combatant.effects || []).some(parent => (
                    parent !== effect && parent.id === linked.id && parent.type === linked.type
                ))) return;
                entries.push({ combatant, effect, expiresAtMinute: expires });
            });
        });
        return entries;
    }

    function previewTemporalEffects(context) {
        const entries = getExpiringEffects(context.combatants, context.afterMinute, context.beforeMinute);
        if (!entries.length) return null;
        const labels = entries.slice(0, 4).map(entry => `${entry.effect.name} em ${entry.combatant.name}`);
        return {
            summary: `${entries.length} efeito${entries.length === 1 ? '' : 's'} em tempo real expirará${entries.length === 1 ? '' : 'ão'} (${labels.join(', ')}${entries.length > 4 ? '…' : ''})`,
            entries: entries.map(entry => ({ combatantId: entry.combatant.id, effectId: entry.effect.id, effectType: entry.effect.type }))
        };
    }

    function applyTemporalEffects(context) {
        migrateTemporalEffects(context.combatants);
        const entries = getExpiringEffects(context.combatants, context.afterMinute, context.beforeMinute);
        if (!entries.length) return null;
        const expired = [];
        entries.forEach(({ combatant, effect }) => {
            const linked = { id: effect.id, type: effect.type };
            combatant.effects = (combatant.effects || []).filter(current => {
                if (current === effect) return false;
                const parent = current.automation?.linkedEffect;
                return !(parent && parent.id === linked.id && parent.type === linked.type);
            });
            expired.push(`${effect.name} expirou em ${combatant.name}`);
        });
        global.savePlayersToStorage?.();
        global.persistCharacterCollections?.();
        global.renderList?.(false);
        global.renderAutomationCardSummaries?.();
        global.showToast?.(`⏳ ${expired.length} efeito${expired.length === 1 ? '' : 's'} expirado${expired.length === 1 ? '' : 's'}.`);
        return {
            summary: expired.length === 1
                ? '1 efeito temporal expirado'
                : `${expired.length} efeitos temporais expirados`,
            detail: `Efeitos encerrados:\n${expired.join('\n')}`,
            expired
        };
    }

    function getRecurringDamageCandidates(context) {
        if (context.source === 'combat-turn') return [];
        const roundMinutes = Math.max(1, Number(global.campaignClock?.getRoundMinutes?.()) || 1);
        const ticks = Math.floor(Math.max(0, Number(context.minutes) || 0) / roundMinutes);
        if (!ticks) return [];
        return (context.combatants || []).filter(combatant => (
            Number(combatant.hpCurrent) > 0 && (combatant.effects || []).some(effect => (
                effect.type === 'condition'
                && ['🩸', '🔥', '🐍'].includes(effect.id)
                && !global.getRecurringConditionPrevention?.(combatant, effect)
            ))
        )).map(combatant => ({ combatant, ticks }));
    }

    function previewRecurringDamage(context) {
        const candidates = getRecurringDamageCandidates(context);
        if (!candidates.length) return null;
        const ticks = candidates[0].ticks;
        return {
            summary: `${candidates.length} participante${candidates.length === 1 ? '' : 's'} possui${candidates.length === 1 ? '' : 'em'} dano recorrente (${ticks} ciclo${ticks === 1 ? '' : 's'} ${ticks === 1 ? 'possível' : 'possíveis'})`,
            requiresRecurringDamageDecision: true
        };
    }

    function applyRecurringDamage(context) {
        if (!context.processRecurringDamage || typeof global.applyRecurringCombatEffects !== 'function') return null;
        const candidates = getRecurringDamageCandidates(context);
        if (!candidates.length) return null;
        const details = [];
        let processedCycles = 0;
        candidates.forEach(({ combatant, ticks }) => {
            const beforeHp = Number(combatant.hpCurrent) || 0;
            let cycles = 0;
            for (let index = 0; index < ticks && Number(combatant.hpCurrent) > 0; index++) {
                const changes = global.applyRecurringCombatEffects(combatant) || [];
                if (!changes.length) break;
                cycles += 1;
            }
            processedCycles += cycles;
            details.push(`${combatant.name}: ${beforeHp} → ${combatant.hpCurrent} PV em ${cycles} ciclo${cycles === 1 ? '' : 's'}`);
        });
        return {
            summary: `Dano recorrente processado em ${processedCycles} ciclo${processedCycles === 1 ? '' : 's'}`,
            detail: `Dano recorrente durante o salto:\n${details.join('\n')}`
        };
    }

    global.campaignClock?.registerTimeProcessor?.({
        id: 'active-temporal-effects',
        name: 'Duração de efeitos',
        preview: previewTemporalEffects,
        apply: applyTemporalEffects
    });
    global.campaignClock?.registerTimeProcessor?.({
        id: 'recurring-damage-during-time-jump',
        name: 'Dano recorrente',
        preview: previewRecurringDamage,
        apply: applyRecurringDamage
    });

    const api = {
        TEMPORAL_EFFECT_VERSION,
        UNIT_MINUTES,
        normalizeDuration,
        durationToMinutes,
        attachTemporalEffect,
        migrateTemporalEffects,
        getTemporalEffectRemaining,
        formatEffectDurationLabel,
        getExpiringEffects,
        previewTemporalEffects,
        applyTemporalEffects,
        previewRecurringDamage,
        applyRecurringDamage
    };
    global.temporalEffects = api;
    global.attachTemporalEffect = attachTemporalEffect;
    global.migrateTemporalEffects = migrateTemporalEffects;
    global.getTemporalEffectRemaining = getTemporalEffectRemaining;
    global.formatEffectDurationLabel = formatEffectDurationLabel;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
