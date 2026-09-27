/**
 * user.js - Manajemen User Module
 * Khusus admin. Termasuk pengaturan izin akses per role.
 */

let userEditMode = false;
let userEditId = null;
let allUserData = [];

const ALL_PANELS = [
    { id: 'jadwal',             label: 'Jadwal' },
    { id: 'inventaris',         label: 'Inventaris' },
    { id: 'laporan',            label: 'Laporan Kerusakan' },
    { id: 'riwayat',            label: 'Riwayat Bahan' },
    { id: 'laporan-praktikum',  label: 'Laporan Praktikum' },
    { id: 'pengajuan',          label: 'Pengajuan Jadwal' },
    { id: 'peminjaman',         label: 'Peminjaman' },
    { id: 'setting',            label: 'Pengaturan' }
];

const ALL_ROLES = [
    { id: 'admin',   label: 'Administrator' },
    { id: 'laboran', label: 'Laboran' },
    { id: 'guru',    label: 'Guru' }
];

function initManajemenUser() {
    const btnTambahUser = document.getElementById('btnTambahUser');
    const formUser = document.getElementById('formUser');
    const userListContainer = document.getElementById('userList');

    if (!btnTambahUser || !formUser || !userListContainer) {
        console.warn('Elemen manajemen user tidak ditemukan');
        return;
    }

    btnTambahUser.addEventListener('click', () => {
        userEditMode = false;
        userEditId = null;
        setModalTitle('modalUser', 'Tambah User');
        setSubmitButton('modalUser', 'Simpan');
        document.getElementById('user_username').value = '';
        document.getElementById('user_password').value = '';
        document.getElementById('user_nama').value = '';
        document.getElementById('user_role').value = 'guru';
        openModal('modalUser');
    });

    formUser.addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            username: document.getElementById('user_username').value.trim(),
            nama: document.getElementById('user_nama').value.trim(),
            role: document.getElementById('user_role').value,
        };
        const password = document.getElementById('user_password').value;
        if (password) body.password = password;

        if (!body.username || !body.nama || !body.role) return alert('Field wajib diisi');

        const url = userEditMode ? `/api/users/${userEditId}` : '/api/users';
        const data = userEditMode ? await apiPut(url, body) : await apiPost(url, body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalUser');
            loadUser();
        }
    });

    // Tombol Simpan Izin Role
    const btnSimpanPerm = document.getElementById('btnSimpanPermissions');
    if (btnSimpanPerm) {
        btnSimpanPerm.addEventListener('click', saveRolePermissions);
    }

    // Reload saat tab Manajemen User dibuka
    const sidebarSetting = document.querySelector('.sidebar-item[data-panel="setting"]');
    if (sidebarSetting) {
        sidebarSetting.addEventListener('click', () => {
            // hanya load kalau tab user sedang aktif
            const activeTab = document.querySelector('.settings-tab.active');
            if (activeTab && activeTab.getAttribute('data-settings-tab') === 'user') {
                loadUser();
                loadRolePermissions();
            }
        });
    }

    loadUser();
    loadRolePermissions();
    console.log('✅ Modul Manajemen User siap');
}

/* ============================================
   USER CRUD
   ============================================ */

async function loadUser() {
    const container = document.getElementById('userList');
    if (!container) return;
    try {
        const response = await apiGet('/api/users');
        allUserData = Array.isArray(response) ? response : (response.data || []);
        renderUser(allUserData);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;">Gagal memuat data user.</p>';
    }
}

function renderUser(data) {
    const container = document.getElementById('userList');
    if (!data?.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Tidak ada user.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Username</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Role</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(u => {
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${u.username}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${u.nama}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${u.role}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">
                <button class="btn-edit" data-edit-user="${u.id}">Edit</button>
                <button class="btn-delete" data-hapus-user="${u.id}">Hapus</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('[data-edit-user]').forEach(btn => {
        btn.addEventListener('click', () => editUser(parseInt(btn.getAttribute('data-edit-user'))));
    });
    container.querySelectorAll('[data-hapus-user]').forEach(btn => {
        btn.addEventListener('click', () => hapusUser(parseInt(btn.getAttribute('data-hapus-user'))));
    });
}

async function editUser(id) {
    const u = allUserData.find(x => x.id === id);
    if (!u) return;
    userEditMode = true;
    userEditId = id;
    setModalTitle('modalUser', 'Edit User');
    setSubmitButton('modalUser', 'Update');
    document.getElementById('user_username').value = u.username;
    document.getElementById('user_nama').value = u.nama;
    document.getElementById('user_role').value = u.role;
    document.getElementById('user_password').value = '';
    openModal('modalUser');
}

async function hapusUser(id) {
    if (!confirm('Yakin hapus user ini?')) return;
    const data = await apiDelete(`/api/users/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadUser();
}

/* ============================================
   ROLE PERMISSIONS
   ============================================ */

async function loadRolePermissions() {
    const container = document.getElementById('rolePermissionsContainer');
    if (!container) return;

    try {
        const res = await apiGet('/api/settings/role-permissions');
        const perms = res.data || res;
        renderRolePermissions(perms);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat izin role.</p>';
    }
}

function renderRolePermissions(perms) {
    const container = document.getElementById('rolePermissionsContainer');

    let html = '';
    ALL_ROLES.forEach(role => {
        const activePanels = perms[role.id] || [];

        html += `<div class="role-permission-card">
            <div class="role-permission-title">${role.label}</div>
            <div class="role-chips">`;

        ALL_PANELS.forEach(panel => {
            const isActive = activePanels.includes(panel.id);
            const isLocked = role.id === 'admin' && panel.id === 'setting';
            html += `<button type="button"
                class="role-chip ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                data-role="${role.id}"
                data-panel="${panel.id}"
                ${isLocked ? 'title="Panel Pengaturan wajib aktif untuk admin"' : ''}>
                ${panel.label}${isLocked ? ' 🔒' : ''}
            </button>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;

    // Bind click toggle
    container.querySelectorAll('.role-chip:not(.locked)').forEach(chip => {
        chip.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
}

async function saveRolePermissions() {
    const result = { admin: [], laboran: [], guru: [] };

    document.querySelectorAll('.role-chip.active').forEach(chip => {
        const role = chip.getAttribute('data-role');
        const panel = chip.getAttribute('data-panel');
        if (result[role]) result[role].push(panel);
    });

    // Pastikan urutan panel konsisten
    for (const r in result) {
        result[r].sort((a, b) => {
            const ai = ALL_PANELS.findIndex(p => p.id === a);
            const bi = ALL_PANELS.findIndex(p => p.id === b);
            return ai - bi;
        });
    }

    const btn = document.getElementById('btnSimpanPermissions');
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
        const res = await apiPut('/api/settings/role-permissions', result);
        alert(res.message || 'Tersimpan');
        if (res.message && !res.message.includes('Gagal')) {
            // Refresh sidebar supaya perubahan langsung terlihat
            if (typeof initSidebar === 'function') initSidebar();
        }
    } catch (err) {
        alert('Gagal menyimpan izin role');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Simpan';
    }
}