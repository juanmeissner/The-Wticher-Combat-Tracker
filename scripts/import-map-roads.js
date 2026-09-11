#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.join(PROJECT_ROOT, 'img', 'maps', 'continent', 'continent-roads.svg');
const DEFAULT_OUTPUT = path.join(PROJECT_ROOT, 'js', 'world', 'world-road-imported-data.js');
const DEFAULT_MARKER_OUTPUT = path.join(PROJECT_ROOT, 'js', 'world', 'world-location-imported-data.js');
const MAP_WIDTH = 2880;
const MAP_HEIGHT = 4096;
const SNAP_TOLERANCE_PX = 5;
const LOCATION_TOLERANCE_PX = 24;
const VALID_TYPES = new Set(['main', 'regional', 'mountain']);
const LOCATION_ALIASES = Object.freeze({
    'baldhorn': 'world-cartographic-baldfhorn',
    'denesle': 'world-cartographic-demelse',
    'dilingen': 'world-cartographic-dillingen',
    'egremont': 'world-cartographic-eregmont',
    'esteken manor': 'world-cartographic-esteken',
    'guamez': 'world-cartographic-guamet',
    'mt carbon': 'world-canonical-mount-carbon',
    'pindal': 'world-cartographic-findal',
    'roggeven': 'world-cartographic-roggeveen',
    'temple of melitele': 'world-canonical-temple-melitele',
    'thanedd island': 'world-canonical-thanedd',
    'zgraggen': 'world-cartographic-laraggen'
});

function decodeCorelId(value) {
    return String(value || '')
        .replace(/_x([0-9a-f]{4})_/gi, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)))
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'trecho';
}

function normalizeLocationLabel(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’`]/g, "'")
        .toLowerCase()
        .replace(/\b(island|ilha de|ilha)\b/g, ' island ')
        .replace(/[^a-z0-9']+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseAttributes(source) {
    const result = {};
    String(source || '').replace(/([:\w-]+)\s*=\s*"([^"]*)"/g, (_match, key, value) => {
        result[key] = value;
        return _match;
    });
    return result;
}

function parsePointList(value) {
    const values = String(value || '').trim().split(/[\s,]+/).map(Number);
    const result = [];
    for (let index = 0; index + 1 < values.length; index += 2) {
        if (Number.isFinite(values[index]) && Number.isFinite(values[index + 1])) {
            result.push({ x: values[index], y: values[index + 1] });
        }
    }
    return result;
}

function parseRoadIdentity(encodedId, fallbackIndex) {
    const decoded = decodeCorelId(encodedId).replace(/_\d+$/, '');
    const parts = decoded.split('|');
    if (parts[0] !== 'road' || parts.length < 4) {
        return {
            type: 'regional',
            carriageAllowed: true,
            name: `Estrada importada ${fallbackIndex + 1}`,
            warning: `Identificador fora do padrão: ${decoded || '(vazio)'}`
        };
    }
    const type = VALID_TYPES.has(parts[1]) ? parts[1] : 'regional';
    const carriageAllowed = parts[2] !== 'no-carriage';
    return {
        type,
        carriageAllowed,
        name: parts.slice(3).join('|').trim() || `Estrada importada ${fallbackIndex + 1}`,
        warning: VALID_TYPES.has(parts[1]) ? null : `Tipo desconhecido em ${decoded}: ${parts[1]}`
    };
}

function parseLocationIdentity(encodedId, fallbackIndex) {
    const decoded = decodeCorelId(encodedId).replace(/_\d+$/, '');
    const parts = decoded.split('|');
    if (parts[0] !== 'location' || parts.length < 2) {
        return {
            label: `Marcador importado ${fallbackIndex + 1}`,
            warning: `Identificador de marcador fora do padrão: ${decoded || '(vazio)'}`
        };
    }
    return {
        label: parts.slice(1).join('|').trim() || `Marcador importado ${fallbackIndex + 1}`,
        warning: null
    };
}

function parseSvg(svgSource) {
    const rootMatch = String(svgSource).match(/<svg\b([^>]*)>/i);
    if (!rootMatch) throw new Error('O arquivo não contém uma raiz SVG válida.');
    const rootAttributes = parseAttributes(rootMatch[1]);
    const viewBox = String(rootAttributes.viewBox || '').trim().split(/[\s,]+/).map(Number);
    if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) {
        throw new Error('O SVG precisa preservar um viewBox válido.');
    }
    const [, , sourceWidth, sourceHeight] = viewBox;
    const scaleX = MAP_WIDTH / sourceWidth;
    const scaleY = MAP_HEIGHT / sourceHeight;
    const elements = [];
    const elementPattern = /<(polyline|line)\b([^>]*)\/?\s*>/gi;
    let match;
    while ((match = elementPattern.exec(svgSource))) {
        const attributes = parseAttributes(match[2]);
        let points = match[1].toLowerCase() === 'polyline'
            ? parsePointList(attributes.points)
            : parsePointList(`${attributes.x1},${attributes.y1} ${attributes.x2},${attributes.y2}`);
        if (points.length < 2) continue;
        points = points.map(point => ({
            x: Math.round(point.x * scaleX * 10) / 10,
            y: Math.round(point.y * scaleY * 10) / 10
        }));
        elements.push({
            ...parseRoadIdentity(attributes.id, elements.length),
            sourceId: decodeCorelId(attributes.id),
            points
        });
    }
    if (!elements.length) throw new Error('Nenhuma linha ou polilinha de estrada foi encontrada no SVG.');
    const markers = [];
    const markerPattern = /<(circle|ellipse)\b([^>]*)\/?\s*>/gi;
    while ((match = markerPattern.exec(svgSource))) {
        const attributes = parseAttributes(match[2]);
        const cx = Number(attributes.cx);
        const cy = Number(attributes.cy);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
        markers.push({
            ...parseLocationIdentity(attributes.id, markers.length),
            sourceId: decodeCorelId(attributes.id),
            point: {
                x: Math.round(cx * scaleX * 10) / 10,
                y: Math.round(cy * scaleY * 10) / 10
            }
        });
    }
    return { elements, markers, sourceWidth, sourceHeight };
}

function getOfficialLocations(markerOverrides = []) {
    const model = require(path.join(PROJECT_ROOT, 'js', 'world', 'world-model.js'));
    const cartography = require(path.join(PROJECT_ROOT, 'js', 'world', 'world-cartographic-data.js'));
    const overrideByLocationId = new Map(markerOverrides.map(marker => [marker.locationId, marker.point]));
    return cartography.seedCartographicLocations(model.createEmptyWorld()).locations
        .filter(location => location.type === model.LOCATION_TYPES.LOCATION)
        .map(location => ({
            id: location.id,
            name: location.name,
            aliases: [...new Set([
                ...(Array.isArray(location.aliases) ? location.aliases : []),
                ...(Array.isArray(location.alternativeNames) ? location.alternativeNames : [])
            ])],
            point: overrideByLocationId.get(location.id) || (location.coordinates ? {
                x: Number(location.coordinates.x) / 100 * MAP_WIDTH,
                y: Number(location.coordinates.y) / 100 * MAP_HEIGHT
            } : null)
        }));
}

function buildMarkerImport(parsed) {
    const locations = getOfficialLocations();
    const locationsById = new Map(locations.map(location => [location.id, location]));
    const locationsByLabel = new Map();
    locations.forEach(location => {
        [location.name, ...location.aliases].forEach(label => {
            const normalized = normalizeLocationLabel(label);
            if (!normalized) return;
            if (!locationsByLabel.has(normalized)) locationsByLabel.set(normalized, []);
            locationsByLabel.get(normalized).push(location);
        });
    });
    const usedLocationIds = new Set();
    const markers = [];
    const unmatchedMarkers = [];
    const ambiguousMarkers = [];
    const warnings = [];
    (parsed.markers || []).forEach(marker => {
        if (marker.warning) warnings.push(marker.warning);
        const normalizedLabel = normalizeLocationLabel(marker.label);
        const explicitId = marker.label.startsWith('world-') ? marker.label : LOCATION_ALIASES[normalizedLabel];
        const exactMatches = explicitId
            ? [locationsById.get(explicitId)].filter(Boolean)
            : (locationsByLabel.get(normalizedLabel) || []);
        if (exactMatches.length > 1) {
            ambiguousMarkers.push({ ...marker, candidates: exactMatches.map(location => location.id) });
            return;
        }
        const location = exactMatches[0];
        if (!location) {
            unmatchedMarkers.push(marker);
            return;
        }
        if (usedLocationIds.has(location.id)) {
            ambiguousMarkers.push({ ...marker, candidates: [location.id], reason: 'duplicate-target' });
            return;
        }
        usedLocationIds.add(location.id);
        markers.push({
            sourceId: marker.sourceId,
            label: marker.label,
            locationId: location.id,
            locationName: location.name,
            matchType: explicitId ? 'alias' : 'exact',
            point: marker.point
        });
    });
    return { markers, unmatchedMarkers, ambiguousMarkers, warnings };
}

function buildNetwork(parsed, markerImport = null) {
    const endpoints = [];
    parsed.elements.forEach((segment, segmentIndex) => {
        endpoints.push({ segmentIndex, side: 'from', point: segment.points[0] });
        endpoints.push({ segmentIndex, side: 'to', point: segment.points.at(-1) });
    });
    const parent = endpoints.map((_entry, index) => index);
    const find = index => parent[index] === index ? index : (parent[index] = find(parent[index]));
    const unite = (left, right) => {
        const leftRoot = find(left);
        const rightRoot = find(right);
        if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
    };
    for (let left = 0; left < endpoints.length; left += 1) {
        for (let right = left + 1; right < endpoints.length; right += 1) {
            if (Math.hypot(
                endpoints[left].point.x - endpoints[right].point.x,
                endpoints[left].point.y - endpoints[right].point.y
            ) <= SNAP_TOLERANCE_PX) unite(left, right);
        }
    }
    const groups = new Map();
    endpoints.forEach((endpoint, index) => {
        const root = find(index);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push({ ...endpoint, endpointIndex: index });
    });
    const locations = getOfficialLocations(markerImport?.markers || []).filter(location => location.point);
    const sortedGroups = [...groups.values()].sort((left, right) => {
        const a = left[0].point;
        const b = right[0].point;
        return a.y - b.y || a.x - b.x;
    });
    const nodeByEndpoint = new Map();
    const usedNodeIds = new Set();
    const candidateNodes = sortedGroups.map((group, index) => {
        const point = {
            x: Math.round(group.reduce((total, entry) => total + entry.point.x, 0) / group.length * 10) / 10,
            y: Math.round(group.reduce((total, entry) => total + entry.point.y, 0) / group.length * 10) / 10
        };
        const closest = locations
            .map(location => ({ location, distance: Math.hypot(location.point.x - point.x, location.point.y - point.y) }))
            .sort((left, right) => left.distance - right.distance)[0];
        const matchedLocation = closest?.distance <= LOCATION_TOLERANCE_PX ? closest.location : null;
        const degree = group.length;
        const baseId = matchedLocation ? slugify(matchedLocation.name) : `svg-${String(index + 1).padStart(3, '0')}`;
        let id = `road-node-${baseId}`;
        let suffix = 2;
        while (usedNodeIds.has(id)) id = `road-node-${baseId}-${suffix++}`;
        usedNodeIds.add(id);
        group.forEach(entry => nodeByEndpoint.set(entry.endpointIndex, id));
        return {
            id,
            name: matchedLocation?.name || (degree >= 3 ? `Entroncamento ${index + 1}` : `Ponto viário ${index + 1}`),
            point,
            type: degree >= 3 ? 'junction' : (matchedLocation ? 'location' : 'waypoint'),
            locationId: matchedLocation?.id || null,
            locationDistance: closest?.distance ?? Number.POSITIVE_INFINITY,
            fallbackName: degree >= 3 ? `Entroncamento ${index + 1}` : `Ponto viário ${index + 1}`
        };
    });
    const bestNodeByLocation = new Map();
    candidateNodes.forEach(node => {
        if (!node.locationId) return;
        const current = bestNodeByLocation.get(node.locationId);
        if (!current || node.locationDistance < current.locationDistance) bestNodeByLocation.set(node.locationId, node);
    });
    const nodes = candidateNodes.map(node => {
        const keepLocation = node.locationId && bestNodeByLocation.get(node.locationId) === node;
        return {
            id: node.id,
            name: keepLocation ? node.name : node.fallbackName,
            point: node.point,
            type: node.type === 'junction' ? 'junction' : (keepLocation ? 'location' : 'waypoint'),
            locationId: keepLocation ? node.locationId : null
        };
    });
    const usedSegmentIds = new Set();
    const segments = parsed.elements.map((segment, index) => {
        let id = `road-segment-${slugify(segment.name)}`;
        let suffix = 2;
        while (usedSegmentIds.has(id)) id = `road-segment-${slugify(segment.name)}-${suffix++}`;
        usedSegmentIds.add(id);
        const fromNodeId = nodeByEndpoint.get(index * 2);
        const toNodeId = nodeByEndpoint.get(index * 2 + 1);
        const fromNode = nodes.find(node => node.id === fromNodeId);
        const toNode = nodes.find(node => node.id === toNodeId);
        return {
            id,
            name: segment.name,
            fromNodeId,
            toNodeId,
            type: segment.type,
            carriageAllowed: segment.carriageAllowed,
            confidence: 'master-traced',
            points: [fromNode.point, ...segment.points.slice(1, -1), toNode.point]
        };
    });
    return {
        nodes,
        segments,
        warnings: parsed.elements.map(segment => segment.warning).filter(Boolean)
    };
}

function createModule(network, sourcePath) {
    const payload = {
        source: path.relative(PROJECT_ROOT, sourcePath).replace(/\\/g, '/'),
        importedAt: new Date().toISOString(),
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,
        snapTolerancePx: SNAP_TOLERANCE_PX,
        nodes: network.nodes,
        segments: network.segments,
        warnings: network.warnings
    };
    return `(function (root, factory) {\n`
        + `    const api = factory();\n`
        + `    if (typeof module !== 'undefined' && module.exports) module.exports = api;\n`
        + `    if (root) root.worldRoadImportedData = api;\n`
        + `})(typeof globalThis !== 'undefined' ? globalThis : this, function () {\n`
        + `    'use strict';\n`
        + `    return Object.freeze(${JSON.stringify(payload, null, 4)});\n`
        + `});\n`;
}

function createMarkerModule(markerImport, sourcePath) {
    const payload = {
        source: path.relative(PROJECT_ROOT, sourcePath).replace(/\\/g, '/'),
        importedAt: new Date().toISOString(),
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,
        markers: markerImport.markers,
        unmatchedMarkers: markerImport.unmatchedMarkers,
        ambiguousMarkers: markerImport.ambiguousMarkers,
        warnings: markerImport.warnings
    };
    return `(function (root, factory) {\n`
        + `    const api = factory();\n`
        + `    if (typeof module !== 'undefined' && module.exports) module.exports = api;\n`
        + `    if (root) root.worldLocationImportedData = api;\n`
        + `})(typeof globalThis !== 'undefined' ? globalThis : this, function () {\n`
        + `    'use strict';\n`
        + `    return Object.freeze(${JSON.stringify(payload, null, 4)});\n`
        + `});\n`;
}

function main() {
    const sourcePath = path.resolve(process.argv[2] || DEFAULT_SOURCE);
    const outputPath = path.resolve(process.argv[3] || DEFAULT_OUTPUT);
    const markerOutputPath = path.resolve(process.argv[4] || DEFAULT_MARKER_OUTPUT);
    const parsed = parseSvg(fs.readFileSync(sourcePath, 'utf8'));
    const markerImport = buildMarkerImport(parsed);
    const network = buildNetwork(parsed, markerImport);
    fs.writeFileSync(outputPath, createModule(network, sourcePath), 'utf8');
    fs.writeFileSync(markerOutputPath, createMarkerModule(markerImport, sourcePath), 'utf8');
    const types = network.segments.reduce((result, segment) => {
        result[segment.type] = (result[segment.type] || 0) + 1;
        return result;
    }, {});
    console.log(JSON.stringify({
        source: sourcePath,
        output: outputPath,
        markerOutput: markerOutputPath,
        nodes: network.nodes.length,
        segments: network.segments.length,
        junctions: network.nodes.filter(node => node.type === 'junction').length,
        types,
        matchedMarkers: markerImport.markers.length,
        unmatchedMarkers: markerImport.unmatchedMarkers.map(marker => marker.label),
        ambiguousMarkers: markerImport.ambiguousMarkers.map(marker => marker.label),
        warnings: [...network.warnings, ...markerImport.warnings]
    }, null, 2));
}

if (require.main === module) main();

module.exports = {
    decodeCorelId,
    normalizeLocationLabel,
    parseSvg,
    buildMarkerImport,
    buildNetwork,
    createModule,
    createMarkerModule
};
