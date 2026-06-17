/**
 * bahan.js - Inventaris Bahan Module
 * CRUD bahan, search, pakai bahan
 */

let bahanEditMode = false;
let bahanEditId = null;
let allBahanData = [];

function initBahan() {
    // Tombol Tambah Bahan
    document.getElementById('btnTambahBahan').addEventListener('click', function() {
        bahanEditMode = false;
        bahanEditId = null;
        document.getElementById('modalBahanTitle').textContent = 'Tambah Bahan';
        document.getElementById('formBahan').reset();
        openModal('modalBahan');
    });

    // Submit form
    document.getElementById('formBahan').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_bahan: document.getElementById('bahan_kode').value,
            nama_bahan: document.getElementById('bahan_nama').value,
            produsen: document.getElementById('bahan_produsen').value || '-',
            jumlah: parseFloat(document.getElementById('bahan_jumlah').value),
            satuan: document.getElementById('bahan_satuan').value,
            tanggal_kadaluarsa: document.getElementById('bahan_kadaluarsa').value || null,
            lab_id: parseInt(document.getElementById('bahan_lab').value),
            keterangan: document.getElementById('bahan_keterangan').value
        };
        if (!body.kode_bahan || !body.nama_bahan || !body.jumlah) return alert('Kode, nama, dan jumlah wajib diisi');

        const url = bahanEditMode ? `/api/bahan/${bahanEditId}` : '/api/bahan';
        const data = bahanEditMode ? await apiPut(url, body) : await apiPost(url, body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalBahan');
            loadBahan();
        }
    });

    // Search
    const searchBahan = document.getElementById('searchBahan');
    const suggestBahan = document.getElementById('suggestBahan');

    searchBahan.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        if (!keyword) { suggestBahan.classList.remove('active'); renderBahan(allBahanData); return; }
        const filtered = allBahanData.filter(item => item.nama_bahan.toLowerCase().includes(keyword) || item.kode_bahan.toLowerCase().includes(keyword));
        suggestBahan.innerHTML = filtered.map(item => `<div class="search-suggest-item" data-id="${item.id}">${item.kode_bahan} - ${item.nama_bahan}</div>`).join('');
        suggestBahan.classList.add('active');
    });

    suggestBahan.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            const id = parseInt(item.getAttribute('data-id'));
            renderBahan(allBahanData.filter(b => b.id === id));
            suggestBahan.classList.remove('active');
            searchBahan.value = '';
        }
    });

    document.addEventListener('click', e => { if (!e.target.closest('#bahanPanel .search-wrapper')) suggestBahan.classList.remove('active'); });

    // Pakai Bahan
    document.getElementById('formPakai').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            bahan_id: parseInt(document.getElementById('pakai_bahan_id').value),
            jumlah_digunakan: parseFloat(document.getElementById('pakai_jumlah').value),
            penanggung_jawab: document.getElementById('pakai_pj').value,
            kelas: document.getElementById('pakai_kelas').value || '-',
            kegiatan: document.getElementById('pakai_kegiatan').value,
            tanggal: document.getElementById('pakai_tanggal').value
        };
        const data = await apiPost('/api/bahan/pakai', body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalPakai');
            loadBahan();
        }
    });

    loadBahan();
    console.log('✅ Modul Bahan siap');
}

async function loadBahan() {
    const container = document.getElementById('bahanList');
    if (!container) return;
    try {
        const labId = document.getElementById('invLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        allBahanData = await apiGet('/api/bahan', params);
        renderBahan(allBahanData);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data bahan.</p>';
    }
}

function renderBahan(data) {
    const container = document.getElementById('bahanList');
    if (!data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada data bahan.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Kode</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Bahan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Produsen</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Stok</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Satuan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kadaluarsa</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const tgl = item.tanggal_kadaluarsa ? item.tanggal_kadaluarsa.substring(0, 10) : '-';
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kode_bahan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_bahan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.produsen}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jumlah}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.satuan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tgl}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">
                <button class="btn-edit" data-edit-bahan="${item.id}">Edit</button>
                <button class="btn-delete" data-hapus-bahan="${item.id}">Hapus</button>
                <button class="btn-pakai" data-pakai-bahan='${JSON.stringify({id:item.id,nama:item.nama_bahan,stok:item.jumlah,satuan:item.satuan})}'>Pakai</button>
            </td></tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('[data-edit-bahan]').forEach(btn => btn.addEventListener('click', () => editBahan(parseInt(btn.getAttribute('data-edit-bahan')))));
    container.querySelectorAll('[data-hapus-bahan]').forEach(btn => btn.addEventListener('click', () => hapusBahan(parseInt(btn.getAttribute('data-hapus-bahan')))));
    container.querySelectorAll('[data-pakai-bahan]').forEach(btn => {
        btn.addEventListener('click', function() {
            const d = JSON.parse(this.getAttribute('data-pakai-bahan'));
            bukaModalPakai(d.id, d.nama, d.stok, d.satuan);
        });
    });
}

function bukaModalPakai(id, nama, stok, satuan) {
    document.getElementById('pakai_bahan_id').value = id;
    document.getElementById('pakai_stok').textContent = `${stok} ${satuan}`;
    document.getElementById('formPakai').reset();
    document.getElementById('pakai_tanggal').valueAsDate = new Date();
    openModal('modalPakai');
}

async function editBahan(id) {
    const item = allBahanData.find(b => b.id === id);
    if (!item) return;
    bahanEditMode = true;
    bahanEditId = id;
    document.getElementById('modalBahanTitle').textContent = 'Edit Bahan';
    document.getElementById('bahan_kode').value = item.kode_bahan;
    document.getElementById('bahan_nama').value = item.nama_bahan;
    document.getElementById('bahan_produsen').value = item.produsen;
    document.getElementById('bahan_jumlah').value = item.jumlah;
    document.getElementById('bahan_satuan').value = item.satuan;
    document.getElementById('bahan_kadaluarsa').value = item.tanggal_kadaluarsa ? item.tanggal_kadaluarsa.substring(0, 10) : '';
    document.getElementById('bahan_lab').value = item.lab_id;
    document.getElementById('bahan_keterangan').value = item.keterangan || '';
    openModal('modalBahan');
}

async function hapusBahan(id) {
    if (!confirm('Yakin hapus bahan ini?')) return;
    const data = await apiDelete(`/api/bahan/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadBahan();
}