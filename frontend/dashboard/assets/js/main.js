document.addEventListener('DOMContentLoaded', async function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core
    initApp();

    // Load semua dropdown lab
    const labSelects = [
        { id: 'lab_id', all: false },
        { id: 'labFilterSelect', all: true },
        { id: 'alat_lab', all: false },
        { id: 'bahan_lab', all: false },
        { id: 'sarana_lab', all: false },
        { id: 'laporanLabFilter', all: true },
        { id: 'riwayatLabFilter', all: true },
        { id: 'lpLabFilter', all: true },
        { id: 'lp_lab_id', all: false },
        { id: 'pinjamLabFilter', all: true }
    ];

    for (const s of labSelects) {
        await loadLabOptions(s.id, s.all);
    }

    // Modules
    if (typeof initJadwal === 'function') await initJadwal();
    if (typeof initAlat === 'function') await initAlat();
    if (typeof initBahan === 'function') await initBahan();
    if (typeof initSarana === 'function') await initSarana();
    if (typeof initLaporanKerusakan === 'function') await initLaporanKerusakan();
    if (typeof initRiwayatBahan === 'function') await initRiwayatBahan();
    if (typeof initLaprak === 'function') await initLaprak();
    if (typeof initPengajuan === 'function') await initPengajuan();
    if (typeof initPeminjaman === 'function') await initPeminjaman();
    if (typeof initKelolaLab === 'function') await initKelolaLab();

    console.log('✅ Dashboard siap — semua modul terinisialisasi');
});