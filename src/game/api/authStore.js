let accessToken = null;
let player = null;

export function getAccessToken() {
    return accessToken;
}

export function getCurrentPlayer() {
    return player;
}

export function setSession(session) {
    if (typeof session?.accessToken !== 'string' || !session.jugador) {
        throw new Error('La API devolvió una sesión incompleta.');
    }

    accessToken = session.accessToken;
    player = {
        ...session.jugador,
        id: Number(session.jugador.id),
        alias: String(session.jugador.alias || '')
    };
    if (!Number.isFinite(player.id) || !player.alias) {
        clearSession();
        throw new Error('La API devolvió un perfil de jugador inválido.');
    }
    return player;
}

export function updateCurrentPlayer(updatedPlayer) {
    if (!updatedPlayer || !Number.isFinite(Number(updatedPlayer.id))) {
        throw new Error('La API devolvió un perfil de jugador inválido.');
    }
    player = { ...player, ...updatedPlayer, id: Number(updatedPlayer.id) };
    return player;
}

export function clearSession() {
    accessToken = null;
    player = null;
}
