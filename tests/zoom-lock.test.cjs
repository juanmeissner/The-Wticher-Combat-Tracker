const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const indexSource = read('index.html');
const zoomLockStyles = read('zoom-lock.css');
const zoomLockSource = read(path.join('js', 'zoom-lock.js'));
const workerSource = read(path.join('js', 'service-worker.js'));

assert.match(indexSource, /maximum-scale=1\.0/);
assert.match(indexSource, /minimum-scale=1\.0/);
assert.match(indexSource, /user-scalable=no/);
assert.match(indexSource, /zoom-lock\.css/);
assert.match(indexSource, /<script src="js\/zoom-lock\.js"><\/script>/);

assert.match(zoomLockStyles, /touch-action:\s*pan-x pan-y/);
assert.match(zoomLockStyles, /-webkit-text-size-adjust:\s*100%/);

assert.match(zoomLockSource, /gesturestart/);
assert.match(zoomLockSource, /gesturechange/);
assert.match(zoomLockSource, /event\.touches\.length > 1/);
assert.match(zoomLockSource, /event\.ctrlKey \|\| event\.metaKey/);
assert.match(zoomLockSource, /\['\+', '-', '=', '0'\]/);
assert.match(zoomLockSource, /passive:\s*false/);

assert.match(workerSource, /witcher-combat-tracker-v105/);
assert.match(workerSource, /zoom-lock\.css/);
assert.match(workerSource, /js\/zoom-lock\.js/);

console.log('✓ Bloqueio global de zoom e distribuição offline validados.');
