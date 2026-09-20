(function (root, factory) {
    const api = factory(root);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.campaignDatabase = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const DATABASE_NAME = 'witcher-combat-tracker';
    const DATABASE_VERSION = 1;
    const STORAGE_VERSION = 1;
    const CAMPAIGN_STORE = 'campaigns';
    const RECOVERY_STORE = 'campaign-recovery';
    const META_STORE = 'meta';
    const DEFAULT_SAVE_DELAY = 220;
    const WARNING_USAGE_RATIO = 0.9;

    const listeners = new Set();
    let databasePromise = null;
    let ready = false;
    let failed = false;
    let lastError = null;
    let lastSavedAt = null;
    let recoveredCampaignIds = [];

    function clone(value) {
        if (value === undefined) return undefined;
        return JSON.parse(JSON.stringify(value));
    }

    function checksum(value) {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        let hash = 0x811c9dc5;

        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 0x01000193);
        }

        return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
    }

    function createRecord(campaign, savedAt = new Date().toISOString()) {
        const snapshot = clone(campaign);
        const serialized = JSON.stringify(snapshot);
        return {
            id: String(snapshot.id),
            storageVersion: STORAGE_VERSION,
            schemaVersion: Number(snapshot.schemaVersion) || 1,
            revision: Math.max(0, Number(snapshot.revision) || 0),
            savedAt,
            bytes: serialized.length * 2,
            checksum: checksum(serialized),
            campaign: snapshot
        };
    }

    function isValidRecord(record) {
        if (!record || typeof record !== 'object' || !record.campaign || !record.id) return false;
        if (String(record.campaign.id) !== String(record.id)) return false;
        return record.checksum === checksum(JSON.stringify(record.campaign));
    }

    function isQuotaError(error) {
        return error?.name === 'QuotaExceededError'
            || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
            || Number(error?.code) === 22
            || Number(error?.code) === 1014;
    }

    function emit(reason, detail = {}) {
        const event = { reason, ...detail, status: getStatus() };
        listeners.forEach(listener => listener(event));
        if (root?.dispatchEvent && root?.CustomEvent) {
            root.dispatchEvent(new CustomEvent('campaign-storage:changed', { detail: event }));
            if (reason === 'quota-warning' || reason === 'quota-exceeded') {
                root.dispatchEvent(new CustomEvent('campaign-storage:warning', { detail: event }));
            }
        }
        return event;
    }

    function openDatabase() {
        if (databasePromise) return databasePromise;
        if (!root?.indexedDB) {
            failed = true;
            lastError = new Error('IndexedDB indisponível');
            return Promise.resolve(null);
        }

        databasePromise = new Promise(resolve => {
            const request = root.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(CAMPAIGN_STORE)) {
                    database.createObjectStore(CAMPAIGN_STORE, { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains(RECOVERY_STORE)) {
                    database.createObjectStore(RECOVERY_STORE, { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains(META_STORE)) {
                    database.createObjectStore(META_STORE, { keyPath: 'key' });
                }
            };
            request.onsuccess = () => {
                ready = true;
                failed = false;
                lastError = null;
                request.result.onversionchange = () => request.result.close();
                emit('ready');
                resolve(request.result);
            };
            request.onerror = () => {
                failed = true;
                lastError = request.error || new Error('Falha ao abrir IndexedDB');
                emit('error', { error: lastError });
                resolve(null);
            };
            request.onblocked = () => emit('blocked');
        });

        return databasePromise;
    }

    function requestResult(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Falha na operação IndexedDB'));
        });
    }

    async function readStore(storeName, method, argument) {
        const database = await openDatabase();
        if (!database) return method === 'getAll' ? [] : null;
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        return requestResult(argument === undefined ? store[method]() : store[method](argument));
    }

    async function recoverRecord(record) {
        if (isValidRecord(record)) return { record, recovered: false };
        const recovery = record?.id ? await readStore(RECOVERY_STORE, 'get', record.id) : null;
        if (!isValidRecord(recovery)) return { record: null, recovered: false };
        recoveredCampaignIds = [...new Set([...recoveredCampaignIds, recovery.id])];
        emit('recovered', { campaignId: recovery.id });
        return { record: recovery, recovered: true };
    }

    async function getCampaign(id) {
        const primary = await readStore(CAMPAIGN_STORE, 'get', String(id || ''));
        const result = await recoverRecord(primary);
        return result.record ? clone(result.record.campaign) : null;
    }

    async function getAllCampaigns() {
        const records = await readStore(CAMPAIGN_STORE, 'getAll');
        const campaigns = [];
        for (const record of records || []) {
            const result = await recoverRecord(record);
            if (result.record) campaigns.push(clone(result.record.campaign));
        }
        return campaigns;
    }

    async function putCampaign(campaign) {
        const database = await openDatabase();
        if (!database || !campaign?.id) return false;
        const record = createRecord(campaign);

        return new Promise((resolve, reject) => {
            const transaction = database.transaction([CAMPAIGN_STORE, RECOVERY_STORE, META_STORE], 'readwrite');
            const campaigns = transaction.objectStore(CAMPAIGN_STORE);
            const recovery = transaction.objectStore(RECOVERY_STORE);
            const meta = transaction.objectStore(META_STORE);
            const previousRequest = campaigns.get(record.id);

            previousRequest.onsuccess = () => {
                if (isValidRecord(previousRequest.result)) recovery.put(previousRequest.result);
                campaigns.put(record);
                meta.put({ key: 'last-save', campaignId: record.id, savedAt: record.savedAt });
            };
            transaction.oncomplete = () => {
                lastSavedAt = record.savedAt;
                failed = false;
                lastError = null;
                emit('saved', { campaignId: record.id, revision: record.revision });
                resolve(true);
            };
            transaction.onerror = () => reject(transaction.error || new Error('Falha ao salvar campanha'));
            transaction.onabort = () => reject(transaction.error || new Error('Gravação da campanha cancelada'));
        });
    }

    async function deleteCampaign(id) {
        const database = await openDatabase();
        if (!database) return false;
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([CAMPAIGN_STORE, RECOVERY_STORE], 'readwrite');
            transaction.objectStore(CAMPAIGN_STORE).delete(String(id));
            transaction.objectStore(RECOVERY_STORE).delete(String(id));
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error || new Error('Falha ao excluir campanha'));
        });
    }

    async function clear() {
        const database = await openDatabase();
        if (!database) return false;
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([CAMPAIGN_STORE, RECOVERY_STORE, META_STORE], 'readwrite');
            transaction.objectStore(CAMPAIGN_STORE).clear();
            transaction.objectStore(RECOVERY_STORE).clear();
            transaction.objectStore(META_STORE).clear();
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error || new Error('Falha ao limpar campanhas'));
        });
    }

    async function estimateStorage() {
        if (!root?.navigator?.storage?.estimate) return null;
        try {
            const estimate = await root.navigator.storage.estimate();
            const usage = Math.max(0, Number(estimate.usage) || 0);
            const quota = Math.max(0, Number(estimate.quota) || 0);
            const ratio = quota > 0 ? usage / quota : 0;
            const result = { usage, quota, ratio, remaining: Math.max(0, quota - usage) };
            if (ratio >= WARNING_USAGE_RATIO) emit('quota-warning', result);
            return result;
        } catch {
            return null;
        }
    }

    function createSaveQueue(options = {}) {
        const writer = options.writer || putCampaign;
        const delay = Math.max(0, Number(options.delay) || DEFAULT_SAVE_DELAY);
        const pending = new Map();
        let timer = null;
        let flushing = null;
        let pausedAfterError = false;

        async function flush() {
            if (timer) root?.clearTimeout?.(timer);
            timer = null;
            if (flushing) return flushing;
            if (!pending.size) return [];
            pausedAfterError = false;

            const batch = [...pending.values()];
            pending.clear();
            flushing = Promise.all(batch.map(async campaign => {
                try {
                    await writer(clone(campaign));
                    return { id: campaign.id, saved: true };
                } catch (error) {
                    lastError = error;
                    failed = true;
                    pausedAfterError = true;
                    if (!pending.has(String(campaign.id))) {
                        pending.set(String(campaign.id), clone(campaign));
                    }
                    if (isQuotaError(error)) emit('quota-exceeded', { error, campaignId: campaign.id });
                    else emit('error', { error, campaignId: campaign.id });
                    return { id: campaign.id, saved: false, error: String(error?.message || error) };
                }
            })).finally(() => {
                flushing = null;
                if (pending.size && !pausedAfterError) scheduleTimer();
            });
            return flushing;
        }

        function scheduleTimer() {
            if (timer) root?.clearTimeout?.(timer);
            timer = root?.setTimeout ? root.setTimeout(() => void flush(), delay) : null;
        }

        function schedule(campaign) {
            if (!campaign?.id) return false;
            pausedAfterError = false;
            pending.set(String(campaign.id), clone(campaign));
            scheduleTimer();
            emit('queued', { campaignId: campaign.id, pending: pending.size });
            return true;
        }

        function cancel() {
            if (timer) root?.clearTimeout?.(timer);
            timer = null;
            pending.clear();
        }

        return Object.freeze({ schedule, flush, cancel, getPendingCount: () => pending.size });
    }

    const saveQueue = createSaveQueue();

    async function initialize() {
        await openDatabase();
        if (ready) {
            root?.navigator?.storage?.persist?.().catch?.(() => false);
            void estimateStorage();
        }
        return getStatus();
    }

    async function exportSnapshot() {
        await saveQueue.flush();
        return {
            version: STORAGE_VERSION,
            exportedAt: new Date().toISOString(),
            campaigns: await getAllCampaigns()
        };
    }

    async function importSnapshot(snapshot, options = {}) {
        const campaigns = Array.isArray(snapshot?.campaigns) ? snapshot.campaigns : [];
        if (options.replace === true) await clear();
        for (const campaign of campaigns) {
            if (campaign?.id) await putCampaign(campaign);
        }
        return campaigns.length;
    }

    function getStatus() {
        return {
            supported: Boolean(root?.indexedDB),
            ready,
            failed,
            pending: saveQueue?.getPendingCount?.() || 0,
            lastSavedAt,
            lastError: lastError ? String(lastError.message || lastError) : null,
            recoveredCampaignIds: [...recoveredCampaignIds]
        };
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function resetForTests() {
        saveQueue.cancel();
        databasePromise = null;
        ready = false;
        failed = false;
        lastError = null;
        lastSavedAt = null;
        recoveredCampaignIds = [];
        listeners.clear();
    }

    return Object.freeze({
        DATABASE_NAME,
        DATABASE_VERSION,
        STORAGE_VERSION,
        DEFAULT_SAVE_DELAY,
        WARNING_USAGE_RATIO,
        checksum,
        createRecord,
        isValidRecord,
        isQuotaError,
        createSaveQueue,
        initialize,
        getCampaign,
        getAllCampaigns,
        putCampaign,
        scheduleSave: saveQueue.schedule,
        flush: saveQueue.flush,
        deleteCampaign,
        clear,
        estimateStorage,
        exportSnapshot,
        importSnapshot,
        getStatus,
        subscribe,
        resetForTests
    });
});
