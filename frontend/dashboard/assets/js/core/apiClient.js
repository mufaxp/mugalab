/**
 * apiClient.js - Fetch Wrapper
 */

async function apiGet(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = query ? `${url}?${query}` : url;
    const res = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
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
    return res.json();
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
    return res.json();
}

async function apiDelete(url) {
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
}

window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;