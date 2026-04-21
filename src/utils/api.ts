// Generic fetcher that automatically includes the JWT from localStorage

export const API_URL = '/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMsg = 'An error occurred';
        try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
        } catch (e) {
            // JSON parse failed
        }
        throw new Error(errorMsg);
    }

    // Handle empty responses
    if (res.status === 204) return null;

    return res.json();
}
