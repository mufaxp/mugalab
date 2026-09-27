/**
 * laporanKerusakan.js - Laporan Kerusakan Module
 * Mendukung alat & sarana.
 */

async function initLaporanKerusakan() {
    await loadLabOptions('laporanLabFilter', true);
    const laporanLabFilter = document.getElementById('laporanLabFilter');

    if (laporanLabFilter) {
        laporanLabFilter.addEventListener('change', () => loadLaporan());
    }

    // Tombol tambah laporan
    document.getElementById('btnTambahLaporan').addEventListener('click', async function() {
        document.getElementById('formLaporan').reset();
        document.getElementById('laporan_alat').value = '';
        document.getElementById('laporan_alat_search').value = '';
        document.getElementById('suggestLaporanAlat').innerHTML = '';
        document.getElementById('laporan_tanggal').valueAsDate = new Date();
        document.getElementById('laporan_jenis').value = 'alat';
        openModal('modalLaporan');
        await loadItemsForLaporan('alat');
    });

    // Ganti jenis → reload list item
    document.getElementById('laporan_jenis').addEventListener('change', async function() {
        document.getElementById('laporan_alat').value = '';
        document.getElementById('laporan_alat_search').value = '';
        document.getElementById('suggestLaporanAlat').innerHTML = '';
        await loadItemsForLaporan(this.value);
    });

    // Search item
    const laporanAlatSearch = document.getElementById('laporan_alat_search');
    const laporanAlatHidden = document.getElementById('laporan_alat');
    const suggestLaporanAlat = document.getElementById('suggestLaporanAlat');

    if (laporanAlatSearch) {
        laporanAlatSearch.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            const data = window._laporanItemList || [];
            if (!keyword) {
                suggestLaporanAlat.classList.remove('active');
                laporanAlatHidden.value = '';
                return;
            }
            const filtered = data.filter(item =>
                item.nama.toLowerCase().includes(keyword) ||
                item.kode.toLowerCase().includes(keyword)
            );
            suggestLaporanAlat.innerHTML = filtered.map(item => `
                <div class="search-suggest-item" data-id="${item.id}" data-nama="${item.nama}" data-kode="${item.kode}" data-stok="${item.jumlah}">
                    ${item.kode} - ${item.nama} (Stok: ${item.jumlah})
                </div>`).join('');
            suggestLaporanAlat.classList.add('active');
        });

        suggestLaporanAlat.addEventListener('click', function(e) {
            const item = e.target.closest('.search-suggest-item');
            if (item) {
                laporanAlatHidden.value = item.getAttribute('data-id');
                laporanAlatSearch.value = `${item.getAttribute('data-kode')} - ${item.getAttribute('data-nama')} (Stok: ${item.getAttribute('data-stok')})`;
                suggestLaporanAlat.classList.remove('active');
            }
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('#modalLaporan .search-wrapper')) suggestLaporanAlat.classList.remove('active');
        });
    }

    // Submit form
    document.getElementById('formLaporan').addEventListener('submit', async function(e) {
        e.preventDefault();
        const jenis = document.getElementById('laporan_jenis').value;
        const itemId = parseInt(document.getElementById('laporan_alat').value);

        const body = {
            jenis,
            item_id: itemId,
            jumlah_rusak: parseInt(document.getElementById('laporan_jumlah').value),
            pelapor: document.getElementById('laporan_pelapor').value,
            tanggal_lapor: document.getElementById('laporan_tanggal').value,
            keterangan: document.getElementById('laporan_keterangan').value
        };

        if (!body.item_id || !body.jumlah_rusak || !body.pelapor || !body.tanggal_lapor || !document.getElementById('laporan_alat_search').value) {
            return alert('Semua field wajib diisi!');
        }

        const data = await apiPost('/api/laporan-kerusakan', body);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            closeModal('modalLaporan');
            loadLaporan();
            if (jenis === 'alat' && typeof loadAlat === 'function') loadAlat();
            if (jenis === 'sarana' && typeof loadSarana === 'function') loadSarana();
        }
    });

    loadLaporan();

    const sidebar = document.querySelector('.sidebar-item[data-panel="laporan"]');
    if (sidebar) sidebar.addEventListener('click', loadLaporan);

    console.log('✅ Modul Laporan Kerusakan siap');
}

/**
 * Ambil daftar item (alat atau sarana) untuk search di modal.
 */
async function loadItemsForLaporan(jenis) {
    try {
        const url = jenis === 'alat' ? '/api/alat' : '/api/sarana';
        const response = await apiGet(url);
        const raw = Array.isArray(response) ? response : (response.data || []);
        // Normalisasi agar seragam
        window._laporanItemList = raw.map(item => ({
            id: item.id,
            kode: jenis === 'alat' ? item.kode_alat : item.kode_sarana,
            nama: jenis === 'alat' ? item.nama_alat : item.nama_sarana,
            jumlah: item.jumlah
        }));
    } catch (err) {
        window._laporanItemList = [];
    }
}

/**
 * Load & render tabel laporan
 */
async function loadLaporan() {
    const container = document.getElementById('laporanList');
    if (!container) return;
    try {
        const labId = document.getElementById('laporanLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        const response = await apiGet('/api/laporan-kerusakan', params);
        const data = Array.isArray(response) ? response : (response.data || []);
        renderLaporan(data);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data laporan.</p>';
    }
}

function renderLaporan(data) {
    const container = document.getElementById('laporanList');
    if (!data || !data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada laporan kerusakan.</p>';
        return;
    }

    const statusLabel = {
        'rusak': '🔴 Rusak',
        'diperbaiki': '🟡 Diperbaiki',
        'selesai': '🟢 Selesai',
        'dibuang': '⚫ Dibuang'
    };

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Jenis</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kode</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Item</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jml Rusak</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Pelapor</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Tgl Lapor</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Status</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const tgl = item.tanggal_lapor ? item.tanggal_lapor.substring(0, 10) : '-';
        const status = item.status;
        const jenisLabel = item.jenis === 'sarana' ? 'Sarana' : 'Alat';

        let tombol = '';
        if (status === 'rusak') {
            tombol = `<button class="btn-edit btn-xs" data-action="perbaiki" data-id="${item.id}">Perbaiki</button>
                <button class="btn-pakai btn-xs" data-action="selesai" data-id="${item.id}">Selesai</button>
                <button class="btn-delete btn-xs" data-action="buang" data-id="${item.id}">Buang</button>
                <button class="btn-delete btn-xs" data-action="hapus" data-id="${item.id}">Hapus</button>`;
        } else if (status === 'diperbaiki') {
            tombol = `<button class="btn-pakai btn-xs" data-action="selesai" data-id="${item.id}">Selesai</button>
                <button class="btn-delete btn-xs" data-action="buang" data-id="${item.id}">Buang</button>
                <button class="btn-delete btn-xs" data-action="hapus" data-id="${item.id}">Hapus</button>`;
        } else {
            tombol = `<button class="btn-delete btn-xs" data-action="hapus" data-id="${item.id}">Hapus</button>`;
        }

        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${jenisLabel}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kode_item || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_item || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jumlah_rusak}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.pelapor}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tgl}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${statusLabel[status] || status}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;white-space:nowrap;">${tombol}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', function() {
            handleLaporanAction(this.getAttribute('data-action'), parseInt(this.getAttribute('data-id')));
        });
    });
}

/**
 * Aksi laporan
 */
async function handleLaporanAction(action, id) {
    if (action === 'hapus') {
        if (!confirm('Yakin hapus laporan ini?')) return;
        const data = await apiDelete(`/api/laporan-kerusakan/${id}`);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            loadLaporan();
            if (typeof loadAlat === 'function') loadAlat();
            if (typeof loadSarana === 'function') loadSarana();
        }
        return;
    }

    const statusMap = { 'perbaiki': 'diperbaiki', 'selesai': 'selesai', 'buang': 'dibuang' };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    const data = await apiPut(`/api/laporan-kerusakan/${id}`, { status: newStatus });
    alert(data.message);
    if (!data.message.includes('Gagal')) {
        loadLaporan();
        if (typeof loadAlat === 'function') loadAlat();
        if (typeof loadSarana === 'function') loadSarana();
    }
}