/**
 * bahan.js - Inventaris Bahan Module
 */

let bahanEditMode = false;
let bahanEditId = null;
let allBahanData = [];

async function initBahan() {
    const currentRole = localStorage.getItem('role') || 'guru';

    await loadLabOptions('bahan_lab');
    await loadLabOptions('invLabFilter', true);

    const btnTambahBahan = document.getElementById('btnTambahBahan');
    if (btnTambahBahan && currentRole === 'guru') {
        btnTambahBahan.style.display = 'none';
    }

    if (currentRole !== 'guru') {
        injectBulkBahanUI();
    }

    document.getElementById('btnTambahBahan').addEventListener('click', function() {
        bahanEditMode = false;
        bahanEditId = null;
        document.getElementById('modalBahanTitle').textContent = 'Tambah Bahan';
        document.getElementById('formBahan').reset();
        document.getElementById('bahan_stok_akhir').value = '';
        openModal('modalBahan');
    });
    
    document.getElementById('btnBulkBahanApply')?.addEventListener('click', async () => {
        const action = document.getElementById('bulkBahanAction').value;
        const selectedIds = Array.from(document.querySelectorAll('.check-bahan:checked')).map(cb => parseInt(cb.value));
        
        if (!action) return alert('Pilih aksi terlebih dahulu');
        if (selectedIds.length === 0) return alert('Pilih minimal satu data');

        if (action === 'delete') {
            if (!confirm(`Yakin hapus ${selectedIds.length} bahan terpilih?`)) return;
            const res = await apiPost('/api/bahan/bulk-delete', { ids: selectedIds });
            alert(res.message);
            if (!res.message.includes('Gagal')) {
                document.getElementById('bulkBahanAction').value = '';
                loadBahan();
            }
        } else if (action === 'move') {
            if (typeof bukaModalBulkPindah === 'function') {
                bukaModalBulkPindah('bahan', selectedIds);
            }
        }
    });

    document.getElementById('formBahan').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_bahan: document.getElementById('bahan_kode').value,
            nama_bahan: document.getElementById('bahan_nama').value,
            produsen: document.getElementById('bahan_produsen').value || '-',
            stok_awal: parseFloat(document.getElementById('bahan_stok_awal').value),
            stok_akhir: parseFloat(document.getElementById('bahan_stok_akhir').value) || 0,
            satuan: document.getElementById('bahan_satuan').value,
            tanggal_kadaluarsa: document.getElementById('bahan_kadaluarsa').value || null,
            lab_id: parseInt(document.getElementById('bahan_lab').value),
            keterangan: document.getElementById('bahan_keterangan').value
        };
        if (!body.kode_bahan || !body.nama_bahan || !body.stok_awal) return alert('Kode, nama, dan stok awal wajib diisi');

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

    searchBahan.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = this.value.toLowerCase().trim();
            if (!keyword) {
                renderBahan(allBahanData);
            } else {
                const filtered = allBahanData.filter(item => 
                    item.nama_bahan.toLowerCase().includes(keyword) || 
                    item.kode_bahan.toLowerCase().includes(keyword)
                );
                renderBahan(filtered);
            }
            suggestBahan.classList.remove('active');
        }
    });

    suggestBahan.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            renderBahan(allBahanData.filter(b => b.id === parseInt(item.getAttribute('data-id'))));
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
    if (typeof initImportExcel === 'function') initImportExcel();
    console.log('✅ Modul Bahan siap');
}

function injectBulkBahanUI() {
    if (document.getElementById('bulkBahanBar')) return; // Cegah duplikasi

    const btnTambah = document.getElementById('btnTambahBahan');
    const headerRow = btnTambah.closest('div').parentElement; // div paling atas
    const title = headerRow.querySelector('h3');

    // Buat wadah flexbox untuk judul dan bulk bar
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '12px';
    titleContainer.style.flexWrap = 'wrap';

    // Pindahkan h3 ke dalam wadah baru
    headerRow.insertBefore(titleContainer, title);
    titleContainer.appendChild(title);

    // Buat HTML Bulk Bar
    const bulkBarHTML = `
        <div id="bulkBahanBar" style="display:none; align-items:center; gap:8px; background:#e8f5e9; padding:4px 10px; border-radius:6px; border:1px solid #c8e6c9;">
            <span id="bulkBahanCount" style="font-size:13px; font-weight:600; color:#2e7d32;">0 dipilih</span>
            <select id="bulkBahanAction" class="form-input" style="width:auto; padding:4px 8px; font-size:12px; height:auto; border-color:#a5d6a7;">
                <option value="">-- Aksi Massal --</option>
                <option value="delete">Hapus Terpilih</option>
                <option value="move">Pindah Lab</option>
            </select>
            <button type="button" class="btn-tambah" id="btnBulkBahanApply" style="padding:4px 10px; font-size:12px; margin:0; box-shadow:none;">Terapkan</button>
        </div>
    `;
    titleContainer.insertAdjacentHTML('beforeend', bulkBarHTML);
}

async function loadBahan() {
    const container = document.getElementById('bahanList');
    if (!container) return;
    try {
        const labId = document.getElementById('invLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        const response = await apiGet('/api/bahan', params);
        allBahanData = Array.isArray(response) ? response : (response.data || []);
        renderBahan(allBahanData);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data bahan.</p>';
    }
}

function renderBahan(data) {
    const container = document.getElementById('bahanList');
    const currentRole = localStorage.getItem('role') || 'guru';
    const isEditable = currentRole !== 'guru';

    if (!data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada data bahan.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            ${isEditable ? `<th style="padding:8px;border:1px solid #d0e6d5; text-align:center; width:30px;"><input type="checkbox" id="checkAllBahan"></th>` : ''}
            <th style="padding:8px;border:1px solid #d0e6d5;">Kode</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Bahan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Produsen</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Stok Awal</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Stok Akhir</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Satuan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kadaluarsa</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const tgl = item.tanggal_kadaluarsa ? item.tanggal_kadaluarsa.substring(0, 10) : '-';
        let aksi = '';
        if (isEditable) {
            aksi = `<button class="btn-pindah" data-pindah-bahan="${item.id}" data-nama="${item.nama_bahan}" title="Pindah Lab">Pindah</button>
                <button class="btn-edit" data-edit-bahan="${item.id}">Edit</button>
                <button class="btn-delete" data-hapus-bahan="${item.id}">Hapus</button>`;
        } else {
            aksi = '<span style="color:#888;">-</span>';
        }

        html += `<tr>
            ${isEditable ? `<td style="padding:8px;border:1px solid #d0e6d5; text-align:center;"><input type="checkbox" class="check-bahan" value="${item.id}"></td>` : ''}
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kode_bahan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_bahan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.produsen}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.stok_awal}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.stok_akhir}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.satuan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tgl}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${aksi}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    if (isEditable) {
        const checkAll = document.getElementById('checkAllBahan');
        const checkItems = container.querySelectorAll('.check-bahan');
        const bar = document.getElementById('bulkBahanBar');
        const count = document.getElementById('bulkBahanCount');

        function updateBulkBar() {
            const checked = container.querySelectorAll('.check-bahan:checked').length;
            if (checked > 0) {
                bar.style.display = 'flex';
                count.textContent = `${checked} dipilih`;
            } else {
                bar.style.display = 'none';
                if (checkAll) checkAll.checked = false;
            }
        }

        if (checkAll) {
            checkAll.addEventListener('change', function() {
                checkItems.forEach(cb => cb.checked = this.checked);
                updateBulkBar();
            });
        }

        checkItems.forEach(cb => {
            cb.addEventListener('change', function() {
                if (!this.checked && checkAll) checkAll.checked = false;
                const allChecked = Array.from(checkItems).every(c => c.checked);
                if (allChecked && checkAll) checkAll.checked = true;
                updateBulkBar();
            });
        });

        container.querySelectorAll('[data-edit-bahan]').forEach(btn => btn.addEventListener('click', () => editBahan(parseInt(btn.getAttribute('data-edit-bahan')))));
        container.querySelectorAll('[data-hapus-bahan]').forEach(btn => btn.addEventListener('click', () => hapusBahan(parseInt(btn.getAttribute('data-hapus-bahan')))));
        container.querySelectorAll('[data-pindah-bahan]').forEach(btn => {
            btn.addEventListener('click', () => {
                bukaModalPindah('bahan', btn.getAttribute('data-pindah-bahan'), btn.getAttribute('data-nama'));
            });
        });
    }
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
    document.getElementById('bahan_stok_awal').value = item.stok_awal;
    document.getElementById('bahan_stok_akhir').value = item.stok_akhir;
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