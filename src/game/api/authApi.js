import { apiRequest, requestRefresh } from './httpClient';
import { clearSession, setSession } from './authStore';

export async function registerPlayer(alias, password) {
    return apiRequest('/api/jugadores', {
        method: 'POST',
        body: { alias, password },
        authenticated: false
    });
}

export async function login(alias, password) {
    const session = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { alias, password },
        authenticated: false,
        includeCookies: true
    });
    return setSession(session);
}

export async function restoreLogin() {
    return requestRefresh();
}

export async function logout() {
    await apiRequest('/api/auth/logout', {
        method: 'POST',
        authenticated: false,
        includeCookies: true
    });
    clearSession();
}
