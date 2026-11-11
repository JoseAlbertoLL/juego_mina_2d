import { API_CONFIG } from './config';
import { clearSession, getAccessToken, setSession } from './authStore';

export class ApiError extends Error {
    constructor(message, { status = 0, title = 'Error de conexión', detail = '' } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.title = title;
        this.detail = detail;
    }
}

let refreshPromise = null;

function getUrl(path) {
    return `${API_CONFIG.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function readResponse(response) {
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch (error) {
        if (response.ok) {
            throw new ApiError('La API devolvió una respuesta inválida.', {
                status: response.status,
                detail: 'La respuesta no contiene JSON válido.'
            });
        }
        return null;
    }
}

function toApiError(response, body) {
    const title = typeof body?.title === 'string' ? body.title : `Error ${response.status}`;
    const detail = typeof body?.detail === 'string'
        ? body.detail
        : 'No se pudo completar la solicitud. Intenta de nuevo.';
    return new ApiError(`${title}: ${detail}`, {
        status: response.status,
        title,
        detail
    });
}

function notifySessionExpired() {
    clearSession();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dusty:session-expired'));
    }
}

async function refreshSessionToken({ notify = true } = {}) {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const response = await fetch(getUrl('/api/auth/refresh'), {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    credentials: 'include'
                });
                const body = await readResponse(response);
                if (!response.ok) throw toApiError(response, body);
                return setSession(body);
            } catch (error) {
                clearSession();
                if (notify) notifySessionExpired();
                throw error;
            } finally {
                refreshPromise = null;
            }
        })();
    }
    return refreshPromise;
}

export async function restoreSession() {
    try {
        return await refreshSessionToken({ notify: false });
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }
}

export async function apiRequest(path, {
    method = 'GET',
    body,
    authenticated = true,
    includeCookies = false,
    retryUnauthorized = true
} = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = authenticated ? getAccessToken() : null;
    if (token) headers.Authorization = ['Bearer', token].join(' ');

    let response;
    try {
        response = await fetch(getUrl(path), {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            credentials: includeCookies ? 'include' : 'same-origin'
        });
    } catch (error) {
        throw new ApiError('No se pudo conectar con DUSTY.', {
            detail: 'Revisa tu conexión y que el backend permita el origen del juego por CORS.'
        });
    }

    if (response.status === 401 && authenticated && !retryUnauthorized) {
        notifySessionExpired();
    }

    if (response.status === 401 && authenticated && retryUnauthorized) {
        try {
            await refreshSessionToken();
        } catch (error) {
            throw error instanceof ApiError
                ? error
                : new ApiError('La sesión venció.', {
                    status: 401,
                    detail: 'Inicia sesión de nuevo para continuar.'
                });
        }
        return apiRequest(path, {
            method,
            body,
            authenticated,
            includeCookies,
            retryUnauthorized: false
        });
    }

    const data = await readResponse(response);
    if (!response.ok) throw toApiError(response, data);
    return data;
}

export async function requestRefresh() {
    try {
        return await refreshSessionToken({ notify: false });
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }
}
