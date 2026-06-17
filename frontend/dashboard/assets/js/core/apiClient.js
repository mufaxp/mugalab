/**
 * apiClient.js - Fetch Wrapper
 * Semua HTTP request ke backend melalui fungsi ini.
 * Otomatis menyertakan token JWT.
 */

const API_BASE = '';

async function apiGet(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = query ? `${API_BASE}${url}?${query}` : `${API_BASE}${url}`;
    const res = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
}

async function apiPost(url, body = {}) {
    const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function apiPut(url, body = {}) {
    const res = await fetch(`${API_BASE}${url}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function apiDelete(url) {
    const res = await fetch(`${API_BASE}${url}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
}