const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'campaign-daily-processing.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const processors = [];
let saves = 0;
let renders = 0;

const player = {
    id: 'geralt',
    name: 'Geralt',
    type: 'player',
    toxicityCurrent: 24,
    effects: [{ id: '💉', type: 'condition', stacks: 2 }],
    automation: { fissstechWithdrawalPending: true, fissstechWithdrawalDelay: null }
};
const monster = { id: 'grifo', name: 'Grifo', type: 'monster', effects: [] };
const careCalls = [];
const context = vm.createContext({
    console,
    globalThis: null,
    combatants: [player, monster],
    campaignClock: {
        registerTimeProcessor(processor) { processors.push(processor); }
    },
    careServices: {
        getCareEffect(combatant, statusId) {
            return combatant.effects.find(effect => effect.careStatusId === statusId) || null;
        },
        previewCareDayBoundary(combatant, boundary) {
            return combatant.type === 'player' ? { combatantId: combatant.id, closedDay: boundary / 1440 - 1 } : null;
        },
        processCareDayBoundary(combatant, boundary) {
            careCalls.push({ id: combatant.id, boundary });
            ['hungry', 'poor_hygiene', 'sleep_deprivation'].forEach(statusId => {
                let effect = this.getCareEffect(combatant, statusId);
                if (!effect) {
                    effect = { id: statusId, type: 'condition', careStatusId: statusId, stacks: 0 };
                    combatant.effects.push(effect);
                }
                effect.stacks += 1;
            });
            return { expiredBenefits: [] };
        }
    },
    toxicitySystem: {
        getToxicityCurrent: combatant => combatant.toxicityCurrent || 0,
        getAdjustedToxicityThresholds: () => ({ warning: 100 }),
        getToxicityTurnReduction: () => 6,
        processCombatantToxicityTurn(combatant) {
            combatant.toxicityCurrent = Math.max(0, combatant.toxicityCurrent - 6);
            return [{ damage: null }];
        }
    },
    advanceFissstechWithdrawal(combatant, elapsed) {
        const initial = combatant.automation.fissstechWithdrawalDelay ?? 10;
        const remaining = Math.max(0, initial - elapsed);
        combatant.automation.fissstechWithdrawalDelay = remaining || null;
        if (!remaining) combatant.automation.fissstechWithdrawalPending = false;
        return [remaining ? `restam ${remaining}` : 'Abstinência aplicada'];
    },
    getCriticalWoundRecoveries() { return []; },
    savePlayersToStorage() { saves += 1; },
    persistCharacterCollections() {},
    renderList() { renders += 1; },
    renderAutomationCardSummaries() {}
});
context.globalThis = context;
context.window = context;
vm.runInContext(source, context, { filename: 'campaign-daily-processing.js' });

const daily = context.campaignDailyProcessing;
assert.deepEqual(
    JSON.parse(JSON.stringify(daily.getDayBoundaries(1430, 4325))),
    [1440, 2880, 4320]
);
assert.deepEqual(processors.map(processor => processor.id), [
    'campaign-daily-needs',
    'campaign-narrative-toxicity',
    'campaign-fissstech-time',
    'campaign-critical-wound-recovery'
]);

const passage = {
    source: 'manual-jump',
    beforeMinute: 1430,
    afterMinute: 2890,
    minutes: 1460,
    combatants: [player, monster],
    processRecurringDamage: false
};
assert.match(daily.previewDailyNeeds(passage).summary, /2 viradas de dia/);
const needsResult = daily.applyDailyNeeds(passage);
assert.equal(careCalls.length, 2, 'Somente o jogador deve ser processado em cada meia-noite.');
assert.match(needsResult.detail, /Faminto 0 → 2/);

const toxicityResult = daily.applyNarrativeToxicity(passage);
assert.equal(player.toxicityCurrent, 12, 'A toxicidade deve cair uma vez por dia sem aplicar consequências não confirmadas.');
assert.match(toxicityResult.detail, /consequências não aplicadas/);

const fissstechResult = daily.applyFissstechTime(passage);
assert.equal(player.automation.fissstechWithdrawalPending, false);
assert.match(fissstechResult.detail, /Abstinência aplicada/);
assert.ok(saves > 0);
assert.ok(renders > 0);

const woundTarget = {
    id: 'ciri',
    name: 'Ciri',
    type: 'player',
    criticalWounds: [{
        woundId: 'simple-test',
        state: 'treated',
        treatment: { recovery: { completesAtMinute: 1500, status: 'active' } }
    }]
};
context.getCriticalWoundRecoveries = (_combatants, after, before) => (
    before < 1500 && after >= 1500
        ? [{ target: woundTarget, instance: woundTarget.criticalWounds[0], wound: { id: 'simple-test', name: 'Ferimento de teste' }, completesAtMinute: 1500 }]
        : []
);
context.completeCriticalWoundRecovery = (target, instance) => {
    instance.state = 'cured';
    return { combatantName: target.name, woundName: 'Ferimento de teste' };
};
const recoveryContext = { beforeMinute: 1490, afterMinute: 1510, combatants: [woundTarget] };
assert.match(daily.previewWoundRecovery(recoveryContext).summary, /1 recuperação/);
assert.match(daily.applyWoundRecovery(recoveryContext).detail, /Ciri: Ferimento de teste → Curado/);
assert.equal(woundTarget.criticalWounds[0].state, 'cured');

assert.match(indexSource, /js\/campaign-daily-processing\.js/);
assert.match(workerSource, /witcher-combat-tracker-v100/);
assert.match(workerSource, /js\/campaign-daily-processing\.js/);

console.log('✓ Necessidades diárias, toxicidade, Fisstech e recuperações temporais validados.');
