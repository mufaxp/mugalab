/**
 * laprak.js - Laporan Praktikum Module
 * CRUD, alat & bahan, unduh PDF via backend
 */

let lpEditMode = false;
let lpEditId = null;
let lpAlatList = [];
let lpBahanList = [];
let allAlatForLP = [];
let allBahanForLP = [];

async function initLaprak() {
    const lpLabFilter = document.getElementById('lpLabFilter');
    await loadLabOptions('lpLabFilter', true);
    await loadLabOptions('lp_lab_id');

    function getLpLabFilter() {
        if (!lpLabFilter) return null;
        const v = lpLabFilter.value;
        return v === 'all' ? null : parseInt(v);
    }

    if (lpLabFilter) {
        lpLabFilter.addEventListener('change', () => loadLaporanPraktikum());
    }

    // Submit form laporan praktikum
    document.getElementById('formLaporanPraktikum').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kelas: document.getElementById('lp_kelas').value,
            jumlah_kelompok: parseInt(document.getElementById('lp_jumlah_kelompok').value),
            mata_pelajaran: document.getElementById('lp_mapel').value,
            jam_mulai: parseInt(document.getElementById('lp_jam_mulai').value),
            jam_selesai: parseInt(document.getElementById('lp_jam_selesai').value),
            guru_mapel: document.getElementById('lp_guru').value,
            judul_praktikum: document.getElementById('lp_judul').value,
            tujuan_praktikum: document.getElementById('lp_tujuan').value,
            daftar_alat_bahan: JSON.stringify({ alat: lpAlatList, bahan: lpBahanList }),
            deskripsi_kegiatan: document.getElementById('lp_deskripsi').value,
            tanggal: document.getElementById('lp_tanggal').value,
            lab_id: parseInt(document.getElementById('lp_lab_id').value)
        };

        if (!lpEditMode) {
            body.jadwal_id = document.getElementById('lp_jadwal_id').value || null;
        }

        const url = lpEditMode ? `/api/laporan-praktikum/${lpEditId}` : '/api/laporan-praktikum';
        const data = lpEditMode ? await apiPut(url, body) : await apiPost(url, body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalLaporanPraktikum');
            lpEditMode = false;
            lpEditId = null;
            loadLaporanPraktikum();
            if (typeof loadDashboardJadwal === 'function') loadDashboardJadwal();
        }
    });

    // Init search alat dan bahan
    initSearchAlatLP();
    initSearchBahanLP();

    // Load data awal
    loadAlatBahanForLP();
    loadLaporanPraktikum();

    const sidebar = document.querySelector('.sidebar-item[data-panel="laporan-praktikum"]');
    if (sidebar) sidebar.addEventListener('click', loadLaporanPraktikum);

    console.log('✅ Modul Laprak siap');
}

// Buka modal untuk membuat laporan praktikum dari jadwal
window.bukaModalLaporan = function(item) {
    lpEditMode = false;
    lpEditId = null;
    lpAlatList = [];
    lpBahanList = [];
    renderLPAlatList();
    renderLPBahanList();
    setModalTitle('modalLaporanPraktikum', 'Buat Laporan Praktikum');
    setSubmitButton('modalLaporanPraktikum', 'Simpan');

    document.getElementById('lp_jadwal_id').value = item.id || '';
    document.getElementById('lp_kelas').value = item.kelas !== '-' ? item.kelas : '';
    document.getElementById('lp_mapel').value = item.mata_pelajaran || '';
    document.getElementById('lp_guru').value = item.penanggung_jawab || '';
    document.getElementById('lp_jam_mulai').value = item.jam_mulai || '';
    document.getElementById('lp_jam_selesai').value = item.jam_selesai || '';
    document.getElementById('lp_tanggal').value = toLocalDate(item.tanggal);
    document.getElementById('lp_lab_id').value = item.lab_id || 1;
    document.getElementById('lp_judul').value = item.kegiatan || '';
    document.getElementById('lp_tujuan').value = '';
    document.getElementById('lp_deskripsi').value = '';
    document.getElementById('lp_jumlah_kelompok').value = 1;
    openModal('modalLaporanPraktikum');
};

// Load dan render daftar laporan praktikum
async function loadLaporanPraktikum() {
    const container = document.getElementById('lpList');
    if (!container) return;
    try {
        const labId = document.getElementById('lpLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        const response = await apiGet('/api/laporan-praktikum', params);
        const data = Array.isArray(response) ? response : (response.data || []);
        renderLaporanPraktikum(data);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data laporan.</p>';
    }
}

function renderLaporanPraktikum(data) {
    const container = document.getElementById('lpList');
    if (!data || !data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada laporan praktikum.</p>';
        return;
    }

    let html = '';
    data.forEach(item => {
        const tgl = item.tanggal ? formatTanggal(item.tanggal) : '-';
        html += `
        <div class="jadwal-card-item" style="margin-bottom:10px;">
            <div class="jadwal-card-body">
                <div class="jadwal-card-kegiatan">${item.judul_praktikum || 'Tanpa Judul'}</div>
                <div class="jadwal-card-pj">${item.guru_mapel} | ${item.kelas} | ${tgl} | Jam ke-${item.jam_mulai}-${item.jam_selesai}</div>
                ${item.tujuan_praktikum ? `<div style="font-size:12px;color:#888;margin-top:4px;">${item.tujuan_praktikum.substring(0, 100)}...</div>` : ''}
            </div>
            <div class="jadwal-card-actions">
                <button class="btn-pdf" data-pdf-lp="${item.id}">📄 PDF</button>
                <button class="btn-edit" data-edit-lp="${item.id}">Edit</button>
                <button class="btn-delete" data-hapus-lp="${item.id}">Hapus</button>
            </div>
        </div>`;
    });

    container.innerHTML = html;

    // Event Edit
    container.querySelectorAll('[data-edit-lp]').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = data.find(d => d.id === parseInt(btn.getAttribute('data-edit-lp')));
            if (item) editLaporanPraktikum(item);
        });
    });

    // Event Hapus
    container.querySelectorAll('[data-hapus-lp]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Yakin hapus laporan ini?')) {
                hapusLaporanPraktikum(parseInt(btn.getAttribute('data-hapus-lp')));
            }
        });
    });

    // Event Unduh PDF (via backend)
    container.querySelectorAll('[data-pdf-lp]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-pdf-lp');
            const token = getToken();

            btn.disabled = true;
            btn.textContent = '⏳ Memuat...';

            try {
                const res = await fetch(`/api/laporan-praktikum/${id}/pdf`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Gagal mengunduh PDF');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Laporan_Praktikum_${id}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Error download PDF:', err);
                alert('Gagal mengunduh PDF. Pastikan template sudah diunggah.');
            } finally {
                btn.disabled = false;
                btn.textContent = '📄 PDF';
            }
        });
    });
}

// Edit laporan praktikum
function editLaporanPraktikum(item) {
    lpEditMode = true;
    lpEditId = item.id;
    setModalTitle('modalLaporanPraktikum', 'Edit Laporan Praktikum');
    setSubmitButton('modalLaporanPraktikum', 'Update');

    document.getElementById('lp_jadwal_id').value = item.jadwal_id || '';
    document.getElementById('lp_kelas').value = item.kelas || '';
    document.getElementById('lp_jumlah_kelompok').value = item.jumlah_kelompok || 1;
    document.getElementById('lp_mapel').value = item.mata_pelajaran || '';
    document.getElementById('lp_guru').value = item.guru_mapel || '';
    document.getElementById('lp_jam_mulai').value = item.jam_mulai || '';
    document.getElementById('lp_jam_selesai').value = item.jam_selesai || '';
    document.getElementById('lp_judul').value = item.judul_praktikum || '';
    document.getElementById('lp_tujuan').value = item.tujuan_praktikum || '';
    document.getElementById('lp_deskripsi').value = item.deskripsi_kegiatan || '';
    document.getElementById('lp_tanggal').value = toLocalDate(item.tanggal);
    document.getElementById('lp_lab_id').value = item.lab_id || 1;

    try {
        const dataAlatBahan = JSON.parse(item.daftar_alat_bahan || '{}');
        lpAlatList = dataAlatBahan.alat || [];
        lpBahanList = dataAlatBahan.bahan || [];
    } catch (e) {
        lpAlatList = [];
        lpBahanList = [];
    }
    renderLPAlatList();
    renderLPBahanList();
    openModal('modalLaporanPraktikum');
}

// Hapus laporan praktikum
async function hapusLaporanPraktikum(id) {
    const data = await apiDelete(`/api/laporan-praktikum/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadLaporanPraktikum();
}

// Muat data alat & bahan untuk keperluan pencarian di modal
async function loadAlatBahanForLP() {
    try {
        const respAlat = await apiGet('/api/alat');
        const respBahan = await apiGet('/api/bahan');
        allAlatForLP = Array.isArray(respAlat) ? respAlat : (respAlat.data || []);
        allBahanForLP = Array.isArray(respBahan) ? respBahan : (respBahan.data || []);
    } catch (err) {
        console.error('Gagal load alat/bahan:', err);
    }
}

// Pencarian alat pada modal laporan praktikum
function initSearchAlatLP() {
    const lpSearchAlat = document.getElementById('lp_search_alat');
    const lpSuggestAlat = document.getElementById('lp_suggest_alat');

    lpSearchAlat.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        if (!keyword) {
            lpSuggestAlat.classList.remove('active');
            return;
        }
        const filtered = allAlatForLP.filter(item =>
            item.nama_alat.toLowerCase().includes(keyword) ||
            item.kode_alat.toLowerCase().includes(keyword)
        );
        lpSuggestAlat.innerHTML = filtered.map(item => `
            <div class="search-suggest-item" data-id="${item.id}" data-nama="${item.nama_alat}" data-kode="${item.kode_alat}">
                🔧 ${item.kode_alat} - ${item.nama_alat} (Stok: ${item.jumlah})
            </div>`).join('');
        lpSuggestAlat.classList.add('active');
    });

    lpSuggestAlat.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            lpSearchAlat.value = `${item.getAttribute('data-kode')} - ${item.getAttribute('data-nama')}`;
            lpSearchAlat.setAttribute('data-selected-id', item.getAttribute('data-id'));
            lpSearchAlat.setAttribute('data-selected-nama', item.getAttribute('data-nama'));
            lpSearchAlat.setAttribute('data-selected-kode', item.getAttribute('data-kode'));
            lpSuggestAlat.classList.remove('active');
        }
    });

    document.getElementById('btnTambahAlatLP').addEventListener('click', function() {
        const id = lpSearchAlat.getAttribute('data-selected-id');
        const nama = lpSearchAlat.getAttribute('data-selected-nama');
        const kode = lpSearchAlat.getAttribute('data-selected-kode');
        const jumlah = parseInt(document.getElementById('lp_jumlah_alat').value);

        if (!id || !jumlah || jumlah < 1) return alert('Pilih alat dan isi jumlah!');
        if (lpAlatList.find(a => a.id == id)) return alert('Alat ini sudah ada di daftar!');

        lpAlatList.push({ id: parseInt(id), kode, nama, jumlah, satuan: 'buah' });
        renderLPAlatList();
        lpSearchAlat.value = '';
        lpSearchAlat.removeAttribute('data-selected-id');
        lpSearchAlat.removeAttribute('data-selected-nama');
        lpSearchAlat.removeAttribute('data-selected-kode');
        document.getElementById('lp_jumlah_alat').value = '';
    });
}

// Pencarian bahan pada modal laporan praktikum
function initSearchBahanLP() {
    const lpSearchBahan = document.getElementById('lp_search_bahan');
    const lpSuggestBahan = document.getElementById('lp_suggest_bahan');

    lpSearchBahan.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        if (!keyword) {
            lpSuggestBahan.classList.remove('active');
            return;
        }
        const filtered = allBahanForLP.filter(item =>
            item.nama_bahan.toLowerCase().includes(keyword) ||
            item.kode_bahan.toLowerCase().includes(keyword)
        );
        lpSuggestBahan.innerHTML = filtered.map(item => `
            <div class="search-suggest-item" data-id="${item.id}" data-nama="${item.nama_bahan}" data-kode="${item.kode_bahan}" data-satuan="${item.satuan}">
                🧪 ${item.kode_bahan} - ${item.nama_bahan} (Stok: ${item.stok_akhir} ${item.satuan})
            </div>`).join('');
        lpSuggestBahan.classList.add('active');
    });

    lpSuggestBahan.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            lpSearchBahan.value = `${item.getAttribute('data-kode')} - ${item.getAttribute('data-nama')}`;
            lpSearchBahan.setAttribute('data-selected-id', item.getAttribute('data-id'));
            lpSearchBahan.setAttribute('data-selected-nama', item.getAttribute('data-nama'));
            lpSearchBahan.setAttribute('data-selected-kode', item.getAttribute('data-kode'));
            document.getElementById('lp_satuan_bahan').value = item.getAttribute('data-satuan');
            lpSuggestBahan.classList.remove('active');
        }
    });

    document.getElementById('btnTambahBahanLP').addEventListener('click', function() {
        const id = lpSearchBahan.getAttribute('data-selected-id');
        const nama = lpSearchBahan.getAttribute('data-selected-nama');
        const kode = lpSearchBahan.getAttribute('data-selected-kode');
        const jumlah = parseFloat(document.getElementById('lp_jumlah_bahan').value);
        const satuan = document.getElementById('lp_satuan_bahan').value;

        if (!id || !jumlah || jumlah <= 0 || !satuan) return alert('Pilih bahan, isi jumlah, dan satuan!');
        if (lpBahanList.find(b => b.id == id)) return alert('Bahan ini sudah ada di daftar!');

        lpBahanList.push({ id: parseInt(id), kode, nama, jumlah, satuan });
        renderLPBahanList();
        lpSearchBahan.value = '';
        lpSearchBahan.removeAttribute('data-selected-id');
        lpSearchBahan.removeAttribute('data-selected-nama');
        lpSearchBahan.removeAttribute('data-selected-kode');
        document.getElementById('lp_jumlah_bahan').value = '';
        document.getElementById('lp_satuan_bahan').value = '';
    });
}

// Render daftar alat yang sudah dipilih
function renderLPAlatList() {
    const container = document.getElementById('lp_list_alat');
    container.innerHTML = lpAlatList.map((item, index) => `
        <div class="item-row">
            <span>🔧 ${item.kode} - ${item.nama} — ${item.jumlah} ${item.satuan}</span>
            <button class="btn-remove" data-index="${index}" data-type="alat">✕</button>
        </div>`).join('');
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            lpAlatList.splice(parseInt(this.getAttribute('data-index')), 1);
            renderLPAlatList();
        });
    });
}

// Render daftar bahan yang sudah dipilih
function renderLPBahanList() {
    const container = document.getElementById('lp_list_bahan');
    container.innerHTML = lpBahanList.map((item, index) => `
        <div class="item-row">
            <span>🧪 ${item.kode} - ${item.nama} — ${item.jumlah} ${item.satuan}</span>
            <button class="btn-remove" data-index="${index}" data-type="bahan">✕</button>
        </div>`).join('');
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            lpBahanList.splice(parseInt(this.getAttribute('data-index')), 1);
            renderLPBahanList();
        });
    });
}