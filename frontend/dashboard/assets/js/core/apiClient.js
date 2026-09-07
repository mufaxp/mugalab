/**
 * apiClient.js - Fetch Wrapper
 */

async function apiGet(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = query ? `${url}?${query}` : url;
    const res = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json().catch(() => ({}));
    return data ?? {};
}

async function apiPost(url, body = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return data ?? {};
}

async function apiPut(url, body = {}) {
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    });

    // Coba parse JSON, jika gagal atau null kembalikan objek kosong
    const data = await res.json().catch(() => ({}));
    return data ?? {};  // null/undefined diubah menjadi {}
}

async function apiDelete(url) {
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json().catch(() => ({}));
    return data ?? {};
}

window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;