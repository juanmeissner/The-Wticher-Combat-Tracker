(function initializeWorldFeatureLoader(root) {
    'use strict';

    const loadedScripts = new Map();
    let routeFeaturesPromise = null;
    let mapFeaturesPromise = null;

    function loadScript(source, isReady) {
        if (isReady?.()) return Promise.resolve(true);
        if (loadedScripts.has(source)) return loadedScripts.get(source);

        const promise = new Promise((resolve, reject) => {
            const existing = root.document?.querySelector?.(`script[data-lazy-source="${source}"]`);
            const script = existing || root.document?.createElement?.('script');
            if (!script) {
                reject(new Error(`Não foi possível preparar ${source}.`));
                return;
            }

            const finish = () => {
                if (isReady?.()) resolve(true);
                else reject(new Error(`O recurso ${source} foi carregado sem inicializar corretamente.`));
            };
            script.addEventListener('load', finish, { once: true });
            script.addEventListener('error', () => reject(new Error(`Não foi possível carregar ${source}.`)), { once: true });

            if (!existing) {
                script.src = source;
                script.async = false;
                script.dataset.lazySource = source;
                root.document.head.appendChild(script);
            }
        }).catch(error => {
            loadedScripts.delete(source);
            throw error;
        });

        loadedScripts.set(source, promise);
        return promise;
    }

    async function ensureRouteFeatures() {
        if (root.worldRoadData && root.worldRouteEngine) return true;
        if (!routeFeaturesPromise) {
            routeFeaturesPromise = (async () => {
                await loadScript('js/world/world-road-imported-data.js', () => Boolean(root.worldRoadImportedData));
                await loadScript('js/world/world-road-data.js', () => Boolean(root.worldRoadData));
                await loadScript('js/world/world-route-engine.js', () => Boolean(root.worldRouteEngine));
                return true;
            })().catch(error => {
                routeFeaturesPromise = null;
                throw error;
            });
        }
        return routeFeaturesPromise;
    }

    async function ensureMapFeatures() {
        if (root.worldMap && root.L) return true;
        if (!mapFeaturesPromise) {
            mapFeaturesPromise = (async () => {
                await ensureRouteFeatures();
                await loadScript('vendor/leaflet/leaflet.js', () => Boolean(root.L));
                await loadScript('js/world/world-road-editor.js', () => Boolean(root.worldRoadEditor));
                await loadScript('js/world/world-map.js', () => Boolean(root.worldMap));
                return true;
            })().catch(error => {
                mapFeaturesPromise = null;
                throw error;
            });
        }
        return mapFeaturesPromise;
    }

    root.worldFeatureLoader = Object.freeze({ ensureRouteFeatures, ensureMapFeatures });
})(typeof window !== 'undefined' ? window : globalThis);
