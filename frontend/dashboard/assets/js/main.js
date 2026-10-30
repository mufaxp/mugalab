document.addEventListener('DOMContentLoaded', async function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core (Sidebar, Tabs, dll)
    await initApp();

    // Set untuk melacak panel mana yang sudah dimuat
    const loadedPanels = new Set();

    // Fungsi Lazy Loading
    async function loadModule(panelId) {
        if (loadedPanels.has(panelId)) return;
        loadedPanels.add(panelId);
        
        console.log(`🚀 Memuat modul: ${panelId}...`);

        try {
            switch (panelId) {
                case 'jadwal':
                    if (typeof initJadwal === 'function') await initJadwal();
                    break;
                case 'inventaris':
                    if (typeof initAlat === 'function') await initAlat();
                    if (typeof initBahan === 'function') await initBahan();
                    if (typeof initSarana === 'function') await initSarana();
                    break;
                case 'laporan':
                    if (typeof initLaporanKerusakan === 'function') await initLaporanKerusakan();
                    break;
                case 'riwayat':
                    if (typeof initRiwayatBahan === 'function') await initRiwayatBahan();
                    break;
                case 'laporan-praktikum':
                    if (typeof initLaprak === 'function') await initLaprak();
                    break;
                case 'pengajuan':
                    if (typeof initPengajuan === 'function') await initPengajuan();
                    break;
                case 'peminjaman':
                    if (typeof initPeminjaman === 'function') await initPeminjaman();
                    break;
                case 'setting':
                    if (typeof initKelolaLab === 'function') await initKelolaLab();
                    if (typeof initManajemenUser === 'function') await initManajemenUser();
                    if (typeof initSetting === 'function') await initSetting();
                    break;
            }
        } catch (err) {
            console.error(`Gagal inisialisasi modul ${panelId}:`, err);
        }
    }

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            if (panelId) loadModule(panelId);
        });
    });

    const activeItem = document.querySelector('.sidebar-item.active');
    const defaultPanel = activeItem ? activeItem.getAttribute('data-panel') : 'jadwal';
    
    await loadModule(defaultPanel);

    console.log('✅ Dashboard siap — Lazy Loading aktif');
});