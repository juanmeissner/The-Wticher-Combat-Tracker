const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const uiPath = path.join(projectRoot, 'js', 'auth', 'firebase-auth-ui.js');

function createHarness(initialUser, options = {}) {
    const panel = { innerHTML: '' };
    const fields = {
        firebaseProfileDisplayName: { value: initialUser?.displayName || '' },
        firebaseAuthEmail: { value: 'jogador@example.com' },
        firebaseCurrentPassword: { value: 'senha-atual-segura' },
        firebaseNewPassword: { value: 'senha-nova-segura' },
        firebaseNewPasswordConfirm: { value: 'senha-nova-segura' },
        firebaseCorrectedEmail: { value: 'email-correto@example.com' },
        firebaseEmailCorrectionPassword: { value: 'senha-atual-segura' },
        firebasePendingLinkPassword: { value: 'senha-original-segura' },
        firebaseProviderPassword: { value: 'senha-adicional-segura' },
        firebaseProviderPasswordConfirm: { value: 'senha-adicional-segura' },
        firebaseResendVerificationButton: { disabled: false, textContent: '' }
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
        async requestPasswordReset(email) {
            calls.push(['reset', email]);
            return true;
        },
        async loginWithGoogle() {
            calls.push(['google']);
            return null;
        },
        getPendingProviderLink: () => options.pendingProviderLink || null,
        async completePendingGoogleLink(payload) {
            calls.push(['complete-google-link', payload]);
            return options.linkedUser || initialUser;
        },
        cancelPendingProviderLink() {
            calls.push(['cancel-provider-link']);
            return true;
        },
        async linkGoogleProvider() {
            calls.push(['link-google']);
            return { ...initialUser, providerIds: [...new Set([...(initialUser?.providerIds || []), 'google.com'])] };
        },
        async linkPasswordProvider(payload) {
            calls.push(['link-password', payload]);
            return { ...initialUser, providerIds: [...new Set([...(initialUser?.providerIds || []), 'password'])] };
        },
        async unlinkProvider(providerId) {
            calls.push(['unlink-provider', providerId]);
            return { ...initialUser, providerIds: (initialUser?.providerIds || []).filter(id => id !== providerId) };
        },
        consumeAuthError: () => options.authError || null,
        consumeActionReturn: () => options.returnedAction || '',
        async logout() {},
        async refreshUser() { return initialUser; },
        async resendVerification() { calls.push(['resend']); },
        async changeUnverifiedEmail(payload) {
            calls.push(['email', payload]);
            return { email: payload.email };
        }
    };

    const storage = new Map();

    global.document = {
        getElementById(id) {
            if (id === 'firebaseAuthPanel') return panel;
            return fields[id] || null;
        }
    };
    global.firebaseAuthLoader = { load: async () => client };
    global.cloudAccount = {
        useFirebaseUser() {},
        async recordPasswordChanged() {
            calls.push(['security']);
            return { recorded: true };
        }
    };
    global.localStorage = {
        getItem: key => storage.get(key) || null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: key => storage.delete(key)
    };
    global.confirm = () => options.confirmUnlink !== false;
    delete require.cache[require.resolve(uiPath)];
    const ui = require(uiPath);

    return { ui, panel, fields, calls, storage, emit: nextUser => listener?.(nextUser) };
}

test.afterEach(() => {
    delete global.document;
    delete global.firebaseAuthLoader;
    delete global.cloudAccount;
    delete global.localStorage;
    delete global.confirm;
    delete global.firebaseAuthUI;
    delete global.updateFirebaseProfile;
    delete global.changeFirebasePassword;
    delete global.changeUnverifiedFirebaseEmail;
    delete global.loginFirebaseWithGoogle;
    delete global.completePendingFirebaseGoogleLink;
    delete global.cancelPendingFirebaseProviderLink;
    delete global.linkFirebaseGoogleProvider;
    delete global.linkFirebasePasswordProvider;
    delete global.unlinkFirebaseProvider;
});

test('entrada anônima apresenta o botão Google oficial e aciona o provedor', async () => {
    const harness = createHarness(null);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /firebase-google-mark/);
    assert.match(harness.panel.innerHTML, /Continuar com Google/);
    const started = await harness.ui.loginWithGoogle();

    assert.equal(started, true);
    assert.deepEqual(harness.calls, [['google']]);
});

test('erro recebido depois do redirecionamento Google é traduzido no painel', async () => {
    const harness = createHarness(null, {
        authError: new Error('Este e-mail já usa outro método.')
    });
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Este e-mail já usa outro método/);
});

test('conflito de e-mail exige a senha original antes de vincular Google', async () => {
    const linkedUser = {
        uid: 'existing-password-user',
        email: 'jogador@example.com',
        displayName: 'Jogador',
        emailVerified: true,
        providerIds: ['password', 'google.com']
    };
    const harness = createHarness(null, {
        pendingProviderLink: { email: 'jogador@example.com', providerId: 'google.com' },
        authError: Object.assign(new Error('Conta existente.'), { code: 'auth/account-exists-with-different-credential' }),
        linkedUser
    });
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Vincular conta existente/);
    assert.match(harness.panel.innerHTML, /jogador@example\.com/);
    assert.match(harness.panel.innerHTML, /Confirmar e vincular Google/);

    const completed = await harness.ui.completePendingGoogleLink({ preventDefault() {} });
    assert.equal(completed, true);
    assert.deepEqual(harness.calls, [['complete-google-link', { password: 'senha-original-segura' }]]);
    assert.match(harness.panel.innerHTML, /Conta Google vinculada/);
});

test('vinculação pendente pode ser cancelada sem alterar a conta', async () => {
    const harness = createHarness(null, {
        pendingProviderLink: { email: 'jogador@example.com', providerId: 'google.com' }
    });
    await harness.ui.mountPanel();

    assert.equal(harness.ui.cancelPendingProviderLink(), true);
    assert.deepEqual(harness.calls, [['cancel-provider-link']]);
    assert.match(harness.panel.innerHTML, /Nenhuma conta ou campanha foi alterada/);
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
        }],
        ['security']
    ]);
});

test('recuperação mantém resposta neutra, retorna ao login e reconhece o retorno seguro', async () => {
    const harness = createHarness(null);
    await harness.ui.mountPanel();
    harness.ui.setMode('reset');

    const sent = await harness.ui.submit({ preventDefault() {} });
    assert.equal(sent, true);
    assert.deepEqual(harness.calls, [['reset', 'jogador@example.com']]);
    assert.match(harness.panel.innerHTML, /Entrar na conta/);
    assert.match(harness.panel.innerHTML, /Se o e-mail estiver cadastrado/);

    const returned = createHarness(null, { returnedAction: 'password-reset' });
    await returned.ui.mountPanel();
    assert.match(returned.panel.innerHTML, /Senha redefinida/);
    assert.match(returned.panel.innerHTML, /Entrar na conta/);
});

test('conta exclusivamente Google pode adicionar senha sem exibir troca de senha atual', async () => {
    const user = {
        uid: 'firebase-google-user',
        email: 'jogador@gmail.com',
        displayName: 'Jogador Google',
        emailVerified: true,
        photoURL: 'https://lh3.googleusercontent.com/avatar-example',
        providerIds: ['google.com']
    };
    const harness = createHarness(user);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Conta Google/);
    assert.match(harness.panel.innerHTML, /Adicionar senha/);
    assert.match(harness.panel.innerHTML, /firebaseProviderPasswordConfirm/);
    assert.match(harness.panel.innerHTML, /firebase-account-avatar/);
    assert.match(harness.panel.innerHTML, /Jogador Google/);
    assert.match(harness.panel.innerHTML, /jogador@gmail\.com/);
    assert.match(harness.panel.innerHTML, /referrerpolicy="no-referrer"/);
    assert.doesNotMatch(harness.panel.innerHTML, /firebaseCurrentPassword/);
    assert.doesNotMatch(harness.panel.innerHTML, /Alterar senha/);

    const linked = await harness.ui.linkPasswordProvider({ preventDefault() {} });
    assert.equal(linked, true);
    assert.deepEqual(harness.calls, [['link-password', { password: 'senha-adicional-segura' }]]);
    assert.match(harness.panel.innerHTML, /Acesso por E-mail e senha adicionado/);
});

test('conta com dois métodos pode desconectar um deles após confirmação', async () => {
    const user = {
        uid: 'firebase-multi-provider-user',
        email: 'jogador@example.com',
        displayName: 'Jogador',
        emailVerified: true,
        providerIds: ['password', 'google.com']
    };
    const harness = createHarness(user);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Métodos de acesso/);
    assert.equal((harness.panel.innerHTML.match(/Desconectar/g) || []).length, 2);

    const removed = await harness.ui.unlinkProvider('google.com', 'Conta Google');
    assert.equal(removed, true);
    assert.deepEqual(harness.calls, [['unlink-provider', 'google.com']]);
    assert.match(harness.panel.innerHTML, /Suas campanhas permanecem nesta conta/);
});

test('único método de acesso nunca apresenta ação de desconexão', async () => {
    const user = {
        uid: 'firebase-single-provider-user',
        email: 'jogador@example.com',
        displayName: 'Jogador',
        emailVerified: true,
        providerIds: ['password']
    };
    const harness = createHarness(user);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Único método/);
    assert.doesNotMatch(harness.panel.innerHTML, />Desconectar</);
    assert.match(harness.panel.innerHTML, /Vincular Conta Google/);
});

test('conta não confirmada corrige o e-mail e respeita intervalo entre envios', async () => {
    const user = {
        uid: 'firebase-unverified-user',
        email: 'email-errado@example.com',
        displayName: 'Jogador',
        emailVerified: false,
        providerIds: ['password']
    };
    const harness = createHarness(user);
    await harness.ui.mountPanel();

    assert.match(harness.panel.innerHTML, /Digitou o e-mail errado/);
    assert.match(harness.panel.innerHTML, /firebaseCorrectedEmail/);
    assert.equal(harness.fields.firebaseResendVerificationButton.disabled, false);

    const changed = await harness.ui.changeUnverifiedEmail({ preventDefault() {} });
    assert.equal(changed, true);
    assert.deepEqual(harness.calls, [[
        'email',
        { email: 'email-correto@example.com', currentPassword: 'senha-atual-segura' }
    ]]);
    assert.equal(harness.fields.firebaseResendVerificationButton.disabled, true);
    assert.match(harness.fields.firebaseResendVerificationButton.textContent, /^Reenviar em \d+s$/);

    const blockedResend = await harness.ui.resendVerification();
    assert.equal(blockedResend, false);
    assert.equal(harness.calls.length, 1);
});
