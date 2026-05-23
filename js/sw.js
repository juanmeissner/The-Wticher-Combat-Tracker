const CACHE_NAME = 'dnd-tracker-v5-0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',

  './js/state.js',

  './js/core/toast.js',
  './js/core/helpers.js',

  './js/items.js',
  './js/bestiary.js',
  './js/monsters.js',
  './js/inventory.js',
  './js/swipe.js',
  './js/conditions.js',
  './js/modal.js',

  './js/combat/combat-storage.js',
  './js/combat/combat-input.js',
  './js/combat/combat-events.js',
  './js/combat/combat-render.js',
  './js/combat/combat-turns.js',
  './js/combat/combat.js',

  './js/ui/condition-modal.js',
  './js/combat/damage-modal.js',
  './js/combat/concentration.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
