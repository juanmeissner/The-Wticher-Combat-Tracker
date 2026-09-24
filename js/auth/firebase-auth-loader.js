(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.firebaseAuthLoader = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const BUNDLE_PATH = 'js/auth/firebase-auth.bundle.js';
    let loadPromise = null;

    function getStatus() {
        return root?.firebaseAuthConfig?.getStatus?.() || {
            configured: false,
            errors: ['O módulo de configuração do Firebase não foi carregado.']
        };
    }

    function load() {
        if (root?.firebaseAuthClient) {
            return Promise.resolve(root.firebaseAuthClient.initialize()).then(() => root.firebaseAuthClient);
        }
        if (loadPromise) return loadPromise;
        const status = getStatus();
        if (!status.configured) return Promise.reject(new Error(status.errors?.join(' ') || 'Firebase não configurado.'));
        if (!root?.document?.createElement) return Promise.reject(new Error('O SDK do Firebase requer um navegador.'));

        loadPromise = new Promise((resolve, reject) => {
            const existing = root.document.querySelector?.('script[data-firebase-auth-sdk]');
            const script = existing || root.document.createElement('script');
            const complete = async () => {
                try {
                    if (!root.firebaseAuthClient) throw new Error('O bundle do Firebase não expôs o cliente esperado.');
                    await root.firebaseAuthClient.initialize();
                    resolve(root.firebaseAuthClient);
                } catch (error) {
                    loadPromise = null;
                    reject(error);
                }
            };
            script.addEventListener('load', complete, { once: true });
            script.addEventListener('error', () => {
                loadPromise = null;
                reject(new Error('Não foi possível carregar o módulo de autenticação.'));
            }, { once: true });
            if (!existing) {
                script.src = new URL(BUNDLE_PATH, root.document.baseURI).href;
                script.async = true;
                script.dataset.firebaseAuthSdk = 'true';
                root.document.head.appendChild(script);
            } else if (root.firebaseAuthClient) {
                void complete();
            }
        });
        return loadPromise;
    }

    return Object.freeze({ BUNDLE_PATH, getStatus, load });
});
