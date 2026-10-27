/**
 * import.js - Excel Import Helper for Inventaris
 * Shared logic untuk import alat/bahan/sarana dari Excel.
 * Load setelah alat.js, bahan.js, sarana.js.
 */

const IMPORT_CONFIG = {
    alat:   { label: 'Alat',   endpoint: '/api/alat/import',   template: '/dashboard/assets/templates/alat-template.xlsx'   },
    bahan:  { label: 'Bahan',  endpoint: '/api/bahan/import',  template: '/dashboard/assets/templates/bahan-template.xlsx'  },
    sarana: { label: 'Sarana', endpoint: '/api/sarana/import', template: '/dashboard/assets/templates/sarana-template.xlsx' }
};

function _importCap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function _importGetLabSelection() {
    const sel = document.getElementById('invLabFilter');
    if (!sel) return { id: null, name: '' };
    const val = sel.value;
    if (!val || val === 'all') return { id: null, name: '' };
    return { id: parseInt(val, 10), name: sel.options[sel.selectedIndex]?.textContent || '' };
}

function _importEsc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateImportButtons() {
    const { id } = _importGetLabSelection();
    const role = localStorage.getItem('role') || 'guru';
    const show = !!id && role !== 'guru';

    ['alat', 'bahan', 'sarana'].forEach(jenis => {
        const cap = _importCap(jenis);
        const btnTpl = document.getElementById('btnTemplate' + cap);
        const btnImp = document.getElementById('btnImport' + cap);
        if (btnTpl) btnTpl.style.display = show ? 'inline-flex' : 'none';
        if (btnImp) btnImp.style.display = show ? 'inline-block' : 'none';
    });
}

function _importFormatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function _importResetUpload() {
    const input = document.getElementById('import_file');
    const area = document.getElementById('import_upload_area');
    const preview = document.getElementById('import_upload_preview');
    if (input) input.value = '';
    if (area) area.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (input) input.required = true;
}

function _importShowPreview(file) {
    const area = document.getElementById('import_upload_area');
    const preview = document.getElementById('import_upload_preview');
    const nameEl = document.getElementById('import_upload_filename');
    const sizeEl = document.getElementById('import_upload_size');
    if (area) area.style.display = 'none';
    if (preview) preview.style.display = 'flex';
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = _importFormatSize(file.size);
}

function _importValidateFile(file) {
    const name = (file.name || '').toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
        alert('Format file harus .xlsx atau .xls');
        return false;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file melebihi 5 MB');
        return false;
    }
    return true;
}

function _setupUploadArea() {
    const area = document.getElementById('import_upload_area');
    const input = document.getElementById('import_file');
    const btnRemove = document.getElementById('import_upload_remove');
    if (!area || !input) return;

    // Klik area → buka file picker
    area.addEventListener('click', () => input.click());

    // File dipilih via file picker
    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        if (!_importValidateFile(file)) {
            input.value = '';
            return;
        }
        _importShowPreview(file);
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(ev => {
        area.addEventListener(ev, e => {
            e.preventDefault();
            e.stopPropagation();
            area.classList.add('dragover');
        });
    });
    ['dragleave', 'drop'].forEach(ev => {
        area.addEventListener(ev, e => {
            e.preventDefault();
            e.stopPropagation();
            area.classList.remove('dragover');
        });
    });
    area.addEventListener('drop', e => {
        const files = e.dataTransfer && e.dataTransfer.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!_importValidateFile(file)) return;
        try {
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
        } catch (err) {
            alert('Browser tidak mendukung drag & drop. Silakan klik area untuk memilih file.');
            return;
        }
        _importShowPreview(file);
    });

    // Tombol × hapus file
    if (btnRemove) {
        btnRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            _importResetUpload();
        });
    }
}

function openImportExcel(jenis) {
    const cfg = IMPORT_CONFIG[jenis];
    if (!cfg) return;
    const { id, name } = _importGetLabSelection();
    if (!id) {
        alert('Pilih ruang lab terlebih dahulu');
        return;
    }
    document.getElementById('import_jenis').value = jenis;
    document.getElementById('import_lab_id').value = id;
    document.getElementById('import_lab_name').textContent = name || ('Lab #' + id);
    document.getElementById('modalImportTitle').textContent = 'Import ' + cfg.label + ' dari Excel';
    document.getElementById('import_template_link').href = cfg.template;
    document.getElementById('formImport').reset();
    _importResetUpload();
    document.getElementById('import_error_box').style.display = 'none';
    document.getElementById('import_error_list').innerHTML = '';
    document.getElementById('btnDownloadErrors').style.display = 'none';
    openModal('modalImport');
}

let _lastImportErrors = [];

function _downloadImportErrorsCSV() {
    if (!_lastImportErrors.length) return;
    const headers = ['Baris', 'Kolom', 'Nilai', 'Pesan'];
    const rows = _lastImportErrors.map(e => [
        e.row,
        e.column || '',
        (e.value != null && e.value !== '') ? e.value : '',
        e.message || ''
    ]);
    const csv = [headers, ...rows]
        .map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
        .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-error-' + Date.now() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function _handleImportSubmit(e) {
    e.preventDefault();

    const jenis = document.getElementById('import_jenis').value;
    const labId = parseInt(document.getElementById('import_lab_id').value, 10);
    const fileInput = document.getElementById('import_file');
    const btn = document.getElementById('btnImportSubmit');
    const errBox = document.getElementById('import_error_box');
    const errList = document.getElementById('import_error_list');
    const errTitle = document.getElementById('import_error_title');
    const btnDl = document.getElementById('btnDownloadErrors');

    if (!jenis || !IMPORT_CONFIG[jenis]) return alert('Jenis import tidak valid');

    const file = fileInput.files && fileInput.files[0];
    if (!file) return alert('Pilih file Excel terlebih dahulu');
    if (!_importValidateFile(file)) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('lab_id', labId);

    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = 'Mengimpor...';
    errBox.style.display = 'none';
    _lastImportErrors = [];

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(IMPORT_CONFIG[jenis].endpoint, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: fd
        });
        const json = await res.json();

        if (json.success) {
            closeModal('modalImport');
            alert('✅ ' + (json.message || 'Import berhasil'));
            if (jenis === 'alat' && typeof loadAlat === 'function') loadAlat();
            if (jenis === 'bahan' && typeof loadBahan === 'function') loadBahan();
            if (jenis === 'sarana' && typeof loadSarana === 'function') loadSarana();
        } else {
            const errors = (json.data && json.data.errors) || [];
            if (errors.length > 0) {
                _lastImportErrors = errors;
                errTitle.textContent = 'Import dibatalkan — ' + errors.length + ' baris bermasalah:';
                errList.innerHTML = errors.map(e => {
                    const val = (e.value !== undefined && e.value !== '') ? ' · nilai <code>' + _importEsc(e.value) + '</code>' : '';
                    const col = e.column ? ' · kolom <code>' + _importEsc(e.column) + '</code>' : '';
                    return '<div style="padding:6px 8px; border-bottom:1px solid #FFCDD2; font-size:12px;">'
                        + '<strong>Baris ' + e.row + '</strong>' + col + val
                        + '<br><span style="color:#C62828;">' + _importEsc(e.message) + '</span>'
                        + '</div>';
                }).join('');
                btnDl.style.display = 'inline-block';
            } else {
                errTitle.textContent = 'Gagal:';
                errList.innerHTML = '<div style="padding:6px 8px; color:#C62828; font-size:13px;">' + _importEsc(json.message || 'Terjadi kesalahan') + '</div>';
            }
            errBox.style.display = 'block';
        }
    } catch (err) {
        errTitle.textContent = 'Error jaringan:';
        errList.innerHTML = '<div style="padding:6px 8px; color:#C62828; font-size:13px;">' + _importEsc(err.message) + '</div>';
        errBox.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = origText;
    }
}

function initImportExcel() {
    updateImportButtons();

    if (window.__importExcelSetup) return;
    window.__importExcelSetup = true;

    _setupUploadArea();
    ['alat', 'bahan', 'sarana'].forEach(jenis => {
        const cap = _importCap(jenis);
        const btnTpl = document.getElementById('btnTemplate' + cap);
        const btnImp = document.getElementById('btnImport' + cap);
        if (btnTpl) btnTpl.href = IMPORT_CONFIG[jenis].template;
        if (btnImp) btnImp.addEventListener('click', () => openImportExcel(jenis));
    });

    const sel = document.getElementById('invLabFilter');
    if (sel) sel.addEventListener('change', updateImportButtons);

    const form = document.getElementById('formImport');
    if (form) form.addEventListener('submit', _handleImportSubmit);

    const btnDl = document.getElementById('btnDownloadErrors');
    if (btnDl) btnDl.addEventListener('click', _downloadImportErrorsCSV);
}

window.initImportExcel = initImportExcel;
window.openImportExcel = openImportExcel;
window.updateImportButtons = updateImportButtons;