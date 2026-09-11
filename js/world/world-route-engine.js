(function (root, factory) {
    const roads = root?.worldRoadData
        || (typeof require === 'function' ? require('./world-road-data.js') : null);
    const api = factory(roads);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldRouteEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (roads) {
    'use strict';

    const ROUTE_ENGINE_VERSION = 1;
    const DEFAULT_MAP_SETTINGS = Object.freeze({ pixelsPerGrid: 576, kilometersPerGrid: 100 });
    const TRAVEL_MODES = Object.freeze({
        foot: Object.freeze({ id: 'foot', label: 'A pé', icon: '🥾', baseSpeedKmh: 5, offRoadMultiplier: 0.65 }),
        horse: Object.freeze({ id: 'horse', label: 'A cavalo', icon: '🐎', baseSpeedKmh: 10, offRoadMultiplier: 0.68 }),
        carriage: Object.freeze({ id: 'carriage', label: 'Carruagem', icon: '🛒', baseSpeedKmh: 8, offRoadMultiplier: 0 }),
        portal: Object.freeze({ id: 'portal', label: 'Portal Vertical', icon: '🌀', baseSpeedKmh: 0, offRoadMultiplier: 0 })
    });
    const ROAD_SPEED_MULTIPLIERS = Object.freeze({ main: 1.15, regional: 1, mountain: 0.62 });

    function round(value, precision = 1) {
        const multiplier = 10 ** precision;
        return Math.round((Number(value) || 0) * multiplier) / multiplier;
    }

    function normalizeMapSettings(value) {
        const source = value && typeof value === 'object' ? value : {};
        const pixels = Number(source.pixelsPerGrid);
        const kilometers = Number(source.kilometersPerGrid);
        return {
            pixelsPerGrid: Number.isFinite(pixels) && pixels > 0 ? Math.min(10000, Math.max(1, pixels)) : DEFAULT_MAP_SETTINGS.pixelsPerGrid,
            kilometersPerGrid: Number.isFinite(kilometers) && kilometers > 0 ? Math.min(5000, Math.max(1, round(kilometers, 1))) : DEFAULT_MAP_SETTINGS.kilometersPerGrid
        };
    }

    function locationToPixel(location, reference = roads?.MAP_REFERENCE || {}) {
        if (!location?.coordinates) return null;
        const x = Number(location.coordinates.x);
        const y = Number(location.coordinates.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return {
            x: Math.max(0, Math.min(100, x)) / 100 * (Number(reference.originalWidth) || 2880),
            y: Math.max(0, Math.min(100, y)) / 100 * (Number(reference.originalHeight) || 4096)
        };
    }

    function pointDistancePixels(left, right) {
        return Math.hypot(Number(left?.x) - Number(right?.x), Number(left?.y) - Number(right?.y));
    }

    function buildReference(mapSettings) {
        return { ...(roads?.MAP_REFERENCE || {}), ...normalizeMapSettings(mapSettings) };
    }

    function movementFactor(value) {
        const movement = Number(value);
        if (!Number.isFinite(movement) || movement <= 0) return 1;
        return Math.min(1.6, Math.max(0.5, movement / 10));
    }

    function getTravelSpeedKmh(modeId, movement, roadType = null) {
        const mode = TRAVEL_MODES[modeId] || TRAVEL_MODES.foot;
        const terrainMultiplier = roadType
            ? (ROAD_SPEED_MULTIPLIERS[roadType] || 1)
            : mode.offRoadMultiplier;
        return Math.max(0.1, mode.baseSpeedKmh * movementFactor(movement) * terrainMultiplier);
    }

    function getNearestNodes(point, nodes, limit = 4) {
        return (Array.isArray(nodes) ? nodes : [])
            .filter(node => node?.point)
            .map(node => ({ node, distancePixels: pointDistancePixels(point, node.point) }))
            .sort((left, right) => left.distancePixels - right.distancePixels)
            .slice(0, Math.max(1, limit));
    }

    function findAccessNodes(location, point, nodes, modeId) {
        const exact = (Array.isArray(nodes) ? nodes : []).filter(node => String(node.locationId || '') === String(location?.id || ''));
        if (exact.length) return exact.map(node => ({ node, distancePixels: pointDistancePixels(point, node.point) }));
        const nearest = getNearestNodes(point, nodes, modeId === 'carriage' ? 1 : 4);
        if (modeId !== 'carriage') return nearest;
        return nearest.filter(entry => entry.distancePixels <= 24);
    }

    function orientSegmentPoints(segment, fromNodeId) {
        const points = (Array.isArray(segment?.points) ? segment.points : []).map(point => ({ x: Number(point.x), y: Number(point.y) }));
        return segment?.fromNodeId === fromNodeId ? points : points.reverse();
    }

    function appendPoints(target, points) {
        points.forEach(point => {
            const previous = target[target.length - 1];
            if (!previous || pointDistancePixels(previous, point) > 0.01) target.push({ x: Number(point.x), y: Number(point.y) });
        });
    }

    function buildRoadCandidate(originPoint, destinationPoint, originAccess, destinationAccess, options) {
        const { modeId, movement, nodes, segments, reference } = options;
        const maximumRoadSpeed = getTravelSpeedKmh(modeId, movement, 'main');
        const roadRoute = roads?.findShortestRoute?.(originAccess.node.id, destinationAccess.node.id, {
            nodes,
            segments,
            reference,
            carriageOnly: modeId === 'carriage',
            getCost: segment => roads.getSegmentDistanceKm(segment, reference) / getTravelSpeedKmh(modeId, movement, segment.type) * 60,
            heuristic: nodeId => {
                const node = nodes.find(entry => entry.id === nodeId);
                return roads.pixelsToKilometers(pointDistancePixels(node?.point, destinationAccess.node.point), reference) / maximumRoadSpeed * 60;
            }
        });
        if (!roadRoute) return null;

        const routeSegments = roadRoute.segmentIds.map(id => segments.find(segment => segment.id === id)).filter(Boolean);
        const roadDistanceKm = routeSegments.reduce((total, segment) => total + roads.getSegmentDistanceKm(segment, reference), 0);
        const originAccessKm = roads.pixelsToKilometers(originAccess.distancePixels, reference);
        const destinationAccessKm = roads.pixelsToKilometers(destinationAccess.distancePixels, reference);
        const accessDistanceKm = originAccessKm + destinationAccessKm;
        if (modeId === 'carriage' && accessDistanceKm > 0.01 && (originAccess.distancePixels > 24 || destinationAccess.distancePixels > 24)) return null;
        const accessSpeed = modeId === 'carriage'
            ? getTravelSpeedKmh(modeId, movement, 'regional')
            : getTravelSpeedKmh(modeId, movement, null);
        const roadMinutes = routeSegments.reduce((total, segment) => total
            + roads.getSegmentDistanceKm(segment, reference) / getTravelSpeedKmh(modeId, movement, segment.type) * 60, 0);
        const accessMinutes = accessDistanceKm / accessSpeed * 60;
        const points = [];
        appendPoints(points, [originPoint]);
        appendPoints(points, [originAccess.node.point]);
        routeSegments.forEach((segment, index) => appendPoints(points, orientSegmentPoints(segment, roadRoute.nodeIds[index])));
        appendPoints(points, [destinationAccess.node.point, destinationPoint]);
        return {
            minutes: roadMinutes + accessMinutes,
            distanceKm: roadDistanceKm + accessDistanceKm,
            roadDistanceKm,
            offRoadDistanceKm: modeId === 'carriage' ? 0 : accessDistanceKm,
            nodeIds: [...roadRoute.nodeIds],
            segmentIds: [...roadRoute.segmentIds],
            points,
            usesRoads: roadDistanceKm > 0,
            usesOffRoad: modeId !== 'carriage' && accessDistanceKm > 0.01
        };
    }

    function planRoute(input = {}) {
        if (!roads) return { ok: false, error: 'A rede de estradas não está disponível.' };
        const origin = input.origin;
        const destination = input.destination;
        const modeId = TRAVEL_MODES[input.mode]?.id || 'foot';
        const mode = TRAVEL_MODES[modeId];
        const movement = Number(input.movement) || 10;
        const nodes = Array.isArray(input.nodes) ? input.nodes : roads.ROAD_NODES;
        const segments = Array.isArray(input.segments) ? input.segments : roads.ROAD_SEGMENTS;
        const reference = buildReference(input.mapSettings);
        const originPoint = locationToPixel(origin, reference);
        const destinationPoint = locationToPixel(destination, reference);
        if (!originPoint || !destinationPoint) return { ok: false, error: 'Origem e destino precisam possuir coordenadas no mapa.' };
        if (String(origin?.id || '') === String(destination?.id || '')) return { ok: false, error: 'Escolha um destino diferente do local atual.' };

        if (modeId === 'portal') {
            const distanceKm = roads.pixelsToKilometers(pointDistancePixels(originPoint, destinationPoint), reference);
            return Object.freeze({
                ok: true,
                algorithm: 'portal',
                mode: modeId,
                modeLabel: mode.label,
                modeIcon: mode.icon,
                movement: 0,
                speedKmh: 0,
                distanceKm: round(distanceKm, 1),
                roadDistanceKm: 0,
                offRoadDistanceKm: 0,
                durationMinutes: 1,
                nodeIds: Object.freeze([]),
                segmentIds: Object.freeze([]),
                points: Object.freeze([originPoint, destinationPoint].map(point => Object.freeze({ ...point }))),
                usesRoads: false,
                usesOffRoad: false,
                scale: Object.freeze({ ...normalizeMapSettings(input.mapSettings) })
            });
        }

        const originNodes = findAccessNodes(origin, originPoint, nodes, modeId);
        const destinationNodes = findAccessNodes(destination, destinationPoint, nodes, modeId);
        const candidates = [];
        originNodes.forEach(originAccess => destinationNodes.forEach(destinationAccess => {
            const candidate = buildRoadCandidate(originPoint, destinationPoint, originAccess, destinationAccess, {
                modeId, movement, nodes, segments, reference
            });
            if (candidate) candidates.push(candidate);
        }));

        if (modeId !== 'carriage') {
            const directDistanceKm = roads.pixelsToKilometers(pointDistancePixels(originPoint, destinationPoint), reference);
            candidates.push({
                minutes: directDistanceKm / getTravelSpeedKmh(modeId, movement, null) * 60,
                distanceKm: directDistanceKm,
                roadDistanceKm: 0,
                offRoadDistanceKm: directDistanceKm,
                nodeIds: [],
                segmentIds: [],
                points: [originPoint, destinationPoint],
                usesRoads: false,
                usesOffRoad: true
            });
        }
        if (!candidates.length) {
            return { ok: false, error: modeId === 'carriage'
                ? 'Não há uma rota contínua para carruagem entre estes locais. Ambos precisam estar ligados por estradas compatíveis.'
                : 'Não foi possível calcular a rota entre estes locais.' };
        }
        const best = candidates.sort((left, right) => left.minutes - right.minutes)[0];
        return Object.freeze({
            ok: true,
            algorithm: 'astar',
            mode: modeId,
            modeLabel: mode.label,
            modeIcon: mode.icon,
            movement,
            speedKmh: round(best.distanceKm / Math.max(1 / 60, best.minutes / 60), 1),
            distanceKm: round(best.distanceKm, 1),
            roadDistanceKm: round(best.roadDistanceKm, 1),
            offRoadDistanceKm: round(best.offRoadDistanceKm, 1),
            durationMinutes: Math.max(1, Math.ceil(best.minutes)),
            nodeIds: Object.freeze(best.nodeIds),
            segmentIds: Object.freeze(best.segmentIds),
            points: Object.freeze(best.points.map(point => Object.freeze({ ...point }))),
            usesRoads: best.usesRoads,
            usesOffRoad: best.usesOffRoad,
            scale: Object.freeze({ ...normalizeMapSettings(input.mapSettings) })
        });
    }

    return Object.freeze({
        ROUTE_ENGINE_VERSION,
        DEFAULT_MAP_SETTINGS,
        TRAVEL_MODES,
        ROAD_SPEED_MULTIPLIERS,
        normalizeMapSettings,
        locationToPixel,
        pointDistancePixels,
        movementFactor,
        getTravelSpeedKmh,
        getNearestNodes,
        planRoute
    });
});
