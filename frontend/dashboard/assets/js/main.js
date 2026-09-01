/**
 * main.js - Orchestrator Dashboard
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core
    initApp();

    await loadLabOptions('lab_id');
    await loadLabOptions('labFilterSelect', true);
    await loadLabOptions('alat_lab');
    await loadLabOptions('bahan_lab');
    await loadLabOptions('sarana_lab');
    await loadLabOptions('laporanLabFilter', true);
    await loadLabOptions('riwayatLabFilter', true);
    await loadLabOptions('lpLabFilter', true);
    await loadLabOptions('pinjamLabFilter', true);

    // Modules (akan diisi bertahap)
    if (typeof initJadwal === 'function') initJadwal();
    if (typeof initAlat === 'function') initAlat();
    if (typeof initBahan === 'function') initBahan();
    if (typeof initLaporanKerusakan === 'function') initLaporanKerusakan();
    if (typeof initRiwayatBahan === 'function') initRiwayatBahan();
    if (typeof initLaprak === 'function') initLaprak();
    if (typeof initPengajuan === 'function') initPengajuan();
    if (typeof initSarana === 'function') initSarana();
    if (typeof initPeminjaman === 'function') initPeminjaman();
    if (typeof initKelolaLab === 'function') initKelolaLab();

    console.log('✅ Dashboard siap - semua modul telah terinisialisasi.');
});