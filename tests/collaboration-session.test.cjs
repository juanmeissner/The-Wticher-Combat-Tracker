const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const session = require('../js/collaboration/collaboration-session.js');

function memoryStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); }
    };
}

session.resetForTests();
const initial = session.initialize({ storage: memoryStorage() });
assert.equal(initial.role, 'master');
assert.equal(initial.mode, 'solo');
assert.equal(initial.connectionState, 'offline');
assert.ok(initial.deviceId.startsWith('device-'));
assert.equal(session.authorize('combat.turn.advance', null).decision, 'allow');

const player = session.normalizeSession({
    role: 'player',
    linkedParticipantId: 'geralt',
    linkedSheetId: 'sheet-geralt',
    deviceId: 'device-test'
});
session.resetForTests();
session.initialize({ storage: memoryStorage(), session: player });
assert.equal(session.isPlayer(), true);
assert.equal(session.authorize('participant.resource.adjust', 'geralt').decision, 'allow');
assert.equal(session.authorize('participant.resource.adjust', 'ciri').decision, 'deny');
assert.equal(session.authorize('sheet.update', 'sheet-geralt').decision, 'propose');
assert.equal(session.authorize('campaign.preferences.change', null).decision, 'deny');
assert.match(session.getStatusPresentation().label, /Jogador/);

const online = session.normalizeSession({
    mode: 'room',
    role: 'player',
    endpoint: 'https://room.example.workers.dev',
    roomCode: 'ABC234XY',
    memberToken: 'device-secret',
    linkedParticipantId: 'geralt',
    connectionState: 'synced'
});
assert.equal(online.mode, 'room');
assert.equal(online.roomCode, 'ABC234XY');
assert.equal(online.connectionState, 'synced');

session.resetForTests();
session.initialize({ storage: memoryStorage(), session: online });
let transientRemoteActive = true;
let restoredCampaignView = null;
global.campaignStore = {
    isTransientRemoteCampaign() { return transientRemoteActive; },
    endTransientRemoteCampaign() {
        transientRemoteActive = false;
        return { id: 'local-campaign', state: { combat: { combatants: [] } } };
    }
};
global.applyRemoteCampaignView = campaign => {
    restoredCampaignView = campaign;
    return true;
};
const accessEnded = session.endPlayerRoomAccess('revoked');
assert.equal(accessEnded.role, 'player');
assert.equal(accessEnded.mode, 'access-ended');
assert.equal(accessEnded.accessEndReason, 'revoked');
assert.equal(accessEnded.roomCode, null);
assert.equal(accessEnded.memberToken, null);
assert.equal(accessEnded.linkedParticipantId, null);
assert.equal(session.isPlayerAccessEnded(), true);
assert.match(session.getStatusPresentation().label, /Sem acesso/);
assert.equal(transientRemoteActive, false);
assert.equal(restoredCampaignView.id, 'local-campaign');
const restoredOffline = session.returnToOfflineModeAfterAccessEnded();
assert.equal(restoredOffline.mode, 'solo');
assert.equal(restoredOffline.role, 'master');
assert.equal(restoredOffline.connectionState, 'offline');
assert.equal(restoredOffline.accessEndReason, null);
assert.equal(session.isPlayerAccessEnded(), false);
delete global.campaignStore;
delete global.applyRemoteCampaignView;

const projectRoot = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'session-features.js'), 'utf8');
const collaborationSource = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'collaboration-session.js'), 'utf8');
const styles = fs.readFileSync(path.join(projectRoot, 'collaboration.css'), 'utf8');
const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');

assert.match(indexSource, /js\/collaboration\/protocol\.js[\s\S]+js\/campaign\/campaign-store\.js[\s\S]+js\/collaboration\/collaboration-session\.js/);
assert.match(indexSource, /collaboration\.css/);
assert.match(indexSource, /data-master-only[^>]+nextTurn\(\)/);
assert.match(sessionSource, /renderSessionToolsView\('collaboration'\)/);
assert.match(sessionSource, /masterOnlyViews/);
assert.match(sessionSource, /session-role-chip/);
assert.match(styles, /data-collaboration-role="player"/);
assert.match(workerSource, /witcher-combat-tracker-v116/);
assert.match(indexSource, /playerPadCollapsedBar/);
assert.match(sessionSource, /Calendário/);
assert.match(styles, /player-pad-collapsed/);
assert.match(styles, /data-collaboration-access="blocked"/);
assert.match(styles, /collaboration-access-ended/);
assert.match(collaborationSource, /endPlayerRoomAccess/);
assert.match(collaborationSource, /returnToOfflineModeAfterAccessEnded/);
assert.match(collaborationSource, /restorePersistentCampaignView/);
assert.match(collaborationSource, /Voltar ao modo offline/);
assert.match(styles, /collaboration-access-ended-actions/);
assert.match(workerSource, /js\/collaboration\/collaboration-session\.js/);

session.resetForTests();
console.log('✓ Sessão local, papéis e autorização contextual de Mestre/Jogador validados.');
