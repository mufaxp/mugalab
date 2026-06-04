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

    // pop up tambah jadwal
    const btnTambah = document.querySelector('.btn-tambah');
    const modalTambah = document.getElementById('modalTambah');
    const btnBatalTambah = document.getElementById('btnBatalTambah');
    const formTambahJadwal = document.getElementById('formTambahJadwal');

    // buka popup
    if (btnTambah) {
        btnTambah.addEventListener('click', function() {
            modalTambah.style.display = 'flex';
            // Reset form
            formTambahJadwal.reset();
            // Set tanggal default ke hari ini
            document.getElementById('tanggal').valueAsDate = new Date();
        });
    }

    // Tutup pop up (tombol batal)
    if (btnBatalTambah) {
        btnBatalTambah.addEventListener('click', function() {
            modalTambah.style.display = 'none';
        });
    }

    // tutup pop up (klik di luar pop up)
    window.addEventListener('click', function(e) {
        if (e.target === modalTambah) {
            modalTambah.style.display = 'none';
        }
    });
    
    // Submit form tambah jadwal
    if (formTambahJadwal) {
        formTambahJadwal.addEventListener('submit', async function(e) {
            e.preventDefault();

            const penanggung_jawab = document.getElementById('penanggung_jawab').value.trim();
            const kegiatan = document.getElementById('kegiatan').value.trim();
            const kelas = document.getElementById('kelas').value.trim() || '-';
            const tanggal = document.getElementById('tanggal').value;
            const jam_mulai = parseInt(document.getElementById('jam_mulai').value);
            const jam_selesai = parseInt(document.getElementById('jam_selesai').value);

            // Validasi
            if (!penanggung_jawab || !kegiatan || !tanggal || !jam_mulai || !jam_selesai) {
                alert('Semua field wajib diisi!');
                return;
            }

            if (jam_selesai < jam_mulai) {
                alert('Jam selesai harus lebih besar atau sama dengan jam mulai!');
                return;
            }

            try {
                const response = await fetch('/api/jadwal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        penanggung_jawab,
                        kegiatan,
                        kelas,
                        tanggal,
                        jam_mulai,
                        jam_selesai
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Jadwal berhasil ditambahkan!');
                    modalTambah.style.display = 'none';
                    // Refresh daftar jadwal
                    loadDashboardJadwal();
                } else {
                    alert(data.message || 'Gagal menambahkan jadwal');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Gagal terhubung ke server');
            }
        });
    }
    
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
        const pekanIniEl = document.getElementById('jadwalPekanIni');
        const pekanDepanEl = document.getElementById('jadwalPekanDepan');
        
        if (!pekanIniEl || !pekanDepanEl) return;

        try {
            // Hitung Ahad pekan ini
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day;
            const sundayIni = new Date(today);
            sundayIni.setDate(diff);
            const mingguMulaiIni = sundayIni.toISOString().split('T')[0];

            // Hitung Ahad pekan depan
            const sundayDepan = new Date(sundayIni);
            sundayDepan.setDate(sundayIni.getDate() + 7);
            const mingguMulaiDepan = sundayDepan.toISOString().split('T')[0];

            // Fetch kedua pekan sekaligus
            const [resIni, resDepan] = await Promise.all([
                fetch(`/api/jadwal?minggu_mulai=${mingguMulaiIni}`),
                fetch(`/api/jadwal?minggu_mulai=${mingguMulaiDepan}`)
            ]);

            const dataIni = await resIni.json();
            const dataDepan = await resDepan.json();

            // Render pekan ini
            renderJadwalSection(pekanIniEl, dataIni, 'pekan ini');
            
            // Render pekan depan
            renderJadwalSection(pekanDepanEl, dataDepan, 'pekan depan');

        } catch (error) {
            console.error('Gagal memuat jadwal dashboard:', error);
            pekanIniEl.innerHTML = '<p style="color:#c62828; text-align:center; padding:20px;">Gagal memuat data jadwal.</p>';
            pekanDepanEl.innerHTML = '<p style="color:#c62828; text-align:center; padding:20px;">Gagal memuat data jadwal.</p>';
        }
    }

    // fungsi render card per section
    function renderJadwalSection(containerElement, data, label) {
        if (!containerElement) return;

        if (data.length === 0) {
            containerElement.innerHTML = `<p style="color:#999; text-align:center; padding:20px;">Belum ada jadwal untuk ${label}.</p>`;
            return;
        }

        containerElement.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'jadwal-card-item';
            card.setAttribute('data-id', item.id);
            card.innerHTML = `
                <div class="jadwal-card-body">
                    <div class="jadwal-card-kegiatan">${item.kegiatan}</div>
                    <div class="jadwal-card-pj">${item.penanggung_jawab} | ${item.kelas !== '-' ? item.kelas : 'Umum'} | ${formatTanggal(item.tanggal)} | Jam ke-${item.jam_mulai} - ${item.jam_selesai}</div>
                </div>
                <div class="jadwal-card-actions">
                    <button class="btn-edit">Edit</button>
                    <button class="btn-delete" data-id="${item.id}">Hapus</button>
                </div>
            `;

            // Event listener untuk tombol Hapus
            const btnDelete = card.querySelector('.btn-delete');
            btnDelete.addEventListener('click', function() {
                hapusJadwal(item.id, card);
            });

            containerElement.appendChild(card);
        });
    }

    // fungsi hapus jadwal
    async function hapusJadwal(id, cardElement) {
        // konfirmasi
        if(!confirm('Apakah anda yakin ingin menghapus jadwal ini?')) {
            return;
        }

        try {
            const response = await fetch(`/api/jadwal/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                // hapus card dari tampilan
                cardElement.remove();
                alert('Jadwal berhasil dihapus');
            } else {
                alert(data.message || 'Gagal menghapus jadwal');
            }
        } catch (error) {
            console.error('Error', error);
            alert('Gagal terhubung ke server');
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