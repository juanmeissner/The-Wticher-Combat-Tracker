(function (root, factory) {
    const model = root?.worldModel
        || (typeof require === 'function' ? require('./world-model.js') : null);
    const campaignStore = root?.campaignStore
        || (typeof require === 'function' ? require('../campaign/campaign-store.js') : null);
    const atlas = root?.worldAtlasData
        || (typeof require === 'function' ? require('./world-atlas-data.js') : null);
    const locations = root?.worldLocationData
        || (typeof require === 'function' ? require('./world-location-data.js') : null);
    const cartography = root?.worldCartographicData
        || (typeof require === 'function' ? require('./world-cartographic-data.js') : null);
    const history = root?.worldHistoryData
        || (typeof require === 'function' ? require('./world-history-data.js') : null);
    const api = factory(root, model, campaignStore, atlas, locations, cartography, history);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, model, campaignStore, atlas, locations, cartography, history) {
    'use strict';

    function getCampaign() {
        return campaignStore?.getActiveCampaign?.() || null;
    }

    function getWorld() {
        const campaign = getCampaign();
        return history.seedHistoricalLayer(cartography.seedCartographicLocations(model.normalizeWorld(campaign?.state?.world)));
    }

    function ensureCanManageWorld() {
        if (root?.collaborationSession?.isPlayer?.()) {
            throw new Error('Somente o mestre pode alterar o Mundo da campanha.');
        }
    }

    function saveWorld(world, reason = 'world-updated') {
        ensureCanManageWorld();
        const normalized = history.seedHistoricalLayer(cartography.seedCartographicLocations(model.normalizeWorld(world)));
        return campaignStore?.updateStateSlice?.('world', normalized, {
            reason,
            entityKey: 'world'
        })?.state?.world || normalized;
    }

    function createLocation(input, options = {}) {
        const result = model.addLocation(getWorld(), { ...input, origin: 'custom' }, options);
        saveWorld(result.world, 'world-location-created');
        return result.location;
    }

    function updateLocation(id, changes, options = {}) {
        const existing = model.getLocation(getWorld(), id);
        if (!existing || existing.origin !== 'custom') {
            throw new Error('O catálogo oficial do Mundo é somente leitura.');
        }
        const result = model.updateLocation(getWorld(), id, changes, options);
        saveWorld(result.world, 'world-location-updated');
        return result.location;
    }

    function removeLocation(id, options = {}) {
        const existing = model.getLocation(getWorld(), id);
        if (!existing || existing.origin !== 'custom') {
            throw new Error('O catálogo oficial do Mundo é somente leitura.');
        }
        if (atlas.POLITICAL_ENTITIES.some(location => location.id === id)
            || locations.CANONICAL_LOCATIONS.some(location => location.id === id)
            || cartography.CARTOGRAPHIC_LOCATIONS.some(location => location.id === id)) {
            throw new Error('Os registros oficiais do Mundo não podem ser removidos.');
        }
        const result = model.removeLocation(getWorld(), id, options);
        saveWorld(result.world, 'world-location-removed');
        return result.removedIds;
    }

    function setCurrentLocation(id, options = {}) {
        const world = model.setCurrentLocation(getWorld(), id, options);
        saveWorld(world, 'world-current-location-changed');
        return model.getLocation(world, world.currentLocationId);
    }

    function updateMapSettings(changes = {}) {
        const world = getWorld();
        world.mapSettings = model.normalizeMapSettings({ ...world.mapSettings, ...changes });
        saveWorld(world, 'world-map-settings-updated');
        return { ...world.mapSettings };
    }

    function travelToLocation(destinationId, options = {}) {
        const operationOptions = { ...options, chronology: getCampaignChronology(options) };
        let world = getWorld();
        const movedNpcIds = [...new Set((Array.isArray(options.movedNpcIds) ? options.movedNpcIds : []).map(String))];
        movedNpcIds.forEach(npcId => {
            const moved = model.moveNpc(world, npcId, destinationId, {
                ...operationOptions,
                note: options.npcMovementNote || `Viajou com o grupo${options.note ? `: ${options.note}` : '.'}`
            });
            world = moved.world;
        });
        const result = model.recordTravel(world, {
            toLocationId: destinationId,
            departureMinute: options.departureMinute,
            arrivalMinute: options.arrivalMinute,
            durationMinutes: options.durationMinutes,
            transportMode: options.transportMode,
            transportLabel: options.transportLabel,
            transportAssetId: options.transportAssetId,
            travelerId: options.travelerId,
            travelerName: options.travelerName,
            travelers: options.travelers,
            distanceKm: options.distanceKm,
            roadDistanceKm: options.roadDistanceKm,
            offRoadDistanceKm: options.offRoadDistanceKm,
            routeNodeIds: options.routeNodeIds,
            routeSegmentIds: options.routeSegmentIds,
            routeAlgorithm: options.routeAlgorithm,
            scaleKilometersPerGrid: options.scaleKilometersPerGrid,
            movedNpcIds,
            note: options.note,
            visibility: options.visibility,
            chronology: operationOptions.chronology
        }, operationOptions);
        saveWorld(result.world, 'world-travel-completed');
        return result.travel;
    }

    function upsertRegionalEvent(input, options = {}) {
        const result = model.upsertRegionalEvent(getWorld(), input, options);
        saveWorld(result.world, 'world-regional-event-updated');
        return result.event;
    }

    function removeRegionalEvent(id, options = {}) {
        const result = model.removeRegionalEvent(getWorld(), id, options);
        saveWorld(result.world, 'world-regional-event-removed');
        return result.event;
    }

    function getCampaignChronology(options = {}) {
        if (options.chronology) return options.chronology;
        const snapshot = root?.campaignClock?.getSnapshot?.();
        if (!snapshot || !Number.isFinite(Number(snapshot.currentMinute))) return null;
        const parts = root?.campaignClock?.getDateParts?.(snapshot.currentMinute);
        return parts ? { ...parts, campaignMinute: Number(snapshot.currentMinute) } : null;
    }

    function createNpc(input, options = {}) {
        const operationOptions = { ...options, chronology: getCampaignChronology(options) };
        const result = model.addNpc(getWorld(), input, operationOptions);
        saveWorld(result.world, 'world-npc-created');
        return result.npc;
    }

    function updateNpc(id, changes, options = {}) {
        const result = model.updateNpc(getWorld(), id, changes, options);
        saveWorld(result.world, 'world-npc-updated');
        return result.npc;
    }

    function moveNpc(id, destinationId, options = {}) {
        const operationOptions = { ...options, chronology: getCampaignChronology(options) };
        const result = model.moveNpc(getWorld(), id, destinationId, operationOptions);
        if (result.movement) saveWorld(result.world, 'world-npc-moved');
        return result;
    }

    function removeNpc(id, options = {}) {
        const result = model.removeNpc(getWorld(), id, options);
        saveWorld(result.world, 'world-npc-removed');
        return result.npc;
    }

    function getCurrentLocation() {
        const world = getWorld();
        return model.getLocation(world, world.currentLocationId);
    }

    function getCurrentLocationPath() {
        const world = getWorld();
        return model.getLocationPath(world, world.currentLocationId);
    }

    function exportWorld(options = {}) {
        return model.buildExportPackage(getWorld(), {
            ...options,
            campaign: getCampaign()
        });
    }

    function importWorld(value, options = {}) {
        const world = model.parseImportPackage(value, options);
        saveWorld(world, 'world-imported');
        return getWorld();
    }

    return Object.freeze({
        getWorld,
        saveWorld,
        createLocation,
        updateLocation,
        removeLocation,
        setCurrentLocation,
        updateMapSettings,
        travelToLocation,
        upsertRegionalEvent,
        removeRegionalEvent,
        createNpc,
        updateNpc,
        moveNpc,
        removeNpc,
        getNpcs: () => getWorld().npcs,
        getCurrentLocation,
        getCurrentLocationPath,
        getPoliticalEntities: () => atlas.getPoliticalEntities(getWorld()),
        getCanonicalLocations: () => locations.getCanonicalLocations(getWorld()),
        getCartographicLocations: () => cartography.getCartographicLocations(getWorld()),
        getHistoricalSnapshot: (chronology, options = {}) => history.getHistoricalSnapshot(getWorld(), chronology, options),
        getActiveHistoricalSituation: (targetId, chronology, options = {}) => history.getActiveSituation(targetId, chronology, options),
        exportWorld,
        importWorld
    });
});
