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

    async function loadDashboardJadwal() {
        const jadwalListElement = document.getElementById('jadwalList');
        if (!jadwalListElement) return;

        try {
            // ambil tanggal ahad pekan ini
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() -day;
            const sunday = new Date(today);
            sunday.setDate(diff);
            const mingguMulai = sunday.toISOString().split('T')[0];

            const response = await fetch(`/api/jadwal?minggu_mulai=${mingguMulai}`);
            const data = await response.json();

            if (data.length === 0) {
                jadwalListElement.innerHTML = '<p style="color:#999; text-align:center: padding:20px;">Belum ada jadwal untuk pekan ini.</p>';
                return;
            }

            // render card
            jadwalListElement.innerHTML = '';
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'jadwal-card-item';
                card.innerHTML = `
                    <div class='jadwal-card-body';
                        <div class="jadwal-card-kegiatan">${item.kegiatan}</div>
                        <div class="jadwal-card-pj">${item.penanggung_jawab} | ${item.kelas !== '-' ? item.kelas : 'Umum'} | $${formatTanggal(item.tanggal)} | Jam ke-${item.jam_mulai} - ${item.jam_selesai}</div>
                    </div>
                    <div class="jadwal-card-actions">
                        <button class="btn-edit">Edit</button>
                        <button class="btn-delete">Hapus</button>
                    </div>
                `;
                jadwalListElement.appendChild(card);
            });
        } catch (error) {
            console.error('Gagal memuat jadwal dashboard:', error);
            jadwalListElement.innerHTML = '<p style="color:#c62828; text-align: center; padding:20px">Gagal memuat data jadwal.</p>';
        }
    }

    // helper untuk format tanggal
    function formatTanggal(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    loadDashboardJadwal();
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