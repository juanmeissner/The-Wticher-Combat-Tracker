function getHPColor(pct) {
    if (pct > 50) return '#10b981'; // emerald
    if (pct > 25) return '#f59e0b'; // amber
    return '#ef4444'; // red
}

const APP_IMAGE_FALLBACK = 'image.png';

function escapeAppMediaHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getSafeAppImageUrl(value) {
    const source = String(value ?? '').trim();

    if (!source || /[\u0000-\u001f\u007f]/.test(source)) return '';

    try {
        const baseUrl = typeof document !== 'undefined'
            ? document.baseURI
            : 'https://local.invalid/';
        const parsedUrl = new URL(source, baseUrl);

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return '';

        if (
            parsedUrl.protocol === 'http:'
            && typeof location !== 'undefined'
            && parsedUrl.origin !== location.origin
        ) return '';

        return parsedUrl.href;
    } catch {
        return '';
    }
}

function isAppImageReference(value) {
    const source = String(value ?? '').trim();
    if (!source) return false;

    return /^(?:https?:\/\/|\.\.?\/|\/)/i.test(source)
        || /\.(?:png|jpe?g|webp|svg|gif|avif)(?:[?#].*)?$/i.test(source)
        || /^(?:assets|img|vendor)\//i.test(source);
}

function renderAppImage(source, options = {}) {
    const safeSource = getSafeAppImageUrl(source);
    if (!safeSource) return '';

    const safeFallback = getSafeAppImageUrl(options.fallback || APP_IMAGE_FALLBACK);
    const className = escapeAppMediaHtml(options.className || '');
    const alt = escapeAppMediaHtml(options.alt || '');
    const eager = options.loading === 'eager';
    const draggable = options.draggable === true ? 'true' : 'false';

    return `<img src="${escapeAppMediaHtml(safeSource)}" alt="${alt}" class="${className}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" draggable="${draggable}"${safeFallback ? ` data-app-image-fallback="${escapeAppMediaHtml(safeFallback)}"` : ''}>`;
}

if (typeof document !== 'undefined' && !document.documentElement.dataset.appImageFallbackReady) {
    document.documentElement.dataset.appImageFallbackReady = 'true';
    document.addEventListener('error', event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement)) return;

        const fallback = getSafeAppImageUrl(image.dataset.appImageFallback);
        if (!fallback || image.dataset.appImageFallbackApplied === 'true') {
            image.classList.add('app-image-unavailable');
            return;
        }

        image.dataset.appImageFallbackApplied = 'true';
        image.src = fallback;
    }, true);
}

if (typeof window !== 'undefined') {
    window.APP_IMAGE_FALLBACK = APP_IMAGE_FALLBACK;
    window.escapeAppMediaHtml = escapeAppMediaHtml;
    window.getSafeAppImageUrl = getSafeAppImageUrl;
    window.isAppImageReference = isAppImageReference;
    window.renderAppImage = renderAppImage;
}
