export const API_CONFIG = Object.freeze({
    baseUrl: (import.meta.env.VITE_API_BASE_URL || 'https://dusty.aletra.mx').replace(/\/+$/, '')
});
