(function (root, factory) {
    const model = root?.worldModel
        || (typeof require === 'function' ? require('./world-model.js') : null);
    const atlas = root?.worldAtlasData
        || (typeof require === 'function' ? require('./world-atlas-data.js') : null);
    const locations = root?.worldLocationData
        || (typeof require === 'function' ? require('./world-location-data.js') : null);
    const importedMarkers = root?.worldLocationImportedData
        || (typeof require === 'function' ? (() => {
            try { return require('./world-location-imported-data.js'); } catch (_error) { return null; }
        })() : null);
    const api = factory(model, atlas, locations, importedMarkers);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldCartographicData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (model, atlas, locations, importedMarkers) {
    'use strict';

    const CARTOGRAPHIC_CATALOG_VERSION = 7;
    const MAP_ID = 'nolan-kotulan-the-continent';
    const MAP_REFERENCE = Object.freeze({
        id: MAP_ID,
        title: 'The Continent',
        author: 'Nolan Kotulan',
        originalWidth: 2880,
        originalHeight: 4096,
        coordinateSystem: 'percent',
        note: 'Coordenadas auditadas em pixels sobre a imagem original fornecida para a campanha.'
    });
    const TYPES = Object.freeze({
        SETTLEMENT: 'settlement',
        FORTIFIED_SETTLEMENT: 'fortified-settlement',
        CASTLE: 'castle',
        FORT: 'fort',
        ISLAND: 'island',
        SPECIAL_SITE: 'special-site'
    });
    const CONFIDENCE = Object.freeze({
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    });
    const P = atlas.IDS;

    function point(x, y) {
        return Object.freeze({
            x: Math.min(100, Math.max(0, Number(x) || 0)),
            y: Math.min(100, Math.max(0, Number(y) || 0))
        });
    }

    function pixelPoint(x, y) {
        return point(
            Number(x) / MAP_REFERENCE.originalWidth * 100,
            Number(y) / MAP_REFERENCE.originalHeight * 100
        );
    }

    const IMPORTED_MARKER_COORDINATES = Object.freeze(Object.fromEntries(
        (Array.isArray(importedMarkers?.markers) ? importedMarkers.markers : [])
            .filter(marker => marker?.locationId && Number.isFinite(Number(marker?.point?.x)) && Number.isFinite(Number(marker?.point?.y)))
            .map(marker => [marker.locationId, pixelPoint(marker.point.x, marker.point.y)])
    ));

    function entry(id, name, parentId, x, y, options = {}) {
        const confidence = options.confidence || CONFIDENCE.HIGH;
        return Object.freeze({
            id: `world-cartographic-${id}`,
            type: model.LOCATION_TYPES.LOCATION,
            parentId,
            name,
            description: options.description
                || `${name} é um ponto identificado no mapa The Continent. Ainda não há informação canônica suficiente no catálogo para classificá-lo além da leitura cartográfica.`,
            origin: 'official',
            visibility: 'public',
            aliases: options.aliases || [],
            coordinates: pixelPoint(x, y),
            cartographicType: options.type || TYPES.SETTLEMENT,
            cartographicStatus: 'map-only',
            cartographicConfidence: confidence,
            coordinateConfidence: options.coordinateConfidence || (confidence === CONFIDENCE.HIGH ? 'approximate' : 'estimated'),
            cartographicVersion: CARTOGRAPHIC_CATALOG_VERSION,
            mapId: MAP_ID,
            sources: [],
            relations: []
        });
    }

    const CARTOGRAPHIC_LOCATIONS = Object.freeze([
        entry('tolna', 'Tolna', P.KOVIR_POVISS, 315, 130),
        entry('aed-gynvael', 'Aed Gynvael', P.KOVIR_POVISS, 485, 140),
        entry('rakverelin', 'Rakverelin', P.KOVIR_POVISS, 445, 225),
        entry('targo', 'Targo', P.KOVIR_POVISS, 590, 215),
        entry('tridam', 'Tridam', P.KOVIR_POVISS, 535, 405),
        entry('ynys-forhorn', 'Ynys Forhorn', P.KOVIR_POVISS, 400, 730, { type: TYPES.ISLAND }),
        entry('tancarville', 'Tancarville', P.HENGFORS, 1260, 315),
        entry('creigiau', 'Creigiau', P.HENGFORS, 1690, 150, { confidence: CONFIDENCE.LOW }),

        entry('baldfhorn', 'Baldfhorn', P.REDANIA, 1235, 675),
        entry('roggeveen', 'Roggeveen', P.REDANIA, 1095, 790),
        entry('duppa', 'Duppa', P.REDANIA, 1240, 775),
        entry('coppertown', 'Coppertown', P.REDANIA, 1420, 775),
        entry('guamet', 'Guamet', P.REDANIA, 1310, 875),
        entry('demelse', 'Demelse', P.REDANIA, 1205, 895),
        entry('laraggen', 'Laraggen', P.REDANIA, 1380, 950, { confidence: CONFIDENCE.MEDIUM }),
        entry('devils-ford', "Devil's Ford", P.REDANIA, 1490, 955, { type: TYPES.SPECIAL_SITE }),
        entry('murivel', 'Murivel', P.REDANIA, 1760, 790),
        entry('eregmont', 'Eregmont', P.REDANIA, 1845, 785),
        entry('hagge', 'Hagge', P.REDANIA, 2040, 820, { type: TYPES.FORTIFIED_SETTLEMENT, confidence: CONFIDENCE.MEDIUM }),
        entry('tindal', 'Tindal', P.REDANIA, 1450, 600, { confidence: CONFIDENCE.MEDIUM }),
        entry('esteken', 'Esteken', P.REDANIA, 1635, 500, { confidence: CONFIDENCE.LOW }),
        entry('gelibol', 'Gelibol', P.REDANIA, 1730, 575, { confidence: CONFIDENCE.MEDIUM }),
        entry('blayiven', 'Blayiven', P.REDANIA, 1310, 520, { confidence: CONFIDENCE.LOW }),
        entry('findal', 'Findal', P.REDANIA, 1480, 590, { confidence: CONFIDENCE.MEDIUM }),
        entry('knotgrass-meadow', 'Knotgrass Meadow', P.REDANIA, 1540, 702),
        entry('foam', 'Foam', P.REDANIA, 1313, 1026),
        entry('montecalvo', 'Montecalvo', P.REDANIA, 1802, 570),
        entry('luton', 'Luton', P.REDANIA, 1285, 460),
        entry('mint', 'Mint', P.REDANIA, 1675, 544),
        entry('yamurlak', 'Yamurlak', P.REDANIA, 1536, 514, { aliases: ['Jamurlak'] }),
        entry('yspaden', 'Yspaden', P.HENGFORS, 1173, 367, { confidence: CONFIDENCE.MEDIUM }),

        entry('daevon', 'Daevon', P.KAEDWEN, 2220, 410),
        entry('est-haemlet', 'Est Haemlet', P.KAEDWEN, 2720, 620),
        entry('vattweir', 'Vattweir', P.KAEDWEN, 2083.8, 373),
        entry('leyda', 'Leyda', P.KAEDWEN, 2182.4, 544.6),
        entry('beeches', 'Beeches', P.KAEDWEN, 1961, 599),
        entry('tiel', 'Tiel', P.KAEDWEN, 2454.5, 801.2),
        entry('kalkar', 'Kalkar', P.KAEDWEN, 2545.7, 792.1),
        entry('berg-aen-dal', 'Berg Aen Dal', P.KAEDWEN, 2650.7, 813.9),
        entry('blue-mountain-a', 'Blue Mountain A', P.KAEDWEN, 2844.6, 184.7, { type: TYPES.SPECIAL_SITE }),
        entry('blue-mountains-b', 'Blue Mountains B', P.KAEDWEN, 2845.2, 821.5, { type: TYPES.SPECIAL_SITE }),
        entry('dragon-mountains-a', 'Dragon Mountains A', P.KAEDWEN, 2388.1, 42.4, { type: TYPES.SPECIAL_SITE }),
        entry('ashberg', 'Ashberg', P.AEDIRN, 2115, 925),
        entry('hoshberg', 'Hoshberg', P.AEDIRN, 2559.3, 1091.9),
        entry('gwendeith', 'Gwendeith', P.AEDIRN, 2785.9, 1051.3),
        entry('luria', 'Luria', P.LYRIA_RIVIA, 2570, 1305),
        entry('dillmor', 'Dillmor', P.LYRIA_RIVIA, 2329.3, 1454),

        entry('flotsam', 'Flotsam', P.TEMERIA, 1920, 830, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('white-bridge', 'White Bridge', P.TEMERIA, 1840, 850, { aliases: ['Ponte Branca'] }),
        entry('bondar', 'Bondar', P.TEMERIA, 1730, 880),
        entry('la-valette', 'La Valette', P.TEMERIA, 1620, 945, { type: TYPES.CASTLE }),
        entry('dorndal', 'Dorndal', P.TEMERIA, 1775, 1015),
        entry('carreras', 'Carreras', P.TEMERIA, 1880, 1180),
        entry('burdorff', 'Burdorff', P.TEMERIA, 1715, 1215),
        entry('naypus', 'Naypus', P.TEMERIA, 1470, 1325),
        entry('cleves', 'Clèves', P.TEMERIA, 1665, 1365),
        entry('old-bottoms', 'Old Bottoms', P.TEMERIA, 1690, 1415, { aliases: ['Baixios Antigos'], confidence: CONFIDENCE.MEDIUM }),
        entry('brenna', 'Brenna', P.TEMERIA, 1650, 1450),
        entry('mayena', 'Mayena', P.TEMERIA, 1685, 1500, { confidence: CONFIDENCE.MEDIUM }),
        entry('razwan', 'Razwan', P.TEMERIA, 1770, 1495, { confidence: CONFIDENCE.MEDIUM }),
        entry('vidort', 'Vidort', P.TEMERIA, 1640, 1640, { confidence: CONFIDENCE.MEDIUM }),
        entry('burnt-stump', 'Burnt Stump', P.TEMERIA, 1535, 1635, { aliases: ['Toco Queimado'] }),
        entry('kernow', 'Kernow', P.TEMERIA, 1465, 1690),
        entry('dillingen', 'Dillingen', P.TEMERIA, 1555, 1680),
        entry('houtborg', 'Houtborg', P.TEMERIA, 1894, 965),
        entry('moen', 'Moen', P.TEMERIA, 1747, 946),
        entry('windley', 'Windley', P.TEMERIA, 1413, 1044),
        entry('chippira', 'Chippira', P.TEMERIA, 1427, 1093),
        entry('findetann', 'Findetann', P.TEMERIA, 1337, 1075),
        entry('acorn-bay', 'Acorn Bay', P.TEMERIA, 1249, 1099),
        entry('tegmond', 'Tegmond', P.TEMERIA, 1314, 1115),
        entry('anchor', 'Anchor', P.TEMERIA, 1290, 1196),
        entry('murky-waters', 'Murky Waters', P.TEMERIA, 1552, 1173),
        entry('zavada', 'Zavada', P.TEMERIA, 1824, 1322),
        entry('mortara', 'Mortara', P.TEMERIA, 1593, 1389),
        entry('vorune', 'Vorune', P.TEMERIA, 1490, 1380),
        entry('napeys', 'Napeys', P.TEMERIA, 1476, 1335),
        entry('petrelsteyn', 'Petrelsteyn', P.TEMERIA, 1385, 1326),
        entry('forest-cabin', 'Cabana na Floresta', P.TEMERIA, 1543, 1471, { type: TYPES.SPECIAL_SITE }),
        entry('three-florins-inn', 'Taverna 3 Florins', P.TEMERIA, 1616, 1478, { type: TYPES.SPECIAL_SITE }),
        entry('brugge-city', 'Brugge', 'world-political-temeria-brugge', 1614, 1567, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('armeria', 'Armeria', P.TEMERIA, 1706, 1570),
        entry('carcano', 'Carcano', P.TEMERIA, 1764, 1621),
        entry('dregsdon', 'Dregsdon', P.TEMERIA, 1968, 1528),
        entry('caed-dhu', 'Caed Dhu', P.TEMERIA, 2139, 1527, { type: TYPES.SPECIAL_SITE }),
        entry('red-port', 'Red Port', P.TEMERIA, 1920, 1625, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('groundcherry-forest', 'Groundcherry Forest', P.TEMERIA, 1874, 1535, { type: TYPES.SPECIAL_SITE }),
        entry('tukaj-hills', 'Tukaj Hills', P.TEMERIA, 1447.3, 1425.6, { type: TYPES.SPECIAL_SITE }),

        entry('cidaris-roggeveen', 'Roggeveen', 'world-political-cidaris', 985.2, 1307.8),
        entry('little-marsh', 'Little Marsh', 'world-political-cidaris', 1189, 1303, { type: TYPES.SPECIAL_SITE }),
        entry('caelf', 'Caelf', 'world-political-cidaris', 1125, 1273),
        entry('vole', 'Vole', 'world-political-cidaris', 1007.5, 1362.7),
        entry('ravelin', 'Ravelin', 'world-political-cidaris', 1072, 1365),
        entry('vartburg', 'Vartburg', 'world-political-cidaris', 1174, 1350, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('cizmar', 'Cizmar', 'world-political-kerack', 1259.3, 1388.1),
        entry('tiberghien', 'Tiberghien', 'world-political-kerack', 1090, 1460, { confidence: CONFIDENCE.MEDIUM }),
        entry('ansegis', 'Ansegis', 'world-political-kerack', 1210, 1460, { confidence: CONFIDENCE.MEDIUM }),
        entry('hamm', 'Hamm', 'world-political-verden', 1135, 1610),
        entry('nastrog', 'Nastrog', 'world-political-verden', 1235, 1710),
        entry('bodrog', 'Bodrog', 'world-political-verden', 1330, 1695),
        entry('rozrog', 'Rozrog', 'world-political-verden', 1280, 1720, { confidence: CONFIDENCE.MEDIUM }),

        entry('elven-ruin', 'Ruína Élfica', P.BROKILON, 1381.4, 1464.6, { type: TYPES.SPECIAL_SITE }),
        entry('craag-an', 'Craag An', P.BROKILON, 1309.6, 1464.2, { type: TYPES.SPECIAL_SITE }),
        entry('col-serrai', 'Col Serrai', P.BROKILON, 1495.3, 1518.6, { type: TYPES.SPECIAL_SITE }),

        entry('ban-blathanna', 'Ban Blathanna', P.DOL_BLATHANNA, 2609.2, 951.5, { type: TYPES.FORTIFIED_SETTLEMENT }),

        entry('coldwater', 'Coldwater', P.CINTRA, 1510, 1805, { aliases: ['Água Fria'] }),
        entry('smallton', 'Smallton', P.CINTRA, 1690, 1805),
        entry('hochbuz', 'Hochbuz', P.CINTRA, 1385, 1930),
        entry('tigg', 'Tigg', P.CINTRA, 1475, 1935, { type: TYPES.FORT }),
        entry('ortrogor', 'Ortrogor', P.CINTRA, 1615, 1895),
        entry('marnadal-stairs', 'Escadaria de Marnadal', P.CINTRA, 1530, 1995, { type: TYPES.SPECIAL_SITE }),

        entry('assengard', 'Assengard', 'world-political-nilfgaard-province-nazair', 1740, 2165, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('neunreuth', 'Neunreuth', 'world-political-nilfgaard-province-nazair', 1795, 2220),
        entry('tarn-mira', 'Tarn Mira', 'world-political-nilfgaard-province-nazair', 1740, 2340, { type: TYPES.SPECIAL_SITE }),
        entry('kagen', 'Kagen', 'world-political-temeria-riverdell', 1980, 1700, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('riedbrune', 'Riedbrune', 'world-political-nilfgaard-slopes', 2135, 1885, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('tergano', 'Tergano', 'world-political-nilfgaard-province-mag-turga', 1950, 2155),
        entry('caravista', 'Caravista', 'world-political-toussaint', 1980, 2295),
        entry('fox-hollow', 'Fox Hollow', 'world-political-toussaint', 2240, 2155),
        entry('belhaven', 'Belhaven', 'world-political-toussaint', 2170, 2000),
        entry('vedette', 'Vedette', 'world-political-toussaint', 2390, 2030, { type: TYPES.FORT }),
        entry('pomerol', 'Pomerol', 'world-political-toussaint', 2470, 2080, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('corvo', 'Corvo', 'world-political-toussaint', 2470, 2220),

        entry('foregham', 'Foregham', 'world-political-metinna', 1845, 2620),
        entry('tegamo', 'Tegamo', 'world-political-metinna', 1725, 2680),
        entry('fano', 'Fano', 'world-political-metinna', 1650, 2800),
        entry('claremont', 'Claremont', 'world-political-metinna', 1575, 2815),
        entry('loredo', 'Loredo', 'world-political-metinna', 2055, 2745),
        entry('amarillo', 'Amarillo', 'world-political-metinna', 2195, 2730),
        entry('druigh', 'Druigh', 'world-political-metinna', 2140, 2805),
        entry('tuffi', 'Tuffi', 'world-political-metinna', 2260, 2815),
        entry('fen-aspra', 'Fen Aspra', 'world-political-metinna', 2355, 2825),
        entry('new-forge', 'New Forge', 'world-political-nilfgaard-province-geso', 2385, 2550, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('sarda', 'Sarda', 'world-political-nilfgaard-province-geso', 2295, 2600, { type: TYPES.FORT }),
        entry('glyswen', 'Glyswen', 'world-political-nilfgaard-province-geso', 2360, 2765),
        entry('thurn', 'Thurn', 'world-political-maecht', 2045, 2845, { type: TYPES.FORTIFIED_SETTLEMENT }),

        entry('dun-daire', 'Dun Daire', 'world-political-ebbing', 1365, 2850),
        entry('unicorn', 'Unicorn', 'world-political-ebbing', 1425, 2815),
        entry('jealousy', 'Jealousy', 'world-political-ebbing', 1835, 2850),
        entry('mahoun', 'Mahoun', 'world-political-ebbing', 1780, 2885),
        entry('rocayne', 'Rocayne', 'world-political-ebbing', 1925, 2880),
        entry('tornerre', 'Tornerre', 'world-political-ebbing', 1450, 3100),
        entry('salm', 'Salm', 'world-political-ebbing', 1480, 3215),

        entry('maecht-city', 'Maecht', 'world-political-maecht', 2020, 3030, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('doano', 'Dudno', 'world-political-maecht', 2180, 3000, { aliases: ['Doano'] }),
        entry('gemmera-city', 'Gemmera', 'world-political-nilfgaard-province-gemmera', 1935, 3290),
        entry('tower-of-winds', 'Torre dos Ventos', 'world-political-nilfgaard-province-etolia', 1395, 3540, { type: TYPES.SPECIAL_SITE }),
        entry('darn-dyffra', 'Darn Dyffra', 'world-political-vicovaro', 2380, 3375, { type: TYPES.FORTIFIED_SETTLEMENT }),
        entry('dyffra', 'Dyffra', 'world-political-vicovaro', 2420, 3320),
        entry('loc-grim', 'Loc Grim', 'world-political-nilfgaard-core', 1880, 3635, { type: TYPES.FORT }),
        entry('darn-ruach', 'Darn Ruach', 'world-political-nilfgaard-core', 1945, 3685, { type: TYPES.FORTIFIED_SETTLEMENT })
    ]);

    // Pontos canônicos cuja posição é legível no mapa de referência. As coordenadas
    // continuam sendo cartográficas e aproximadas; o catálogo histórico permanece
    // independente delas.
    const CANONICAL_COORDINATES = Object.freeze({
        'world-canonical-vengerberg': pixelPoint(2340, 1175),
        'world-canonical-aldersberg': pixelPoint(2395, 1285),
        'world-canonical-gulet': pixelPoint(2385, 1035),
        'world-canonical-vergen': pixelPoint(2150, 840),
        'world-canonical-ard-carraigh': pixelPoint(2310, 365),
        'world-canonical-ban-ard': pixelPoint(2570, 600),
        'world-canonical-ban-glean': pixelPoint(2340, 750),
        'world-canonical-kaer-morhen': pixelPoint(2595, 250),
        'world-canonical-loc-muinne': pixelPoint(2640, 700),
        'world-canonical-shaerrawedd': pixelPoint(2220, 625),
        'world-canonical-tretogor': pixelPoint(1500, 810),
        'world-canonical-oxenfurt': pixelPoint(1250, 1020),
        'world-canonical-rinde': pixelPoint(1700, 845),
        'world-canonical-blaviken': pixelPoint(1310, 520),
        'world-canonical-drakenborg': pixelPoint(1740, 685),
        'world-canonical-novigrad': pixelPoint(1165, 1010),
        'world-canonical-vizima': pixelPoint(1610, 1110),
        'world-canonical-maribor': pixelPoint(1720, 1375),
        'world-canonical-gors-velen': pixelPoint(1250, 1240),
        'world-canonical-thanedd': pixelPoint(1185, 1220),
        'world-canonical-dorian': pixelPoint(1390, 1165),
        'world-canonical-ellander': pixelPoint(1850, 905),
        'world-canonical-white-orchard': pixelPoint(1670, 1160),
        'world-canonical-crows-perch': pixelPoint(1180, 1100),
        'world-canonical-sodden-hill': pixelPoint(1800, 1620),
        'world-canonical-lan-exeter': pixelPoint(780, 310),
        'world-canonical-pont-vanis': pixelPoint(815, 500),
        'world-canonical-hengfors-city': pixelPoint(1540, 385),
        'world-canonical-caingorn-city': pixelPoint(1640, 360),
        'world-canonical-barefield': pixelPoint(1850, 280),
        'world-canonical-creyden': pixelPoint(1410, 310),
        'world-canonical-lyria-city': pixelPoint(2570, 1305),
        'world-canonical-rivia-city': pixelPoint(2270, 1420),
        'world-canonical-spalla': pixelPoint(2580, 1390),
        'world-canonical-scala': pixelPoint(2485, 1410),
        'world-canonical-rastburg-castle': pixelPoint(2345, 1395),
        'world-canonical-cintra-city': pixelPoint(1280, 1795),
        'world-canonical-attre': pixelPoint(1280, 1980),
        'world-canonical-strept': pixelPoint(1600, 1990),
        'world-canonical-rhys-rhun': pixelPoint(1485, 2155),
        'world-canonical-cidaris-city': pixelPoint(1020, 1220),
        'world-canonical-bremervoord': pixelPoint(835, 1340),
        'world-canonical-kerack-city': pixelPoint(1110, 1380),
        'world-canonical-rissberg': pixelPoint(1290, 1335),
        'world-canonical-duen-canell': pixelPoint(1280, 1560),
        'world-canonical-lower-posada': pixelPoint(2680, 915),
        'world-canonical-upper-posada': pixelPoint(2590, 885),
        'world-canonical-mount-carbon': pixelPoint(1900, 1300),
        'world-canonical-nilfgaard-city': pixelPoint(1705, 3785),
        'world-canonical-metinna-city': pixelPoint(1670, 2550),
        'world-canonical-tor-zireael': pixelPoint(1710, 2270),
        'world-canonical-beauclair': pixelPoint(2390, 2155),
        'world-canonical-dun-tynne': pixelPoint(2380, 2070),
        'world-canonical-castel-ravello': pixelPoint(2280, 2170),
        'world-canonical-vicovaro-city': pixelPoint(2295, 3510),
        'world-canonical-viroleda': pixelPoint(2090, 3885),
        'world-canonical-baccala': pixelPoint(1610, 3720),
        'world-canonical-winneburg-castle': pixelPoint(1770, 4000),
        'world-canonical-stygga': pixelPoint(1760, 3170)
    });

    function seedCartographicLocations(world, options = {}) {
        const now = options.now || new Date().toISOString();
        const previousCatalogVersion = Math.max(0, Number(world?.cartographicCatalogVersion) || 0);
        const sourceById = new Map((Array.isArray(world?.locations) ? world.locations : []).map(location => [location.id, location]));
        const withCanonical = locations.seedCanonicalLocations(world, { now });
        const canonicalWithCoordinates = withCanonical.locations.map(location => {
            const importedCoordinate = IMPORTED_MARKER_COORDINATES[location.id];
            const catalogCoordinate = importedCoordinate || CANONICAL_COORDINATES[location.id];
            if (!catalogCoordinate) return location;
            const source = sourceById.get(location.id);
            const preserveCoordinate = Boolean(location.coordinates)
                && (previousCatalogVersion === CARTOGRAPHIC_CATALOG_VERSION
                    || source?.coordinateConfidence === 'precise'
                    || (previousCatalogVersion === 0 && source?.mapId !== MAP_ID));
            return model.normalizeLocation({
                ...location,
                coordinates: preserveCoordinate ? location.coordinates : catalogCoordinate,
                coordinateConfidence: preserveCoordinate
                    ? (source?.coordinateConfidence || location.coordinateConfidence || 'approximate')
                    : (importedCoordinate ? 'precise' : 'approximate'),
                mapId: preserveCoordinate ? (source?.mapId || location.mapId || MAP_ID) : MAP_ID,
                updatedAt: preserveCoordinate ? location.updatedAt : now
            }, { now });
        });
        const existingById = new Map(canonicalWithCoordinates.map(location => [location.id, location]));
        const catalogIds = new Set(CARTOGRAPHIC_LOCATIONS.map(location => location.id));
        const catalog = CARTOGRAPHIC_LOCATIONS.map(location => {
            const existing = existingById.get(location.id);
            const importedCoordinate = IMPORTED_MARKER_COORDINATES[location.id];
            const preserveCoordinate = Boolean(existing?.coordinates)
                && (existing?.coordinateConfidence === 'precise'
                    || existing?.cartographicVersion === CARTOGRAPHIC_CATALOG_VERSION);
            return model.normalizeLocation({
                ...location,
                coordinates: preserveCoordinate
                    ? existing.coordinates
                    : (importedCoordinate || location.coordinates),
                coordinateConfidence: preserveCoordinate
                    ? (existing.coordinateConfidence || location.coordinateConfidence)
                    : (importedCoordinate ? 'precise' : location.coordinateConfidence),
                createdAt: existing?.createdAt || now,
                updatedAt: existing && preserveCoordinate
                    ? existing.updatedAt
                    : now
            }, { now });
        });
        const retained = canonicalWithCoordinates.filter(location => !catalogIds.has(location.id));
        return model.normalizeWorld({
            ...withCanonical,
            cartographicCatalogVersion: CARTOGRAPHIC_CATALOG_VERSION,
            locations: [...retained, ...catalog],
            updatedAt: withCanonical.updatedAt || now
        }, { now });
    }

    function getCartographicLocations(world) {
        return model.normalizeWorld(world).locations.filter(location => location.cartographicStatus === 'map-only');
    }

    return Object.freeze({
        CARTOGRAPHIC_CATALOG_VERSION,
        MAP_ID,
        MAP_REFERENCE,
        TYPES,
        CONFIDENCE,
        IMPORTED_MARKER_COORDINATES,
        CANONICAL_COORDINATES,
        CARTOGRAPHIC_LOCATIONS,
        seedCartographicLocations,
        getCartographicLocations
    });
});
