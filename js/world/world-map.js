(function (root, factory) {
    const roads = root?.worldRoadData
        || (typeof require === 'function' ? require('./world-road-data.js') : null);
    const roadEditor = root?.worldRoadEditor
        || (typeof require === 'function' ? require('./world-road-editor.js') : null);
    const api = factory(root || {}, roads, roadEditor);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.worldMap = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, roads, roadEditor) {
    'use strict';

    const FALLBACK_REFERENCE = Object.freeze({
        id: 'nolan-kotulan-the-continent',
        title: 'The Continent',
        author: 'Nolan Kotulan',
        originalWidth: 2880,
        originalHeight: 4096,
        coordinateSystem: 'percent'
    });
    const BASE_LAYER = Object.freeze({
        type: 'tiles',
        fallbackImageUrl: 'img/maps/continent.png',
        tileManifestUrl: 'img/maps/continent/manifest.json',
        tileBaseUrl: 'img/maps/continent/tiles'
    });
    const FALLBACK_TILE_MANIFEST = Object.freeze({
        schemaVersion: 1,
        format: 'webp',
        tileSize: 256,
        originalWidth: 2880,
        originalHeight: 4096,
        minNativeZoom: -4,
        maxNativeZoom: 0,
        levels: Object.freeze([
            Object.freeze({ zoom: -4, directory: 'm4', width: 180, height: 256, columns: 1, rows: 1 }),
            Object.freeze({ zoom: -3, directory: 'm3', width: 360, height: 512, columns: 2, rows: 2 }),
            Object.freeze({ zoom: -2, directory: 'm2', width: 720, height: 1024, columns: 3, rows: 4 }),
            Object.freeze({ zoom: -1, directory: 'm1', width: 1440, height: 2048, columns: 6, rows: 8 }),
            Object.freeze({ zoom: 0, directory: '0', width: 2880, height: 4096, columns: 12, rows: 16 })
        ])
    });
    const EMPTY_TILE = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    const normalizedTileManifestCache = new WeakMap();
    const tileManifestRequestCache = new Map();

    let activeMap = null;
    let activeOverlay = null;
    let activeResizeObserver = null;
    let initialView = null;
    let rememberedView = null;
    let activeManifest = null;
    let initializationRevision = 0;
    let activeWorld = null;
    let activeRoadLayer = null;
    let activeJunctionLayer = null;
    let activeRoadEditorLayer = null;
    let activeMarkerLayer = null;
    let activeRouteLayer = null;
    let activeRoutePreviewPointCount = 0;
    let activeMarkers = new Map();
    let activeRoads = new Map();
    let activePlayerMode = false;
    let roadsVisible = true;
    let roadMarkersVisible = true;
    let activeRoadNetwork = null;
    let roadEditorState = {
        open: false,
        collapsed: false,
        mode: null,
        segmentId: null,
        selectedPointIndex: -1,
        workingPoints: []
    };
    let mapFilters = {
        query: '',
        type: 'all',
        layer: 'all',
        confidence: 'all',
        regionId: 'all'
    };

    function getReference() {
        return root.worldCartographicData?.MAP_REFERENCE || FALLBACK_REFERENCE;
    }

    function getActiveRoadNetwork() {
        if (!activeRoadNetwork) {
            activeRoadNetwork = roadEditor?.loadNetwork?.(root.localStorage)
                || { source: 'catalog', nodes: roads?.ROAD_NODES || [], segments: roads?.ROAD_SEGMENTS || [] };
        }
        return activeRoadNetwork;
    }

    function getDistanceReference(world = activeWorld) {
        return { ...(roads?.MAP_REFERENCE || {}), ...(world?.mapSettings || {}) };
    }

    function clampPercent(value) {
        return Math.min(100, Math.max(0, Number(value) || 0));
    }

    function percentToMapCoordinate(coordinates, reference = getReference()) {
        if (!coordinates || !Number.isFinite(Number(coordinates.x)) || !Number.isFinite(Number(coordinates.y))) return null;
        const width = Math.max(1, Number(reference.originalWidth) || FALLBACK_REFERENCE.originalWidth);
        const height = Math.max(1, Number(reference.originalHeight) || FALLBACK_REFERENCE.originalHeight);
        const x = width * clampPercent(coordinates.x) / 100;
        const yFromTop = height * clampPercent(coordinates.y) / 100;
        return Object.freeze({ lat: height - yFromTop, lng: x });
    }

    function mapCoordinateToPercent(coordinate, reference = getReference()) {
        if (!coordinate || !Number.isFinite(Number(coordinate.lat)) || !Number.isFinite(Number(coordinate.lng))) return null;
        const width = Math.max(1, Number(reference.originalWidth) || FALLBACK_REFERENCE.originalWidth);
        const height = Math.max(1, Number(reference.originalHeight) || FALLBACK_REFERENCE.originalHeight);
        return Object.freeze({
            x: clampPercent(Number(coordinate.lng) / width * 100),
            y: clampPercent((height - Number(coordinate.lat)) / height * 100)
        });
    }

    function pixelToMapCoordinate(point, reference = getReference()) {
        if (!point || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) return null;
        const width = Math.max(1, Number(reference.originalWidth) || FALLBACK_REFERENCE.originalWidth);
        const height = Math.max(1, Number(reference.originalHeight) || FALLBACK_REFERENCE.originalHeight);
        return Object.freeze({
            lat: height - Math.min(height, Math.max(0, Number(point.y))),
            lng: Math.min(width, Math.max(0, Number(point.x)))
        });
    }

    function getMappableLocations(world, options = {}) {
        return (Array.isArray(world?.locations) ? world.locations : []).filter(location =>
            location?.coordinates
            && Number.isFinite(Number(location.coordinates.x))
            && Number.isFinite(Number(location.coordinates.y))
            && (options.includePrivate === true || location.visibility !== 'private'));
    }

    function normalizeSearch(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
    }

    function getLocationPath(world, locationId) {
        const locations = Array.isArray(world?.locations) ? world.locations : [];
        const byId = new Map(locations.map(location => [location.id, location]));
        const path = [];
        const visited = new Set();
        let current = byId.get(locationId);
        while (current && !visited.has(current.id)) {
            visited.add(current.id);
            path.unshift(current);
            current = current.parentId ? byId.get(current.parentId) : null;
        }
        return path;
    }

    function getLocationScopeIds(world, locationId) {
        const locations = Array.isArray(world?.locations) ? world.locations : [];
        return new Set(locations
            .filter(location => getLocationPath(world, location.id).some(entry => entry.id === locationId))
            .map(location => location.id));
    }

    function getLocationContext(world, locationId, options = {}) {
        const includePrivate = options.includePrivate === true;
        const scopeIds = getLocationScopeIds(world, locationId);
        const selectedPathIds = new Set(getLocationPath(world, locationId).map(entry => entry.id));
        const npcs = (Array.isArray(world?.npcs) ? world.npcs : []).filter(npc =>
            (includePrivate || npc.visibility !== 'private') && scopeIds.has(npc.currentLocationId));
        const merchants = npcs.filter(npc => npc.merchant?.enabled);
        const events = (Array.isArray(world?.regionalEvents) ? world.regionalEvents : []).filter(event => {
            if ((!includePrivate && event.visibility === 'private') || event.enabled === false) return false;
            return !event.locationId || selectedPathIds.has(event.locationId) || scopeIds.has(event.locationId);
        });
        return Object.freeze({ npcs, merchants, events });
    }

    function getLocationLayer(location) {
        if (location?.origin === 'custom') return 'custom';
        if (location?.cartographicStatus === 'map-only') return 'cartographic';
        return 'canonical';
    }

    function getLocationType(location) {
        return String(location?.cartographicType || location?.canonicalType || location?.customType || location?.politicalType || 'location');
    }

    function getLocationTypeLabel(type) {
        return ({
            settlement: 'Assentamento',
            'fortified-settlement': 'Assentamento fortificado',
            castle: 'Castelo',
            fort: 'Fortaleza',
            island: 'Ilha',
            'special-site': 'Ponto especial',
            capital: 'Capital',
            city: 'Cidade',
            town: 'Vila',
            village: 'Vilarejo',
            academy: 'Academia',
            ruin: 'Ruína',
            custom: 'Personalizado',
            location: 'Local'
        })[type] || String(type).replaceAll('-', ' ');
    }

    function getLayerLabel(layer) {
        return ({ canonical: 'Canônico', cartographic: 'Somente no mapa', custom: 'Da campanha' })[layer] || 'Local';
    }

    function getConfidenceLabel(confidence) {
        return ({ high: 'Alta', medium: 'Média', low: 'Baixa' })[confidence] || 'Não informada';
    }

    function getLocationRegion(world, location) {
        const path = getLocationPath(world, location?.id);
        return path.find((entry, index) => index > 0 && (entry.type === 'realm' || entry.politicalType)) || path[1] || null;
    }

    function getMapRegions(world, locations = getMappableLocations(world)) {
        const counts = new Map();
        locations.forEach(location => {
            const region = getLocationRegion(world, location);
            if (!region) return;
            const current = counts.get(region.id) || { id: region.id, name: region.name, count: 0 };
            current.count += 1;
            counts.set(region.id, current);
        });
        return [...counts.values()].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
    }

    function filterMappableLocations(world, filters = mapFilters, options = {}) {
        const query = normalizeSearch(filters.query);
        return getMappableLocations(world, options).filter(location => {
            const layer = getLocationLayer(location);
            const type = getLocationType(location);
            const path = getLocationPath(world, location.id);
            if (filters.layer !== 'all' && layer !== filters.layer) return false;
            if (filters.type !== 'all' && type !== filters.type) return false;
            if (filters.confidence !== 'all' && location.cartographicConfidence !== filters.confidence) return false;
            if (filters.regionId !== 'all' && !path.some(entry => entry.id === filters.regionId)) return false;
            if (!query) return true;
            return normalizeSearch([
                location.name,
                ...(location.aliases || []),
                location.description,
                ...path.map(entry => entry.name)
            ].join(' ')).includes(query);
        });
    }

    function normalizeTileManifest(value) {
        if (!value || !Array.isArray(value.levels) || !value.levels.length) return FALLBACK_TILE_MANIFEST;
        const cached = typeof value === 'object' ? normalizedTileManifestCache.get(value) : null;
        if (cached) return cached;
        const levels = value.levels.map(level => ({
            zoom: Number(level.zoom),
            directory: String(level.directory || ''),
            width: Math.max(1, Number(level.width) || 1),
            height: Math.max(1, Number(level.height) || 1),
            columns: Math.max(1, Number(level.columns) || 1),
            rows: Math.max(1, Number(level.rows) || 1)
        })).filter(level => Number.isInteger(level.zoom) && level.directory);
        if (!levels.length) return FALLBACK_TILE_MANIFEST;
        const normalized = {
            schemaVersion: Math.max(1, Number(value.schemaVersion) || 1),
            format: String(value.format || 'webp'),
            tileSize: Math.max(1, Number(value.tileSize) || 256),
            originalWidth: Math.max(1, Number(value.originalWidth) || FALLBACK_REFERENCE.originalWidth),
            originalHeight: Math.max(1, Number(value.originalHeight) || FALLBACK_REFERENCE.originalHeight),
            minNativeZoom: Math.min(...levels.map(level => level.zoom)),
            maxNativeZoom: Math.max(...levels.map(level => level.zoom)),
            levels
        };
        normalizedTileManifestCache.set(value, normalized);
        normalizedTileManifestCache.set(normalized, normalized);
        return normalized;
    }

    async function loadTileManifest(url = BASE_LAYER.tileManifestUrl) {
        if (typeof root.fetch !== 'function') return FALLBACK_TILE_MANIFEST;
        const cacheKey = String(url || BASE_LAYER.tileManifestUrl);
        if (tileManifestRequestCache.has(cacheKey)) return tileManifestRequestCache.get(cacheKey);
        const request = root.fetch(cacheKey, { cache: 'force-cache' })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(normalizeTileManifest)
            .catch(error => {
                tileManifestRequestCache.delete(cacheKey);
                console.warn('Manifesto do mapa indisponível; usando configuração local segura.', error);
                return FALLBACK_TILE_MANIFEST;
            });
        tileManifestRequestCache.set(cacheKey, request);
        return request;
    }

    function getTileSourceCoordinate(tileCoordinate, manifest = FALLBACK_TILE_MANIFEST) {
        const normalized = normalizeTileManifest(manifest);
        const level = normalized.levels.find(candidate => candidate.zoom === Number(tileCoordinate?.z));
        if (!level) return null;
        const x = Number(tileCoordinate?.x);
        const y = Number(tileCoordinate?.y) + level.rows;
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= level.columns || y < 0 || y >= level.rows) return null;
        return Object.freeze({ directory: level.directory, x, y });
    }

    function buildTileUrl(tileCoordinate, manifest = FALLBACK_TILE_MANIFEST, baseUrl = BASE_LAYER.tileBaseUrl) {
        const normalized = normalizeTileManifest(manifest);
        const source = getTileSourceCoordinate(tileCoordinate, normalized);
        if (!source) return EMPTY_TILE;
        return `${String(baseUrl).replace(/\/$/, '')}/${source.directory}/${source.x}/${source.y}.${normalized.format}`;
    }

    function escapeHtml(value) {
        if (typeof root.escapeHtml === 'function') return root.escapeHtml(value);
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function renderRoadEditorPanel() {
        return `<aside id="worldRoadEditor" class="world-road-editor-panel" hidden aria-label="Editor de estradas">
            <div class="world-road-editor-heading">
                <div><small>FERRAMENTA DO MESTRE</small><strong>Editor de estradas</strong><span id="worldRoadEditorCompactStatus"></span></div>
                <div class="world-road-editor-heading-actions">
                    <button id="worldRoadEditorCollapse" type="button" onclick="worldMap.toggleRoadEditorCollapsed()" aria-label="Recolher editor" aria-expanded="true" title="Recolher editor">−</button>
                    <button type="button" onclick="worldMap.toggleRoadEditor(false)" aria-label="Fechar editor">×</button>
                </div>
            </div>
            <p class="world-road-editor-intro">Ajuste a rede sobre o próprio mapa. Toque em um trecho para editá-lo ou crie um caminho ponto a ponto.</p>
            <div id="worldRoadEditorSummary" class="world-road-editor-summary"></div>
            <label class="world-road-editor-field"><span>Trecho existente</span><select id="worldRoadEditorSegmentSelect" onchange="worldMap.selectRoadSegment(this.value)"></select></label>
            <div class="world-road-editor-actions two">
                <button type="button" onclick="worldMap.startEditingRoadSegment()">✎ Editar trecho</button>
                <button type="button" class="primary" onclick="worldMap.startNewRoadSegment()">＋ Novo trecho</button>
            </div>
            <section id="worldRoadEditorForm" class="world-road-editor-form" hidden>
                <div class="world-road-editor-form-heading"><strong id="worldRoadEditorFormTitle">Trecho</strong><small id="worldRoadEditorPointCount"></small></div>
                <label class="world-road-editor-field"><span>Nome</span><input id="worldRoadEditorName" maxlength="180" placeholder="Nome da estrada"></label>
                <div class="world-road-editor-grid">
                    <label class="world-road-editor-field"><span>Tipo</span><select id="worldRoadEditorType"><option value="main">Principal</option><option value="regional">Regional</option><option value="mountain">Passagem de montanha</option></select></label>
                    <label class="world-road-editor-check"><input id="worldRoadEditorCarriage" type="checkbox" checked><span>Permitir carruagem</span></label>
                </div>
                <p id="worldRoadEditorHelp" class="world-road-editor-help"></p>
                <div class="world-road-editor-actions two">
                    <button type="button" onclick="worldMap.removeSelectedRoadPoint()">− Remover ponto</button>
                    <button type="button" class="danger" onclick="worldMap.deleteSelectedRoadSegment()">Excluir trecho</button>
                </div>
                <div class="world-road-editor-actions two">
                    <button type="button" onclick="worldMap.cancelRoadEditing()">Cancelar</button>
                    <button type="button" class="primary" onclick="worldMap.saveRoadEditorSegment()">Salvar trecho</button>
                </div>
            </section>
            <div id="worldRoadEditorMessage" class="world-road-editor-message" role="status"></div>
            <div class="world-road-editor-tools">
                <button id="worldRoadEditorMarkerToggle" type="button" onclick="worldMap.toggleRoadEditorMarkers()">◉ Ocultar locais</button>
                <button type="button" onclick="worldMap.exportRoadNetwork()">⇩ Exportar JSON</button>
                <button type="button" onclick="worldMap.triggerRoadNetworkImport()">⇧ Importar JSON</button>
                <button type="button" class="danger" onclick="worldMap.restoreRoadNetworkCatalog()">↺ Restaurar catálogo</button>
            </div>
            <input id="worldRoadEditorFileInput" type="file" accept="application/json,.json" hidden onchange="worldMap.importRoadNetworkFile(event)">
        </aside>`;
    }

    function renderView(world, options = {}) {
        const reference = getReference();
        const includePrivate = options.playerMode !== true;
        const mappableLocations = getMappableLocations(world, { includePrivate });
        const mappableCount = mappableLocations.length;
        const roadNetwork = getActiveRoadNetwork();
        const mapSettings = root.worldModel?.normalizeMapSettings?.(world?.mapSettings)
            || { pixelsPerGrid: 576, kilometersPerGrid: 100 };
        const roadSummary = roads?.getNetworkSummary?.(roadNetwork.segments, roadNetwork.nodes, getDistanceReference(world)) || { segmentCount: 0, junctionCount: 0, distanceKm: 0 };
        const regions = getMapRegions(world, mappableLocations);
        const types = [...new Set(mappableLocations.map(getLocationType))]
            .sort((left, right) => getLocationTypeLabel(left).localeCompare(getLocationTypeLabel(right), 'pt-BR'));
        if (mapFilters.regionId !== 'all' && !regions.some(region => region.id === mapFilters.regionId)) mapFilters.regionId = 'all';
        if (mapFilters.type !== 'all' && !types.includes(mapFilters.type)) mapFilters.type = 'all';
        return `
            <section class="world-map-panel" aria-label="Mapa visual do Continente">
                <div class="world-map-toolbar">
                    <div>
                        <small>MAPA VISUAL INTERATIVO</small>
                        <strong>${escapeHtml(reference.title)}</strong>
                        <span>${mappableCount} locais · ${roadSummary.segmentCount} trechos · ${roadSummary.distanceKm.toLocaleString('pt-BR')} km vetorizados.</span>
                    </div>
                    <div class="world-map-controls" aria-label="Controles do mapa">
                        <button id="worldMapFilterToggle" type="button" onclick="worldMap.toggleFilters()" aria-label="Abrir filtros do mapa" aria-expanded="false" title="Filtros do mapa">⌕</button>
                        <button id="worldMapRoadToggle" class="world-map-road-toggle${roadsVisible ? ' active' : ''}" type="button" onclick="worldMap.toggleRoads()" aria-label="${roadsVisible ? 'Ocultar' : 'Exibir'} rede de estradas" aria-pressed="${roadsVisible}" title="${roadsVisible ? 'Ocultar' : 'Exibir'} estradas">⌁</button>
                        ${options.playerMode === true ? '' : '<button id="worldMapRoadEditorToggle" type="button" onclick="worldMap.toggleRoadEditor()" aria-label="Editar rede de estradas" aria-expanded="false" title="Editor de estradas">✎</button>'}
                        <button type="button" onclick="worldMap.zoomOut()" aria-label="Diminuir zoom" title="Diminuir zoom">−</button>
                        <button type="button" onclick="worldMap.resetView()" aria-label="Mostrar mapa completo" title="Mostrar mapa completo">⌂</button>
                        <button type="button" onclick="worldMap.zoomIn()" aria-label="Aumentar zoom" title="Aumentar zoom">+</button>
                    </div>
                </div>
                <div class="world-map-stage">
                    <div id="worldInteractiveMap" class="world-interactive-map" data-allow-map-zoom role="application" aria-label="Mapa navegável do Continente"></div>
                    <aside id="worldMapFilters" class="world-map-filter-panel" hidden aria-label="Filtros dos marcadores">
                        <div class="world-map-filter-heading">
                            <div><small>EXPLORAR O CONTINENTE</small><strong>Marcadores e regiões</strong></div>
                            <button type="button" onclick="worldMap.toggleFilters(false)" aria-label="Fechar filtros">×</button>
                        </div>
                        <label><span>Buscar local</span><input id="worldMapSearch" type="search" placeholder="Nome, descrição ou território" value="${escapeHtml(mapFilters.query)}" oninput="worldMap.applyFilters()"></label>
                        <div class="world-map-filter-grid">
                            <label><span>Reino ou região</span><select id="worldMapRegionFilter" onchange="worldMap.applyFilters()"><option value="all">Todos</option>${regions.map(region => `<option value="${escapeHtml(region.id)}"${mapFilters.regionId === region.id ? ' selected' : ''}>${escapeHtml(region.name)} · ${region.count}</option>`).join('')}</select></label>
                            <label><span>Tipo</span><select id="worldMapTypeFilter" onchange="worldMap.applyFilters()"><option value="all">Todos</option>${types.map(type => `<option value="${escapeHtml(type)}"${mapFilters.type === type ? ' selected' : ''}>${escapeHtml(getLocationTypeLabel(type))}</option>`).join('')}</select></label>
                            <label><span>Camada</span><select id="worldMapLayerFilter" onchange="worldMap.applyFilters()"><option value="all">Todas</option><option value="canonical"${mapFilters.layer === 'canonical' ? ' selected' : ''}>Canônicos</option><option value="cartographic"${mapFilters.layer === 'cartographic' ? ' selected' : ''}>Somente no mapa</option><option value="custom"${mapFilters.layer === 'custom' ? ' selected' : ''}>Da campanha</option></select></label>
                            <label><span>Confiabilidade</span><select id="worldMapConfidenceFilter" onchange="worldMap.applyFilters()"><option value="all">Todas</option><option value="high"${mapFilters.confidence === 'high' ? ' selected' : ''}>Alta</option><option value="medium"${mapFilters.confidence === 'medium' ? ' selected' : ''}>Média</option><option value="low"${mapFilters.confidence === 'low' ? ' selected' : ''}>Baixa</option></select></label>
                        </div>
                        <div class="world-map-road-summary"><span aria-hidden="true">⌁</span><div><strong>Rede de estradas</strong><small>${roadSummary.segmentCount} trechos conectados · ${roadSummary.junctionCount} entroncamentos · ${mapSettings.kilometersPerGrid.toLocaleString('pt-BR')} km por quadrícula</small></div></div>
                        ${options.playerMode === true ? '' : `<section class="world-map-scale-settings"><div><strong>Calibração de distância</strong><small>Ajusta todas as distâncias e durações sem redesenhar as estradas.</small></div><label><span>km por quadrícula</span><input id="worldMapKilometersPerGrid" type="number" min="1" max="5000" step="0.1" inputmode="decimal" value="${mapSettings.kilometersPerGrid}"></label><button type="button" onclick="worldMap.saveMapScale()">Salvar escala</button></section>`}
                        <div class="world-map-filter-actions"><button type="button" onclick="worldMap.resetFilters()">Limpar</button><button type="button" class="primary" onclick="worldMap.fitFilteredMarkers()">Enquadrar resultados</button></div>
                    </aside>
                    ${options.playerMode === true ? '' : renderRoadEditorPanel()}
                    <div id="worldMapMarkerStatus" class="world-map-marker-status"><strong>${mappableCount}</strong> locais visíveis</div>
                </div>
                <div class="world-map-footer">
                    <span><i class="world-map-legend-dot canonical"></i> Canônico · <i class="world-map-legend-dot cartographic"></i> Cartográfico · <i class="world-map-legend-dot custom"></i> Campanha · <i class="world-map-legend-road"></i> Estrada</span>
                    <span>Mapa: ${escapeHtml(reference.author)} · Exploração 11.5</span>
                </div>
            </section>`;
    }

    function getMarkerStyle(location, isCurrent = false) {
        const layer = getLocationLayer(location);
        const palette = {
            canonical: { color: '#22d3ee', fillColor: '#0891b2' },
            cartographic: { color: '#fbbf24', fillColor: '#d97706' },
            custom: { color: '#c084fc', fillColor: '#7e22ce' }
        }[layer] || { color: '#cbd5e1', fillColor: '#475569' };
        return {
            ...palette,
            radius: isCurrent ? 9 : 6,
            weight: isCurrent ? 4 : 2,
            opacity: 1,
            fillOpacity: isCurrent ? 1 : 0.86,
            className: `world-location-marker ${layer}${isCurrent ? ' current' : ''}`
        };
    }

    function getRoadTypeLabel(type) {
        return ({ main: 'Estrada principal', regional: 'Estrada regional', mountain: 'Passagem de montanha' })[type] || 'Estrada';
    }

    function formatRoadDistance(distanceKm) {
        return `${Math.round(Number(distanceKm) || 0).toLocaleString('pt-BR')} km`;
    }

    function formatRouteDistance(distanceKm) {
        return `${Math.max(0, Number(distanceKm) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
    }

    function calculateRoadDistance(fromLocationId, toLocationId, network = getActiveRoadNetwork(), reference = getDistanceReference()) {
        const fromId = String(fromLocationId || '');
        const toId = String(toLocationId || '');
        if (!fromId || !toId) return Object.freeze({ ok: false, reason: 'missing-location' });
        if (fromId === toId) return Object.freeze({ ok: true, distanceKm: 0, nodeIds: Object.freeze([]), segmentIds: Object.freeze([]) });

        const nodes = Array.isArray(network?.nodes) ? network.nodes : [];
        const segments = Array.isArray(network?.segments) ? network.segments : [];
        const origins = nodes.filter(node => String(node.locationId || '') === fromId);
        const destinations = nodes.filter(node => String(node.locationId || '') === toId);
        if (!origins.length || !destinations.length) {
            return Object.freeze({
                ok: false,
                reason: !origins.length ? 'origin-not-on-road' : 'destination-not-on-road'
            });
        }

        const routes = [];
        origins.forEach(origin => destinations.forEach(destination => {
            const route = roads?.findShortestRoute?.(origin.id, destination.id, { nodes, segments, reference });
            if (route) routes.push(route);
        }));
        if (!routes.length) return Object.freeze({ ok: false, reason: 'disconnected' });

        const best = routes.sort((left, right) => Number(left.distanceKm) - Number(right.distanceKm))[0];
        return Object.freeze({
            ok: true,
            distanceKm: Math.round((Number(best.distanceKm) || 0) * 10) / 10,
            nodeIds: Object.freeze([...(best.nodeIds || [])]),
            segmentIds: Object.freeze([...(best.segmentIds || [])])
        });
    }

    function renderRoadPopup(segment) {
        const distance = roads?.getSegmentDistanceKm?.(segment, getDistanceReference()) || 0;
        const network = getActiveRoadNetwork();
        const from = network.nodes.find(node => node.id === segment.fromNodeId);
        const to = network.nodes.find(node => node.id === segment.toNodeId);
        return `<article class="world-map-popup world-road-popup">
            <small>REDE VIÁRIA VETORIZADA</small>
            <strong>${escapeHtml(segment.name)}</strong>
            <span>${escapeHtml(getRoadTypeLabel(segment.type))}</span>
            <div class="world-road-popup-route"><b>${escapeHtml(from?.name || 'Origem')}</b><i aria-hidden="true">→</i><b>${escapeHtml(to?.name || 'Destino')}</b></div>
            <div class="world-map-popup-meta"><b>${escapeHtml(formatRoadDistance(distance))}</b><em>${segment.carriageAllowed ? 'Disponível para carruagens' : 'Somente a pé ou a cavalo'}</em></div>
        </article>`;
    }

    function getRoadStyle(segment) {
        const mountain = segment.type === roads?.ROAD_TYPES?.MOUNTAIN;
        const regional = segment.type === roads?.ROAD_TYPES?.REGIONAL;
        return {
            pane: 'worldRoadPane',
            color: mountain ? '#fda4af' : (regional ? '#fde68a' : '#fbbf24'),
            weight: mountain ? 2.3 : (regional ? 2.1 : 2.7),
            opacity: mountain ? 0.82 : 0.88,
            dashArray: mountain ? '3 7' : (regional ? '5 7' : '9 7'),
            lineCap: 'round',
            lineJoin: 'round',
            interactive: true,
            className: `world-road-segment ${segment.type}`
        };
    }

    function refreshRoadLayer() {
        if (!activeMap || !activeRoadLayer || !activeJunctionLayer || !roads) return [];
        activeRoadLayer.clearLayers();
        activeJunctionLayer.clearLayers();
        activeRoads = new Map();
        if (!roadsVisible) return [];
        const network = getActiveRoadNetwork();

        network.segments.forEach(segment => {
            const coordinates = segment.points.map(point => pixelToMapCoordinate(point)).filter(Boolean);
            if (coordinates.length < 2) return;
            const line = root.L.polyline(coordinates.map(point => [point.lat, point.lng]), getRoadStyle(segment));
            const distance = roads.getSegmentDistanceKm(segment, getDistanceReference());
            line.bindTooltip(`${escapeHtml(segment.name)} · ${escapeHtml(formatRoadDistance(distance))}`, { sticky: true, opacity: 0.96 });
            line.bindPopup(renderRoadPopup(segment), { className: 'world-map-popup-shell world-road-popup-shell', maxWidth: 300, minWidth: 220 });
            line.on('click', () => {
                if (roadEditorState.open) selectRoadSegment(segment.id, { focus: false });
            });
            line.addTo(activeRoadLayer);
            activeRoads.set(segment.id, line);
        });

        roads.getJunctionNodes(network.segments, network.nodes).forEach(node => {
            const coordinate = pixelToMapCoordinate(node.point);
            if (!coordinate) return;
            const degree = roads.getNodeDegree(node.id, network.segments);
            const marker = root.L.circleMarker([coordinate.lat, coordinate.lng], {
                pane: 'worldJunctionPane',
                radius: 3.2,
                weight: 1.5,
                color: '#fff7cc',
                fillColor: '#b45309',
                fillOpacity: 0.95,
                className: 'world-road-junction'
            });
            marker.bindTooltip(`${escapeHtml(node.name)} · ${degree} caminhos`, { direction: 'top', offset: [0, -4], opacity: 0.96 });
            marker.addTo(activeJunctionLayer);
        });
        return [...activeRoads.keys()];
    }

    function updateRoadToggle() {
        const toggle = root.document?.getElementById?.('worldMapRoadToggle');
        if (!toggle) return;
        toggle.classList.toggle('active', roadsVisible);
        toggle.setAttribute('aria-pressed', String(roadsVisible));
        toggle.setAttribute('aria-label', roadsVisible ? 'Ocultar rede de estradas' : 'Exibir rede de estradas');
        toggle.title = roadsVisible ? 'Ocultar estradas' : 'Exibir estradas';
    }

    function toggleRoads(force) {
        roadsVisible = typeof force === 'boolean' ? force : !roadsVisible;
        refreshRoadLayer();
        updateRoadToggle();
        return roadsVisible;
    }

    function mapCoordinateToPixel(coordinate, reference = getReference()) {
        if (!coordinate || !Number.isFinite(Number(coordinate.lat)) || !Number.isFinite(Number(coordinate.lng))) return null;
        const width = Math.max(1, Number(reference.originalWidth) || FALLBACK_REFERENCE.originalWidth);
        const height = Math.max(1, Number(reference.originalHeight) || FALLBACK_REFERENCE.originalHeight);
        return {
            x: Math.round(Math.min(width, Math.max(0, Number(coordinate.lng))) * 10) / 10,
            y: Math.round(Math.min(height, Math.max(0, height - Number(coordinate.lat))) * 10) / 10
        };
    }

    function clonePoints(points) {
        return (Array.isArray(points) ? points : []).map(point => ({ x: Number(point.x), y: Number(point.y) }));
    }

    function getRoadEditorSegment() {
        return getActiveRoadNetwork().segments.find(segment => segment.id === roadEditorState.segmentId) || null;
    }

    function setRoadEditorMessage(message = '', tone = '') {
        const element = root.document?.getElementById?.('worldRoadEditorMessage');
        if (!element) return;
        element.textContent = message;
        element.dataset.tone = tone;
        element.hidden = !message;
    }

    function refreshRoadEditorPanel() {
        const panel = root.document?.getElementById?.('worldRoadEditor');
        if (!panel) return;
        const network = getActiveRoadNetwork();
        const summary = roads.getNetworkSummary(network.segments, network.nodes, getDistanceReference());
        const summaryElement = root.document.getElementById('worldRoadEditorSummary');
        if (summaryElement) summaryElement.innerHTML = `<strong>${summary.segmentCount} trechos · ${summary.junctionCount} entroncamentos</strong><span>${network.source === 'manual' ? 'Rede personalizada salva neste dispositivo' : 'Catálogo original em uso'}</span>`;

        const select = root.document.getElementById('worldRoadEditorSegmentSelect');
        if (select) {
            const selected = roadEditorState.segmentId;
            select.innerHTML = `<option value="">Selecione um trecho</option>${network.segments
                .slice().sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
                .map(segment => `<option value="${escapeHtml(segment.id)}"${segment.id === selected ? ' selected' : ''}>${escapeHtml(segment.name)}</option>`).join('')}`;
        }

        const form = root.document.getElementById('worldRoadEditorForm');
        if (form) form.hidden = !roadEditorState.mode;
        const count = root.document.getElementById('worldRoadEditorPointCount');
        if (count) count.textContent = `${roadEditorState.workingPoints.length} ${roadEditorState.workingPoints.length === 1 ? 'ponto' : 'pontos'}`;
        const title = root.document.getElementById('worldRoadEditorFormTitle');
        if (title) title.textContent = roadEditorState.mode === 'new' ? 'Novo trecho' : 'Corrigir trecho';
        const help = root.document.getElementById('worldRoadEditorHelp');
        if (help) help.textContent = roadEditorState.mode === 'new'
            ? 'Toque no mapa para marcar o caminho na ordem da viagem. Arraste qualquer ponto para ajustar.'
            : 'Toque sobre a linha para inserir um ponto. Arraste os pontos numerados; as extremidades compartilhadas movem os caminhos conectados.';
        const markerToggle = root.document.getElementById('worldRoadEditorMarkerToggle');
        if (markerToggle) markerToggle.textContent = roadMarkersVisible ? '◉ Ocultar locais' : '◉ Exibir locais';
        const compactStatus = root.document.getElementById('worldRoadEditorCompactStatus');
        if (compactStatus) compactStatus.textContent = roadEditorState.mode
            ? `${roadEditorState.mode === 'new' ? 'Novo trecho' : 'Correção'} · ${roadEditorState.workingPoints.length} pontos`
            : `${summary.segmentCount} trechos`;
        const collapse = root.document.getElementById('worldRoadEditorCollapse');
        if (collapse) {
            collapse.textContent = roadEditorState.collapsed ? '□' : '−';
            collapse.setAttribute('aria-label', roadEditorState.collapsed ? 'Expandir editor' : 'Recolher editor');
            collapse.setAttribute('aria-expanded', String(!roadEditorState.collapsed));
            collapse.title = roadEditorState.collapsed ? 'Expandir editor' : 'Recolher editor';
        }
    }

    function renderRoadEditorDraft() {
        if (!activeRoadEditorLayer || !activeMap) return;
        activeRoadEditorLayer.clearLayers();
        if (!roadEditorState.mode || !roadEditorState.workingPoints.length) {
            refreshRoadEditorPanel();
            return;
        }
        const coordinates = roadEditorState.workingPoints.map(pixelToMapCoordinate).filter(Boolean);
        if (coordinates.length >= 2) {
            root.L.polyline(coordinates.map(point => [point.lat, point.lng]), {
                pane: 'worldRoadEditorPane',
                color: '#22d3ee',
                weight: 4,
                opacity: 0.95,
                dashArray: '7 6',
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false,
                className: 'world-road-editor-draft'
            }).addTo(activeRoadEditorLayer);
        }
        coordinates.forEach((coordinate, index) => {
            const endpoint = index === 0 || index === coordinates.length - 1;
            const selected = index === roadEditorState.selectedPointIndex;
            const icon = root.L.divIcon({
                className: `world-road-editor-vertex${endpoint ? ' endpoint' : ''}${selected ? ' selected' : ''}`,
                html: `<span>${index + 1}</span>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });
            const marker = root.L.marker([coordinate.lat, coordinate.lng], {
                pane: 'worldRoadEditorPane',
                draggable: true,
                bubblingMouseEvents: false,
                keyboard: true,
                icon,
                title: `Ponto ${index + 1}`
            });
            marker.on('click', event => {
                root.L.DomEvent.stopPropagation(event);
                roadEditorState.selectedPointIndex = index;
                renderRoadEditorDraft();
            });
            marker.on('dragend', event => {
                const point = mapCoordinateToPixel(event.target.getLatLng());
                if (!point) return;
                roadEditorState.workingPoints[index] = point;
                roadEditorState.selectedPointIndex = index;
                renderRoadEditorDraft();
            });
            marker.addTo(activeRoadEditorLayer);
        });
        refreshRoadEditorPanel();
    }

    function pointToSegmentDistance(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
        const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
    }

    function getInsertionIndex(points, point) {
        if (points.length < 2) return points.length;
        let bestIndex = points.length;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let index = 0; index < points.length - 1; index += 1) {
            const distance = pointToSegmentDistance(point, points[index], points[index + 1]);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index + 1;
            }
        }
        return bestIndex;
    }

    function handleRoadEditorMapClick(event) {
        if (!roadEditorState.open || !roadEditorState.mode) return;
        const point = mapCoordinateToPixel(event?.latlng);
        if (!point) return;
        if (roadEditorState.mode === 'new') {
            roadEditorState.workingPoints.push(point);
            roadEditorState.selectedPointIndex = roadEditorState.workingPoints.length - 1;
        } else {
            const index = getInsertionIndex(roadEditorState.workingPoints, point);
            roadEditorState.workingPoints.splice(index, 0, point);
            roadEditorState.selectedPointIndex = index;
        }
        renderRoadEditorDraft();
        setRoadEditorMessage('Ponto marcado. Arraste-o para alinhar com a estrada.', 'success');
    }

    function selectRoadSegment(segmentId, options = {}) {
        if (activePlayerMode) return;
        const segment = getActiveRoadNetwork().segments.find(entry => entry.id === segmentId);
        roadEditorState.segmentId = segment?.id || null;
        refreshRoadEditorPanel();
        if (!segment || options.focus === false || !activeMap) return;
        const coordinates = segment.points.map(pixelToMapCoordinate).filter(Boolean);
        if (coordinates.length > 1) activeMap.fitBounds(root.L.latLngBounds(coordinates.map(point => [point.lat, point.lng])), { padding: [70, 70], maxZoom: 0, animate: true });
    }

    function fillRoadEditorFields(segment = {}) {
        const name = root.document?.getElementById?.('worldRoadEditorName');
        const type = root.document?.getElementById?.('worldRoadEditorType');
        const carriage = root.document?.getElementById?.('worldRoadEditorCarriage');
        if (name) name.value = segment.name || '';
        if (type) type.value = segment.type || 'main';
        if (carriage) carriage.checked = segment.carriageAllowed !== false;
    }

    function startEditingRoadSegment() {
        if (activePlayerMode) return;
        const segment = getRoadEditorSegment();
        if (!segment) {
            setRoadEditorMessage('Selecione primeiro o trecho que deseja corrigir.', 'error');
            return;
        }
        roadEditorState.mode = 'edit';
        roadEditorState.workingPoints = clonePoints(segment.points);
        roadEditorState.selectedPointIndex = -1;
        fillRoadEditorFields(segment);
        renderRoadEditorDraft();
        selectRoadSegment(segment.id);
        if (root.matchMedia?.('(max-width: 560px)')?.matches) toggleRoadEditorCollapsed(true);
        setRoadEditorMessage('Modo de correção ativo.', 'success');
    }

    function startNewRoadSegment() {
        if (activePlayerMode) return;
        roadEditorState.mode = 'new';
        roadEditorState.segmentId = null;
        roadEditorState.workingPoints = [];
        roadEditorState.selectedPointIndex = -1;
        fillRoadEditorFields({ type: 'main', carriageAllowed: true });
        renderRoadEditorDraft();
        if (root.matchMedia?.('(max-width: 560px)')?.matches) toggleRoadEditorCollapsed(true);
        setRoadEditorMessage('Toque no mapa para marcar o ponto inicial.', 'success');
    }

    function removeSelectedRoadPoint() {
        const index = roadEditorState.selectedPointIndex;
        const points = roadEditorState.workingPoints;
        if (index < 0 || !points[index]) {
            setRoadEditorMessage('Selecione um ponto numerado no mapa.', 'error');
            return;
        }
        if (roadEditorState.mode === 'edit' && (index === 0 || index === points.length - 1)) {
            setRoadEditorMessage('As extremidades compartilhadas podem ser arrastadas, mas não removidas.', 'error');
            return;
        }
        if (points.length <= 2) {
            setRoadEditorMessage('Um trecho precisa manter pelo menos dois pontos.', 'error');
            return;
        }
        points.splice(index, 1);
        roadEditorState.selectedPointIndex = Math.min(index, points.length - 1);
        renderRoadEditorDraft();
        setRoadEditorMessage('Ponto removido da geometria.', 'success');
    }

    function cancelRoadEditing() {
        roadEditorState.mode = null;
        roadEditorState.workingPoints = [];
        roadEditorState.selectedPointIndex = -1;
        activeRoadEditorLayer?.clearLayers?.();
        refreshRoadEditorPanel();
        setRoadEditorMessage('Edição cancelada. Nenhuma alteração foi salva.');
    }

    function saveRoadEditorSegment() {
        if (activePlayerMode || !roadEditorState.mode) return;
        const name = root.document?.getElementById?.('worldRoadEditorName')?.value?.trim();
        const type = root.document?.getElementById?.('worldRoadEditorType')?.value || 'main';
        const carriageAllowed = root.document?.getElementById?.('worldRoadEditorCarriage')?.checked !== false;
        if (!name) {
            setRoadEditorMessage('Informe um nome para o trecho.', 'error');
            return;
        }
        if (roadEditorState.workingPoints.length < 2) {
            setRoadEditorMessage('Marque pelo menos o início e o fim do trecho.', 'error');
            return;
        }
        try {
            if (roadEditorState.mode === 'new') {
                const result = roadEditor.addSegment(getActiveRoadNetwork(), { name, type, carriageAllowed, points: roadEditorState.workingPoints });
                activeRoadNetwork = roadEditor.saveNetwork(root.localStorage, result.network);
                roadEditorState.segmentId = result.segmentId;
            } else {
                const updated = roadEditor.updateSegment(getActiveRoadNetwork(), roadEditorState.segmentId, { name, type, carriageAllowed, points: roadEditorState.workingPoints });
                activeRoadNetwork = roadEditor.saveNetwork(root.localStorage, updated);
            }
            roadEditorState.mode = null;
            roadEditorState.workingPoints = [];
            roadEditorState.selectedPointIndex = -1;
            activeRoadEditorLayer?.clearLayers?.();
            refreshRoadLayer();
            refreshRoadEditorPanel();
            setRoadEditorMessage('Trecho salvo neste dispositivo.', 'success');
            root.showToast?.('🛣️ Rede de estradas atualizada.');
        } catch (error) {
            setRoadEditorMessage(error?.message || 'Não foi possível salvar o trecho.', 'error');
        }
    }

    function deleteSelectedRoadSegment() {
        if (activePlayerMode || roadEditorState.mode === 'new') return;
        const segment = getRoadEditorSegment();
        if (!segment) return;
        if (root.confirm && !root.confirm(`Excluir o trecho “${segment.name}”?`)) return;
        try {
            activeRoadNetwork = roadEditor.saveNetwork(root.localStorage, roadEditor.removeSegment(getActiveRoadNetwork(), segment.id));
            roadEditorState = { ...roadEditorState, mode: null, segmentId: null, selectedPointIndex: -1, workingPoints: [] };
            activeRoadEditorLayer?.clearLayers?.();
            refreshRoadLayer();
            refreshRoadEditorPanel();
            setRoadEditorMessage('Trecho removido da rede personalizada.', 'success');
        } catch (error) {
            setRoadEditorMessage(error?.message || 'Não foi possível excluir o trecho.', 'error');
        }
    }

    function setRoadEditorMarkersVisible(visible) {
        roadMarkersVisible = visible !== false;
        if (activeMap && activeMarkerLayer) {
            if (roadMarkersVisible && !activeMap.hasLayer(activeMarkerLayer)) activeMarkerLayer.addTo(activeMap);
            if (!roadMarkersVisible && activeMap.hasLayer(activeMarkerLayer)) activeMap.removeLayer(activeMarkerLayer);
        }
        refreshRoadEditorPanel();
        return roadMarkersVisible;
    }

    function toggleRoadEditorMarkers() {
        return setRoadEditorMarkersVisible(!roadMarkersVisible);
    }

    function toggleRoadEditorCollapsed(force) {
        if (activePlayerMode || !roadEditorState.open) return false;
        const panel = root.document?.getElementById?.('worldRoadEditor');
        if (!panel) return false;
        roadEditorState.collapsed = typeof force === 'boolean' ? force : !roadEditorState.collapsed;
        panel.classList.toggle('compact', roadEditorState.collapsed);
        refreshRoadEditorPanel();
        return roadEditorState.collapsed;
    }

    function toggleRoadEditor(force) {
        if (activePlayerMode || !roadEditor) return false;
        const panel = root.document?.getElementById?.('worldRoadEditor');
        const toggle = root.document?.getElementById?.('worldMapRoadEditorToggle');
        if (!panel) return false;
        const open = typeof force === 'boolean' ? force : panel.hidden;
        panel.hidden = !open;
        roadEditorState.open = open;
        roadEditorState.collapsed = false;
        panel.classList.remove('compact');
        toggle?.setAttribute?.('aria-expanded', String(open));
        toggle?.classList?.toggle?.('active', open);
        if (open) {
            toggleFilters(false);
            toggleRoads(true);
            setRoadEditorMarkersVisible(false);
            refreshRoadEditorPanel();
            setRoadEditorMessage('Selecione um trecho ou comece um novo caminho.');
        } else {
            cancelRoadEditing();
            setRoadEditorMarkersVisible(true);
        }
        return open;
    }

    function downloadJson(filename, value) {
        const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = root.URL?.createObjectURL?.(blob);
        if (!url) return;
        const link = root.document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        root.document.body.appendChild(link);
        link.click();
        link.remove();
        root.setTimeout?.(() => root.URL.revokeObjectURL(url), 0);
    }

    function exportRoadNetwork() {
        if (activePlayerMode) return;
        downloadJson('witcher-rede-estradas.json', roadEditor.buildExportPackage(getActiveRoadNetwork()));
        setRoadEditorMessage('Rede exportada em JSON.', 'success');
    }

    function triggerRoadNetworkImport() {
        if (!activePlayerMode) root.document?.getElementById?.('worldRoadEditorFileInput')?.click?.();
    }

    async function importRoadNetworkFile(event) {
        if (activePlayerMode) return;
        const input = event?.target;
        const file = input?.files?.[0];
        if (!file) return;
        try {
            if (file.size > roadEditor.MAX_IMPORT_BYTES) throw new Error('O arquivo ultrapassa o limite de 4 MB.');
            const text = await file.text();
            const imported = roadEditor.prepareImportedPackage(JSON.parse(text), { byteLength: file.size });
            activeRoadNetwork = roadEditor.saveNetwork(root.localStorage, imported);
            roadEditorState = { ...roadEditorState, mode: null, segmentId: null, selectedPointIndex: -1, workingPoints: [] };
            activeRoadEditorLayer?.clearLayers?.();
            refreshRoadLayer();
            refreshRoadEditorPanel();
            setRoadEditorMessage('Rede importada e ativada neste dispositivo.', 'success');
            root.showToast?.('🛣️ Rede de estradas importada.');
        } catch (error) {
            setRoadEditorMessage(error?.message || 'Não foi possível importar a rede.', 'error');
        } finally {
            if (input) input.value = '';
        }
    }

    function restoreRoadNetworkCatalog() {
        if (activePlayerMode) return;
        if (root.confirm && !root.confirm('Descartar todas as correções locais e restaurar o catálogo original?')) return;
        activeRoadNetwork = roadEditor.restoreCatalog(root.localStorage);
        roadEditorState = { ...roadEditorState, mode: null, segmentId: null, selectedPointIndex: -1, workingPoints: [] };
        activeRoadEditorLayer?.clearLayers?.();
        refreshRoadLayer();
        refreshRoadEditorPanel();
        setRoadEditorMessage('Catálogo original restaurado.', 'success');
        root.showToast?.('↺ Rede de estradas original restaurada.');
    }

    function renderMarkerPopup(location) {
        const layer = getLocationLayer(location);
        const type = getLocationType(location);
        const path = getLocationPath(activeWorld, location.id);
        const region = getLocationRegion(activeWorld, location);
        const description = String(location.description || '').trim();
        const summary = description.length > 240 ? `${description.slice(0, 237).trim()}…` : description;
        const identifier = escapeHtml(JSON.stringify(location.id));
        const context = getLocationContext(activeWorld, location.id, { includePrivate: !activePlayerMode });
        const current = (activeWorld?.locations || []).find(entry => entry.id === activeWorld?.currentLocationId) || null;
        const roadDistance = current ? calculateRoadDistance(current.id, location.id) : null;
        const distanceContent = !current
            ? '<span class="world-map-popup-distance-icon">⌁</span><div><small>DISTÂNCIA PELA ESTRADA</small><strong>Local atual não definido</strong><em>Defina onde o grupo está para calcular a rota.</em></div>'
            : roadDistance?.ok
                ? `<span class="world-map-popup-distance-icon">${roadDistance.distanceKm === 0 ? '📍' : '⌁'}</span><div><small>DISTÂNCIA PELA ESTRADA</small><strong>${roadDistance.distanceKm === 0 ? 'Você está aqui' : escapeHtml(formatRouteDistance(roadDistance.distanceKm))}</strong><em>${roadDistance.distanceKm === 0 ? escapeHtml(location.name) : `${escapeHtml(current.name)} → ${escapeHtml(location.name)} · menor rota viária`}</em></div>`
                : `<span class="world-map-popup-distance-icon">⚠</span><div><small>DISTÂNCIA PELA ESTRADA</small><strong>Rota indisponível</strong><em>${roadDistance?.reason === 'destination-not-on-road' ? 'Este local ainda não está ligado à rede viária.' : roadDistance?.reason === 'origin-not-on-road' ? 'O local atual ainda não está ligado à rede viária.' : 'Não existe uma estrada contínua entre estes locais.'}</em></div>`;
        return `<article class="world-map-popup">
            <small>${escapeHtml(getLayerLabel(layer).toUpperCase())}${location.visibility === 'private' ? ' · SOMENTE MESTRE' : ''}</small>
            <strong>${escapeHtml(location.name)}</strong>
            <span>${escapeHtml(getLocationTypeLabel(type))}${region ? ` · ${escapeHtml(region.name)}` : ''}</span>
            ${summary ? `<p>${escapeHtml(summary)}</p>` : ''}
            <div class="world-map-popup-meta">
                ${location.cartographicConfidence ? `<b>Confiabilidade ${escapeHtml(getConfidenceLabel(location.cartographicConfidence))}</b>` : ''}
                ${path.length > 1 ? `<em>${escapeHtml(path.map(entry => entry.name).join(' › '))}</em>` : ''}
            </div>
            <div class="world-map-popup-distance${roadDistance?.ok ? ' is-available' : ''}">${distanceContent}</div>
            ${(context.npcs.length || context.merchants.length || context.events.length) ? `<div class="world-map-popup-context" aria-label="Conteúdo vinculado ao local">
                ${context.npcs.length ? `<button type="button" onclick="worldMap.openContext('npcs', ${identifier})"><span>🧑</span><b>${context.npcs.length}</b> NPC${context.npcs.length === 1 ? '' : 's'}</button>` : ''}
                ${context.merchants.length ? `<button type="button" onclick="worldMap.openContext('merchants', ${identifier})"><span>🏪</span><b>${context.merchants.length}</b> loja${context.merchants.length === 1 ? '' : 's'}</button>` : ''}
                ${context.events.length ? `<button type="button" onclick="worldMap.openContext('events', ${identifier})"><span>📅</span><b>${context.events.length}</b> evento${context.events.length === 1 ? '' : 's'}</button>` : ''}
            </div>` : ''}
            <div class="world-map-popup-actions">
                <button type="button" onclick="worldMap.openLocation(${identifier})">Ver no catálogo</button>
                ${activePlayerMode ? '' : `<button type="button" onclick="openWorldTravelPlanner(${identifier})">Planejar viagem</button><button type="button" class="primary" onclick="worldMap.setCurrentLocation(${identifier})">Definir como atual</button>`}
            </div>
        </article>`;
    }

    function updateMarkerStatus(visibleLocations) {
        const status = root.document?.getElementById?.('worldMapMarkerStatus');
        if (!status) return;
        const current = activeWorld?.locations?.find(location => location.id === activeWorld.currentLocationId);
        status.innerHTML = `<strong>${visibleLocations.length}</strong> ${visibleLocations.length === 1 ? 'local visível' : 'locais visíveis'}${current ? ` · Atual: ${escapeHtml(current.name)}` : ''}`;
    }

    function refreshMarkerLayer(options = {}) {
        if (!activeMap || !activeMarkerLayer || !activeWorld) return [];
        const locations = filterMappableLocations(activeWorld, mapFilters, { includePrivate: !activePlayerMode });
        activeMarkerLayer.clearLayers();
        activeMarkers = new Map();
        locations.forEach(location => {
            const coordinate = percentToMapCoordinate(location.coordinates);
            if (!coordinate) return;
            const isCurrent = location.id === activeWorld.currentLocationId;
            const marker = root.L.circleMarker([coordinate.lat, coordinate.lng], getMarkerStyle(location, isCurrent));
            marker.bindTooltip(escapeHtml(location.name), { direction: 'top', offset: [0, -7], opacity: 0.96 });
            marker.bindPopup(() => renderMarkerPopup(location), { className: 'world-map-popup-shell', maxWidth: 340, minWidth: 250 });
            marker.addTo(activeMarkerLayer);
            activeMarkers.set(location.id, marker);
        });
        updateMarkerStatus(locations);
        if (options.fit === true) fitLocations(locations);
        return locations;
    }

    function fitLocations(locations) {
        if (!activeMap || !locations?.length) return;
        const coordinates = locations.map(location => percentToMapCoordinate(location.coordinates)).filter(Boolean);
        if (!coordinates.length) return;
        if (coordinates.length === 1) {
            activeMap.setView([coordinates[0].lat, coordinates[0].lng], Math.max(-1, activeMap.getZoom()), { animate: true });
            return;
        }
        activeMap.fitBounds(root.L.latLngBounds(coordinates.map(coordinate => [coordinate.lat, coordinate.lng])), {
            animate: true,
            padding: [28, 28],
            maxZoom: 0
        });
    }

    function toggleFilters(force) {
        const panel = root.document?.getElementById?.('worldMapFilters');
        const toggle = root.document?.getElementById?.('worldMapFilterToggle');
        if (!panel) return;
        const open = typeof force === 'boolean' ? force : panel.hidden;
        panel.hidden = !open;
        toggle?.setAttribute?.('aria-expanded', String(open));
        if (open) root.document?.getElementById?.('worldMapSearch')?.focus?.({ preventScroll: true });
    }

    function applyFilters() {
        mapFilters = {
            query: root.document?.getElementById?.('worldMapSearch')?.value || '',
            regionId: root.document?.getElementById?.('worldMapRegionFilter')?.value || 'all',
            type: root.document?.getElementById?.('worldMapTypeFilter')?.value || 'all',
            layer: root.document?.getElementById?.('worldMapLayerFilter')?.value || 'all',
            confidence: root.document?.getElementById?.('worldMapConfidenceFilter')?.value || 'all'
        };
        refreshMarkerLayer();
    }

    function resetFilters() {
        mapFilters = { query: '', type: 'all', layer: 'all', confidence: 'all', regionId: 'all' };
        const values = {
            worldMapSearch: '',
            worldMapRegionFilter: 'all',
            worldMapTypeFilter: 'all',
            worldMapLayerFilter: 'all',
            worldMapConfidenceFilter: 'all'
        };
        Object.entries(values).forEach(([id, value]) => {
            const field = root.document?.getElementById?.(id);
            if (field) field.value = value;
        });
        refreshMarkerLayer({ fit: true });
    }

    function fitFilteredMarkers() {
        const locations = refreshMarkerLayer();
        fitLocations(locations);
        toggleFilters(false);
    }

    function openLocation(locationId) {
        root.openWorldHub?.('locations');
        root.setTimeout?.(() => {
            const location = root.worldStore?.getWorld?.()?.locations?.find(entry => entry.id === locationId);
            const search = root.document?.getElementById?.('worldLocationSearch');
            if (!location || !search) return;
            search.value = location.name;
            root.filterWorldCanonicalCatalog?.();
        }, 0);
    }

    function openContext(view, locationId) {
        if (!['npcs', 'merchants', 'events'].includes(view)) return;
        root.openWorldHub?.(view, { locationId });
    }

    function setCurrentLocation(locationId) {
        if (activePlayerMode) return;
        try {
            root.worldStore?.setCurrentLocation?.(locationId);
            activeWorld = root.worldStore?.getWorld?.() || activeWorld;
            refreshMarkerLayer();
            activeMarkers.get(locationId)?.openPopup?.();
            if (typeof root.showToast === 'function') root.showToast('📍 Local atual da campanha atualizado.');
        } catch (error) {
            if (typeof root.showToast === 'function') root.showToast(error?.message || 'Não foi possível atualizar o local atual.');
        }
    }

    function saveMapScale() {
        if (activePlayerMode) return;
        const input = root.document?.getElementById?.('worldMapKilometersPerGrid');
        const kilometersPerGrid = Number(String(input?.value || '').replace(',', '.'));
        if (!Number.isFinite(kilometersPerGrid) || kilometersPerGrid < 1 || kilometersPerGrid > 5000) {
            root.showToast?.('Informe uma escala entre 1 e 5.000 km por quadrícula.');
            return;
        }
        try {
            const settings = root.worldStore?.updateMapSettings?.({ kilometersPerGrid });
            activeWorld = root.worldStore?.getWorld?.() || activeWorld;
            refreshRoadLayer();
            const network = getActiveRoadNetwork();
            const summary = roads?.getNetworkSummary?.(network.segments, network.nodes, getDistanceReference()) || { distanceKm: 0 };
            const scaleSummary = root.document?.querySelector?.('.world-map-road-summary small');
            if (scaleSummary) scaleSummary.textContent = `${network.segments.length} trechos conectados · ${roads.getJunctionNodes(network.segments, network.nodes).length} entroncamentos · ${settings.kilometersPerGrid.toLocaleString('pt-BR')} km por quadrícula`;
            const toolbarSummary = root.document?.querySelector?.('.world-map-toolbar > div:first-child span');
            if (toolbarSummary) toolbarSummary.textContent = `${getMappableLocations(activeWorld, { includePrivate: !activePlayerMode }).length} locais · ${network.segments.length} trechos · ${summary.distanceKm.toLocaleString('pt-BR')} km vetorizados.`;
            root.showToast?.(`📏 Escala atualizada para ${settings.kilometersPerGrid.toLocaleString('pt-BR')} km por quadrícula.`);
        } catch (error) {
            root.showToast?.(error?.message || 'Não foi possível salvar a escala do mapa.');
        }
    }

    function clearRoutePreview() {
        activeRouteLayer?.clearLayers?.();
        activeRoutePreviewPointCount = 0;
    }

    function showRoutePreview(route = []) {
        clearRoutePreview();
        const plan = Array.isArray(route) ? { points: route, mode: 'foot' } : (route || {});
        const points = Array.isArray(plan.points) ? plan.points : [];
        if (!activeMap || !activeRouteLayer || points.length < 2) return false;
        const coordinates = points.map(pixelToMapCoordinate).filter(Boolean);
        if (coordinates.length < 2) return false;
        activeMap.closePopup?.();
        const latLngs = coordinates.map(point => [point.lat, point.lng]);
        const isPortal = plan.mode === 'portal';
        root.L.polyline(latLngs, {
            pane: 'worldRoutePane',
            color: '#082f49',
            weight: 10,
            opacity: 0.9,
            dashArray: isPortal ? '14 10' : null,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
            className: 'world-route-preview-casing'
        }).addTo(activeRouteLayer);
        const line = root.L.polyline(latLngs, {
            pane: 'worldRoutePane',
            color: isPortal ? '#c084fc' : '#22d3ee',
            weight: 6,
            opacity: 1,
            dashArray: isPortal ? '14 10' : null,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
            className: 'world-route-preview-line'
        }).addTo(activeRouteLayer);
        const endpointStyle = {
            pane: 'worldRoutePane',
            radius: 7,
            color: '#e0f2fe',
            weight: 3,
            fillColor: isPortal ? '#a855f7' : '#0284c7',
            fillOpacity: 1,
            interactive: false,
            className: 'world-route-preview-endpoint'
        };
        root.L.circleMarker(latLngs[0], endpointStyle).addTo(activeRouteLayer);
        root.L.circleMarker(latLngs[latLngs.length - 1], endpointStyle).addTo(activeRouteLayer);
        activeRoutePreviewPointCount = coordinates.length;
        const viewportWidth = Number(root.document?.documentElement?.clientWidth) || 0;
        const plannerBesideMap = viewportWidth >= 900
            && root.document?.getElementById?.('worldTravelModal')?.classList?.contains?.('world-travel-map-preview-overlay');
        activeMap.fitBounds(line.getBounds(), {
            animate: true,
            paddingTopLeft: [54, 54],
            paddingBottomRight: [plannerBesideMap ? Math.min(580, viewportWidth * 0.46) : 54, 54],
            maxZoom: 0.5
        });
        return true;
    }

    function saveView() {
        if (!activeMap) return;
        const center = activeMap.getCenter();
        rememberedView = {
            center: [Number(center.lat), Number(center.lng)],
            zoom: Number(activeMap.getZoom())
        };
    }

    async function initialize(options = {}) {
        const revision = ++initializationRevision;
        destroy({ preserveView: true, preserveRevision: true });
        const L = root.L;
        const container = root.document?.getElementById?.(options.containerId || 'worldInteractiveMap');
        if (!container) return null;
        if (!L?.map || !L?.CRS?.Simple || !L?.TileLayer?.extend) {
            root.showToast?.('O mecanismo do mapa não pôde ser carregado.');
            return null;
        }

        const manifest = normalizeTileManifest(options.manifest || await loadTileManifest(options.manifestUrl));
        if (revision !== initializationRevision || !container.isConnected) return null;

        const reference = getReference();
        const width = Math.max(1, Number(manifest.originalWidth) || Number(reference.originalWidth) || FALLBACK_REFERENCE.originalWidth);
        const height = Math.max(1, Number(manifest.originalHeight) || Number(reference.originalHeight) || FALLBACK_REFERENCE.originalHeight);
        const bounds = L.latLngBounds([0, 0], [height, width]);
        activeMap = L.map(container, {
            crs: L.CRS.Simple,
            zoomControl: false,
            attributionControl: false,
            minZoom: -5,
            maxZoom: 1.5,
            zoomSnap: 0.25,
            zoomDelta: 0.5,
            wheelPxPerZoomLevel: 90,
            maxBounds: bounds.pad(0.08),
            maxBoundsViscosity: 1,
            bounceAtZoomLimits: false,
            keyboard: true,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            preferCanvas: true,
            fadeAnimation: false,
            markerZoomAnimation: false
        });

        const ContinentTileLayer = L.TileLayer.extend({
            getTileUrl(tileCoordinate) {
                return buildTileUrl(tileCoordinate, manifest, options.tileBaseUrl || BASE_LAYER.tileBaseUrl);
            }
        });
        let tileErrors = 0;
        activeManifest = manifest;
        activeOverlay = new ContinentTileLayer('', {
            tileSize: manifest.tileSize,
            bounds,
            noWrap: true,
            minNativeZoom: manifest.minNativeZoom,
            maxNativeZoom: manifest.maxNativeZoom,
            minZoom: -5,
            maxZoom: 1.5,
            keepBuffer: 1,
            updateWhenIdle: true,
            updateWhenZooming: false,
            updateInterval: 250,
            detectRetina: false,
            errorTileUrl: EMPTY_TILE,
            className: 'world-map-tile'
        });
        activeOverlay.on('tileerror', () => {
            tileErrors += 1;
        });
        activeOverlay.once('load', () => {
            if (tileErrors) console.warn(`${tileErrors} bloco(s) do mapa não puderam ser carregados.`);
        });
        activeOverlay.addTo(activeMap);
        activeWorld = options.world || root.worldStore?.getWorld?.() || { locations: [] };
        activePlayerMode = options.playerMode === true;
        activeRoadNetwork = roadEditor?.loadNetwork?.(root.localStorage)
            || { source: 'catalog', nodes: roads?.ROAD_NODES || [], segments: roads?.ROAD_SEGMENTS || [] };
        roadMarkersVisible = true;
        roadEditorState = { open: false, collapsed: false, mode: null, segmentId: null, selectedPointIndex: -1, workingPoints: [] };
        activeMap.createPane('worldRoadPane');
        activeMap.getPane('worldRoadPane').style.zIndex = '350';
        activeMap.createPane('worldJunctionPane');
        activeMap.getPane('worldJunctionPane').style.zIndex = '360';
        activeMap.createPane('worldRoadEditorPane');
        activeMap.getPane('worldRoadEditorPane').style.zIndex = '460';
        activeMap.createPane('worldRoutePane');
        activeMap.getPane('worldRoutePane').style.zIndex = '455';
        activeRoadLayer = L.layerGroup().addTo(activeMap);
        activeJunctionLayer = L.layerGroup().addTo(activeMap);
        activeMarkerLayer = L.layerGroup().addTo(activeMap);
        activeRouteLayer = L.layerGroup().addTo(activeMap);
        activeRoadEditorLayer = L.layerGroup().addTo(activeMap);
        refreshRoadLayer();
        refreshMarkerLayer();

        activeMap.fitBounds(bounds, { animate: false, padding: [0, 0] });
        initialView = {
            center: [height / 2, width / 2],
            zoom: Number(activeMap.getZoom())
        };
        if (rememberedView && options.restoreView !== false) {
            activeMap.setView(rememberedView.center, rememberedView.zoom, { animate: false });
        }
        activeMap.on('moveend zoomend', saveView);
        activeMap.on('click', handleRoadEditorMapClick);

        if (typeof root.ResizeObserver === 'function') {
            activeResizeObserver = new root.ResizeObserver(() => activeMap?.invalidateSize?.({ pan: false }));
            activeResizeObserver.observe(container);
        }
        root.requestAnimationFrame?.(() => activeMap?.invalidateSize?.({ pan: false }));
        return activeMap;
    }

    function destroy(options = {}) {
        if (!options.preserveRevision) initializationRevision += 1;
        if (activeMap && options.preserveView !== false) saveView();
        activeResizeObserver?.disconnect?.();
        activeResizeObserver = null;
        activeOverlay = null;
        activeManifest = null;
        activeWorld = null;
        activeRoadLayer = null;
        activeJunctionLayer = null;
        activeRoadEditorLayer = null;
        activeMarkerLayer = null;
        activeRouteLayer = null;
        activeRoutePreviewPointCount = 0;
        activeMarkers = new Map();
        activeRoads = new Map();
        activePlayerMode = false;
        activeRoadNetwork = null;
        roadMarkersVisible = true;
        roadEditorState = { open: false, collapsed: false, mode: null, segmentId: null, selectedPointIndex: -1, workingPoints: [] };
        if (activeMap) activeMap.remove();
        activeMap = null;
    }

    function zoomIn() {
        activeMap?.zoomIn?.(0.5);
    }

    function zoomOut() {
        activeMap?.zoomOut?.(0.5);
    }

    function resetView() {
        if (!activeMap || !initialView) return;
        activeMap.setView(initialView.center, initialView.zoom, { animate: true });
        rememberedView = { center: [...initialView.center], zoom: initialView.zoom };
    }

    function getDebugState() {
        return {
            initialized: Boolean(activeMap),
            baseLayer: BASE_LAYER.type,
            reference: { ...getReference() },
            tiles: activeManifest ? {
                format: activeManifest.format,
                tileSize: activeManifest.tileSize,
                minNativeZoom: activeManifest.minNativeZoom,
                maxNativeZoom: activeManifest.maxNativeZoom
            } : null,
            visibleMarkers: activeMarkers.size,
            visibleRoads: activeRoads.size,
            roadsVisible,
            roadNetworkSource: getActiveRoadNetwork().source,
            roadEditorOpen: roadEditorState.open,
            roadEditorMode: roadEditorState.mode,
            playerMode: activePlayerMode,
            routePreviewActive: activeRoutePreviewPointCount >= 2,
            routePreviewPointCount: activeRoutePreviewPointCount,
            rememberedView: rememberedView ? { center: [...rememberedView.center], zoom: rememberedView.zoom } : null
        };
    }

    return Object.freeze({
        BASE_LAYER,
        getReference,
        percentToMapCoordinate,
        mapCoordinateToPercent,
        pixelToMapCoordinate,
        mapCoordinateToPixel,
        getMappableLocations,
        getLocationPath,
        getLocationScopeIds,
        getLocationContext,
        calculateRoadDistance,
        getLocationLayer,
        getLocationType,
        getLocationTypeLabel,
        getMapRegions,
        filterMappableLocations,
        normalizeTileManifest,
        loadTileManifest,
        getTileSourceCoordinate,
        buildTileUrl,
        renderView,
        initialize,
        destroy,
        toggleFilters,
        applyFilters,
        resetFilters,
        fitFilteredMarkers,
        refreshRoadLayer,
        toggleRoads,
        toggleRoadEditor,
        toggleRoadEditorCollapsed,
        toggleRoadEditorMarkers,
        selectRoadSegment,
        startEditingRoadSegment,
        startNewRoadSegment,
        removeSelectedRoadPoint,
        cancelRoadEditing,
        saveRoadEditorSegment,
        deleteSelectedRoadSegment,
        exportRoadNetwork,
        triggerRoadNetworkImport,
        importRoadNetworkFile,
        restoreRoadNetworkCatalog,
        getRoadNetwork: getActiveRoadNetwork,
        openLocation,
        openContext,
        setCurrentLocation,
        saveMapScale,
        showRoutePreview,
        clearRoutePreview,
        zoomIn,
        zoomOut,
        resetView,
        getDebugState
    });
});
