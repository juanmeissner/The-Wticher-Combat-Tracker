(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.firebaseAuthConfig = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const CONFIG_VERSION = 1;
    const REQUIRED_FIELDS = Object.freeze(['apiKey', 'authDomain', 'projectId', 'appId']);
    const PUBLIC_FIELDS = Object.freeze([
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'appId',
        'messagingSenderId',
        'measurementId'
    ]);
    const FORBIDDEN_FIELDS = Object.freeze([
        'clientSecret',
        'privateKey',
        'private_key',
        'serviceAccount',
        'service_account',
        'apiSecret'
    ]);

    function normalizeConfig(value = {}) {
        return Object.freeze(PUBLIC_FIELDS.reduce((config, field) => {
            config[field] = String(value?.[field] || '').trim();
            return config;
        }, {}));
    }

    function validateConfig(value = {}) {
        const source = value && typeof value === 'object' ? value : {};
        const config = normalizeConfig(source);
        const missing = REQUIRED_FIELDS.filter(field => !config[field]);
        const forbidden = FORBIDDEN_FIELDS.filter(field => Object.hasOwn(source, field));
        const errors = [];

        if (missing.length) errors.push(`Campos públicos ausentes: ${missing.join(', ')}.`);
        if (forbidden.length) errors.push(`Campos secretos proibidos: ${forbidden.join(', ')}.`);
        if (config.authDomain && !/^[a-z0-9.-]+$/i.test(config.authDomain)) {
            errors.push('authDomain deve conter somente o domínio fornecido pelo Firebase.');
        }

        return Object.freeze({
            version: CONFIG_VERSION,
            configured: errors.length === 0,
            config,
            missing: Object.freeze(missing),
            forbidden: Object.freeze(forbidden),
            errors: Object.freeze(errors)
        });
    }

    function getStatus() {
        return validateConfig(root?.WITCHER_FIREBASE_AUTH_CONFIG || {});
    }

    return Object.freeze({
        CONFIG_VERSION,
        REQUIRED_FIELDS,
        PUBLIC_FIELDS,
        FORBIDDEN_FIELDS,
        normalizeConfig,
        validateConfig,
        getStatus
    });
});
