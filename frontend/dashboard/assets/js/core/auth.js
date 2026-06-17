/**
 * auth.js - Authentication
 * Cek login, ambil token, logout.
 */

function checkAuth() {
    const token = localStorage.getItem('token');
    const nama = localStorage.getItem('nama');
    if (!token || !nama) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

function getToken() {
    return localStorage.getItem('token');
}

function getNama() {
    return localStorage.getItem('nama');
}

function displayNama() {
    const el = document.getElementById('userNameDisplay');
    if (el) el.textContent = getNama();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nama');
    window.location.href = '/login';
}

function initLogoutButton() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', logout);
}