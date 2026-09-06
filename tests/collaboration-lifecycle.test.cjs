const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../js/campaign/campaign-store.js');
const session = require('../js/collaboration/collaboration-session.js');

class BrowserMemoryStorage {
    constructor(initial = {}) {
        this.values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
    }
    getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
    setItem(key, value) { this.values.set(key, String(value)); }
    removeItem(key) { this.values.delete(key); }
    raw(key) { return this.values.has(key) ? this.values.get(key) : null; }
}

const localCombat = Object.freeze({
    version: 3,
    combatants: [{ id: 'local-geralt', name: 'Geralt local' }],
    activeTurnId: 'local-geralt',
    round: 4
});

function onlinePlayerSession() {
    return {
        mode: 'room',
        role: 'player',
        endpoint: 'https://room.example.workers.dev',
        roomCode: 'ABC234XY',
        roomName: 'Sala de teste',
        memberToken: 'device-secret',
        linkedParticipantId: 'remote-ciri',
        connectionState: 'synced'
    };
}

function remoteCampaign(localCampaign, round = 8) {
    const combat = {
        version: 3,
        combatants: [{ id: 'remote-ciri', name: 'Ciri remota' }],
        activeTurnId: 'remote-ciri',
        round
    };
    return {
        ...localCampaign,
        id: 'campaign-remote-room',
        revision: round,
        state: {
            ...localCampaign.state,
            combat,
            compatibility: { dnd_combat_session: JSON.stringify(combat) }
        }
    };
}

function setupLifecycle() {
    const browserStorage = new BrowserMemoryStorage({
        dnd_combat_session: JSON.stringify(localCombat)
    });
    global.Storage = BrowserMemoryStorage;
    global.localStorage = browserStorage;
    store.resetForTests();
    session.resetForTests();
    const localCampaign = store.initialize({
        storage: browserStorage,
        now: '2026-09-06T10:00:00.000Z'
    });
    session.initialize({ storage: browserStorage, session: onlinePlayerSession() });
    store.applyRemoteCampaign(remoteCampaign(localCampaign), { sequence: 8, transient: true });
    return { browserStorage, localCampaign };
}

test('saída, expulsão e encerramento restauram a campanha local preservada', () => {
    const previousStorage = global.Storage;
    const previousLocalStorage = global.localStorage;
    const previousApplyView = global.applyRemoteCampaignView;

    try {
        for (const reason of ['left', 'revoked', 'closed']) {
            const { browserStorage, localCampaign } = setupLifecycle();
            let renderedCampaign = null;
            global.applyRemoteCampaignView = campaign => {
                renderedCampaign = campaign;
                return true;
            };

            assert.equal(JSON.parse(browserStorage.getItem('dnd_combat_session')).round, 8);
            assert.equal(JSON.parse(browserStorage.raw('dnd_combat_session')).round, 4);

            const ended = session.endPlayerRoomAccess(reason);
            assert.equal(ended.mode, 'access-ended');
            assert.equal(ended.accessEndReason, reason);
            assert.equal(store.isTransientRemoteCampaign(), false);
            assert.equal(store.getActiveCampaign().id, localCampaign.id);
            assert.equal(renderedCampaign.id, localCampaign.id);
            assert.equal(JSON.parse(browserStorage.getItem('dnd_combat_session')).round, 4);
            assert.equal(JSON.parse(browserStorage.raw('dnd_combat_session')).round, 4);
        }
    } finally {
        store.resetForTests();
        session.resetForTests();
        global.Storage = previousStorage;
        global.localStorage = previousLocalStorage;
        global.applyRemoteCampaignView = previousApplyView;
    }
});

test('queda temporária e reconexão mantêm a campanha remota sem tocar na campanha local', () => {
    const previousStorage = global.Storage;
    const previousLocalStorage = global.localStorage;

    try {
        const { browserStorage, localCampaign } = setupLifecycle();
        session.setConnectionState('connecting');
        assert.equal(session.getSession().mode, 'room');
        assert.equal(store.isTransientRemoteCampaign(), true);
        assert.equal(JSON.parse(browserStorage.getItem('dnd_combat_session')).round, 8);
        assert.equal(JSON.parse(browserStorage.raw('dnd_combat_session')).round, 4);

        store.applyRemoteCampaign(remoteCampaign(localCampaign, 9), { sequence: 9, transient: true });
        session.setConnectionState('synced');
        assert.equal(session.getSession().connectionState, 'synced');
        assert.equal(store.isTransientRemoteCampaign(), true);
        assert.equal(JSON.parse(browserStorage.getItem('dnd_combat_session')).round, 9);
        assert.equal(JSON.parse(browserStorage.raw('dnd_combat_session')).round, 4);
    } finally {
        store.resetForTests();
        session.resetForTests();
        global.Storage = previousStorage;
        global.localStorage = previousLocalStorage;
    }
});
