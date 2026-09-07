const MAX_BODY_BYTES = 3 * 1024 * 1024;
const PASSWORD_ITERATIONS = 100_000;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60_000;

function jsonResponse(value, status = 200) {
    return new Response(JSON.stringify(value), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8' }
    });
}

function errorResponse(code, message, status = 400, detail = {}) {
    return jsonResponse({ ok: false, error: code, message, ...detail }, status);
}

function base64Url(bytes) {
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function randomSecret(byteLength = 32) {
    return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value));
    return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

async function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: new TextEncoder().encode(salt),
        iterations
    }, key, 256);
    return base64Url(new Uint8Array(bits));
}

function timingSafeEqual(left, right) {
    const a = new TextEncoder().encode(String(left || ''));
    const b = new TextEncoder().encode(String(right || ''));
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let index = 0; index < a.length; index++) mismatch |= a[index] ^ b[index];
    return mismatch === 0;
}

async function readJson(request) {
    const declaredLength = Number(request.headers.get('content-length')) || 0;
    if (declaredLength > MAX_BODY_BYTES) throw new Error('payload_too_large');
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error('payload_too_large');
    return text ? JSON.parse(text) : {};
}

export function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase();
}

export function validateAccountInput(body = {}, options = {}) {
    const username = normalizeUsername(body.username);
    const password = String(body.password || '');
    const displayName = String(body.displayName || '').trim();
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return 'O usuário deve ter de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.';
    }
    if (password.length < 8 || password.length > 128) {
        return 'A senha deve ter entre 8 e 128 caracteres.';
    }
    if (options.requireDisplayName && (displayName.length < 2 || displayName.length > 80)) {
        return 'O nome exibido deve ter entre 2 e 80 caracteres.';
    }
    return '';
}

function publicUser(row) {
    return {
        id: String(row.id),
        username: String(row.username),
        displayName: String(row.display_name),
        createdAt: String(row.created_at)
    };
}

async function createSession(db, userId, deviceId = '') {
    const token = randomSecret();
    const tokenHash = await sha256(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    await db.prepare(`
        INSERT INTO account_sessions
            (token_hash, user_id, device_id, created_at, expires_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
        tokenHash,
        userId,
        String(deviceId || '').slice(0, 160),
        now.toISOString(),
        expiresAt.toISOString(),
        now.toISOString()
    ).run();
    return { token, expiresAt: expiresAt.toISOString() };
}

async function authenticate(request, db) {
    const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    const tokenHash = await sha256(match[1]);
    const now = new Date().toISOString();
    const row = await db.prepare(`
        SELECT u.id, u.username, u.display_name, u.created_at, s.token_hash
        FROM account_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?
    `).bind(tokenHash, now).first();
    if (!row) return null;
    await db.prepare('UPDATE account_sessions SET last_seen_at = ? WHERE token_hash = ?')
        .bind(now, tokenHash)
        .run();
    return { user: publicUser(row), tokenHash };
}

async function requireAuthentication(request, db) {
    const auth = await authenticate(request, db);
    return auth || errorResponse('account_unauthorized', 'Entre na sua conta para continuar.', 401);
}

async function register(request, db) {
    const body = await readJson(request);
    const validation = validateAccountInput(body, { requireDisplayName: true });
    if (validation) return errorResponse('invalid_account', validation);
    const username = normalizeUsername(body.username);
    const displayName = String(body.displayName).trim();
    const existing = await db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
        .bind(username)
        .first();
    if (existing) return errorResponse('username_unavailable', 'Este nome de usuário já está em uso.', 409);

    const id = `user-${crypto.randomUUID()}`;
    const salt = randomSecret(18);
    const verifier = await derivePassword(body.password, salt);
    const now = new Date().toISOString();
    await db.prepare(`
        INSERT INTO users
            (id, username, display_name, password_salt, password_verifier, password_iterations, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, username, displayName, salt, verifier, PASSWORD_ITERATIONS, now, now).run();
    const accountSession = await createSession(db, id, body.deviceId);
    return jsonResponse({
        ok: true,
        user: { id, username, displayName, createdAt: now },
        ...accountSession
    }, 201);
}

async function login(request, db) {
    const body = await readJson(request);
    const validation = validateAccountInput(body);
    if (validation) return errorResponse('invalid_credentials', 'Usuário ou senha inválidos.', 401);
    const username = normalizeUsername(body.username);
    const row = await db.prepare(`
        SELECT id, username, display_name, password_salt, password_verifier, password_iterations, created_at
        FROM users WHERE username = ? COLLATE NOCASE
    `).bind(username).first();
    if (!row) return errorResponse('invalid_credentials', 'Usuário ou senha inválidos.', 401);
    const verifier = await derivePassword(body.password, row.password_salt, Number(row.password_iterations));
    if (!timingSafeEqual(verifier, row.password_verifier)) {
        return errorResponse('invalid_credentials', 'Usuário ou senha inválidos.', 401);
    }
    const accountSession = await createSession(db, row.id, body.deviceId);
    return jsonResponse({ ok: true, user: publicUser(row), ...accountSession });
}

async function logout(request, db) {
    const auth = await authenticate(request, db);
    if (auth) {
        await db.prepare('DELETE FROM account_sessions WHERE token_hash = ?')
            .bind(auth.tokenHash)
            .run();
    }
    return jsonResponse({ ok: true });
}

async function getProfile(request, db) {
    const auth = await requireAuthentication(request, db);
    if (auth instanceof Response) return auth;
    return jsonResponse({ ok: true, user: auth.user });
}

function campaignSummary(row) {
    return {
        id: String(row.id),
        name: String(row.name),
        revision: Math.max(1, Number(row.revision) || 1),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at)
    };
}

async function listCampaigns(request, db) {
    const auth = await requireAuthentication(request, db);
    if (auth instanceof Response) return auth;
    const result = await db.prepare(`
        SELECT id, name, revision, created_at, updated_at
        FROM cloud_campaigns
        WHERE owner_user_id = ?
        ORDER BY updated_at DESC
        LIMIT 100
    `).bind(auth.user.id).all();
    return jsonResponse({ ok: true, campaigns: (result.results || []).map(campaignSummary) });
}

async function getCampaign(request, db, campaignId) {
    const auth = await requireAuthentication(request, db);
    if (auth instanceof Response) return auth;
    const row = await db.prepare(`
        SELECT id, name, snapshot_json, revision, created_at, updated_at
        FROM cloud_campaigns
        WHERE owner_user_id = ? AND id = ?
    `).bind(auth.user.id, campaignId).first();
    if (!row) return errorResponse('campaign_not_found', 'Campanha online não encontrada.', 404);
    let campaign;
    try { campaign = JSON.parse(row.snapshot_json); } catch { campaign = null; }
    if (!campaign) return errorResponse('invalid_campaign_snapshot', 'O snapshot desta campanha está corrompido.', 500);
    return jsonResponse({ ok: true, campaign, cloud: campaignSummary(row) });
}

async function saveCampaign(request, db, campaignId) {
    const auth = await requireAuthentication(request, db);
    if (auth instanceof Response) return auth;
    const body = await readJson(request);
    const campaign = body.campaign;
    if (!campaign || typeof campaign !== 'object' || Array.isArray(campaign)) {
        return errorResponse('invalid_campaign', 'A campanha enviada é inválida.');
    }
    if (String(campaign.id || '') !== campaignId) {
        return errorResponse('campaign_id_mismatch', 'O identificador da campanha não corresponde ao endereço.');
    }
    const name = String(body.name ?? campaign.metadata?.name ?? '').trim();
    if (!name || name.length > 100) {
        return errorResponse('invalid_campaign_name', 'Informe um nome de campanha com até 100 caracteres.');
    }
    const storedCampaign = {
        ...campaign,
        metadata: { ...(campaign.metadata || {}), name }
    };
    const snapshotJson = JSON.stringify(storedCampaign);
    if (new TextEncoder().encode(snapshotJson).byteLength > MAX_BODY_BYTES) {
        return errorResponse('payload_too_large', 'A campanha ultrapassa o limite de 3 MB.', 413);
    }
    const existing = await db.prepare(`
        SELECT id, revision, created_at FROM cloud_campaigns
        WHERE owner_user_id = ? AND id = ?
    `).bind(auth.user.id, campaignId).first();
    const expectedRevision = body.expectedRevision === null || body.expectedRevision === undefined
        ? null
        : Math.max(0, Number(body.expectedRevision) || 0);
    if (existing && expectedRevision !== null && Number(existing.revision) !== expectedRevision) {
        return errorResponse('cloud_campaign_conflict', 'Existe uma versão mais recente desta campanha na nuvem.', 409, {
            currentRevision: Number(existing.revision)
        });
    }

    const now = new Date().toISOString();
    const revision = existing ? Number(existing.revision) + 1 : 1;
    if (existing) {
        const updated = await db.prepare(`
            UPDATE cloud_campaigns
            SET name = ?, snapshot_json = ?, revision = ?, updated_at = ?
            WHERE owner_user_id = ? AND id = ? AND revision = ?
        `).bind(name, snapshotJson, revision, now, auth.user.id, campaignId, Number(existing.revision)).run();
        if (Number(updated.meta?.changes) !== 1) {
            return errorResponse('cloud_campaign_conflict', 'A campanha foi alterada em outro dispositivo.', 409);
        }
    } else {
        await db.prepare(`
            INSERT INTO cloud_campaigns
                (id, owner_user_id, name, snapshot_json, revision, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(campaignId, auth.user.id, name, snapshotJson, revision, now, now).run();
    }
    return jsonResponse({
        ok: true,
        cloud: { id: campaignId, name, revision, createdAt: existing?.created_at || now, updatedAt: now }
    }, existing ? 200 : 201);
}

async function deleteCampaign(request, db, campaignId) {
    const auth = await requireAuthentication(request, db);
    if (auth instanceof Response) return auth;
    const existing = await db.prepare(`
        SELECT id, name, revision, created_at, updated_at
        FROM cloud_campaigns
        WHERE owner_user_id = ? AND id = ?
    `).bind(auth.user.id, campaignId).first();
    if (!existing) return errorResponse('campaign_not_found', 'Campanha online não encontrada.', 404);

    const removed = await db.prepare(`
        DELETE FROM cloud_campaigns
        WHERE owner_user_id = ? AND id = ?
    `).bind(auth.user.id, campaignId).run();
    if (Number(removed.meta?.changes) !== 1) {
        return errorResponse('cloud_campaign_delete_failed', 'Não foi possível excluir esta campanha.', 409);
    }
    return jsonResponse({ ok: true, cloud: campaignSummary(existing) });
}

export function isAccountRequest(url) {
    return url.pathname === '/api/account/register'
        || url.pathname === '/api/account/login'
        || url.pathname === '/api/account/logout'
        || url.pathname === '/api/account/me'
        || url.pathname === '/api/account/campaigns'
        || /^\/api\/account\/campaigns\/[^/]+$/.test(url.pathname);
}

export async function handleAccountRequest(request, db, url = new URL(request.url)) {
    if (!db) return errorResponse('accounts_unavailable', 'As contas online ainda não estão configuradas.', 503);
    try {
        if (request.method === 'POST' && url.pathname === '/api/account/register') return register(request, db);
        if (request.method === 'POST' && url.pathname === '/api/account/login') return login(request, db);
        if (request.method === 'POST' && url.pathname === '/api/account/logout') return logout(request, db);
        if (request.method === 'GET' && url.pathname === '/api/account/me') return getProfile(request, db);
        if (request.method === 'GET' && url.pathname === '/api/account/campaigns') return listCampaigns(request, db);
        const campaignMatch = url.pathname.match(/^\/api\/account\/campaigns\/([^/]+)$/);
        if (campaignMatch) {
            const campaignId = decodeURIComponent(campaignMatch[1]);
            if (request.method === 'GET') return getCampaign(request, db, campaignId);
            if (request.method === 'PUT') return saveCampaign(request, db, campaignId);
            if (request.method === 'DELETE') return deleteCampaign(request, db, campaignId);
        }
        return errorResponse('not_found', 'Rota de conta não encontrada.', 404);
    } catch (error) {
        console.error('Falha no serviço de contas.', error);
        if (error?.message === 'payload_too_large') {
            return errorResponse('payload_too_large', 'Os dados ultrapassam o limite de 3 MB.', 413);
        }
        if (error instanceof SyntaxError) return errorResponse('invalid_json', 'Os dados enviados são inválidos.', 400);
        return errorResponse('account_service_error', 'Não foi possível processar a conta agora.', 500);
    }
}
