(function (root, factory) {
    const migrations = root?.campaignMigrations
        || (typeof require === 'function' ? require('./campaign-migrations.js') : null);
    const durable = root?.campaignDatabase
        || (typeof require === 'function' ? require('./campaign-database.js') : null);
    const api = factory(root, migrations, durable);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.campaignStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, migrations, durable) {
    'use strict';

    const REGISTRY_KEY = 'dnd_campaign_registry_v1';
    const ACTIVE_CAMPAIGN_KEY = 'dnd_active_campaign_v1';
    const CAMPAIGN_KEY_PREFIX = 'dnd_campaign_state_v1:';
    const REGISTRY_VERSION = 1;
    const listeners = new Set();

    let storage = null;
    let activeCampaign = null;
    let initialized = false;
    let checkpointScheduled = false;
    let storageBridgeInstalled = false;
    let bridgeSuspended = 0;
    let rawGetItem = null;
    let rawSetItem = null;
    let rawRemoveItem = null;
    let transientRemoteActive = false;
    let durableVirtualActive = false;
    let durableHydrated = false;
    let durableBootstrapPlaceholder = false;
    let durableReadyPromise = Promise.resolve(null);
    const durableCampaignCache = new Map();
    let persistentCampaignBeforeTransient = null;
    let transientStorageValues = new Map();

    durable?.subscribe?.(event => {
        if (!root?.document?.documentElement) return;
        root.document.documentElement.dataset.campaignStorageEvent = String(event.reason || 'unknown');
        root.document.documentElement.dataset.campaignStoragePending = String(event.status?.pending || 0);
        root.document.documentElement.dataset.campaignStorageSavedAt = String(event.status?.lastSavedAt || '');
        root.document.documentElement.dataset.campaignStorageSavedRevision = String(event.revision ?? '');
        root.document.documentElement.dataset.campaignStorageError = String(event.status?.lastError || '');
    });

    function campaignStorageKey(id) {
        return `${CAMPAIGN_KEY_PREFIX}${id}`;
    }

    function parse(raw, fallback) {
        try {
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function readDirect(key) {
        if (!storage) return null;
        return rawGetItem ? rawGetItem.call(storage, key) : storage.getItem(key);
    }

    function getRegistry() {
        const parsed = parse(storage?.getItem?.(REGISTRY_KEY), null);
        if (!parsed || parsed.version !== REGISTRY_VERSION || !Array.isArray(parsed.campaigns)) {
            return { version: REGISTRY_VERSION, activeCampaignId: null, campaigns: [] };
        }
        return parsed;
    }

    function writeDirect(key, value) {
        if (!storage) return;
        bridgeSuspended++;
        try {
            if (rawSetItem) rawSetItem.call(storage, key, value);
            else storage.setItem(key, value);
        } finally {
            bridgeSuspended--;
        }
    }

    function removeDirect(key) {
        if (!storage) return;
        bridgeSuspended++;
        try {
            if (rawRemoveItem) rawRemoveItem.call(storage, key);
            else storage.removeItem(key);
        } finally {
            bridgeSuspended--;
        }
    }

    function persistRegistry(registry) {
        writeDirect(REGISTRY_KEY, JSON.stringify(registry));
        writeDirect(ACTIVE_CAMPAIGN_KEY, String(registry.activeCampaignId || ''));
    }

    function updateRegistryEntry(campaign) {
        const registry = getRegistry();
        const summary = {
            id: campaign.id,
            name: campaign.metadata?.name || 'Campanha principal',
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
            revision: campaign.revision
        };
        const index = registry.campaigns.findIndex(entry => entry.id === campaign.id);

        if (index >= 0) registry.campaigns[index] = summary;
        else registry.campaigns.push(summary);
        registry.activeCampaignId = campaign.id;
        persistRegistry(registry);
        return registry;
    }

    function persistCampaign(campaign) {
        if (transientRemoteActive && campaign?.id === activeCampaign?.id) return;
        if (durableBootstrapPlaceholder && !durableHydrated && campaign?.id === activeCampaign?.id) {
            return;
        }
        durableCampaignCache.set(String(campaign.id), migrations.clone(campaign));
        if (durableHydrated && durable?.getStatus?.().ready) {
            durable.scheduleSave?.(campaign);
        } else {
            writeDirect(campaignStorageKey(campaign.id), JSON.stringify(campaign));
        }
        updateRegistryEntry(campaign);
    }

    function snapshotRuntimeStorage() {
        if (!transientRemoteActive && !durableVirtualActive) return migrations.snapshotLegacyStorage(storage);
        return Object.fromEntries(transientStorageValues.entries());
    }

    function seedTransientStorage(campaign) {
        transientStorageValues = new Map();
        const snapshot = campaign?.state?.compatibility || {};
        migrations.LEGACY_CAMPAIGN_STORAGE_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
                transientStorageValues.set(key, String(snapshot[key]));
            }
        });
    }

    function removePhysicalCampaignData() {
        const registry = getRegistry();
        const campaignIds = new Set([
            ...(registry.campaigns || []).map(entry => entry.id),
            ...durableCampaignCache.keys()
        ]);
        campaignIds.forEach(id => removeDirect(campaignStorageKey(id)));
        migrations.LEGACY_CAMPAIGN_STORAGE_KEYS.forEach(key => removeDirect(key));
    }

    function listLocalCampaigns(registry = getRegistry()) {
        const campaigns = [];
        const ids = new Set([
            ...(registry.campaigns || []).map(entry => entry.id),
            registry.activeCampaignId,
            activeCampaign?.id
        ].filter(Boolean));
        ids.forEach(id => {
            const campaign = parse(readDirect(campaignStorageKey(id)), null);
            if (campaign?.id) campaigns.push(migrations.normalizeCampaign(campaign));
        });
        return campaigns;
    }

    function replaceRegistryFromDurable(campaigns, activeId) {
        const registry = {
            version: REGISTRY_VERSION,
            activeCampaignId: activeId || campaigns[0]?.id || null,
            campaigns: campaigns.map(campaign => ({
                id: campaign.id,
                name: campaign.metadata?.name || 'Campanha principal',
                createdAt: campaign.createdAt,
                updatedAt: campaign.updatedAt,
                revision: campaign.revision
            }))
        };
        persistRegistry(registry);
        return registry;
    }

    function applyHydratedCampaignToRuntime(campaign) {
        const apply = () => root?.applyRemoteCampaignView?.(migrations.clone(campaign));
        if (!root?.document) return;
        if (root.document.readyState === 'complete') root.setTimeout?.(apply, 0);
        else root.addEventListener?.('load', apply, { once: true });
    }

    async function hydrateDurableStorage(requestedId) {
        if (!durable?.initialize || !durable?.getStatus?.().supported) return getActiveCampaign();
        const status = await durable.initialize();
        if (!status?.ready) return getActiveCampaign();

        const registry = getRegistry();
        const localCampaigns = listLocalCampaigns(registry);
        const databaseCampaigns = await durable.getAllCampaigns();
        if (root?.document?.documentElement) {
            const databaseActive = databaseCampaigns.find(campaign => campaign.id === requestedId)
                || databaseCampaigns[0];
            root.document.documentElement.dataset.campaignDatabaseRevision = String(
                databaseActive?.revision ?? ''
            );
        }
        const merged = new Map();

        databaseCampaigns.forEach(campaign => {
            const normalized = migrations.normalizeCampaign(campaign);
            merged.set(normalized.id, normalized);
        });
        localCampaigns.forEach(campaign => {
            const current = merged.get(campaign.id);
            if (!current || Number(campaign.revision) >= Number(current.revision)) {
                merged.set(campaign.id, campaign);
            }
        });
        if (activeCampaign && !durableBootstrapPlaceholder && !merged.has(activeCampaign.id)) {
            merged.set(activeCampaign.id, migrations.normalizeCampaign(activeCampaign));
        }

        for (const campaign of merged.values()) {
            durableCampaignCache.set(campaign.id, migrations.clone(campaign));
            const stored = databaseCampaigns.find(entry => entry.id === campaign.id);
            if (!stored || Number(campaign.revision) >= Number(stored.revision)) {
                durable.scheduleSave(campaign);
            }
        }
        await durable.flush();

        const preferredId = requestedId
            || readDirect(ACTIVE_CAMPAIGN_KEY)
            || registry.activeCampaignId
            || activeCampaign?.id;
        const selected = durableCampaignCache.get(String(preferredId || ''))
            || durableCampaignCache.values().next().value
            || activeCampaign;

        if (selected) activeCampaign = migrations.normalizeCampaign(selected);
        durableBootstrapPlaceholder = false;
        durableHydrated = true;
        durableVirtualActive = true;
        seedTransientStorage(activeCampaign);
        replaceRegistryFromDurable([...durableCampaignCache.values()], activeCampaign?.id);
        removePhysicalCampaignData();
        emit('durable-hydrated', {
            campaignCount: durableCampaignCache.size,
            recoveredCampaignIds: durable.getStatus().recoveredCampaignIds || []
        });
        applyHydratedCampaignToRuntime(activeCampaign);
        return getActiveCampaign();
    }

    function emit(reason, detail = {}) {
        const event = {
            reason,
            campaign: getActiveCampaign(),
            revision: activeCampaign?.revision || 0,
            ...detail
        };
        if (root?.document?.documentElement) {
            root.document.documentElement.dataset.campaignStorage = durableHydrated ? 'indexeddb' : 'local';
            root.document.documentElement.dataset.campaignStoragePending = String(
                durable?.getStatus?.().pending || 0
            );
            root.document.documentElement.dataset.campaignId = String(activeCampaign?.id || '');
            root.document.documentElement.dataset.campaignRevision = String(activeCampaign?.revision || 0);
        }
        listeners.forEach(listener => listener(event));
        root?.dispatchEvent?.(new CustomEvent('campaign:changed', { detail: event }));
        return event;
    }

    function initialize(options = {}) {
        if (initialized && !options.force) return getActiveCampaign();
        storage = options.storage || root?.localStorage || null;
        if (!storage) return null;

        migrations.ensureCampaignPreferences(storage);
        const registry = getRegistry();
        const requestedId = options.campaignId
            || storage.getItem(ACTIVE_CAMPAIGN_KEY)
            || registry.activeCampaignId;
        const stored = requestedId
            ? parse(storage.getItem(campaignStorageKey(requestedId)), null)
            : null;
        const registryEntry = registry.campaigns.find(entry => entry.id === requestedId);
        durableBootstrapPlaceholder = Boolean(
            !stored
            && registryEntry
            && durable?.getStatus?.().supported
        );

        activeCampaign = stored
            ? migrations.normalizeCampaign(stored)
            : migrations.createCampaignFromLegacy(storage, {
                id: durableBootstrapPlaceholder ? requestedId : undefined,
                name: durableBootstrapPlaceholder ? registryEntry.name : options.name,
                createdBy: options.createdBy,
                now: options.now
            });

        if (!durableBootstrapPlaceholder) persistCampaign(activeCampaign);
        initialized = true;
        if (options.installBridge !== false) installLegacyStorageBridge();
        if (root?.document?.documentElement) {
            root.document.documentElement.dataset.campaignStorage = durable?.getStatus?.().supported
                ? 'migrating'
                : 'local';
            root.document.documentElement.dataset.campaignStoragePending = '0';
        }
        durableReadyPromise = hydrateDurableStorage(requestedId).catch(error => {
            emit('durable-error', { error: String(error?.message || error) });
            return getActiveCampaign();
        });
        return getActiveCampaign();
    }

    function whenDurableReady() {
        return durableReadyPromise;
    }

    async function flushDurableStorage() {
        checkpoint({ reason: 'durable-flush' });
        await durableReadyPromise;
        await durable?.flush?.();
        return getStorageStatus();
    }

    function getStorageStatus() {
        return {
            durableHydrated,
            compatibilityBridge: durableVirtualActive,
            ...(durable?.getStatus?.() || { supported: false, ready: false })
        };
    }

    function getActiveCampaign() {
        return activeCampaign ? migrations.clone(activeCampaign) : null;
    }

    function getCampaigns() {
        return migrations.clone(getRegistry().campaigns);
    }

    function checkpoint(options = {}) {
        if (!initialized) initialize({ installBridge: false });
        if (!activeCampaign || !storage) return null;

        const snapshot = snapshotRuntimeStorage();
        const previous = JSON.stringify(activeCampaign.state?.compatibility || {});
        const next = JSON.stringify(snapshot);
        if (previous === next && options.force !== true) return getActiveCampaign();

        const now = options.now || new Date().toISOString();
        activeCampaign.state = migrations.buildCampaignState(snapshot, activeCampaign.state || {});
        activeCampaign.revision += 1;
        activeCampaign.updatedAt = now;
        activeCampaign.sync = {
            ...(activeCampaign.sync || {}),
            lastCheckpointAt: now
        };

        const changedKeys = migrations.LEGACY_CAMPAIGN_STORAGE_KEYS.filter(key =>
            (activeCampaign.state.compatibility[key] ?? null) !==
            (parse(previous, {})[key] ?? null)
        );
        changedKeys.forEach(key => {
            activeCampaign.entityVersions[`storage:${key}`] = activeCampaign.revision;
        });

        persistCampaign(activeCampaign);
        emit(options.reason || 'legacy-checkpoint', { changedKeys });
        return getActiveCampaign();
    }

    function scheduleCheckpoint(reason = 'legacy-storage') {
        if (!initialized || bridgeSuspended || checkpointScheduled) return;
        checkpointScheduled = true;
        Promise.resolve().then(() => {
            checkpointScheduled = false;
            checkpoint({ reason });
        });
    }

    function installLegacyStorageBridge() {
        if (storageBridgeInstalled || !root?.Storage || storage !== root.localStorage) return false;
        const prototype = root.Storage.prototype;
        rawGetItem = prototype.getItem;
        rawSetItem = prototype.setItem;
        rawRemoveItem = prototype.removeItem;

        prototype.getItem = function (key) {
            const normalizedKey = String(key || '');
            if (this === storage && (transientRemoteActive || durableVirtualActive) && migrations.isCampaignStorageKey(normalizedKey)) {
                return transientStorageValues.has(normalizedKey)
                    ? transientStorageValues.get(normalizedKey)
                    : null;
            }
            return rawGetItem.call(this, key);
        };

        prototype.setItem = function (key, value) {
            const normalizedKey = String(key || '');
            if (this === storage && (transientRemoteActive || durableVirtualActive) && migrations.isCampaignStorageKey(normalizedKey)) {
                transientStorageValues.set(normalizedKey, String(value));
                if (!bridgeSuspended) scheduleCheckpoint(`transient:set:${normalizedKey}`);
                return;
            }
            rawSetItem.call(this, key, value);
            if (this === storage && migrations.isCampaignStorageKey(key) && !bridgeSuspended) {
                scheduleCheckpoint(`storage:set:${key}`);
            }
        };
        prototype.removeItem = function (key) {
            const normalizedKey = String(key || '');
            if (this === storage && (transientRemoteActive || durableVirtualActive) && migrations.isCampaignStorageKey(normalizedKey)) {
                transientStorageValues.delete(normalizedKey);
                if (!bridgeSuspended) scheduleCheckpoint(`transient:remove:${normalizedKey}`);
                return;
            }
            rawRemoveItem.call(this, key);
            if (this === storage && migrations.isCampaignStorageKey(key) && !bridgeSuspended) {
                scheduleCheckpoint(`storage:remove:${key}`);
            }
        };
        storageBridgeInstalled = true;
        return true;
    }

    function createCampaign(options = {}) {
        if (!initialized) initialize({ installBridge: false });
        const currentSnapshot = migrations.snapshotLegacyStorage(storage);
        const emptyStorage = {
            getItem(key) {
                if (key === migrations.CAMPAIGN_PREFERENCES_KEY) {
                    return currentSnapshot[migrations.CAMPAIGN_PREFERENCES_KEY] || null;
                }
                return null;
            },
            setItem() {}
        };
        const campaign = migrations.createCampaignFromLegacy(emptyStorage, {
            id: options.id,
            name: options.name || 'Nova campanha',
            createdBy: options.createdBy || 'local-master',
            now: options.now
        });
        campaign.metadata.migratedFromLegacy = false;
        persistCampaign(campaign);
        return migrations.clone(campaign);
    }

    function activateCampaign(id, options = {}) {
        if (!initialized) initialize({ installBridge: false });
        checkpoint({ reason: 'campaign-switch' });
        const stored = durableCampaignCache.get(String(id))
            || parse(readDirect(campaignStorageKey(id)), null);
        if (!stored) return null;

        activeCampaign = migrations.normalizeCampaign(stored);
        const registry = getRegistry();
        registry.activeCampaignId = activeCampaign.id;
        persistRegistry(registry);

        if (durableVirtualActive) seedTransientStorage(activeCampaign);
        else {
            bridgeSuspended++;
            try {
                migrations.restoreLegacyStorage(storage, activeCampaign, { removeMissing: true });
            } finally {
                bridgeSuspended--;
            }
        }
        emit('campaign-activated');
        if (options.reload !== false) root?.location?.reload?.();
        return getActiveCampaign();
    }

    function updateMetadata(changes = {}) {
        if (!activeCampaign) return null;
        const now = new Date().toISOString();
        activeCampaign.metadata = {
            ...(activeCampaign.metadata || {}),
            ...changes,
            name: String(changes.name || activeCampaign.metadata?.name || 'Campanha principal').trim()
        };
        activeCampaign.revision += 1;
        activeCampaign.updatedAt = now;
        activeCampaign.entityVersions.metadata = activeCampaign.revision;
        persistCampaign(activeCampaign);
        emit('metadata-updated');
        return getActiveCampaign();
    }

    function updateStateSlice(key, valueOrUpdater, options = {}) {
        if (!initialized) initialize({ installBridge: false });
        if (!activeCampaign || !key) return null;

        const stateKey = String(key);
        const previous = migrations.clone(activeCampaign.state?.[stateKey]);
        const nextValue = typeof valueOrUpdater === 'function'
            ? valueOrUpdater(migrations.clone(previous))
            : valueOrUpdater;
        if (nextValue === undefined) return getActiveCampaign();
        if (JSON.stringify(previous) === JSON.stringify(nextValue) && options.force !== true) {
            return getActiveCampaign();
        }

        const now = options.now || new Date().toISOString();
        activeCampaign.state = {
            ...(activeCampaign.state || {}),
            [stateKey]: migrations.clone(nextValue)
        };
        activeCampaign.revision += 1;
        activeCampaign.updatedAt = now;
        activeCampaign.entityVersions = {
            ...(activeCampaign.entityVersions || {}),
            [String(options.entityKey || `state:${stateKey}`)]: activeCampaign.revision
        };
        persistCampaign(activeCampaign);
        emit(options.reason || `state:${stateKey}:updated`, { stateKey });
        return getActiveCampaign();
    }

    function applyRemoteCampaign(campaign, options = {}) {
        if (!initialized) initialize({ installBridge: false });
        if (!campaign || typeof campaign !== 'object' || !campaign.id) return null;

        const incoming = migrations.normalizeCampaign(campaign);
        incoming.sync = {
            ...(incoming.sync || {}),
            lastServerSequence: Math.max(
                Number(incoming.sync?.lastServerSequence) || 0,
                Number(options.sequence) || 0
            ),
            lastSyncedAt: new Date().toISOString()
        };

        if (options.transient === true) {
            if (!transientRemoteActive) {
                persistentCampaignBeforeTransient = activeCampaign
                    ? migrations.clone(activeCampaign)
                    : null;
            }
            transientRemoteActive = true;
            seedTransientStorage(incoming);
            activeCampaign = incoming;
            emit('remote-applied', {
                sequence: incoming.sync.lastServerSequence,
                transient: true
            });
            return getActiveCampaign();
        }

        transientRemoteActive = false;
        persistentCampaignBeforeTransient = null;
        transientStorageValues.clear();
        activeCampaign = incoming;
        persistCampaign(activeCampaign);

        if (durableVirtualActive) seedTransientStorage(activeCampaign);
        else {
            bridgeSuspended++;
            try {
                migrations.restoreLegacyStorage(storage, activeCampaign, { removeMissing: true });
            } finally {
                bridgeSuspended--;
            }
        }
        emit('remote-applied', { sequence: incoming.sync.lastServerSequence });
        return getActiveCampaign();
    }

    function isTransientRemoteCampaign() {
        return transientRemoteActive;
    }

    function endTransientRemoteCampaign() {
        if (!transientRemoteActive) return getActiveCampaign();

        const registry = getRegistry();
        const persistentId = persistentCampaignBeforeTransient?.id
            || storage?.getItem?.(ACTIVE_CAMPAIGN_KEY)
            || registry.activeCampaignId;
        const stored = persistentId
            ? (durableCampaignCache.get(String(persistentId))
                || parse(readDirect(campaignStorageKey(persistentId)), null))
            : null;

        transientRemoteActive = false;
        transientStorageValues.clear();
        activeCampaign = stored
            ? migrations.normalizeCampaign(stored)
            : (persistentCampaignBeforeTransient
                ? migrations.normalizeCampaign(persistentCampaignBeforeTransient)
                : null);
        persistentCampaignBeforeTransient = null;
        if (durableVirtualActive && activeCampaign) seedTransientStorage(activeCampaign);
        emit('transient-remote-ended');
        return getActiveCampaign();
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function resetForTests() {
        if (storageBridgeInstalled && root?.Storage?.prototype) {
            if (rawGetItem) root.Storage.prototype.getItem = rawGetItem;
            if (rawSetItem) root.Storage.prototype.setItem = rawSetItem;
            if (rawRemoveItem) root.Storage.prototype.removeItem = rawRemoveItem;
        }
        activeCampaign = null;
        initialized = false;
        checkpointScheduled = false;
        storageBridgeInstalled = false;
        bridgeSuspended = 0;
        rawGetItem = null;
        rawSetItem = null;
        rawRemoveItem = null;
        transientRemoteActive = false;
        durableVirtualActive = false;
        durableHydrated = false;
        durableBootstrapPlaceholder = false;
        durableReadyPromise = Promise.resolve(null);
        durableCampaignCache.clear();
        persistentCampaignBeforeTransient = null;
        transientStorageValues.clear();
        storage = null;
        listeners.clear();
    }

    const api = Object.freeze({
        REGISTRY_KEY,
        ACTIVE_CAMPAIGN_KEY,
        CAMPAIGN_KEY_PREFIX,
        REGISTRY_VERSION,
        campaignStorageKey,
        initialize,
        getActiveCampaign,
        getCampaigns,
        checkpoint,
        scheduleCheckpoint,
        createCampaign,
        activateCampaign,
        updateMetadata,
        updateStateSlice,
        applyRemoteCampaign,
        isTransientRemoteCampaign,
        endTransientRemoteCampaign,
        whenDurableReady,
        flushDurableStorage,
        getStorageStatus,
        subscribe,
        resetForTests
    });

    if (root?.document && root?.localStorage) {
        initialize();
        root.addEventListener?.('pagehide', () => {
            checkpoint({ reason: 'pagehide' });
            void durable?.flush?.();
        });
        root.document.addEventListener?.('visibilitychange', () => {
            if (root.document.visibilityState === 'hidden') {
                checkpoint({ reason: 'visibility-hidden' });
                void durable?.flush?.();
            }
        });
    }

    return api;
});
