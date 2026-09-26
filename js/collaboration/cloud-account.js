(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.cloudAccount = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const SESSION_KEY = 'dnd_cloud_account_session_v1';
    const MIGRATION_KEY = 'dnd_cloud_account_migration_v1';
    const DEVICE_KEY = 'dnd_cloud_account_device_v1';
    const REFRESH_INTERVAL_MS = 30_000;
    let accountSession = readSession();
    let firebaseUser = null;
    let firebaseCandidateUser = null;
    let remoteUser = null;
    let campaigns = [];
    let securityEvents = [];
    let accountDevices = [];
    let formMode = 'login';
    let loading = false;
    let errorMessage = '';
    let lastRefreshAt = 0;
    let migrationState = readMigrationState();

    function getAccountDeviceId() {
        let value = String(root?.localStorage?.getItem?.(DEVICE_KEY) || '').trim();
        if (value) return value;
        value = root?.crypto?.randomUUID?.()
            || `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
        root?.localStorage?.setItem?.(DEVICE_KEY, value);
        return value;
    }

    function getAccountDeviceLabel() {
        const platform = String(root?.navigator?.userAgentData?.platform || root?.navigator?.platform || '').trim();
        const displayMode = root?.matchMedia?.('(display-mode: standalone)')?.matches ? 'Aplicativo' : 'Navegador';
        return [displayMode, platform].filter(Boolean).join(' · ').slice(0, 80) || 'Dispositivo';
    }

    function readSession() {
        try {
            const value = JSON.parse(root?.localStorage?.getItem?.(SESSION_KEY) || 'null');
            if (!value?.token) return null;
            if (value.expiresAt && Date.parse(value.expiresAt) <= Date.now()) {
                root?.localStorage?.removeItem?.(SESSION_KEY);
                return null;
            }
            return value;
        } catch {
            root?.localStorage?.removeItem?.(SESSION_KEY);
            return null;
        }
    }

    function persistSession(value) {
        accountSession = value?.token ? value : null;
        if (accountSession) root?.localStorage?.setItem?.(SESSION_KEY, JSON.stringify(accountSession));
        else root?.localStorage?.removeItem?.(SESSION_KEY);
    }

    function readMigrationState() {
        try {
            const value = JSON.parse(root?.localStorage?.getItem?.(MIGRATION_KEY) || 'null');
            return value?.legacyUserId ? value : null;
        } catch {
            root?.localStorage?.removeItem?.(MIGRATION_KEY);
            return null;
        }
    }

    function persistMigrationState(value) {
        migrationState = value?.legacyUserId ? value : null;
        if (migrationState) root?.localStorage?.setItem?.(MIGRATION_KEY, JSON.stringify(migrationState));
        else root?.localStorage?.removeItem?.(MIGRATION_KEY);
    }

    function markMigrationStarted(method = '') {
        if (!accountSession?.token || !accountSession?.user?.id) return false;
        persistMigrationState({
            legacyUserId: String(accountSession.user.id),
            legacyUsername: String(accountSession.user.username || ''),
            method: String(method || ''),
            startedAt: migrationState?.startedAt || new Date().toISOString()
        });
        return true;
    }

    function getEndpoint() {
        return root?.collaborationRealtime?.getServiceEndpoint?.()
            || 'https://witcher-combat-collaboration.juanmeissnerf.workers.dev';
    }

    function isFirebaseAuthenticated() {
        return Boolean(firebaseUser?.uid && firebaseUser?.emailVerified && root?.firebaseAuthClient?.getIdToken);
    }

    function isAuthenticated() {
        return isFirebaseAuthenticated() || Boolean(accountSession?.token);
    }

    async function getBearerToken(forceRefresh = false) {
        if (isFirebaseAuthenticated()) return root.firebaseAuthClient.getIdToken(Boolean(forceRefresh));
        return String(accountSession?.token || '');
    }

    async function getCollaborationAccessToken(forceRefresh = false) {
        if (!isAuthenticated()) return '';
        return getBearerToken(Boolean(forceRefresh));
    }

    function getPublicIdentity() {
        const user = remoteUser || firebaseUser || accountSession?.user || null;
        if (!user) return null;
        return {
            id: String(remoteUser?.id || accountSession?.user?.id || firebaseUser?.uid || ''),
            displayName: String(user.displayName || user.username || user.email || 'Conta autenticada'),
            authProvider: String(remoteUser?.authProvider || (firebaseUser?.uid ? 'firebase' : 'legacy')),
            authenticated: true
        };
    }

    async function performRequest(path, options = {}, forceRefresh = false) {
        const bearerToken = await getBearerToken(forceRefresh);
        const response = await root.fetch(`${getEndpoint()}${path}`, {
            method: options.method || 'GET',
            headers: {
                'content-type': 'application/json',
                'x-witcher-device-id': getAccountDeviceId(),
                'x-witcher-device-label': getAccountDeviceLabel(),
                ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {})
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        let result = {};
        try { result = await response.json(); } catch { result = {}; }
        return { response, result };
    }

    async function request(path, options = {}) {
        let attempt = await performRequest(path, options);
        if (
            !attempt.response.ok
            && attempt.response.status === 403
            && attempt.result?.error === 'firebase_email_unverified'
            && isFirebaseAuthenticated()
        ) {
            attempt = await performRequest(path, options, true);
        }
        const { response, result } = attempt;
        if (!response.ok) {
            if (response.status === 401 && !isFirebaseAuthenticated()) {
                persistSession(null);
                remoteUser = null;
                campaigns = [];
                accountDevices = [];
            }
            const error = new Error(result.message || `Falha de conexão (${response.status}).`);
            error.code = result.error || 'cloud_account_request_failed';
            error.status = response.status;
            error.data = result;
            throw error;
        }
        return result;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeCampaignName(value) {
        return String(value || '').trim().replace(/\s+/g, ' ');
    }

    function campaignNameKey(value) {
        return normalizeCampaignName(value).toLowerCase();
    }

    function hasCampaignNameConflict(name, excludedCampaignId = '') {
        const key = campaignNameKey(name);
        return campaigns.find(campaign => (
            String(campaign.id) !== String(excludedCampaignId || '')
            && campaignNameKey(campaign.name) === key
        )) || null;
    }

    function getPanelMarkup() {
        const open = isAuthenticated() ? ' open' : '';
        return `<details class="cloud-account-legacy"${open}><summary>${isFirebaseAuthenticated() ? 'Campanhas permanentes da conta' : 'Acesso legado às campanhas Cloudflare'}</summary><section id="cloudAccountPanel" class="cloud-account-panel" aria-live="polite"></section></details>`;
    }

    function renderCampaigns() {
        if (!campaigns.length) {
            return '<p class="cloud-account-empty">Nenhuma campanha foi salva nesta conta.</p>';
        }
        return campaigns.map(campaign => `
            <article class="cloud-campaign-card">
                <div>
                    <strong>${escapeHtml(campaign.name)}</strong>
                    <small>Versão ${campaign.revision} · ${escapeHtml(new Date(campaign.updatedAt).toLocaleString('pt-BR'))}</small>
                </div>
                <div class="cloud-campaign-card-actions">
                    <button type="button" class="session-secondary" onclick="requestLoadCloudCampaign('${encodeURIComponent(campaign.id)}')">Carregar</button>
                    <button type="button" class="session-secondary" onclick="requestRenameCloudCampaign('${encodeURIComponent(campaign.id)}')">Renomear</button>
                    <button type="button" class="session-danger" onclick="requestDeleteCloudCampaign('${encodeURIComponent(campaign.id)}')" aria-label="Excluir ${escapeHtml(campaign.name)}">Excluir</button>
                </div>
            </article>
        `).join('');
    }

    function getLocalCampaigns() {
        return root?.campaignStore?.getCampaigns?.() || [];
    }

    function renderLocalCampaigns(localCampaigns = getLocalCampaigns()) {
        const activeId = root?.campaignStore?.getActiveCampaign?.()?.id;
        if (!localCampaigns.length) {
            return '<p class="cloud-account-empty">Nenhuma campanha permanente neste dispositivo.</p>';
        }
        return localCampaigns.map(campaign => `
            <article class="cloud-campaign-card cloud-campaign-card-local">
                <div>
                    <strong>${escapeHtml(campaign.name || 'Campanha local')}</strong>
                    <small>${String(campaign.id) === String(activeId) ? 'Ativa agora · ' : ''}Salva somente neste dispositivo</small>
                </div>
                <span class="campaign-storage-badge is-local">Dispositivo</span>
            </article>
        `).join('');
    }

    function renderLegacyLink() {
        if (accountSession?.token) return '';
        if (!isFirebaseAuthenticated() || !remoteUser) return '';
        const generatedFirebaseAccount = /^firebase_/i.test(String(remoteUser.username || ''));
        if (!generatedFirebaseAccount) {
            return `
                <p class="firebase-legacy-linked">
                    <span aria-hidden="true">🔗</span>
                    Conta antiga vinculada: <strong>@${escapeHtml(remoteUser.username)}</strong>
                </p>
            `;
        }
        return `
            <details class="firebase-legacy-link">
                <summary>🔗 Vincular conta antiga</summary>
                <div class="firebase-legacy-link-body">
                    <p>Use o usuário e a senha do acesso Cloudflare anterior. As campanhas das duas contas serão preservadas e reunidas.</p>
                    <form class="firebase-legacy-link-form" onsubmit="return linkFirebaseLegacyAccount(event)">
                        <input id="firebaseLegacyUsername" class="session-input" maxlength="32" autocapitalize="none" autocomplete="username" placeholder="Usuário antigo" aria-label="Usuário da conta antiga" required>
                        <input id="firebaseLegacyPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="current-password" placeholder="Senha antiga" aria-label="Senha da conta antiga" required>
                        <button type="submit" class="session-secondary" ${loading ? 'disabled' : ''}>Vincular e preservar campanhas</button>
                    </form>
                    <small>A senha é usada somente nesta confirmação e não fica salva no dispositivo.</small>
                </div>
            </details>
        `;
    }

    function renderLegacyMigration() {
        if (!accountSession?.token) return '';
        const legacy = accountSession.user || {};
        const candidate = firebaseCandidateUser;
        const started = Boolean(migrationState?.legacyUserId === legacy.id);
        let content = '';
        if (!candidate?.uid) {
            content = `
                <p>Crie uma conta com e-mail confirmado ou entre em uma conta Firebase existente. Suas campanhas antigas só serão transferidas depois da confirmação final.</p>
                <div class="cloud-account-actions legacy-migration-actions">
                    <button type="button" class="session-primary" onclick="beginLegacyAccountMigration('register')" ${loading ? 'disabled' : ''}>Criar acesso com e-mail</button>
                    <button type="button" class="session-secondary" onclick="beginLegacyAccountMigration('login')" ${loading ? 'disabled' : ''}>Já tenho uma conta</button>
                    <button type="button" class="session-secondary" onclick="beginLegacyAccountMigrationWithGoogle()" ${loading ? 'disabled' : ''}>Usar Conta Google</button>
                </div>
            `;
        } else if (!candidate.emailVerified) {
            content = `
                <p>Enviamos a confirmação para <strong>${escapeHtml(candidate.email)}</strong>. O acesso antigo continuará funcionando enquanto o e-mail não for confirmado.</p>
                <button type="button" class="session-primary" onclick="refreshLegacyMigrationVerification()" ${loading ? 'disabled' : ''}>Já confirmei o e-mail</button>
            `;
        } else {
            content = `
                <p>A identidade <strong>${escapeHtml(candidate.email)}</strong> está confirmada. Revise e conclua para transferir as campanhas e desativar a senha antiga.</p>
                <button type="button" class="session-primary" onclick="completeLegacyAccountMigration()" ${loading ? 'disabled' : ''}>Concluir migração</button>
            `;
        }
        return `
            <section class="legacy-migration-card${started ? ' is-pending' : ''}">
                <div class="legacy-migration-heading">
                    <span aria-hidden="true">🔐</span>
                    <div><strong>Atualizar conta antiga</strong><small>@${escapeHtml(legacy.username || 'conta antiga')}</small></div>
                </div>
                ${content}
                <small class="legacy-migration-safety">Nenhuma campanha será apagada. Se você interromper agora, poderá entrar novamente com a conta antiga e continuar depois.</small>
            </section>
        `;
    }

    function securityEventLabel(event) {
        if (event?.type === 'password_changed') return 'Senha alterada';
        if (event?.type === 'legacy_migration_completed') return 'Conta antiga migrada';
        if (event?.type === 'device_registered') return 'Novo dispositivo reconhecido';
        if (event?.type === 'device_revoked') return 'Acesso de dispositivo revogado';
        return 'Alteração de segurança';
    }

    function renderSecurityHistory() {
        if (!isFirebaseAuthenticated()) return '';
        const content = securityEvents.length
            ? securityEvents.map(event => {
                const revoked = Math.max(0, Number(event?.details?.revokedLegacySessions) || 0);
                const migrated = event?.type === 'legacy_migration_completed';
                const deviceEvent = event?.type === 'device_registered' || event?.type === 'device_revoked';
                const moved = Math.max(0, Number(event?.details?.movedCampaigns) || 0);
                const preserved = Math.max(0, Number(event?.details?.preservedLegacyCampaigns) || 0);
                const totalMigrated = moved + preserved;
                const detail = deviceEvent
                    ? String(event?.details?.label || 'Dispositivo')
                    : migrated
                    ? `${totalMigrated} campanha${totalMigrated === 1 ? '' : 's'} preservada${totalMigrated === 1 ? '' : 's'} · acesso antigo desativado`
                    : revoked > 0
                    ? `${revoked} sessão${revoked === 1 ? '' : 'ões'} antiga${revoked === 1 ? '' : 's'} encerrada${revoked === 1 ? '' : 's'}`
                    : 'Credenciais anteriores invalidadas pelo provedor';
                const date = new Date(event.createdAt);
                const timestamp = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR');
                return `
                    <li>
                        <span aria-hidden="true">🔑</span>
                        <div><strong>${escapeHtml(securityEventLabel(event))}</strong><small>${escapeHtml(detail)}${timestamp ? ` · ${escapeHtml(timestamp)}` : ''}</small></div>
                    </li>
                `;
            }).join('')
            : '<p class="cloud-account-empty">Nenhuma alteração de segurança registrada.</p>';
        return `
            <details class="cloud-security-history">
                <summary>🛡️ Histórico de segurança</summary>
                <div class="cloud-security-history-body">${securityEvents.length ? `<ul>${content}</ul>` : content}</div>
            </details>
        `;
    }

    function renderAccountDevices() {
        if (!isFirebaseAuthenticated()) return '';
        const activeDevices = accountDevices.filter(device => !device.revokedAt);
        const content = activeDevices.length
            ? activeDevices.map(device => {
                const date = new Date(device.lastSeenAt);
                const timestamp = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR');
                return `
                    <li class="cloud-device-row${device.current ? ' is-current' : ''}">
                        <span aria-hidden="true">${device.current ? '📱' : '💻'}</span>
                        <div><strong>${escapeHtml(device.label)}</strong><small>${device.current ? 'Este dispositivo' : 'Último acesso'}${timestamp ? ` · ${escapeHtml(timestamp)}` : ''}</small></div>
                        ${device.current
                            ? '<em>Atual</em>'
                            : `<button type="button" class="session-danger" onclick="requestRevokeCloudDevice('${encodeURIComponent(device.id)}')" ${loading ? 'disabled' : ''}>Revogar</button>`}
                    </li>
                `;
            }).join('')
            : '<p class="cloud-account-empty">Nenhum dispositivo ativo foi registrado.</p>';
        return `
            <details class="cloud-security-history cloud-account-devices">
                <summary>📱 Dispositivos com acesso</summary>
                <div class="cloud-security-history-body">${activeDevices.length ? `<ul>${content}</ul>` : content}</div>
            </details>
        `;
    }

    function renderAuthenticated() {
        const connectedUser = remoteUser || firebaseUser || accountSession?.user || {};
        const localCampaigns = getLocalCampaigns();
        return `
            <div class="cloud-account-heading">
                <div><span>☁️</span><strong>Campanhas na nuvem</strong><small>${escapeHtml(connectedUser.displayName || connectedUser.email || connectedUser.username || 'Conta conectada')}</small></div>
                <button type="button" class="session-small-button" onclick="logoutCloudAccount()" ${loading ? 'disabled' : ''}>Sair</button>
            </div>
            <p class="cloud-account-copy">As campanhas do dispositivo e as cópias privadas da conta permanecem separadas. Carregar uma campanha nunca apaga a campanha local atual.</p>
            ${errorMessage ? `<p class="cloud-account-error">${escapeHtml(errorMessage)}</p>` : ''}
            ${renderLegacyMigration()}
            ${renderLegacyLink()}
            ${renderAccountDevices()}
            ${renderSecurityHistory()}
            <section class="campaign-storage-section">
                <header><div><strong>💾 Neste dispositivo</strong><small>Disponíveis offline</small></div><span>${localCampaigns.length}</span></header>
                <div class="cloud-campaign-list">${renderLocalCampaigns(localCampaigns)}</div>
            </section>
            <section class="campaign-storage-section is-cloud">
                <header><div><strong>☁️ Na sua conta</strong><small>Privadas e acessíveis após login</small></div><span>${campaigns.length}</span></header>
            <div class="cloud-account-actions">
                <button type="button" class="session-primary" onclick="requestSaveActiveCampaignToCloud()" ${loading ? 'disabled' : ''}>${loading ? 'Aguarde...' : 'Salvar campanha atual'}</button>
                <button type="button" class="session-secondary" onclick="refreshCloudAccount()" ${loading ? 'disabled' : ''}>Atualizar lista</button>
            </div>
            <div class="cloud-campaign-list">${renderCampaigns()}</div>
            </section>
        `;
    }

    function renderAnonymous() {
        return `
            <div class="cloud-account-heading">
                <div><span>☁️</span><strong>Conta Cloudflare antiga</strong><small>Disponível somente para migração</small></div>
            </div>
            <p class="cloud-account-copy">Entre para recuperar suas campanhas antigas e transferi-las para uma conta Firebase confirmada.</p>
            ${errorMessage ? `<p class="cloud-account-error">${escapeHtml(errorMessage)}</p>` : ''}
            <div class="cloud-account-form">
                <input id="cloudAccountUsername" class="session-input" maxlength="32" autocapitalize="none" autocomplete="username" placeholder="Nome de usuário">
                <input id="cloudAccountPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="current-password" placeholder="Senha antiga">
                <button type="button" class="session-primary" onclick="loginCloudAccount()" ${loading ? 'disabled' : ''}>${loading ? 'Aguarde...' : 'Entrar e migrar'}</button>
            </div>
        `;
    }

    function renderPanel() {
        const panel = root?.document?.getElementById('cloudAccountPanel');
        if (!panel) return false;
        panel.innerHTML = isAuthenticated() ? renderAuthenticated() : renderAnonymous();
        return true;
    }

    function mountPanel() {
        renderPanel();
        if (isAuthenticated() && (!remoteUser || Date.now() - lastRefreshAt > REFRESH_INTERVAL_MS)) {
            void refreshAccount();
        }
    }

    function useFirebaseUser(nextUser) {
        const previousUid = firebaseCandidateUser?.uid || '';
        firebaseCandidateUser = nextUser?.uid ? { ...nextUser } : null;
        firebaseUser = nextUser?.emailVerified ? { ...nextUser } : null;
        if (previousUid !== (firebaseCandidateUser?.uid || '')) {
            remoteUser = null;
            campaigns = [];
            securityEvents = [];
            accountDevices = [];
            lastRefreshAt = 0;
        }
        const details = root?.document?.querySelector?.('.cloud-account-legacy');
        if (details) {
            const summary = details.querySelector?.('summary');
            if (summary) summary.textContent = firebaseUser
                ? 'Campanhas permanentes da conta'
                : 'Acesso legado às campanhas Cloudflare';
            if (firebaseCandidateUser || accountSession?.token) details.open = true;
        }
        renderPanel();
        if (firebaseUser && !accountSession?.token && !loading) void refreshAccount();
        return Boolean(firebaseUser);
    }

    function setFormMode(mode) {
        formMode = mode === 'register' ? 'register' : 'login';
        errorMessage = '';
        renderPanel();
    }

    function getFormValues() {
        return {
            displayName: String(root?.document?.getElementById('cloudAccountDisplayName')?.value || '').trim(),
            username: String(root?.document?.getElementById('cloudAccountUsername')?.value || '').trim().toLowerCase(),
            password: String(root?.document?.getElementById('cloudAccountPassword')?.value || ''),
            deviceId: root?.collaborationSession?.getSession?.().deviceId || ''
        };
    }

    async function authenticate(path, register) {
        const values = getFormValues();
        if (!/^[a-z0-9._-]{3,32}$/.test(values.username)) {
            errorMessage = 'Use de 3 a 32 caracteres no nome de usuário.';
            renderPanel();
            return false;
        }
        if (values.password.length < 8) {
            errorMessage = 'A senha precisa ter pelo menos 8 caracteres.';
            renderPanel();
            return false;
        }
        if (register && values.displayName.length < 2) {
            errorMessage = 'Informe o nome que será exibido na conta.';
            renderPanel();
            return false;
        }
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request(path, { method: 'POST', body: values });
            persistSession({
                token: result.token,
                expiresAt: result.expiresAt,
                user: result.user
            });
            campaigns = [];
            lastRefreshAt = 0;
            if (!register) markMigrationStarted('legacy');
            root?.showToast?.(register ? '☁️ Conta criada com sucesso.' : '☁️ Conta conectada.');
            loading = false;
            await refreshAccount();
            return true;
        } catch (error) {
            errorMessage = error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    function registerFromView() {
        return authenticate('/api/account/register', true);
    }

    function loginFromView() {
        return authenticate('/api/account/login', false);
    }

    function focusFirebasePanel(fieldId = '') {
        const panel = root?.document?.getElementById?.('firebaseAuthPanel');
        panel?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        if (fieldId) root?.setTimeout?.(() => root?.document?.getElementById?.(fieldId)?.focus?.(), 250);
    }

    function beginLegacyMigration(mode = 'register') {
        if (!markMigrationStarted(mode)) return false;
        root?.firebaseAuthUI?.setMode?.(mode === 'login' ? 'login' : 'register');
        focusFirebasePanel('firebaseAuthEmail');
        return true;
    }

    function beginLegacyMigrationWithGoogle() {
        if (!markMigrationStarted('google')) return false;
        focusFirebasePanel();
        return root?.firebaseAuthUI?.loginWithGoogle?.() || false;
    }

    async function refreshLegacyMigrationVerification() {
        if (loading) return false;
        await root?.firebaseAuthUI?.refreshAccount?.();
        const refreshed = root?.firebaseAuthUI?.getState?.().user || null;
        useFirebaseUser(refreshed);
        if (!refreshed?.emailVerified) root?.showToast?.('A confirmação ainda não foi identificada.');
        return Boolean(refreshed?.emailVerified);
    }

    async function completeLegacyMigration() {
        if (!isFirebaseAuthenticated() || !accountSession?.token || loading) return false;
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request('/api/account/migrate-legacy', {
                method: 'POST',
                body: { legacyToken: accountSession.token }
            });
            persistSession(null);
            persistMigrationState(null);
            remoteUser = result.user || remoteUser;
            campaigns = [];
            securityEvents = [];
            lastRefreshAt = 0;
            const total = (Number(result.movedCampaigns) || 0) + (Number(result.preservedLegacyCampaigns) || 0);
            root?.showToast?.(`✅ Migração concluída. ${total} campanha${total === 1 ? '' : 's'} preservada${total === 1 ? '' : 's'}.`);
            loading = false;
            await refreshAccount();
            return true;
        } catch (error) {
            errorMessage = error.code === 'legacy_campaign_conflict'
                ? 'Há campanhas com o mesmo identificador nas duas contas. Remova uma das cópias antes de concluir.'
                : error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    async function refreshAccount() {
        if (!isAuthenticated() || loading) return false;
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const [profile, cloudCampaigns, security, devices] = await Promise.all([
                request('/api/account/me'),
                request('/api/account/campaigns'),
                isFirebaseAuthenticated()
                    ? request('/api/account/security-events').catch(() => null)
                    : Promise.resolve(null),
                isFirebaseAuthenticated()
                    ? request('/api/account/devices').catch(() => null)
                    : Promise.resolve(null)
            ]);
            remoteUser = profile.user || null;
            if (!isFirebaseAuthenticated()) persistSession({ ...accountSession, user: profile.user });
            campaigns = Array.isArray(cloudCampaigns.campaigns) ? cloudCampaigns.campaigns : [];
            securityEvents = Array.isArray(security?.events) ? security.events : [];
            accountDevices = Array.isArray(devices?.devices) ? devices.devices : [];
            lastRefreshAt = Date.now();
            return true;
        } catch (error) {
            errorMessage = error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    async function linkLegacyAccount(event) {
        event?.preventDefault?.();
        if (!isFirebaseAuthenticated() || loading) return false;
        const usernameInput = root?.document?.getElementById('firebaseLegacyUsername');
        const passwordInput = root?.document?.getElementById('firebaseLegacyPassword');
        const username = String(usernameInput?.value || '').trim().toLowerCase();
        const password = String(passwordInput?.value || '');
        if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
            errorMessage = 'Informe o nome de usuário válido da conta antiga.';
            renderPanel();
            return false;
        }
        if (password.length < 8) {
            errorMessage = 'Informe a senha da conta antiga com pelo menos 8 caracteres.';
            renderPanel();
            return false;
        }
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request('/api/account/link-legacy', {
                method: 'POST',
                body: { username, password }
            });
            remoteUser = result.user || remoteUser;
            campaigns = [];
            lastRefreshAt = 0;
            const total = Number(result.movedCampaigns) || 0;
            root?.showToast?.(result.alreadyLinked
                ? '🔗 Esta conta antiga já estava vinculada.'
                : `🔗 Conta vinculada. ${total} campanha${total === 1 ? '' : 's'} reunida${total === 1 ? '' : 's'}.`);
            loading = false;
            await refreshAccount();
            return true;
        } catch (error) {
            errorMessage = error.code === 'legacy_campaign_conflict'
                ? 'Há campanhas com o mesmo identificador nas duas contas. Remova uma das cópias antes de vincular.'
                : error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    async function logout() {
        if (loading) return false;
        loading = true;
        renderPanel();
        const firebaseConnected = Boolean(firebaseCandidateUser?.uid);
        try { await request('/api/account/logout', { method: 'POST', body: {} }); } catch { /* a sessão local também deve terminar */ }
        if (firebaseConnected) await root?.firebaseAuthUI?.logout?.();
        persistSession(null);
        persistMigrationState(null);
        firebaseUser = null;
        firebaseCandidateUser = null;
        remoteUser = null;
        campaigns = [];
        securityEvents = [];
        accountDevices = [];
        errorMessage = '';
        loading = false;
        renderPanel();
        root?.showToast?.('Conta desconectada deste dispositivo.');
        return true;
    }

    async function recordPasswordChanged() {
        if (!isFirebaseAuthenticated()) return { recorded: false };
        try {
            const result = await request('/api/account/security/password-changed', {
                method: 'POST',
                body: {}
            });
            persistSession(null);
            if (result.event) {
                securityEvents = [result.event, ...securityEvents.filter(event => event.id !== result.event.id)].slice(0, 20);
            }
            renderPanel();
            return { ...result, recorded: true };
        } catch (error) {
            console.warn('Não foi possível registrar a troca de senha no histórico.', error);
            return { recorded: false };
        }
    }

    async function revokeDevice(deviceId) {
        if (!isFirebaseAuthenticated() || loading) return false;
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request(`/api/account/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' });
            accountDevices = accountDevices.map(device => device.id === deviceId
                ? { ...device, revokedAt: result.device?.revokedAt || new Date().toISOString() }
                : device);
            root?.showToast?.('🔒 Acesso do dispositivo revogado.');
            return true;
        } catch (error) {
            errorMessage = error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    function requestRevokeDevice(encodedId) {
        const deviceId = decodeURIComponent(encodedId);
        const device = accountDevices.find(entry => entry.id === deviceId);
        const action = () => void revokeDevice(deviceId);
        if (root?.openSessionConfirm) {
            root.openSessionConfirm({
                title: 'Revogar acesso deste dispositivo?',
                message: `${device?.label || 'Este dispositivo'} perderá o acesso às campanhas desta conta.`,
                confirmLabel: 'Revogar acesso',
                danger: true,
                onConfirm: action
            });
        } else if (root?.confirm?.(`Revogar o acesso de ${device?.label || 'este dispositivo'}?`)) action();
        return true;
    }

    function closeCampaignNameDialog() {
        root?.document?.getElementById('cloudCampaignNameDialog')?.remove();
    }

    function closeCampaignRenameDialog() {
        root?.document?.getElementById('cloudCampaignRenameDialog')?.remove();
    }

    function requestSaveActiveCampaign() {
        if (!isAuthenticated() || loading) return false;
        const campaign = root?.campaignStore?.getActiveCampaign?.();
        if (!campaign?.id) return false;
        const known = campaigns.find(entry => String(entry.id) === String(campaign.id));
        const suggestedName = String(known?.name || campaign.metadata?.name || '').trim();
        const modal = root?.document?.createElement?.('div');
        if (!modal) return false;
        closeCampaignNameDialog();
        modal.id = 'cloudCampaignNameDialog';
        modal.className = 'session-overlay';
        modal.innerHTML = `
            <section class="session-dialog cloud-campaign-name-dialog" role="dialog" aria-modal="true" aria-labelledby="cloudCampaignNameTitle">
                <h2 id="cloudCampaignNameTitle">Salvar campanha na nuvem</h2>
                <p>Escolha o nome que identificará esta campanha nos seus dispositivos.</p>
                <label class="collaboration-field">
                    <span>Nome da campanha</span>
                    <input id="cloudCampaignNameInput" class="session-input" maxlength="100" autocomplete="off" value="${escapeHtml(suggestedName)}" placeholder="Ex.: Caçada em Velen">
                </label>
                <p id="cloudCampaignNameError" class="cloud-account-error" hidden>Informe um nome para salvar a campanha.</p>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" onclick="closeCloudCampaignNameDialog()">Cancelar</button>
                    <button type="button" class="session-primary" onclick="confirmSaveActiveCampaignToCloud()">Salvar</button>
                </div>
            </section>
        `;
        root.document.body.appendChild(modal);
        const input = root.document.getElementById('cloudCampaignNameInput');
        input?.focus?.();
        input?.select?.();
        input?.addEventListener?.('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                void confirmSaveActiveCampaign();
            }
        });
        return true;
    }

    async function confirmSaveActiveCampaign() {
        const input = root?.document?.getElementById('cloudCampaignNameInput');
        const name = normalizeCampaignName(input?.value);
        const error = root?.document?.getElementById('cloudCampaignNameError');
        if (!name) {
            if (error) error.hidden = false;
            input?.focus?.();
            return false;
        }
        const activeCampaignId = root?.campaignStore?.getActiveCampaign?.()?.id || '';
        const duplicate = hasCampaignNameConflict(name, activeCampaignId);
        if (duplicate) {
            if (error) {
                error.textContent = `Já existe uma campanha chamada "${duplicate.name}" nesta conta.`;
                error.hidden = false;
            }
            input?.focus?.();
            return false;
        }
        const saved = await saveActiveCampaign(name);
        if (saved) {
            closeCampaignNameDialog();
        } else if (error) {
            error.textContent = errorMessage || 'Não foi possível salvar esta campanha agora.';
            error.hidden = false;
        }
        return saved;
    }

    async function saveActiveCampaign(nameOverride = '') {
        if (!isAuthenticated() || loading) return false;
        if (root?.collaborationSession?.isPlayer?.()) {
            errorMessage = 'Somente o Mestre pode salvar uma campanha na nuvem.';
            renderPanel();
            return false;
        }
        const campaign = root?.campaignStore?.checkpoint?.({ reason: 'cloud-campaign-save' })
            || root?.campaignStore?.getActiveCampaign?.();
        if (!campaign?.id) return false;
        const name = normalizeCampaignName(nameOverride || campaign.metadata?.name || '');
        if (!name) return false;
        const duplicate = hasCampaignNameConflict(name, campaign.id);
        if (duplicate) {
            errorMessage = `Já existe uma campanha chamada "${duplicate.name}" nesta conta.`;
            renderPanel();
            return false;
        }
        const cloudCampaign = {
            ...campaign,
            metadata: { ...(campaign.metadata || {}), name }
        };
        const known = campaigns.find(entry => String(entry.id) === String(campaign.id));
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request(`/api/account/campaigns/${encodeURIComponent(campaign.id)}`, {
                method: 'PUT',
                body: {
                    campaign: cloudCampaign,
                    name,
                    expectedRevision: known?.revision ?? null
                }
            });
            const index = campaigns.findIndex(entry => String(entry.id) === String(campaign.id));
            if (index >= 0) campaigns[index] = result.cloud;
            else campaigns.unshift(result.cloud);
            root?.showToast?.(`☁️ ${name} salva na nuvem.`);
            return true;
        } catch (error) {
            errorMessage = error.code === 'cloud_campaign_conflict'
                ? 'Existe uma versão mais recente. Atualize a lista antes de decidir qual versão carregar.'
                : error.code === 'duplicate_campaign_name'
                ? 'Já existe uma campanha com esse nome nesta conta.'
                : error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    function requestRenameCampaign(encodedId) {
        if (!isAuthenticated() || loading) return false;
        const campaignId = decodeURIComponent(encodedId);
        const campaign = campaigns.find(entry => String(entry.id) === String(campaignId));
        if (!campaign) return false;
        const modal = root?.document?.createElement?.('div');
        if (!modal) return false;
        closeCampaignRenameDialog();
        modal.id = 'cloudCampaignRenameDialog';
        modal.className = 'session-overlay';
        modal.innerHTML = `
            <section class="session-dialog cloud-campaign-name-dialog" role="dialog" aria-modal="true" aria-labelledby="cloudCampaignRenameTitle">
                <h2 id="cloudCampaignRenameTitle">Renomear campanha</h2>
                <p>O ID permanente será preservado. Todos os próximos salvamentos continuarão atualizando esta mesma campanha.</p>
                <label class="collaboration-field">
                    <span>Novo nome</span>
                    <input id="cloudCampaignRenameInput" class="session-input" maxlength="100" autocomplete="off" value="${escapeHtml(campaign.name)}">
                </label>
                <p id="cloudCampaignRenameError" class="cloud-account-error" hidden>Informe um nome diferente para a campanha.</p>
                <div class="session-dialog-actions">
                    <button type="button" class="session-secondary" onclick="closeCloudCampaignRenameDialog()">Cancelar</button>
                    <button type="button" class="session-primary" onclick="confirmRenameCloudCampaign('${encodeURIComponent(campaign.id)}')">Renomear</button>
                </div>
            </section>
        `;
        root.document.body.appendChild(modal);
        const input = root.document.getElementById('cloudCampaignRenameInput');
        input?.focus?.();
        input?.select?.();
        input?.addEventListener?.('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                void confirmRenameCampaign(encodeURIComponent(campaign.id));
            }
        });
        return true;
    }

    async function confirmRenameCampaign(encodedId) {
        const campaignId = decodeURIComponent(encodedId);
        const campaign = campaigns.find(entry => String(entry.id) === String(campaignId));
        const input = root?.document?.getElementById('cloudCampaignRenameInput');
        const error = root?.document?.getElementById('cloudCampaignRenameError');
        const name = normalizeCampaignName(input?.value);
        if (!campaign || !name || campaignNameKey(name) === campaignNameKey(campaign.name)) {
            if (error) {
                error.textContent = !name ? 'Informe um nome para a campanha.' : 'Informe um nome diferente do atual.';
                error.hidden = false;
            }
            input?.focus?.();
            return false;
        }
        const duplicate = hasCampaignNameConflict(name, campaignId);
        if (duplicate) {
            if (error) {
                error.textContent = `Já existe uma campanha chamada "${duplicate.name}" nesta conta.`;
                error.hidden = false;
            }
            input?.focus?.();
            return false;
        }

        loading = true;
        errorMessage = '';
        try {
            const result = await request(`/api/account/campaigns/${encodeURIComponent(campaignId)}`, {
                method: 'PATCH',
                body: { name, expectedRevision: campaign.revision }
            });
            const index = campaigns.findIndex(entry => String(entry.id) === String(campaignId));
            if (index >= 0) campaigns[index] = result.cloud;
            const activeCampaign = root?.campaignStore?.getActiveCampaign?.();
            if (String(activeCampaign?.id || '') === String(campaignId)) {
                root?.campaignStore?.updateMetadata?.({ name });
            }
            root?.showToast?.(`✏️ Campanha renomeada para ${name}.`);
            closeCampaignRenameDialog();
            return true;
        } catch (requestError) {
            const message = requestError.code === 'duplicate_campaign_name'
                ? 'Já existe uma campanha com esse nome nesta conta.'
                : requestError.code === 'cloud_campaign_conflict'
                ? 'A campanha foi alterada em outro dispositivo. Atualize a lista e tente novamente.'
                : requestError.message;
            errorMessage = message;
            if (error) {
                error.textContent = message;
                error.hidden = false;
            }
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    async function deleteCampaign(campaignId) {
        if (!isAuthenticated() || loading) return false;
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request(`/api/account/campaigns/${encodeURIComponent(campaignId)}`, {
                method: 'DELETE'
            });
            campaigns = campaigns.filter(entry => String(entry.id) !== String(campaignId));
            root?.showToast?.(`🗑️ ${result.cloud?.name || 'Campanha'} removida da nuvem.`);
            return true;
        } catch (error) {
            errorMessage = error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    function requestDeleteCampaign(encodedId) {
        const campaignId = decodeURIComponent(encodedId);
        const campaign = campaigns.find(entry => String(entry.id) === String(campaignId));
        const action = () => void deleteCampaign(campaignId);
        if (root?.openSessionConfirm) {
            root.openSessionConfirm({
                title: 'Excluir campanha da nuvem?',
                message: `${campaign?.name || 'Esta campanha'} será removida permanentemente da sua conta. A cópia local não será apagada.`,
                confirmLabel: 'Excluir da nuvem',
                danger: true,
                onConfirm: action
            });
        } else if (root?.confirm?.(`Excluir ${campaign?.name || 'esta campanha'} da nuvem?`)) action();
    }

    async function loadCampaign(campaignId) {
        if (!isAuthenticated() || loading) return false;
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const result = await request(`/api/account/campaigns/${encodeURIComponent(campaignId)}`);
            const campaign = root?.campaignStore?.applyRemoteCampaign?.(result.campaign, {
                sequence: result.cloud?.revision || 0,
                transient: false
            });
            if (!campaign) throw new Error('Não foi possível abrir a campanha recebida.');
            root?.applyRemoteCampaignView?.(campaign);
            root?.showToast?.(`☁️ ${result.cloud?.name || 'Campanha'} carregada.`);
            root?.closeSessionTools?.();
            return true;
        } catch (error) {
            errorMessage = error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    function requestLoadCampaign(encodedId) {
        const campaignId = decodeURIComponent(encodedId);
        const campaign = campaigns.find(entry => String(entry.id) === String(campaignId));
        const action = () => void loadCampaign(campaignId);
        if (root?.openSessionConfirm) {
            root.openSessionConfirm({
                title: 'Carregar campanha da nuvem?',
                message: `A campanha ${campaign?.name || ''} será aberta neste dispositivo. A campanha local atual continuará registrada no seletor de campanhas.`,
                confirmLabel: 'Carregar',
                onConfirm: action
            });
        } else if (root?.confirm?.(`Carregar ${campaign?.name || 'esta campanha'}?`)) action();
    }

    function getState() {
        return JSON.parse(JSON.stringify({ accountSession, firebaseUser, firebaseCandidateUser, remoteUser, campaigns, securityEvents, accountDevices, migrationState, formMode, loading, errorMessage }));
    }

    const api = Object.freeze({
        SESSION_KEY,
        DEVICE_KEY,
        getPanelMarkup,
        mountPanel,
        useFirebaseUser,
        renderPanel,
        setFormMode,
        registerFromView,
        loginFromView,
        beginLegacyMigration,
        beginLegacyMigrationWithGoogle,
        refreshLegacyMigrationVerification,
        completeLegacyMigration,
        linkLegacyAccount,
        recordPasswordChanged,
        revokeDevice,
        requestRevokeDevice,
        refreshAccount,
        logout,
        requestSaveActiveCampaign,
        confirmSaveActiveCampaign,
        closeCampaignNameDialog,
        saveActiveCampaign,
        requestRenameCampaign,
        confirmRenameCampaign,
        closeCampaignRenameDialog,
        deleteCampaign,
        requestDeleteCampaign,
        loadCampaign,
        requestLoadCampaign,
        getCollaborationAccessToken,
        getPublicIdentity,
        getState
    });

    root.setCloudAccountFormMode = setFormMode;
    root.registerCloudAccount = registerFromView;
    root.loginCloudAccount = loginFromView;
    root.beginLegacyAccountMigration = beginLegacyMigration;
    root.beginLegacyAccountMigrationWithGoogle = beginLegacyMigrationWithGoogle;
    root.refreshLegacyMigrationVerification = refreshLegacyMigrationVerification;
    root.completeLegacyAccountMigration = completeLegacyMigration;
    root.linkFirebaseLegacyAccount = linkLegacyAccount;
    root.refreshCloudAccount = refreshAccount;
    root.logoutCloudAccount = logout;
    root.requestSaveActiveCampaignToCloud = requestSaveActiveCampaign;
    root.confirmSaveActiveCampaignToCloud = confirmSaveActiveCampaign;
    root.closeCloudCampaignNameDialog = closeCampaignNameDialog;
    root.saveActiveCampaignToCloud = saveActiveCampaign;
    root.requestRenameCloudCampaign = requestRenameCampaign;
    root.confirmRenameCloudCampaign = confirmRenameCampaign;
    root.closeCloudCampaignRenameDialog = closeCampaignRenameDialog;
    root.requestDeleteCloudCampaign = requestDeleteCampaign;
    root.requestLoadCloudCampaign = requestLoadCampaign;
    root.requestRevokeCloudDevice = requestRevokeDevice;
    return api;
});
