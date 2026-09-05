const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const realtime = require('../js/collaboration/realtime-client.js');

assert.equal(realtime.normalizeEndpoint(' https://sala.example.workers.dev/ '), 'https://sala.example.workers.dev');
assert.equal(realtime.normalizeEndpoint('javascript:alert(1)'), '');
assert.equal(realtime.normalizeEndpoint('not-a-url'), '');

const projectRoot = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
const sessionSource = fs.readFileSync(path.join(projectRoot, 'js', 'collaboration', 'collaboration-session.js'), 'utf8');
const appInit = fs.readFileSync(path.join(projectRoot, 'js', 'app-init.js'), 'utf8');
const wrangler = fs.readFileSync(path.join(projectRoot, 'cloudflare', 'wrangler.jsonc'), 'utf8');

assert.match(indexSource, /collaboration\/realtime-client\.js/);
assert.match(serviceWorker, /witcher-combat-tracker-v105/);
assert.match(serviceWorker, /collaboration\/realtime-client\.js/);
assert.match(sessionSource, /createCollaborationRoomFromView/);
assert.match(sessionSource, /joinCollaborationRoomFromView/);
assert.match(sessionSource, /participant_required/);
assert.match(appInit, /dnd_collaboration_endpoint_v1/);
assert.match(wrangler, /new_sqlite_classes/);
assert.match(wrangler, /CampaignRoom/);

console.log('✓ Cliente em tempo real, painel da sala e configuração Cloudflare validados.');
