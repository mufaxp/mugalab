document.addEventListener('DOMContentLoaded', async function() {
    // Auth
    if (!checkAuth()) return;
    displayNama();
    initLogoutButton();

    // Core
    initApp();

    function applyRoleBasedUI() {
        const role = localStorage.getItem('role') || 'guru';

        const menuRules = {
            admin: ['jadwal','inventaris','laporan','riwayat','laporan-praktikum','pengajuan','peminjaman','kelola-lab','user'],
            laboran: ['jadwal','inventaris','laporan','riwayat','laporan-praktikum','pengajuan','peminjaman'],
            guru: ['jadwal','inventaris','laporan','riwayat','laporan-praktikum','peminjaman']
        };

        const allowed = menuRules[role] || menuRules.guru;
        console.log('applyRoleBasedUI - role:', role, 'allowed:', allowed);

        // Sembunyikan menu yang tidak diizinkan
        document.querySelectorAll('.sidebar-item').forEach(item => {
            const panel = item.getAttribute('data-panel');
            if (panel && !allowed.includes(panel)) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });

        // Aktifkan panel pertama yang diizinkan
        const panels = document.querySelectorAll('.panel');
        panels.forEach(p => p.classList.remove('active'));

        const firstPanel = document.getElementById(allowed[0]);
        if (firstPanel) firstPanel.classList.add('active');

        // Tandai item sidebar aktif
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-panel') === allowed[0]) {
                item.classList.add('active');
            }
        });
    }

    applyRoleBasedUI();

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
    if (typeof initManajemenUser === 'function') {
        await initManajemenUser();
    } else {
        console.warn('initManajemenUser tidak ditemukan');
    }

    console.log('✅ Dashboard siap — semua modul terinisialisasi');
});