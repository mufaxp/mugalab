document.addEventListener('DOMContentLoaded', async function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core
    await initApp();

    // Load semua dropdown lab — fetch SEKALI, reuse untuk semua
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

    try {
        const labsRes = await apiGet('/api/lab');
        const labsData = Array.isArray(labsRes) ? labsRes : (labsRes.data || []);
        for (const s of labSelects) {
            fillLabOptions(s.id, labsData, s.all);
        }
    } catch (err) {
        console.error('Gagal load labs untuk dropdown:', err);
    }

    // Modules — sequential (hindari kewalahan backend dengan parallel)
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
    if (typeof initManajemenUser === 'function') {
        await initManajemenUser();
    } else {
        console.warn('initManajemenUser tidak ditemukan');
    }
    if (typeof initSetting === 'function') await initSetting();

    console.log('✅ Dashboard siap — semua modul terinisialisasi');
});