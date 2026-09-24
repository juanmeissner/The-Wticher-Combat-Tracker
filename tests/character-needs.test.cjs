const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'js', 'character-needs.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const equipmentCss = fs.readFileSync(path.join(projectRoot, 'equipment.css'), 'utf8');
const enhancementsSource = fs.readFileSync(path.join(projectRoot, 'js', 'enhancements.js'), 'utf8');
const sessionFeaturesSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
const realtimeSource = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'realtime-client.js'), 'utf8');

const processors = [];
let saves = 0;
let refreshes = 0;
const player = { id: 'ciri', name: 'Ciri', type: 'player' };
const monster = { id: 'grifo', name: 'Grifo', type: 'monster' };
const context = vm.createContext({
    console,
    globalThis: null,
    combatants: [player, monster],
    campaignClock: {
        registerTimeProcessor(processor) { processors.push(processor); },
        describeMinute() { return { epochMinute: 1000 }; }
    },
    savePlayersToStorage() { saves += 1; },
    refreshCombatantPanel(id, panel) {
        assert.equal(id, 'ciri');
        assert.equal(panel, 'resources');
        refreshes += 1;
    },
    addCombatHistoryEntry() {},
    showToast() {}
});
context.globalThis = context;
context.window = context;
vm.runInContext(source, context, { filename: 'character-needs.js' });

const needs = context.characterNeeds;
assert.ok(needs);
assert.equal(needs.NEED_MAXIMUM, 1000);
assert.equal(needs.NEED_DECAY_PER_MINUTE, 1);
assert.deepEqual(
    JSON.parse(JSON.stringify(needs.NEED_DEFINITIONS.map(entry => entry.id))),
    ['hunger', 'thirst', 'sleep', 'hygiene']
);
assert.deepEqual(processors.map(processor => processor.id), ['character-continuous-needs']);

const initial = needs.ensureNeedsState(player, 1000);
assert.deepEqual(
    JSON.parse(JSON.stringify(initial.values)),
    { hunger: 1000, thirst: 1000, sleep: 1000, hygiene: 1000 }
);
assert.equal(needs.getNeedPercentage(player, 'hunger'), 100);

const oneMinute = {
    transactionId: 'turn-1',
    source: 'combat-turn',
    beforeMinute: 1000,
    afterMinute: 1001,
    minutes: 1,
    combatants: [player, monster]
};
assert.match(needs.previewNeedsDecay(oneMinute).summary, /1 ponto/);
const firstResult = needs.applyNeedsDecay(oneMinute);
assert.equal(firstResult.amount, 1);
assert.deepEqual(
    JSON.parse(JSON.stringify(player.needsState.values)),
    { hunger: 999, thirst: 999, sleep: 999, hygiene: 999 }
);
assert.equal(saves, 1);
assert.equal(refreshes, 1);

assert.equal(needs.applyNeedsDecay(oneMinute), null, 'A mesma transação temporal não pode ser processada duas vezes.');
assert.equal(player.needsState.values.hunger, 999);
assert.equal(saves, 1);

const eightHours = {
    transactionId: 'jump-480',
    source: 'manual-jump',
    beforeMinute: 1001,
    afterMinute: 1481,
    minutes: 480,
    combatants: [player, monster]
};
needs.applyNeedsDecay(eightHours);
assert.equal(player.needsState.values.hunger, 519);
assert.equal(needs.getNeedPercentage(player, 'hunger'), 52);
assert.equal(needs.getNeedTone(519), 'attention');

assert.equal(needs.adjustNeed(player, 'hunger', 50, { silent: true }).after, 569);
assert.equal(needs.adjustNeed(player, 'hunger', 5000, { silent: true }).after, 1000);
assert.equal(needs.adjustNeed(player, 'hunger', -5000, { silent: true }).after, 0);
assert.equal(needs.getNeedTone(0), 'critical');
assert.match(needs.getCriticalNeedState('thirst', 0).guidance, /mestre/);
assert.equal(needs.getNeedBenefitState('hunger', 500).active, false);
assert.equal(needs.getNeedBenefitState('hunger', 501).active, true);
assert.equal(needs.getNeedBenefitState('sleep', 500).active, false);

const describedPlayer = {
    id: 'dynamic-description',
    name: 'Geralt',
    type: 'player',
    needsState: { values: { hunger: 500, thirst: 1000, sleep: 750, hygiene: 900 } }
};
const hungryDescription = needs.getNeedEffectDescription(describedPlayer, {
    id: '🍽️', stacks: 1, automation: { careStatusId: 'hungry' }
});
assert.match(hungryDescription, /Fome em 50%/);
assert.match(hungryDescription, /Penalidade atual: −1 em perícias físicas/);
assert.doesNotMatch(hungryDescription, /pilha/i);

const restedDescription = needs.getNeedEffectDescription(describedPlayer, {
    id: '🌙', stacks: 1, automation: { careStatusId: 'well_rested', temporaryHp: 10, temporarySt: 8 }
});
assert.match(restedDescription, /Sono em 75%/);
assert.match(restedDescription, /10 PV temporários e 8 EST temporários/);

const refreshedDescription = needs.getNeedEffectDescription(describedPlayer, {
    id: '🛁', stacks: 2, automation: {
        careStatusId: 'refreshed',
        directSkillBonuses: { seduction: 3, appearance_style: 3 }
    }
});
assert.match(refreshedDescription, /Higiene em 90%/);
assert.match(refreshedDescription, /Sedução \+5/);
assert.match(refreshedDescription, /Persuasão \+2/);

const criticalPreviewPlayer = {
    id: 'critical-preview',
    name: 'Lambert',
    type: 'player',
    needsState: { values: { hunger: 100, thirst: 700, sleep: 600, hygiene: 500 } }
};
const criticalPreview = needs.previewNeedsDecay({
    minutes: 120,
    beforeMinute: 1000,
    afterMinute: 1120,
    combatants: [criticalPreviewPlayer]
});
assert.equal(criticalPreview.severity, 'critical');
assert.equal(criticalPreview.criticalConsequences[0].needId, 'hunger');
assert.match(criticalPreview.detail, /Lambert: Fome 10% → 0%/);

const recoveringPlayer = {
    id: 'ciri',
    name: 'Ciri',
    type: 'player',
    needsState: needs.normalizeNeedsState({
        values: { hunger: 200, thirst: 300, sleep: 500, hygiene: 400 }
    }, 1481)
};
const recovery = needs.restoreNeeds(recoveringPlayer, { hunger: 720, thirst: 1000 }, {
    persist: false,
    refresh: false,
    referenceMinute: 1481
});
assert.equal(recovery.changed, true);
assert.deepEqual(
    JSON.parse(JSON.stringify(recoveringPlayer.needsState.values)),
    { hunger: 920, thirst: 1000, sleep: 500, hygiene: 400 },
    'Recuperações devem respeitar o teto de 1000 pontos.'
);
assert.equal(recovery.changes.find(change => change.id === 'thirst').applied, 700);

const savedSheet = { id: 'sheet-ciri', name: 'Ciri', needsState: { values: { thirst: 250 } } };
assert.equal(
    needs.restoreNeeds(savedSheet, { thirst: 480 }, { persist: false, refresh: false }).changes[0].after,
    730,
    'Fichas salvas fora do combate também devem receber recuperação por itens.'
);
assert.equal(needs.ensureNeedsState({ id: 'nekker', type: 'monster' }), null);

recoveringPlayer.needsState.values = { hunger: 500, thirst: 500, sleep: 500, hygiene: 500 };
const sleepingAdvance = {
    transactionId: 'sleep-480',
    source: 'care-sleep',
    beforeMinute: 1481,
    afterMinute: 1961,
    minutes: 480,
    combatants: [recoveringPlayer],
    pausedNeeds: { sleep: ['ciri'] }
};
assert.match(needs.previewNeedsDecay(sleepingAdvance).summary, /Sono pausado/);
const sleepingResult = needs.applyNeedsDecay(sleepingAdvance);
assert.deepEqual(
    JSON.parse(JSON.stringify(recoveringPlayer.needsState.values)),
    { hunger: 20, thirst: 20, sleep: 500, hygiene: 20 },
    'Dormir pausa Sono, mas Fome, Sede e Higiene continuam caindo.'
);
assert.match(sleepingResult.detail, /Sono 50% → 50% · pausado/);

needs.applyNeedsDecay({
    transactionId: 'jump-large',
    source: 'manual-jump',
    beforeMinute: 1481,
    afterMinute: 3481,
    minutes: 2000,
    combatants: [player]
});
assert.deepEqual(
    JSON.parse(JSON.stringify(player.needsState.values)),
    { hunger: 0, thirst: 0, sleep: 0, hygiene: 0 },
    'Necessidades nunca podem cair abaixo de zero.'
);

const migrated = needs.normalizeNeedsState({ values: { hunger: 320, thirst: 1200 } }, 500);
assert.deepEqual(
    JSON.parse(JSON.stringify(migrated.values)),
    { hunger: 320, thirst: 1000, sleep: 1000, hygiene: 1000 },
    'A migração deve preservar valores válidos e iniciar campos ausentes cheios.'
);

assert.ok(
    indexSource.indexOf('js/campaign-clock.js') < indexSource.indexOf('js/character-needs.js'),
    'As necessidades precisam carregar depois do relógio para registrar seu processador.'
);
assert.match(workerSource, /\.\/js\/character-needs\.js/);
assert.match(workerSource, /witcher-combat-tracker-v181/);
assert.match(equipmentCss, /character-needs-card/);
assert.match(equipmentCss, /character-need-meter/);
assert.match(enhancementsSource, /needsState/);
assert.match(sessionFeaturesSource, /combatants: cloneSessionData\(combatants\)/, 'Desfazer deve capturar as necessidades junto dos combatentes.');
assert.match(realtimeSource, /publishActiveCampaign/, 'A campanha com needsState deve seguir pelo sincronismo em tempo real.');
assert.match(
    fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8'),
    /getNeedEffectDescription/,
    'Os cards de efeitos devem usar a descrição dinâmica das necessidades.'
);

console.log('Character continuous needs tests passed.');
