/**
 * lab.js - Kelola Ruang Lab Module
 * CRUD lab dari dashboard
 */

let labEditMode = false;
let labEditId = null;
let allLabData = [];

function initKelolaLab() {
    // Tombol tambah lab
    document.getElementById('btnTambahLab').addEventListener('click', () => {
        labEditMode = false;
        labEditId = null;
        setModalTitle('modalLab', 'Tambah Ruang Lab');
        setSubmitButton('modalLab', 'Simpan');
        document.getElementById('lab_nama').value = '';
        document.getElementById('lab_deskripsi').value = '';
        openModal('modalLab');
    });

    // Submit form lab
    document.getElementById('formLab').addEventListener('submit', async function(e) {
        e.preventDefault();
        const nama = document.getElementById('lab_nama').value.trim();
        const deskripsi = document.getElementById('lab_deskripsi').value.trim();

        if (!nama) return alert('Nama lab wajib diisi');

        const body = { nama, deskripsi };
        const url = labEditMode ? `/api/lab/${labEditId}` : '/api/lab';
        const data = labEditMode ? await apiPut(url, body) : await apiPost(url, body);

        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalLab');
            loadLabData();
        }
    });

    // Load data lab
    loadLabData();

    // Load saat panel dibuka
    const sidebar = document.querySelector('.sidebar-item[data-panel="kelola-lab"]');
    if (sidebar) sidebar.addEventListener('click', loadLabData);

    console.log('✅ Modul Kelola Lab siap');
}

async function loadLabData() {
    const container = document.getElementById('labList');
    if (!container) return;

    try {
        allLabData = await apiGet('/api/lab');
        renderLab(allLabData);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data lab.</p>';
    }
}

function renderLab(data) {
    const container = document.getElementById('labList');
    if (!data?.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada ruang lab.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">ID</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Lab</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Deskripsi</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.id}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.deskripsi || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">
                <button class="btn-edit" data-edit-lab="${item.id}">Edit</button>
                <button class="btn-delete" data-hapus-lab="${item.id}">Hapus</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Event edit & hapus
    container.querySelectorAll('[data-edit-lab]').forEach(btn => {
        btn.addEventListener('click', () => editLab(parseInt(btn.getAttribute('data-edit-lab'))));
    });
    container.querySelectorAll('[data-hapus-lab]').forEach(btn => {
        btn.addEventListener('click', () => hapusLab(parseInt(btn.getAttribute('data-hapus-lab'))));
    });
}

function editLab(id) {
    const item = allLabData.find(l => l.id === id);
    if (!item) return;

    labEditMode = true;
    labEditId = id;
    setModalTitle('modalLab', 'Edit Ruang Lab');
    setSubmitButton('modalLab', 'Update');

    document.getElementById('lab_nama').value = item.nama;
    document.getElementById('lab_deskripsi').value = item.deskripsi || '';
    openModal('modalLab');
}

async function hapusLab(id) {
    if (!confirm('Yakin hapus lab ini?')) return;

    const data = await apiDelete(`/api/lab/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadLabData();
}