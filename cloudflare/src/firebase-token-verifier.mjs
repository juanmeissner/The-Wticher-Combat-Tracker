const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const CLOCK_SKEW_SECONDS = 300;
let cachedKeys = null;
let cachedKeysExpireAt = 0;

export class FirebaseTokenError extends Error {
    constructor(code, message, status = 401) {
        super(message);
        this.name = 'FirebaseTokenError';
        this.code = code;
        this.status = status;
    }
}

function decodeBase64UrlBytes(value) {
    const normalized = String(value || '').replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    try {
        const binary = atob(padded);
        return Uint8Array.from(binary, character => character.charCodeAt(0));
    } catch {
        throw new FirebaseTokenError('firebase_token_malformed', 'O token do Firebase é inválido.');
    }
}

function decodeJsonSegment(value) {
    try {
        return JSON.parse(new TextDecoder().decode(decodeBase64UrlBytes(value)));
    } catch (error) {
        if (error instanceof FirebaseTokenError) throw error;
        throw new FirebaseTokenError('firebase_token_malformed', 'O token do Firebase é inválido.');
    }
}

function getMaximumAge(headers) {
    const match = String(headers?.get?.('cache-control') || '').match(/max-age=(\d+)/i);
    return Math.max(60, Number(match?.[1]) || 3600);
}

async function getPublicKeys(fetchImpl, nowMs) {
    if (cachedKeys && cachedKeysExpireAt > nowMs) return cachedKeys;
    const response = await fetchImpl(FIREBASE_JWKS_URL, {
        headers: { accept: 'application/json' }
    });
    if (!response?.ok) {
        throw new FirebaseTokenError(
            'firebase_keys_unavailable',
            'Não foi possível validar a identidade agora. Tente novamente em instantes.',
            503
        );
    }
    const body = await response.json();
    const keys = Array.isArray(body?.keys) ? body.keys : [];
    if (!keys.length) {
        throw new FirebaseTokenError('firebase_keys_invalid', 'As chaves públicas do Firebase estão indisponíveis.', 503);
    }
    cachedKeys = new Map(keys.filter(key => key?.kid).map(key => [String(key.kid), key]));
    cachedKeysExpireAt = nowMs + getMaximumAge(response.headers) * 1000;
    return cachedKeys;
}

function validateClaims(claims, projectId, nowSeconds) {
    const issuer = `https://securetoken.google.com/${projectId}`;
    if (claims?.aud !== projectId) {
        throw new FirebaseTokenError('firebase_token_audience', 'O token pertence a outro projeto Firebase.');
    }
    if (claims?.iss !== issuer) {
        throw new FirebaseTokenError('firebase_token_issuer', 'O emissor do token Firebase é inválido.');
    }
    if (typeof claims?.sub !== 'string' || !claims.sub || claims.sub.length > 128) {
        throw new FirebaseTokenError('firebase_token_subject', 'O usuário informado pelo Firebase é inválido.');
    }
    if (!Number.isFinite(claims?.exp) || claims.exp <= nowSeconds - CLOCK_SKEW_SECONDS) {
        throw new FirebaseTokenError('firebase_token_expired', 'Sua sessão expirou. Entre novamente.');
    }
    if (!Number.isFinite(claims?.iat) || claims.iat > nowSeconds + CLOCK_SKEW_SECONDS) {
        throw new FirebaseTokenError('firebase_token_issued_at', 'A data de emissão do token Firebase é inválida.');
    }
    if (claims?.auth_time !== undefined
        && (!Number.isFinite(claims.auth_time) || claims.auth_time > nowSeconds + CLOCK_SKEW_SECONDS)) {
        throw new FirebaseTokenError('firebase_token_auth_time', 'A data de autenticação do token Firebase é inválida.');
    }
}

export async function verifyFirebaseIdToken(token, options = {}) {
    const projectId = String(options.projectId || '').trim();
    if (!projectId) {
        throw new FirebaseTokenError('firebase_not_configured', 'O Firebase ainda não está configurado no servidor.', 503);
    }
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || parts.some(part => !part)) {
        throw new FirebaseTokenError('firebase_token_malformed', 'O token do Firebase é inválido.');
    }
    const header = decodeJsonSegment(parts[0]);
    const claims = decodeJsonSegment(parts[1]);
    if (header?.alg !== 'RS256' || !header?.kid) {
        throw new FirebaseTokenError('firebase_token_algorithm', 'A assinatura do token Firebase é inválida.');
    }

    const nowMs = Number.isFinite(options.nowMs) ? Number(options.nowMs) : Date.now();
    const fetchImpl = options.fetchImpl || fetch;
    const keys = await getPublicKeys(fetchImpl, nowMs);
    const jwk = keys.get(String(header.kid));
    if (!jwk) throw new FirebaseTokenError('firebase_token_key', 'A chave usada pelo token Firebase não é reconhecida.');
    const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
    );
    const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        decodeBase64UrlBytes(parts[2]),
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) throw new FirebaseTokenError('firebase_token_signature', 'A assinatura do token Firebase é inválida.');
    validateClaims(claims, projectId, Math.floor(nowMs / 1000));
    return Object.freeze({ ...claims, uid: claims.sub });
}

export function resetFirebaseKeyCache() {
    cachedKeys = null;
    cachedKeysExpireAt = 0;
}

export { FIREBASE_JWKS_URL };
