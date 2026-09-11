(function (root, factory) {
    const api = factory();

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const WORLD_SCHEMA_VERSION = 10;
    const WORLD_EXPORT_FORMAT = 'witcher-combat-world';
    const WORLD_EXPORT_VERSION = 1;
    const ROOT_CONTINENT_ID = 'world-continent';
    const LOCATION_TYPES = Object.freeze({
        CONTINENT: 'continent',
        REALM: 'realm',
        PROVINCE: 'province',
        LOCATION: 'location'
    });
    const LOCATION_TYPE_VALUES = Object.freeze(Object.values(LOCATION_TYPES));
    const NPC_RELATIONSHIPS = Object.freeze(['unknown', 'neutral', 'friendly', 'allied', 'hostile', 'rival']);
    const MERCHANT_CATEGORIES = Object.freeze([
        'blacksmith', 'tailor', 'leatherworker', 'herbalist', 'farmer', 'food_vendor',
        'alchemist', 'artisan', 'miner', 'stablemaster', 'innkeeper', 'general', 'other'
    ]);
    const MERCHANT_RESTOCK_MODES = Object.freeze(['manual', 'daily', 'weekly', 'custom']);
    const WORLD_EVENT_RECURRENCES = Object.freeze(['none', 'daily', 'weekly', 'annual']);
    const DEFAULT_MAP_SETTINGS = Object.freeze({
        pixelsPerGrid: 576,
        kilometersPerGrid: 100,
        scaleVersion: 2
    });
    const PARENT_TYPES = Object.freeze({
        [LOCATION_TYPES.CONTINENT]: Object.freeze([]),
        [LOCATION_TYPES.REALM]: Object.freeze([LOCATION_TYPES.CONTINENT]),
        [LOCATION_TYPES.PROVINCE]: Object.freeze([LOCATION_TYPES.REALM]),
        [LOCATION_TYPES.LOCATION]: Object.freeze([
            LOCATION_TYPES.CONTINENT,
            LOCATION_TYPES.REALM,
            LOCATION_TYPES.PROVINCE,
            LOCATION_TYPES.LOCATION
        ])
    });

    function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    }

    function makeLocationId(type = LOCATION_TYPES.LOCATION) {
        const normalizedType = LOCATION_TYPE_VALUES.includes(type) ? type : LOCATION_TYPES.LOCATION;
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-${normalizedType}-${uuid}`;
        return `world-${normalizedType}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeNpcId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-npc-${uuid}`;
        return `world-npc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeNpcMovementId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-npc-movement-${uuid}`;
        return `world-npc-movement-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeMerchantEntryId(kind = 'entry') {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-merchant-${kind}-${uuid}`;
        return `world-merchant-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeMerchantTransactionId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-merchant-transaction-${uuid}`;
        return `world-merchant-transaction-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeWorldTravelId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-travel-${uuid}`;
        return `world-travel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeWorldEventId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-event-${uuid}`;
        return `world-event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function makeNpcScheduleId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `world-npc-schedule-${uuid}`;
        return `world-npc-schedule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizeText(value, fallback = '', maximum = 180) {
        return String(value ?? fallback).trim().slice(0, maximum);
    }

    function createRootContinent(now = new Date().toISOString()) {
        return {
            id: ROOT_CONTINENT_ID,
            type: LOCATION_TYPES.CONTINENT,
            parentId: null,
            name: 'O Continente',
            description: '',
            origin: 'official',
            visibility: 'public',
            aliases: [],
            coordinates: null,
            createdAt: now,
            updatedAt: now
        };
    }

    function createEmptyWorld(options = {}) {
        const now = options.now || new Date().toISOString();
        return {
            schemaVersion: WORLD_SCHEMA_VERSION,
            rootLocationId: ROOT_CONTINENT_ID,
            currentLocationId: null,
            politicalAtlasVersion: 0,
            canonicalCatalogVersion: 0,
            historicalCatalogVersion: 0,
            cartographicCatalogVersion: 0,
            mapSettings: { ...DEFAULT_MAP_SETTINGS },
            locations: [createRootContinent(now)],
            npcs: [],
            travelHistory: [],
            regionalEvents: [],
            createdAt: now,
            updatedAt: now
        };
    }

    function normalizeCoordinates(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const x = Number(value.x);
        const y = Number(value.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return {
            x: Math.min(100, Math.max(0, x)),
            y: Math.min(100, Math.max(0, y))
        };
    }

    function normalizeMapSettings(value) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const pixelsPerGrid = Number(source.pixelsPerGrid);
        const kilometersPerGrid = Number(source.kilometersPerGrid);
        const scaleVersion = Math.max(0, Math.floor(Number(source.scaleVersion) || 0));
        const validKilometersPerGrid = Number.isFinite(kilometersPerGrid) && kilometersPerGrid > 0
            ? Math.min(5000, Math.max(1, Math.round(kilometersPerGrid * 10) / 10))
            : DEFAULT_MAP_SETTINGS.kilometersPerGrid;
        return {
            pixelsPerGrid: Number.isFinite(pixelsPerGrid) && pixelsPerGrid > 0
                ? Math.min(10000, Math.max(1, pixelsPerGrid))
                : DEFAULT_MAP_SETTINGS.pixelsPerGrid,
            kilometersPerGrid: scaleVersion < DEFAULT_MAP_SETTINGS.scaleVersion && validKilometersPerGrid === 390
                ? DEFAULT_MAP_SETTINGS.kilometersPerGrid
                : validKilometersPerGrid,
            scaleVersion: DEFAULT_MAP_SETTINGS.scaleVersion
        };
    }

    function normalizeSources(value) {
        return (Array.isArray(value) ? value : []).map(source => ({
            title: normalizeText(source?.title, 'Fonte', 160),
            url: normalizeText(source?.url, '', 500)
        })).filter(source => /^https:\/\//i.test(source.url));
    }

    function normalizeRelations(value) {
        return (Array.isArray(value) ? value : []).map(relation => ({
            type: normalizeText(relation?.type, 'related-to', 80),
            targetId: normalizeText(relation?.targetId, '', 160),
            label: normalizeText(relation?.label, '', 120),
            note: normalizeText(relation?.note, '', 1000)
        })).filter(relation => relation.targetId);
    }

    function normalizeNpcChronology(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const year = Math.max(1, Math.floor(Number(value.year) || 1));
        return {
            year,
            era: value.era === 'AR' ? 'AR' : 'DR',
            month: Math.min(12, Math.max(1, Math.floor(Number(value.month) || 1))),
            day: Math.min(31, Math.max(1, Math.floor(Number(value.day) || 1))),
            hour: Math.min(23, Math.max(0, Math.floor(Number(value.hour) || 0))),
            minute: Math.min(59, Math.max(0, Math.floor(Number(value.minute) || 0))),
            campaignMinute: Number.isFinite(Number(value.campaignMinute)) ? Number(value.campaignMinute) : null
        };
    }

    function normalizeClockTime(value, fallback = '08:00') {
        const text = String(value || '');
        if (!/^\d{2}:\d{2}$/.test(text)) return fallback;
        const [hour, minute] = text.split(':').map(Number);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    function normalizeWeekdays(value) {
        const days = [...new Set((Array.isArray(value) ? value : [0, 1, 2, 3, 4, 5, 6])
            .map(Number)
            .filter(day => Number.isInteger(day) && day >= 0 && day <= 6))];
        return days.length ? days.sort((left, right) => left - right) : [0, 1, 2, 3, 4, 5, 6];
    }

    function normalizeOpeningSchedule(value) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        return {
            enabled: source.enabled === true,
            weekdays: normalizeWeekdays(source.weekdays),
            opensAt: normalizeClockTime(source.opensAt, '08:00'),
            closesAt: normalizeClockTime(source.closesAt, '18:00')
        };
    }

    function normalizeNpcScheduleEntry(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        return {
            id: normalizeText(source.id || makeNpcScheduleId(), '', 180),
            label: normalizeText(source.label, 'Rotina', 120),
            locationId: normalizeText(source.locationId, '', 160) || null,
            weekdays: normalizeWeekdays(source.weekdays),
            startsAt: normalizeClockTime(source.startsAt, '08:00'),
            endsAt: normalizeClockTime(source.endsAt, '18:00'),
            visibility: source.visibility === 'private' ? 'private' : 'public',
            publicInfo: normalizeText(source.publicInfo, '', 1000),
            privateNotes: normalizeText(source.privateNotes, '', 2000),
            createdAt: source.createdAt || now,
            updatedAt: source.updatedAt || now
        };
    }

    function normalizeWorldTravel(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const departureMinute = Number.isFinite(Number(source.departureMinute)) ? Math.floor(Number(source.departureMinute)) : null;
        const arrivalMinute = Number.isFinite(Number(source.arrivalMinute)) ? Math.floor(Number(source.arrivalMinute)) : departureMinute;
        const travelers = (Array.isArray(source.travelers) ? source.travelers : [])
            .map(entry => ({
                id: normalizeText(entry?.id, '', 180) || null,
                name: normalizeText(entry?.name, 'Personagem', 160),
                role: entry?.role === 'companion' ? 'companion' : 'leader'
            }))
            .filter((entry, index, list) => list.findIndex(candidate =>
                (entry.id && candidate.id === entry.id)
                || (!entry.id && !candidate.id && candidate.name === entry.name)) === index);
        if (!travelers.length && (source.travelerId || source.travelerName)) {
            travelers.push({
                id: normalizeText(source.travelerId, '', 180) || null,
                name: normalizeText(source.travelerName, 'Personagem', 160),
                role: 'leader'
            });
        }
        return {
            id: normalizeText(source.id || makeWorldTravelId(), '', 180),
            fromLocationId: normalizeText(source.fromLocationId, '', 160) || null,
            fromLocationName: normalizeText(source.fromLocationName, 'Local não definido', 160),
            toLocationId: normalizeText(source.toLocationId, '', 160) || null,
            toLocationName: normalizeText(source.toLocationName, 'Local não definido', 160),
            departureMinute,
            arrivalMinute,
            durationMinutes: Math.max(0, Math.floor(Number(source.durationMinutes) || 0)),
            transportMode: ['foot', 'horse', 'carriage', 'portal'].includes(source.transportMode) ? source.transportMode : 'foot',
            transportLabel: normalizeText(source.transportLabel, 'A pé', 160),
            transportAssetId: normalizeText(source.transportAssetId, '', 180) || null,
            travelerId: normalizeText(source.travelerId, '', 180) || null,
            travelerName: normalizeText(source.travelerName, '', 160),
            travelers,
            distanceKm: Math.max(0, Math.round((Number(source.distanceKm) || 0) * 10) / 10),
            roadDistanceKm: Math.max(0, Math.round((Number(source.roadDistanceKm) || 0) * 10) / 10),
            offRoadDistanceKm: Math.max(0, Math.round((Number(source.offRoadDistanceKm) || 0) * 10) / 10),
            routeNodeIds: [...new Set((Array.isArray(source.routeNodeIds) ? source.routeNodeIds : []).map(id => normalizeText(id, '', 180)).filter(Boolean))],
            routeSegmentIds: [...new Set((Array.isArray(source.routeSegmentIds) ? source.routeSegmentIds : []).map(id => normalizeText(id, '', 180)).filter(Boolean))],
            routeAlgorithm: ['astar', 'portal'].includes(source.routeAlgorithm) ? source.routeAlgorithm : null,
            scaleKilometersPerGrid: Math.max(0, Number(source.scaleKilometersPerGrid) || 0),
            movedNpcIds: [...new Set((Array.isArray(source.movedNpcIds) ? source.movedNpcIds : []).map(id => normalizeText(id, '', 160)).filter(Boolean))],
            note: normalizeText(source.note, '', 2000),
            visibility: source.visibility === 'private' ? 'private' : 'public',
            chronology: normalizeNpcChronology(source.chronology),
            createdAt: source.createdAt || now
        };
    }

    function normalizeRegionalEvent(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const startMinute = Number.isFinite(Number(source.startMinute)) ? Math.floor(Number(source.startMinute)) : 0;
        const endMinute = Number.isFinite(Number(source.endMinute))
            ? Math.max(startMinute, Math.floor(Number(source.endMinute)))
            : startMinute;
        return {
            id: normalizeText(source.id || makeWorldEventId(), '', 180),
            title: normalizeText(source.title, 'Evento regional', 160),
            description: normalizeText(source.description, '', 3000),
            locationId: normalizeText(source.locationId, '', 160) || null,
            startMinute,
            endMinute,
            recurrence: WORLD_EVENT_RECURRENCES.includes(source.recurrence) ? source.recurrence : 'none',
            visibility: source.visibility === 'private' ? 'private' : 'public',
            privateNotes: normalizeText(source.privateNotes, '', 4000),
            enabled: source.enabled !== false,
            lastTriggeredOccurrence: normalizeText(source.lastTriggeredOccurrence, '', 180) || null,
            processedOccurrences: (Array.isArray(source.processedOccurrences) ? source.processedOccurrences : [])
                .map(entry => normalizeText(entry, '', 180))
                .filter(Boolean)
                .slice(-500),
            createdAt: source.createdAt || now,
            updatedAt: source.updatedAt || now
        };
    }

    function normalizeNpcMovement(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const fromLocationId = normalizeText(source.fromLocationId, '', 160) || null;
        const toLocationId = normalizeText(source.toLocationId, '', 160) || null;
        const fallbackId = `world-npc-movement-${normalizeText(source.movedAt || now, now, 80)}-${fromLocationId || 'unknown'}-${toLocationId || 'unknown'}`;
        return {
            id: normalizeText(source.id || fallbackId, '', 240),
            fromLocationId,
            fromLocationName: normalizeText(source.fromLocationName, 'Local desconhecido', 160),
            toLocationId,
            toLocationName: normalizeText(source.toLocationName, 'Local desconhecido', 160),
            note: normalizeText(source.note, '', 1000),
            chronology: normalizeNpcChronology(source.chronology),
            movedAt: source.movedAt || now
        };
    }

    function normalizeMerchantCatalogEntry(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const maximumStock = Math.max(0, Math.floor(Number(source.maximumStock) || 0));
        return {
            id: normalizeText(source.id || makeMerchantEntryId('item'), '', 180),
            itemId: normalizeText(source.itemId, '', 160),
            stock: Math.min(maximumStock, Math.max(0, Math.floor(Number(source.stock) || 0))),
            maximumStock,
            price: Math.max(0, Math.round(Number(source.price) || 0)),
            restockQuantity: Math.max(0, Math.floor(Number(source.restockQuantity) || 0)),
            enabled: source.enabled !== false,
            updatedAt: source.updatedAt || now
        };
    }

    function normalizeMerchantService(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const unlimited = source.unlimited !== false;
        const maximumStock = unlimited ? 0 : Math.max(0, Math.floor(Number(source.maximumStock) || 0));
        return {
            id: normalizeText(source.id || makeMerchantEntryId('service'), '', 180),
            name: normalizeText(source.name, 'Serviço sem nome', 120),
            description: normalizeText(source.description, '', 2000),
            price: Math.max(0, Math.round(Number(source.price) || 0)),
            unlimited,
            stock: unlimited ? 0 : Math.min(maximumStock, Math.max(0, Math.floor(Number(source.stock) || 0))),
            maximumStock,
            restockQuantity: unlimited ? 0 : Math.max(0, Math.floor(Number(source.restockQuantity) || 0)),
            enabled: source.enabled !== false,
            updatedAt: source.updatedAt || now
        };
    }

    function normalizeMerchantTransaction(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        return {
            id: normalizeText(source.id || makeMerchantTransactionId(), '', 180),
            type: ['purchase', 'sale', 'service'].includes(source.type) ? source.type : 'purchase',
            buyerId: normalizeText(source.buyerId, '', 160) || null,
            buyerName: normalizeText(source.buyerName, 'Personagem', 120),
            itemId: normalizeText(source.itemId, '', 160) || null,
            itemName: normalizeText(source.itemName, '', 160),
            quantity: Math.max(1, Math.floor(Number(source.quantity) || 1)),
            acquisitionUnits: Math.max(1, Math.floor(Number(source.acquisitionUnits) || 1)),
            unitPrice: Math.max(0, Math.round(Number(source.unitPrice) || 0)),
            total: Math.max(0, Math.round(Number(source.total) || 0)),
            discountPercent: Math.min(100, Math.max(0, Number(source.discountPercent) || 0)),
            chronology: normalizeNpcChronology(source.chronology),
            occurredAt: source.occurredAt || now
        };
    }

    function normalizeMerchant(value, options = {}) {
        if (!value || typeof value !== 'object' || Array.isArray(value) || value.enabled === false) return null;
        const now = options.now || new Date().toISOString();
        const restockMode = MERCHANT_RESTOCK_MODES.includes(value.restockMode) ? value.restockMode : 'manual';
        const customIntervalMinutes = Math.max(60, Math.floor(Number(value.customIntervalMinutes) || 1440));
        return {
            enabled: true,
            name: normalizeText(value.name, 'Loja sem nome', 120),
            category: MERCHANT_CATEGORIES.includes(value.category) ? value.category : 'general',
            description: normalizeText(value.description, '', 3000),
            privateNotes: normalizeText(value.privateNotes, '', 4000),
            negotiationDifficulty: Math.max(0, Math.floor(Number(value.negotiationDifficulty) || 0)),
            discountPercent: Math.min(100, Math.max(0, Number(value.discountPercent) || 0)),
            buybackPercent: Math.min(100, Math.max(0,
                Number.isFinite(Number(value.buybackPercent)) ? Number(value.buybackPercent) : 50
            )),
            restockMode,
            customIntervalMinutes,
            lastRestockMinute: Number.isFinite(Number(value.lastRestockMinute)) ? Number(value.lastRestockMinute) : null,
            openingSchedule: normalizeOpeningSchedule(value.openingSchedule),
            purchaseApprovalRequired: value.purchaseApprovalRequired !== false,
            catalog: (Array.isArray(value.catalog) ? value.catalog : [])
                .map(entry => normalizeMerchantCatalogEntry(entry, { now }))
                .filter(entry => entry.itemId)
                .filter((entry, index, list) => list.findIndex(item => item.itemId === entry.itemId) === index)
                .slice(0, 500),
            services: (Array.isArray(value.services) ? value.services : [])
                .map(entry => normalizeMerchantService(entry, { now }))
                .filter((entry, index, list) => list.findIndex(item => item.id === entry.id) === index)
                .slice(0, 200),
            privateTransactions: (Array.isArray(value.privateTransactions) ? value.privateTransactions : [])
                .map(entry => normalizeMerchantTransaction(entry, { now }))
                .slice(-500),
            createdAt: value.createdAt || now,
            updatedAt: value.updatedAt || now
        };
    }

    function normalizeNpc(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        return {
            id: normalizeText(source.id || makeNpcId(), '', 160),
            name: normalizeText(source.name, 'NPC sem nome', 120),
            profession: normalizeText(source.profession, '', 120),
            faction: normalizeText(source.faction, '', 160),
            relationship: NPC_RELATIONSHIPS.includes(source.relationship) ? source.relationship : 'unknown',
            publicInfo: normalizeText(source.publicInfo, '', 4000),
            privateNotes: normalizeText(source.privateNotes, '', 8000),
            visibility: source.visibility === 'private' ? 'private' : 'public',
            currentLocationId: normalizeText(source.currentLocationId, '', 160) || null,
            movements: (Array.isArray(source.movements) ? source.movements : [])
                .map(movement => normalizeNpcMovement(movement, { now }))
                .slice(-500),
            schedule: (Array.isArray(source.schedule) ? source.schedule : [])
                .map(entry => normalizeNpcScheduleEntry(entry, { now }))
                .slice(0, 100),
            merchant: normalizeMerchant(source.merchant, { now }),
            createdAt: source.createdAt || now,
            updatedAt: source.updatedAt || now
        };
    }

    function normalizeLocation(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const type = LOCATION_TYPE_VALUES.includes(source.type) ? source.type : LOCATION_TYPES.LOCATION;
        const root = type === LOCATION_TYPES.CONTINENT;
        return {
            id: root ? ROOT_CONTINENT_ID : normalizeText(source.id || makeLocationId(type), '', 160),
            type,
            parentId: root ? null : (normalizeText(source.parentId, '', 160) || null),
            name: normalizeText(source.name, root ? 'O Continente' : 'Local sem nome', 120),
            description: normalizeText(source.description, '', 4000),
            origin: source.origin === 'custom' ? 'custom' : 'official',
            visibility: source.visibility === 'private' ? 'private' : 'public',
            aliases: [...new Set((Array.isArray(source.aliases) ? source.aliases : [])
                .map(alias => normalizeText(alias, '', 120))
                .filter(Boolean))],
            politicalType: normalizeText(source.politicalType, '', 80) || null,
            politicalStatus: normalizeText(source.politicalStatus, '', 240) || null,
            politicalRegionId: normalizeText(source.politicalRegionId, '', 160) || null,
            relations: normalizeRelations(source.relations),
            sources: normalizeSources(source.sources),
            atlasVersion: Math.max(0, Math.floor(Number(source.atlasVersion) || 0)),
            canonicalType: normalizeText(source.canonicalType, '', 80) || null,
            canonicalStatus: normalizeText(source.canonicalStatus, '', 240) || null,
            isCapital: source.isCapital === true,
            importance: ['legendary', 'major', 'regional', 'local'].includes(source.importance) ? source.importance : null,
            canonicalVersion: Math.max(0, Math.floor(Number(source.canonicalVersion) || 0)),
            cartographicType: normalizeText(source.cartographicType, '', 80) || null,
            cartographicStatus: source.cartographicStatus === 'map-only' ? 'map-only' : null,
            cartographicConfidence: ['high', 'medium', 'low'].includes(source.cartographicConfidence)
                ? source.cartographicConfidence
                : null,
            coordinateConfidence: ['precise', 'approximate', 'estimated'].includes(source.coordinateConfidence)
                ? source.coordinateConfidence
                : null,
            cartographicVersion: Math.max(0, Math.floor(Number(source.cartographicVersion) || 0)),
            mapId: normalizeText(source.mapId, '', 120) || null,
            customType: normalizeText(source.customType, '', 80) || null,
            coordinates: normalizeCoordinates(source.coordinates),
            createdAt: source.createdAt || now,
            updatedAt: source.updatedAt || now
        };
    }

    function validateWorld(value) {
        const errors = [];
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return { valid: false, errors: ['Estrutura de Mundo inválida.'] };
        }
        if (!Array.isArray(value.locations)) errors.push('A lista de locais está ausente.');
        if (value.npcs !== undefined && !Array.isArray(value.npcs)) errors.push('A lista de NPCs é inválida.');
        if (value.travelHistory !== undefined && !Array.isArray(value.travelHistory)) errors.push('O histórico de viagens é inválido.');
        if (value.regionalEvents !== undefined && !Array.isArray(value.regionalEvents)) errors.push('A agenda regional é inválida.');
        if (errors.length) return { valid: false, errors };

        const ids = new Set();
        const locations = new Map();
        value.locations.forEach((location, index) => {
            const id = normalizeText(location?.id, '', 160);
            if (!id) errors.push(`O local ${index + 1} não possui ID.`);
            else if (ids.has(id)) errors.push(`O ID ${id} está duplicado.`);
            else ids.add(id);
            if (!LOCATION_TYPE_VALUES.includes(location?.type)) errors.push(`O local ${id || index + 1} possui tipo inválido.`);
            if (id) locations.set(id, location);
        });

        const root = locations.get(ROOT_CONTINENT_ID);
        if (!root || root.type !== LOCATION_TYPES.CONTINENT || root.parentId) {
            errors.push('A raiz O Continente está ausente ou inválida.');
        }

        value.locations.forEach(location => {
            if (!location?.id || location.id === ROOT_CONTINENT_ID) return;
            const parent = locations.get(String(location.parentId || ''));
            if (!parent) {
                errors.push(`${location.name || location.id} não possui um local superior válido.`);
                return;
            }
            if (!PARENT_TYPES[location.type]?.includes(parent.type)) {
                errors.push(`${location.name || location.id} não pode pertencer a ${parent.name || parent.id}.`);
            }

            const visited = new Set([location.id]);
            let cursor = parent;
            while (cursor) {
                if (visited.has(cursor.id)) {
                    errors.push(`A hierarquia de ${location.name || location.id} possui um ciclo.`);
                    break;
                }
                visited.add(cursor.id);
                cursor = cursor.parentId ? locations.get(String(cursor.parentId)) : null;
            }


            (Array.isArray(location.relations) ? location.relations : []).forEach(relation => {
                if (!locations.has(String(relation?.targetId || ''))) {
                    errors.push(`${location.name || location.id} possui uma relação com entidade inexistente.`);
                }
            });

            if (location.politicalRegionId && !locations.has(String(location.politicalRegionId))) {
                errors.push(`${location.name || location.id} possui uma região política inexistente.`);
            }
        });

        if (value.currentLocationId && !locations.has(String(value.currentLocationId))) {
            errors.push('O local atual não existe no catálogo do Mundo.');
        }
        const npcIds = new Set();
        (value.npcs || []).forEach((npc, index) => {
            const id = normalizeText(npc?.id, '', 160);
            if (!id) errors.push(`O NPC ${index + 1} não possui ID.`);
            else if (npcIds.has(id)) errors.push(`O ID de NPC ${id} está duplicado.`);
            else npcIds.add(id);
            if (npc?.currentLocationId && !locations.has(String(npc.currentLocationId))) {
                errors.push(`${npc.name || id || `NPC ${index + 1}`} está vinculado a um local inexistente.`);
            }
            (npc?.schedule || []).forEach(entry => {
                if (entry.locationId && !locations.has(String(entry.locationId))) {
                    errors.push(`${npc.name || id || `NPC ${index + 1}`} possui horário vinculado a um local inexistente.`);
                }
            });
        });
        (value.regionalEvents || []).forEach(event => {
            if (event.locationId && !locations.has(String(event.locationId))) {
                errors.push(`${event.title || event.id || 'Evento regional'} está vinculado a um local inexistente.`);
            }
        });
        return { valid: errors.length === 0, errors: [...new Set(errors)] };
    }

    function normalizeWorld(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = options.now || new Date().toISOString();
        const inputLocations = Array.isArray(source.locations) ? source.locations : [];
        const normalized = [];
        const seenIds = new Set();
        const suppliedRoot = inputLocations.find(location =>
            location?.id === ROOT_CONTINENT_ID || location?.type === LOCATION_TYPES.CONTINENT);
        const root = normalizeLocation({ ...(suppliedRoot || {}), id: ROOT_CONTINENT_ID, type: LOCATION_TYPES.CONTINENT }, { now });
        normalized.push(root);
        seenIds.add(root.id);

        inputLocations.forEach(location => {
            if (location === suppliedRoot || location?.type === LOCATION_TYPES.CONTINENT) return;
            const next = normalizeLocation(location, { now });
            if (!next.id || seenIds.has(next.id)) return;
            seenIds.add(next.id);
            normalized.push(next);
        });

        const candidate = {
            schemaVersion: WORLD_SCHEMA_VERSION,
            rootLocationId: ROOT_CONTINENT_ID,
            currentLocationId: source.currentLocationId && seenIds.has(String(source.currentLocationId))
                ? String(source.currentLocationId)
                : null,
            politicalAtlasVersion: Math.max(0, Math.floor(Number(source.politicalAtlasVersion) || 0)),
            canonicalCatalogVersion: Math.max(0, Math.floor(Number(source.canonicalCatalogVersion) || 0)),
            historicalCatalogVersion: Math.max(0, Math.floor(Number(source.historicalCatalogVersion) || 0)),
            cartographicCatalogVersion: Math.max(0, Math.floor(Number(source.cartographicCatalogVersion) || 0)),
            mapSettings: normalizeMapSettings(source.mapSettings),
            locations: normalized,
            npcs: (Array.isArray(source.npcs) ? source.npcs : [])
                .map(npc => normalizeNpc(npc, { now }))
                .filter((npc, index, list) => list.findIndex(entry => entry.id === npc.id) === index)
                .filter(npc => !npc.currentLocationId || seenIds.has(npc.currentLocationId)),
            travelHistory: (Array.isArray(source.travelHistory) ? source.travelHistory : [])
                .map(entry => normalizeWorldTravel(entry, { now }))
                .filter(entry => !entry.toLocationId || seenIds.has(entry.toLocationId))
                .slice(-500),
            regionalEvents: (Array.isArray(source.regionalEvents) ? source.regionalEvents : [])
                .map(entry => normalizeRegionalEvent(entry, { now }))
                .filter(entry => !entry.locationId || seenIds.has(entry.locationId))
                .slice(0, 1000),
            createdAt: source.createdAt || now,
            updatedAt: source.updatedAt || now
        };
        const validation = validateWorld(candidate);
        if (!validation.valid) return createEmptyWorld({ now });
        return candidate;
    }

    function getLocation(world, id) {
        return world?.locations?.find(location => String(location.id) === String(id)) || null;
    }

    function getChildren(world, parentId) {
        return (world?.locations || []).filter(location => String(location.parentId || '') === String(parentId || ''));
    }

    function getLocationPath(world, id) {
        const path = [];
        const visited = new Set();
        let current = getLocation(world, id);
        while (current && !visited.has(current.id)) {
            path.unshift(current);
            visited.add(current.id);
            current = current.parentId ? getLocation(world, current.parentId) : null;
        }
        return path;
    }

    function addLocation(world, input = {}, options = {}) {
        const current = normalizeWorld(world, options);
        const now = options.now || new Date().toISOString();
        const location = normalizeLocation({ ...input, id: input.id || makeLocationId(input.type) }, { now });
        if (location.type === LOCATION_TYPES.CONTINENT) throw new Error('O Mundo pode possuir somente um Continente raiz.');
        if (getLocation(current, location.id)) throw new Error('Já existe um local com este ID.');
        const parent = getLocation(current, location.parentId);
        if (!parent || !PARENT_TYPES[location.type]?.includes(parent.type)) {
            throw new Error('O local superior não é compatível com esta categoria.');
        }

        const next = clone(current);
        next.locations.push(location);
        next.updatedAt = now;
        return { world: next, location: clone(location) };
    }

    function updateLocation(world, id, changes = {}, options = {}) {
        const current = normalizeWorld(world, options);
        const index = current.locations.findIndex(location => String(location.id) === String(id));
        if (index < 0) throw new Error('Local não encontrado.');
        const previous = current.locations[index];
        const now = options.now || new Date().toISOString();
        const updated = normalizeLocation({ ...previous, ...changes, id: previous.id }, { now });
        if (previous.id === ROOT_CONTINENT_ID) {
            updated.type = LOCATION_TYPES.CONTINENT;
            updated.parentId = null;
        } else {
            const parent = getLocation(current, updated.parentId);
            if (!parent || !PARENT_TYPES[updated.type]?.includes(parent.type)) {
                throw new Error('O local superior não é compatível com esta categoria.');
            }
        }
        updated.updatedAt = now;
        current.locations[index] = updated;
        current.updatedAt = now;
        const validation = validateWorld(current);
        if (!validation.valid) throw new Error(validation.errors[0]);
        return { world: current, location: clone(updated) };
    }

    function removeLocation(world, id, options = {}) {
        const current = normalizeWorld(world, options);
        const targetId = String(id || '');
        if (!getLocation(current, targetId)) throw new Error('Local não encontrado.');
        if (targetId === ROOT_CONTINENT_ID) throw new Error('O Continente raiz não pode ser removido.');
        const removedIds = new Set([targetId]);
        let changed = true;
        while (changed) {
            changed = false;
            current.locations.forEach(location => {
                if (location.parentId && removedIds.has(location.parentId) && !removedIds.has(location.id)) {
                    removedIds.add(location.id);
                    changed = true;
                }
            });
        }
        const removedLocationNames = new Map(current.locations
            .filter(location => removedIds.has(location.id))
            .map(location => [location.id, location.name]));
        current.locations = current.locations.filter(location => !removedIds.has(location.id));
        current.npcs = (current.npcs || []).map(npc => {
            const schedule = (npc.schedule || []).filter(entry => !entry.locationId || !removedIds.has(entry.locationId));
            if (!npc.currentLocationId || !removedIds.has(npc.currentLocationId)) return { ...npc, schedule };
            return {
                ...npc,
                currentLocationId: null,
                schedule,
                movements: [...npc.movements, normalizeNpcMovement({
                    id: makeNpcMovementId(),
                    fromLocationId: npc.currentLocationId,
                    fromLocationName: removedLocationNames.get(npc.currentLocationId) || 'Local removido',
                    toLocationId: null,
                    toLocationName: 'Sem localização',
                    note: 'Local anterior removido da campanha.',
                    chronology: options.chronology,
                    movedAt: options.now
                }, options)],
                updatedAt: options.now || new Date().toISOString()
            };
        });
        current.regionalEvents = (current.regionalEvents || []).filter(event =>
            !event.locationId || !removedIds.has(event.locationId));
        if (current.currentLocationId && removedIds.has(current.currentLocationId)) current.currentLocationId = null;
        current.updatedAt = options.now || new Date().toISOString();
        return { world: current, removedIds: [...removedIds] };
    }

    function setCurrentLocation(world, id, options = {}) {
        const current = normalizeWorld(world, options);
        const targetId = id === null || id === undefined || id === '' ? null : String(id);
        if (targetId && !getLocation(current, targetId)) throw new Error('O local atual não existe no Mundo.');
        current.currentLocationId = targetId;
        current.updatedAt = options.now || new Date().toISOString();
        return current;
    }

    function recordTravel(world, input = {}, options = {}) {
        const current = normalizeWorld(world, options);
        const targetId = String(input.toLocationId || '');
        const destination = getLocation(current, targetId);
        if (!destination) throw new Error('Destino da viagem não encontrado.');
        const origin = getLocation(current, current.currentLocationId);
        const now = options.now || new Date().toISOString();
        const travel = normalizeWorldTravel({
            ...input,
            id: input.id || makeWorldTravelId(),
            fromLocationId: origin?.id || null,
            fromLocationName: origin?.name || 'Local não definido',
            toLocationId: destination.id,
            toLocationName: destination.name,
            createdAt: now
        }, { now });
        current.currentLocationId = destination.id;
        current.travelHistory.push(travel);
        current.travelHistory = current.travelHistory.slice(-500);
        current.updatedAt = now;
        return { world: current, travel: clone(travel) };
    }

    function upsertRegionalEvent(world, input = {}, options = {}) {
        const current = normalizeWorld(world, options);
        const now = options.now || new Date().toISOString();
        const event = normalizeRegionalEvent({ ...input, id: input.id || makeWorldEventId(), updatedAt: now }, { now });
        if (event.locationId && !getLocation(current, event.locationId)) throw new Error('Local do evento não encontrado.');
        const index = current.regionalEvents.findIndex(entry => entry.id === event.id);
        if (index >= 0) {
            event.createdAt = current.regionalEvents[index].createdAt;
            current.regionalEvents[index] = event;
        } else current.regionalEvents.push(event);
        current.updatedAt = now;
        return { world: current, event: clone(event) };
    }

    function removeRegionalEvent(world, id, options = {}) {
        const current = normalizeWorld(world, options);
        const index = current.regionalEvents.findIndex(entry => String(entry.id) === String(id));
        if (index < 0) throw new Error('Evento regional não encontrado.');
        const [event] = current.regionalEvents.splice(index, 1);
        current.updatedAt = options.now || new Date().toISOString();
        return { world: current, event: clone(event) };
    }

    function getNpc(world, id) {
        return world?.npcs?.find(npc => String(npc.id) === String(id)) || null;
    }

    function addNpc(world, input = {}, options = {}) {
        const current = normalizeWorld(world, options);
        const now = options.now || new Date().toISOString();
        const npc = normalizeNpc({ ...input, id: input.id || makeNpcId(), createdAt: now, updatedAt: now }, { now });
        if (getNpc(current, npc.id)) throw new Error('Já existe um NPC com este ID.');
        const destination = npc.currentLocationId ? getLocation(current, npc.currentLocationId) : null;
        if (npc.currentLocationId && !destination) throw new Error('A localização atual do NPC não existe.');
        if (destination) {
            npc.movements.push(normalizeNpcMovement({
                id: makeNpcMovementId(),
                fromLocationId: null,
                fromLocationName: 'Sem localização',
                toLocationId: destination.id,
                toLocationName: destination.name,
                note: options.movementNote || 'Localização inicial registrada.',
                chronology: options.chronology,
                movedAt: now
            }, { now }));
        }
        current.npcs.push(npc);
        current.updatedAt = now;
        return { world: current, npc: clone(npc) };
    }

    function updateNpc(world, id, changes = {}, options = {}) {
        const current = normalizeWorld(world, options);
        const index = current.npcs.findIndex(npc => String(npc.id) === String(id));
        if (index < 0) throw new Error('NPC não encontrado.');
        const previous = current.npcs[index];
        const now = options.now || new Date().toISOString();
        const updated = normalizeNpc({
            ...previous,
            ...changes,
            id: previous.id,
            currentLocationId: previous.currentLocationId,
            movements: previous.movements,
            updatedAt: now
        }, { now });
        current.npcs[index] = updated;
        current.updatedAt = now;
        return { world: current, npc: clone(updated) };
    }

    function moveNpc(world, id, destinationId, options = {}) {
        const current = normalizeWorld(world, options);
        const index = current.npcs.findIndex(npc => String(npc.id) === String(id));
        if (index < 0) throw new Error('NPC não encontrado.');
        const npc = current.npcs[index];
        const targetId = normalizeText(destinationId, '', 160) || null;
        if (targetId === npc.currentLocationId) return { world: current, npc: clone(npc), movement: null };
        const from = npc.currentLocationId ? getLocation(current, npc.currentLocationId) : null;
        const to = targetId ? getLocation(current, targetId) : null;
        if (targetId && !to) throw new Error('A nova localização do NPC não existe.');
        const now = options.now || new Date().toISOString();
        const movement = normalizeNpcMovement({
            id: makeNpcMovementId(),
            fromLocationId: npc.currentLocationId,
            fromLocationName: from?.name || 'Sem localização',
            toLocationId: targetId,
            toLocationName: to?.name || 'Sem localização',
            note: options.note,
            chronology: options.chronology,
            movedAt: now
        }, { now });
        const updated = normalizeNpc({
            ...npc,
            currentLocationId: targetId,
            movements: [...npc.movements, movement],
            updatedAt: now
        }, { now });
        current.npcs[index] = updated;
        current.updatedAt = now;
        return { world: current, npc: clone(updated), movement: clone(movement) };
    }

    function removeNpc(world, id, options = {}) {
        const current = normalizeWorld(world, options);
        const index = current.npcs.findIndex(npc => String(npc.id) === String(id));
        if (index < 0) throw new Error('NPC não encontrado.');
        const [removed] = current.npcs.splice(index, 1);
        current.updatedAt = options.now || new Date().toISOString();
        return { world: current, npc: clone(removed) };
    }

    function buildExportPackage(world, options = {}) {
        const normalized = normalizeWorld(world, options);
        return {
            format: WORLD_EXPORT_FORMAT,
            version: WORLD_EXPORT_VERSION,
            exportedAt: options.now || new Date().toISOString(),
            campaign: options.campaign ? {
                id: String(options.campaign.id || ''),
                name: String(options.campaign.metadata?.name || '')
            } : null,
            world: clone(normalized)
        };
    }

    function parseImportPackage(value, options = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
        if (!source || source.format !== WORLD_EXPORT_FORMAT || Number(source.version) !== WORLD_EXPORT_VERSION) {
            throw new Error('Arquivo de Mundo incompatível.');
        }
        const validation = validateWorld(source.world);
        if (!validation.valid) throw new Error(validation.errors[0] || 'Estrutura de Mundo inválida.');
        return normalizeWorld(source.world, options);
    }

    return Object.freeze({
        WORLD_SCHEMA_VERSION,
        WORLD_EXPORT_FORMAT,
        WORLD_EXPORT_VERSION,
        ROOT_CONTINENT_ID,
        LOCATION_TYPES,
        PARENT_TYPES,
        NPC_RELATIONSHIPS,
        MERCHANT_CATEGORIES,
        MERCHANT_RESTOCK_MODES,
        WORLD_EVENT_RECURRENCES,
        DEFAULT_MAP_SETTINGS,
        clone,
        makeLocationId,
        makeNpcId,
        makeNpcScheduleId,
        makeMerchantEntryId,
        makeMerchantTransactionId,
        makeWorldTravelId,
        makeWorldEventId,
        createEmptyWorld,
        normalizeMapSettings,
        normalizeLocation,
        normalizeNpc,
        normalizeNpcMovement,
        normalizeNpcScheduleEntry,
        normalizeOpeningSchedule,
        normalizeWorldTravel,
        normalizeRegionalEvent,
        normalizeMerchant,
        normalizeMerchantCatalogEntry,
        normalizeMerchantService,
        normalizeMerchantTransaction,
        normalizeWorld,
        validateWorld,
        getLocation,
        getChildren,
        getLocationPath,
        addLocation,
        updateLocation,
        removeLocation,
        setCurrentLocation,
        recordTravel,
        upsertRegionalEvent,
        removeRegionalEvent,
        getNpc,
        addNpc,
        updateNpc,
        moveNpc,
        removeNpc,
        buildExportPackage,
        parseImportPackage
    });
});
