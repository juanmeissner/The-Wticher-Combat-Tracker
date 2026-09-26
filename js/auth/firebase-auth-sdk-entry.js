import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    EmailAuthProvider,
    GoogleAuthProvider,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    getRedirectResult,
    linkWithCredential,
    linkWithPopup,
    linkWithRedirect,
    onAuthStateChanged,
    reauthenticateWithCredential,
    reload,
    sendEmailVerification,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    unlink,
    updatePassword,
    updateProfile,
    verifyBeforeUpdateEmail
} from 'firebase/auth';

const root = typeof globalThis !== 'undefined' ? globalThis : window;
let auth = null;
let initializePromise = null;
let unsubscribeAuth = null;
let currentUser = null;
let pendingAuthError = null;
let pendingProviderLink = null;
const listeners = new Set();

function publicUser(user = currentUser) {
    if (!user) return null;
    return Object.freeze({
        uid: String(user.uid || ''),
        email: String(user.email || ''),
        displayName: String(user.displayName || ''),
        emailVerified: Boolean(user.emailVerified),
        photoURL: String(user.photoURL || ''),
        providerIds: Object.freeze([...new Set((user.providerData || []).map(entry => String(entry?.providerId || '')).filter(Boolean))])
    });
}

function notify() {
    const snapshot = publicUser();
    listeners.forEach(listener => {
        try { listener(snapshot); } catch { /* um observador não interrompe os demais */ }
    });
}

function actionContinueUrl(action = '') {
    try {
        const url = new URL(root.location.href);
        url.hash = '';
        url.search = '';
        if (action) url.searchParams.set('authAction', String(action));
        return url.href;
    } catch {
        return undefined;
    }
}

function actionCodeSettings(action = '') {
    const url = actionContinueUrl(action);
    return url ? { url, handleCodeInApp: false } : undefined;
}

function shouldUseFirebaseHostedAction(error) {
    return ['auth/invalid-continue-uri', 'auth/unauthorized-continue-uri'].includes(String(error?.code || ''));
}

async function sendVerificationEmail(user) {
    const settings = actionCodeSettings('email-verification');
    if (!settings) return sendEmailVerification(user);
    try {
        return await sendEmailVerification(user, settings);
    } catch (error) {
        if (!shouldUseFirebaseHostedAction(error)) throw error;
        return sendEmailVerification(user);
    }
}

async function sendResetEmail(email) {
    const settings = actionCodeSettings('password-reset');
    if (!settings) return sendPasswordResetEmail(auth, email);
    try {
        return await sendPasswordResetEmail(auth, email, settings);
    } catch (error) {
        if (!shouldUseFirebaseHostedAction(error)) throw error;
        return sendPasswordResetEmail(auth, email);
    }
}

async function sendEmailChangeVerification(user, email) {
    const settings = actionCodeSettings('email-change');
    if (!settings) return verifyBeforeUpdateEmail(user, email);
    try {
        return await verifyBeforeUpdateEmail(user, email, settings);
    } catch (error) {
        if (!shouldUseFirebaseHostedAction(error)) throw error;
        return verifyBeforeUpdateEmail(user, email);
    }
}

function firebaseErrorMessage(error) {
    const code = String(error?.code || '');
    const messages = {
        'auth/email-already-in-use': 'Este e-mail já possui uma conta.',
        'auth/invalid-email': 'Informe um endereço de e-mail válido.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/user-disabled': 'Esta conta foi desativada.',
        'auth/user-not-found': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'E-mail ou senha incorretos.',
        'auth/requires-recent-login': 'Por segurança, confirme sua senha atual antes de continuar.',
        'auth/provider-already-linked': 'Este método de acesso já está vinculado à conta.',
        'auth/no-such-provider': 'Este método de acesso não está vinculado à conta.',
        'auth/weak-password': 'A senha precisa ter pelo menos 8 caracteres.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'auth/network-request-failed': 'Não foi possível conectar ao serviço de autenticação.',
        'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail. Confirme a senha do método original para vincular o Google com segurança.',
        'auth/credential-already-in-use': 'Esta credencial já pertence a outra conta. Nenhuma campanha foi alterada.',
        'auth/cancelled-popup-request': 'Outra tentativa de login com Google já está em andamento.',
        'auth/popup-closed-by-user': 'A janela do Google foi fechada antes da conclusão.',
        'auth/popup-blocked': 'O navegador bloqueou a janela de login do Google.',
        'auth/unauthorized-domain': 'Este endereço ainda não está autorizado no Firebase.',
        'auth/operation-not-allowed': 'Este método de login ainda não está habilitado no Firebase.'
    };
    return messages[code] || String(error?.message || 'Não foi possível concluir a autenticação.');
}

function shouldUseGoogleRedirect() {
    try {
        return Boolean(
            root.navigator?.standalone
            || root.matchMedia?.('(display-mode: standalone)')?.matches
        );
    } catch {
        return false;
    }
}

function consumeAuthError() {
    const error = pendingAuthError;
    pendingAuthError = null;
    return error;
}

function capturePendingGoogleLink(error) {
    if (String(error?.code || '') !== 'auth/account-exists-with-different-credential') return false;
    const email = String(error?.customData?.email || error?.email || '').trim().toLowerCase();
    const credential = GoogleAuthProvider.credentialFromError(error);
    if (!email || !credential) return false;
    pendingProviderLink = { email, providerId: GoogleAuthProvider.PROVIDER_ID, credential };
    return true;
}

function getPendingProviderLink() {
    if (!pendingProviderLink) return null;
    return Object.freeze({
        email: pendingProviderLink.email,
        providerId: pendingProviderLink.providerId
    });
}

function cancelPendingProviderLink() {
    pendingProviderLink = null;
    pendingAuthError = null;
    return true;
}

async function refreshCurrentUser(user = auth?.currentUser) {
    if (!user) return null;
    await reload(user);
    await user.getIdToken(true);
    currentUser = auth.currentUser || user;
    notify();
    return publicUser();
}

async function initialize() {
    if (initializePromise) return initializePromise;
    initializePromise = (async () => {
        const status = root.firebaseAuthConfig?.getStatus?.();
        if (!status?.configured) {
            throw new Error(status?.errors?.join(' ') || 'A configuração pública do Firebase está incompleta.');
        }
        const app = getApps().length ? getApp() : initializeApp(status.config);
        auth = getAuth(app);
        auth.useDeviceLanguage?.();
        await setPersistence(auth, browserLocalPersistence);
        if (!unsubscribeAuth) {
            unsubscribeAuth = onAuthStateChanged(auth, user => {
                currentUser = user || null;
                notify();
            });
        }
        try {
            const redirectCredential = await getRedirectResult(auth);
            if (redirectCredential?.user) {
                currentUser = redirectCredential.user;
                notify();
            }
        } catch (error) {
            if (error?.code !== 'auth/no-auth-event') {
                capturePendingGoogleLink(error);
                pendingAuthError = error;
            }
        }
        return api;
    })().catch(error => {
        initializePromise = null;
        throw error;
    });
    return initializePromise;
}

async function register({ email, password, displayName }) {
    await initialize();
    const credential = await createUserWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''));
    if (String(displayName || '').trim()) {
        await updateProfile(credential.user, { displayName: String(displayName).trim() });
    }
    await sendVerificationEmail(credential.user);
    await reload(credential.user);
    currentUser = auth.currentUser;
    notify();
    return publicUser();
}

async function login({ email, password }) {
    await initialize();
    const credential = await signInWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''));
    currentUser = credential.user;
    notify();
    return publicUser();
}

async function loginWithGoogle() {
    await initialize();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (shouldUseGoogleRedirect()) {
        await signInWithRedirect(auth, provider);
        return null;
    }
    try {
        const credential = await signInWithPopup(auth, provider);
        currentUser = credential.user;
        notify();
        return publicUser();
    } catch (error) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error?.code)) {
            await signInWithRedirect(auth, provider);
            return null;
        }
        capturePendingGoogleLink(error);
        throw error;
    }
}

async function completePendingGoogleLink({ password }) {
    await initialize();
    if (!pendingProviderLink) throw new Error('Nenhuma vinculação de conta está pendente.');
    const pending = pendingProviderLink;
    const normalizedPassword = String(password || '');
    if (normalizedPassword.length < 8) throw new Error('Informe a senha da conta existente.');
    const signedIn = await signInWithEmailAndPassword(auth, pending.email, normalizedPassword);
    try {
        const linked = await linkWithCredential(signedIn.user, pending.credential);
        pendingProviderLink = null;
        pendingAuthError = null;
        return refreshCurrentUser(linked.user);
    } catch (error) {
        await signOut(auth);
        currentUser = null;
        notify();
        throw error;
    }
}

async function linkGoogleProvider() {
    await initialize();
    const activeUser = auth.currentUser;
    if (!activeUser) throw new Error('Entre na conta antes de vincular o Google.');
    const providers = new Set((activeUser.providerData || []).map(entry => String(entry?.providerId || '')));
    if (providers.has(GoogleAuthProvider.PROVIDER_ID)) return publicUser(activeUser);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (shouldUseGoogleRedirect()) {
        await linkWithRedirect(activeUser, provider);
        return null;
    }
    try {
        const linked = await linkWithPopup(activeUser, provider);
        return refreshCurrentUser(linked.user);
    } catch (error) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error?.code)) {
            await linkWithRedirect(activeUser, provider);
            return null;
        }
        throw error;
    }
}

async function linkPasswordProvider({ password }) {
    await initialize();
    const activeUser = auth.currentUser;
    if (!activeUser?.email) throw new Error('A conta atual não possui um e-mail disponível para vinculação.');
    const providers = new Set((activeUser.providerData || []).map(entry => String(entry?.providerId || '')));
    if (providers.has(EmailAuthProvider.PROVIDER_ID)) return publicUser(activeUser);
    const normalizedPassword = String(password || '');
    if (normalizedPassword.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
    const credential = EmailAuthProvider.credential(activeUser.email, normalizedPassword);
    const linked = await linkWithCredential(activeUser, credential);
    return refreshCurrentUser(linked.user);
}

async function unlinkProvider(providerId) {
    await initialize();
    const activeUser = auth.currentUser;
    if (!activeUser) throw new Error('Entre na conta antes de desconectar um método de acesso.');
    const normalizedProvider = String(providerId || '');
    const providers = [...new Set((activeUser.providerData || []).map(entry => String(entry?.providerId || '')).filter(Boolean))];
    if (!providers.includes(normalizedProvider)) throw new Error('Este método de acesso não está vinculado à conta.');
    if (providers.length <= 1) throw new Error('Adicione outro método de acesso antes de desconectar o único método atual.');
    const updatedUser = await unlink(activeUser, normalizedProvider);
    return refreshCurrentUser(updatedUser);
}

async function resendVerification() {
    await initialize();
    if (!auth.currentUser) throw new Error('Entre na conta antes de solicitar a confirmação.');
    if (auth.currentUser.emailVerified) return publicUser(auth.currentUser);
    await sendVerificationEmail(auth.currentUser);
    return publicUser(auth.currentUser);
}

async function changeUnverifiedEmail({ email, currentPassword }) {
    await initialize();
    const activeUser = auth.currentUser;
    if (!activeUser) throw new Error('Entre na conta antes de corrigir o e-mail.');
    if (activeUser.emailVerified) throw new Error('O e-mail desta conta já está confirmado.');
    const providers = (activeUser.providerData || []).map(entry => String(entry?.providerId || ''));
    if (!providers.includes('password') || !activeUser.email) {
        throw new Error('Entre novamente usando a conta correta para alterar este endereço.');
    }
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const password = String(currentPassword || '');
    if (!normalizedEmail || normalizedEmail === String(activeUser.email).toLowerCase()) {
        throw new Error('Informe um e-mail diferente do endereço atual.');
    }
    if (!password) throw new Error('Informe sua senha atual.');
    const credential = EmailAuthProvider.credential(activeUser.email, password);
    await reauthenticateWithCredential(activeUser, credential);
    await sendEmailChangeVerification(activeUser, normalizedEmail);
    return { email: normalizedEmail };
}

async function refreshUser() {
    await initialize();
    return refreshCurrentUser(auth.currentUser);
}

async function requestPasswordReset(email) {
    await initialize();
    try {
        await sendResetEmail(String(email || '').trim());
    } catch (error) {
        if (String(error?.code || '') !== 'auth/user-not-found') throw error;
    }
    return true;
}

function consumeActionReturn() {
    try {
        const url = new URL(root.location.href);
        const action = String(url.searchParams.get('authAction') || '');
        if (!['password-reset', 'email-verification', 'email-change'].includes(action)) return '';
        url.searchParams.delete('authAction');
        root.history?.replaceState?.(root.history.state, '', `${url.pathname}${url.search}${url.hash}`);
        return action;
    } catch {
        return '';
    }
}

async function updateDisplayName(displayName) {
    await initialize();
    if (!auth.currentUser) throw new Error('Entre na conta antes de alterar o perfil.');
    const normalizedName = String(displayName || '').trim().slice(0, 80);
    if (normalizedName.length < 2) throw new Error('Informe um nome com pelo menos 2 caracteres.');
    await updateProfile(auth.currentUser, { displayName: normalizedName });
    await reload(auth.currentUser);
    currentUser = auth.currentUser;
    notify();
    return publicUser();
}

async function changePassword({ currentPassword, newPassword }) {
    await initialize();
    const activeUser = auth.currentUser;
    if (!activeUser) throw new Error('Entre na conta antes de alterar a senha.');
    const providers = (activeUser.providerData || []).map(entry => String(entry?.providerId || ''));
    if (!providers.includes('password') || !activeUser.email) {
        throw new Error('Esta conta usa o acesso pelo Google. A senha deve ser gerenciada na Conta Google.');
    }
    const current = String(currentPassword || '');
    const next = String(newPassword || '');
    if (!current) throw new Error('Informe sua senha atual.');
    if (next.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.');
    const credential = EmailAuthProvider.credential(activeUser.email, current);
    await reauthenticateWithCredential(activeUser, credential);
    await updatePassword(activeUser, next);
    await activeUser.getIdToken(true);
    return true;
}

async function logout() {
    await initialize();
    await signOut(auth);
    currentUser = null;
    notify();
    return true;
}

async function getIdToken(forceRefresh = false) {
    await initialize();
    if (!auth.currentUser) return '';
    return auth.currentUser.getIdToken(Boolean(forceRefresh));
}

function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    listener(publicUser());
    return () => listeners.delete(listener);
}

function getUser() {
    return publicUser();
}

const api = Object.freeze({
    initialize,
    register,
    login,
    loginWithGoogle,
    completePendingGoogleLink,
    getPendingProviderLink,
    cancelPendingProviderLink,
    linkGoogleProvider,
    linkPasswordProvider,
    unlinkProvider,
    resendVerification,
    changeUnverifiedEmail,
    refreshUser,
    requestPasswordReset,
    consumeActionReturn,
    updateDisplayName,
    changePassword,
    logout,
    getIdToken,
    subscribe,
    getUser,
    consumeAuthError,
    firebaseErrorMessage
});

root.firebaseAuthClient = api;
