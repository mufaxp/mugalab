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

    // Muat data saat ini
    async function loadCurrentSettings() {
        try {
            const res = await apiGet('/api/settings');
            if (Array.isArray(res)) {
                const namaSekolah = res.find(s => s.setting_key === 'nama_sekolah')?.setting_value || '';
                const namaLab = res.find(s => s.setting_key === 'nama_lab')?.setting_value || '';
                inpSekolah.value = namaSekolah;
                inpLab.value = namaLab;
            }
        } catch (err) {
            console.warn('Gagal memuat pengaturan:', err);
        }
    }

    // Simpan perubahan
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

    // Muat saat panel dibuka
    const sidebar = document.querySelector('.sidebar-item[data-panel="setting"]');
    if (sidebar) sidebar.addEventListener('click', loadCurrentSettings);

    // Muat saat modul diinisialisasi
    loadCurrentSettings();
    console.log('✅ Modul Pengaturan Web siap');
}