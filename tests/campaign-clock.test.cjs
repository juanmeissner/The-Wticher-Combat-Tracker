const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const storage = new Map();
global.localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
};
global.campaignTimelineData = require(path.join(projectRoot, 'js', 'campaign-timeline-data.js'));

const clock = require(path.join(projectRoot, 'js', 'campaign-clock.js'));
assert.equal(clock.STATE_VERSION, 4);
assert.equal(clock.createInitialState().currentMinute, clock.minuteFromInputs('1276-01-01', '08:00', 'DR'));
assert.equal(clock.describeMinute(clock.createInitialState().currentMinute).era, 'DR');
assert.equal(clock.describeMinute(clock.minuteFromInputs('0001-01-01', '00:00', 'AR')).era, 'AR');
assert.equal(clock.describeMinute(clock.minuteFromInputs('0001-01-01', '00:00', 'AR')).year, 1);
assert.equal(
    clock.minuteFromInputs('0001-12-31', '23:59', 'AR') + 1,
    clock.minuteFromInputs('0001-01-01', '00:00', 'DR')
);
const legacyCivilStart = clock.minuteFromInputs('2026-09-02', '22:00');
const migratedCivil = clock.normalizeState({
    version: 2,
    startMinute: legacyCivilStart,
    currentMinute: legacyCivilStart + 90,
    events: [{ id: 'legacy-note', type: 'note', title: 'Nota antiga', date: '2026-09-03', time: '00:00' }]
});
assert.equal(clock.describeMinute(migratedCivil.startMinute).year, 1276);
assert.equal(migratedCivil.currentMinute - migratedCivil.startMinute, 90);
assert.equal(migratedCivil.events[0].date, '1276-09-03');

const start = clock.minuteFromInputs('1272-09-03', '23:59');
assert.equal(typeof start, 'number');
assert.equal(clock.minuteFromInputs('1272-02-30', '10:00'), null);
assert.equal(clock.minuteFromInputs('1273-02-29', '10:00'), null);
assert.equal(clock.minuteFromInputs('1272-12-01', '25:00'), null);

clock.restoreSnapshot({
    version: 1,
    startMinute: start,
    currentMinute: start,
    revision: 0,
    lastAdvance: null
});

assert.equal(clock.getDayNumber(), 1);
assert.equal(clock.describeMinute().short, '03/09/1272 DR · 23:59');
assert.equal(clock.describeMinute().medievalHour, 'Hora da Enguia');

let previewCalls = 0;
let applyCalls = 0;
clock.registerTimeProcessor({
    id: 'test-processor',
    preview(context) {
        previewCalls++;
        assert.equal(context.beforeMinute, start);
        return { summary: 'Um efeito será processado' };
    },
    apply(context) {
        applyCalls++;
        return { summary: `Processado em ${context.afterMinute}` };
    }
});

const preview = clock.previewAdvance(1, { source: 'test' });
assert.equal(previewCalls, 1);
assert.equal(preview.impacts.length, 1);
assert.equal(preview.impacts[0].summary, 'Um efeito será processado');

const advanced = clock.advanceByMinutes(1, { source: 'combat-turn' });
assert.equal(advanced.changed, true);
assert.equal(applyCalls, 1);
assert.equal(advanced.before.short, '03/09/1272 DR · 23:59');
assert.equal(advanced.after.short, '04/09/1272 DR · 00:00');
assert.equal(advanced.after.medievalHour, 'Hora dos Fantasmas');
assert.equal(clock.getDayNumber(), 2);
assert.equal(clock.getSnapshot().revision, 1);

const saved = JSON.parse(storage.get(clock.STORAGE_KEY));
assert.equal(saved.currentMinute, start + 1);

clock.restoreSnapshot({
    version: 1,
    startMinute: start,
    currentMinute: start,
    revision: 0
});
assert.equal(clock.getDayNumber(), 1);
assert.equal(clock.formatDuration(10), '10 minutos');
assert.equal(clock.formatDuration(60), '1 hora');
assert.equal(clock.formatDuration(1440), '1 dia');
assert.equal(clock.formatDuration(4, 'round'), '1 rodada');

const reminder = clock.upsertEvent({
    id: 'contract-griffin',
    type: 'mission',
    title: 'Entregar troféu do Grifo',
    description: 'Alderman prometeu pagamento ao grupo.',
    date: '1272-09-04',
    time: '00:05',
    contact: 'Alderman',
    reward: 350
});
assert.equal(reminder.title, 'Entregar troféu do Grifo');
assert.equal(clock.getEventsForDate('1272-09-04').length, 1);
assert.equal(clock.getAgendaEvents()[0].reward, 350);
const ancientEvent = clock.upsertEvent({
    id: 'conjunction-reference',
    type: 'history',
    title: 'Referência histórica',
    date: '0230-04-12',
    era: 'AR',
    time: '12:00'
});
assert.equal(ancientEvent.era, 'AR');
assert.equal(clock.getEventsForDate('0230-04-12', 'AR').length, 1);
assert.equal(clock.getAgendaEvents().some(event => event.id === ancientEvent.id), false);
assert.equal(clock.getTimelineEvents()[0].id, ancientEvent.id);
assert.equal(clock.getTimelineEvents({ era: 'DR' }).length, 0);
assert.equal(clock.getTimelineEvents({ search: 'HISTORICA' })[0].id, ancientEvent.id);
assert.equal(clock.EVENT_TYPES.history.scheduled, false);
assert.equal(clock.EVENT_TYPES.festival.scheduled, true);
assert.equal(clock.getAnnualCalendarEvents().length, 13);
assert.equal(
    clock.getEventsForDate('1272-05-01', 'DR').some(event => event.id === 'builtin-annual-belleteyn'),
    true,
    'Belleteyn deve aparecer em qualquer ano do calendário.'
);
assert.equal(
    clock.getEventsForDate('1272-11-01', 'DR').some(event => event.id === 'builtin-annual-saovine'),
    true,
    'O segundo dia de Saovine deve continuar visível no calendário.'
);
assert.equal(
    clock.getEventsForDate('0230-10-31', 'AR').filter(event => event.sourceKind === 'annual-official').length,
    2,
    'Celebrações anuais devem funcionar também em anos AR.'
);

const beforeMidinvaerne = clock.minuteFromInputs('1272-12-20', '23:59', 'DR');
const atMidinvaerne = clock.minuteFromInputs('1272-12-21', '00:00', 'DR');
assert.equal(
    clock.getScheduledOccurrences(beforeMidinvaerne, atMidinvaerne, { includeProcessed: true })
        .some(entry => entry.event.id === 'builtin-annual-midinvaerne'),
    true,
    'Midinváerne deve ser processado pelo relógio como evento anual.'
);

const eventPreview = clock.previewAdvance(6, { source: 'manual-jump' });
assert.equal(eventPreview.impacts.some(impact => /1 evento programado será alcançado/.test(impact.summary)), true);
const eventAdvance = clock.advanceByMinutes(6, { source: 'manual-jump' });
assert.equal(eventAdvance.results.some(result => result.occurrences?.[0]?.event?.id === reminder.id), true);
assert.equal(clock.getSnapshot().processedOccurrences.includes('contract-griffin:DR:1272-09-04'), true);

const processedState = clock.getSnapshot();
clock.restoreSnapshot({ ...processedState, currentMinute: start });
const duplicatePreview = clock.previewAdvance(6, { source: 'manual-jump' });
assert.equal(duplicatePreview.impacts.some(impact => /evento programado/.test(impact.summary)), false);

clock.upsertEvent({
    id: 'birthday-geralt',
    type: 'birthday',
    title: 'Aniversário de Geralt',
    date: '1272-09-10',
    time: '00:00',
    allDay: true,
    annual: true
});
assert.equal(clock.getEventsForDate('1273-09-10').some(event => event.id === 'birthday-geralt'), true);
assert.equal(clock.setEventCompleted('contract-griffin', true).completed, true);
assert.equal(clock.getEventRewardPending(clock.getEvents().find(event => event.id === 'contract-griffin')), 350);
clock.upsertEvent({
    ...clock.getEvents().find(event => event.id === 'contract-griffin'),
    rewardDistribution: {
        totalDistributed: 350,
        allocations: [{ recipientId: 'geralt', recipientName: 'Geralt', amount: 350 }]
    }
});
assert.equal(clock.getEventRewardPending(clock.getEvents().find(event => event.id === 'contract-griffin')), 0);
assert.equal(clock.getAgendaEvents().some(event => event.id === 'contract-griffin'), false);
assert.equal(clock.removeEvent('contract-griffin').id, 'contract-griffin');
assert.equal(clock.getEvents().some(event => event.id === 'contract-griffin'), false);

assert.deepEqual(clock.normalizeCharacterBirthDate({ day: 7, month: 3, year: 1250, era: 'DR' }), {
    day: 7, month: 3, year: 1250, era: 'DR'
});
assert.equal(clock.normalizeCharacterBirthDate({ day: 31, month: 2 }), null);
assert.equal(clock.formatCharacterBirthDate({ day: 7, month: 3 }), '7 de março');
assert.equal(clock.getCharacterAge({ identity: { birthDate: { day: 10, month: 9, year: 1250, era: 'DR' } } }), 21);
const syncedBirthday = clock.syncCharacterBirthday({
    id: 'sheet-ciri',
    name: 'Ciri',
    identity: { name: 'Cirilla', birthDate: { day: 1, month: 5, year: 1253, era: 'DR' } }
});
assert.equal(syncedBirthday.id, 'birthday-sheet-ciri');
assert.equal(syncedBirthday.annual, true);
assert.equal(clock.getEventsForDate('1276-05-01').some(event => event.id === syncedBirthday.id), true);
assert.equal(clock.removeCharacterBirthday('sheet-ciri').id, syncedBirthday.id);

global.combatants = [
    { type: 'player', hpCurrent: 10, deathSaves: { failures: 0 } },
    { type: 'monster', hpCurrent: 10 },
    { type: 'monster', hpCurrent: 0 }
];
assert.equal(clock.getRoundMinutes(), 2);

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
const appInitSource = fs.readFileSync(path.join(projectRoot, 'js', 'app-init.js'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const clockSource = fs.readFileSync(path.join(projectRoot, 'js', 'campaign-clock.js'), 'utf8');
const clockStyles = fs.readFileSync(path.join(projectRoot, 'campaign-clock.css'), 'utf8');

assert.match(indexSource, /openCampaignClock\(\)/);
assert.match(indexSource, /onclick="openEffectModal\(\)"[^>]+title="Magias, itens e status"/);
assert.match(indexSource, /closeEffectModal\(\); openConditionMenu\(\)/);
assert.match(indexSource, /campaign-clock\.css/);
assert.match(indexSource, /js\/campaign-clock\.js/);
assert.match(sessionSource, /campaignClock: window\.campaignClock\?\.getSnapshot/);
assert.match(sessionSource, /window\.campaignClock\?\.restoreSnapshot/);
assert.match(sessionSource, /advanceByMinutes\?\.\(1, \{ source: 'combat-turn' \}\)/);
assert.match(sessionSource, /time: \{ icon: '🕰️', label: 'Tempo' \}/);
assert.match(appInitSource, /'dnd_campaign_clock'/);
assert.match(workerSource, /witcher-combat-tracker-v102/);
assert.match(workerSource, /js\/campaign-timeline-data\.js/);
assert.match(indexSource, /js\/campaign-timeline-data\.js[\s\S]+js\/campaign-clock\.js/);
assert.match(workerSource, /js\/campaign-daily-processing\.js/);
assert.match(indexSource, /js\/campaign-daily-processing\.js/);
assert.match(workerSource, /campaign-clock\.css/);
assert.match(workerSource, /js\/campaign-clock\.js/);
assert.match(workerSource, /js\/temporal-effects\.js/);
assert.match(indexSource, /js\/temporal-effects\.js/);
assert.match(clockStyles, /campaign-calendar-moon/);
assert.match(clockStyles, /\.campaign-calendar-moon\s*\{[\s\S]*top:\s*-5px;[\s\S]*right:\s*-4px;/);
assert.equal(clock.getMoonPhase(clock.minuteFromInputs('1276-01-01', '00:00')).id, 'new');
assert.deepEqual(
    [...new Set(clock.MOON_PHASES.map(phase => phase.name))].sort(),
    ['Lua Cheia', 'Lua Crescente', 'Lua Minguante', 'Lua Nova'].sort()
);
assert.doesNotMatch(clock.MOON_PHASES.map(phase => phase.name).join(' '), /Gibosa|Quarto/);
assert.doesNotMatch(clockSource, /showMoonMarker/);
assert.match(clockStyles, /env\(safe-area-inset-bottom\)/);
assert.match(clockStyles, /@media \(max-width: 560px\)/);
assert.match(clockStyles, /campaign-calendar-grid/);
assert.match(clockStyles, /campaign-event-card/);
assert.match(clockStyles, /campaign-timeline-panel/);
assert.match(clockStyles, /campaign-timeline-card/);
assert.match(clockSource, /Linha do Tempo/);
assert.match(clockSource, /openCampaignEventEditor\('', 'history'\)/);
assert.match(clockSource, /openCampaignEventReward/);
assert.match(clockSource, /campaignRewardRecipient/);
assert.match(clockStyles, /campaign-reward-recipients/);
assert.equal(clock.getCombinedTimelineEntries().filter(event => event.sourceKind === 'official').length, 83);
assert.equal(clock.getCombinedTimelineEntries().filter(event => event.sourceKind === 'campaign').length, 1);
assert.equal(clock.getOfficialTimelineEntriesForCalendar(1267, 'DR', 7, 1).length, 7);
assert.equal(clock.getOfficialTimelineEntriesForCalendar(1268, 'DR', 3, 1).length, 5);
assert.match(clockSource, /Cronologia oficial/);
assert.match(clockSource, /setCampaignTimelinePeriod/);
assert.match(clockSource, /setCampaignTimelineCategory/);
assert.match(clockStyles, /campaign-calendar-official/);
assert.match(clockStyles, /campaign-timeline-source\.official/);

delete global.combatants;
delete global.localStorage;
delete global.campaignTimelineData;

console.log('✓ Motor temporal, persistência, integração de turnos e interface do relógio validados.');
