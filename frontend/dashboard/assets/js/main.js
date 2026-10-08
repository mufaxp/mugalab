document.addEventListener('DOMContentLoaded', async function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core
    await initApp();

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

    // Modules — jalankan paralel (semua modul independen)
    const moduleInits = [
        { name: 'Jadwal',            fn: typeof initJadwal === 'function' ? initJadwal : null },
        { name: 'Alat',              fn: typeof initAlat === 'function' ? initAlat : null },
        { name: 'Bahan',             fn: typeof initBahan === 'function' ? initBahan : null },
        { name: 'Sarana',            fn: typeof initSarana === 'function' ? initSarana : null },
        { name: 'Laporan Kerusakan', fn: typeof initLaporanKerusakan === 'function' ? initLaporanKerusakan : null },
        { name: 'Riwayat Bahan',     fn: typeof initRiwayatBahan === 'function' ? initRiwayatBahan : null },
        { name: 'Laprak',            fn: typeof initLaprak === 'function' ? initLaprak : null },
        { name: 'Pengajuan',         fn: typeof initPengajuan === 'function' ? initPengajuan : null },
        { name: 'Peminjaman',        fn: typeof initPeminjaman === 'function' ? initPeminjaman : null },
        { name: 'Kelola Lab',        fn: typeof initKelolaLab === 'function' ? initKelolaLab : null },
        { name: 'Manajemen User',    fn: typeof initManajemenUser === 'function' ? initManajemenUser : null },
        { name: 'Setting',           fn: typeof initSetting === 'function' ? initSetting : null }
    ];

    const missingModules = moduleInits.filter(m => !m.fn);
    if (missingModules.length) {
        console.warn('⚠️ Modul tidak ditemukan:', missingModules.map(m => m.name).join(', '));
    }

    await Promise.all(
        moduleInits.filter(m => m.fn).map(m => m.fn())
    );

    console.log('✅ Dashboard siap — semua modul terinisialisasi');
    
});