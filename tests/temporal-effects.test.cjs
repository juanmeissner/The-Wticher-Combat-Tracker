const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
let currentMinute = 1000;
const processors = [];
let saves = 0;

global.campaignClock = {
    describeMinute: () => ({ epochMinute: currentMinute }),
    formatDateShort: minute => `minuto ${minute}`,
    getRoundMinutes: () => 2,
    registerTimeProcessor(value) { processors.push(value); }
};
global.savePlayersToStorage = () => { saves++; };
global.persistCharacterCollections = () => {};
global.renderList = () => {};
global.renderAutomationCardSummaries = () => {};
global.showToast = () => {};

const temporal = require(path.join(projectRoot, 'js', 'temporal-effects.js'));
assert.equal(temporal.TEMPORAL_EFFECT_VERSION, 1);
assert.equal(temporal.durationToMinutes({ amount: 2, unit: 'hours' }), 120);
assert.equal(temporal.durationToMinutes({ amount: 3, unit: 'days' }), 4320);
assert.deepEqual(processors.map(entry => entry.id), [
    'active-temporal-effects',
    'recurring-damage-during-time-jump'
]);

const direct = { id: 'ritual', type: 'ability', name: 'Ritual', remainingTurns: 10 };
temporal.attachTemporalEffect(direct, { amount: 1, unit: 'hours' });
assert.equal(direct.remainingTurns, 0);
assert.equal(direct.temporal.startedAtMinute, 1000);
assert.equal(direct.temporal.expiresAtMinute, 1060);
assert.match(temporal.formatEffectDurationLabel(direct), /1h/);

const legacy = {
    id: 1,
    name: 'Geralt',
    effects: [{ id: 'elixirdepantagran', type: 'item', name: 'Elixir de Pantagran', remainingTurns: 120 }]
};
assert.equal(temporal.migrateTemporalEffects([legacy]), true);
assert.equal(legacy.effects[0].temporal.expiresAtMinute, 1120);

const parent = legacy.effects[0];
legacy.effects.push({
    id: '🤪',
    type: 'condition',
    name: 'Alegria Delirante',
    remainingTurns: 0,
    automation: { linkedEffect: { id: parent.id, type: parent.type } }
});
const context = { beforeMinute: 1000, afterMinute: 1120, combatants: [legacy] };
const preview = temporal.previewTemporalEffects(context);
assert.match(preview.summary, /1 efeito/);
const result = temporal.applyTemporalEffects(context);
assert.equal(result.expired.length, 1);
assert.equal(legacy.effects.length, 0);
assert.equal(saves > 0, true);

const poisoned = { id: 2, name: 'Alvo', hpCurrent: 20, effects: [{ id: '🐍', type: 'condition' }] };
const recurringPreview = temporal.previewRecurringDamage({ source: 'manual-jump', minutes: 10, combatants: [poisoned] });
assert.equal(recurringPreview.requiresRecurringDamageDecision, true);
let recurringCalls = 0;
global.applyRecurringCombatEffects = target => {
    recurringCalls++;
    target.hpCurrent -= 1;
    return [{ summary: 'Veneno: 1 de dano' }];
};
temporal.applyRecurringDamage({ source: 'manual-jump', minutes: 10, combatants: [poisoned], processRecurringDamage: true });
assert.equal(recurringCalls, 5);
assert.equal(poisoned.hpCurrent, 15);

const rulesSource = fs.readFileSync(path.join(projectRoot, 'js', 'rules-automation.js'), 'utf8');
const itemSource = fs.readFileSync(path.join(projectRoot, 'js', 'items.js'), 'utf8');
const renderSource = fs.readFileSync(path.join(projectRoot, 'js', 'combat', 'combat-render.js'), 'utf8');
assert.match(rulesSource, /timeDuration: \{ amount: 2, unit: 'hours' \}/);
assert.match(rulesSource, /attachTemporalEffect/);
assert.match(itemSource, /timeDuration: \{ amount: 2, unit: 'hours' \}/);
assert.match(renderSource, /formatEffectDurationLabel/);

delete global.campaignClock;
delete global.savePlayersToStorage;
delete global.persistCharacterCollections;
delete global.renderList;
delete global.renderAutomationCardSummaries;
delete global.showToast;
delete global.applyRecurringCombatEffects;

console.log('✓ Durações em minutos, horas e dias, migração e expiração vinculada validadas.');
