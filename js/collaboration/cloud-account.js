(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.cloudAccount = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const SESSION_KEY = 'dnd_cloud_account_session_v1';
    const REFRESH_INTERVAL_MS = 30_000;
    let accountSession = readSession();
    let campaigns = [];
    let formMode = 'login';
    let loading = false;
    let errorMessage = '';
    let lastRefreshAt = 0;

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

    function getEndpoint() {
        return root?.collaborationRealtime?.getServiceEndpoint?.()
            || 'https://witcher-combat-collaboration.juanmeissnerf.workers.dev';
    }

    async function request(path, options = {}) {
        const response = await root.fetch(`${getEndpoint()}${path}`, {
            method: options.method || 'GET',
            headers: {
                'content-type': 'application/json',
                ...(accountSession?.token ? { authorization: `Bearer ${accountSession.token}` } : {})
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        let result = {};
        try { result = await response.json(); } catch { result = {}; }
        if (!response.ok) {
            if (response.status === 401) {
                persistSession(null);
                campaigns = [];
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

    function getPanelMarkup() {
        return '<section id="cloudAccountPanel" class="cloud-account-panel" aria-live="polite"></section>';
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
                    <button type="button" class="session-danger" onclick="requestDeleteCloudCampaign('${encodeURIComponent(campaign.id)}')" aria-label="Excluir ${escapeHtml(campaign.name)}">Excluir</button>
                </div>
            </article>
        `).join('');
    }

    function renderAuthenticated() {
        return `
            <div class="cloud-account-heading">
                <div><span>☁️</span><strong>Campanhas na nuvem</strong><small>${escapeHtml(accountSession.user?.displayName || accountSession.user?.username || 'Conta conectada')}</small></div>
                <button type="button" class="session-small-button" onclick="logoutCloudAccount()" ${loading ? 'disabled' : ''}>Sair</button>
            </div>
            <p class="cloud-account-copy">Salve cópias privadas das suas campanhas para acessá-las em outros dispositivos.</p>
            ${errorMessage ? `<p class="cloud-account-error">${escapeHtml(errorMessage)}</p>` : ''}
            <div class="cloud-account-actions">
                <button type="button" class="session-primary" onclick="requestSaveActiveCampaignToCloud()" ${loading ? 'disabled' : ''}>${loading ? 'Aguarde...' : 'Salvar campanha atual'}</button>
                <button type="button" class="session-secondary" onclick="refreshCloudAccount()" ${loading ? 'disabled' : ''}>Atualizar lista</button>
            </div>
            <div class="cloud-campaign-list">${renderCampaigns()}</div>
        `;
    }

    function renderAnonymous() {
        const register = formMode === 'register';
        return `
            <div class="cloud-account-heading">
                <div><span>☁️</span><strong>Conta e campanhas permanentes</strong><small>Opcional · o modo offline continua disponível</small></div>
            </div>
            <p class="cloud-account-copy">${register ? 'Crie uma conta privada para guardar campanhas no Cloudflare.' : 'Entre para acessar suas campanhas em outros dispositivos.'}</p>
            ${errorMessage ? `<p class="cloud-account-error">${escapeHtml(errorMessage)}</p>` : ''}
            <div class="cloud-account-form">
                ${register ? '<input id="cloudAccountDisplayName" class="session-input" maxlength="80" autocomplete="name" placeholder="Nome exibido">' : ''}
                <input id="cloudAccountUsername" class="session-input" maxlength="32" autocapitalize="none" autocomplete="username" placeholder="Nome de usuário">
                <input id="cloudAccountPassword" class="session-input" type="password" minlength="8" maxlength="128" autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="Senha">
                <button type="button" class="session-primary" onclick="${register ? 'registerCloudAccount' : 'loginCloudAccount'}()" ${loading ? 'disabled' : ''}>${loading ? 'Aguarde...' : (register ? 'Criar conta' : 'Entrar')}</button>
                <button type="button" class="session-secondary" onclick="setCloudAccountFormMode('${register ? 'login' : 'register'}')" ${loading ? 'disabled' : ''}>${register ? 'Já tenho uma conta' : 'Criar uma conta'}</button>
            </div>
        `;
    }

    function renderPanel() {
        const panel = root?.document?.getElementById('cloudAccountPanel');
        if (!panel) return false;
        panel.innerHTML = accountSession?.token ? renderAuthenticated() : renderAnonymous();
        return true;
    }

    function mountPanel() {
        renderPanel();
        if (accountSession?.token && (!accountSession.user || Date.now() - lastRefreshAt > REFRESH_INTERVAL_MS)) {
            void refreshAccount();
        }
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

    async function refreshAccount() {
        if (!accountSession?.token || loading) return false;
        loading = true;
        errorMessage = '';
        renderPanel();
        try {
            const [profile, cloudCampaigns] = await Promise.all([
                request('/api/account/me'),
                request('/api/account/campaigns')
            ]);
            persistSession({ ...accountSession, user: profile.user });
            campaigns = Array.isArray(cloudCampaigns.campaigns) ? cloudCampaigns.campaigns : [];
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

    async function logout() {
        if (loading) return false;
        loading = true;
        renderPanel();
        try { await request('/api/account/logout', { method: 'POST', body: {} }); } catch { /* sessão local também deve terminar */ }
        persistSession(null);
        campaigns = [];
        errorMessage = '';
        loading = false;
        renderPanel();
        root?.showToast?.('Conta desconectada deste dispositivo.');
        return true;
    }

    function closeCampaignNameDialog() {
        root?.document?.getElementById('cloudCampaignNameDialog')?.remove();
    }

    function requestSaveActiveCampaign() {
        if (!accountSession?.token || loading) return false;
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
        const name = String(input?.value || '').trim();
        const error = root?.document?.getElementById('cloudCampaignNameError');
        if (!name) {
            if (error) error.hidden = false;
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
        if (!accountSession?.token || loading) return false;
        if (root?.collaborationSession?.isPlayer?.()) {
            errorMessage = 'Somente o Mestre pode salvar uma campanha na nuvem.';
            renderPanel();
            return false;
        }
        const campaign = root?.campaignStore?.checkpoint?.({ reason: 'cloud-campaign-save' })
            || root?.campaignStore?.getActiveCampaign?.();
        if (!campaign?.id) return false;
        const name = String(nameOverride || campaign.metadata?.name || '').trim();
        if (!name) return false;
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
                : error.message;
            return false;
        } finally {
            loading = false;
            renderPanel();
        }
    }

    async function deleteCampaign(campaignId) {
        if (!accountSession?.token || loading) return false;
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
        if (!accountSession?.token || loading) return false;
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
        return JSON.parse(JSON.stringify({ accountSession, campaigns, formMode, loading, errorMessage }));
    }

    const api = Object.freeze({
        SESSION_KEY,
        getPanelMarkup,
        mountPanel,
        renderPanel,
        setFormMode,
        registerFromView,
        loginFromView,
        refreshAccount,
        logout,
        requestSaveActiveCampaign,
        confirmSaveActiveCampaign,
        closeCampaignNameDialog,
        saveActiveCampaign,
        deleteCampaign,
        requestDeleteCampaign,
        loadCampaign,
        requestLoadCampaign,
        getState
    });

    root.setCloudAccountFormMode = setFormMode;
    root.registerCloudAccount = registerFromView;
    root.loginCloudAccount = loginFromView;
    root.refreshCloudAccount = refreshAccount;
    root.logoutCloudAccount = logout;
    root.requestSaveActiveCampaignToCloud = requestSaveActiveCampaign;
    root.confirmSaveActiveCampaignToCloud = confirmSaveActiveCampaign;
    root.closeCloudCampaignNameDialog = closeCampaignNameDialog;
    root.saveActiveCampaignToCloud = saveActiveCampaign;
    root.requestDeleteCloudCampaign = requestDeleteCampaign;
    root.requestLoadCloudCampaign = requestLoadCampaign;
    return api;
});
