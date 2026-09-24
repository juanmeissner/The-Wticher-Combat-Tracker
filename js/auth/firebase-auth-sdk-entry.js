import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    EmailAuthProvider,
    GoogleAuthProvider,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    getRedirectResult,
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
    updatePassword,
    updateProfile
} from 'firebase/auth';

const root = typeof globalThis !== 'undefined' ? globalThis : window;
let auth = null;
let initializePromise = null;
let unsubscribeAuth = null;
let currentUser = null;
const listeners = new Set();

function publicUser(user = currentUser) {
    if (!user) return null;
    return Object.freeze({
        uid: String(user.uid || ''),
        email: String(user.email || ''),
        displayName: String(user.displayName || ''),
        emailVerified: Boolean(user.emailVerified),
        photoURL: String(user.photoURL || ''),
        providerIds: Object.freeze((user.providerData || []).map(entry => String(entry?.providerId || '')).filter(Boolean))
    });
}

function notify() {
    const snapshot = publicUser();
    listeners.forEach(listener => {
        try { listener(snapshot); } catch { /* um observador não interrompe os demais */ }
    });
}

function actionContinueUrl() {
    try {
        const url = new URL(root.location.href);
        url.hash = '';
        url.search = '';
        return url.href;
    } catch {
        return undefined;
    }
}

function actionCodeSettings() {
    const url = actionContinueUrl();
    return url ? { url, handleCodeInApp: false } : undefined;
}

function shouldUseFirebaseHostedAction(error) {
    return ['auth/invalid-continue-uri', 'auth/unauthorized-continue-uri'].includes(String(error?.code || ''));
}

async function sendVerificationEmail(user) {
    const settings = actionCodeSettings();
    if (!settings) return sendEmailVerification(user);
    try {
        return await sendEmailVerification(user, settings);
    } catch (error) {
        if (!shouldUseFirebaseHostedAction(error)) throw error;
        return sendEmailVerification(user);
    }
}

async function sendResetEmail(email) {
    const settings = actionCodeSettings();
    if (!settings) return sendPasswordResetEmail(auth, email);
    try {
        return await sendPasswordResetEmail(auth, email, settings);
    } catch (error) {
        if (!shouldUseFirebaseHostedAction(error)) throw error;
        return sendPasswordResetEmail(auth, email);
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
        'auth/weak-password': 'A senha precisa ter pelo menos 8 caracteres.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'auth/network-request-failed': 'Não foi possível conectar ao serviço de autenticação.',
        'auth/popup-closed-by-user': 'A janela do Google foi fechada antes da conclusão.',
        'auth/popup-blocked': 'O navegador bloqueou a janela de login do Google.',
        'auth/unauthorized-domain': 'Este endereço ainda não está autorizado no Firebase.',
        'auth/operation-not-allowed': 'Este método de login ainda não está habilitado no Firebase.'
    };
    return messages[code] || String(error?.message || 'Não foi possível concluir a autenticação.');
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
        await setPersistence(auth, browserLocalPersistence);
        if (!unsubscribeAuth) {
            unsubscribeAuth = onAuthStateChanged(auth, user => {
                currentUser = user || null;
                notify();
            });
        }
        try {
            await getRedirectResult(auth);
        } catch (error) {
            if (error?.code !== 'auth/no-auth-event') throw error;
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
        throw error;
    }
}

async function resendVerification() {
    await initialize();
    if (!auth.currentUser) throw new Error('Entre na conta antes de solicitar a confirmação.');
    if (auth.currentUser.emailVerified) return publicUser(auth.currentUser);
    await sendVerificationEmail(auth.currentUser);
    return publicUser(auth.currentUser);
}

async function refreshUser() {
    await initialize();
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    currentUser = auth.currentUser;
    notify();
    return publicUser();
}

async function requestPasswordReset(email) {
    await initialize();
    await sendResetEmail(String(email || '').trim());
    return true;
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
    resendVerification,
    refreshUser,
    requestPasswordReset,
    updateDisplayName,
    changePassword,
    logout,
    getIdToken,
    subscribe,
    getUser,
    firebaseErrorMessage
});

root.firebaseAuthClient = api;
