(function (root, factory) {
    const imported = root?.worldRoadImportedData
        || (typeof require === 'function' ? require('./world-road-imported-data.js') : null);
    const api = factory(imported);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldRoadData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (imported) {
    'use strict';

    const ROAD_NETWORK_VERSION = 2;
    const MAP_ID = 'nolan-kotulan-the-continent';
    const MAP_REFERENCE = Object.freeze({
        originalWidth: 2880,
        originalHeight: 4096,
        pixelsPerGrid: 576,
        kilometersPerGrid: 100
    });
    const ROAD_TYPES = Object.freeze({
        MAIN: 'main',
        REGIONAL: 'regional',
        MOUNTAIN: 'mountain'
    });

    function pixelPoint(x, y) {
        return Object.freeze({ x: Number(x), y: Number(y) });
    }

    function roadNode(id, name, x, y, options = {}) {
        return Object.freeze({
            id: `road-node-${id}`,
            name,
            point: pixelPoint(x, y),
            type: options.type || 'location',
            locationId: options.locationId || null
        });
    }

    const LEGACY_ROAD_NODES = Object.freeze([
        roadNode('aed-gynvael', 'Aed Gynvael', 485, 145, { locationId: 'world-cartographic-aed-gynvael' }),
        roadNode('rakverelin', 'Rakverelin', 445, 225, { locationId: 'world-cartographic-rakverelin' }),
        roadNode('targo', 'Targo', 590, 215, { locationId: 'world-cartographic-targo' }),
        roadNode('velhad-crossroads', 'Entroncamento de Velhad', 720, 255, { type: 'junction' }),
        roadNode('lan-exeter', 'Lan Exeter', 780, 310, { locationId: 'world-canonical-lan-exeter' }),
        roadNode('tridam', 'Tridam', 535, 405, { locationId: 'world-cartographic-tridam' }),
        roadNode('pont-vanis', 'Pont Vanis', 815, 500, { locationId: 'world-canonical-pont-vanis' }),
        roadNode('creyden', 'Creyden', 1410, 310, { locationId: 'world-canonical-creyden' }),
        roadNode('tancarville', 'Tancarville', 1260, 315, { locationId: 'world-cartographic-tancarville' }),
        roadNode('hengfors', 'Hengfors', 1540, 385, { locationId: 'world-canonical-hengfors-city' }),
        roadNode('caingorn', 'Caingorn', 1640, 360, { locationId: 'world-canonical-caingorn-city' }),
        roadNode('barefield', 'Barefield', 1850, 280, { locationId: 'world-canonical-barefield' }),
        roadNode('blaviken', 'Blaviken', 1310, 520, { locationId: 'world-canonical-blaviken' }),
        roadNode('gelibol', 'Gelibol', 1730, 575, { locationId: 'world-cartographic-gelibol' }),
        roadNode('drakenborg', 'Drakenborg', 1740, 685, { locationId: 'world-canonical-drakenborg' }),
        roadNode('tretogor', 'Tretogor', 1500, 810, { locationId: 'world-canonical-tretogor' }),
        roadNode('novigrad', 'Novigrad', 1165, 1010, { locationId: 'world-canonical-novigrad' }),
        roadNode('oxenfurt', 'Oxenfurt', 1250, 1020, { locationId: 'world-canonical-oxenfurt' }),
        roadNode('devils-ford', "Devil's Ford", 1490, 955, { locationId: 'world-cartographic-devils-ford' }),
        roadNode('la-valette', 'La Valette', 1620, 945, { locationId: 'world-cartographic-la-valette' }),
        roadNode('murivel', 'Murivel', 1760, 790, { locationId: 'world-cartographic-murivel' }),
        roadNode('flotsam', 'Flotsam', 1920, 830, { locationId: 'world-cartographic-flotsam' }),
        roadNode('vergen', 'Vergen', 2150, 840, { locationId: 'world-canonical-vergen' }),
        roadNode('ban-glean', 'Ban Glean', 2340, 750, { locationId: 'world-canonical-ban-glean' }),
        roadNode('ard-carraigh', 'Ard Carraigh', 2310, 365, { locationId: 'world-canonical-ard-carraigh' }),
        roadNode('daevon', 'Daevon', 2220, 410, { locationId: 'world-cartographic-daevon' }),
        roadNode('east-kaedwen-crossroads', 'Entroncamento de Kaedwen Oriental', 2615, 600, { type: 'junction' }),
        roadNode('vizima', 'Vizima', 1610, 1110, { locationId: 'world-canonical-vizima' }),
        roadNode('dorian', 'Dorian', 1390, 1165, { locationId: 'world-canonical-dorian' }),
        roadNode('crows-perch', "Crow's Perch", 1180, 1100, { locationId: 'world-canonical-crows-perch' }),
        roadNode('gors-velen', 'Gors Velen', 1250, 1240, { locationId: 'world-canonical-gors-velen' }),
        roadNode('white-orchard', 'White Orchard', 1670, 1160, { locationId: 'world-canonical-white-orchard' }),
        roadNode('carreras', 'Carreras', 1880, 1180, { locationId: 'world-cartographic-carreras' }),
        roadNode('maribor', 'Maribor', 1720, 1375, { locationId: 'world-canonical-maribor' }),
        roadNode('brenna', 'Brenna', 1650, 1450, { locationId: 'world-cartographic-brenna' }),
        roadNode('brugge-crossroads', 'Entroncamento de Brugge', 1630, 1550, { type: 'junction' }),
        roadNode('vidort', 'Vidort', 1640, 1640, { locationId: 'world-cartographic-vidort' }),
        roadNode('cintra', 'Cintra', 1280, 1795, { locationId: 'world-canonical-cintra-city' }),
        roadNode('coldwater', 'Coldwater', 1510, 1805, { locationId: 'world-cartographic-coldwater' }),
        roadNode('rivia', 'Rívia', 2270, 1420, { locationId: 'world-canonical-rivia-city' }),
        roadNode('lyria', 'Líria', 2570, 1305, { locationId: 'world-canonical-lyria-city' }),
        roadNode('aldersberg', 'Aldersberg', 2395, 1285, { locationId: 'world-canonical-aldersberg' }),
        roadNode('vengerberg', 'Vengerberg', 2340, 1175, { locationId: 'world-canonical-vengerberg' }),
        roadNode('glevitzingen', 'Glevitzingen', 2470, 1510, { type: 'location' }),
        roadNode('belhaven', 'Belhaven', 2170, 2000, { locationId: 'world-cartographic-belhaven' }),
        roadNode('beauclair', 'Beauclair', 2390, 2170, { locationId: 'world-canonical-beauclair' }),
        roadNode('caravista', 'Caravista', 1980, 2295, { locationId: 'world-cartographic-caravista' }),
        roadNode('tor-zireael', 'Tor Zireael', 1710, 2270, { locationId: 'world-canonical-tor-zireael' }),
        roadNode('metinna', 'Metinna', 1670, 2550, { locationId: 'world-canonical-metinna-city' }),
        roadNode('foregham', 'Foregham', 1840, 2640, { locationId: 'world-cartographic-foregham' }),
        roadNode('metinna-east-crossroads', 'Entroncamento de Metinna Oriental', 2060, 2600, { type: 'junction' }),
        roadNode('jealousy', 'Jealousy', 1835, 2850, { locationId: 'world-cartographic-jealousy' }),
        roadNode('rocayne', 'Rocayne', 1925, 2890, { locationId: 'world-cartographic-rocayne' }),
        roadNode('maecht', 'Maecht', 2010, 3035, { locationId: 'world-cartographic-maecht-city' }),
        roadNode('ebbing-crossroads', 'Entroncamento de Ebbing', 1600, 2910, { type: 'junction' }),
        roadNode('salm', 'Salm', 1480, 3215, { locationId: 'world-cartographic-salm' }),
        roadNode('gemmera', 'Gemmera', 1935, 3290, { locationId: 'world-cartographic-gemmera-city' }),
        roadNode('etolia-crossroads', 'Entroncamento de Etólia', 1640, 3390, { type: 'junction' }),
        roadNode('loc-grim', 'Loc Grim', 1880, 3635, { locationId: 'world-cartographic-loc-grim' }),
        roadNode('nilfgaard', 'Cidade de Nilfgaard', 1705, 3785, { locationId: 'world-canonical-nilfgaard-city' }),
        roadNode('viroleda', 'Viroleda', 2090, 3885, { locationId: 'world-canonical-viroleda' }),
        roadNode('vicovaro', 'Vicovaro', 2295, 3510, { locationId: 'world-canonical-vicovaro-city' }),
        roadNode('darn-ymlac', 'Darn Ymlac', 2290, 3690, { type: 'location' })
    ]);

    const LEGACY_NODE_BY_ID = new Map(LEGACY_ROAD_NODES.map(node => [node.id, node]));

    function roadSegment(id, name, from, to, via = [], options = {}) {
        const fromId = `road-node-${from}`;
        const toId = `road-node-${to}`;
        const start = LEGACY_NODE_BY_ID.get(fromId);
        const end = LEGACY_NODE_BY_ID.get(toId);
        if (!start || !end) throw new Error(`Trecho ${id} referencia um entroncamento inexistente.`);
        return Object.freeze({
            id: `road-segment-${id}`,
            name,
            fromNodeId: fromId,
            toNodeId: toId,
            type: options.type || ROAD_TYPES.MAIN,
            carriageAllowed: options.carriageAllowed !== false,
            confidence: options.confidence || 'traced',
            points: Object.freeze([start.point, ...via.map(point => pixelPoint(point[0], point[1])), end.point])
        });
    }

    const LEGACY_ROAD_SEGMENTS = Object.freeze([
        roadSegment('aed-rakverelin', 'Estrada de Narok', 'aed-gynvael', 'rakverelin', [[480, 175], [465, 205]], { type: ROAD_TYPES.REGIONAL }),
        roadSegment('rakverelin-velhad', 'Estrada de Velhad', 'rakverelin', 'velhad-crossroads', [[505, 215], [560, 205], [625, 220], [675, 245]]),
        roadSegment('targo-velhad', 'Caminho de Targo', 'targo', 'velhad-crossroads', [[625, 220], [675, 245]], { type: ROAD_TYPES.REGIONAL }),
        roadSegment('velhad-lan-exeter', 'Estrada de Lan Exeter', 'velhad-crossroads', 'lan-exeter', [[745, 275]]),
        roadSegment('tridam-lan-exeter', 'Estrada Costeira de Poviss', 'tridam', 'lan-exeter', [[590, 390], [650, 360], [720, 335]]),
        roadSegment('lan-exeter-pont-vanis', 'Estrada de Pont Vanis', 'lan-exeter', 'pont-vanis', [[805, 350], [815, 410], [815, 460]]),
        roadSegment('lan-exeter-tancarville', 'Estrada Real de Kovir', 'lan-exeter', 'tancarville', [[885, 305], [990, 305], [1100, 320], [1180, 320]]),
        roadSegment('tancarville-creyden', 'Estrada de Creyden', 'tancarville', 'creyden', [[1310, 300], [1360, 300]]),
        roadSegment('creyden-hengfors', 'Estrada da Liga de Hengfors', 'creyden', 'hengfors', [[1450, 325], [1495, 355]]),
        roadSegment('hengfors-caingorn', 'Estrada de Caingorn', 'hengfors', 'caingorn', [[1580, 380]]),
        roadSegment('caingorn-barefield', 'Passagem de Barefield', 'caingorn', 'barefield', [[1710, 330], [1780, 305]], { type: ROAD_TYPES.MOUNTAIN, carriageAllowed: false }),
        roadSegment('hengfors-blaviken', 'Estrada de Blaviken', 'hengfors', 'blaviken', [[1510, 420], [1460, 455], [1390, 485]]),
        roadSegment('blaviken-tretogor', 'Estrada Ocidental de Redânia', 'blaviken', 'tretogor', [[1320, 575], [1380, 650], [1450, 730]]),
        roadSegment('caingorn-gelibol', 'Estrada de Gelibol', 'caingorn', 'gelibol', [[1675, 430], [1700, 500]]),
        roadSegment('gelibol-drakenborg', 'Estrada de Drakenborg', 'gelibol', 'drakenborg', [[1720, 625]]),
        roadSegment('drakenborg-tretogor', 'Estrada Real Redaniana', 'drakenborg', 'tretogor', [[1685, 720], [1600, 770]]),
        roadSegment('tretogor-novigrad', 'Estrada de Novigrad', 'tretogor', 'novigrad', [[1420, 850], [1340, 900], [1260, 950]]),
        roadSegment('novigrad-oxenfurt', 'Estrada de Oxenfurt', 'novigrad', 'oxenfurt', [[1200, 1030]]),
        roadSegment('oxenfurt-devils-ford', 'Estrada do Vau do Diabo', 'oxenfurt', 'devils-ford', [[1340, 1010], [1420, 985]]),
        roadSegment('devils-ford-tretogor', 'Estrada Central de Redânia', 'devils-ford', 'tretogor', [[1495, 900], [1500, 850]]),
        roadSegment('devils-ford-la-valette', 'Estrada de La Valette', 'devils-ford', 'la-valette', [[1540, 960], [1580, 955]]),
        roadSegment('la-valette-murivel', 'Estrada Oriental de Redânia', 'la-valette', 'murivel', [[1640, 900], [1700, 850]]),
        roadSegment('murivel-drakenborg', 'Estrada de Murivel', 'murivel', 'drakenborg', [[1760, 750]]),
        roadSegment('murivel-flotsam', 'Estrada do Pontar Superior', 'murivel', 'flotsam', [[1810, 810], [1860, 830]]),
        roadSegment('flotsam-vergen', 'Estrada do Alto Aedirn', 'flotsam', 'vergen', [[1990, 830], [2070, 835]]),
        roadSegment('vergen-ban-glean', 'Estrada de Ban Glean', 'vergen', 'ban-glean', [[2210, 820], [2270, 790]]),
        roadSegment('ban-glean-east-kaedwen', 'Estrada Oriental de Kaedwen', 'ban-glean', 'east-kaedwen-crossroads', [[2440, 760], [2520, 720], [2580, 650]]),
        roadSegment('ard-carraigh-daevon', 'Estrada de Daevon', 'ard-carraigh', 'daevon', [[2270, 390]]),
        roadSegment('daevon-ban-glean', 'Estrada Real de Kaedwen', 'daevon', 'ban-glean', [[2240, 480], [2200, 580], [2260, 680]]),
        roadSegment('ard-carraigh-east-kaedwen', 'Estrada de Ban Ard', 'ard-carraigh', 'east-kaedwen-crossroads', [[2410, 390], [2500, 430], [2570, 510]]),
        roadSegment('tretogor-dorian', 'Estrada Temeriana do Norte', 'tretogor', 'dorian', [[1470, 900], [1450, 1010], [1410, 1100]]),
        roadSegment('crows-perch-dorian', 'Estrada de Velen', 'crows-perch', 'dorian', [[1250, 1130], [1320, 1150]]),
        roadSegment('dorian-vizima', 'Estrada de Vizima', 'dorian', 'vizima', [[1460, 1160], [1520, 1140]]),
        roadSegment('vizima-white-orchard', 'Estrada do Pomar Branco', 'vizima', 'white-orchard', [[1640, 1130]]),
        roadSegment('white-orchard-carreras', 'Estrada de Carreras', 'white-orchard', 'carreras', [[1740, 1175], [1810, 1200]]),
        roadSegment('dorian-gors-velen', 'Estrada de Gors Velen', 'dorian', 'gors-velen', [[1340, 1190], [1290, 1220]]),
        roadSegment('gors-velen-maribor', 'Estrada Meridional de Teméria', 'gors-velen', 'maribor', [[1320, 1300], [1420, 1360], [1540, 1400], [1640, 1390]]),
        roadSegment('vizima-maribor', 'Estrada Real Temeriana', 'vizima', 'maribor', [[1640, 1200], [1680, 1290]]),
        roadSegment('maribor-brenna', 'Estrada de Brenna', 'maribor', 'brenna', [[1680, 1410]]),
        roadSegment('brenna-brugge', 'Estrada de Brugge', 'brenna', 'brugge-crossroads', [[1640, 1500]]),
        roadSegment('brugge-vidort', 'Estrada do Baixo Yaruga', 'brugge-crossroads', 'vidort', [[1630, 1600]]),
        roadSegment('brugge-cintra', 'Estrada de Cintra', 'brugge-crossroads', 'cintra', [[1530, 1620], [1450, 1680], [1360, 1730]]),
        roadSegment('cintra-coldwater', 'Estrada Cintriana Oriental', 'cintra', 'coldwater', [[1360, 1770], [1440, 1780]]),
        roadSegment('vergen-vengerberg', 'Estrada de Vengerberg', 'vergen', 'vengerberg', [[2200, 930], [2260, 1040], [2310, 1120]]),
        roadSegment('vengerberg-aldersberg', 'Estrada de Aldersberg', 'vengerberg', 'aldersberg', [[2380, 1215]]),
        roadSegment('aldersberg-lyria', 'Estrada de Líria', 'aldersberg', 'lyria', [[2460, 1300]]),
        roadSegment('aldersberg-rivia', 'Estrada de Rívia', 'aldersberg', 'rivia', [[2340, 1340], [2300, 1380]]),
        roadSegment('rivia-glevitzingen', 'Estrada do Yaruga', 'rivia', 'glevitzingen', [[2320, 1450], [2400, 1480]]),
        roadSegment('lyria-glevitzingen', 'Estrada Oriental de Líria', 'lyria', 'glevitzingen', [[2550, 1380], [2510, 1450]]),
        roadSegment('glevitzingen-belhaven', 'Estrada do Dol Angra', 'glevitzingen', 'belhaven', [[2430, 1600], [2370, 1700], [2290, 1820], [2220, 1930]]),
        roadSegment('belhaven-beauclair', 'Estrada de Beauclair', 'belhaven', 'beauclair', [[2240, 2050], [2310, 2120]]),
        roadSegment('beauclair-caravista', 'Estrada de Mag Turga', 'beauclair', 'caravista', [[2290, 2210], [2180, 2240], [2070, 2280]]),
        roadSegment('caravista-tor-zireael', 'Estrada de Nazair', 'caravista', 'tor-zireael', [[1890, 2280], [1800, 2270]]),
        roadSegment('tor-zireael-metinna', 'Estrada de Metinna', 'tor-zireael', 'metinna', [[1650, 2350], [1580, 2440], [1600, 2510]]),
        roadSegment('metinna-foregham', 'Estrada de Foregham', 'metinna', 'foregham', [[1740, 2580], [1800, 2600]]),
        roadSegment('foregham-metinna-east', 'Estrada Oriental de Metinna', 'foregham', 'metinna-east-crossroads', [[1930, 2610], [2000, 2600]]),
        roadSegment('metinna-east-jealousy', 'Estrada de Jealousy', 'metinna-east-crossroads', 'jealousy', [[2010, 2670], [1940, 2750], [1870, 2810]]),
        roadSegment('jealousy-rocayne', 'Estrada de Rocayne', 'jealousy', 'rocayne', [[1880, 2890]]),
        roadSegment('rocayne-maecht', 'Estrada de Maecht', 'rocayne', 'maecht', [[1980, 2940], [2010, 2990]]),
        roadSegment('jealousy-ebbing', 'Estrada de Ebbing', 'jealousy', 'ebbing-crossroads', [[1760, 2870], [1680, 2890]]),
        roadSegment('ebbing-salm', 'Estrada de Salm', 'ebbing-crossroads', 'salm', [[1540, 3000], [1500, 3100]]),
        roadSegment('ebbing-etolia', 'Estrada de Etólia', 'ebbing-crossroads', 'etolia-crossroads', [[1590, 3040], [1580, 3160], [1600, 3290]]),
        roadSegment('maecht-gemmera', 'Estrada de Gemmera', 'maecht', 'gemmera', [[2000, 3110], [1980, 3200]]),
        roadSegment('gemmera-etolia', 'Estrada das Províncias', 'gemmera', 'etolia-crossroads', [[1860, 3330], [1760, 3380]]),
        roadSegment('etolia-loc-grim', 'Estrada de Loc Grim', 'etolia-crossroads', 'loc-grim', [[1700, 3480], [1780, 3560]]),
        roadSegment('loc-grim-nilfgaard', 'Estrada da Cidade Dourada', 'loc-grim', 'nilfgaard', [[1810, 3690], [1760, 3750]]),
        roadSegment('loc-grim-vicovaro', 'Estrada de Vicovaro', 'loc-grim', 'vicovaro', [[1980, 3590], [2100, 3530], [2200, 3500]]),
        roadSegment('nilfgaard-viroleda', 'Estrada Imperial Meridional', 'nilfgaard', 'viroleda', [[1820, 3820], [1960, 3860]]),
        roadSegment('vicovaro-darn-ymlac', 'Estrada de Ymlac', 'vicovaro', 'darn-ymlac', [[2280, 3600]]),
        roadSegment('darn-ymlac-viroleda', 'Estrada de Alba', 'darn-ymlac', 'viroleda', [[2220, 3770], [2150, 3840]])
    ]);

    const hasImportedNetwork = Array.isArray(imported?.nodes)
        && imported.nodes.length >= 2
        && Array.isArray(imported?.segments)
        && imported.segments.length >= 1;
    const ROAD_NODES = Object.freeze((hasImportedNetwork ? imported.nodes : LEGACY_ROAD_NODES).map(node => Object.freeze({
        id: String(node.id),
        name: String(node.name || 'Ponto viário'),
        point: pixelPoint(node.point?.x, node.point?.y),
        type: String(node.type || 'waypoint'),
        locationId: node.locationId ? String(node.locationId) : null
    })));
    const NODE_BY_ID = new Map(ROAD_NODES.map(node => [node.id, node]));
    const ROAD_SEGMENTS = Object.freeze((hasImportedNetwork ? imported.segments : LEGACY_ROAD_SEGMENTS).map(segment => Object.freeze({
        id: String(segment.id),
        name: String(segment.name || 'Estrada'),
        fromNodeId: String(segment.fromNodeId),
        toNodeId: String(segment.toNodeId),
        type: Object.values(ROAD_TYPES).includes(segment.type) ? segment.type : ROAD_TYPES.REGIONAL,
        carriageAllowed: segment.carriageAllowed !== false,
        confidence: String(segment.confidence || 'traced'),
        points: Object.freeze((Array.isArray(segment.points) ? segment.points : []).map(point => pixelPoint(point.x, point.y)))
    })));
    const ROAD_SOURCE = Object.freeze({
        kind: hasImportedNetwork ? 'svg' : 'legacy',
        file: hasImportedNetwork ? String(imported.source || '') : '',
        importedAt: hasImportedNetwork ? String(imported.importedAt || '') : '',
        warnings: Object.freeze(hasImportedNetwork && Array.isArray(imported.warnings) ? [...imported.warnings] : [])
    });

    function measurePolylinePixels(points) {
        return (Array.isArray(points) ? points : []).slice(1).reduce((total, point, index) => {
            const previous = points[index];
            return total + Math.hypot(Number(point.x) - Number(previous.x), Number(point.y) - Number(previous.y));
        }, 0);
    }

    function pixelsToKilometers(pixels, reference = MAP_REFERENCE) {
        const pixelsPerGrid = Math.max(1, Number(reference.pixelsPerGrid) || MAP_REFERENCE.pixelsPerGrid);
        const kilometersPerGrid = Math.max(0, Number(reference.kilometersPerGrid) || MAP_REFERENCE.kilometersPerGrid);
        return Number(pixels) / pixelsPerGrid * kilometersPerGrid;
    }

    function getSegmentDistanceKm(segment, reference = MAP_REFERENCE) {
        return pixelsToKilometers(measurePolylinePixels(segment?.points), reference);
    }

    function getNetworkSummary(segments = ROAD_SEGMENTS, nodes = ROAD_NODES, reference = MAP_REFERENCE) {
        const list = Array.isArray(segments) ? segments : [];
        const nodeList = Array.isArray(nodes) ? nodes : [];
        return Object.freeze({
            nodeCount: nodeList.length,
            junctionCount: getJunctionNodes(list, nodeList).length,
            segmentCount: list.length,
            distanceKm: Math.round(list.reduce((total, segment) => total + getSegmentDistanceKm(segment, reference), 0))
        });
    }

    function getConnectedSegments(nodeId, segments = ROAD_SEGMENTS) {
        return (Array.isArray(segments) ? segments : []).filter(segment => segment.fromNodeId === nodeId || segment.toNodeId === nodeId);
    }

    function getNodeDegree(nodeId, segments = ROAD_SEGMENTS) {
        return (Array.isArray(segments) ? segments : []).filter(segment =>
            segment.fromNodeId === nodeId || segment.toNodeId === nodeId).length;
    }

    function getJunctionNodes(segments = ROAD_SEGMENTS, nodes = ROAD_NODES) {
        return (Array.isArray(nodes) ? nodes : []).filter(node => node.type === 'junction' || getNodeDegree(node.id, segments) >= 3);
    }

    function findNodeByLocationId(locationId, nodes = ROAD_NODES) {
        return (Array.isArray(nodes) ? nodes : []).find(node => node.locationId === locationId) || null;
    }

    function findShortestRoute(fromNodeId, toNodeId, options = {}) {
        const nodes = Array.isArray(options.nodes) ? options.nodes : ROAD_NODES;
        const segments = Array.isArray(options.segments) ? options.segments : ROAD_SEGMENTS;
        const reference = options.reference || MAP_REFERENCE;
        const nodeById = new Map(nodes.map(node => [node.id, node]));
        if (!nodeById.has(fromNodeId) || !nodeById.has(toNodeId)) return null;
        const carriageOnly = options.carriageOnly === true;
        const getCost = typeof options.getCost === 'function'
            ? options.getCost
            : segment => getSegmentDistanceKm(segment, reference);
        const heuristic = typeof options.heuristic === 'function'
            ? options.heuristic
            : (nodeId => {
                const node = nodeById.get(nodeId);
                const destination = nodeById.get(toNodeId);
                return pixelsToKilometers(Math.hypot(
                    Number(node?.point?.x) - Number(destination?.point?.x),
                    Number(node?.point?.y) - Number(destination?.point?.y)
                ), reference);
            });
        const distances = new Map(nodes.map(node => [node.id, Number.POSITIVE_INFINITY]));
        const estimates = new Map(nodes.map(node => [node.id, Number.POSITIVE_INFINITY]));
        const previous = new Map();
        const pending = new Set([fromNodeId]);
        distances.set(fromNodeId, 0);
        estimates.set(fromNodeId, Math.max(0, Number(heuristic(fromNodeId)) || 0));

        while (pending.size) {
            let current = null;
            let currentEstimate = Number.POSITIVE_INFINITY;
            pending.forEach(nodeId => {
                const estimate = estimates.get(nodeId);
                if (estimate < currentEstimate) {
                    current = nodeId;
                    currentEstimate = estimate;
                }
            });
            if (!current) break;
            if (current === toNodeId) break;
            pending.delete(current);
            const currentDistance = distances.get(current);
            for (const segment of getConnectedSegments(current, segments)) {
                if (carriageOnly && !segment.carriageAllowed) continue;
                const neighbor = segment.fromNodeId === current ? segment.toNodeId : segment.fromNodeId;
                if (!nodeById.has(neighbor)) continue;
                const segmentCost = Number(getCost(segment, current, neighbor));
                if (!Number.isFinite(segmentCost) || segmentCost < 0) continue;
                const candidate = currentDistance + segmentCost;
                if (candidate >= distances.get(neighbor)) continue;
                distances.set(neighbor, candidate);
                estimates.set(neighbor, candidate + Math.max(0, Number(heuristic(neighbor)) || 0));
                previous.set(neighbor, { nodeId: current, segmentId: segment.id });
                pending.add(neighbor);
            }
        }

        if (!Number.isFinite(distances.get(toNodeId))) return null;
        const nodeIds = [toNodeId];
        const segmentIds = [];
        let cursor = toNodeId;
        while (cursor !== fromNodeId) {
            const step = previous.get(cursor);
            if (!step) return null;
            segmentIds.unshift(step.segmentId);
            nodeIds.unshift(step.nodeId);
            cursor = step.nodeId;
        }
        return Object.freeze({
            fromNodeId,
            toNodeId,
            nodeIds: Object.freeze(nodeIds),
            segmentIds: Object.freeze(segmentIds),
            distanceKm: Math.round(nodeIds.slice(1).reduce((total, nodeId, index) => {
                const segmentId = segmentIds[index];
                const segment = segments.find(entry => entry.id === segmentId);
                return total + getSegmentDistanceKm(segment, reference);
            }, 0) * 10) / 10,
            cost: Math.round(distances.get(toNodeId) * 1000) / 1000,
            algorithm: 'astar'
        });
    }

    return Object.freeze({
        ROAD_NETWORK_VERSION,
        MAP_ID,
        MAP_REFERENCE,
        ROAD_TYPES,
        ROAD_SOURCE,
        ROAD_NODES,
        ROAD_SEGMENTS,
        measurePolylinePixels,
        pixelsToKilometers,
        getSegmentDistanceKm,
        getNetworkSummary,
        getConnectedSegments,
        getNodeDegree,
        getJunctionNodes,
        findNodeByLocationId,
        findShortestRoute
    });
});
