let currentTab = 'alat'; // 'alat' atau 'sarana'
let pinjamAlatData = [];
let pinjamSaranaData = [];

async function initPeminjaman() {
    // filter lab
    const pinjamLabFilter = document.getElementById('pinjamLabFilter');
    if (pinjamLabFilter) {
        pinjamLabFilter.addEventListener('change', () => {
            loadPeminjaman('alat');
            loadPeminjaman('sarana');
        });
    }

    // tab
    document.querySelectorAll('#peminjaman .inv-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('#peminjaman .inv-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('#peminjaman .inv-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('pinjam' + this.getAttribute('data-tab').replace('pinjam', '') + 'Panel').classList.add('active');
            currentTab = this.getAttribute('data-tab').replace('pinjam', '').toLowerCase();
        });
    });

    // modal pinjam
    document.getElementById('btnPinjam').addEventListener('click', openModalPinjam);

    // submit pinjam
    document.getElementById('formPinjam').addEventListener('submit', submitPinjam);

    // submit kembali
    document.getElementById('formKembali').addEventListener('submit', submitKembali);

    // search item
    initSearchItem();

    // tanggal pinjam berubah: tanggal kembali otomatis +7 hari
    document.getElementById('pinjam_tanggal').addEventListener('change', function() {
        const tgl = new Date(this.value);
        tgl.setDate(tgl.getDate() + 7);
        document.getElementById('pinjam_kembali').valueAsDate = tgl;
    });

    // load data
    loadPeminjaman('alat');
    loadPeminjaman('sarana');

    // Load saat panel dibuka
    const sidebar = document.querySelector('.sidebar-item[data-panel="peminjaman"]');
    if (sidebar) sidebar.addEventListener('click', () => { loadPeminjaman('alat'); loadPeminjaman('sarana'); });

    console.log('✅ Modul Peminjaman siap');
    await loadLabOptions('pinjamLabFilter', true);
    await loadLabOptions('pinjam_jenis'); // jika dropdown jenis lab dipakai
}

// modal pinjam
function openModalPinjam() {
    document.getElementById('formPinjam').reset();
    document.getElementById('pinjam_tanggal').valueAsDate = new Date();
    const tglKembali = new Date();
    tglKembali.setDate(tglKembali.getDate() + 7);
    document.getElementById('pinjam_kembali').valueAsDate = tglKembali;
    document.getElementById('pinjam_preview').innerHTML = '';
    document.getElementById('pinjam_jenis').value = currentTab === 'sarana' ? 'sarana' : 'alat';
    document.getElementById('pinjam_item').value = '';
    document.getElementById('pinjam_item_search').value = '';
    document.getElementById('suggestPinjamItem').innerHTML = '';
    document.getElementById('modalPinjam').style.display = 'flex';
}

// search item & suggestion
function initSearchItem() {
    const searchInput = document.getElementById('pinjam_item_search');
    const suggestBox = document.getElementById('suggestPinjamItem');
    const jenisSelect = document.getElementById('pinjam_jenis');

    searchInput.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        const jenis = jenisSelect.value;
        const data = jenis === 'alat' ? allAlatForPinjam : allSaranaForPinjam;

        if (!keyword) {
            suggestBox.classList.remove('active');
            return;
        }

        const filtered = data.filter(item => {
            const nama = jenis === 'alat' ? item.nama_alat : item.nama_sarana;
            const kode = jenis === 'alat' ? item.kode_alat : item.kode_sarana;
            return nama.toLowerCase().includes(keyword) || kode.toLowerCase().includes(keyword);
        });

        suggestBox.innerHTML = filtered.map(item => {
            const nama = jenis === 'alat' ? item.nama_alat : item.nama_sarana;
            const kode = jenis === 'alat' ? item.kode_alat : item.kode_sarana;
            const stok = item.jumlah;
            return `<div class="search-suggest-item" data-id="${item.id}" data-nama="${nama}" data-kode="${kode}" data-stok="${stok}">
                ${kode} - ${nama} (Stok: ${stok})
            </div>`;
        }).join('');

        suggestBox.classList.add('active');
    });

    suggestBox.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            document.getElementById('pinjam_item').value = item.getAttribute('data-id');
            searchInput.value = `${item.getAttribute('data-kode')} - ${item.getAttribute('data-nama')}`;
            suggestBox.classList.remove('active');
        }
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#modalPinjam .search-wrapper')) suggestBox.classList.remove('active');
    });

    // Load data alat & sarana untuk search
    loadAllItems();
}

let allAlatForPinjam = [];
let allSaranaForPinjam = [];

async function loadAllItems() {
    try {
        allAlatForPinjam = await apiGet('/api/alat');
        allSaranaForPinjam = await apiGet('/api/sarana');
    } catch (err) {
        console.error('Gagal load item:', err);
    }
}

// kamera dan kompresi WebP
function initCamera(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    input.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Resize max 800px
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const max = 800;
                if (w > max) { h = h * max / w; w = max; }
                if (h > max) { w = w * max / h; h = max; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                // Convert ke WebP
                canvas.toBlob(blob => {
                    // Ganti file input dengan blob terkompresi
                    const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
                    const dt = new DataTransfer();
                    dt.items.add(compressedFile);
                    input.files = dt.files;

                    // Preview
                    preview.innerHTML = `<img src="${URL.createObjectURL(blob)}" style="max-width:200px;border-radius:8px;">`;
                }, 'image/webp', 0.6);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Panggil initCamera setelah halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (document.getElementById('pinjam_foto')) initCamera('pinjam_foto', 'pinjam_preview');
        if (document.getElementById('kembali_foto')) initCamera('kembali_foto', 'kembali_preview');
    }, 1000);
});

// submit pinjam
async function submitPinjam(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('pemohon', document.getElementById('pinjam_pemohon').value);
    formData.append('jenis', document.getElementById('pinjam_jenis').value);
    const jenis = document.getElementById('pinjam_jenis').value;
    if (jenis === 'alat') {
        formData.append('alat_id', document.getElementById('pinjam_item').value);
    } else {
        formData.append('sarana_id', document.getElementById('pinjam_item').value);
    }
    formData.append('jumlah', document.getElementById('pinjam_jumlah').value || 1);
    formData.append('kebutuhan', document.getElementById('pinjam_kebutuhan').value);
    formData.append('tanggal_pinjam', document.getElementById('pinjam_tanggal').value);
    formData.append('tanggal_kembali', document.getElementById('pinjam_kembali').value);

    const fileInput = document.getElementById('pinjam_foto');
    if (fileInput.files[0]) {
        formData.append('foto', fileInput.files[0]);
    }

    const token = getToken();
    try {
        const res = await fetch('/api/peminjaman', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            document.getElementById('modalPinjam').style.display = 'none';
            loadPeminjaman('alat');
            loadPeminjaman('sarana');
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    }
}

// load dan render peminjaman
async function loadPeminjaman(jenis) {
    const container = document.getElementById('peminjaman' + (jenis === 'alat' ? 'Alat' : 'Sarana') + 'List');
    if (!container) return;

    try {
        const labId = document.getElementById('pinjamLabFilter')?.value;
        const params = { jenis };
        if (labId && labId !== 'all') params.lab_id = labId;

        const data = await apiGet('/api/peminjaman', params);
        if (jenis === 'alat') pinjamAlatData = data;
        else pinjamSaranaData = data;

        renderPeminjaman(data, jenis, container);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data.</p>';
    }
}

function renderPeminjaman(data, jenis, container) {
    if (!data || !data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Tidak ada peminjaman.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Pemohon</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama ${jenis === 'alat' ? 'Alat' : 'Sarana'}</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jml</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kebutuhan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Tgl Pinjam</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Foto</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Tgl Kembali</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Foto</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const tglPinjam = item.tanggal_pinjam ? item.tanggal_pinjam.substring(0, 10) : '-';
        const tglKembali = item.tanggal_kembali ? item.tanggal_kembali.substring(0, 10) : '-';
        const foto1 = item.foto_pinjam ? `<a href="${item.foto_pinjam}" target="_blank">📷</a>` : '-';
        const foto2 = item.foto_kembali ? `<a href="${item.foto_kembali}" target="_blank">📷</a>` : '-';
        const aksi = item.status === 'dipinjam'
            ? `<button class="btn-pakai btn-xs" data-kembali="${item.id}" data-nama="${item.nama_item}" data-pemohon="${item.pemohon}" data-jumlah="${item.jumlah}" data-jenis="${item.jenis}">Kembalikan</button>`
            : '<span style="color:#888;">Selesai</span>';

        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.pemohon}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_item}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jumlah}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kebutuhan || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tglPinjam}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${foto1}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tglKembali}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${foto2}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${aksi}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Event: Kembalikan
    container.querySelectorAll('[data-kembali]').forEach(btn => {
        btn.addEventListener('click', function() {
            openModalKembali(
                this.getAttribute('data-kembali'),
                this.getAttribute('data-nama'),
                this.getAttribute('data-pemohon'),
                this.getAttribute('data-jumlah'),
                this.getAttribute('data-jenis')
            );
        });
    });
}

// modal kembali
function openModalKembali(id, nama, pemohon, jumlah, jenis) {
    document.getElementById('kembali_id').value = id;
    document.getElementById('kembali_nama').textContent = nama;
    document.getElementById('kembali_pemohon').textContent = pemohon;
    document.getElementById('kembali_jumlah').textContent = jumlah;
    document.getElementById('kembali_jenis').value = jenis;
    document.getElementById('kembali_jumlah_rusak').value = 0;
    document.getElementById('kembali_preview').innerHTML = '';
    document.getElementById('formKembali').reset();
    document.getElementById('modalKembali').style.display = 'flex';
}

// submit kembali
async function submitKembali(e) {
    e.preventDefault();

    const id = document.getElementById('kembali_id').value;
    const formData = new FormData();
    formData.append('jumlah_rusak', document.getElementById('kembali_jumlah_rusak').value || 0);

    const fileInput = document.getElementById('kembali_foto');
    if (fileInput.files[0]) {
        formData.append('foto', fileInput.files[0]);
    }

    const token = getToken();
    try {
        const res = await fetch(`/api/peminjaman/${id}/kembali`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            document.getElementById('modalKembali').style.display = 'none';
            loadPeminjaman('alat');
            loadPeminjaman('sarana');
            if (typeof loadAlat === 'function') loadAlat();
            if (typeof loadSarana === 'function') loadSarana();
            if (typeof loadLaporan === 'function') loadLaporan();
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    }
}