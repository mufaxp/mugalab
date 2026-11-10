/**
 * setting.js - Modul Pengaturan Web
 * Hanya untuk admin.
 *
 * Panel Pengaturan memiliki 3 tab:
 *   - umum  : nama sekolah, nama lab, upload template
 *   - lab   : CRUD ruangan lab   (delegasi ke lab.js)
 *   - user  : CRUD user          (delegasi ke user.js)
 */

async function initSetting() {
    const currentRole = localStorage.getItem('role') || 'guru';
    if (currentRole !== 'admin') {
        console.log('Setting hanya untuk admin');
        return;
    }

    // -------- Tab Navigation --------
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = document.querySelectorAll('.settings-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-settings-tab');
            activateSettingsTab(tabName, tabs, panels);
        });
    });

    // -------- State untuk Mapel --------
    let currentMapelList = [];
    const inpMapel = document.getElementById('setting_mata_pelajaran_input');
    const containerMapel = document.getElementById('setting_mapel_container');
    // Teks kecil di bawah input mapel
    const mapelHelper = inpMapel ? inpMapel.nextElementSibling.nextElementSibling : null;

    // FUNGSI BARU: Auto-Save ke Database
    async function autoSaveMapel() {
        const inpSekolah = document.getElementById('setting_nama_sekolah');
        const inpLab = document.getElementById('setting_nama_lab');
        
        // Validasi: Jangan simpan jika nama sekolah atau lab masih kosong
        if (!inpSekolah.value.trim() || !inpLab.value.trim()) {
            console.warn('Auto-save mapel dilewati: Nama sekolah/lab belum diisi');
            return;
        }

        const body = {
            nama_sekolah: inpSekolah.value.trim(),
            nama_lab: inpLab.value.trim(),
            mata_pelajaran_list: JSON.stringify(currentMapelList)
        };

        // Ubah teks helper sebagai indikator loading
        if (mapelHelper) mapelHelper.textContent = 'Menyimpan ke database...';

        try {
            await apiPut('/api/settings', body);
            
            if (mapelHelper) {
                mapelHelper.textContent = '✓ Tersimpan otomatis.';
                setTimeout(() => {
                    mapelHelper.textContent = 'Tekan Enter untuk menambahkan ke daftar. Klik × untuk menghapus.';
                }, 2000);
            }
        } catch (err) {
            console.error('Gagal auto-save mapel:', err);
            if (mapelHelper) mapelHelper.textContent = '❌ Gagal menyimpan. Silakan coba lagi.';
        }
    }

    function renderMapelChips() {
        if (!containerMapel) return;
        containerMapel.innerHTML = currentMapelList.map((mapel, index) => `
            <div class="mapel-chip">
                <span>${mapel}</span>
                <button type="button" class="mapel-chip-remove" data-index="${index}">×</button>
            </div>
        `).join('');

        // Event listener untuk tombol hapus (×)
        containerMapel.querySelectorAll('.mapel-chip-remove').forEach(btn => {
            btn.addEventListener('click', async function() {
                const idx = parseInt(this.getAttribute('data-index'));
                currentMapelList.splice(idx, 1);
                renderMapelChips();
                await autoSaveMapel(); // <-- Panggil Auto-Save
            });
        });
    }

    if (inpMapel) {
        inpMapel.addEventListener('keydown', async function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Mencegah form submit
                const val = this.value.trim();
                
                if (val && !currentMapelList.includes(val)) {
                    currentMapelList.push(val);
                    renderMapelChips();
                    this.value = ''; // Kosongkan input
                    await autoSaveMapel(); // <-- Panggil Auto-Save
                } else if (currentMapelList.includes(val)) {
                    alert('Mata pelajaran ini sudah ada di daftar.');
                }
            }
        });
    }

    // -------- Form Pengaturan Umum --------
    const form = document.getElementById('formSettings');
    const inpSekolah = document.getElementById('setting_nama_sekolah');
    const inpLab = document.getElementById('setting_nama_lab');
    const btnUpload = document.getElementById('btnUploadTemplate');
    const fileInput = document.getElementById('setting_template');

    async function loadCurrentSettings() {
        try {
            const res = await apiGet('/api/settings');
            const settingsArray = Array.isArray(res) ? res : (res.data || []);
            if (Array.isArray(settingsArray)) {
                const namaSekolah = settingsArray.find(s => s.setting_key === 'nama_sekolah')?.setting_value || '';
                const namaLab = settingsArray.find(s => s.setting_key === 'nama_lab')?.setting_value || '';
                const mapelRaw = settingsArray.find(s => s.setting_key === 'mata_pelajaran_list')?.setting_value || '[]';
                
                inpSekolah.value = namaSekolah;
                inpLab.value = namaLab;

                // Parse JSON list mapel
                try {
                    currentMapelList = JSON.parse(mapelRaw);
                    if (!Array.isArray(currentMapelList)) currentMapelList = [];
                } catch (e) {
                    currentMapelList = [];
                }
                renderMapelChips();
            }
        } catch (err) {
            console.warn('Gagal memuat pengaturan:', err);
        }
    }

    // Tombol Simpan Utama (tetap berfungsi untuk menyimpan Nama Sekolah & Nama Lab)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const body = {
            nama_sekolah: inpSekolah.value.trim(),
            nama_lab: inpLab.value.trim(),
            mata_pelajaran_list: JSON.stringify(currentMapelList)
        };
        
        if (!body.nama_sekolah || !body.nama_lab) return alert('Nama sekolah dan lab wajib diisi');

        const data = await apiPut('/api/settings', body);
        alert(data.message);
    });

    if (btnUpload) {
        btnUpload.addEventListener('click', async () => {
            if (!fileInput.files[0]) return alert('Pilih file .docx terlebih dahulu');
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const token = getToken();
            btnUpload.disabled = true;
            btnUpload.textContent = '⏳ Mengunggah...';

            try {
                const res = await fetch('/api/settings/template', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                alert(data.message);
            } catch (err) {
                alert('Gagal mengunggah template');
            } finally {
                btnUpload.disabled = false;
                btnUpload.textContent = 'Unggah Template';
            }
        });
    }

    // -------- Reload saat sidebar "Pengaturan" diklik --------
    const sidebar = document.querySelector('.sidebar-item[data-panel="setting"]');
    if (sidebar) {
        sidebar.addEventListener('click', () => {
            const activeTab = document.querySelector('.settings-tab.active');
            const tabName = activeTab ? activeTab.getAttribute('data-settings-tab') : 'umum';
            activateSettingsTab(tabName, tabs, panels);
        });
    }

    // -------- Initial load --------
    loadCurrentSettings();
    console.log('✅ Modul Pengaturan Web siap');
}

function activateSettingsTab(tabName, tabs, panels) {
    tabs = tabs || document.querySelectorAll('.settings-tab');
    panels = panels || document.querySelectorAll('.settings-panel');

    tabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-settings-tab') === tabName);
    });
    panels.forEach(p => {
        p.classList.toggle('active', p.id === 'setting-' + tabName);
    });

    if (tabName === 'lab' && typeof loadLabData === 'function') {
        loadLabData();
    }
    if (tabName === 'user' && typeof loadUser === 'function') {
        loadUser();
    }
}

function activateSettingsTab(tabName, tabs, panels) {
    tabs = tabs || document.querySelectorAll('.settings-tab');
    panels = panels || document.querySelectorAll('.settings-panel');

    tabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-settings-tab') === tabName);
    });
    panels.forEach(p => {
        p.classList.toggle('active', p.id === 'setting-' + tabName);
    });

    if (tabName === 'lab' && typeof loadLabData === 'function') {
        loadLabData();
    }
    if (tabName === 'user' && typeof loadUser === 'function') {
        loadUser();
    }
}

/**
 * Aktifkan tab + lazy load data yang dibutuhkan.
 */
function activateSettingsTab(tabName, tabs, panels) {
    tabs = tabs || document.querySelectorAll('.settings-tab');
    panels = panels || document.querySelectorAll('.settings-panel');

    tabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-settings-tab') === tabName);
    });
    panels.forEach(p => {
        p.classList.toggle('active', p.id === 'setting-' + tabName);
    });

    // Lazy load / refresh data per tab
    if (tabName === 'lab' && typeof loadLabData === 'function') {
        loadLabData();
    }
    if (tabName === 'user' && typeof loadUser === 'function') {
        loadUser();
    }
}