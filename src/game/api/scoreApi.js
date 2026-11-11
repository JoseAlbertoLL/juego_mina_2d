import { apiRequest } from './httpClient';

export async function submitScore(score) {
    if (!Number.isInteger(score) || score < 0) {
        throw new Error('La puntuación debe ser un entero no negativo.');
    }
    return apiRequest('/api/partidas', {
        method: 'POST',
        body: { puntuacion: score }
    });
}
