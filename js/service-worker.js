const CACHE_NAME = 'witcher-combat-tracker-v17';

const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './mobile.css',
    './manifest.json',
    './service-worker.js',
    './image.png',
    './img/monsters/witch.png',
    './img/monsters/umbrenato.png',
    './img/monsters/lamia.png',
    './img/monsters/ghoul.png',
    './img/monsters/drowner.png',
    './js/state.js',
    './js/core/toast.js',
    './js/core/helpers.js',
    './js/items.js',
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
    './js/modal.js',
    './js/combat/combat.js',
    './js/ui/condition-modal.js',
    './js/combat/damage-modal.js',
    './js/combat/concentration.js',
    './js/combat/combat-effects.js',
    './js/abilities/abilities-data.js',
    './js/abilities/abilities.js',
    './js/ui/abilities-modal.js',
    './js/abilities/abilities-export.js',
    './js/interactions.js',
    './js/app-init.js',
    './js/session-features.js',
    './js/enhancements.js',
    './js/rules-automation.js'
];

const OPTIONAL_REMOTE_ASSETS = [
    'https://cdn.tailwindcss.com/',
    'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

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

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request)
                .then(response => {
                    if (!response || (!response.ok && response.type !== 'opaque')) {
                        return response;
                    }

                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseCopy);
                    });

                    return response;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }

                    return Response.error();
                });
        })
    );
});
