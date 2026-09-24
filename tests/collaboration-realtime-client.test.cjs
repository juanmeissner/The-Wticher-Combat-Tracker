const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const realtime = require('../js/collaboration/realtime-client.js');

assert.equal(realtime.normalizeEndpoint(' https://sala.example.workers.dev/ '), 'https://sala.example.workers.dev');
assert.equal(realtime.normalizeEndpoint('javascript:alert(1)'), '');
assert.equal(realtime.normalizeEndpoint('not-a-url'), '');
assert.equal(realtime.DEFAULT_ENDPOINT, 'https://witcher-combat-collaboration.juanmeissnerf.workers.dev');
assert.equal(realtime.isLocalDevelopmentEndpoint('http://127.0.0.1:8787'), true);
assert.equal(realtime.isLocalDevelopmentEndpoint('https://outro-worker.example.com'), false);
assert.equal(realtime.saveEndpoint('https://outro-worker.example.com'), realtime.DEFAULT_ENDPOINT);
assert.equal(realtime.getServiceEndpoint(), realtime.DEFAULT_ENDPOINT);

const previousCampaign = {
    id: 'campaign-test', revision: 4, updatedAt: 'before',
    metadata: { name: 'Teste' }, entityVersions: {}, sync: {},
    state: {
        combat: { round: 1, combatants: [{ id: 'geralt', hpCurrent: 30 }, { id: 'ciri', hpCurrent: 24 }] },
        compatibility: { dnd_players: 'before', unchanged: 'same' },
        characterSheets: [{ id: 'sheet-geralt', level: 1 }]
    }
};
const nextCampaign = structuredClone(previousCampaign);
nextCampaign.revision = 5;
nextCampaign.updatedAt = 'after';
nextCampaign.state.combat.combatants[0].hpCurrent = 19;
nextCampaign.state.compatibility.dnd_players = 'after';
nextCampaign.state.characterSheets[0].level = 2;
const campaignPatch = realtime.buildCampaignPatch(previousCampaign, nextCampaign);
assert.equal(campaignPatch.state.combat.combatants.upsert.length, 1);
assert.equal(campaignPatch.state.combat.combatants.upsert[0].id, 'geralt');
assert.deepEqual(realtime.applyCampaignPatch(previousCampaign, campaignPatch), nextCampaign);
assert.equal(realtime.applyCampaignPatch({ ...previousCampaign, revision: 3 }, campaignPatch), null);

const projectRoot = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'collaboration-session.js'), 'utf8');
const appInit = fs.readFileSync(path.join(projectRoot, 'js', 'app-init.js'), 'utf8');
const wrangler = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'wrangler.jsonc'), 'utf8');

assert.match(indexSource, /collaboration\/realtime-client\.js/);
assert.match(indexSource, /collaboration\/offline-queue\.js/);
assert.match(serviceWorker, /witcher-combat-tracker-v186/);
assert.match(serviceWorker, /collaboration\/realtime-client\.js/);
assert.match(serviceWorker, /collaboration\/offline-queue\.js/);
assert.match(serviceWorker, /core\/performance\.js/);
assert.match(sessionSource, /createCollaborationRoomFromView/);
assert.match(sessionSource, /id="collaborationCreateName"[^>]+required/);
assert.match(sessionSource, /id="collaborationRoomName"[^>]+required/);
assert.doesNotMatch(sessionSource, /id="collaborationCreateName"[^>]+value=/);
assert.doesNotMatch(sessionSource, /id="collaborationRoomName"[^>]+value=/);
assert.match(sessionSource, /updateCollaborationCreateButtonState/);
assert.match(sessionSource, /joinCollaborationRoomFromView/);
assert.match(sessionSource, /participant_required/);
assert.match(sessionSource, /Salas abertas/);
assert.match(sessionSource, /Importar JSON/);
assert.match(sessionSource, /requestRevokeCollaborationMember/);
assert.match(sessionSource, /requestCloseCollaborationRoom/);
assert.match(sessionSource, /Acesso removido pelo Mestre/);
assert.match(sessionSource, /Entrar em outra sala/);
assert.match(fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'realtime-client.js'), 'utf8'), /handleTerminalAccessError/);
assert.match(fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'realtime-client.js'), 'utf8'), /transient/);
assert.doesNotMatch(sessionSource, /id="collaborationEndpoint"/);
assert.match(sessionSource, /conexão segura já está configurada/i);
assert.match(sessionSource, /Aprovar/);
assert.match(sessionSource, /resolveCollaborationConflict/);
assert.match(appInit, /dnd_collaboration_endpoint_v1/);
assert.match(wrangler, /new_sqlite_classes/);
assert.match(wrangler, /CampaignRoom/);
assert.match(wrangler, /RoomDirectory/);

console.log('✓ Cliente em tempo real, painel da sala e configuração Cloudflare validados.');
