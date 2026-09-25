// Thin fetch wrapper. The API lives on the same origin (/api) in both dev
// (Vite proxy) and production (served by the backend).

const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'adaptprep-token';

let onUnauthorized = () => {};

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const tokenStore = {
    get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
    set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* private mode */ } },
    clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ } }
};

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
    const token = tokenStore.get();
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            method,
            signal,
            headers: {
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        throw new ApiError('Cannot reach the AdaptPrep server. Check your connection and that the backend is running.', 0);
    }

    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!res.ok) {
        if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized(data?.message);
        throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
    }
    return data;
}

export const get = (p, o) => api(p, o);
export const post = (p, body) => api(p, { method: 'POST', body: body ?? {} });
export const put = (p, body) => api(p, { method: 'PUT', body: body ?? {} });
export const patch = (p, body) => api(p, { method: 'PATCH', body: body ?? {} });
export const del = (p, body) => api(p, { method: 'DELETE', body });
