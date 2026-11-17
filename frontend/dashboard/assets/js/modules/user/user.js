/**
 * user.js - Manajemen User Module
 * Khusus admin. Termasuk pengaturan izin akses per role.
 */

let userEditMode = false;
let userEditId = null;
let allUserData = [];
let listMapelOptions = []; // Menyimpan data mapel dari API

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

async function initManajemenUser() {
    const btnTambahUser = document.getElementById('btnTambahUser');
    const formUser = document.getElementById('formUser');
    const userListContainer = document.getElementById('userList');
    const roleSelect = document.getElementById('user_role');
    const mapelGroup = document.getElementById('user_mapel_group');
    const mapelSelect = document.getElementById('user_mapel');

    if (!btnTambahUser || !formUser || !userListContainer) {
        console.warn('Elemen manajemen user tidak ditemukan');
        return;
    }

    // 1. Muat opsi mata pelajaran dari settings publik
    async function loadMapelOptions() {
        try {
            const res = await apiGet('/api/settings/public');
            const data = res.data || res;
            if (data.mata_pelajaran_list) {
                let parsed = [];
                if (typeof data.mata_pelajaran_list === 'string') {
                    parsed = JSON.parse(data.mata_pelajaran_list);
                } else {
                    parsed = data.mata_pelajaran_list;
                }
                if (Array.isArray(parsed)) {
                    listMapelOptions = parsed;
                }
            }
        } catch (err) {
            console.warn('Gagal memuat list mapel:', err);
        }
        
        // Render ke select
        if (mapelSelect) {
            mapelSelect.innerHTML = '<option value="">Pilih Mata Pelajaran</option>' + 
                listMapelOptions.map(m => `<option value="${m}">${m}</option>`).join('');
        }
    }

    // Panggil saat init
    await loadMapelOptions();

    // 2. Logika Show/Hide Dropdown Mapel berdasarkan Role
    roleSelect.addEventListener('change', function() {
        if (this.value === 'guru') {
            mapelGroup.style.display = 'block';
        } else {
            mapelGroup.style.display = 'none';
            mapelSelect.value = ''; // Reset pilihan
        }
    });

    // 3. Tombol Tambah User
    btnTambahUser.addEventListener('click', () => {
        userEditMode = false;
        userEditId = null;
        setModalTitle('modalUser', 'Tambah User');
        setSubmitButton('modalUser', 'Simpan');
        document.getElementById('user_username').value = '';
        document.getElementById('user_password').value = '';
        document.getElementById('user_nama').value = '';
        document.getElementById('user_role').value = 'guru';
        document.getElementById('user_face_group').style.display = 'none';
        mapelSelect.value = '';
        // Trigger event change agar dropdown mapel muncul (karena default role = guru)
        roleSelect.dispatchEvent(new Event('change'));
        openModal('modalUser');
    });

    // 4. Submit Form
    formUser.addEventListener('submit', async function(e) {
        e.preventDefault();
        const role = document.getElementById('user_role').value;
        
        const body = {
            username: document.getElementById('user_username').value.trim(),
            nama: document.getElementById('user_nama').value.trim(),
            role: role,
            mata_pelajaran: role === 'guru' ? mapelSelect.value : ''
        };
        
        const password = document.getElementById('user_password').value;
        if (password) body.password = password;

        if (!body.username || !body.nama || !body.role) return alert('Field wajib diisi');
        if (body.role === 'guru' && !body.mata_pelajaran) return alert('Mata Pelajaran wajib dipilih untuk role Guru!');

        const url = userEditMode ? `/api/users/${userEditId}` : '/api/users';
        const data = userEditMode ? await apiPut(url, body) : await apiPost(url, body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalUser');
            loadUser();
        }
    });

    const btnSimpanPerm = document.getElementById('btnSimpanPermissions');
    if (btnSimpanPerm) {
        btnSimpanPerm.addEventListener('click', saveRolePermissions);
    }

    const sidebarSetting = document.querySelector('.sidebar-item[data-panel="setting"]');
    if (sidebarSetting) {
        sidebarSetting.addEventListener('click', () => {
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

// User CRUD functions
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
            <th style="padding:8px;border:1px solid #d0e6d5;">Mata Pelajaran</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(u => {
        const mapelText = u.role === 'guru' ? (u.mata_pelajaran || '-') : '-';
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${u.username}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${u.nama}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;text-transform:capitalize;">${u.role}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${mapelText}</td>
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
    document.getElementById('user_password').value = '';
    
    const roleSelect = document.getElementById('user_role');
    const mapelGroup = document.getElementById('user_mapel_group');
    const mapelSelect = document.getElementById('user_mapel');
    
    roleSelect.value = u.role;
    mapelSelect.value = u.mata_pelajaran || '';
    
    // Tampilkan / sembunyikan dropdown mapel sesuai role user yang diedit
    if (u.role === 'guru') {
        mapelGroup.style.display = 'block';
    } else {
        mapelGroup.style.display = 'none';
    }

    document.getElementById('user_face_group').style.display = 'block';
    
    openModal('modalUser');
}

async function hapusUser(id) {
    if (!confirm('Yakin hapus user ini?')) return;
    const data = await apiDelete(`/api/users/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadUser();
}

//    Role permissions

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
            if (typeof initSidebar === 'function') initSidebar();
        }
    } catch (err) {
        alert('Gagal menyimpan izin role');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Simpan';
    }
}
// Face recognition functions
let faceMatcher = null;
let deteksiInterval = null;
let currentDescriptor = null;
const MODEL_URL = '/dashboard/assets/models';

async function bukaKameraWajah(userId, nama) {
    const video = document.getElementById('videoWajah');
    const status = document.getElementById('statusWajah');
    const btnSimpan = document.getElementById('btnSimpanWajah');
    
    openModal('modalKameraWajah');
    status.textContent = 'Memuat model AI...';
    btnSimpan.disabled = true;

    try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        status.textContent = 'Menyalakan kamera...';
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.onplaying = () => {
            status.textContent = 'Wajah terdeteksi! Klik Simpan.';
            btnSimpan.disabled = false;
            mulaiDeteksi(video);
        };
    } catch (err) {
        console.error(err);
        status.textContent = 'Error: ' + err.message;
    }
}

async function mulaiDeteksi(video) {
    const canvas = document.getElementById('overlayWajah');
    
    deteksiInterval = setInterval(async () => {
        const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
        
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        
        if (resizedDetections) {
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            currentDescriptor = Array.from(detections.descriptor);
        }
    }, 500);
}

function tutupKamera() {
    const video = document.getElementById('videoWajah');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    clearInterval(deteksiInterval);
    closeModal('modalKameraWajah');
}

// Event Listener Tombol
document.getElementById('btnDaftarWajah')?.addEventListener('click', () => {
    if (!userEditId) return alert('Simpan user terlebih dahulu sebelum mendaftarkan wajah.');
    bukaKameraWajah(userEditId, document.getElementById('user_nama').value);
});

document.getElementById('btnSimpanWajah')?.addEventListener('click', async () => {
    if (!currentDescriptor) return alert('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.');
    
    const btn = document.getElementById('btnSimpanWajah');
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
        const res = await apiPut(`/api/users/${userEditId}/face`, { descriptor: JSON.stringify(currentDescriptor) });
        alert(res.message);
        if (!res.message.includes('Gagal')) {
            tutupKamera();
        }
    } catch (err) {
        alert('Gagal menyimpan wajah');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Simpan Wajah';
    }
});