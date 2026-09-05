const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const timeline = require(path.join(projectRoot, 'js', 'campaign-timeline-data.js'));

assert.equal(timeline.ENTRIES.length, 83, 'Todos os acontecimentos fornecidos devem permanecer individualizados.');
assert.equal(new Set(timeline.ENTRIES.map(entry => entry.id)).size, timeline.ENTRIES.length, 'IDs oficiais devem ser únicos.');
assert.equal(timeline.ENTRIES.every(entry => entry.text && entry.sourceKind === 'official'), true);

assert.deepEqual(timeline.parseTimelineHeading('2700 ar'), { kind: 'dated', year: 2700, era: 'AR' });
assert.deepEqual(timeline.parseTimelineHeading('1276 DR'), { kind: 'dated', year: 1276, era: 'DR' });
assert.deepEqual(timeline.parseTimelineHeading('1'), { kind: 'ambiguous-year', year: 1, era: null });
assert.deepEqual(timeline.parseTimelineHeading('??'), { kind: 'unknown', year: null, era: null });
assert.deepEqual(
    timeline.parseTimelineHeading('3000 anos no futuro'),
    { kind: 'relative-future', yearsInFuture: 3000, year: null, era: null }
);

const ascending = timeline.sortTimelineEntries(timeline.ENTRIES);
const indexOf = id => ascending.findIndex(entry => entry.id === id);
assert.equal(ascending[0].id, 'dwarves-arrive');
assert.ok(indexOf('conjunction-of-spheres') < indexOf('resurrection'));
assert.ok(indexOf('resurrection') < indexOf('first-landing'));
assert.ok(indexOf('first-landing') < indexOf('dezmod-sambuk-kingdoms'));
assert.ok(indexOf('dezmod-sambuk-kingdoms') < indexOf('conclave-created'));
assert.equal(ascending.at(-1).id, 'white-frost');
assert.equal(timeline.sortTimelineEntries(timeline.ENTRIES, 'desc')[0].id, 'white-frost');

assert.equal(timeline.filterTimelineEntries({ era: 'AR' }).length, 6);
assert.equal(timeline.filterTimelineEntries({ category: 'plague' }).length, 4);
assert.equal(timeline.filterTimelineEntries({ period: 'dr-1200-1299' }).every(entry => entry.era === 'DR' && entry.year >= 1200 && entry.year <= 1299), true);
assert.equal(timeline.filterTimelineEntries({ search: 'conjuncao' })[0].id, 'conjunction-of-spheres');
assert.equal(timeline.filterTimelineEntries({ search: 'scoiatael' })[0].id, 'thanedd-coup-details');

const july1267 = timeline.getEntriesForCalendar({ year: 1267, era: 'DR', month: 7, day: 1 });
assert.equal(july1267.length, 7, 'Eventos anuais e o registro mensal de julho devem aparecer no contexto do calendário.');
assert.equal(july1267.some(entry => entry.id === 'thanedd-coup-war-begins' && entry.precision === 'month'), true);
assert.equal(timeline.getEntriesForCalendar({ year: 1267, era: 'DR', month: 6, day: 1 }).some(entry => entry.id === 'thanedd-coup-war-begins'), false);
assert.equal(timeline.getEntriesForCalendar({ year: 1268, era: 'DR', month: 3, day: 1 }).some(entry => entry.id === 'red-comet'), true);
assert.equal(timeline.ENTRIES.some(entry => entry.day !== null), false, 'Nenhum dia deve ser inventado para a fonte fornecida.');

assert.equal(timeline.ANNUAL_EVENTS.length, 13, 'Todas as celebrações anuais devem permanecer cadastradas.');
assert.equal(new Set(timeline.ANNUAL_EVENTS.map(event => event.id)).size, 13, 'Eventos anuais devem possuir IDs únicos.');
assert.equal(timeline.ANNUAL_EVENTS.every(event => event.annual && event.readonly && event.description), true);
assert.equal(timeline.ANNUAL_EVENTS.every(event => event.calendarDates.every(timeline.isValidAnnualDate)), true);

const saovine = timeline.ANNUAL_EVENTS.find(event => event.id === 'builtin-annual-saovine');
assert.deepEqual(saovine.calendarDates, ['10-31', '11-01'], 'Saovine deve ocupar os dois dias da celebração.');
assert.match(saovine.description, /Ano Novo Élfico/);
assert.equal(timeline.ANNUAL_EVENTS.find(event => event.id === 'builtin-annual-midinvaerne').date.slice(5), '12-21');
assert.equal(timeline.ANNUAL_EVENTS.find(event => event.id === 'builtin-annual-great-knights-tournament').date.slice(5), '07-15');
assert.equal(timeline.ANNUAL_EVENTS.find(event => event.id === 'builtin-annual-mages-conclave').date.slice(5), '09-08');
assert.equal(timeline.ANNUAL_EVENTS.find(event => event.id === 'builtin-annual-new-wine-festival').date.slice(5), '10-15');

const resurrection = timeline.getEntry('resurrection');
const undated = timeline.getEntry('dezmod-sambuk-kingdoms');
const whiteFrost = timeline.getEntry('white-frost');
assert.match(resurrection.chronologyNote, /sem indicar AR ou DR/);
assert.match(undated.chronologyNote, /não informa data/);
assert.match(whiteFrost.chronologyNote, /nenhum ano absoluto foi calculado/);

const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
assert.match(indexSource, /js\/campaign-timeline-data\.js[\s\S]+js\/campaign-clock\.js/);
assert.match(workerSource, /witcher-combat-tracker-v102/);
assert.match(workerSource, /js\/campaign-timeline-data\.js/);

console.log('✓ Cronologia oficial, incertezas, ordenação AR/DR, filtros e calendário validados.');
