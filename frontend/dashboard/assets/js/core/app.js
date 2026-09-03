/**
 * app.js - Core Application
 * Sidebar navigasi, hamburger menu, tabs, koordinasi panel.
 */

function initSidebar() {
    const currentRole = localStorage.getItem('role') || 'guru';

    const menuRules = {
        admin: ['jadwal','inventaris','laporan','riwayat','laprak','pengajuan','peminjaman','kelola-lab','user'],
        laboran: ['jadwal','inventaris','laporan','riwayat','laprak','pengajuan','peminjaman'],
        guru: ['jadwal','inventaris','laporan','riwayat','laprak','peminjaman']
    };

    const allowedPanels = menuRules[currentRole] || menuRules.guru;

    // Sembunyikan menu yang tidak diizinkan
    document.querySelectorAll('.sidebar-item').forEach(item => {
        const panel = item.getAttribute('data-panel');
        if (!allowedPanels.includes(panel)) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });

    // Tentukan panel pertama yang boleh diakses
    const panels = document.querySelectorAll('.panel');
    const firstAllowedPanel = allowedPanels[0] || 'inventaris';

    // Sembunyikan semua panel lalu aktifkan panel pertama yang diizinkan
    panels.forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(firstAllowedPanel);
    if (targetPanel) targetPanel.classList.add('active');

    // Tandai menu aktif di sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-panel') === firstAllowedPanel) {
            item.classList.add('active');
        }
    });

    // Navigasi klik
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    window.activatePanel = function(panelId) {
        panels.forEach(p => p.classList.remove('active'));
        const target = document.getElementById(panelId);
        if (target) target.classList.add('active');
    };

    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            activatePanel(this.getAttribute('data-panel'));
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
            sidebarNav?.classList.contains('active') ? closeSidebar() : openSidebar();
        });
    }

    overlay.addEventListener('click', closeSidebar);

    window.addEventListener('resize', function() {
        if (window.innerWidth > 640 && sidebarNav?.classList.contains('active')) {
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
            document.getElementById(this.getAttribute('data-tab') + 'Panel').classList.add('active');
        });
    });
}

function initInvLabFilter() {
    const invLabFilter = document.getElementById('invLabFilter');
    if (!invLabFilter) return;

    invLabFilter.addEventListener('change', function() {
        if (typeof loadAlat === 'function') loadAlat();
        if (typeof loadBahan === 'function') loadBahan();
        if (typeof loadSarana === 'function') loadSarana();
    });
}

function initApp() {
    initSidebar();
    initHamburger();
    initTabs();
    initInvLabFilter();
    console.log('✅ Core app siap');
}