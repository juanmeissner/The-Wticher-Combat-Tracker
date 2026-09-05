(function initializeCampaignDailyProcessing(global) {
    'use strict';

    const MINUTES_PER_DAY = 1440;
    const CARE_STATUS_IDS = Object.freeze(['hungry', 'poor_hygiene', 'sleep_deprivation']);

    function getDayBoundaries(beforeMinute, afterMinute) {
        const before = Math.floor(Number(beforeMinute) || 0);
        const after = Math.floor(Number(afterMinute) || 0);
        if (after <= before) return [];
        const boundaries = [];
        let boundary = (Math.floor(before / MINUTES_PER_DAY) + 1) * MINUTES_PER_DAY;
        while (boundary <= after) {
            boundaries.push(boundary);
            boundary += MINUTES_PER_DAY;
        }
        return boundaries;
    }

    function getPlayers(context) {
        return (context.combatants || []).filter(combatant => combatant?.type === 'player');
    }

    function getCareStacks(combatant) {
        return Object.fromEntries(CARE_STATUS_IDS.map(statusId => [
            statusId,
            Math.max(0, Number(global.careServices?.getCareEffect?.(combatant, statusId)?.stacks) || 0)
        ]));
    }

    function previewDailyNeeds(context) {
        const boundaries = getDayBoundaries(context.beforeMinute, context.afterMinute);
        const players = getPlayers(context);
        if (!boundaries.length || !players.length || !global.careServices?.previewCareDayBoundary) return null;
        const firstBoundary = boundaries[0];
        const affected = players.filter(player => global.careServices.previewCareDayBoundary(player, firstBoundary));
        if (!affected.length) return null;
        return {
            summary: `${boundaries.length} virada${boundaries.length === 1 ? '' : 's'} de dia verificará${boundaries.length === 1 ? '' : 'ão'} alimentação, higiene e sono de ${affected.length} personagem${affected.length === 1 ? '' : 'ns'}`,
            days: boundaries.length,
            participants: affected.map(player => ({ id: player.id, name: player.name }))
        };
    }

    function applyDailyNeeds(context) {
        const boundaries = getDayBoundaries(context.beforeMinute, context.afterMinute);
        const players = getPlayers(context);
        if (!boundaries.length || !players.length || !global.careServices?.processCareDayBoundary) return null;

        const before = new Map(players.map(player => [String(player.id), getCareStacks(player)]));
        const processed = new Map();
        boundaries.forEach(boundary => {
            players.forEach(player => {
                const result = global.careServices.processCareDayBoundary(player, boundary);
                if (!result) return;
                const entry = processed.get(String(player.id)) || { player, days: 0, expired: new Set() };
                entry.days += 1;
                result.expiredBenefits.forEach(statusId => entry.expired.add(statusId));
                processed.set(String(player.id), entry);
            });
        });
        if (!processed.size) return null;

        const statusLabels = {
            hungry: 'Faminto',
            poor_hygiene: 'Falta de Higiene',
            sleep_deprivation: 'Privação de Sono'
        };
        const details = [...processed.values()].map(entry => {
            const initial = before.get(String(entry.player.id));
            const final = getCareStacks(entry.player);
            const changes = CARE_STATUS_IDS.map(statusId => (
                `${statusLabels[statusId]} ${initial[statusId]} → ${final[statusId]}`
            ));
            if (entry.expired.size) changes.push(`${entry.expired.size} benefício(s) diário(s) encerrado(s)`);
            return `${entry.player.name} · ${entry.days} dia(s): ${changes.join(' · ')}`;
        });

        global.savePlayersToStorage?.();
        global.persistCharacterCollections?.();
        global.renderList?.(false);
        global.renderAutomationCardSummaries?.();
        return {
            summary: `Necessidades diárias processadas para ${processed.size} personagem${processed.size === 1 ? '' : 'ns'}`,
            detail: `Fechamento diário:\n${details.join('\n')}`,
            days: boundaries.length,
            participants: processed.size
        };
    }

    function getToxicityCandidates(context) {
        if (context.source === 'combat-turn') return [];
        const days = getDayBoundaries(context.beforeMinute, context.afterMinute).length;
        if (!days || !global.toxicitySystem) return [];
        return getPlayers(context).filter(player => global.toxicitySystem.getToxicityCurrent(player) > 0);
    }

    function previewNarrativeToxicity(context) {
        const candidates = getToxicityCandidates(context);
        if (!candidates.length) return null;
        const dangerous = candidates.filter(player => {
            const thresholds = global.toxicitySystem.getAdjustedToxicityThresholds(player);
            return global.toxicitySystem.getToxicityCurrent(player) >= thresholds.warning;
        });
        return {
            summary: `Toxicidade será reduzida em ${candidates.length} personagem${candidates.length === 1 ? '' : 'ns'}${dangerous.length ? `; ${dangerous.length} possui${dangerous.length === 1 ? '' : 'em'} consequências possíveis` : ''}`,
            requiresRecurringDamageDecision: dangerous.length > 0
        };
    }

    function applyNarrativeToxicity(context) {
        const candidates = getToxicityCandidates(context);
        const days = getDayBoundaries(context.beforeMinute, context.afterMinute).length;
        if (!candidates.length || !days) return null;
        const details = [];

        candidates.forEach(player => {
            const initial = global.toxicitySystem.getToxicityCurrent(player);
            let damage = 0;
            if (context.processRecurringDamage) {
                for (let index = 0; index < days && global.toxicitySystem.getToxicityCurrent(player) > 0; index++) {
                    const results = global.toxicitySystem.processCombatantToxicityTurn(player, { silent: true }) || [];
                    results.forEach(result => { damage += Number(result.damage?.damage) || 0; });
                }
            } else {
                const reduction = global.toxicitySystem.getToxicityTurnReduction(player) * days;
                player.toxicityCurrent = Math.max(0, initial - reduction);
            }
            const final = global.toxicitySystem.getToxicityCurrent(player);
            details.push(`${player.name}: ${initial}% → ${final}%${damage ? ` · ${damage} PV de dano` : context.processRecurringDamage ? '' : ' · consequências não aplicadas'}`);
        });

        global.savePlayersToStorage?.();
        return {
            summary: `Toxicidade narrativa processada em ${candidates.length} personagem${candidates.length === 1 ? '' : 'ns'}`,
            detail: `Toxicidade na passagem dos dias:\n${details.join('\n')}`
        };
    }

    function getFissstechTiming(combatant) {
        const effect = (combatant.effects || []).find(entry => entry.type === 'item' && entry.id === 'fissstech');
        const activeTurns = effect ? Math.max(0, Number(effect.remainingTurns) || 0) : 0;
        const pending = Boolean(combatant.automation?.fissstechWithdrawalPending);
        const rawDelay = combatant.automation?.fissstechWithdrawalDelay;
        const configuredDelay = Number(rawDelay);
        const withdrawalDelay = pending
            ? (rawDelay !== null && rawDelay !== undefined
                && Number.isInteger(configuredDelay) && configuredDelay >= 0 ? configuredDelay : 10)
            : 0;
        return { effect, activeTurns, pending, withdrawalDelay, totalUntilWithdrawal: activeTurns + withdrawalDelay };
    }

    function getFissstechCandidates(context) {
        if (context.source === 'combat-turn' || !global.advanceFissstechWithdrawal) return [];
        return getPlayers(context).map(player => ({ player, timing: getFissstechTiming(player) }))
            .filter(entry => entry.timing.effect || entry.timing.pending);
    }

    function previewFissstechTime(context) {
        const candidates = getFissstechCandidates(context);
        if (!candidates.length) return null;
        const triggering = candidates.filter(entry => entry.timing.pending && context.minutes >= entry.timing.totalUntilWithdrawal);
        return {
            summary: `Fisstech avançará em ${candidates.length} personagem${candidates.length === 1 ? '' : 'ns'}${triggering.length ? `; ${triggering.length} poderá${triggering.length === 1 ? '' : 'ão'} receber Abstinência` : ''}`
        };
    }

    function applyFissstechTime(context) {
        const candidates = getFissstechCandidates(context);
        if (!candidates.length) return null;
        const details = [];
        candidates.forEach(({ player, timing }) => {
            let elapsed = Math.max(0, Number(context.minutes) || 0);
            if (timing.effect) {
                if (timing.activeTurns > elapsed) {
                    timing.effect.remainingTurns = timing.activeTurns - elapsed;
                    timing.effect.initialTurns = Math.max(Number(timing.effect.initialTurns) || 0, timing.effect.remainingTurns);
                    details.push(`${player.name}: Fisstech permanece ativo por ${timing.effect.remainingTurns} turno(s)`);
                    elapsed = 0;
                } else {
                    elapsed -= timing.activeTurns;
                    player.effects = (player.effects || []).filter(effect => effect !== timing.effect);
                    details.push(`${player.name}: efeito de Fisstech encerrado`);
                }
            }
            if (elapsed > 0 && player.automation?.fissstechWithdrawalPending) {
                const changes = global.advanceFissstechWithdrawal(player, elapsed);
                details.push(...changes.map(change => `${player.name}: ${change}`));
            }
        });
        global.savePlayersToStorage?.();
        global.renderList?.(false);
        return details.length ? {
            summary: `Fisstech processado para ${candidates.length} personagem${candidates.length === 1 ? '' : 'ns'}`,
            detail: `Fisstech e Abstinência:\n${details.join('\n')}`
        } : null;
    }

    function previewWoundRecovery(context) {
        const entries = global.getCriticalWoundRecoveries?.(
            context.combatants,
            context.afterMinute,
            context.beforeMinute
        ) || [];
        if (!entries.length) return null;
        return {
            summary: `${entries.length} recuperação de ferimento será${entries.length === 1 ? '' : 'ão'} concluída${entries.length === 1 ? '' : 's'}`,
            entries: entries.map(entry => ({ combatantId: entry.target.id, woundId: entry.wound.id }))
        };
    }

    function applyWoundRecovery(context) {
        const entries = global.getCriticalWoundRecoveries?.(
            context.combatants,
            context.afterMinute,
            context.beforeMinute
        ) || [];
        if (!entries.length) return null;
        const completed = entries.map(entry => global.completeCriticalWoundRecovery?.(
            entry.target,
            entry.instance,
            entry.completesAtMinute
        )).filter(Boolean);
        if (!completed.length) return null;
        global.savePlayersToStorage?.();
        global.persistCharacterCollections?.();
        global.renderList?.(false);
        return {
            summary: `${completed.length} ferimento${completed.length === 1 ? '' : 's'} recuperado${completed.length === 1 ? '' : 's'}`,
            detail: `Recuperações concluídas:\n${completed.map(entry => `${entry.combatantName}: ${entry.woundName} → Curado`).join('\n')}`,
            completed
        };
    }

    global.campaignClock?.registerTimeProcessor?.({
        id: 'campaign-daily-needs',
        name: 'Necessidades diárias',
        preview: previewDailyNeeds,
        apply: applyDailyNeeds
    });
    global.campaignClock?.registerTimeProcessor?.({
        id: 'campaign-narrative-toxicity',
        name: 'Toxicidade narrativa',
        preview: previewNarrativeToxicity,
        apply: applyNarrativeToxicity
    });
    global.campaignClock?.registerTimeProcessor?.({
        id: 'campaign-fissstech-time',
        name: 'Fisstech e Abstinência',
        preview: previewFissstechTime,
        apply: applyFissstechTime
    });
    global.campaignClock?.registerTimeProcessor?.({
        id: 'campaign-critical-wound-recovery',
        name: 'Recuperação de ferimentos',
        preview: previewWoundRecovery,
        apply: applyWoundRecovery
    });

    const api = Object.freeze({
        MINUTES_PER_DAY,
        getDayBoundaries,
        previewDailyNeeds,
        applyDailyNeeds,
        previewNarrativeToxicity,
        applyNarrativeToxicity,
        getFissstechTiming,
        previewFissstechTime,
        applyFissstechTime,
        previewWoundRecovery,
        applyWoundRecovery
    });
    global.campaignDailyProcessing = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
