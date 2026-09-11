(function (root, factory) {
    const roads = root?.worldRoadData
        || (typeof require === 'function' ? require('./world-road-data.js') : null);
    const api = factory(roads);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldRoadEditor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (roads) {
    'use strict';

    const CATALOG_VERSION = Math.max(1, Number(roads?.ROAD_NETWORK_VERSION) || 1);
    const STORAGE_KEY = `witcher-road-network-overrides-v${CATALOG_VERSION}`;
    const PACKAGE_TYPE = 'witcher-combat-road-network';
    const PACKAGE_VERSION = 1;
    const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
    const ALLOWED_TYPES = new Set(Object.values(roads?.ROAD_TYPES || { main: 'main', regional: 'regional', mountain: 'mountain' }));

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeText(value, fallback = '', maxLength = 180) {
        const text = String(value ?? '').trim();
        return (text || fallback).slice(0, maxLength);
    }

    function normalizePoint(value) {
        const width = Number(roads?.MAP_REFERENCE?.originalWidth) || 2880;
        const height = Number(roads?.MAP_REFERENCE?.originalHeight) || 4096;
        if (!value || !Number.isFinite(Number(value.x)) || !Number.isFinite(Number(value.y))) return null;
        return {
            x: Math.round(Math.min(width, Math.max(0, Number(value.x))) * 10) / 10,
            y: Math.round(Math.min(height, Math.max(0, Number(value.y))) * 10) / 10
        };
    }

    function catalogNetwork() {
        return {
            schemaVersion: PACKAGE_VERSION,
            catalogVersion: CATALOG_VERSION,
            mapId: roads?.MAP_ID || 'nolan-kotulan-the-continent',
            source: 'catalog',
            updatedAt: null,
            nodes: clone(roads?.ROAD_NODES || []),
            segments: clone(roads?.ROAD_SEGMENTS || [])
        };
    }

    function validateNetwork(value) {
        const errors = [];
        const source = value && typeof value === 'object' ? value : {};
        if (source.mapId !== (roads?.MAP_ID || 'nolan-kotulan-the-continent')) errors.push('A rede pertence a outro mapa.');
        if (!Array.isArray(source.nodes)) errors.push('A lista de pontos viários é inválida.');
        if (!Array.isArray(source.segments)) errors.push('A lista de trechos é inválida.');
        if (errors.length) return errors;

        const nodeIds = new Set();
        source.nodes.forEach((node, index) => {
            const id = normalizeText(node?.id);
            if (!id) errors.push(`Ponto viário ${index + 1} sem ID.`);
            else if (nodeIds.has(id)) errors.push(`ID de ponto duplicado: ${id}.`);
            else nodeIds.add(id);
            if (!normalizePoint(node?.point)) errors.push(`Coordenada inválida no ponto ${id || index + 1}.`);
        });

        const segmentIds = new Set();
        source.segments.forEach((segment, index) => {
            const id = normalizeText(segment?.id);
            if (!id) errors.push(`Trecho ${index + 1} sem ID.`);
            else if (segmentIds.has(id)) errors.push(`ID de trecho duplicado: ${id}.`);
            else segmentIds.add(id);
            if (!nodeIds.has(segment?.fromNodeId) || !nodeIds.has(segment?.toNodeId)) errors.push(`Trecho ${id || index + 1} possui extremidade inexistente.`);
            if (!Array.isArray(segment?.points) || segment.points.length < 2 || segment.points.some(point => !normalizePoint(point))) errors.push(`Geometria inválida no trecho ${id || index + 1}.`);
            if (!ALLOWED_TYPES.has(segment?.type)) errors.push(`Tipo inválido no trecho ${id || index + 1}.`);
        });
        return errors;
    }

    function normalizeNetwork(value) {
        const source = value && typeof value === 'object' ? value : {};
        const network = {
            schemaVersion: PACKAGE_VERSION,
            catalogVersion: CATALOG_VERSION,
            mapId: roads?.MAP_ID || 'nolan-kotulan-the-continent',
            source: source.source === 'catalog' ? 'catalog' : 'manual',
            updatedAt: normalizeText(source.updatedAt) || null,
            nodes: (Array.isArray(source.nodes) ? source.nodes : []).map(node => ({
                id: normalizeText(node.id),
                name: normalizeText(node.name, 'Ponto viário'),
                point: normalizePoint(node.point),
                type: normalizeText(node.type, 'junction'),
                locationId: normalizeText(node.locationId) || null
            })),
            segments: (Array.isArray(source.segments) ? source.segments : []).map(segment => ({
                id: normalizeText(segment.id),
                name: normalizeText(segment.name, 'Trecho sem nome'),
                fromNodeId: normalizeText(segment.fromNodeId),
                toNodeId: normalizeText(segment.toNodeId),
                type: ALLOWED_TYPES.has(segment.type) ? segment.type : 'main',
                carriageAllowed: segment.carriageAllowed !== false,
                confidence: normalizeText(segment.confidence, 'manual'),
                points: (Array.isArray(segment.points) ? segment.points : []).map(normalizePoint).filter(Boolean)
            }))
        };
        const errors = validateNetwork(network);
        if (errors.length) throw new Error(errors[0]);
        return network;
    }

    function loadNetwork(storage) {
        if (!storage?.getItem) return catalogNetwork();
        try {
            const raw = storage.getItem(STORAGE_KEY);
            if (!raw) return catalogNetwork();
            return normalizeNetwork(JSON.parse(raw));
        } catch (error) {
            console.warn('Rede viária manual inválida; usando o catálogo original.', error);
            return catalogNetwork();
        }
    }

    function saveNetwork(storage, value) {
        const network = normalizeNetwork({ ...value, source: 'manual', updatedAt: new Date().toISOString() });
        storage?.setItem?.(STORAGE_KEY, JSON.stringify(network));
        return network;
    }

    function restoreCatalog(storage) {
        storage?.removeItem?.(STORAGE_KEY);
        return catalogNetwork();
    }

    function slug(value) {
        return normalizeText(value, 'trecho').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'trecho';
    }

    function uniqueId(prefix, label, existingIds) {
        const base = `${prefix}-${slug(label)}`;
        if (!existingIds.has(base)) return base;
        let suffix = 2;
        while (existingIds.has(`${base}-${suffix}`)) suffix += 1;
        return `${base}-${suffix}`;
    }

    function distanceBetween(left, right) {
        return Math.hypot(Number(left.x) - Number(right.x), Number(left.y) - Number(right.y));
    }

    function findNearestNode(network, point, threshold = 28) {
        const normalized = normalizePoint(point);
        if (!normalized) return null;
        let match = null;
        let distance = Number.POSITIVE_INFINITY;
        network.nodes.forEach(node => {
            const candidate = distanceBetween(node.point, normalized);
            if (candidate <= threshold && candidate < distance) {
                match = node;
                distance = candidate;
            }
        });
        return match ? { node: match, distance } : null;
    }

    function moveNode(networkValue, nodeId, point) {
        const network = normalizeNetwork(networkValue);
        const normalized = normalizePoint(point);
        const node = network.nodes.find(entry => entry.id === nodeId);
        if (!node || !normalized) throw new Error('Ponto viário não encontrado.');
        node.point = normalized;
        network.segments.forEach(segment => {
            if (segment.fromNodeId === nodeId) segment.points[0] = { ...normalized };
            if (segment.toNodeId === nodeId) segment.points[segment.points.length - 1] = { ...normalized };
        });
        return network;
    }

    function updateSegment(networkValue, segmentId, input = {}) {
        let network = normalizeNetwork(networkValue);
        const segment = network.segments.find(entry => entry.id === segmentId);
        if (!segment) throw new Error('Trecho não encontrado.');
        const points = (Array.isArray(input.points) ? input.points : segment.points).map(normalizePoint).filter(Boolean);
        if (points.length < 2) throw new Error('Um trecho precisa de pelo menos dois pontos.');
        network = moveNode(network, segment.fromNodeId, points[0]);
        network = moveNode(network, segment.toNodeId, points[points.length - 1]);
        const updated = network.segments.find(entry => entry.id === segmentId);
        updated.name = normalizeText(input.name, updated.name);
        updated.type = ALLOWED_TYPES.has(input.type) ? input.type : updated.type;
        updated.carriageAllowed = input.carriageAllowed !== false;
        updated.confidence = 'manual';
        updated.points = points;
        updated.points[0] = { ...network.nodes.find(node => node.id === updated.fromNodeId).point };
        updated.points[updated.points.length - 1] = { ...network.nodes.find(node => node.id === updated.toNodeId).point };
        return normalizeNetwork(network);
    }

    function addSegment(networkValue, input = {}) {
        const network = normalizeNetwork(networkValue);
        const points = (Array.isArray(input.points) ? input.points : []).map(normalizePoint).filter(Boolean);
        if (points.length < 2) throw new Error('Marque pelo menos o início e o fim do trecho.');
        const nodeIds = new Set(network.nodes.map(node => node.id));
        const segmentIds = new Set(network.segments.map(segment => segment.id));
        const createEndpoint = (point, position) => {
            const match = findNearestNode(network, point, Number(input.snapDistance) || 28);
            if (match) return match.node;
            const name = position === 'from' ? `Entroncamento inicial de ${input.name || 'novo trecho'}` : `Entroncamento final de ${input.name || 'novo trecho'}`;
            const node = { id: uniqueId('road-node-manual', name, nodeIds), name, point: { ...point }, type: 'junction', locationId: null };
            nodeIds.add(node.id);
            network.nodes.push(node);
            return node;
        };
        const fromNode = createEndpoint(points[0], 'from');
        const toNode = createEndpoint(points[points.length - 1], 'to');
        points[0] = { ...fromNode.point };
        points[points.length - 1] = { ...toNode.point };
        const name = normalizeText(input.name, `Trecho manual ${network.segments.length + 1}`);
        const segment = {
            id: uniqueId('road-segment-manual', name, segmentIds),
            name,
            fromNodeId: fromNode.id,
            toNodeId: toNode.id,
            type: ALLOWED_TYPES.has(input.type) ? input.type : 'main',
            carriageAllowed: input.carriageAllowed !== false,
            confidence: 'manual',
            points
        };
        network.segments.push(segment);
        return { network: normalizeNetwork(network), segmentId: segment.id };
    }

    function removeSegment(networkValue, segmentId) {
        const network = normalizeNetwork(networkValue);
        if (!network.segments.some(segment => segment.id === segmentId)) throw new Error('Trecho não encontrado.');
        network.segments = network.segments.filter(segment => segment.id !== segmentId);
        const usedNodeIds = new Set(network.segments.flatMap(segment => [segment.fromNodeId, segment.toNodeId]));
        network.nodes = network.nodes.filter(node => usedNodeIds.has(node.id) || node.locationId);
        return normalizeNetwork(network);
    }

    function buildExportPackage(networkValue) {
        return {
            type: PACKAGE_TYPE,
            version: PACKAGE_VERSION,
            exportedAt: new Date().toISOString(),
            network: normalizeNetwork(networkValue)
        };
    }

    function prepareImportedPackage(value, options = {}) {
        if (Number(options.byteLength) > MAX_IMPORT_BYTES) throw new Error('O arquivo ultrapassa o limite de 4 MB.');
        if (!value || value.type !== PACKAGE_TYPE || Number(value.version) !== PACKAGE_VERSION) throw new Error('Arquivo de rede viária incompatível.');
        return normalizeNetwork(value.network);
    }

    return Object.freeze({
        STORAGE_KEY,
        CATALOG_VERSION,
        PACKAGE_TYPE,
        PACKAGE_VERSION,
        MAX_IMPORT_BYTES,
        catalogNetwork,
        validateNetwork,
        normalizeNetwork,
        loadNetwork,
        saveNetwork,
        restoreCatalog,
        findNearestNode,
        moveNode,
        updateSegment,
        addSegment,
        removeSegment,
        buildExportPackage,
        prepareImportedPackage
    });
});
