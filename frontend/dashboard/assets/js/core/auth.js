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

function initUserMenu() {
    const wrapper = document.querySelector('.user-menu-wrapper');
    const btn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');

    if (!wrapper || !btn || !dropdown) return;

    // Toggle dropdown saat tombol diklik
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.toggle('open');
    });

    // Tutup dropdown saat klik di luar
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            wrapper.classList.remove('open');
        }
    });

    // Tutup saat item dipilih
    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const action = item.getAttribute('data-action');
        wrapper.classList.remove('open');

        if (action === 'logout') {
            logout();
        } else if (action === 'user') {
            alert('Fitur User belum tersedia.'); // atau tampilkan modal user
        } else if (action === 'setting') {
            alert('Fitur Setting belum tersedia.'); // atau arahkan ke halaman setting
        }
    });
}