/**
 * alat.js - Inventaris Alat Module
 * CRUD alat, search, render tabel
 */

let alatEditMode = false;
let alatEditId = null;
let allAlatData = [];

function initAlat() {
    // const invLabFilter = document.getElementById('invLabFilter');

    // function getInvLabFilter() {
    //     if (!invLabFilter) return null;
    //     const v = invLabFilter.value;
    //     return v === 'all' ? null : parseInt(v);
    // }

    // if (invLabFilter) {
    //     invLabFilter.addEventListener('change', () => loadAlat());
    // }

    // Tombol Tambah Alat
    document.getElementById('btnTambahAlat').addEventListener('click', function() {
        alatEditMode = false;
        alatEditId = null;
        document.getElementById('modalAlatTitle').textContent = 'Tambah Alat';
        document.getElementById('formAlat').reset();
        openModal('modalAlat');
    });

    // Submit form
    document.getElementById('formAlat').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_alat: document.getElementById('alat_kode').value,
            nama_alat: document.getElementById('alat_nama').value,
            produsen: document.getElementById('alat_produsen').value || '-',
            jumlah: parseInt(document.getElementById('alat_jumlah').value),
            jumlah_rusak: parseInt(document.getElementById('alat_jumlah_rusak').value) || 0,
            kondisi: document.getElementById('alat_kondisi').value,
            lab_id: parseInt(document.getElementById('alat_lab').value),
            keterangan: document.getElementById('alat_keterangan').value
        };
        if (!body.kode_alat || !body.nama_alat || !body.jumlah) return alert('Kode, nama, dan jumlah wajib diisi');

        const url = alatEditMode ? `/api/alat/${alatEditId}` : '/api/alat';
        const data = alatEditMode ? await apiPut(url, body) : await apiPost(url, body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalAlat');
            loadAlat();
        }
    });

    // Search
    const searchAlat = document.getElementById('searchAlat');
    const suggestAlat = document.getElementById('suggestAlat');

    searchAlat.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        if (!keyword) { suggestAlat.classList.remove('active'); renderAlat(allAlatData); return; }
        const filtered = allAlatData.filter(item => item.nama_alat.toLowerCase().includes(keyword) || item.kode_alat.toLowerCase().includes(keyword));
        suggestAlat.innerHTML = filtered.map(item => `<div class="search-suggest-item" data-id="${item.id}">${item.kode_alat} - ${item.nama_alat}</div>`).join('');
        suggestAlat.classList.add('active');
    });

    suggestAlat.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            const id = parseInt(item.getAttribute('data-id'));
            renderAlat(allAlatData.filter(a => a.id === id));
            suggestAlat.classList.remove('active');
            searchAlat.value = '';
        }
    });

    document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) suggestAlat.classList.remove('active'); });

    loadAlat();
    console.log('✅ Modul Alat siap');
}

async function loadAlat() {
    const container = document.getElementById('alatList');
    if (!container) return;
    try {
        const labId = document.getElementById('invLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        allAlatData = await apiGet('/api/alat', params);
        renderAlat(allAlatData);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data alat.</p>';
    }
}

function renderAlat(data) {
    const container = document.getElementById('alatList');
    if (!data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada data alat.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Kode</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Alat</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Produsen</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jumlah</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kondisi</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const kondisiEmoji = item.kondisi === 'baik' ? '✅' : item.kondisi === 'rusak' ? '🔴' : '🟡';
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kode_alat}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_alat}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.produsen}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jumlah} total<br><span style="color:#c62828;font-size:11px;">${item.jumlah_rusak||0} rusak</span></td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${kondisiEmoji} ${item.kondisi}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">
                <button class="btn-edit" data-edit-alat="${item.id}">Edit</button>
                <button class="btn-delete" data-hapus-alat="${item.id}">Hapus</button>
            </td></tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('[data-edit-alat]').forEach(btn => btn.addEventListener('click', () => editAlat(parseInt(btn.getAttribute('data-edit-alat')))));
    container.querySelectorAll('[data-hapus-alat]').forEach(btn => btn.addEventListener('click', () => hapusAlat(parseInt(btn.getAttribute('data-hapus-alat')))));
}

async function editAlat(id) {
    const item = allAlatData.find(a => a.id === id);
    if (!item) return;
    alatEditMode = true;
    alatEditId = id;
    document.getElementById('modalAlatTitle').textContent = 'Edit Alat';
    document.getElementById('alat_kode').value = item.kode_alat;
    document.getElementById('alat_nama').value = item.nama_alat;
    document.getElementById('alat_produsen').value = item.produsen;
    document.getElementById('alat_jumlah').value = item.jumlah;
    document.getElementById('alat_jumlah_rusak').value = item.jumlah_rusak || 0;
    document.getElementById('alat_kondisi').value = item.kondisi || 'baik';
    document.getElementById('alat_lab').value = item.lab_id;
    document.getElementById('alat_keterangan').value = item.keterangan || '';
    openModal('modalAlat');
}

async function hapusAlat(id) {
    if (!confirm('Yakin hapus alat ini?')) return;
    const data = await apiDelete(`/api/alat/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadAlat();
}