/**
 * setting.js - Modul Pengaturan Web
 * Hanya untuk admin
 */

async function initSetting() {
    const currentRole = localStorage.getItem('role') || 'guru';
    if (currentRole !== 'admin') {
        console.log('Setting hanya untuk admin');
        return;
    }

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

    const sidebar = document.querySelector('.sidebar-item[data-panel="setting"]');
    if (sidebar) sidebar.addEventListener('click', loadCurrentSettings);

    loadCurrentSettings();
    console.log('✅ Modul Pengaturan Web siap');
}