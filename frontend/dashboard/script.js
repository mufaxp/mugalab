document.addEventListener('DOMContentLoaded', function() {
    // proteksi sederhana
    const nama = localStorage.getItem('nama');
    if (!nama) {
        // jika belum login, redirect ke laman login
        window.location.href = '/login';
        return;
    }

    // tampilkan nama di header
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
        userNameDisplay.textContent = nama;
    }

    // navigasi sidebar
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const panels = document.querySelectorAll('.panel');

    // Fungsi untuk mengaktifkan panel berdasarkan ID
    function activatePanel(panelId) {
        // Sembunyikan semua panel
        panels.forEach(panel => panel.classList.remove('active'));
        // Tampilkan panel yang dipilih
        const target = document.getElementById(panelId);
        if (target) target.classList.add('active');
    }

    // Event listener untuk setiap item sidebar
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            // Hapus class active dari semua item
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Tambahkan class active ke item yang diklik
            this.classList.add('active');
            // Dapatkan panel yang sesuai
            const panelId = this.getAttribute('data-panel');
            activatePanel(panelId);
        });
    });

    // Tombol logout (sementara dummy)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // hapus data login dan redirect ke login
            localStorage.removeItem('nama');
            window.location.href = '/login'
        });
    }
});