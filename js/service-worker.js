const CACHE_NAME = 'witcher-combat-tracker-v105';

const APP_SHELL = [
    './',
    './index.html',
    './style.css',
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
    './manifest.json',
    './service-worker.js',
    './image.png',
    './professional-skills-descriptions.js',
    './img/monsters/witch.png',
    './img/monsters/umbrenato.png',
    './img/monsters/lamia.png',
    './img/monsters/ghoul.png',
    './img/monsters/drowner.png',
    './js/state.js',
    './js/collaboration/protocol.js',
    './js/collaboration/permissions.js',
    './js/collaboration/collaboration-session.js',
    './js/collaboration/realtime-client.js',
    './js/campaign/campaign-migrations.js',
    './js/campaign/campaign-store.js',
    './js/zoom-lock.js',
    './js/core/toast.js',
    './js/core/helpers.js',
    './js/professional-skills-data.js',
    './js/character-sheet-model.js',
    './js/character-sheet-templates.js',
    './js/items.js',
    './js/inventory-filters.js',
    './js/bestiary.js',
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

const OPTIONAL_REMOTE_ASSETS = [
    'https://cdn.tailwindcss.com/',
    'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

const APP_SHELL_URLS = new Set(
    APP_SHELL.map(asset => new URL(asset, self.registration.scope).href)
);

function isCacheableResponse(response) {
    return response && (response.ok || response.type === 'opaque');
}

function isApplicationShellRequest(request) {
    const url = new URL(request.url);
    url.search = '';
    url.hash = '';

    return request.mode === 'navigate' || APP_SHELL_URLS.has(url.href);
}

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) return cachedResponse;

    try {
        const response = await fetch(request);

        if (isCacheableResponse(response)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
        }

        return response;
    } catch {
        if (request.mode === 'navigate') {
            return caches.match('./index.html');
        }

        return Response.error();
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request, { cache: 'no-store' });

        if (isCacheableResponse(response)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
        }

        return response;
    } catch {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') return caches.match('./index.html');

        return Response.error();
    }
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                await cache.addAll(APP_SHELL);

                await Promise.all(
                    OPTIONAL_REMOTE_ASSETS.map(async asset => {
                        try {
                            const response = await fetch(asset, { mode: 'no-cors' });
                            await cache.put(asset, response);
                        } catch {
                            // Recursos externos não podem bloquear a instalação offline local.
                        }
                    })
                );
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames
                .filter(cacheName => cacheName !== CACHE_NAME)
                .map(cacheName => caches.delete(cacheName))
        ))
    );
    self.clients.claim();
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        isApplicationShellRequest(event.request)
            ? networkFirst(event.request)
            : cacheFirst(event.request)
    );
});
