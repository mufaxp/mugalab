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

window.loadLabOptions = loadLabOptions;
window.fillLabOptions = fillLabOptions;