(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.collaborationOfflineQueue = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const DB_NAME = 'witcher-combat-collaboration';
    const DB_VERSION = 1;
    const STORE_NAME = 'pending-commands';
    const FALLBACK_KEY = 'dnd_collaboration_pending_commands_v1';
    let databasePromise = null;

    function normalizeEntry(value = {}) {
        const command = value.command && typeof value.command === 'object' ? value.command : null;
        if (!command?.id) return null;
        return {
            id: String(command.id),
            roomCode: String(value.roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
            command: JSON.parse(JSON.stringify(command)),
            queuedAt: value.queuedAt || new Date().toISOString(),
            attempts: Math.max(0, Math.floor(Number(value.attempts) || 0)),
            lastAttemptAt: value.lastAttemptAt || null
        };
    }

    function readFallback() {
        try {
            const parsed = JSON.parse(root?.localStorage?.getItem?.(FALLBACK_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.map(normalizeEntry).filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    function writeFallback(entries) {
        try { root?.localStorage?.setItem?.(FALLBACK_KEY, JSON.stringify(entries)); } catch { /* armazenamento indisponível */ }
    }

    function openDatabase() {
        if (!root?.indexedDB) return Promise.resolve(null);
        if (databasePromise) return databasePromise;
        databasePromise = new Promise(resolve => {
            let request;
            try { request = root.indexedDB.open(DB_NAME, DB_VERSION); } catch { resolve(null); return; }
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('roomCode', 'roomCode', { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
            request.onblocked = () => resolve(null);
        });
        return databasePromise;
    }

    async function useStore(mode, operation) {
        const db = await openDatabase();
        if (!db) return { supported: false, value: null };
        return new Promise(resolve => {
            let transaction;
            try { transaction = db.transaction(STORE_NAME, mode); } catch { resolve({ supported: false, value: null }); return; }
            const store = transaction.objectStore(STORE_NAME);
            let request;
            try { request = operation(store); } catch { resolve({ supported: false, value: null }); return; }
            request.onsuccess = () => resolve({ supported: true, value: request.result });
            request.onerror = () => resolve({ supported: false, value: null });
        });
    }

    async function enqueue(roomCode, command) {
        const entry = normalizeEntry({ roomCode, command });
        if (!entry) return false;
        const result = await useStore('readwrite', store => store.put(entry));
        if (result.supported) return true;
        const entries = readFallback().filter(current => current.id !== entry.id);
        entries.push(entry);
        writeFallback(entries.slice(-500));
        return true;
    }

    async function list(roomCode = '') {
        const normalizedRoom = String(roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const result = await useStore('readonly', store => store.getAll());
        const entries = result.supported ? (result.value || []) : readFallback();
        return entries.map(normalizeEntry).filter(entry => entry && (!normalizedRoom || entry.roomCode === normalizedRoom))
            .sort((left, right) => String(left.queuedAt).localeCompare(String(right.queuedAt)));
    }

    async function remove(commandId) {
        const id = String(commandId || '');
        if (!id) return false;
        const result = await useStore('readwrite', store => store.delete(id));
        if (result.supported) return true;
        writeFallback(readFallback().filter(entry => entry.id !== id));
        return true;
    }

    async function markAttempt(commandId) {
        const entries = await list();
        const entry = entries.find(current => current.id === String(commandId || ''));
        if (!entry) return false;
        entry.attempts += 1;
        entry.lastAttemptAt = new Date().toISOString();
        const result = await useStore('readwrite', store => store.put(entry));
        if (result.supported) return true;
        const fallback = readFallback().filter(current => current.id !== entry.id);
        fallback.push(entry);
        writeFallback(fallback.slice(-500));
        return true;
    }

    async function clear(roomCode = '') {
        const normalizedRoom = String(roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!normalizedRoom) {
            const result = await useStore('readwrite', store => store.clear());
            if (!result.supported) writeFallback([]);
            return true;
        }
        const entries = await list(normalizedRoom);
        await Promise.all(entries.map(entry => remove(entry.id)));
        return true;
    }

    function resetForTests() {
        databasePromise = null;
        writeFallback([]);
    }

    return Object.freeze({
        DB_NAME,
        DB_VERSION,
        STORE_NAME,
        FALLBACK_KEY,
        normalizeEntry,
        enqueue,
        list,
        remove,
        markAttempt,
        clear,
        resetForTests
    });
});
