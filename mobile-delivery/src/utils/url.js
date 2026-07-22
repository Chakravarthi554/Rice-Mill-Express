import { API_URL } from '../config/env';

export const getImageUrl = (path) => {
    if (!path) return null;
    let url = path;
    if (!url.startsWith('http')) {
        const normalizedPath = url.startsWith('/') ? url : `/${url}`;
        const serverUrl = API_URL.replace(/\/api\/?$/, '');
        url = `${serverUrl}${normalizedPath}`;
    }
    // Rewrite localhost / 127.0.0.1 to current mobile API_URL host
    if (url.includes('localhost:') || url.includes('127.0.0.1:')) {
        const serverUrl = API_URL.replace(/\/api\/?$/, '');
        url = url.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, serverUrl);
    }
    return url;
};
