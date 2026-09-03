/**
 * app.js - Core Application
 * Sidebar navigasi, hamburger menu, tabs, filter role.
 */

function initSidebar() {
    // Ambil role langsung dari localStorage
    const currentRole = localStorage.getItem('role') || 'guru';

    // Aturan akses panel berdasarkan role
    const menuRules = {
        admin: [
            'jadwal',
            'inventaris',
            'laporan',
            'riwayat',
            'laprak',
            'pengajuan',
            'peminjaman',
            'kelola-lab',
            'user'
        ],
        laboran: [
            'jadwal',
            'inventaris',
            'laporan',
            'riwayat',
            'laprak',
            'pengajuan',
            'peminjaman'
        ],
        guru: [
            'jadwal',
            'inventaris',
            'laporan',
            'riwayat',
            'laprak',
            'peminjaman'
        ]
    };

    const allowedPanels = menuRules[currentRole] || menuRules.guru;

    // Debug — lihat di console
    console.log('Role aktif:', currentRole);
    console.log('Panel diizinkan:', allowedPanels);

    // Sembunyikan/tampilkan menu sesuai role
    document.querySelectorAll('.sidebar-item').forEach(item => {
        const panel = item.getAttribute('data-panel');
        if (panel && !allowedPanels.includes(panel)) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });

    // Panel pertama yang diizinkan otomatis aktif
    const panels = document.querySelectorAll('.panel');
    panels.forEach(p => p.classList.remove('active'));

    const firstPanel = allowedPanels[0] || 'inventaris';
    const firstPanelEl = document.getElementById(firstPanel);
    if (firstPanelEl) firstPanelEl.classList.add('active');

    // Menu aktif di sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-panel') === firstPanel) {
            item.classList.add('active');
        }
    });

    // Navigasi sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            panels.forEach(p => p.classList.remove('active'));
            const target = document.getElementById(this.getAttribute('data-panel'));
            if (target) target.classList.add('active');

            if (window.innerWidth <= 640) closeSidebar();
        });
    });
}

function initHamburger() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarNav = document.getElementById('sidebarNav');

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    window.openSidebar = function() {
        if (sidebarNav) sidebarNav.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeSidebar = function() {
        if (sidebarNav) sidebarNav.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            sidebarNav && sidebarNav.classList.contains('active') ? closeSidebar() : openSidebar();
        });
    }

    overlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', function() {
        if (window.innerWidth > 640 && sidebarNav && sidebarNav.classList.contains('active')) {
            closeSidebar();
        }
    });
}

function initTabs() {
    document.querySelectorAll('.inv-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.inv-panel').forEach(p => p.classList.remove('active'));
            const target = document.getElementById(this.getAttribute('data-tab') + 'Panel');
            if (target) target.classList.add('active');
        });
    });
}

function initApp() {
    initSidebar();
    initHamburger();
    initTabs();
    console.log('✅ Core app siap');
}