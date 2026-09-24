const CACHE_VERSION = 'witcher-combat-tracker-v185';
const CORE_CACHE_NAME = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE_NAME = `${CACHE_VERSION}-runtime`;

const CORE_SHELL = [
    './',
    './index.html',
    './style.css',
    './tailwind-static.css',
    './zoom-lock.css',
    './mobile.css',
    './character-collections.css',
    './equipment.css',
    './mounts.css',
    './critical-wounds.css',
    './toxicity.css',
    './loot-rewards.css',
    './care-services.css',
    './character-spells.css',
    './crafting.css',
    './character-sheet-wizard.css',
    './campaign-clock.css',
    './collaboration.css',
    './world-map.css',
    './app-shell.css',
    './manifest.json',
    './service-worker.js',
    './image.png',
    './professional-skills-descriptions.js',
    './js/state.js',
    './js/collaboration/protocol.js',
    './js/collaboration/permissions.js',
    './js/collaboration/offline-queue.js',
    './js/world/world-model.js',
    './js/world/world-atlas-data.js',
    './js/world/world-location-data.js',
    './js/world/world-location-imported-data.js',
    './js/world/world-cartographic-data.js',
    './js/world/world-history-data.js',
    './js/world/world-feature-loader.js',
    './js/collaboration/cloud-account.js',
    './js/collaboration/collaboration-session.js',
    './js/collaboration/realtime-client.js',
    './js/campaign/campaign-migrations.js',
    './js/campaign/campaign-database.js',
    './js/campaign/campaign-store.js',
    './js/world/world-store.js',
    './js/auth/firebase-project-config.js',
    './js/auth/firebase-auth-config.js',
    './js/auth/firebase-auth-loader.js',
    './js/auth/firebase-auth-ui.js',
    './js/zoom-lock.js',
    './js/core/toast.js',
    './js/core/helpers.js',
    './js/core/performance.js',
    './js/professional-skills-data.js',
    './js/character-sheet-model.js',
    './js/character-sheet-templates.js',
    './js/items.js',
    './js/inventory-filters.js',
    './js/bestiary.js',
    './js/bestiary-expansion.js',
    './js/monsters.js',
    './js/inventory.js',
    './js/navigation.js',
    './js/conditions.js',
    './js/combat/combat-storage-modern.js',
    './js/combat/combat-input.js',
    './js/combat/combat-events.js',
    './js/combat/combat-render.js',
    './js/combat/combat-turns.js',
    './js/modal.utf8.js',
    './js/combat/combat.js',
    './js/ui/condition-modal.js',
    './js/combat/damage-modal.js',
    './js/combat/concentration.js',
    './js/combat/combat-effects.js',
    './js/abilities/abilities-data.js',
    './js/abilities/abilities.js',
    './js/character-collections.js',
    './js/equipment.js',
    './js/mounts.js',
    './js/critical-wounds.js',
    './js/toxicity.js',
    './js/loot-rewards.js',
    './js/character-skill-tests.js',
    './js/character-spells.js',
    './js/crafting.js',
    './js/ui/abilities-modal.js',
    './js/abilities/abilities-export.js',
    './js/interactions.js',
    './js/app-init.js',
    './js/campaign-timeline-data.js',
    './js/campaign-clock.js',
    './js/character-needs.js',
    './js/world/world-time.js',
    './js/world/world-commerce.js',
    './js/temporal-effects.js',
    './js/campaign-daily-processing.js',
    './js/session-features.js',
    './js/care-services.js',
    './js/enhancements.js',
    './js/character-sheet-wizard.js',
    './js/rules-automation.js',
    './js/item-use-automation.js',
    './js/spell-damage-automation.js'
];

const RUNTIME_ASSETS = [
    './js/auth/firebase-auth.bundle.js',
    './vendor/leaflet/leaflet.css',
    './vendor/leaflet/leaflet.js',
    './vendor/leaflet/images/layers.png',
    './vendor/leaflet/images/layers-2x.png',
    './vendor/leaflet/images/marker-icon.png',
    './vendor/leaflet/images/marker-icon-2x.png',
    './vendor/leaflet/images/marker-shadow.png',
    './img/monsters/witch.png',
    './img/monsters/umbrenato.png',
    './img/monsters/lamia.png',
    './img/monsters/ghoul.png',
    './img/monsters/drowner.png',
    './img/maps/continent/manifest.json',
    './js/world/world-road-imported-data.js',
    './js/world/world-road-data.js',
    './js/world/world-route-engine.js',
    './js/world/world-road-editor.js',
    './js/world/world-map.js',
    'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js'
];

const CORE_SHELL_URLS = new Set(
    CORE_SHELL.map(asset => new URL(asset, self.registration.scope).href)
);
const RUNTIME_ASSET_URLS = new Set(
    RUNTIME_ASSETS.map(asset => new URL(asset, self.registration.scope).href)
);

function isCacheableResponse(response) {
    return response && (response.ok || response.type === 'opaque');
}

function normalizeRequestUrl(request) {
    const url = new URL(request.url);
    url.search = '';
    url.hash = '';
    return url;
}

function isCoreAssetRequest(request) {
    return CORE_SHELL_URLS.has(normalizeRequestUrl(request).href);
}

function isRuntimeAssetRequest(request) {
    return RUNTIME_ASSET_URLS.has(normalizeRequestUrl(request).href);
}

function isRuntimeCacheCandidate(request) {
    const url = normalizeRequestUrl(request);

    return url.origin === self.location.origin
        || request.destination === 'image'
        || isRuntimeAssetRequest(request);
}

async function storeResponse(cacheName, request, response) {
    if (!isCacheableResponse(response)) return response;

    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    return response;
}

async function cacheFirst(request, cacheName = RUNTIME_CACHE_NAME) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) return cachedResponse;

    try {
        const response = await fetch(request);
        return storeResponse(cacheName, request, response);
    } catch {
        if (request.mode === 'navigate') {
            return caches.match(new URL('./index.html', self.registration.scope).href);
        }

        return Response.error();
    }
}

async function staleWhileRevalidate(request, event) {
    const cachedResponse = await caches.match(request);
    const refreshPromise = fetch(request)
        .then(response => storeResponse(CORE_CACHE_NAME, request, response))
        .catch(() => null);

    if (cachedResponse) {
        event?.waitUntil(refreshPromise);
        return cachedResponse;
    }

    return (await refreshPromise) || Response.error();
}

async function networkFirst(request, timeoutMs = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(request, { signal: controller.signal });
        return await storeResponse(CORE_CACHE_NAME, request, response);
    } catch {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') {
            return caches.match(new URL('./index.html', self.registration.scope).href);
        }

        return Response.error();
    } finally {
        clearTimeout(timeoutId);
    }
}

async function precacheCoreShell() {
    const cache = await caches.open(CORE_CACHE_NAME);

    await Promise.allSettled(CORE_SHELL.map(async asset => {
        const request = new Request(new URL(asset, self.registration.scope).href, { cache: 'reload' });
        const response = await fetch(request);

        if (!isCacheableResponse(response)) {
            throw new Error(`Falha ao preparar ${asset} para uso offline.`);
        }

        await cache.put(request, response);
    }));

    const cachedEntry = await cache.match(new URL('./index.html', self.registration.scope).href)
        || await cache.match(new URL('./', self.registration.scope).href);

    if (!cachedEntry) throw new Error('A interface principal não pôde ser preparada para uso offline.');
}

self.addEventListener('install', event => {
    event.waitUntil(
        precacheCoreShell()
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames
                .filter(cacheName => (
                    cacheName.startsWith('witcher-combat-tracker-')
                    && cacheName !== CORE_CACHE_NAME
                    && cacheName !== RUNTIME_CACHE_NAME
                ))
                .map(cacheName => caches.delete(cacheName))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    if (event.request.mode === 'navigate') {
        event.respondWith(networkFirst(event.request));
        return;
    }

    if (isCoreAssetRequest(event.request)) {
        event.respondWith(staleWhileRevalidate(event.request, event));
        return;
    }

    if (isRuntimeCacheCandidate(event.request)) {
        event.respondWith(cacheFirst(event.request));
    }
});
