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
    let pendingProviderLink = null;
    let unsubscribe = null;
    let resendTimer = null;
    const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;
    const VERIFICATION_COOLDOWN_KEY = 'dnd_firebase_verification_cooldown_v1';

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function safeHttpsUrl(value) {
        try {
            const url = new URL(String(value || ''));
            return url.protocol === 'https:' ? url.href : '';
        } catch {
            return '';
        }
    }

    function googleMark() {
        return `<svg class="firebase-google-mark" aria-hidden="true" viewBox="0 0 18 18" focusable="false">
            <path fill="#EA4335" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.909c1.702-1.567 2.683-3.874 2.683-6.614Z"/>
            <path fill="#4285F4" d="M9 18c2.43 0 4.468-.806 5.957-2.181l-2.909-2.258c-.806.54-1.835.859-3.048.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.826.956 4.038l3.007-2.332Z"/>
            <path fill="#34A853" d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"/>
        </svg>`;
    }

    function getPanelMarkup() {
        return '<section id="firebaseAuthPanel" class="firebase-auth-panel" aria-live="polite"></section>';
    }

    function feedbackMarkup() {
        return `${errorMessage ? `<p class="cloud-account-error" role="alert">${escapeHtml(errorMessage)}</p>` : ''}${noticeMessage ? `<p class="firebase-auth-notice" role="status">${escapeHtml(noticeMessage)}</p>` : ''}`;
    }

    function readVerificationCooldown() {
        try {
            const value = JSON.parse(root?.localStorage?.getItem?.(VERIFICATION_COOLDOWN_KEY) || 'null');
            if (!value?.uid || !Number.isFinite(Number(value.until))) return null;
            return { uid: String(value.uid), until: Number(value.until) };
        } catch {
            return null;
        }
    }

    function verificationCooldownSeconds() {
        if (!user?.uid) return 0;
        const value = readVerificationCooldown();
        if (!value || value.uid !== user.uid) return 0;
        const remaining = Math.ceil((value.until - Date.now()) / 1000);
        if (remaining > 0) return remaining;
        root?.localStorage?.removeItem?.(VERIFICATION_COOLDOWN_KEY);
        return 0;
    }

    function markVerificationSent() {
        if (!user?.uid) return;
        root?.localStorage?.setItem?.(VERIFICATION_COOLDOWN_KEY, JSON.stringify({
            uid: user.uid,
            until: Date.now() + VERIFICATION_RESEND_COOLDOWN_MS
        }));
    }

    function updateResendButton() {
        if (resendTimer) root?.clearTimeout?.(resendTimer);
        resendTimer = null;
        const button = root?.document?.getElementById?.('firebaseResendVerificationButton');
        if (!button || !user || user.emailVerified) return;
        const seconds = verificationCooldownSeconds();
        button.disabled = busy || seconds > 0;
        button.textContent = seconds > 0 ? `Reenviar em ${seconds}s` : 'Reenviar e-mail';
        if (seconds > 0) {
            resendTimer = root?.setTimeout?.(updateResendButton, 1_000);
            resendTimer?.unref?.();
        }
    }

    function renderLoading() {
        return `
            <div class="cloud-account-heading">
                <div><span>🔐</span><strong>Conta The Witcher RPG Manager</strong><small>Autenticação segura pelo Firebase</small></div>
            </div>
            <p class="cloud-account-copy">Carregando autenticação…</p>
        `;
    }

    function renderPendingProviderConfirmation() {
        return `
            <div class="cloud-account-heading">
                <div><span>🔗</span><strong>Vincular conta existente</strong><small>Confirmação obrigatória</small></div>
            </div>
            <p class="cloud-account-copy">O e-mail <strong>${escapeHtml(pendingProviderLink.email)}</strong> já possui uma conta. Entre com a senha original para adicionar o Google à mesma identidade, sem criar outra conta nem mover campanhas.</p>
            ${feedbackMarkup()}
            <form class="cloud-account-form firebase-provider-conflict" onsubmit="completePendingFirebaseGoogleLink(event)">
                <input class="session-input" type="email" value="${escapeHtml(pendingProviderLink.email)}" autocomplete="email" readonly aria-label="E-mail da conta existente">
                <input id="firebasePendingLinkPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="current-password" placeholder="Senha da conta existente" required>
                <button type="submit" class="session-primary" ${busy ? 'disabled' : ''}>${busy ? 'Vinculando…' : 'Confirmar e vincular Google'}</button>
                <button type="button" class="session-secondary" onclick="cancelPendingFirebaseProviderLink()" ${busy ? 'disabled' : ''}>Cancelar</button>
            </form>
            <small class="firebase-provider-warning">A vinculação só acontece depois que a senha correta é confirmada.</small>
        `;
    }

    function renderAnonymous() {
        if (pendingProviderLink) return renderPendingProviderConfirmation();
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
                ${reset ? '' : `<button type="button" class="firebase-google-button" onclick="loginFirebaseWithGoogle()" ${busy ? 'disabled' : ''}>${googleMark()}<span>Continuar com Google</span></button>`}
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
        const usesGoogle = user.providerIds?.includes('google.com');
        const providerCount = new Set(user.providerIds || []).size;
        const avatarUrl = safeHttpsUrl(user.photoURL);
        const profileName = user.displayName || user.email;
        const showEmail = Boolean(user.displayName && user.email);
        return `
            <div class="cloud-account-heading">
                <div class="firebase-account-identity">
                    ${avatarUrl
                        ? `<img class="firebase-account-avatar" src="${escapeHtml(avatarUrl)}" alt="" referrerpolicy="no-referrer" loading="lazy">`
                        : `<span class="firebase-account-avatar-fallback" aria-hidden="true">${user.emailVerified ? '✅' : '✉️'}</span>`}
                    <div class="firebase-account-text">
                        <strong>${title}</strong>
                        <small>${escapeHtml(profileName)}</small>
                        ${showEmail ? `<small class="firebase-account-email">${escapeHtml(user.email)}</small>` : ''}
                    </div>
                </div>
                <button type="button" class="session-small-button" onclick="logoutFirebaseAccount()" ${busy ? 'disabled' : ''}>Sair</button>
            </div>
            <p class="cloud-account-copy">${user.emailVerified
                ? 'Identidade confirmada. Suas campanhas permanentes estão disponíveis logo abaixo.'
                : `Enviamos uma mensagem para ${escapeHtml(user.email)}. Abra o link recebido e depois verifique novamente.`}</p>
            ${feedbackMarkup()}
            ${user.emailVerified ? '' : `
                <div class="cloud-account-actions">
                    <button type="button" class="session-primary" onclick="refreshFirebaseAccount()" ${busy ? 'disabled' : ''}>Já confirmei</button>
                    <button id="firebaseResendVerificationButton" type="button" class="session-secondary" onclick="resendFirebaseVerification()" ${busy || verificationCooldownSeconds() > 0 ? 'disabled' : ''}>Reenviar e-mail</button>
                </div>
                ${usesPassword ? `
                    <details class="firebase-email-correction">
                        <summary>Digitou o e-mail errado?</summary>
                        <form class="cloud-account-form" onsubmit="changeUnverifiedFirebaseEmail(event)">
                            <small>Enviaremos uma confirmação ao endereço correto. A troca será concluída somente depois que você abrir o novo link.</small>
                            <input id="firebaseCorrectedEmail" class="session-input" type="email" maxlength="254" autocapitalize="none" autocomplete="email" placeholder="E-mail correto" required>
                            <input id="firebaseEmailCorrectionPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="current-password" placeholder="Senha atual" required>
                            <button type="submit" class="session-secondary" ${busy ? 'disabled' : ''}>Enviar ao e-mail correto</button>
                        </form>
                    </details>` : ''}`}
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
                            <form class="cloud-account-form firebase-password-form" onsubmit="linkFirebasePasswordProvider(event)">
                                <strong>Adicionar senha</strong>
                                <small>Crie uma senha para também poder entrar com e-mail, mantendo a mesma conta e campanhas.</small>
                                <input id="firebaseProviderPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="Nova senha" required>
                                <input id="firebaseProviderPasswordConfirm" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="Repita a nova senha" required>
                                <button type="submit" class="session-secondary" ${busy ? 'disabled' : ''}>Adicionar E-mail e senha</button>
                            </form>`}
                        <div class="firebase-provider-management">
                            <strong>Métodos de acesso</strong>
                            <small>Os métodos abaixo entram na mesma identidade Firebase e acessam as mesmas campanhas.</small>
                            <div class="firebase-provider-list">
                                ${usesPassword ? `
                                    <div class="firebase-provider-row">
                                        <span><b>✉️ E-mail e senha</b><small>Conectado</small></span>
                                        ${providerCount > 1 ? `<button type="button" class="session-small-button firebase-provider-remove" onclick="unlinkFirebaseProvider('password', 'E-mail e senha')" ${busy ? 'disabled' : ''}>Desconectar</button>` : '<em>Único método</em>'}
                                    </div>` : ''}
                                ${usesGoogle ? `
                                    <div class="firebase-provider-row">
                                        <span><b>${googleMark()} Conta Google</b><small>Conectado</small></span>
                                        ${providerCount > 1 ? `<button type="button" class="session-small-button firebase-provider-remove" onclick="unlinkFirebaseProvider('google.com', 'Conta Google')" ${busy ? 'disabled' : ''}>Desconectar</button>` : '<em>Único método</em>'}
                                    </div>` : ''}
                            </div>
                            ${usesGoogle ? '' : `<button type="button" class="firebase-google-button firebase-google-link-button" onclick="linkFirebaseGoogleProvider()" ${busy ? 'disabled' : ''}>${googleMark()}<span>Vincular Conta Google</span></button>`}
                            <small class="firebase-provider-warning">Um método só pode ser removido quando outro continuar conectado.</small>
                        </div>
                    </div>
                </details>` : ''}
        `;
    }

    function renderPanel() {
        const panel = root?.document?.getElementById('firebaseAuthPanel');
        if (!panel) return false;
        panel.innerHTML = loading ? renderLoading() : (user ? renderAuthenticated() : renderAnonymous());
        updateResendButton();
        return true;
    }

    async function mountPanel() {
        renderPanel();
        try {
            client = await root.firebaseAuthLoader.load();
            const pendingError = client.consumeAuthError?.();
            if (pendingError) errorMessage = client.firebaseErrorMessage(pendingError);
            pendingProviderLink = client.getPendingProviderLink?.() || null;
            const returnedAction = client.consumeActionReturn?.();
            if (returnedAction === 'password-reset') {
                mode = 'login';
                noticeMessage = 'Senha redefinida. Entre novamente usando a nova senha.';
            } else if (returnedAction === 'email-verification') {
                noticeMessage = 'Confirmação concluída. Atualizando os dados da conta…';
            } else if (returnedAction === 'email-change') {
                noticeMessage = 'Novo endereço confirmado. Atualizando os dados da conta…';
            }
            if (!unsubscribe) unsubscribe = client.subscribe(nextUser => {
                user = nextUser;
                root?.cloudAccount?.useFirebaseUser?.(nextUser);
                loading = false;
                renderPanel();
            });
            user = client.getUser();
            root?.cloudAccount?.useFirebaseUser?.(user);
        } catch (error) {
            pendingProviderLink = client?.getPendingProviderLink?.() || pendingProviderLink;
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
            pendingProviderLink = client.getPendingProviderLink?.() || pendingProviderLink;
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
                mode = 'login';
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
                user = client.getUser() || user;
                root?.cloudAccount?.useFirebaseUser?.(user);
                markVerificationSent();
                noticeMessage = 'Conta criada. Verifique sua caixa de entrada para confirmar o e-mail.';
            });
        }
        return perform(() => client.login({ email, password }));
    }

    function loginWithGoogle() {
        return perform(() => client.loginWithGoogle());
    }

    function completePendingGoogleLink(event) {
        event?.preventDefault?.();
        const password = String(root?.document?.getElementById('firebasePendingLinkPassword')?.value || '');
        if (password.length < 8) {
            errorMessage = 'Informe a senha da conta existente.';
            renderPanel();
            return false;
        }
        return perform(async () => {
            user = await client.completePendingGoogleLink({ password });
            pendingProviderLink = null;
            noticeMessage = 'Conta Google vinculada. Os dois métodos agora acessam as mesmas campanhas.';
        });
    }

    function cancelPendingProviderLink() {
        client?.cancelPendingProviderLink?.();
        pendingProviderLink = null;
        errorMessage = '';
        noticeMessage = 'Vinculação cancelada. Nenhuma conta ou campanha foi alterada.';
        renderPanel();
        return true;
    }

    function linkGoogleProvider() {
        return perform(async () => {
            const linkedUser = await client.linkGoogleProvider();
            if (linkedUser) {
                user = linkedUser;
                noticeMessage = 'Conta Google vinculada com sucesso.';
            }
        });
    }

    function linkPasswordProvider(event) {
        event?.preventDefault?.();
        const password = String(root?.document?.getElementById('firebaseProviderPassword')?.value || '');
        const confirmation = String(root?.document?.getElementById('firebaseProviderPasswordConfirm')?.value || '');
        if (password.length < 8) {
            errorMessage = 'A senha precisa ter pelo menos 8 caracteres.';
            renderPanel();
            return false;
        }
        if (password !== confirmation) {
            errorMessage = 'A senha e a confirmação não são iguais.';
            renderPanel();
            return false;
        }
        return perform(async () => {
            user = await client.linkPasswordProvider({ password });
            noticeMessage = 'Acesso por E-mail e senha adicionado à mesma conta.';
        });
    }

    function unlinkProvider(providerId, label) {
        const providers = new Set(user?.providerIds || []);
        if (providers.size <= 1) {
            errorMessage = 'Adicione outro método de acesso antes de desconectar o único método atual.';
            renderPanel();
            return false;
        }
        if (root?.confirm && !root.confirm(`Desconectar ${label}? Você não poderá mais entrar por esse método até vinculá-lo novamente.`)) return false;
        return perform(async () => {
            user = await client.unlinkProvider(providerId);
            noticeMessage = `${label} desconectado. Suas campanhas permanecem nesta conta.`;
        });
    }

    function resendVerification() {
        if (verificationCooldownSeconds() > 0) return false;
        return perform(async () => {
            await client.resendVerification();
            markVerificationSent();
            noticeMessage = 'Um novo e-mail de confirmação foi enviado.';
        });
    }

    function changeUnverifiedEmail(event) {
        event?.preventDefault?.();
        const email = formValue('firebaseCorrectedEmail').toLowerCase();
        const currentPassword = String(root?.document?.getElementById('firebaseEmailCorrectionPassword')?.value || '');
        if (!email || email === String(user?.email || '').toLowerCase()) {
            errorMessage = 'Informe um e-mail diferente do endereço atual.';
            renderPanel();
            return false;
        }
        if (currentPassword.length < 8) {
            errorMessage = 'Informe sua senha atual para confirmar a alteração.';
            renderPanel();
            return false;
        }
        return perform(async () => {
            const result = await client.changeUnverifiedEmail({ email, currentPassword });
            markVerificationSent();
            noticeMessage = `Enviamos a confirmação para ${result.email}. A troca será concluída ao abrir o link.`;
        });
    }

    function refreshAccount() {
        return perform(async () => {
            user = await client.refreshUser();
            root?.cloudAccount?.useFirebaseUser?.(user);
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
            let securityResult = null;
            try {
                securityResult = await root?.cloudAccount?.recordPasswordChanged?.();
            } catch { /* a senha já foi alterada pelo Firebase */ }
            noticeMessage = securityResult?.recorded === false
                ? 'Senha alterada. O histórico de segurança será atualizado quando a conexão estiver disponível.'
                : 'Senha alterada. As sessões antigas vinculadas foram encerradas.';
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
        return { mode, loading, busy, user: user ? { ...user } : null, pendingProviderLink: pendingProviderLink ? { ...pendingProviderLink } : null, errorMessage, noticeMessage };
    }

    const api = Object.freeze({
        getPanelMarkup,
        mountPanel,
        renderPanel,
        setMode,
        submit,
        loginWithGoogle,
        completePendingGoogleLink,
        cancelPendingProviderLink,
        linkGoogleProvider,
        linkPasswordProvider,
        unlinkProvider,
        resendVerification,
        changeUnverifiedEmail,
        refreshAccount,
        updateProfile,
        changePassword,
        logout,
        getState
    });

    root.setFirebaseAuthMode = setMode;
    root.submitFirebaseAuthForm = submit;
    root.loginFirebaseWithGoogle = loginWithGoogle;
    root.completePendingFirebaseGoogleLink = completePendingGoogleLink;
    root.cancelPendingFirebaseProviderLink = cancelPendingProviderLink;
    root.linkFirebaseGoogleProvider = linkGoogleProvider;
    root.linkFirebasePasswordProvider = linkPasswordProvider;
    root.unlinkFirebaseProvider = unlinkProvider;
    root.resendFirebaseVerification = resendVerification;
    root.changeUnverifiedFirebaseEmail = changeUnverifiedEmail;
    root.refreshFirebaseAccount = refreshAccount;
    root.updateFirebaseProfile = updateProfile;
    root.changeFirebasePassword = changePassword;
    root.logoutFirebaseAccount = logout;
    return api;
});
