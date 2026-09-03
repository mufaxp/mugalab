/**
 * user.js - Manajemen User Module
 * Khusus admin
 */

let userEditMode = false;
let userEditId = null;
let allUserData = [];

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

    loadUser();
    const sidebar = document.querySelector('.sidebar-item[data-panel="user"]');
    if (sidebar) sidebar.addEventListener('click', loadUser);

    console.log('✅ Modul Manajemen User siap');
}

async function loadUser() {
    const container = document.getElementById('userList');
    if (!container) return;
    try {
        allUserData = await apiGet('/api/users');
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