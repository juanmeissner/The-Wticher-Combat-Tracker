(function (root, factory) {
    const migrations = root?.campaignMigrations
        || (typeof require === 'function' ? require('./campaign-migrations.js') : null);
    const api = factory(root, migrations);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.campaignStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, migrations) {
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
    let rawSetItem = null;
    let rawRemoveItem = null;

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
        writeDirect(campaignStorageKey(campaign.id), JSON.stringify(campaign));
        updateRegistryEntry(campaign);
    }

    function emit(reason, detail = {}) {
        const event = {
            reason,
            campaign: getActiveCampaign(),
            revision: activeCampaign?.revision || 0,
            ...detail
        };
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

        activeCampaign = stored
            ? migrations.normalizeCampaign(stored)
            : migrations.createCampaignFromLegacy(storage, {
                name: options.name,
                createdBy: options.createdBy,
                now: options.now
            });

        persistCampaign(activeCampaign);
        initialized = true;
        if (options.installBridge !== false) installLegacyStorageBridge();
        return getActiveCampaign();
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

        const snapshot = migrations.snapshotLegacyStorage(storage);
        const previous = JSON.stringify(activeCampaign.state?.compatibility || {});
        const next = JSON.stringify(snapshot);
        if (previous === next && options.force !== true) return getActiveCampaign();

        const now = options.now || new Date().toISOString();
        activeCampaign.state = migrations.buildCampaignState(snapshot);
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
        rawSetItem = prototype.setItem;
        rawRemoveItem = prototype.removeItem;

        prototype.setItem = function (key, value) {
            rawSetItem.call(this, key, value);
            if (this === storage && migrations.isCampaignStorageKey(key) && !bridgeSuspended) {
                scheduleCheckpoint(`storage:set:${key}`);
            }
        };
        prototype.removeItem = function (key) {
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
        const stored = parse(storage.getItem(campaignStorageKey(id)), null);
        if (!stored) return null;

        activeCampaign = migrations.normalizeCampaign(stored);
        const registry = getRegistry();
        registry.activeCampaignId = activeCampaign.id;
        persistRegistry(registry);

        bridgeSuspended++;
        try {
            migrations.restoreLegacyStorage(storage, activeCampaign, { removeMissing: true });
        } finally {
            bridgeSuspended--;
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
        activeCampaign = incoming;
        persistCampaign(activeCampaign);

        bridgeSuspended++;
        try {
            migrations.restoreLegacyStorage(storage, activeCampaign, { removeMissing: true });
        } finally {
            bridgeSuspended--;
        }
        emit('remote-applied', { sequence: incoming.sync.lastServerSequence });
        return getActiveCampaign();
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function resetForTests() {
        activeCampaign = null;
        initialized = false;
        checkpointScheduled = false;
        storageBridgeInstalled = false;
        bridgeSuspended = 0;
        rawSetItem = null;
        rawRemoveItem = null;
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
        applyRemoteCampaign,
        subscribe,
        resetForTests
    });

    if (root?.document && root?.localStorage) {
        initialize();
        root.addEventListener?.('pagehide', () => checkpoint({ reason: 'pagehide' }));
        root.document.addEventListener?.('visibilitychange', () => {
            if (root.document.visibilityState === 'hidden') checkpoint({ reason: 'visibility-hidden' });
        });
    }

    return api;
});
