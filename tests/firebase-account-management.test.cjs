const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const uiPath = path.join(projectRoot, 'js', 'auth', 'firebase-auth-ui.js');

function createHarness(initialUser) {
    const panel = { innerHTML: '' };
    const fields = {
        firebaseProfileDisplayName: { value: initialUser.displayName || '' },
        firebaseCurrentPassword: { value: 'senha-atual-segura' },
        firebaseNewPassword: { value: 'senha-nova-segura' },
        firebaseNewPasswordConfirm: { value: 'senha-nova-segura' }
    };
    let listener = null;
    const calls = [];
    const client = {
        subscribe(callback) {
            listener = callback;
            callback(initialUser);
            return () => {};
        },
        getUser: () => initialUser,
        firebaseErrorMessage: error => String(error?.message || error),
        async updateDisplayName(displayName) {
            calls.push(['profile', displayName]);
            return { ...initialUser, displayName };
        },
        async changePassword(payload) {
            calls.push(['password', payload]);
            return true;
        },
        async logout() {},
        async refreshUser() { return initialUser; },
        async resendVerification() {}
    };

    global.document = {
        getElementById(id) {
            if (id === 'firebaseAuthPanel') return panel;
            return fields[id] || null;
        }
    };
    global.firebaseAuthLoader = { load: async () => client };
    global.cloudAccount = { useFirebaseUser() {} };
    delete require.cache[require.resolve(uiPath)];
    const ui = require(uiPath);

    return { ui, panel, calls, emit: nextUser => listener?.(nextUser) };
}

test.afterEach(() => {
    delete global.document;
    delete global.firebaseAuthLoader;
    delete global.cloudAccount;
    delete global.firebaseAuthUI;
    delete global.updateFirebaseProfile;
    delete global.changeFirebasePassword;
});

test('conta por senha pode alterar nome e senha após confirmação da senha atual', async () => {
    const user = {
        uid: 'firebase-password-user',
        email: 'jogador@example.com',
        displayName: 'Jogador',
        emailVerified: true,
        providerIds: ['password']
    };
    const harness = createHarness(user);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Gerenciar conta/);
    assert.match(harness.panel.innerHTML, /firebaseCurrentPassword/);
    assert.match(harness.panel.innerHTML, /firebaseNewPasswordConfirm/);

    await harness.ui.updateProfile({ preventDefault() {} });
    await harness.ui.changePassword({ preventDefault() {} });

    assert.deepEqual(harness.calls, [
        ['profile', 'Jogador'],
        ['password', {
            currentPassword: 'senha-atual-segura',
            newPassword: 'senha-nova-segura'
        }]
    ]);
});

test('conta exclusivamente Google não exibe campos locais de senha', async () => {
    const user = {
        uid: 'firebase-google-user',
        email: 'jogador@gmail.com',
        displayName: 'Jogador Google',
        emailVerified: true,
        providerIds: ['google.com']
    };
    const harness = createHarness(user);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Conta Google/);
    assert.doesNotMatch(harness.panel.innerHTML, /firebaseCurrentPassword/);
    assert.doesNotMatch(harness.panel.innerHTML, /Alterar senha/);
});
