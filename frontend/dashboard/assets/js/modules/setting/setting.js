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
                inpSekolah.value = namaSekolah;
                inpLab.value = namaLab;
            }
        } catch (err) {
            console.warn('Gagal memuat pengaturan:', err);
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            nama_sekolah: inpSekolah.value.trim(),
            nama_lab: inpLab.value.trim()
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