(function (root, factory) {
    const protocol = root?.collaborationProtocol
        || (typeof require === 'function' ? require('../collaboration/protocol.js') : null);
    const api = factory(protocol);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.campaignMigrations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (protocol) {
    'use strict';

    const CAMPAIGN_SCHEMA_VERSION = protocol?.CAMPAIGN_SCHEMA_VERSION || 1;
    const CAMPAIGN_PREFERENCES_KEY = 'dnd_campaign_preferences';
    const LEGACY_CAMPAIGN_STORAGE_KEYS = Object.freeze([
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
        'dnd_custom_library',
        CAMPAIGN_PREFERENCES_KEY
    ]);

    function clone(value) {
        if (value === undefined) return undefined;
        return JSON.parse(JSON.stringify(value));
    }

    function safeParse(rawValue, fallback) {
        if (rawValue === null || rawValue === undefined || rawValue === '') return clone(fallback);
        try {
            return JSON.parse(rawValue);
        } catch {
            return clone(fallback);
        }
    }

    function makeCampaignId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `campaign-${uuid}`;
        return `campaign-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function isCampaignStorageKey(key) {
        return LEGACY_CAMPAIGN_STORAGE_KEYS.includes(String(key || ''));
    }

    function snapshotLegacyStorage(storage) {
        const snapshot = {};
        LEGACY_CAMPAIGN_STORAGE_KEYS.forEach(key => {
            const value = storage?.getItem?.(key);
            if (value !== null && value !== undefined) snapshot[key] = String(value);
        });
        return snapshot;
    }

    function seedCampaignPreferences(storage) {
        const existing = safeParse(storage?.getItem?.(CAMPAIGN_PREFERENCES_KEY), null);
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) return existing;

        const legacy = safeParse(storage?.getItem?.('dnd_app_preferences'), {});
        return {
            carriedWeightMode: legacy?.carriedWeightMode === 'inventory' ? 'inventory' : 'equipped',
            rollModes: legacy?.rollModes && typeof legacy.rollModes === 'object'
                ? clone(legacy.rollModes)
                : {}
        };
    }

    function ensureCampaignPreferences(storage) {
        if (storage?.getItem?.(CAMPAIGN_PREFERENCES_KEY)) {
            return seedCampaignPreferences(storage);
        }

        const preferences = seedCampaignPreferences(storage);
        storage?.setItem?.(CAMPAIGN_PREFERENCES_KEY, JSON.stringify(preferences));
        return preferences;
    }

    function buildCampaignState(snapshot = {}) {
        const combat = safeParse(snapshot.dnd_combat_session, null) || {
            version: 3,
            combatants: safeParse(snapshot.dnd_players, []),
            activeTurnId: null,
            selectedId: null,
            round: 1,
            monsterCounter: Math.max(1, Number(snapshot.dnd_monsterCounter) || 1),
            playerCounter: Math.max(1, Number(snapshot.dnd_playerCounter) || 1)
        };

        return {
            combat,
            characterSheets: safeParse(snapshot.dnd_character_sheets, []),
            campaignClock: safeParse(snapshot.dnd_campaign_clock, null),
            history: safeParse(snapshot.dnd_session_history, []),
            encounters: safeParse(snapshot.dnd_saved_encounters, []),
            contentLibrary: safeParse(snapshot.dnd_custom_library, { items: [], abilities: [], monsters: [] }),
            reports: {
                lastCombat: safeParse(snapshot.dnd_last_combat_report, null)
            },
            preferences: safeParse(snapshot[CAMPAIGN_PREFERENCES_KEY], {
                carriedWeightMode: 'equipped',
                rollModes: {}
            }),
            compatibility: clone(snapshot)
        };
    }

    function createCampaignFromLegacy(storage, options = {}) {
        ensureCampaignPreferences(storage);
        const now = options.now || new Date().toISOString();
        const snapshot = snapshotLegacyStorage(storage);

        return {
            schemaVersion: CAMPAIGN_SCHEMA_VERSION,
            id: String(options.id || makeCampaignId()),
            revision: 0,
            createdAt: now,
            updatedAt: now,
            metadata: {
                name: String(options.name || 'Campanha principal').trim() || 'Campanha principal',
                createdBy: String(options.createdBy || 'local-master'),
                migratedFromLegacy: true
            },
            state: buildCampaignState(snapshot),
            entityVersions: {},
            sync: {
                lastServerSequence: 0,
                lastCheckpointAt: now
            }
        };
    }

    function normalizeCampaign(value, fallback = {}) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const now = fallback.now || new Date().toISOString();
        const snapshot = source.state?.compatibility && typeof source.state.compatibility === 'object'
            ? source.state.compatibility
            : {};

        return {
            schemaVersion: CAMPAIGN_SCHEMA_VERSION,
            id: String(source.id || fallback.id || makeCampaignId()),
            revision: Math.max(0, Math.floor(Number(source.revision) || 0)),
            createdAt: source.createdAt || now,
            updatedAt: source.updatedAt || now,
            metadata: {
                name: String(source.metadata?.name || fallback.name || 'Campanha principal'),
                createdBy: String(source.metadata?.createdBy || 'local-master'),
                migratedFromLegacy: source.metadata?.migratedFromLegacy !== false,
                ...(source.metadata || {})
            },
            state: {
                ...buildCampaignState(snapshot),
                ...(source.state || {}),
                compatibility: clone(snapshot)
            },
            entityVersions: source.entityVersions && typeof source.entityVersions === 'object'
                ? clone(source.entityVersions)
                : {},
            sync: {
                lastServerSequence: Math.max(0, Number(source.sync?.lastServerSequence) || 0),
                lastCheckpointAt: source.sync?.lastCheckpointAt || source.updatedAt || now,
                ...(source.sync || {})
            }
        };
    }

    function restoreLegacyStorage(storage, campaign, options = {}) {
        const snapshot = campaign?.state?.compatibility || {};
        const removeMissing = options.removeMissing === true;

        LEGACY_CAMPAIGN_STORAGE_KEYS.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
                storage?.setItem?.(key, String(snapshot[key]));
            } else if (removeMissing) {
                storage?.removeItem?.(key);
            }
        });

        return snapshotLegacyStorage(storage);
    }

    return Object.freeze({
        CAMPAIGN_SCHEMA_VERSION,
        CAMPAIGN_PREFERENCES_KEY,
        LEGACY_CAMPAIGN_STORAGE_KEYS,
        clone,
        safeParse,
        makeCampaignId,
        isCampaignStorageKey,
        snapshotLegacyStorage,
        seedCampaignPreferences,
        ensureCampaignPreferences,
        buildCampaignState,
        createCampaignFromLegacy,
        normalizeCampaign,
        restoreLegacyStorage
    });
});

