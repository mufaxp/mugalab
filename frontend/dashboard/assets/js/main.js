/**
 * main.js - Orchestrator Dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core
    initApp();

    // Modules (akan diisi bertahap)
    if (typeof initJadwal === 'function') initJadwal();
    if (typeof initAlat === 'function') initAlat();
    if (typeof initBahan === 'function') initBahan();
    if (typeof initLaporanKerusakan === 'function') initLaporanKerusakan();
    if (typeof initRiwayatBahan === 'function') initRiwayatBahan();
    if (typeof initLaprak === 'function') initLaprak();

    console.log('✅ Dashboard siap - semua modul telah terinisialisasi.');
});