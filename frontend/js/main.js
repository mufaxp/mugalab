/**
 * main.js - Frontend Publik Halaman Jadwal
 * Sudah termasuk fitur upload PDF pengajuan.
 */

// ================================================
// FUNGSI GLOBAL — bisa dipanggil di mana saja
// ================================================

// Getter dinamis (selalu ambil elemen terbaru dari DOM)
function getFileInput()      { return document.getElementById('pengajuan_file_pdf'); }
function getUploadArea()     { return document.getElementById('uploadArea'); }
function getUploadPreview()  { return document.getElementById('uploadPreview'); }
function getUploadFileName() { return document.getElementById('uploadFileName'); }
function getUploadFileSize() { return document.getElementById('uploadFileSize'); }
function getUploadRemove()   { return document.getElementById('uploadRemove'); }

/**
 * Reset field upload PDF di modal pengajuan.
 */
function resetUpload() {
    const fileInput = getFileInput();
    const uploadPreview = getUploadPreview();
    const uploadArea = getUploadArea();
    if (fileInput) fileInput.value = '';
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (uploadArea) uploadArea.classList.remove('has-file');
}

window.resetUpload = resetUpload;

// ================================================
// DOM READY
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    const weekSelect = document.getElementById('weekSelect');
    const tbody = document.querySelector('tbody');
    const modalPengajuan = document.getElementById('modalPengajuan');
    const formPengajuan = document.getElementById('formPengajuan');

    // ---------- UTIL TANGGAL ----------
    function getCurrentSunday() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        const sunday = new Date(today);
        sunday.setDate(diff);
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getWeekRange(sunday) {
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        return { start: formatDate(sunday), end: formatDate(saturday) };
    }

    function hitungTanggalDariHari(hari, currentSunday) {
        const hariMap = { 'Ahad': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
        const target = new Date(currentSunday);
        target.setDate(target.getDate() + hariMap[hari]);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // ---------- STATE ----------
    let labs = [];
    let currentLabIndex = 0;
    let currentSunday = getCurrentSunday();

    // ---------- LOAD LAB ----------
    async function loadLabs() {
        try {
            const response = await fetch('/api/lab');
            const json = await response.json();
            labs = json.data || [];
            if (labs.length > 0) {
                updateLabDisplay();
            }
        } catch (error) {
            console.error('Gagal memuat data lab:', error);
        }
    }

    function updateLabDisplay() {
        const labTitle = document.getElementById('labTitle');
        if (labTitle && labs[currentLabIndex]) {
            labTitle.textContent = labs[currentLabIndex].nama;
        }
        loadJadwal(formatDateISO(currentSunday), labs[currentLabIndex].id);
    }

    // ---------- NAVIGASI LAB ----------
    const labPrevBtn = document.getElementById('labPrev');
    const labNextBtn = document.getElementById('labNext');

    if (labPrevBtn) {
        labPrevBtn.addEventListener('click', function() {
            if (labs.length === 0) return;
            currentLabIndex = (currentLabIndex - 1 + labs.length) % labs.length;
            updateLabDisplay();
        });
    }

    if (labNextBtn) {
        labNextBtn.addEventListener('click', function() {
            if (labs.length === 0) return;
            currentLabIndex = (currentLabIndex + 1) % labs.length;
            updateLabDisplay();
        });
    }

    // ---------- DROPDOWN PEKAN ----------
    const today = new Date();
    const prevSunday = new Date(currentSunday); prevSunday.setDate(currentSunday.getDate() - 7);
    const nextSunday = new Date(currentSunday); nextSunday.setDate(currentSunday.getDate() + 7);

    const prevRange = getWeekRange(prevSunday);
    const currentRange = getWeekRange(currentSunday);
    const nextRange = getWeekRange(nextSunday);

    if (weekSelect) {
        const options = weekSelect.options;
        options[0].text = `Pekan Lalu (${prevRange.start} - ${prevRange.end})`;
        options[1].text = `Pekan Ini (${currentRange.start} - ${currentRange.end})`;
        options[2].text = `Pekan Depan (${nextRange.start} - ${nextRange.end})`;
        weekSelect.value = 'current';
    }

    // ---------- LOAD JADWAL ----------
    async function loadJadwal(mingguMulai, labId) {
        try {
            let url = `/api/jadwal/public?minggu_mulai=${mingguMulai}`;
            if (labId) url += `&lab_id=${labId}`;

            const response = await fetch(url);
            const json = await response.json();
            const data = Array.isArray(json) ? json : (json.data || []);
            renderJadwal(data);
        } catch (error) {
            console.error('Gagal memuat jadwal:', error);
        }
    }

    // ---------- RENDER JADWAL ----------
    function renderJadwal(jadwalList) {
        const semuaSel = tbody.querySelectorAll('td:not(:first-child)');
        semuaSel.forEach(td => {
            td.innerHTML = '';
            td.style.position = 'relative';
        });

        const hariKeKolom = {
            'Ahad': 0, 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3,
            'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
        };

        jadwalList.forEach(item => {
            const tglItem = new Date(item.tanggal);
            const hari = tglItem.toLocaleDateString('id-ID', { weekday: 'long' });
            const hariKapital = hari.charAt(0).toUpperCase() + hari.slice(1);
            const kolomIndex = hariKeKolom[hariKapital] + 1;

            const jamMulai = item.jam_mulai;
            const jamSelesai = item.jam_selesai;
            const rentang = jamSelesai - jamMulai + 1;

            const barisMulai = tbody.querySelectorAll('tr')[jamMulai - 1];
            if (!barisMulai) return;

            const selTarget = barisMulai.querySelectorAll('td')[kolomIndex];
            if (!selTarget) return;

            const card = document.createElement('div');
            card.className = 'jadwal-card';
            card.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0;
                height: ${rentang * 100}%;
                background: linear-gradient(135deg, #f0f7f2, #d0e6d5);
                border-left: 4px solid #0a5c32;
                border-radius: 6px;
                padding: 4px 6px;
                font-size: clamp(8px, 1vw, 13px);
                line-height: 1.3;
                overflow: hidden;
                z-index: 5;
                box-shadow: 0 2px 8px rgba(14, 112, 63, 0.1);
                text-align: left;
            `;

            card.innerHTML = `
                <strong>${item.kelas !== '-' ? item.kelas : ''}</strong>
                <div style="font-weight:500;">${item.kegiatan}</div>
                <div style="color:#555; font-size:0.9em;">${item.penanggung_jawab}</div>
            `;

            selTarget.innerHTML = '';
            selTarget.style.position = 'relative';
            selTarget.appendChild(card);
        });

        // Event listener klik sel kosong
        const allTd = tbody.querySelectorAll('td:not(:first-child)');
        allTd.forEach(td => {
            td.addEventListener('click', function() {
                if (this.querySelector('.jadwal-card')) return;

                const row = this.closest('tr');
                const jamMulai = parseInt(row.querySelector('td:first-child').textContent);
                const colIndex = Array.from(row.children).indexOf(this);
                const hari = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][colIndex - 1];
                const tanggal = hitungTanggalDariHari(hari, currentSunday);

                const tglObj = new Date(tanggal + 'T00:00:00');
                document.getElementById('pengajuan_hari_tanggal').textContent =
                    `${hari}, ${tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                document.getElementById('pengajuan_lab').textContent = labs[currentLabIndex]?.nama || 'Lab';
                document.getElementById('pengajuan_jam_mulai').value = jamMulai;

                // Reset form + upload
                formPengajuan.reset();
                resetUpload();  // ⭐ global function
                document.getElementById('pengajuan_jam_mulai').value = jamMulai;
                updateJamSelesaiOptions(jamMulai);
                document.getElementById('pengajuan_jam_selesai').value = Math.min(jamMulai + 1, 10);

                modalPengajuan.setAttribute('data-tanggal', tanggal);
                modalPengajuan.setAttribute('data-lab-id', labs[currentLabIndex]?.id || 1);

                modalPengajuan.style.display = 'flex';
            });
        });
    }

    // ---------- JAM SELESAI OPTIONS ----------
    function updateJamSelesaiOptions(jamMulai) {
        const sel = document.getElementById('pengajuan_jam_selesai');
        sel.innerHTML = '';
        for (let i = jamMulai; i <= 10; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            sel.appendChild(opt);
        }
    }

    const jamMulaiSelect = document.getElementById('pengajuan_jam_mulai');
    if (jamMulaiSelect) {
        jamMulaiSelect.addEventListener('change', function() {
            const mulai = parseInt(this.value);
            updateJamSelesaiOptions(mulai);
            document.getElementById('pengajuan_jam_selesai').value = Math.min(mulai + 1, 10);
        });
    }

    // ============================================
    // UPLOAD PDF HANDLER
    // ============================================
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function showFilePreview(file) {
        const uploadFileName = getUploadFileName();
        const uploadFileSize = getUploadFileSize();
        const uploadPreview = getUploadPreview();
        const uploadArea = getUploadArea();
        if (uploadFileName) uploadFileName.textContent = file.name;
        if (uploadFileSize) uploadFileSize.textContent = formatFileSize(file.size);
        if (uploadPreview) uploadPreview.style.display = 'flex';
        if (uploadArea) uploadArea.classList.add('has-file');
    }

    const uploadAreaEl = getUploadArea();
    const fileInputEl = getFileInput();

    if (uploadAreaEl && fileInputEl) {
        uploadAreaEl.addEventListener('click', (e) => {
            if (e.target.closest('.upload-remove')) return;
            if (uploadAreaEl.classList.contains('has-file')) return;
            fileInputEl.click();
        });

        fileInputEl.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            if (file.type !== 'application/pdf') {
                alert('Hanya file PDF yang diizinkan!');
                resetUpload();
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran file maksimal 5 MB!');
                resetUpload();
                return;
            }
            showFilePreview(file);
        });

        const uploadRemoveEl = getUploadRemove();
        if (uploadRemoveEl) {
            uploadRemoveEl.addEventListener('click', (e) => {
                e.stopPropagation();
                resetUpload();
            });
        }

        ['dragenter', 'dragover'].forEach(evt => {
            uploadAreaEl.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadAreaEl.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            uploadAreaEl.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadAreaEl.classList.remove('dragover');
            });
        });

        uploadAreaEl.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (!file) return;
            if (file.type !== 'application/pdf') return alert('Hanya file PDF yang diizinkan!');
            if (file.size > 5 * 1024 * 1024) return alert('Ukuran file maksimal 5 MB!');
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputEl.files = dt.files;
            showFilePreview(file);
        });
    }

    // ============================================
    // SUBMIT FORM PENGAJUAN
    // ============================================
    formPengajuan.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!document.getElementById('pengajuan_nama').value ||
            !document.getElementById('pengajuan_wa').value ||
            !document.getElementById('pengajuan_kegiatan').value) {
            return alert('Nama, No WA, dan Kegiatan wajib diisi!');
        }

        const formData = new FormData();
        formData.append('pengaju', document.getElementById('pengajuan_nama').value);
        formData.append('nomor_wa', document.getElementById('pengajuan_wa').value);
        formData.append('penanggung_jawab', document.getElementById('pengajuan_nama').value);
        formData.append('mata_pelajaran', document.getElementById('pengajuan_mapel').value);
        formData.append('kegiatan', document.getElementById('pengajuan_kegiatan').value);
        formData.append('kelas', document.getElementById('pengajuan_kelas').value || '-');
        formData.append('tanggal', modalPengajuan.getAttribute('data-tanggal'));
        formData.append('jam_mulai', document.getElementById('pengajuan_jam_mulai').value);
        formData.append('jam_selesai', document.getElementById('pengajuan_jam_selesai').value);
        formData.append('lab_id', modalPengajuan.getAttribute('data-lab-id'));

        // Ambil file via getter global
        const fi = getFileInput();
        if (fi && fi.files[0]) {
            formData.append('file_pdf', fi.files[0]);
        }

        const submitBtn = this.querySelector('.btn-simpan');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Mengirim...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/pengajuan', { method: 'POST', body: formData });
            const data = await res.json();
            alert(data.message || 'Pengajuan berhasil dikirim!');
            if (res.ok) {
                modalPengajuan.style.display = 'none';
                resetUpload();
            }
        } catch (err) {
            alert('Gagal mengirim pengajuan. Silakan coba lagi.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // ---------- TUTUP MODAL KLIK LUAR ----------
    window.addEventListener('click', function(e) {
        if (e.target === modalPengajuan) {
            modalPengajuan.style.display = 'none';
        }
    });

    // ---------- LOAD AWAL ----------
    loadLabs().then(() => {
        if (labs.length > 0) {
            loadJadwal(formatDateISO(currentSunday), labs[currentLabIndex].id);
        } else {
            loadJadwal(formatDateISO(currentSunday));
        }
    });

    // ---------- EVENT DROPDOWN PEKAN ----------
    if (weekSelect) {
        weekSelect.addEventListener('change', function() {
            if (this.value === 'prev') {
                currentSunday = new Date(prevSunday);
            } else if (this.value === 'current') {
                currentSunday = getCurrentSunday();
            } else if (this.value === 'next') {
                currentSunday = new Date(nextSunday);
            }

            const labId = labs.length > 0 ? labs[currentLabIndex].id : null;
            loadJadwal(formatDateISO(currentSunday), labId);
        });
    }

    // ---------- LOAD SETTINGS ----------
    async function loadSettings() {
        try {
            const res = await fetch('/api/settings/public');
            const json = await res.json();
            const data = json.data || json;
            if (data.nama_sekolah) {
                document.getElementById('nama_sekolah_display').textContent = data.nama_sekolah;
            }
            if (data.nama_lab) {
                document.getElementById('nama_lab_display').textContent = data.nama_lab;
            }
        } catch (err) {
            console.warn('Gagal memuat pengaturan:', err);
        }
    }

    loadSettings();
});