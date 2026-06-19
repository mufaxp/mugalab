/**
 * sarana.js - Inventaris Sarana Module
 */

let saranaEditMode = false;
let saranaEditId = null;
let allSaranaData = [];

function initSarana() {
    document.getElementById('btnTambahSarana').addEventListener('click', () => {
        saranaEditMode = false;
        saranaEditId = null;
        document.getElementById('modalSaranaTitle').textContent = 'Tambah Sarana';
        document.getElementById('formSarana').reset();
        openModal('modalSarana');
    });

    document.getElementById('formSarana').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_sarana: document.getElementById('sarana_kode').value,
            nama_sarana: document.getElementById('sarana_nama').value,
            produsen: document.getElementById('sarana_produsen').value || '-',
            jumlah: parseInt(document.getElementById('sarana_jumlah').value),
            jumlah_rusak: parseInt(document.getElementById('sarana_jumlah_rusak').value) || 0,
            kondisi: document.getElementById('sarana_kondisi').value,
            lab_id: parseInt(document.getElementById('sarana_lab').value),
            keterangan: document.getElementById('sarana_keterangan').value
        };
        if (!body.kode_sarana || !body.nama_sarana || !body.jumlah) return alert('Kode, nama, dan jumlah wajib diisi');

        const url = saranaEditMode ? `/api/sarana/${saranaEditId}` : '/api/sarana';
        const data = saranaEditMode ? await apiPut(url, body) : await apiPost(url, body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalSarana');
            loadSarana();
        }
    });

    // Search
    const searchSarana = document.getElementById('searchSarana');
    const suggestSarana = document.getElementById('suggestSarana');
    searchSarana.addEventListener('input', function() {
        const kw = this.value.toLowerCase().trim();
        if (!kw) { suggestSarana.classList.remove('active'); renderSarana(allSaranaData); return; }
        const filtered = allSaranaData.filter(i => i.nama_sarana.toLowerCase().includes(kw) || i.kode_sarana.toLowerCase().includes(kw));
        suggestSarana.innerHTML = filtered.map(i => `<div class="search-suggest-item" data-id="${i.id}">${i.kode_sarana} - ${i.nama_sarana}</div>`).join('');
        suggestSarana.classList.add('active');
    });
    suggestSarana.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) { renderSarana(allSaranaData.filter(i => i.id == item.getAttribute('data-id'))); suggestSarana.classList.remove('active'); searchSarana.value = ''; }
    });
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) suggestSarana.classList.remove('active'); });

    loadSarana();
    console.log('✅ Modul Sarana siap');
}

async function loadSarana() {
    const container = document.getElementById('saranaList');
    if (!container) return;
    try {
        const labId = document.getElementById('invLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        allSaranaData = await apiGet('/api/sarana', params);
        renderSarana(allSaranaData);
    } catch (err) { container.innerHTML = '<p style="color:#c62828;">Gagal memuat data sarana.</p>'; }
}

function renderSarana(data) {
    const container = document.getElementById('saranaList');
    if (!data.length) { container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada data sarana.</p>'; return; }
    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Kode</th><th style="padding:8px;border:1px solid #d0e6d5;">Nama</th><th style="padding:8px;border:1px solid #d0e6d5;">Produsen</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jumlah</th><th style="padding:8px;border:1px solid #d0e6d5;">Kondisi</th><th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;
    data.forEach(item => {
        const emoji = item.kondisi === 'baik' ? '✅' : item.kondisi === 'rusak' ? '🔴' : '🟡';
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kode_sarana}</td><td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_sarana}</td><td style="padding:8px;border:1px solid #d0e6d5;">${item.produsen}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jumlah} total<br><span style="color:#c62828;font-size:11px;">${item.jumlah_rusak||0} rusak</span></td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${emoji} ${item.kondisi}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;"><button class="btn-edit" data-edit-sarana="${item.id}">Edit</button> <button class="btn-delete" data-hapus-sarana="${item.id}">Hapus</button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    container.querySelectorAll('[data-edit-sarana]').forEach(b => b.addEventListener('click', () => editSarana(parseInt(b.getAttribute('data-edit-sarana')))));
    container.querySelectorAll('[data-hapus-sarana]').forEach(b => b.addEventListener('click', () => hapusSarana(parseInt(b.getAttribute('data-hapus-sarana')))));
}

async function editSarana(id) {
    const item = allSaranaData.find(s => s.id === id); if (!item) return;
    saranaEditMode = true; saranaEditId = id;
    document.getElementById('modalSaranaTitle').textContent = 'Edit Sarana';
    document.getElementById('sarana_kode').value = item.kode_sarana;
    document.getElementById('sarana_nama').value = item.nama_sarana;
    document.getElementById('sarana_produsen').value = item.produsen;
    document.getElementById('sarana_jumlah').value = item.jumlah;
    document.getElementById('sarana_jumlah_rusak').value = item.jumlah_rusak || 0;
    document.getElementById('sarana_kondisi').value = item.kondisi || 'baik';
    document.getElementById('sarana_lab').value = item.lab_id;
    document.getElementById('sarana_keterangan').value = item.keterangan || '';
    openModal('modalSarana');
}

async function hapusSarana(id) {
    if (!confirm('Yakin hapus sarana ini?')) return;
    const data = await apiDelete(`/api/sarana/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadSarana();
}