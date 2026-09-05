const APP_SERVICE_WORKER_URL = './service-worker.js';
const APP_CACHE_PREFIXES = Object.freeze([
    'witcher-combat-tracker-',
    'dnd-tracker-'
]);
const APP_STORAGE_KEYS = new Set([
    'dnd_combat_session',
    'dnd_players',
    'dnd_monsterCounter',
    'dnd_playerCounter',
    'inventory',
    'abilitiesInventory',
    'expandedMagic',
    'dnd_character_collections_version',
    'dnd_session_history',
    'dnd_saved_encounters',
    'dnd_last_combat_report',
    'dnd_campaign_clock',
    'dnd_character_sheets',
    'dnd_character_sheets_backup_stage10_v11',
    'dnd_character_sheet_draft',
    'dnd_active_character_sheet',
    'dnd_custom_library',
    'dnd_app_preferences',
    'dnd_campaign_preferences',
    'dnd_campaign_registry_v1',
    'dnd_active_campaign_v1',
    'dnd_collaboration_session_v1',
    'dnd_collaboration_endpoint_v1'
]);

let applicationRegistrationPromise = null;
let reloadingForServiceWorker = false;

function isApplicationStorageKey(key) {
    return APP_STORAGE_KEYS.has(key)
        || key.startsWith('dnd_campaign_state_v1:')
        || key.endsWith('_backup_corrompido');
}

function getApplicationStorageSnapshot() {
    const snapshot = {};

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);

        if (key && isApplicationStorageKey(key)) {
            snapshot[key] = localStorage.getItem(key);
        }
    }

    return snapshot;
}

function clearApplicationStorage() {
    Object.keys(getApplicationStorageSnapshot()).forEach(key => localStorage.removeItem(key));
}

function restoreApplicationStorageSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false;

    clearApplicationStorage();

    Object.entries(snapshot).forEach(([key, value]) => {
        if (isApplicationStorageKey(key) && typeof value === 'string') {
            localStorage.setItem(key, value);
        }
    });

    return true;
}

function isApplicationCache(cacheName) {
    return APP_CACHE_PREFIXES.some(prefix => cacheName.startsWith(prefix));
}

async function clearApplicationCaches() {
    if (!('caches' in window)) return [];

    const cacheNames = await caches.keys();
    const appCaches = cacheNames.filter(isApplicationCache);
    await Promise.all(appCaches.map(cacheName => caches.delete(cacheName)));

    return appCaches;
}

function isApplicationWorkerScope(scope) {
    const applicationPath = new URL('./', window.location.href).pathname;
    const workerUrl = new URL(scope);

    return workerUrl.origin === window.location.origin && workerUrl.pathname.startsWith(applicationPath);
}

async function unregisterApplicationWorkers() {
    if (!('serviceWorker' in navigator)) return [];

    const registrations = await navigator.serviceWorker.getRegistrations();
    const applicationRegistrations = registrations.filter(registration =>
        isApplicationWorkerScope(registration.scope)
    );

    await Promise.all(applicationRegistrations.map(registration => registration.unregister()));
    return applicationRegistrations;
}

function waitForWorkerActivation(worker) {
    if (!worker || worker.state === 'activated' || worker.state === 'redundant') {
        return Promise.resolve(worker?.state);
    }

    return new Promise(resolve => {
        const onStateChange = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') {
                worker.removeEventListener('statechange', onStateChange);
                resolve(worker.state);
            }
        };

        worker.addEventListener('statechange', onStateChange);
    });
}

async function registerApplicationServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;

    if (!applicationRegistrationPromise) {
        applicationRegistrationPromise = navigator.serviceWorker
            .register(APP_SERVICE_WORKER_URL, { updateViaCache: 'none' })
            .then(async registration => {
                await registration.update();
                return registration;
            })
            .catch(error => {
                applicationRegistrationPromise = null;
                console.error('Não foi possível ativar o modo offline.', error);
                return null;
            });
    }

    return applicationRegistrationPromise;
}

async function updateApplicationNow() {
    const registration = await registerApplicationServiceWorker();

    if (!registration) return { supported: false, activated: false };

    await registration.update();

    if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await waitForWorkerActivation(registration.waiting);
    } else if (registration.installing) {
        await waitForWorkerActivation(registration.installing);
    }

    return { supported: true, activated: true };
}

async function repairApplicationCache() {
    const clearedCaches = await clearApplicationCaches();
    const registration = await registerApplicationServiceWorker();

    await registration?.update();

    return { clearedCaches, supported: Boolean(registration) };
}

async function resetApplicationCompletely() {
    clearApplicationStorage();
    await clearApplicationCaches();
    await unregisterApplicationWorkers();
}

window.getApplicationStorageSnapshot = getApplicationStorageSnapshot;
window.restoreApplicationStorageSnapshot = restoreApplicationStorageSnapshot;
window.clearApplicationCaches = clearApplicationCaches;
window.updateApplicationNow = updateApplicationNow;
window.repairApplicationCache = repairApplicationCache;
window.resetApplicationCompletely = resetApplicationCompletely;

window.addEventListener('load', () => {
    if (!('serviceWorker' in navigator)) return;

    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloadingForServiceWorker) return;

        reloadingForServiceWorker = true;
        window.location.reload();
    });

    void registerApplicationServiceWorker();
});
