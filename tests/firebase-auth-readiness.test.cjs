const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const configApi = require(path.join(projectRoot, 'js', 'auth', 'firebase-auth-config.js'));

test('configuração Firebase permanece desativada enquanto os campos públicos estiverem vazios', () => {
    const result = configApi.validateConfig({});
    assert.equal(result.configured, false);
    assert.deepEqual(result.missing, ['apiKey', 'authDomain', 'projectId', 'appId']);
});

test('configuração Firebase aceita somente os identificadores públicos necessários', () => {
    const result = configApi.validateConfig({
        apiKey: 'public-api-key',
        authDomain: 'witcher-test.firebaseapp.com',
        projectId: 'witcher-test',
        appId: '1:123:web:abc',
        messagingSenderId: '123',
        ignoredValue: 'não deve sair no resultado'
    });
    assert.equal(result.configured, true);
    assert.equal(result.config.projectId, 'witcher-test');
    assert.equal(Object.hasOwn(result.config, 'ignoredValue'), false);
});

test('configuração Firebase bloqueia segredos administrativos no PWA', () => {
    const result = configApi.validateConfig({
        apiKey: 'public-api-key',
        authDomain: 'witcher-test.firebaseapp.com',
        projectId: 'witcher-test',
        appId: '1:123:web:abc',
        privateKey: 'não pode estar no cliente'
    });
    assert.equal(result.configured, false);
    assert.deepEqual(result.forbidden, ['privateKey']);
});

test('aplicativo Web registrado possui configuração pública válida', () => {
    const configPath = path.join(projectRoot, 'js', 'auth', 'firebase-project-config.js');
    delete require.cache[require.resolve(configPath)];
    require(configPath);
    const result = configApi.getStatus();
    assert.equal(result.configured, true);
    assert.equal(result.config.projectId, 'thewitcherrpgmanager');
    assert.equal(result.config.authDomain, 'thewitcherrpgmanager.firebaseapp.com');
    assert.equal(result.forbidden.length, 0);
});

test('fundação Firebase é carregada offline antes da conta legada', () => {
    const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
    const workerSource = fs.readFileSync(path.join(projectRoot, 'js', 'service-worker.js'), 'utf8');
    assert.match(indexSource, /firebase-project-config\.js[\s\S]+firebase-auth-config\.js[\s\S]+cloud-account\.js/);
    assert.match(workerSource, /firebase-project-config\.js/);
    assert.match(workerSource, /firebase-auth-config\.js/);
});

test('plano de migração preserva contas, campanhas e rollback legado', () => {
    const guide = fs.readFileSync(path.join(projectRoot, 'docs', 'firebase-auth-rollout.md'), 'utf8');
    assert.match(guide, /Nenhuma tabela atual será apagada ou renomeada/);
    assert.match(guide, /Campanhas continuarão vinculadas ao mesmo proprietário/);
    assert.match(guide, /login legado permanecerá disponível/);
    assert.match(guide, /rollback/i);
    assert.match(guide, /E-mail\/senha e Google habilitados/);
});
