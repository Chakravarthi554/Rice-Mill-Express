import { API_URL } from '../config/env';

export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Remove /api if it's at the end of API_URL to get the server root
    const serverUrl = API_URL.replace(/\/api$/, '');

    return `${serverUrl}${normalizedPath}`;
};
