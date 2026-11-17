/**
 * utils.js - Global Helper Functions
 */

function formatTanggal(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function toLocalDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDateISO(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getCurrentSunday() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today);
    sunday.setDate(diff);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
}

let _labsCache = null;

async function loadLabOptions(selectId, includeAll = false) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        // Hanya fetch jika cache belum ada
        if (!_labsCache) {
            const response = await apiGet('/api/lab');
            _labsCache = Array.isArray(response) ? response : (response.data || []);
        }

        const labs = _labsCache;

        let html = '';
        if (includeAll) {
            html += '<option value="all">Semua Lab</option>';
        }
        labs.forEach(lab => {
            html += `<option value="${lab.id}">${lab.nama}</option>`;
        });
        select.innerHTML = html;
    } catch (error) {
        console.error(`Gagal load options untuk ${selectId}:`, error);
    }
}

// Method fillLabOptions
function fillLabOptions(selectId, labs, includeAll = false) {
    const select = document.getElementById(selectId);
    if (!select) return;

    if (!Array.isArray(labs) || labs.length === 0) return;

    let html = '';
    if (includeAll) {
        html += '<option value="all">Semua Lab</option>';
    }
    labs.forEach(lab => {
        html += `<option value="${lab.id}">${lab.nama}</option>`;
    });
    select.innerHTML = html;
}
async function bukaModalPindah(jenis, id, nama) {
    document.getElementById('pindah_jenis').value = jenis;
    document.getElementById('pindah_id').value = id;
    document.getElementById('pindah_nama_item').textContent = nama;
    
    // Muat list lab menggunakan cache
    await loadLabOptions('pindah_lab_id');
    
    // Reset pilihan
    document.getElementById('pindah_lab_id').value = '';
    openModal('modalPindahLab');
}

document.addEventListener('DOMContentLoaded', () => {
    const formPindah = document.getElementById('formPindahLab');
    if (formPindah) {
        formPindah.addEventListener('submit', async function(e) {
            e.preventDefault();
            const jenis = document.getElementById('pindah_jenis').value;
            const id = document.getElementById('pindah_id').value;
            const labId = document.getElementById('pindah_lab_id').value;
            
            if (!labId) return alert('Pilih laboratorium tujuan terlebih dahulu');

            const btn = document.getElementById('btnSubmitPindah');
            btn.disabled = true;
            btn.textContent = 'Memindahkan...';

            try {
                const res = await apiPut(`/api/${jenis}/${id}/pindah`, { lab_id: labId });
                alert(res.message);
                if (!res.message.includes('Gagal')) {
                    closeModal('modalPindahLab');
                    // Refresh tabel yang sesuai
                    if (jenis === 'alat' && typeof loadAlat === 'function') loadAlat();
                    if (jenis === 'bahan' && typeof loadBahan === 'function') loadBahan();
                    if (jenis === 'sarana' && typeof loadSarana === 'function') loadSarana();
                }
            } catch (err) {
                alert('Gagal terhubung ke server');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Pindahkan';
            }
        });
    }
});

window.bukaModalPindah = bukaModalPindah;
window.loadLabOptions = loadLabOptions;
window.fillLabOptions = fillLabOptions;