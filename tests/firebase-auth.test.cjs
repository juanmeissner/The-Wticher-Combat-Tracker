const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('SDK Firebase é modular, local e carregado somente pela área de autenticação', () => {
    const packageSource = JSON.parse(read('package.json'));
    const indexSource = read('index.html');
    const loaderSource = read(path.join('js', 'auth', 'firebase-auth-loader.js'));
    const workerSource = read(path.join('js', 'service-worker.js'));

    assert.match(packageSource.dependencies.firebase, /^\^12\./);
    assert.match(packageSource.scripts['build:firebase-auth'], /esbuild/);
    assert.match(indexSource, /firebase-auth-loader\.js[\s\S]+firebase-auth-ui\.js/);
    assert.doesNotMatch(indexSource, /firebase-auth\.bundle\.js/);
    assert.match(loaderSource, /firebase-auth\.bundle\.js/);
    assert.match(workerSource, /RUNTIME_ASSETS[\s\S]+firebase-auth\.bundle\.js/);
});

test('cliente Firebase cobre cadastro, confirmação, login, Google, recuperação, perfil, senha e token', () => {
    const source = read(path.join('js', 'auth', 'firebase-auth-sdk-entry.js'));
    assert.match(source, /createUserWithEmailAndPassword/);
    assert.match(source, /sendEmailVerification/);
    assert.match(source, /signInWithEmailAndPassword/);
    assert.match(source, /signInWithPopup/);
    assert.match(source, /signInWithRedirect/);
    assert.match(source, /sendPasswordResetEmail/);
    assert.match(source, /reauthenticateWithCredential/);
    assert.match(source, /EmailAuthProvider\.credential/);
    assert.match(source, /updatePassword/);
    assert.match(source, /updateDisplayName/);
    assert.match(source, /browserLocalPersistence/);
    assert.match(source, /getIdToken/);
    assert.doesNotMatch(source, /firebase\/analytics/);
});

test('interface exige senha confirmada e mantém acesso legado recolhível', () => {
    const uiSource = read(path.join('js', 'auth', 'firebase-auth-ui.js'));
    const accountSource = read(path.join('js', 'collaboration', 'cloud-account.js'));
    const sessionSource = read(path.join('js', 'collaboration', 'collaboration-session.js'));
    const styles = read('collaboration.css');

    assert.match(uiSource, /firebaseAuthPasswordConfirm/);
    assert.match(uiSource, /As senhas informadas não são iguais/);
    assert.match(uiSource, /Já confirmei/);
    assert.match(uiSource, /Esqueci a senha/);
    assert.match(uiSource, /Gerenciar conta/);
    assert.match(uiSource, /firebaseCurrentPassword/);
    assert.match(uiSource, /changeFirebasePassword/);
    assert.match(uiSource, /Conta Google/);
    assert.match(accountSource, /cloud-account-legacy/);
    assert.match(sessionSource, /firebaseAuthUI.*getPanelMarkup/);
    assert.match(sessionSource, /firebaseAuthUI.*mountPanel/);
    assert.match(styles, /firebase-auth-panel/);
    assert.match(styles, /firebase-google-button/);
    assert.match(styles, /firebase-account-settings-body/);
});

test('bundle Firebase existe, é otimizado e não inclui Analytics', () => {
    const bundlePath = path.join(projectRoot, 'js', 'auth', 'firebase-auth.bundle.js');
    assert.equal(fs.existsSync(bundlePath), true);
    const bundle = fs.readFileSync(bundlePath, 'utf8');
    assert.ok(Buffer.byteLength(bundle) < 400_000, 'bundle de autenticação deve permanecer abaixo de 400 KB');
    assert.match(bundle, /firebaseAuthClient/);
    assert.doesNotMatch(bundle, /measurementId.*getAnalytics/);
});
