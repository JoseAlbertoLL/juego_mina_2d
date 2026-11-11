import { apiRequest } from './httpClient';

export async function getRanking(page = 0, size = 10) {
    const result = await apiRequest(`/api/jugadores?page=${page}&size=${size}`);
    if (!Array.isArray(result?.content)) {
        throw new Error('La API devolvió un ranking con formato inválido.');
    }
    return result;
}

export async function getPlayerProfile(playerId) {
    return apiRequest(`/api/jugadores/${encodeURIComponent(playerId)}`);
}

export async function getPlayerGames(playerId) {
    const result = await apiRequest(`/api/jugadores/${encodeURIComponent(playerId)}/partidas`);
    if (!Array.isArray(result)) {
        throw new Error('La API devolvió un historial de partidas con formato inválido.');
    }
    return result;
}

export async function updatePlayerAlias(playerId, alias) {
    return apiRequest(`/api/jugadores/${encodeURIComponent(playerId)}/alias`, {
        method: 'PATCH',
        body: { alias }
    });
}

export async function updatePlayerPassword(playerId, contrasena) {
    return apiRequest(`/api/jugadores/${encodeURIComponent(playerId)}/contrasena`, {
        method: 'PATCH',
        body: { contrasena }
    });
}
