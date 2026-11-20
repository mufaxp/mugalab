/**
 * alat.js - Inventaris Alat Module
 */

let alatEditMode = false;
let alatEditId = null;
let allAlatData = [];

async function initAlat() {
    const currentRole = localStorage.getItem('role') || 'guru';

    await loadLabOptions('alat_lab');
    await loadLabOptions('invLabFilter', true);

    const btnTambahAlat = document.getElementById('btnTambahAlat');
    if (btnTambahAlat && currentRole === 'guru') {
        btnTambahAlat.style.display = 'none';
    }

    if (currentRole !== 'guru') {
        injectBulkAlatUI();
    }

    document.getElementById('btnTambahAlat').addEventListener('click', function() {
        alatEditMode = false;
        alatEditId = null;
        document.getElementById('modalAlatTitle').textContent = 'Tambah Alat';
        document.getElementById('formAlat').reset();
        openModal('modalAlat');
    });

    document.getElementById('btnBulkAlatApply')?.addEventListener('click', async () => {
        const action = document.getElementById('bulkAlatAction').value;
        const selectedIds = Array.from(document.querySelectorAll('.check-alat:checked')).map(cb => parseInt(cb.value));
        
        if (!action) return alert('Pilih aksi terlebih dahulu');
        if (selectedIds.length === 0) return alert('Pilih minimal satu data');

        if (action === 'delete') {
            if (!confirm(`Yakin hapus ${selectedIds.length} alat terpilih?`)) return;
            const res = await apiPost('/api/alat/bulk-delete', { ids: selectedIds });
            alert(res.message);
            if (!res.message.includes('Gagal')) {
                document.getElementById('bulkAlatAction').value = '';
                loadAlat();
            }
        } else if (action === 'move') {
            if (typeof bukaModalBulkPindah === 'function') {
                bukaModalBulkPindah('alat', selectedIds);
            }
        }
    });

    document.getElementById('formAlat').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_alat: document.getElementById('alat_kode').value,
            nama_alat: document.getElementById('alat_nama').value,
            spek: document.getElementById('alat_spek').value || '-',
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

    searchAlat.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = this.value.toLowerCase().trim();
            if (!keyword) {
                renderAlat(allAlatData);
            } else {
                const filtered = allAlatData.filter(item => 
                    item.nama_alat.toLowerCase().includes(keyword) || 
                    item.kode_alat.toLowerCase().includes(keyword)
                );
                renderAlat(filtered);
            }
            suggestAlat.classList.remove('active');
        }
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
    const sidebarInv = document.querySelector('.sidebar-item[data-panel="inventaris"]');
    if (sidebarInv) sidebarInv.addEventListener('click', loadAlat);
    if (typeof initImportExcel === 'function') initImportExcel();
    console.log('✅ Modul Alat siap');
}

function injectBulkAlatUI() {
    if (document.getElementById('bulkAlatBar')) return; // Cegah duplikasi

    const btnTambah = document.getElementById('btnTambahAlat');
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
        <div id="bulkAlatBar" style="display:none; align-items:center; gap:8px; background:#e8f5e9; padding:4px 10px; border-radius:6px; border:1px solid #c8e6c9;">
            <span id="bulkAlatCount" style="font-size:13px; font-weight:600; color:#2e7d32;">0 dipilih</span>
            <select id="bulkAlatAction" class="form-input" style="width:auto; padding:4px 8px; font-size:12px; height:auto; border-color:#a5d6a7;">
                <option value="">-- Aksi Massal --</option>
                <option value="delete">Hapus Terpilih</option>
                <option value="move">Pindah Lab</option>
            </select>
            <button type="button" class="btn-tambah" id="btnBulkAlatApply" style="padding:4px 10px; font-size:12px; margin:0; box-shadow:none;">Terapkan</button>
        </div>
    `;
    titleContainer.insertAdjacentHTML('beforeend', bulkBarHTML);
}

async function loadAlat() {
    const container = document.getElementById('alatList');
    if (!container) return;
    try {
        const labId = document.getElementById('invLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        const response = await apiGet('/api/alat', params);
        allAlatData = Array.isArray(response) ? response : (response.data || []);
        renderAlat(allAlatData);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data alat.</p>';
    }
}

function renderAlat(data) {
    const container = document.getElementById('alatList');
    const currentRole = localStorage.getItem('role') || 'guru';
    const isEditable = currentRole !== 'guru';

    if (!data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada data alat.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            ${isEditable ? `<th style="padding:8px;border:1px solid #d0e6d5; text-align:center; width:30px;"><input type="checkbox" id="checkAllAlat"></th>` : ''}
            <th style="padding:8px;border:1px solid #d0e6d5;">Kode</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Alat</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Spek</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Produsen</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jumlah</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kondisi</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const kondisiEmoji = item.kondisi === 'baik' ? '✅' : item.kondisi === 'rusak' ? '🔴' : '🟡';
        let aksi = '';
        if (isEditable) {
            aksi = `<button class="btn-pindah" data-pindah-alat="${item.id}" data-nama="${item.nama_alat}" title="Pindah Lab">Pindah</button>
                <button class="btn-edit" data-edit-alat="${item.id}">Edit</button>
                <button class="btn-delete" data-hapus-alat="${item.id}">Hapus</button>`;
        } else {
            aksi = '<span style="color:#888;">-</span>';
        }

        html += `<tr>
            ${isEditable ? `<td style="padding:8px;border:1px solid #d0e6d5; text-align:center;"><input type="checkbox" class="check-alat" value="${item.id}"></td>` : ''}
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kode_alat}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_alat}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.spek}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.produsen}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">
                <span style="font-size:14px;">${item.jumlah}</span>
                ${parseInt(item.dipinjam) > 0 ? `<br><span style="color:#E65100;font-size:11px;font-weight:600;">${item.dipinjam} dipinjam</span>` : ''}
                ${parseInt(item.jumlah_rusak) > 0 ? `<br><span style="color:#c62828;font-size:11px;">${item.jumlah_rusak} rusak</span>` : ''}
            </td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${kondisiEmoji} ${item.kondisi}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${aksi}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    if (isEditable) {
        const checkAll = document.getElementById('checkAllAlat');
        const checkItems = container.querySelectorAll('.check-alat');
        const bar = document.getElementById('bulkAlatBar');
        const count = document.getElementById('bulkAlatCount');

        function updateBulkBar() {
            const checked = container.querySelectorAll('.check-alat:checked').length;
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

        container.querySelectorAll('[data-edit-alat]').forEach(btn => btn.addEventListener('click', () => editAlat(parseInt(btn.getAttribute('data-edit-alat')))));
        container.querySelectorAll('[data-hapus-alat]').forEach(btn => btn.addEventListener('click', () => hapusAlat(parseInt(btn.getAttribute('data-hapus-alat')))));
        container.querySelectorAll('[data-pindah-alat]').forEach(btn => {
            btn.addEventListener('click', () => {
                bukaModalPindah('alat', btn.getAttribute('data-pindah-alat'), btn.getAttribute('data-nama'));
            });
        });
    }
}

async function editAlat(id) {
    const item = allAlatData.find(a => a.id === id);
    if (!item) return;
    alatEditMode = true;
    alatEditId = id;
    document.getElementById('modalAlatTitle').textContent = 'Edit Alat';
    document.getElementById('alat_kode').value = item.kode_alat;
    document.getElementById('alat_nama').value = item.nama_alat;
    document.getElementById('alat_spek').value = item.spek || '-';
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