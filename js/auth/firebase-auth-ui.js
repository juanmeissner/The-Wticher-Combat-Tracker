(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.firebaseAuthUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    let client = null;
    let user = null;
    let mode = 'login';
    let loading = true;
    let busy = false;
    let errorMessage = '';
    let noticeMessage = '';
    let unsubscribe = null;

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function getPanelMarkup() {
        return '<section id="firebaseAuthPanel" class="firebase-auth-panel" aria-live="polite"></section>';
    }

    function feedbackMarkup() {
        return `${errorMessage ? `<p class="cloud-account-error" role="alert">${escapeHtml(errorMessage)}</p>` : ''}${noticeMessage ? `<p class="firebase-auth-notice" role="status">${escapeHtml(noticeMessage)}</p>` : ''}`;
    }

    function renderLoading() {
        return `
            <div class="cloud-account-heading">
                <div><span>🔐</span><strong>Conta The Witcher RPG Manager</strong><small>Autenticação segura pelo Firebase</small></div>
            </div>
            <p class="cloud-account-copy">Carregando autenticação…</p>
        `;
    }

    function renderAnonymous() {
        const register = mode === 'register';
        const reset = mode === 'reset';
        return `
            <div class="cloud-account-heading">
                <div><span>🔐</span><strong>${reset ? 'Recuperar senha' : (register ? 'Criar conta' : 'Entrar na conta')}</strong><small>Firebase Authentication · opcional</small></div>
            </div>
            <p class="cloud-account-copy">${reset
                ? 'Informe seu e-mail para receber um link seguro de recuperação.'
                : (register ? 'Crie sua conta e confirme o e-mail antes de acessar dados permanentes.' : 'Use e-mail e senha ou continue com sua Conta Google.')}</p>
            ${feedbackMarkup()}
            <form class="cloud-account-form firebase-auth-form" onsubmit="submitFirebaseAuthForm(event)">
                ${register ? '<input id="firebaseAuthDisplayName" class="session-input" maxlength="80" autocomplete="name" placeholder="Nome exibido" required>' : ''}
                <input id="firebaseAuthEmail" class="session-input" type="email" maxlength="254" autocapitalize="none" autocomplete="email" placeholder="E-mail" required>
                ${reset ? '' : `<input id="firebaseAuthPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="Senha" required>`}
                ${register ? '<input id="firebaseAuthPasswordConfirm" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="Repita a senha" required>' : ''}
                <button type="submit" class="session-primary" ${busy ? 'disabled' : ''}>${busy ? 'Aguarde…' : (reset ? 'Enviar recuperação' : (register ? 'Criar e confirmar e-mail' : 'Entrar'))}</button>
                ${reset ? '' : `<button type="button" class="firebase-google-button" onclick="loginFirebaseWithGoogle()" ${busy ? 'disabled' : ''}><span aria-hidden="true">G</span> Continuar com Google</button>`}
                <div class="firebase-auth-links">
                    ${reset
                        ? '<button type="button" onclick="setFirebaseAuthMode(\'login\')">Voltar ao login</button>'
                        : `<button type="button" onclick="setFirebaseAuthMode('${register ? 'login' : 'register'}')">${register ? 'Já tenho uma conta' : 'Criar conta'}</button>${register ? '' : '<button type="button" onclick="setFirebaseAuthMode(\'reset\')">Esqueci a senha</button>'}`}
                </div>
            </form>
        `;
    }

    function renderAuthenticated() {
        const title = user.emailVerified ? 'Conta autenticada' : 'Confirme seu e-mail';
        const usesPassword = user.providerIds?.includes('password');
        return `
            <div class="cloud-account-heading">
                <div><span>${user.emailVerified ? '✅' : '✉️'}</span><strong>${title}</strong><small>${escapeHtml(user.displayName || user.email)}</small></div>
                <button type="button" class="session-small-button" onclick="logoutFirebaseAccount()" ${busy ? 'disabled' : ''}>Sair</button>
            </div>
            <p class="cloud-account-copy">${user.emailVerified
                ? 'Identidade confirmada. Suas campanhas permanentes estão disponíveis logo abaixo.'
                : `Enviamos uma mensagem para ${escapeHtml(user.email)}. Abra o link recebido e depois verifique novamente.`}</p>
            ${feedbackMarkup()}
            ${user.emailVerified ? '' : `
                <div class="cloud-account-actions">
                    <button type="button" class="session-primary" onclick="refreshFirebaseAccount()" ${busy ? 'disabled' : ''}>Já confirmei</button>
                    <button type="button" class="session-secondary" onclick="resendFirebaseVerification()" ${busy ? 'disabled' : ''}>Reenviar e-mail</button>
                </div>`}
            ${user.emailVerified ? `
                <details class="firebase-account-settings">
                    <summary>⚙️ Gerenciar conta</summary>
                    <div class="firebase-account-settings-body">
                        <form class="cloud-account-form" onsubmit="updateFirebaseProfile(event)">
                            <strong>Nome exibido</strong>
                            <small>Este nome identifica sua conta e pode ser alterado sem afetar suas campanhas.</small>
                            <input id="firebaseProfileDisplayName" class="session-input" maxlength="80" autocomplete="name" value="${escapeHtml(user.displayName || '')}" placeholder="Nome exibido" required>
                            <button type="submit" class="session-secondary" ${busy ? 'disabled' : ''}>Salvar nome</button>
                        </form>
                        ${usesPassword ? `
                            <form class="cloud-account-form firebase-password-form" onsubmit="changeFirebasePassword(event)">
                                <strong>Trocar senha</strong>
                                <small>Confirme a senha atual. A nova senha não será armazenada no aplicativo.</small>
                                <input id="firebaseCurrentPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="current-password" placeholder="Senha atual" required>
                                <input id="firebaseNewPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="Nova senha" required>
                                <input id="firebaseNewPasswordConfirm" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="Repita a nova senha" required>
                                <button type="submit" class="session-primary" ${busy ? 'disabled' : ''}>Alterar senha</button>
                            </form>` : `
                            <div class="firebase-provider-note">
                                <strong>Conta Google</strong>
                                <small>Esta conta não possui uma senha própria no aplicativo. A senha continua sendo administrada com segurança pela Conta Google.</small>
                            </div>`}
                    </div>
                </details>` : ''}
        `;
    }

    function renderPanel() {
        const panel = root?.document?.getElementById('firebaseAuthPanel');
        if (!panel) return false;
        panel.innerHTML = loading ? renderLoading() : (user ? renderAuthenticated() : renderAnonymous());
        return true;
    }

    async function mountPanel() {
        renderPanel();
        try {
            client = await root.firebaseAuthLoader.load();
            if (!unsubscribe) unsubscribe = client.subscribe(nextUser => {
                user = nextUser;
                root?.cloudAccount?.useFirebaseUser?.(nextUser);
                loading = false;
                renderPanel();
            });
            user = client.getUser();
            root?.cloudAccount?.useFirebaseUser?.(user);
        } catch (error) {
            errorMessage = String(error?.message || 'Não foi possível iniciar a autenticação.');
        } finally {
            loading = false;
            renderPanel();
        }
    }

    function setMode(nextMode) {
        mode = ['login', 'register', 'reset'].includes(nextMode) ? nextMode : 'login';
        errorMessage = '';
        noticeMessage = '';
        renderPanel();
    }

    function formValue(id) {
        return String(root?.document?.getElementById(id)?.value || '').trim();
    }

    async function perform(action) {
        if (!client || busy) return false;
        busy = true;
        errorMessage = '';
        noticeMessage = '';
        renderPanel();
        try {
            await action();
            return true;
        } catch (error) {
            errorMessage = client.firebaseErrorMessage(error);
            return false;
        } finally {
            busy = false;
            renderPanel();
        }
    }

    async function submit(event) {
        event?.preventDefault?.();
        const email = formValue('firebaseAuthEmail').toLowerCase();
        if (!email) return false;
        if (mode === 'reset') {
            return perform(async () => {
                await client.requestPasswordReset(email);
                noticeMessage = 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.';
            });
        }
        const password = String(root?.document?.getElementById('firebaseAuthPassword')?.value || '');
        if (password.length < 8) {
            errorMessage = 'A senha precisa ter pelo menos 8 caracteres.';
            renderPanel();
            return false;
        }
        if (mode === 'register') {
            const confirmation = String(root?.document?.getElementById('firebaseAuthPasswordConfirm')?.value || '');
            const displayName = formValue('firebaseAuthDisplayName');
            if (displayName.length < 2) {
                errorMessage = 'Informe o nome que será exibido na conta.';
                renderPanel();
                return false;
            }
            if (password !== confirmation) {
                errorMessage = 'As senhas informadas não são iguais.';
                renderPanel();
                return false;
            }
            return perform(async () => {
                await client.register({ email, password, displayName });
                noticeMessage = 'Conta criada. Verifique sua caixa de entrada para confirmar o e-mail.';
            });
        }
        return perform(() => client.login({ email, password }));
    }

    function loginWithGoogle() {
        return perform(() => client.loginWithGoogle());
    }

    function resendVerification() {
        return perform(async () => {
            await client.resendVerification();
            noticeMessage = 'Um novo e-mail de confirmação foi enviado.';
        });
    }

    function refreshAccount() {
        return perform(async () => {
            user = await client.refreshUser();
            noticeMessage = user?.emailVerified ? 'E-mail confirmado com sucesso.' : 'A confirmação ainda não foi identificada.';
        });
    }

    function updateProfile(event) {
        event?.preventDefault?.();
        const displayName = formValue('firebaseProfileDisplayName');
        if (displayName.length < 2) {
            errorMessage = 'Informe um nome com pelo menos 2 caracteres.';
            renderPanel();
            return false;
        }
        return perform(async () => {
            user = await client.updateDisplayName(displayName);
            noticeMessage = 'Nome atualizado com sucesso.';
        });
    }

    function changePassword(event) {
        event?.preventDefault?.();
        const currentPassword = String(root?.document?.getElementById('firebaseCurrentPassword')?.value || '');
        const newPassword = String(root?.document?.getElementById('firebaseNewPassword')?.value || '');
        const confirmation = String(root?.document?.getElementById('firebaseNewPasswordConfirm')?.value || '');
        if (newPassword.length < 8) {
            errorMessage = 'A nova senha precisa ter pelo menos 8 caracteres.';
            renderPanel();
            return false;
        }
        if (newPassword !== confirmation) {
            errorMessage = 'A nova senha e a confirmação não são iguais.';
            renderPanel();
            return false;
        }
        return perform(async () => {
            await client.changePassword({ currentPassword, newPassword });
            noticeMessage = 'Senha alterada com sucesso.';
        });
    }

    function logout() {
        return perform(async () => {
            await client.logout();
            user = null;
            mode = 'login';
            noticeMessage = 'Conta desconectada deste dispositivo.';
        });
    }

    function getState() {
        return { mode, loading, busy, user: user ? { ...user } : null, errorMessage, noticeMessage };
    }

    const api = Object.freeze({
        getPanelMarkup,
        mountPanel,
        renderPanel,
        setMode,
        submit,
        loginWithGoogle,
        resendVerification,
        refreshAccount,
        updateProfile,
        changePassword,
        logout,
        getState
    });

    root.setFirebaseAuthMode = setMode;
    root.submitFirebaseAuthForm = submit;
    root.loginFirebaseWithGoogle = loginWithGoogle;
    root.resendFirebaseVerification = resendVerification;
    root.refreshFirebaseAccount = refreshAccount;
    root.updateFirebaseProfile = updateProfile;
    root.changeFirebasePassword = changePassword;
    root.logoutFirebaseAccount = logout;
    return api;
});
