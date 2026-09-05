(function initializeCampaignClock(global) {
    'use strict';

    const STORAGE_KEY = 'dnd_campaign_clock';
    const STATE_VERSION = 4;
    const MINUTES_PER_HOUR = 60;
    const MINUTES_PER_DAY = 1440;
    const DEFAULT_CAMPAIGN_YEAR = 1276;
    const DEFAULT_CAMPAIGN_MONTH = 1;
    const DEFAULT_CAMPAIGN_DAY = 1;
    const DEFAULT_CAMPAIGN_HOUR = 8;
    const MOON_CYCLE_MINUTES = Math.round(29.530588853 * MINUTES_PER_DAY);
    const MAX_MANUAL_ADVANCE_MINUTES = MINUTES_PER_DAY * 36500;
    const WEEKDAYS = Object.freeze([
        'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
        'quinta-feira', 'sexta-feira', 'sábado'
    ]);
    const MONTHS = Object.freeze([
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ]);
    const MEDIEVAL_HOURS = Object.freeze([
        'Hora dos Fantasmas', 'Hora da Coruja', 'Hora da Raposa', 'Hora do Lobo',
        'Hora do Galo', 'Hora do Tordo', 'Hora da Cotovia', 'Hora da Lebre',
        'Hora do Falcão', 'Hora da Abelha', 'Hora do Cavalo', 'Hora do Cão',
        'Hora da Águia', 'Hora do Gato', 'Hora do Lagarto', 'Hora do Corvo',
        'Hora do Javali', 'Hora do Cervo', 'Hora da Andorinha', 'Hora da Doninha',
        'Hora do Texugo', 'Hora do Rato', 'Hora do Morcego', 'Hora da Enguia'
    ]);
    const MOON_PHASES = Object.freeze([
        Object.freeze({ id: 'new', icon: '🌑', name: 'Lua Nova' }),
        Object.freeze({ id: 'waxing-crescent', icon: '🌒', name: 'Lua Crescente' }),
        Object.freeze({ id: 'first-quarter', icon: '🌓', name: 'Lua Crescente' }),
        Object.freeze({ id: 'waxing-gibbous', icon: '🌔', name: 'Lua Crescente' }),
        Object.freeze({ id: 'full', icon: '🌕', name: 'Lua Cheia' }),
        Object.freeze({ id: 'waning-gibbous', icon: '🌖', name: 'Lua Minguante' }),
        Object.freeze({ id: 'last-quarter', icon: '🌗', name: 'Lua Minguante' }),
        Object.freeze({ id: 'waning-crescent', icon: '🌘', name: 'Lua Minguante' })
    ]);
    const timeProcessors = new Map();
    let pendingAdvance = null;
    let activeClockView = 'now';
    let calendarCursor = null;
    let selectedCalendarDate = '';
    let selectedCalendarEra = 'DR';
    let editingEventId = null;
    let eventEditorPreferredType = '';
    let eventEditorReturnView = 'calendar';
    let timelineSearch = '';
    let timelineEra = 'all';
    let timelinePeriod = 'all';
    let timelineCategory = 'all';
    let timelineOrder = 'asc';
    let focusedTimelineEntryId = '';
    const EVENT_TYPES = Object.freeze({
        note: Object.freeze({ icon: '📝', name: 'Nota', scheduled: false }),
        reminder: Object.freeze({ icon: '🔔', name: 'Lembrete', scheduled: true }),
        mission: Object.freeze({ icon: '⚔️', name: 'Missão', scheduled: true }),
        payment: Object.freeze({ icon: '💰', name: 'Pagamento', scheduled: true }),
        birthday: Object.freeze({ icon: '🎂', name: 'Aniversário', scheduled: true }),
        festival: Object.freeze({ icon: '🎊', name: 'Data comemorativa', scheduled: true }),
        deadline: Object.freeze({ icon: '⏳', name: 'Prazo', scheduled: true }),
        history: Object.freeze({ icon: '📜', name: 'Marco histórico', scheduled: false }),
        custom: Object.freeze({ icon: '📌', name: 'Evento', scheduled: true })
    });

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function createUtcMinute(astronomicalYear, month, day, hour = 0, minute = 0) {
        const date = new Date(0);
        date.setUTCFullYear(Number(astronomicalYear), Number(month) - 1, Number(day));
        date.setUTCHours(Number(hour), Number(minute), 0, 0);
        return Math.floor(date.getTime() / 60000);
    }

    function toAstronomicalYear(year, era = 'DR') {
        const normalizedYear = Math.max(1, Math.floor(Number(year) || 1));
        return String(era).toUpperCase() === 'AR' ? 1 - normalizedYear : normalizedYear;
    }

    function fromAstronomicalYear(astronomicalYear) {
        const value = Math.trunc(Number(astronomicalYear) || 0);
        return value <= 0
            ? { year: 1 - value, era: 'AR' }
            : { year: value, era: 'DR' };
    }

    function nowAsCampaignMinute() {
        return createUtcMinute(
            DEFAULT_CAMPAIGN_YEAR,
            DEFAULT_CAMPAIGN_MONTH,
            DEFAULT_CAMPAIGN_DAY,
            DEFAULT_CAMPAIGN_HOUR,
            0
        );
    }

    function minuteFromInputs(dateValue, timeValue, era = 'DR') {
        const dateMatch = String(dateValue || '').match(/^(\d{4,})-(\d{2})-(\d{2})$/);
        const timeMatch = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
        if (!dateMatch || !timeMatch) return null;

        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const hour = Number(timeMatch[1]);
        const minute = Number(timeMatch[2]);
        if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

        if (year < 1) return null;
        const result = createUtcMinute(toAstronomicalYear(year, era), month, day, hour, minute);
        const parts = getDateParts(result);
        return parts.year === year && parts.era === String(era || 'DR').toUpperCase()
            && parts.month === month && parts.day === day
            ? result
            : null;
    }

    function getDateParts(epochMinute) {
        const date = new Date(Number(epochMinute) * 60000);
        const astronomicalYear = date.getUTCFullYear();
        return {
            ...fromAstronomicalYear(astronomicalYear),
            astronomicalYear,
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
            weekday: date.getUTCDay(),
            hour: date.getUTCHours(),
            minute: date.getUTCMinutes()
        };
    }

    function createInitialState() {
        const currentMinute = nowAsCampaignMinute();
        return {
            version: STATE_VERSION,
            startMinute: currentMinute,
            currentMinute,
            revision: 0,
            lastAdvance: null,
            events: [],
            processedOccurrences: []
        };
    }

    function normalizeRewardDistribution(value) {
        if (!value || typeof value !== 'object') return null;
        const allocations = Array.isArray(value.allocations)
            ? value.allocations.map(entry => ({
                recipientId: String(entry?.recipientId || '').slice(0, 120),
                recipientName: String(entry?.recipientName || 'Personagem').trim().slice(0, 120),
                amount: Math.max(0, Math.floor(Number(entry?.amount) || 0))
            })).filter(entry => entry.recipientId && entry.amount > 0)
            : [];
        const allocatedTotal = allocations.reduce((total, entry) => total + entry.amount, 0);
        const totalDistributed = Math.max(
            allocatedTotal,
            Math.max(0, Math.floor(Number(value.totalDistributed) || 0))
        );
        if (!totalDistributed && !allocations.length) return null;

        return {
            status: 'distributed',
            totalDistributed,
            allocations,
            distributedAt: String(value.distributedAt || new Date().toISOString())
        };
    }

    function normalizeEvent(value) {
        if (!value || typeof value !== 'object') return null;
        const type = EVENT_TYPES[value.type] ? value.type : 'custom';
        const date = /^\d{4,}-\d{2}-\d{2}$/.test(String(value.date || '')) ? String(value.date) : '';
        const time = /^\d{2}:\d{2}$/.test(String(value.time || '')) ? String(value.time) : '00:00';
        const era = String(value.era || 'DR').toUpperCase() === 'AR' ? 'AR' : 'DR';
        const title = String(value.title || '').trim().slice(0, 120);
        if (!date || !title || minuteFromInputs(date, time, era) === null) return null;

        const generatedId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const safeId = String(value.id || generatedId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || generatedId;
        const reward = Number(value.reward);
        return {
            id: safeId,
            type,
            title,
            description: String(value.description || '').trim().slice(0, 3000),
            date,
            era,
            time,
            allDay: Boolean(value.allDay || type === 'note'),
            annual: Boolean(value.annual),
            contact: String(value.contact || '').trim().slice(0, 160),
            reward: Number.isFinite(reward) ? Math.max(0, Math.floor(reward)) : 0,
            rewardDistribution: normalizeRewardDistribution(value.rewardDistribution),
            source: String(value.source || '').trim().slice(0, 80),
            characterId: String(value.characterId || '').trim().slice(0, 120),
            completed: Boolean(value.completed),
            createdAt: String(value.createdAt || new Date().toISOString()),
            updatedAt: String(value.updatedAt || new Date().toISOString())
        };
    }

    function normalizeState(value) {
        const fallback = createInitialState();
        const state = value && typeof value === 'object' ? value : {};
        const storedVersion = Math.max(0, Math.floor(Number(state.version) || 0));
        let startMinute = Number.isFinite(Number(state.startMinute))
            ? Math.floor(Number(state.startMinute))
            : fallback.startMinute;
        let currentMinute = Number.isFinite(Number(state.currentMinute))
            ? Math.floor(Number(state.currentMinute))
            : startMinute;
        const legacyStart = getDateParts(startMinute);
        const migrateCivilCalendar = storedVersion < STATE_VERSION
            && legacyStart.era === 'DR'
            && legacyStart.year >= 1900;
        if (migrateCivilCalendar) {
            const elapsedMinutes = currentMinute - startMinute;
            startMinute = createUtcMinute(
                DEFAULT_CAMPAIGN_YEAR,
                legacyStart.month,
                legacyStart.day,
                legacyStart.hour,
                legacyStart.minute
            );
            currentMinute = startMinute + elapsedMinutes;
        }
        const normalizedEvents = Array.isArray(state.events)
            ? state.events.map(normalizeEvent).filter(Boolean).map(event => {
                if (!migrateCivilCalendar || event.era !== 'DR') return event;
                const eventYear = Number(event.date.slice(0, event.date.indexOf('-')));
                if (eventYear < 1900) return event;
                const migratedYear = Math.max(1, DEFAULT_CAMPAIGN_YEAR + (eventYear - legacyStart.year));
                return { ...event, date: `${String(migratedYear).padStart(4, '0')}${event.date.slice(event.date.indexOf('-'))}` };
            }).filter(event => minuteFromInputs(event.date, event.time, event.era) !== null)
            : [];

        return {
            version: STATE_VERSION,
            startMinute,
            currentMinute,
            revision: Math.max(0, Math.floor(Number(state.revision) || 0)),
            lastAdvance: !migrateCivilCalendar && state.lastAdvance && typeof state.lastAdvance === 'object'
                ? clone(state.lastAdvance)
                : null,
            events: normalizedEvents,
            processedOccurrences: Array.isArray(state.processedOccurrences)
                ? [...new Set(state.processedOccurrences.map(value => {
                    const key = String(value);
                    return /:\d{4,}-\d{2}-\d{2}$/.test(key) && !/:AR:|:DR:/.test(key)
                        ? key.replace(/:(\d{4,}-\d{2}-\d{2})$/, ':DR:$1')
                        : key;
                }))].slice(-1000)
                : []
        };
    }

    function loadState() {
        try {
            return normalizeState(JSON.parse(global.localStorage?.getItem(STORAGE_KEY) || 'null'));
        } catch {
            return createInitialState();
        }
    }

    let clockState = loadState();

    function saveState() {
        global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(clockState));
    }

    function getDayNumber(state = clockState) {
        const start = getDateParts(state.startMinute);
        const current = getDateParts(state.currentMinute);
        const startDay = createUtcMinute(start.astronomicalYear, start.month, start.day);
        const currentDay = createUtcMinute(current.astronomicalYear, current.month, current.day);
        return Math.max(1, Math.floor((currentDay - startDay) / MINUTES_PER_DAY) + 1);
    }

    function formatTime(epochMinute) {
        const parts = getDateParts(epochMinute);
        return `${pad(parts.hour)}:${pad(parts.minute)}`;
    }

    function formatDateInput(epochMinute) {
        const parts = getDateParts(epochMinute);
        return `${String(parts.year).padStart(4, '0')}-${pad(parts.month)}-${pad(parts.day)}`;
    }

    function formatDateShort(epochMinute) {
        const parts = getDateParts(epochMinute);
        return `${pad(parts.day)}/${pad(parts.month)}/${parts.year} ${parts.era} · ${formatTime(epochMinute)}`;
    }

    function formatDateLong(epochMinute) {
        const parts = getDateParts(epochMinute);
        return `${WEEKDAYS[parts.weekday]}, ${parts.day} de ${MONTHS[parts.month - 1]} de ${parts.year} ${parts.era}`;
    }

    function getMedievalHour(epochMinute) {
        return MEDIEVAL_HOURS[getDateParts(epochMinute).hour];
    }

    const MOON_ANCHOR_MINUTE = createUtcMinute(DEFAULT_CAMPAIGN_YEAR, 1, 1, 0, 0);

    function getMoonPhase(epochMinute = clockState.currentMinute) {
        const offset = ((Math.floor(Number(epochMinute)) - MOON_ANCHOR_MINUTE) % MOON_CYCLE_MINUTES + MOON_CYCLE_MINUTES) % MOON_CYCLE_MINUTES;
        const progress = offset / MOON_CYCLE_MINUTES;
        const index = Math.floor((progress + (1 / 16)) * 8) % 8;
        const phase = MOON_PHASES[index];
        const nextIndex = (index + 1) % MOON_PHASES.length;
        const nextBoundary = (((index + 1) / 8) - (1 / 16) + 1) % 1;
        const normalizedRemaining = (nextBoundary - progress + 1) % 1;
        return {
            ...phase,
            index,
            progress,
            next: MOON_PHASES[nextIndex],
            minutesUntilNext: Math.max(1, Math.round(normalizedRemaining * MOON_CYCLE_MINUTES))
        };
    }

    function formatDuration(minutes, preferredUnit = '') {
        const value = Math.max(0, Math.floor(Number(minutes) || 0));
        if (preferredUnit === 'round') return '1 rodada';
        if (value === MINUTES_PER_DAY) return '1 dia';
        if (value === MINUTES_PER_DAY * 8) return '8 dias';
        if (value % MINUTES_PER_DAY === 0 && value >= MINUTES_PER_DAY) {
            const days = value / MINUTES_PER_DAY;
            return `${days} dias`;
        }
        if (value % MINUTES_PER_HOUR === 0 && value >= MINUTES_PER_HOUR) {
            const hours = value / MINUTES_PER_HOUR;
            return `${hours} hora${hours === 1 ? '' : 's'}`;
        }
        return `${value} minuto${value === 1 ? '' : 's'}`;
    }

    function getSnapshot() {
        return clone(clockState);
    }

    function restoreSnapshot(snapshot) {
        clockState = normalizeState(snapshot);
        saveState();
        renderCampaignClock();
        return getSnapshot();
    }

    function getContext(minutes, options = {}) {
        const amount = Math.max(0, Math.floor(Number(minutes) || 0));
        return {
            transactionId: `time-${clockState.revision + 1}-${clockState.currentMinute + amount}`,
            minutes: amount,
            beforeMinute: clockState.currentMinute,
            afterMinute: clockState.currentMinute + amount,
            source: options.source || 'manual',
            processRecurringDamage: Boolean(options.processRecurringDamage),
            combatants: getCombatants()
        };
    }

    function previewAdvance(minutes, options = {}) {
        const context = getContext(minutes, options);
        const impacts = [];
        let recurringDamageDecision = false;

        timeProcessors.forEach(processor => {
            if (typeof processor.preview !== 'function') return;
            try {
                const result = processor.preview(context);
                if (!result) return;
                const entries = Array.isArray(result) ? result : [result];
                entries.filter(Boolean).forEach(entry => {
                    impacts.push(typeof entry === 'string' ? { summary: entry } : entry);
                    if (entry?.requiresRecurringDamageDecision) recurringDamageDecision = true;
                });
            } catch (error) {
                console.error(`Falha ao prever o processador temporal ${processor.id}.`, error);
            }
        });

        return { ...context, impacts, recurringDamageDecision };
    }

    function advanceByMinutes(minutes, options = {}) {
        const context = getContext(minutes, options);
        if (context.minutes <= 0) return { changed: false, context, results: [] };

        clockState.currentMinute = context.afterMinute;
        clockState.revision += 1;
        const results = [];

        if (options.runProcessors !== false) {
            timeProcessors.forEach(processor => {
                if (typeof processor.apply !== 'function') return;
                try {
                    const result = processor.apply({ ...context, revision: clockState.revision });
                    if (result) results.push(result);
                } catch (error) {
                    console.error(`Falha ao executar o processador temporal ${processor.id}.`, error);
                    results.push({ summary: `${processor.name || processor.id}: falha ao processar`, error: true });
                }
            });
        }

        clockState.lastAdvance = {
            id: context.transactionId,
            source: context.source,
            minutes: context.minutes,
            beforeMinute: context.beforeMinute,
            afterMinute: context.afterMinute,
            at: new Date().toISOString()
        };
        saveState();
        renderCampaignClock();

        return {
            changed: true,
            context,
            results,
            before: describeMinute(context.beforeMinute),
            after: describeMinute(context.afterMinute)
        };
    }

    function setDateTime(epochMinute, resetStart = false) {
        const target = Math.floor(Number(epochMinute));
        if (!Number.isFinite(target)) return { changed: false };
        const before = describeMinute(clockState.currentMinute);
        const previousStart = clockState.startMinute;
        const changed = target !== clockState.currentMinute || (resetStart && target !== previousStart);
        if (!changed) return { changed: false, before, after: before };

        clockState.currentMinute = target;
        if (resetStart) clockState.startMinute = target;
        clockState.revision += 1;
        clockState.lastAdvance = {
            id: `time-set-${clockState.revision}-${target}`,
            source: resetStart ? 'campaign-start' : 'manual-adjustment',
            minutes: target - before.epochMinute,
            beforeMinute: before.epochMinute,
            afterMinute: target,
            at: new Date().toISOString()
        };
        saveState();
        renderCampaignClock();
        return { changed: true, before, after: describeMinute(target) };
    }

    function describeMinute(epochMinute = clockState.currentMinute) {
        return {
            epochMinute,
            ...getDateParts(epochMinute),
            dateInput: formatDateInput(epochMinute),
            time: formatTime(epochMinute),
            short: formatDateShort(epochMinute),
            long: formatDateLong(epochMinute),
            medievalHour: getMedievalHour(epochMinute)
        };
    }

    function getEventType(type) {
        return EVENT_TYPES[type] || EVENT_TYPES.custom;
    }

    function getEvents() {
        return clone(clockState.events);
    }

    function getAnnualCalendarEvents() {
        const entries = global.campaignTimelineData?.ANNUAL_EVENTS;
        return Array.isArray(entries) ? entries.map(clone) : [];
    }

    function getCalendarEvents() {
        const customEvents = getEvents();
        const customIds = new Set(customEvents.map(event => event.id));
        return [
            ...customEvents,
            ...getAnnualCalendarEvents().filter(event => !customIds.has(event.id))
        ];
    }

    function eventMatchesDate(event, dateValue, era = 'DR') {
        if (!event || !dateValue) return false;
        const normalizedEra = String(era || 'DR').toUpperCase() === 'AR' ? 'AR' : 'DR';
        if (event.date === dateValue && event.era === normalizedEra) return true;
        if (!event.annual) return false;
        const annualDate = String(dateValue).slice(5);
        const dates = Array.isArray(event.calendarDates) && event.calendarDates.length
            ? event.calendarDates
            : [event.date.slice(5)];
        return dates.includes(annualDate);
    }

    function getEventsForDate(dateValue, era = 'DR') {
        return getCalendarEvents()
            .filter(event => eventMatchesDate(event, dateValue, era))
            .sort((left, right) => {
                if (left.allDay !== right.allDay) return left.allDay ? -1 : 1;
                return left.time.localeCompare(right.time) || left.title.localeCompare(right.title, 'pt-BR');
            })
            .map(clone);
    }

    function getEventOccurrenceMinute(event, astronomicalYear = null) {
        if (astronomicalYear === null) {
            return minuteFromInputs(event.date, event.allDay ? '00:00' : event.time, event.era);
        }
        const display = fromAstronomicalYear(astronomicalYear);
        const date = `${String(display.year).padStart(4, '0')}-${event.date.slice(5)}`;
        return minuteFromInputs(date, event.allDay ? '00:00' : event.time, display.era);
    }

    function getOccurrenceKey(event, minute) {
        const parts = getDateParts(minute);
        return `${event.id}:${parts.era}:${formatDateInput(minute)}`;
    }

    function getScheduledOccurrences(beforeMinute, afterMinute, options = {}) {
        const before = Math.floor(Number(beforeMinute));
        const after = Math.floor(Number(afterMinute));
        if (!Number.isFinite(before) || !Number.isFinite(after) || after <= before) return [];
        const includeProcessed = Boolean(options.includeProcessed);
        const processed = new Set(clockState.processedOccurrences);
        const firstYear = getDateParts(before).astronomicalYear;
        const lastYear = getDateParts(after).astronomicalYear;
        const occurrences = [];

        getCalendarEvents().forEach(event => {
            if (!getEventType(event.type).scheduled || event.completed) return;
            const years = event.annual
                ? Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, index) => firstYear + index)
                : [null];

            years.forEach(year => {
                const minute = getEventOccurrenceMinute(event, year);
                if (minute === null || minute <= before || minute > after) return;
                const key = getOccurrenceKey(event, minute);
                if (!includeProcessed && processed.has(key)) return;
                occurrences.push({
                    key,
                    minute,
                    event: clone(event),
                    date: formatDateInput(minute),
                    time: formatTime(minute)
                });
            });
        });

        return occurrences.sort((left, right) => left.minute - right.minute || left.event.title.localeCompare(right.event.title, 'pt-BR'));
    }

    function getNextOccurrenceMinute(event, referenceMinute = clockState.currentMinute) {
        if (!event || !getEventType(event.type).scheduled) return null;
        if (!event.annual) return getEventOccurrenceMinute(event);
        const currentYear = getDateParts(referenceMinute).astronomicalYear;
        for (let offset = 0; offset <= 8; offset++) {
            const candidate = getEventOccurrenceMinute(event, currentYear + offset);
            if (candidate === null || candidate < referenceMinute) continue;
            if (clockState.processedOccurrences.includes(getOccurrenceKey(event, candidate))) continue;
            return candidate;
        }
        return null;
    }

    function getAgendaEvents() {
        return getCalendarEvents()
            .filter(event => getEventType(event.type).scheduled && !event.completed)
            .map(event => ({ ...clone(event), occurrenceMinute: getNextOccurrenceMinute(event) }))
            .filter(event => event.occurrenceMinute !== null)
            .sort((left, right) => left.occurrenceMinute - right.occurrenceMinute || left.title.localeCompare(right.title, 'pt-BR'));
    }

    function normalizeTimelineSearch(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLocaleLowerCase('pt-BR')
            .replace(/[^a-z0-9]+/g, '');
    }

    function getTimelineEvents(options = {}) {
        const search = normalizeTimelineSearch(options.search);
        const era = ['AR', 'DR'].includes(String(options.era || '').toUpperCase())
            ? String(options.era).toUpperCase()
            : 'all';
        const direction = options.order === 'desc' ? -1 : 1;

        return clockState.events
            .filter(event => event.type === 'history')
            .filter(event => era === 'all' || event.era === era)
            .filter(event => {
                if (!search) return true;
                return normalizeTimelineSearch([
                    event.title,
                    event.description,
                    event.contact,
                    event.date,
                    event.era
                ].filter(Boolean).join(' ')).includes(search);
            })
            .map(event => ({ ...clone(event), occurrenceMinute: getEventOccurrenceMinute(event) }))
            .filter(event => event.occurrenceMinute !== null)
            .sort((left, right) => direction * (
                left.occurrenceMinute - right.occurrenceMinute
                || left.title.localeCompare(right.title, 'pt-BR')
            ));
    }

    function getTimelinePeriodId(year, era) {
        if (era === 'AR') return 'ar';
        if (year <= 999) return 'dr-1-999';
        if (year <= 1199) return 'dr-1000-1199';
        if (year <= 1299) return 'dr-1200-1299';
        return 'dr-1300-plus';
    }

    function getOfficialTimelineEntries(options = {}) {
        const data = global.campaignTimelineData;
        if (!data?.filterTimelineEntries) return [];
        return data.filterTimelineEntries(options).map(entry => ({
            ...entry,
            id: `official:${entry.id}`,
            dataId: entry.id,
            sourceKind: 'official',
            sourceLabel: 'Cronologia oficial',
            title: entry.text,
            description: '',
            contact: '',
            groupKey: entry.parsedDate.kind === 'dated'
                ? `${entry.year}-${entry.era}`
                : entry.parsedDate.kind,
            groupLabel: entry.parsedDate.kind === 'dated'
                ? `${entry.year} ${entry.era}`
                : entry.parsedDate.kind === 'ambiguous-year'
                    ? 'Mudança de era'
                    : entry.parsedDate.kind === 'relative-future'
                        ? 'Futuro distante'
                        : 'Data desconhecida',
            datePrimary: entry.parsedDate.kind === 'dated'
                ? (entry.month ? MONTHS[entry.month - 1].slice(0, 3).toUpperCase() : String(entry.year))
                : entry.parsedDate.kind === 'ambiguous-year'
                    ? String(entry.year)
                    : entry.parsedDate.kind === 'relative-future'
                        ? '≈3000'
                        : '??',
            dateSecondary: entry.parsedDate.kind === 'dated'
                ? (entry.month ? `${entry.year} ${entry.era}` : entry.era)
                : entry.parsedDate.kind === 'ambiguous-year'
                    ? 'era incerta'
                    : entry.parsedDate.kind === 'relative-future'
                        ? 'no futuro'
                        : 'sem data',
            calendarNavigable: entry.parsedDate.kind === 'dated'
        }));
    }

    function getCombinedTimelineEntries(options = {}) {
        const era = ['AR', 'DR'].includes(String(options.era || '').toUpperCase())
            ? String(options.era).toUpperCase()
            : 'all';
        const category = String(options.category || 'all');
        const period = String(options.period || 'all');
        const official = category === 'campaign'
            ? []
            : getOfficialTimelineEntries({
                era,
                category,
                period,
                order: 'asc'
            });
        const campaign = getTimelineEvents({ era, order: 'asc' })
            .map((event, index) => {
                const parts = getDateParts(event.occurrenceMinute);
                return {
                    ...event,
                    sourceKind: 'campaign',
                    sourceLabel: 'Anotação da campanha',
                    year: parts.year,
                    era: parts.era,
                    month: parts.month,
                    day: parts.day,
                    precision: 'day',
                    category: 'campaign',
                    categoryLabel: 'Campanha',
                    period: getTimelinePeriodId(parts.year, parts.era),
                    displayDate: `${pad(parts.day)}/${pad(parts.month)}/${parts.year} ${parts.era}`,
                    groupKey: `${parts.year}-${parts.era}`,
                    groupLabel: `${parts.year} ${parts.era}`,
                    datePrimary: `${pad(parts.day)}/${pad(parts.month)}`,
                    dateSecondary: `${parts.year} ${parts.era}`,
                    chronologyNote: '',
                    references: [],
                    sortValue: parts.astronomicalYear * 12 + (parts.month - 1) + (parts.day / 32),
                    sourceOrder: 10000 + index,
                    calendarNavigable: true
                };
            })
            .filter(entry => category === 'all' || category === 'campaign')
            .filter(entry => period === 'all' || entry.period === period);
        const direction = options.order === 'desc' ? -1 : 1;
        return [...official, ...campaign].sort((left, right) => direction * (
            Number(left.sortValue) - Number(right.sortValue)
            || Number(left.sourceOrder || 0) - Number(right.sourceOrder || 0)
            || left.title.localeCompare(right.title, 'pt-BR')
        ));
    }

    function getOfficialTimelineEntriesForCalendar(year, era, month, day) {
        return global.campaignTimelineData?.getEntriesForCalendar?.({ year, era, month, day }) || [];
    }

    function normalizeCharacterBirthDate(value) {
        const source = value && typeof value === 'object' ? value : {};
        const day = Math.floor(Number(source.day) || 0);
        const month = Math.floor(Number(source.month) || 0);
        const rawYear = Math.floor(Number(source.year) || 0);
        const year = rawYear > 0 ? rawYear : null;
        const era = String(source.era || 'DR').toUpperCase() === 'AR' ? 'AR' : 'DR';
        if (day < 1 || month < 1 || month > 12) return null;
        const validationYear = year || 2000;
        const date = `${String(validationYear).padStart(4, '0')}-${pad(month)}-${pad(day)}`;
        if (minuteFromInputs(date, '00:00', year ? era : 'DR') === null) return null;
        return { day, month, year, era };
    }

    function formatCharacterBirthDate(value) {
        const birthDate = normalizeCharacterBirthDate(value);
        if (!birthDate) return '';
        const monthName = MONTHS[birthDate.month - 1];
        return birthDate.year
            ? `${birthDate.day} de ${monthName} de ${birthDate.year} ${birthDate.era}`
            : `${birthDate.day} de ${monthName}`;
    }

    function getCharacterAge(characterOrBirthDate, atMinute = clockState.currentMinute) {
        const birthDate = normalizeCharacterBirthDate(
            characterOrBirthDate?.identity?.birthDate || characterOrBirthDate?.birthDate || characterOrBirthDate
        );
        if (!birthDate?.year) return null;
        const current = getDateParts(atMinute);
        const birthAstronomicalYear = toAstronomicalYear(birthDate.year, birthDate.era);
        let age = current.astronomicalYear - birthAstronomicalYear;
        if (current.month < birthDate.month || (current.month === birthDate.month && current.day < birthDate.day)) {
            age -= 1;
        }
        return age >= 0 ? age : null;
    }

    function getCharacterBirthdayEventId(characterId) {
        const safeId = String(characterId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
        return safeId ? `birthday-${safeId}` : '';
    }

    function removeCharacterBirthday(characterId) {
        const id = getCharacterBirthdayEventId(characterId);
        const index = clockState.events.findIndex(event => (
            (id && event.id === id)
            || (event.source === 'character-sheet' && event.characterId === String(characterId || ''))
        ));
        if (index < 0) return null;
        const [removed] = clockState.events.splice(index, 1);
        clockState.processedOccurrences = clockState.processedOccurrences.filter(key => !key.startsWith(`${removed.id}:`));
        clockState.revision += 1;
        saveState();
        renderCampaignClock();
        return clone(removed);
    }

    function syncCharacterBirthday(character) {
        const characterId = String(character?.id || '').trim();
        const birthDate = normalizeCharacterBirthDate(character?.identity?.birthDate || character?.birthDate);
        if (!characterId) return null;
        if (!birthDate) return removeCharacterBirthday(characterId);

        const current = getDateParts(clockState.currentMinute);
        const displayYear = birthDate.year || current.year;
        const displayEra = birthDate.year ? birthDate.era : current.era;
        const desired = normalizeEvent({
            id: getCharacterBirthdayEventId(characterId),
            type: 'birthday',
            title: `Aniversário de ${String(character.identity?.name || character.name || 'Personagem').trim()}`,
            description: birthDate.year ? `Nascimento: ${formatCharacterBirthDate(birthDate)}.` : 'Ano de nascimento não informado.',
            date: `${String(displayYear).padStart(4, '0')}-${pad(birthDate.month)}-${pad(birthDate.day)}`,
            era: displayEra,
            time: '00:00',
            allDay: true,
            annual: true,
            source: 'character-sheet',
            characterId
        });
        if (!desired) return null;

        const index = clockState.events.findIndex(event => (
            event.id === desired.id
            || (event.source === 'character-sheet' && event.characterId === characterId)
        ));
        const existing = index >= 0 ? clockState.events[index] : null;
        const comparableFields = ['type', 'title', 'description', 'date', 'era', 'time', 'allDay', 'annual', 'source', 'characterId'];
        if (existing && comparableFields.every(field => existing[field] === desired[field])) return clone(existing);

        desired.createdAt = existing?.createdAt || desired.createdAt;
        desired.updatedAt = new Date().toISOString();
        if (index >= 0) clockState.events[index] = desired;
        else clockState.events.push(desired);
        clockState.processedOccurrences = clockState.processedOccurrences.filter(key => !key.startsWith(`${desired.id}:`));
        clockState.revision += 1;
        saveState();
        renderCampaignClock();
        return clone(desired);
    }

    function upsertEvent(value) {
        const event = normalizeEvent(value);
        if (!event) return null;
        const index = clockState.events.findIndex(entry => entry.id === event.id);
        if (index >= 0) {
            event.createdAt = clockState.events[index].createdAt;
            clockState.events[index] = event;
        } else {
            clockState.events.push(event);
        }
        clockState.revision += 1;
        saveState();
        renderCampaignClock();
        return clone(event);
    }

    function removeEvent(id) {
        const index = clockState.events.findIndex(event => event.id === String(id));
        if (index < 0) return null;
        const [removed] = clockState.events.splice(index, 1);
        clockState.processedOccurrences = clockState.processedOccurrences
            .filter(key => !key.startsWith(`${removed.id}:`));
        clockState.revision += 1;
        saveState();
        renderCampaignClock();
        return clone(removed);
    }

    function setEventCompleted(id, completed) {
        const event = clockState.events.find(entry => entry.id === String(id));
        if (!event) return null;
        event.completed = Boolean(completed);
        event.updatedAt = new Date().toISOString();
        clockState.revision += 1;
        saveState();
        renderCampaignClock();
        return clone(event);
    }

    function getEventRewardPending(event) {
        const reward = Math.max(0, Math.floor(Number(event?.reward) || 0));
        const distributed = Math.max(0, Math.floor(Number(event?.rewardDistribution?.totalDistributed) || 0));
        return Math.max(0, reward - distributed);
    }

    function previewCalendarEvents(context) {
        const occurrences = getScheduledOccurrences(context.beforeMinute, context.afterMinute);
        if (!occurrences.length) return null;
        return {
            summary: `${occurrences.length} evento${occurrences.length === 1 ? '' : 's'} programado${occurrences.length === 1 ? '' : 's'} será${occurrences.length === 1 ? '' : 'ão'} alcançado${occurrences.length === 1 ? '' : 's'}`,
            occurrences
        };
    }

    function applyCalendarEvents(context) {
        const occurrences = getScheduledOccurrences(context.beforeMinute, context.afterMinute);
        if (!occurrences.length) return null;
        occurrences.forEach(occurrence => {
            if (!clockState.processedOccurrences.includes(occurrence.key)) {
                clockState.processedOccurrences.push(occurrence.key);
            }
        });
        clockState.processedOccurrences = clockState.processedOccurrences.slice(-1000);
        const lines = occurrences.map(occurrence => {
            const type = getEventType(occurrence.event.type);
            return `${type.icon} ${occurrence.event.title} · ${formatDateShort(occurrence.minute)}`;
        });
        global.showToast?.(`🔔 ${occurrences.length} evento${occurrences.length === 1 ? '' : 's'} da campanha alcançado${occurrences.length === 1 ? '' : 's'}.`);
        return {
            summary: `${occurrences.length} evento${occurrences.length === 1 ? '' : 's'} alcançado${occurrences.length === 1 ? '' : 's'}`,
            detail: `Eventos alcançados:\n${lines.join('\n')}`,
            occurrences
        };
    }

    function registerTimeProcessor(processor) {
        if (!processor?.id) throw new Error('O processador temporal precisa de um ID.');
        timeProcessors.set(String(processor.id), processor);
        return () => timeProcessors.delete(String(processor.id));
    }

    function isLivingCombatant(combatant) {
        if (!combatant) return false;
        if (combatant.type === 'monster') return Number(combatant.hpCurrent) > 0;
        return Number(combatant.deathSaves?.failures) < 3;
    }

    function getCombatants() {
        if (typeof combatants !== 'undefined' && Array.isArray(combatants)) return combatants;
        return Array.isArray(global.combatants) ? global.combatants : [];
    }

    function getRoundMinutes() {
        const participants = getCombatants();
        return Math.max(1, participants.filter(isLivingCombatant).length);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function ensureCalendarSelection() {
        const current = describeMinute();
        if (!calendarCursor) calendarCursor = { astronomicalYear: current.astronomicalYear, month: current.month };
        if (!selectedCalendarDate) {
            selectedCalendarDate = current.dateInput;
            selectedCalendarEra = current.era;
        }
    }

    function getDaysInMonth(astronomicalYear, month) {
        const minute = createUtcMinute(astronomicalYear, month + 1, 0, 0, 0);
        return getDateParts(minute).day;
    }

    function getMonthTitle(astronomicalYear, month) {
        const display = fromAstronomicalYear(astronomicalYear);
        return `${MONTHS[month - 1][0].toUpperCase()}${MONTHS[month - 1].slice(1)} de ${display.year} ${display.era}`;
    }

    function renderClockTabs() {
        return `
            <nav class="campaign-clock-tabs" aria-label="Áreas do relógio">
                <button type="button" class="${activeClockView === 'now' ? 'active' : ''}" onclick="setCampaignClockView('now')">Agora</button>
                <button type="button" class="${activeClockView === 'calendar' ? 'active' : ''}" onclick="setCampaignClockView('calendar')">Calendário</button>
                <button type="button" class="${activeClockView === 'agenda' ? 'active' : ''}" onclick="setCampaignClockView('agenda')">Agenda</button>
                <button type="button" class="${activeClockView === 'timeline' ? 'active' : ''}" onclick="setCampaignClockView('timeline')">Linha do Tempo</button>
            </nav>`;
    }

    function getEventStatus(event, occurrenceMinute = null) {
        if (event.completed) return { label: 'Concluído', className: 'completed' };
        if (!getEventType(event.type).scheduled) {
            return event.type === 'history'
                ? { label: 'Histórico', className: 'reference' }
                : { label: 'Nota', className: 'reference' };
        }
        const minute = occurrenceMinute ?? getNextOccurrenceMinute(event);
        if (minute !== null && clockState.processedOccurrences.includes(getOccurrenceKey(event, minute))) {
            return { label: 'Alcançado', className: 'reached' };
        }
        if (minute !== null && minute < clockState.currentMinute && !event.annual) {
            return { label: 'Atrasado', className: 'overdue' };
        }
        return { label: event.annual ? 'Anual' : 'Programado', className: 'scheduled' };
    }

    function renderEventCard(event, options = {}) {
        const info = getEventType(event.type);
        const occurrenceMinute = options.occurrenceMinute ?? getEventOccurrenceMinute(event);
        const status = getEventStatus(event, occurrenceMinute);
        const isOfficialAnnual = event.sourceKind === 'annual-official' || event.readonly;
        const pendingReward = getEventRewardPending(event);
        const distributedReward = Math.max(0, Math.floor(Number(event.rewardDistribution?.totalDistributed) || 0));
        const details = [
            event.dateLabel || (event.allDay ? 'Dia inteiro' : event.time),
            event.annual ? 'Repete anualmente' : '',
            event.groupLabel || '',
            event.contact ? `Contato: ${event.contact}` : '',
            event.reward ? `${event.reward} Coroas${distributedReward ? ` · ${distributedReward} entregue${pendingReward ? ` · ${pendingReward} pendente` : ''}` : (event.completed ? ' · pendente' : '')}` : ''
        ].filter(Boolean);
        const canComplete = !isOfficialAnnual && info.scheduled && event.type !== 'birthday';
        const description = event.description
            ? (isOfficialAnnual
                ? `<details class="campaign-annual-description"><summary>Ver descrição</summary><p>${escapeHtml(event.description)}</p>${event.scheduleNote ? `<small>${escapeHtml(event.scheduleNote)}</small>` : ''}${renderTimelineReferences(event.references)}</details>`
                : `<p>${escapeHtml(event.description)}</p>`)
            : '';

        return `
            <article class="campaign-event-card ${event.completed ? 'is-completed' : ''} ${isOfficialAnnual ? 'is-official-annual' : ''}" data-event-type="${event.type}">
                <div class="campaign-event-icon" aria-hidden="true">${escapeHtml(event.icon || info.icon)}</div>
                <div class="campaign-event-content">
                    <div class="campaign-event-heading"><strong>${escapeHtml(event.title)}</strong><span class="campaign-event-status ${status.className}">${status.label}</span></div>
                    <small>${escapeHtml(isOfficialAnnual ? 'Celebração do Continente' : info.name)} · ${escapeHtml(details.join(' · '))}</small>
                    ${description}
                </div>
                ${isOfficialAnnual ? '' : `<div class="campaign-event-actions">
                    ${event.completed && pendingReward > 0 ? `<button type="button" class="reward" onclick="openCampaignEventReward('${event.id}')" title="Distribuir ${pendingReward} Coroas">💰</button>` : ''}
                    ${canComplete ? `<button type="button" onclick="toggleCampaignEventCompleted('${event.id}')" title="${event.completed ? 'Reabrir' : 'Concluir'}">${event.completed ? '↶' : '✓'}</button>` : ''}
                    <button type="button" onclick="openCampaignEventEditor('${event.id}')" title="Editar">✎</button>
                    <button type="button" class="danger" onclick="requestDeleteCampaignEvent('${event.id}')" title="Excluir">×</button>
                </div>`}
            </article>`;
    }

    function getCampaignRewardRecipients() {
        const entries = typeof combatants !== 'undefined' && Array.isArray(combatants) ? combatants : [];
        return entries.filter(combatant => combatant?.type === 'player');
    }

    function divideCampaignReward(total, recipientIds) {
        if (typeof global.lootRewards?.divideCrowns === 'function') {
            return global.lootRewards.divideCrowns(total, recipientIds);
        }
        const amount = Math.max(0, Math.floor(Number(total) || 0));
        const ids = [...new Set((recipientIds || []).map(String).filter(Boolean))];
        if (!amount || !ids.length) return [];
        const base = Math.floor(amount / ids.length);
        let remainder = amount % ids.length;
        return ids.map(recipientId => ({
            recipientId,
            amount: base + (remainder-- > 0 ? 1 : 0)
        })).filter(entry => entry.amount > 0);
    }

    function addCampaignCrowns(recipient, amount) {
        if (!recipient || amount <= 0) return;
        recipient.inventory = Array.isArray(recipient.inventory) ? recipient.inventory : [];
        const crownDefinition = (Array.isArray(global.predefinedItems) ? global.predefinedItems : [])
            .find(item => item?.id === 'coroa') || {
                id: 'coroa', name: 'Coroa', icon: '👑', category: 'misc', goldValue: 1, weight: 0.01
            };
        const crown = recipient.inventory.find(item => item?.id === 'coroa');
        if (crown) crown.moneyValue = Math.max(0, Number(crown.moneyValue) || 0) + amount;
        else recipient.inventory.push({ ...clone(crownDefinition), id: 'coroa', quantity: 1, moneyValue: amount });
    }

    function ensureCampaignRewardModal() {
        if (!global.document) return null;
        let overlay = document.getElementById('campaignRewardModal');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'campaignRewardModal';
        overlay.className = 'session-overlay campaign-reward-overlay';
        overlay.style.display = 'none';
        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeCampaignEventReward();
        });
        overlay.innerHTML = '<section class="session-dialog campaign-reward-dialog" role="dialog" aria-modal="true" aria-labelledby="campaignRewardTitle"></section>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function updateCampaignRewardPreview() {
        const modal = document.getElementById('campaignRewardModal');
        const event = clockState.events.find(entry => entry.id === modal?.dataset.eventId);
        const output = modal?.querySelector('#campaignRewardPreview');
        if (!event || !output) return;
        const recipients = getCampaignRewardRecipients();
        const selectedIds = [...modal.querySelectorAll('input[name="campaignRewardRecipient"]:checked')]
            .map(input => input.value);
        const plan = divideCampaignReward(getEventRewardPending(event), selectedIds);
        output.textContent = plan.length
            ? plan.map(entry => {
                const recipient = recipients.find(item => String(item.id) === entry.recipientId);
                return `${recipient?.name || 'Personagem'} receberá ${entry.amount}`;
            }).join(' · ')
            : 'Nenhum personagem receberá Coroas enquanto ninguém estiver marcado.';
    }

    function openCampaignEventReward(id) {
        const event = clockState.events.find(entry => entry.id === String(id));
        const pendingReward = getEventRewardPending(event);
        if (!event || !event.completed || pendingReward <= 0) return;
        const recipients = getCampaignRewardRecipients();
        const overlay = ensureCampaignRewardModal();
        const dialog = overlay?.querySelector('.campaign-reward-dialog');
        if (!overlay || !dialog) return;

        overlay.dataset.eventId = event.id;
        dialog.innerHTML = `
            <div class="session-dialog-header">
                <div><small class="campaign-reward-kicker">RECOMPENSA DO EVENTO</small><h2 id="campaignRewardTitle">${escapeHtml(event.title)}</h2></div>
                <button type="button" class="session-close" onclick="closeCampaignEventReward()" aria-label="Fechar">×</button>
            </div>
            <div class="campaign-reward-total"><span>Disponível para entrega</span><strong>👑 ${pendingReward} Coroas</strong></div>
            <p>Marque os jogadores que receberão a recompensa. Quando houver mais de um, o valor será dividido igualmente.</p>
            ${recipients.length ? `
                <div class="campaign-reward-recipients">
                    ${recipients.map(recipient => `
                        <label><input type="checkbox" name="campaignRewardRecipient" value="${escapeHtml(recipient.id)}" onchange="updateCampaignRewardPreview()"><span><strong>${escapeHtml(recipient.name)}</strong><small>Selecionar para a divisão</small></span></label>
                    `).join('')}
                </div>
                <p id="campaignRewardPreview" class="campaign-reward-preview">Nenhum personagem receberá Coroas enquanto ninguém estiver marcado.</p>
            ` : '<p class="campaign-clock-no-impact">Nenhum jogador está no combate. A recompensa continuará pendente até haver um destinatário.</p>'}
            <div class="session-dialog-actions">
                <button type="button" class="session-secondary" onclick="closeCampaignEventReward()">Deixar pendente</button>
                ${recipients.length ? '<button type="button" class="session-primary" onclick="confirmCampaignEventReward()">Entregar Coroas</button>' : ''}
            </div>`;
        overlay.style.display = 'flex';
        updateCampaignRewardPreview();
    }

    function closeCampaignEventReward() {
        const overlay = document.getElementById('campaignRewardModal');
        if (!overlay) return;
        overlay.style.display = 'none';
        delete overlay.dataset.eventId;
    }

    function confirmCampaignEventReward() {
        const overlay = document.getElementById('campaignRewardModal');
        const event = clockState.events.find(entry => entry.id === overlay?.dataset.eventId);
        const pendingReward = getEventRewardPending(event);
        const recipients = getCampaignRewardRecipients();
        const selectedIds = [...(overlay?.querySelectorAll('input[name="campaignRewardRecipient"]:checked') || [])]
            .map(input => input.value);
        const plan = divideCampaignReward(pendingReward, selectedIds).map(entry => ({
            ...entry,
            recipient: recipients.find(recipient => String(recipient.id) === entry.recipientId)
        })).filter(entry => entry.recipient);
        if (!event || pendingReward <= 0) {
            closeCampaignEventReward();
            return;
        }
        if (!plan.length) {
            global.showToast?.('Marque ao menos um jogador ou deixe a recompensa pendente.');
            return;
        }

        const mutate = () => {
            plan.forEach(entry => addCampaignCrowns(entry.recipient, entry.amount));
            const previous = normalizeRewardDistribution(event.rewardDistribution);
            event.rewardDistribution = {
                status: 'distributed',
                totalDistributed: (previous?.totalDistributed || 0) + plan.reduce((total, entry) => total + entry.amount, 0),
                allocations: [
                    ...(previous?.allocations || []),
                    ...plan.map(entry => ({
                        recipientId: String(entry.recipient.id),
                        recipientName: entry.recipient.name,
                        amount: entry.amount
                    }))
                ],
                distributedAt: new Date().toISOString()
            };
            event.updatedAt = new Date().toISOString();
            clockState.revision += 1;
            saveState();

            const visibleOwner = global.getCharacterCollectionOwner?.();
            const updatedVisibleOwner = plan.find(entry => String(entry.recipient.id) === String(visibleOwner?.id))?.recipient;
            if (updatedVisibleOwner && typeof inventory !== 'undefined') inventory = clone(updatedVisibleOwner.inventory);
            global.savePlayersToStorage?.();
            global.persistCharacterCollections?.();
            global.renderInventory?.();
            global.renderList?.(false);
            renderCampaignClock();
        };
        const detail = () => `Evento: ${event.title}\n${plan.map(entry => `${entry.recipient.name}: +${entry.amount} Coroas`).join('\n')}`;
        const metadata = {
            type: 'loot',
            action: 'campaign-event-reward',
            participants: plan.map(entry => ({ id: entry.recipient.id, name: entry.recipient.name }))
        };
        if (typeof global.trackCombatAction === 'function') {
            global.trackCombatAction(`Recompensa entregue: ${event.title}`, mutate, detail, metadata);
        } else {
            mutate();
            global.addCombatHistoryEntry?.(`Recompensa entregue: ${event.title}`, detail(), metadata);
        }
        closeCampaignEventReward();
        global.showToast?.(`👑 ${pendingReward} Coroas distribuídas.`);
    }

    function renderNowView(current, start, roundMinutes) {
        const upcoming = getAgendaEvents().slice(0, 3);
        const moon = getMoonPhase(current.epochMinute);
        return `
            <section class="campaign-clock-section">
                <div class="campaign-clock-section-title"><small>AVANÇO RÁPIDO</small><span>O histórico será agrupado</span></div>
                <div class="campaign-clock-quick-grid">
                    <button type="button" onclick="requestCampaignAdvance(${roundMinutes}, 'round')"><b>+1</b><span>rodada</span></button>
                    <button type="button" onclick="requestCampaignAdvance(10)"><b>+10</b><span>minutos</span></button>
                    <button type="button" onclick="requestCampaignAdvance(60)"><b>+1</b><span>hora</span></button>
                    <button type="button" onclick="requestCampaignAdvance(480)"><b>+8</b><span>horas</span></button>
                    <button type="button" onclick="requestCampaignAdvance(1440)"><b>+1</b><span>dia</span></button>
                </div>
                <div class="campaign-clock-custom">
                    <label><span>Período personalizado</span><input id="campaignClockCustomAmount" type="number" inputmode="numeric" min="1" value="1"></label>
                    <select id="campaignClockCustomUnit" aria-label="Unidade do período"><option value="minutes">minutos</option><option value="hours">horas</option><option value="days">dias</option></select>
                    <button type="button" onclick="requestCustomCampaignAdvance()">Revisar</button>
                </div>
            </section>
            <section class="campaign-clock-upcoming">
                <div class="campaign-clock-section-title"><small>PRÓXIMOS EVENTOS</small><button type="button" onclick="setCampaignClockView('agenda')">Ver agenda</button></div>
                ${upcoming.length
                    ? upcoming.map(event => renderEventCard(event, { occurrenceMinute: event.occurrenceMinute })).join('')
                    : '<p class="campaign-clock-empty">Nenhum evento futuro programado.</p>'}
            </section>
            <details class="campaign-clock-settings">
                <summary>Definir data e horário</summary>
                <p>Ajustar o relógio não reverte efeitos. Para voltar uma ação processada, use Desfazer.</p>
                <div class="campaign-clock-datetime-fields">
                    <label><span>Data</span><input id="campaignClockDateInput" type="date" value="${current.dateInput}"></label>
                    <label><span>Era</span><select id="campaignClockEraInput"><option value="DR" ${current.era === 'DR' ? 'selected' : ''}>DR</option><option value="AR" ${current.era === 'AR' ? 'selected' : ''}>AR</option></select></label>
                    <label><span>Horário</span><input id="campaignClockTimeInput" type="time" value="${current.time}"></label>
                </div>
                <div class="campaign-clock-setting-actions">
                    <button type="button" class="session-secondary" onclick="setCampaignClockDateTime(false)">Ajustar agora</button>
                    <button type="button" class="session-primary" onclick="setCampaignClockDateTime(true)">Definir como início</button>
                </div>
                <small class="campaign-clock-start-caption">Início atual: ${escapeHtml(start.short)} · ${moon.icon} ${escapeHtml(moon.name)}</small>
            </details>`;
    }

    function renderTimelineReferences(references) {
        if (!Array.isArray(references) || !references.length) return '';
        return `<span class="campaign-timeline-links">${references.map(reference => (
            `<a href="${escapeHtml(reference.url)}" target="_blank" rel="noreferrer">${escapeHtml(reference.label)}</a>`
        )).join('')}</span>`;
    }

    function renderOfficialCalendarReference(entry) {
        const precision = entry.precision === 'month'
            ? 'Mês informado; dia não informado na fonte'
            : 'Ano informado; dia e mês não informados na fonte';
        return `
            <article class="campaign-calendar-official-card">
                <div>
                    <span class="campaign-timeline-source official">Cronologia oficial</span>
                    <strong>${escapeHtml(entry.text)}</strong>
                    <small>${escapeHtml(entry.displayDate)} · ${escapeHtml(entry.categoryLabel)} · ${precision}</small>
                    ${renderTimelineReferences(entry.references)}
                </div>
                <button type="button" onclick="showCampaignTimelineEntry('official:${entry.id}')" title="Localizar na Linha do Tempo">↗</button>
            </article>`;
    }

    function renderCalendarView(current) {
        ensureCalendarSelection();
        const { astronomicalYear, month } = calendarCursor;
        const displayYear = fromAstronomicalYear(astronomicalYear);
        const days = getDaysInMonth(astronomicalYear, month);
        const firstWeekday = getDateParts(createUtcMinute(astronomicalYear, month, 1)).weekday;
        const leading = (firstWeekday + 6) % 7;
        const cells = [];
        for (let index = 0; index < leading; index++) cells.push('<span class="campaign-calendar-day is-empty" aria-hidden="true"></span>');

        for (let day = 1; day <= days; day++) {
            const date = `${String(displayYear.year).padStart(4, '0')}-${pad(month)}-${pad(day)}`;
            const dayMinute = minuteFromInputs(date, '00:00', displayYear.era);
            const moon = getMoonPhase(dayMinute);
            const events = getEventsForDate(date, displayYear.era);
            const markerTypes = [...new Set(events.map(event => event.type))].slice(0, 4);
            const classes = [
                'campaign-calendar-day',
                date === current.dateInput && displayYear.era === current.era ? 'is-today' : '',
                date === selectedCalendarDate && displayYear.era === selectedCalendarEra ? 'is-selected' : '',
                events.length ? 'has-events' : ''
            ].filter(Boolean).join(' ');
            cells.push(`
                <button type="button" class="${classes}" onclick="selectCampaignCalendarDate('${date}', '${displayYear.era}')" aria-label="${day} de ${MONTHS[month - 1]} de ${displayYear.year} ${displayYear.era}, ${moon.name}${events.length ? `, ${events.length} registro${events.length === 1 ? '' : 's'}` : ''}">
                    <span>${day}</span>
                    <i class="campaign-calendar-moon" title="${moon.name}" aria-hidden="true">${moon.icon}</i>
                    <span class="campaign-calendar-markers">${markerTypes.map(type => `<i data-event-type="${type}"></i>`).join('')}</span>
                </button>`);
        }

        const selectedEvents = getEventsForDate(selectedCalendarDate, selectedCalendarEra);
        const selectedMinute = minuteFromInputs(selectedCalendarDate, '00:00', selectedCalendarEra);
        const selectedMoon = selectedMinute === null ? null : getMoonPhase(selectedMinute);
        const selectedParts = selectedMinute === null ? null : getDateParts(selectedMinute);
        const officialReferences = selectedParts
            ? getOfficialTimelineEntriesForCalendar(
                selectedParts.year,
                selectedParts.era,
                selectedParts.month,
                selectedParts.day
            )
            : [];
        return `
            <section class="campaign-calendar-layout">
                <div class="campaign-calendar-panel">
                    <div class="campaign-calendar-navigation">
                        <button type="button" onclick="moveCampaignCalendar(-1)" aria-label="Mês anterior">←</button>
                        <strong>${escapeHtml(getMonthTitle(astronomicalYear, month))}</strong>
                        <button type="button" onclick="moveCampaignCalendar(1)" aria-label="Próximo mês">→</button>
                    </div>
                    <div class="campaign-calendar-weekdays" aria-hidden="true"><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span></div>
                    <div class="campaign-calendar-grid">${cells.join('')}</div>
                    <button type="button" class="campaign-calendar-today" onclick="goToCurrentCampaignDate()">Ir para hoje da campanha</button>
                </div>
                <div class="campaign-calendar-day-panel">
                    <div class="campaign-clock-section-title">
                        <div><small>DIA SELECIONADO</small><h3>${selectedMinute === null ? '' : escapeHtml(formatDateLong(selectedMinute))}</h3>${selectedMoon ? `<p class="campaign-selected-moon">${selectedMoon.icon} ${escapeHtml(selectedMoon.name)}</p>` : ''}</div>
                        <button type="button" class="campaign-event-add" onclick="openCampaignEventEditor()">+ Adicionar</button>
                    </div>
                    <div class="campaign-day-events">
                        ${selectedEvents.length
                            ? selectedEvents.map(event => renderEventCard(event)).join('')
                            : '<p class="campaign-clock-empty">Nenhuma nota ou evento neste dia.</p>'}
                    </div>
                    ${officialReferences.length ? `
                        <details class="campaign-calendar-official">
                            <summary>📜 Cronologia oficial deste período (${officialReferences.length})</summary>
                            <p>Referências históricas sem dia exato não são transformadas em eventos agendados.</p>
                            <div>${officialReferences.map(renderOfficialCalendarReference).join('')}</div>
                        </details>
                    ` : ''}
                </div>
            </section>`;
    }

    function renderAgendaView() {
        const pending = getAgendaEvents();
        const completed = clockState.events
            .filter(event => getEventType(event.type).scheduled && event.completed)
            .sort((left, right) => right.date.localeCompare(left.date));
        return `
            <section class="campaign-agenda-panel">
                <div class="campaign-clock-section-title">
                    <div><small>AGENDA DA CAMPANHA</small><h3>${pending.length} pendente${pending.length === 1 ? '' : 's'}</h3></div>
                    <button type="button" class="campaign-event-add" onclick="openCampaignEventEditor()">+ Evento</button>
                </div>
                <div class="campaign-agenda-list">
                    ${pending.length ? pending.map(event => `
                        <div class="campaign-agenda-date"><span>${escapeHtml(formatDateLong(event.occurrenceMinute))}</span><b>${event.allDay ? 'Dia inteiro' : formatTime(event.occurrenceMinute)}</b></div>
                        ${renderEventCard(event, { occurrenceMinute: event.occurrenceMinute })}
                    `).join('') : '<p class="campaign-clock-empty">Nenhum compromisso pendente.</p>'}
                </div>
                ${completed.length ? `<details class="campaign-agenda-completed"><summary>Concluídos (${completed.length})</summary>${completed.map(event => renderEventCard(event)).join('')}</details>` : ''}
            </section>`;
    }

    function getTimelineRelation(entry) {
        if (entry.precision === 'unknown' || entry.precision === 'ambiguous-year') {
            return { label: 'Data incerta', className: 'uncertain' };
        }
        if (entry.precision === 'relative-future') {
            return { label: 'Futuro relativo', className: 'future' };
        }
        const currentParts = getDateParts(clockState.currentMinute);
        if (entry.year === currentParts.year && entry.era === currentParts.era) {
            return { label: 'Ano atual da campanha', className: 'current' };
        }
        const currentSortValue = currentParts.astronomicalYear * 12 + (currentParts.month - 1) + (currentParts.day / 32);
        return entry.sortValue < currentSortValue
            ? { label: 'Antes da campanha', className: 'past' }
            : { label: 'Depois da campanha', className: 'future' };
    }

    function getTimelineSearchText(entry) {
        return normalizeTimelineSearch([
            entry.title,
            entry.description,
            entry.contact,
            entry.displayDate,
            entry.era,
            entry.categoryLabel,
            entry.sourceLabel,
            entry.chronologyNote,
            ...(entry.references || []).map(reference => reference.label)
        ].filter(Boolean).join(' '));
    }

    function renderTimelineCard(entry) {
        const relation = getTimelineRelation(entry);
        const searchText = getTimelineSearchText(entry);
        const filtered = timelineSearch && !searchText.includes(normalizeTimelineSearch(timelineSearch));
        const focused = entry.id === focusedTimelineEntryId;
        const sourceClass = entry.sourceKind === 'official' ? 'official' : 'campaign';
        return `
            <article id="campaignTimeline-${escapeHtml(entry.id)}" class="campaign-timeline-card ${filtered ? 'is-filtered' : ''} ${focused ? 'is-focused' : ''}" data-timeline-search="${escapeHtml(searchText)}" data-timeline-id="${escapeHtml(entry.id)}">
                <div class="campaign-timeline-marker" aria-hidden="true"><span></span></div>
                <div class="campaign-timeline-date">
                    <strong>${escapeHtml(entry.datePrimary)}</strong>
                    <span>${escapeHtml(entry.dateSecondary)}</span>
                </div>
                <div class="campaign-timeline-content">
                    <div class="campaign-timeline-heading">
                        <span class="campaign-timeline-source ${sourceClass}">${escapeHtml(entry.sourceLabel)}</span>
                        <span class="campaign-timeline-relation ${relation.className}">${relation.label}</span>
                    </div>
                    <strong class="campaign-timeline-event-title">${escapeHtml(entry.title)}</strong>
                    ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ''}
                    ${entry.chronologyNote ? `<p class="campaign-timeline-uncertainty">${escapeHtml(entry.chronologyNote)}</p>` : ''}
                    <small>${escapeHtml(entry.displayDate)} · ${escapeHtml(entry.categoryLabel)}${entry.contact ? ` · Referência: ${escapeHtml(entry.contact)}` : ''}</small>
                    ${renderTimelineReferences(entry.references)}
                </div>
                <div class="campaign-timeline-actions">
                    ${entry.calendarNavigable ? `<button type="button" onclick="${entry.sourceKind === 'official' ? `goToOfficialTimelineCalendar('${entry.dataId}')` : `goToCampaignEventDate('${entry.id}')`}" title="Abrir este período no calendário">↗</button>` : ''}
                    ${entry.sourceKind === 'campaign' ? `
                        <button type="button" onclick="openCampaignEventEditor('${entry.id}')" title="Editar anotação histórica">✎</button>
                        <button type="button" class="danger" onclick="requestDeleteCampaignEvent('${entry.id}')" title="Excluir anotação histórica">×</button>
                    ` : ''}
                </div>
            </article>`;
    }

    function renderTimelineView() {
        const entries = getCombinedTimelineEntries({
            era: timelineEra,
            period: timelinePeriod,
            category: timelineCategory,
            order: timelineOrder
        });
        const normalizedSearch = normalizeTimelineSearch(timelineSearch);
        const groups = new Map();
        entries.forEach(entry => {
            if (!groups.has(entry.groupKey)) groups.set(entry.groupKey, { label: entry.groupLabel, entries: [] });
            groups.get(entry.groupKey).entries.push(entry);
        });
        const matchesSearch = entry => !normalizedSearch || getTimelineSearchText(entry).includes(normalizedSearch);
        const visibleCount = entries.filter(matchesSearch).length;
        const categories = global.campaignTimelineData?.CATEGORIES || [];
        const periods = global.campaignTimelineData?.PERIODS || [];

        return `
            <section class="campaign-timeline-panel">
                <div class="campaign-clock-section-title campaign-timeline-title">
                    <div><small>LINHA DO TEMPO DA CAMPANHA</small><h3><span id="campaignTimelineVisibleCount">${visibleCount}</span> acontecimento${visibleCount === 1 ? '' : 's'}</h3></div>
                    <button type="button" class="campaign-event-add" onclick="openCampaignEventEditor('', 'history')">+ Anotação</button>
                </div>
                <p class="campaign-timeline-intro">A cronologia oficial é somente leitura. Anotações históricas da campanha são editáveis; aniversários e datas anuais continuam no Calendário e na Agenda.</p>
                <div class="campaign-timeline-legend" aria-label="Tipos de registro">
                    <span class="campaign-timeline-source official">Cronologia oficial</span>
                    <span class="campaign-timeline-source campaign">Anotação da campanha</span>
                    <span class="campaign-timeline-annual">↻ Evento anual: Calendário/Agenda</span>
                </div>
                <div class="campaign-timeline-filters">
                    <label class="campaign-timeline-search"><span>Buscar</span><input type="search" value="${escapeHtml(timelineSearch)}" placeholder="Acontecimento, pessoa ou lugar" oninput="updateCampaignTimelineSearch(this.value)"></label>
                    <label><span>Era</span><select onchange="setCampaignTimelineEra(this.value)"><option value="all" ${timelineEra === 'all' ? 'selected' : ''}>Todas</option><option value="AR" ${timelineEra === 'AR' ? 'selected' : ''}>AR</option><option value="DR" ${timelineEra === 'DR' ? 'selected' : ''}>DR</option></select></label>
                    <label><span>Período</span><select onchange="setCampaignTimelinePeriod(this.value)"><option value="all" ${timelinePeriod === 'all' ? 'selected' : ''}>Todos</option>${periods.map(period => `<option value="${period.id}" ${timelinePeriod === period.id ? 'selected' : ''}>${escapeHtml(period.label)}</option>`).join('')}</select></label>
                    <label><span>Categoria</span><select onchange="setCampaignTimelineCategory(this.value)"><option value="all" ${timelineCategory === 'all' ? 'selected' : ''}>Todas</option>${categories.map(category => `<option value="${category.id}" ${timelineCategory === category.id ? 'selected' : ''}>${escapeHtml(category.label)}</option>`).join('')}<option value="campaign" ${timelineCategory === 'campaign' ? 'selected' : ''}>Campanha</option></select></label>
                    <label><span>Ordem</span><select onchange="setCampaignTimelineOrder(this.value)"><option value="asc" ${timelineOrder === 'asc' ? 'selected' : ''}>Mais antigos</option><option value="desc" ${timelineOrder === 'desc' ? 'selected' : ''}>Mais recentes</option></select></label>
                </div>
                <div class="campaign-timeline-list">
                    ${entries.length ? [...groups.values()].map(group => {
                        const groupVisibleCount = group.entries.filter(matchesSearch).length;
                        const shouldOpen = Boolean(normalizedSearch)
                            || group.entries.some(entry => entry.id === focusedTimelineEntryId)
                            || group.entries.some(entry => getTimelineRelation(entry).className === 'current');
                        return `
                        <details class="campaign-timeline-group" ${groupVisibleCount ? '' : 'hidden'} ${shouldOpen ? 'open' : ''}>
                            <summary><strong>${escapeHtml(group.label)}</strong><span data-timeline-group-count>${groupVisibleCount} acontecimento${groupVisibleCount === 1 ? '' : 's'}</span></summary>
                            <div>${group.entries.map(renderTimelineCard).join('')}</div>
                        </details>`;
                    }).join('') : '<p class="campaign-clock-empty">Nenhum acontecimento corresponde aos filtros informados.</p>'}
                    <p id="campaignTimelineFilteredEmpty" class="campaign-clock-empty campaign-timeline-filtered-empty" ${visibleCount || !entries.length ? 'hidden' : ''}>Nenhum acontecimento corresponde à busca informada.</p>
                </div>
            </section>`;
    }

    function renderEventEditor() {
        ensureCalendarSelection();
        const existing = clockState.events.find(event => event.id === editingEventId);
        const event = existing || {
            id: '', type: eventEditorPreferredType || 'note', title: '', description: '', date: selectedCalendarDate, era: selectedCalendarEra,
            time: describeMinute().time, allDay: true, annual: false, contact: '', reward: 0
        };
        return `
            <section class="campaign-event-editor">
                <div class="campaign-clock-section-title"><div><small>${existing ? 'EDITAR REGISTRO' : 'NOVO REGISTRO'}</small><h3>${existing ? escapeHtml(existing.title) : 'Adicionar ao calendário'}</h3></div></div>
                <div class="campaign-event-form-grid">
                    <label><span>Tipo</span><select id="campaignEventType" onchange="handleCampaignEventTypeChange(this.value)">${Object.entries(EVENT_TYPES).map(([id, info]) => `<option value="${id}" ${event.type === id ? 'selected' : ''}>${info.icon} ${info.name}</option>`).join('')}</select></label>
                    <label class="campaign-event-title-field"><span>Título</span><input id="campaignEventTitle" maxlength="120" value="${escapeHtml(event.title)}" placeholder="Ex.: Contrato do Grifo"></label>
                    <label><span>Data</span><input id="campaignEventDate" type="date" value="${event.date}"></label>
                    <label><span>Era</span><select id="campaignEventEra"><option value="DR" ${event.era === 'DR' ? 'selected' : ''}>DR</option><option value="AR" ${event.era === 'AR' ? 'selected' : ''}>AR</option></select></label>
                    <label><span>Horário</span><input id="campaignEventTime" type="time" value="${event.time}"></label>
                    <label class="campaign-event-wide"><span>Descrição e anotações</span><textarea id="campaignEventDescription" maxlength="3000" rows="4" placeholder="Informações importantes para a sessão">${escapeHtml(event.description)}</textarea></label>
                    <label><span>Contratante ou contato</span><input id="campaignEventContact" maxlength="160" value="${escapeHtml(event.contact)}" placeholder="Opcional"></label>
                    <label><span>Recompensa em Coroas</span><input id="campaignEventReward" type="number" inputmode="decimal" min="0" value="${event.reward || 0}"></label>
                </div>
                <div class="campaign-event-options">
                    <label><input id="campaignEventAllDay" type="checkbox" ${event.allDay ? 'checked' : ''}><span>Dia inteiro</span></label>
                    <label><input id="campaignEventAnnual" type="checkbox" ${event.annual ? 'checked' : ''}><span>Repetir anualmente</span></label>
                </div>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" onclick="closeCampaignEventEditor()">Cancelar</button>
                    <button type="button" class="session-primary" onclick="saveCampaignEventFromForm()">${existing ? 'Salvar alterações' : 'Adicionar'}</button>
                </div>
            </section>`;
    }

    function ensureClockModal() {
        if (!global.document) return null;
        let overlay = document.getElementById('campaignClockModal');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'campaignClockModal';
        overlay.className = 'session-overlay campaign-clock-overlay';
        overlay.style.display = 'none';
        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeCampaignClock();
        });
        overlay.innerHTML = '<section class="session-dialog campaign-clock-dialog" role="dialog" aria-modal="true" aria-labelledby="campaignClockTitle"></section>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function renderCampaignClock() {
        const overlay = global.document?.getElementById('campaignClockModal');
        const dialog = overlay?.querySelector('.campaign-clock-dialog');
        if (!dialog) return;

        const current = describeMinute();
        const start = describeMinute(clockState.startMinute);
        const moon = getMoonPhase(current.epochMinute);
        const roundMinutes = getRoundMinutes();
        const preview = pendingAdvance;
        const impactList = preview?.impacts?.length
            ? `<ul class="campaign-clock-impact-list">${preview.impacts.map(impact => `<li>${escapeHtml(impact.summary || impact.label || 'Alteração temporal')}</li>`).join('')}</ul>`
            : '<p class="campaign-clock-no-impact">Nenhum efeito em horas ou dias será alterado neste avanço.</p>';

        dialog.innerHTML = `
            <div class="session-dialog-header campaign-clock-header">
                <div><small>RELÓGIO DA CAMPANHA</small><h2 id="campaignClockTitle">Tempo e calendário</h2></div>
                <button type="button" class="session-close" onclick="closeCampaignClock()" aria-label="Fechar">×</button>
            </div>
            <section class="campaign-clock-now" aria-live="polite">
                <div class="campaign-clock-date"><span>Dia ${getDayNumber()}</span><strong>${escapeHtml(current.long)}</strong></div>
                <div class="campaign-clock-time"><strong>${current.time}</strong><span>${escapeHtml(current.medievalHour)}</span><small>${moon.icon} ${escapeHtml(moon.name)}</small></div>
            </section>
            <div class="campaign-clock-context">
                <span>Início: ${escapeHtml(start.short)}</span>
                <span>1 turno = 1 min</span>
                <span>1 rodada atual = ${roundMinutes} min</span>
            </div>
            ${renderClockTabs()}
            ${preview ? `
                <section class="campaign-clock-preview">
                    <small>CONFIRMAR AVANÇO</small>
                    <h3>${escapeHtml(formatDuration(preview.minutes, preview.preferredUnit))}</h3>
                    <div class="campaign-clock-preview-route"><span>${escapeHtml(formatDateShort(preview.beforeMinute))}</span><b>→</b><span>${escapeHtml(formatDateShort(preview.afterMinute))}</span></div>
                    ${impactList}
                    ${preview.recurringDamageDecision ? `
                        <label class="campaign-clock-damage-choice">
                            <input id="campaignClockRecurringDamage" type="checkbox">
                            <span>Aplicar também danos recorrentes e consequências da toxicidade</span>
                        </label>
                    ` : ''}
                    <div class="session-dialog-actions">
                        <button type="button" class="session-secondary" onclick="cancelCampaignAdvance()">Cancelar</button>
                        <button type="button" class="session-primary" onclick="confirmCampaignAdvance()">Avançar</button>
                    </div>
                </section>
            ` : editingEventId !== null
                ? renderEventEditor()
                : activeClockView === 'calendar'
                    ? renderCalendarView(current)
                    : activeClockView === 'agenda'
                        ? renderAgendaView()
                        : activeClockView === 'timeline'
                            ? renderTimelineView()
                            : renderNowView(current, start, roundMinutes)}
        `;
    }

    function openCampaignClock() {
        pendingAdvance = null;
        editingEventId = null;
        ensureCalendarSelection();
        const overlay = ensureClockModal();
        if (!overlay) return;
        overlay.style.display = 'flex';
        renderCampaignClock();
    }

    function closeCampaignClock() {
        const overlay = global.document?.getElementById('campaignClockModal');
        if (overlay) overlay.style.display = 'none';
        pendingAdvance = null;
    }

    function setCampaignClockView(view) {
        activeClockView = ['now', 'calendar', 'agenda', 'timeline'].includes(view) ? view : 'now';
        pendingAdvance = null;
        editingEventId = null;
        eventEditorPreferredType = '';
        if (activeClockView !== 'timeline') focusedTimelineEntryId = '';
        ensureCalendarSelection();
        renderCampaignClock();
    }

    function moveCampaignCalendar(offset) {
        ensureCalendarSelection();
        const date = new Date(createUtcMinute(calendarCursor.astronomicalYear, calendarCursor.month, 1) * 60000);
        date.setUTCMonth(date.getUTCMonth() + Number(offset || 0));
        calendarCursor = { astronomicalYear: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
        renderCampaignClock();
    }

    function selectCampaignCalendarDate(dateValue, era = 'DR') {
        if (minuteFromInputs(dateValue, '00:00', era) === null) return;
        selectedCalendarDate = dateValue;
        selectedCalendarEra = String(era).toUpperCase() === 'AR' ? 'AR' : 'DR';
        activeClockView = 'calendar';
        editingEventId = null;
        renderCampaignClock();
    }

    function goToCurrentCampaignDate() {
        const current = describeMinute();
        calendarCursor = { astronomicalYear: current.astronomicalYear, month: current.month };
        selectedCalendarDate = current.dateInput;
        selectedCalendarEra = current.era;
        renderCampaignClock();
    }

    function goToCampaignEventDate(id) {
        const event = clockState.events.find(entry => entry.id === String(id));
        if (!event) return;
        const minute = getEventOccurrenceMinute(event);
        if (minute === null) return;
        const parts = getDateParts(minute);
        calendarCursor = { astronomicalYear: parts.astronomicalYear, month: parts.month };
        selectedCalendarDate = event.date;
        selectedCalendarEra = event.era;
        activeClockView = 'calendar';
        editingEventId = null;
        eventEditorPreferredType = '';
        renderCampaignClock();
    }

    function goToOfficialTimelineCalendar(id) {
        const entry = global.campaignTimelineData?.getEntry?.(id);
        if (!entry || entry.parsedDate.kind !== 'dated') return;
        const month = entry.month || 1;
        const date = `${String(entry.year).padStart(4, '0')}-${pad(month)}-01`;
        const minute = minuteFromInputs(date, '00:00', entry.era);
        if (minute === null) return;
        const parts = getDateParts(minute);
        calendarCursor = { astronomicalYear: parts.astronomicalYear, month: parts.month };
        selectedCalendarDate = date;
        selectedCalendarEra = entry.era;
        activeClockView = 'calendar';
        focusedTimelineEntryId = '';
        renderCampaignClock();
    }

    function showCampaignTimelineEntry(id) {
        const safeId = String(id || '');
        if (!safeId) return;
        activeClockView = 'timeline';
        timelineSearch = '';
        timelineEra = 'all';
        timelinePeriod = 'all';
        timelineCategory = 'all';
        focusedTimelineEntryId = safeId;
        renderCampaignClock();
        setTimeout(() => {
            global.document?.querySelector(`[data-timeline-id="${safeId}"]`)?.scrollIntoView?.({ block: 'center' });
        }, 0);
    }

    function updateCampaignTimelineSearch(value) {
        timelineSearch = String(value || '');
        focusedTimelineEntryId = '';
        const normalized = normalizeTimelineSearch(timelineSearch);
        const cards = [...(global.document?.querySelectorAll('.campaign-timeline-card') || [])];
        let visibleTotal = 0;
        cards.forEach(card => {
            const visible = !normalized || String(card.dataset.timelineSearch || '').includes(normalized);
            card.classList.toggle('is-filtered', !visible);
            if (visible) visibleTotal++;
        });
        [...(global.document?.querySelectorAll('.campaign-timeline-group') || [])].forEach(group => {
            const visible = [...group.querySelectorAll('.campaign-timeline-card')]
                .filter(card => !card.classList.contains('is-filtered')).length;
            group.hidden = visible === 0;
            if (normalized && visible > 0) group.open = true;
            const count = group.querySelector('[data-timeline-group-count]');
            if (count) count.textContent = `${visible} acontecimento${visible === 1 ? '' : 's'}`;
        });
        const count = global.document?.getElementById('campaignTimelineVisibleCount');
        if (count) count.textContent = String(visibleTotal);
        const empty = global.document?.getElementById('campaignTimelineFilteredEmpty');
        if (empty) empty.hidden = visibleTotal > 0 || cards.length === 0;
    }

    function setCampaignTimelineEra(value) {
        timelineEra = ['AR', 'DR'].includes(String(value || '').toUpperCase())
            ? String(value).toUpperCase()
            : 'all';
        renderCampaignClock();
    }

    function setCampaignTimelinePeriod(value) {
        const valid = global.campaignTimelineData?.PERIODS?.some(period => period.id === value);
        timelinePeriod = valid ? value : 'all';
        focusedTimelineEntryId = '';
        renderCampaignClock();
    }

    function setCampaignTimelineCategory(value) {
        const valid = value === 'campaign'
            || global.campaignTimelineData?.CATEGORIES?.some(category => category.id === value);
        timelineCategory = valid ? value : 'all';
        focusedTimelineEntryId = '';
        renderCampaignClock();
    }

    function setCampaignTimelineOrder(value) {
        timelineOrder = value === 'desc' ? 'desc' : 'asc';
        renderCampaignClock();
    }

    function openCampaignEventEditor(id = '', preferredType = '') {
        ensureCalendarSelection();
        eventEditorReturnView = activeClockView;
        editingEventId = String(id || '');
        eventEditorPreferredType = EVENT_TYPES[preferredType] ? preferredType : '';
        pendingAdvance = null;
        renderCampaignClock();
        global.document?.getElementById('campaignEventTitle')?.focus();
    }

    function closeCampaignEventEditor() {
        editingEventId = null;
        eventEditorPreferredType = '';
        renderCampaignClock();
    }

    function handleCampaignEventTypeChange(type) {
        const allDay = document.getElementById('campaignEventAllDay');
        const annual = document.getElementById('campaignEventAnnual');
        if (type === 'note' && allDay) allDay.checked = true;
        if (type === 'birthday' || type === 'festival') {
            if (allDay) allDay.checked = true;
            if (annual) annual.checked = true;
        }
        if (type === 'history' && annual) annual.checked = false;
    }

    function trackCalendarAction(label, callback, detail) {
        if (typeof global.trackCombatAction === 'function') {
            return global.trackCombatAction(label, callback, detail, { type: 'time' });
        }
        const result = callback();
        global.addCombatHistoryEntry?.(label, typeof detail === 'function' ? detail() : detail, { type: 'time' });
        return result;
    }

    function saveCampaignEventFromForm() {
        const type = document.getElementById('campaignEventType')?.value || 'note';
        const title = document.getElementById('campaignEventTitle')?.value.trim() || '';
        const date = document.getElementById('campaignEventDate')?.value || '';
        const era = document.getElementById('campaignEventEra')?.value || 'DR';
        const time = document.getElementById('campaignEventTime')?.value || '00:00';
        if (!title) {
            global.showToast?.('Informe um título para o registro.');
            document.getElementById('campaignEventTitle')?.focus();
            return;
        }
        if (minuteFromInputs(date, time, era) === null) {
            global.showToast?.('Informe uma data e um horário válidos.');
            return;
        }

        const previous = clockState.events.find(event => event.id === editingEventId);
        const data = {
            ...previous,
            id: previous?.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            title,
            date,
            era,
            time,
            description: document.getElementById('campaignEventDescription')?.value || '',
            contact: document.getElementById('campaignEventContact')?.value || '',
            reward: document.getElementById('campaignEventReward')?.value || 0,
            allDay: type === 'note' || Boolean(document.getElementById('campaignEventAllDay')?.checked),
            annual: type !== 'history' && Boolean(document.getElementById('campaignEventAnnual')?.checked),
            updatedAt: new Date().toISOString()
        };
        let saved;
        const actionLabel = previous ? `Calendário: ${title} atualizado` : `Calendário: ${title} adicionado`;
        trackCalendarAction(
            actionLabel,
            () => { saved = upsertEvent(data); },
            () => {
                const info = getEventType(saved.type);
                const details = [
                    `Tipo: ${info.name}`,
                    `Data: ${saved.date}${saved.allDay ? ' · dia inteiro' : ` às ${saved.time}`}`,
                    saved.annual ? 'Recorrência: anual' : '',
                    saved.contact ? `Contato: ${saved.contact}` : '',
                    saved.reward ? `Recompensa: ${saved.reward} Coroas` : ''
                ].filter(Boolean);
                return details.join('\n');
            }
        );
        selectedCalendarDate = saved.date;
        selectedCalendarEra = saved.era;
        calendarCursor = getDateParts(minuteFromInputs(saved.date, '00:00', saved.era));
        calendarCursor = { astronomicalYear: calendarCursor.astronomicalYear, month: calendarCursor.month };
        editingEventId = null;
        eventEditorPreferredType = '';
        activeClockView = saved.type === 'history' || eventEditorReturnView === 'timeline'
            ? 'timeline'
            : 'calendar';
        renderCampaignClock();
        global.showToast?.(`${getEventType(saved.type).icon} ${previous ? 'Registro atualizado' : 'Registro adicionado'}.`);
    }

    function toggleCampaignEventCompleted(id) {
        const event = clockState.events.find(entry => entry.id === String(id));
        if (!event) return;
        let changed;
        const completed = !event.completed;
        trackCalendarAction(
            `Calendário: ${event.title} ${completed ? 'concluído' : 'reaberto'}`,
            () => { changed = setEventCompleted(event.id, completed); },
            () => [
                `${getEventType(changed.type).name} · ${changed.date}${changed.allDay ? '' : ` às ${changed.time}`}`,
                completed && getEventRewardPending(changed) > 0
                    ? `Recompensa pendente: ${getEventRewardPending(changed)} Coroas.`
                    : ''
            ].filter(Boolean).join('\n')
        );
        global.showToast?.(completed ? '✓ Evento concluído.' : '↶ Evento reaberto.');
        if (completed && getEventRewardPending(changed) > 0) openCampaignEventReward(changed.id);
    }

    function requestDeleteCampaignEvent(id) {
        const event = clockState.events.find(entry => entry.id === String(id));
        if (!event) return;
        const execute = () => {
            let removed;
            trackCalendarAction(
                `Calendário: ${event.title} removido`,
                () => { removed = removeEvent(event.id); },
                () => `${getEventType(removed.type).name} · ${removed.date}${removed.allDay ? '' : ` às ${removed.time}`}`
            );
            global.showToast?.('🗑️ Registro removido do calendário.');
        };
        if (typeof global.openSessionConfirm === 'function') {
            global.openSessionConfirm({
                title: 'Excluir registro?',
                message: `“${event.title}” será removido do calendário. Você poderá desfazer esta ação.`,
                confirmLabel: 'Excluir',
                danger: true,
                onConfirm: execute
            });
        } else if (global.confirm?.(`Excluir “${event.title}”?`)) {
            execute();
        }
    }

    function requestCampaignAdvance(minutes, preferredUnit = '') {
        const preview = previewAdvance(minutes, { source: preferredUnit === 'round' ? 'round-jump' : 'manual-jump' });
        if (preview.minutes <= 0) {
            global.showToast?.('Informe um período válido.');
            return;
        }
        if (preview.minutes > MAX_MANUAL_ADVANCE_MINUTES) {
            global.showToast?.('O salto máximo permitido é de 100 anos por ação.');
            return;
        }
        pendingAdvance = { ...preview, preferredUnit };
        renderCampaignClock();
    }

    function requestCustomCampaignAdvance() {
        const amount = Math.max(0, Math.floor(Number(document.getElementById('campaignClockCustomAmount')?.value) || 0));
        const unit = document.getElementById('campaignClockCustomUnit')?.value || 'minutes';
        const multiplier = unit === 'days' ? MINUTES_PER_DAY : unit === 'hours' ? MINUTES_PER_HOUR : 1;
        requestCampaignAdvance(amount * multiplier);
    }

    function cancelCampaignAdvance() {
        pendingAdvance = null;
        renderCampaignClock();
    }

    function buildAdvanceDetail(result) {
        const lines = [
            `Período: ${formatDuration(result.context.minutes, pendingAdvance?.preferredUnit)}`,
            `Antes: ${result.before.short} · ${result.before.medievalHour}`,
            `Depois: ${result.after.short} · ${result.after.medievalHour}`,
            `Dia da campanha: ${getDayNumber()}`
        ];
        result.results.forEach(entry => lines.push(entry.detail || entry.summary || String(entry)));
        return lines.join('\n');
    }

    function confirmCampaignAdvance() {
        if (!pendingAdvance) return;
        const request = pendingAdvance;
        const processRecurringDamage = Boolean(document.getElementById('campaignClockRecurringDamage')?.checked);
        const durationLabel = formatDuration(request.minutes, request.preferredUnit);
        let result;
        const action = () => {
            result = advanceByMinutes(request.minutes, {
                source: request.source,
                processRecurringDamage
            });
            return result;
        };
        const metadata = () => ({
            type: 'time',
            combat: {
                minutes: request.minutes,
                beforeMinute: request.beforeMinute,
                afterMinute: request.afterMinute,
                processRecurringDamage
            }
        });

        if (typeof global.trackCombatAction === 'function') {
            global.trackCombatAction(
                `Tempo avançado: ${durationLabel}`,
                action,
                () => buildAdvanceDetail(result),
                metadata
            );
        } else {
            action();
            global.addCombatHistoryEntry?.(`Tempo avançado: ${durationLabel}`, buildAdvanceDetail(result), metadata());
        }

        pendingAdvance = null;
        renderCampaignClock();
        global.showToast?.(`🕰️ Tempo avançado: ${durationLabel}.`);
    }

    function setCampaignClockDateTime(resetStart) {
        const target = minuteFromInputs(
            document.getElementById('campaignClockDateInput')?.value,
            document.getElementById('campaignClockTimeInput')?.value,
            document.getElementById('campaignClockEraInput')?.value || 'DR'
        );
        if (target === null) {
            global.showToast?.('Informe uma data e um horário válidos.');
            return;
        }

        let result;
        const label = resetStart ? 'Início da campanha definido' : 'Relógio da campanha ajustado';
        const action = () => {
            result = setDateTime(target, resetStart);
            return result;
        };
        const detail = () => result?.changed
            ? `${result.before.short} → ${result.after.short}\n${result.after.medievalHour}${resetStart ? '\nDia da campanha reiniciado em 1' : ''}`
            : 'Data e horário mantidos.';

        if (typeof global.trackCombatAction === 'function') {
            global.trackCombatAction(label, action, detail, { type: 'time' });
        } else {
            action();
            if (result?.changed) global.addCombatHistoryEntry?.(label, detail(), { type: 'time' });
        }
        global.showToast?.(resetStart ? '🗓️ Início da campanha definido.' : '🕰️ Relógio ajustado.');
        renderCampaignClock();
    }

    registerTimeProcessor({
        id: 'campaign-calendar-events',
        name: 'Agenda da campanha',
        preview: previewCalendarEvents,
        apply: applyCalendarEvents
    });

    const api = {
        STORAGE_KEY,
        STATE_VERSION,
        MINUTES_PER_HOUR,
        MINUTES_PER_DAY,
        DEFAULT_CAMPAIGN_YEAR,
        MOON_CYCLE_MINUTES,
        MEDIEVAL_HOURS,
        MOON_PHASES,
        EVENT_TYPES,
        createInitialState,
        normalizeState,
        minuteFromInputs,
        toAstronomicalYear,
        fromAstronomicalYear,
        getDateParts,
        getDayNumber,
        getMedievalHour,
        getMoonPhase,
        formatDateShort,
        formatDateLong,
        formatDuration,
        describeMinute,
        getSnapshot,
        restoreSnapshot,
        previewAdvance,
        advanceByMinutes,
        setDateTime,
        registerTimeProcessor,
        getRoundMinutes,
        normalizeEvent,
        normalizeCharacterBirthDate,
        formatCharacterBirthDate,
        getCharacterAge,
        getEvents,
        getAnnualCalendarEvents,
        getEventsForDate,
        getScheduledOccurrences,
        getAgendaEvents,
        getTimelineEvents,
        getCombinedTimelineEntries,
        getOfficialTimelineEntriesForCalendar,
        upsertEvent,
        removeEvent,
        setEventCompleted,
        getEventRewardPending,
        syncCharacterBirthday,
        removeCharacterBirthday
    };

    global.campaignClock = api;
    global.openCampaignClock = openCampaignClock;
    global.closeCampaignClock = closeCampaignClock;
    global.requestCampaignAdvance = requestCampaignAdvance;
    global.requestCustomCampaignAdvance = requestCustomCampaignAdvance;
    global.cancelCampaignAdvance = cancelCampaignAdvance;
    global.confirmCampaignAdvance = confirmCampaignAdvance;
    global.setCampaignClockDateTime = setCampaignClockDateTime;
    global.setCampaignClockView = setCampaignClockView;
    global.moveCampaignCalendar = moveCampaignCalendar;
    global.selectCampaignCalendarDate = selectCampaignCalendarDate;
    global.goToCurrentCampaignDate = goToCurrentCampaignDate;
    global.goToCampaignEventDate = goToCampaignEventDate;
    global.goToOfficialTimelineCalendar = goToOfficialTimelineCalendar;
    global.showCampaignTimelineEntry = showCampaignTimelineEntry;
    global.updateCampaignTimelineSearch = updateCampaignTimelineSearch;
    global.setCampaignTimelineEra = setCampaignTimelineEra;
    global.setCampaignTimelinePeriod = setCampaignTimelinePeriod;
    global.setCampaignTimelineCategory = setCampaignTimelineCategory;
    global.setCampaignTimelineOrder = setCampaignTimelineOrder;
    global.openCampaignEventEditor = openCampaignEventEditor;
    global.closeCampaignEventEditor = closeCampaignEventEditor;
    global.handleCampaignEventTypeChange = handleCampaignEventTypeChange;
    global.saveCampaignEventFromForm = saveCampaignEventFromForm;
    global.toggleCampaignEventCompleted = toggleCampaignEventCompleted;
    global.openCampaignEventReward = openCampaignEventReward;
    global.closeCampaignEventReward = closeCampaignEventReward;
    global.updateCampaignRewardPreview = updateCampaignRewardPreview;
    global.confirmCampaignEventReward = confirmCampaignEventReward;
    global.requestDeleteCampaignEvent = requestDeleteCampaignEvent;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
