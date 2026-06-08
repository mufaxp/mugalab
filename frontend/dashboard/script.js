document.addEventListener('DOMContentLoaded', function() {
    // keamanan login sederhana
    const nama = localStorage.getItem('nama');
    if (!nama) {
        window.location.href = '/login';
        return;
    }

    // Tampilkan nama di header
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
        userNameDisplay.textContent = nama;
    }

    // variabel penting
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const panels = document.querySelectorAll('.panel');
    const btnTambah = document.querySelector('.btn-tambah');
    const modalTambah = document.getElementById('modalTambah');
    const btnBatalTambah = document.getElementById('btnBatalTambah');
    const formTambahJadwal = document.getElementById('formTambahJadwal');
    const logoutBtn = document.getElementById('logoutBtn');
    let editMode = false;
    let editId = null;

    // sidebar hamburger
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarNav = document.getElementById('sidebarNav');

    // Buat overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Fungsi buka sidebar
    function openSidebar() {
        if (sidebarNav) sidebarNav.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Fungsi tutup sidebar
    function closeSidebar() {
        if (sidebarNav) sidebarNav.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event: Klik hamburger
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            if (sidebarNav && sidebarNav.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Event: Klik overlay
    overlay.addEventListener('click', closeSidebar);

    // navigasi sidebar
    function activatePanel(panelId) {
        panels.forEach(panel => panel.classList.remove('active'));
        const target = document.getElementById(panelId);
        if (target) target.classList.add('active');
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            // Hapus active dari semua item
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Tambahkan active ke item yang diklik
            this.classList.add('active');
            // Aktifkan panel
            const panelId = this.getAttribute('data-panel');
            activatePanel(panelId);
            // Tutup sidebar di mobile
            if (window.innerWidth <= 640) {
                closeSidebar();
            }
        });
    });

    // Tutup sidebar saat resize ke desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 640 && sidebarNav && sidebarNav.classList.contains('active')) {
            closeSidebar();
        }
    });

    // popup tambah jadwal
    if (btnTambah) {
        btnTambah.addEventListener('click', function() {
            editMode = false;
            editId = null;
            document.querySelector('.modal-title').textContent = 'Tambah Jadwal Baru';
            document.querySelector('.btn-simpan').textContent = 'Simpan';
            modalTambah.style.display = 'flex';
            formTambahJadwal.reset();
            document.getElementById('tanggal').valueAsDate = new Date();
        });
    }

    if (btnBatalTambah) {
        btnBatalTambah.addEventListener('click', function() {
            modalTambah.style.display = 'none';
        });
    }

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

            if (!penanggung_jawab || !kegiatan || !tanggal || !jam_mulai || !jam_selesai) {
                alert('Semua field wajib diisi!');
                return;
            }

            if (jam_selesai < jam_mulai) {
                alert('Jam selesai harus >= jam mulai!');
                return;
            }

            // try {
            //     const response = await fetch('/api/jadwal', {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai })
            //     });

            //     const data = await response.json();

            //     if (response.ok) {
            //         alert('Jadwal berhasil ditambahkan!');
            //         modalTambah.style.display = 'none';
            //         loadDashboardJadwal();
            //     } else {
            //         alert(data.message || 'Gagal menambahkan jadwal');
            //     }
            // } catch (error) {
            //     console.error('Error:', error);
            //     alert('Gagal terhubung ke server');
            // }
            try {
                const url = editMode ? `/api/jadwal/${editId}` : '/api/jadwal';
                const method = editMode ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(editMode ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!');
                    modalTambah.style.display = 'none';
                    editMode = false;
                    editId = null;
                    loadDashboardJadwal();
                } else {
                    alert(data.message || 'Gagal menyimpan jadwal');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Gagal terhubung ke server');
            }
        });
    }

    // fungsi buka popup untuk edit
    function openEditModal(item) {
        editMode = true;
        editId = item.id;
        document.querySelector('.modal-title').textContent = 'Edit Jadwal';
        document.querySelector('.btn-simpan').textContent = 'Update';
        
        document.getElementById('penanggung_jawab').value = item.penanggung_jawab;
        document.getElementById('kegiatan').value = item.kegiatan;
        document.getElementById('kelas').value = item.kelas === '-' ? '' : item.kelas;
        document.getElementById('tanggal').value = item.tanggal;
        document.getElementById('jam_mulai').value = item.jam_mulai;
        document.getElementById('jam_selesai').value = item.jam_selesai;
        
        modalTambah.style.display = 'flex';
    }

    // load dashboard jadwal
    async function loadDashboardJadwal() {
        const pekanIniEl = document.getElementById('jadwalPekanIni');
        const pekanDepanEl = document.getElementById('jadwalPekanDepan');
        
        if (!pekanIniEl || !pekanDepanEl) return;

        try {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day;
            const sundayIni = new Date(today);
            sundayIni.setDate(diff);
            const mingguMulaiIni = sundayIni.toISOString().split('T')[0];

            const sundayDepan = new Date(sundayIni);
            sundayDepan.setDate(sundayIni.getDate() + 7);
            const mingguMulaiDepan = sundayDepan.toISOString().split('T')[0];

            const [resIni, resDepan] = await Promise.all([
                fetch(`/api/jadwal?minggu_mulai=${mingguMulaiIni}`),
                fetch(`/api/jadwal?minggu_mulai=${mingguMulaiDepan}`)
            ]);

            const dataIni = await resIni.json();
            const dataDepan = await resDepan.json();

            renderJadwalSection(pekanIniEl, dataIni, 'pekan ini');
            renderJadwalSection(pekanDepanEl, dataDepan, 'pekan depan');
        } catch (error) {
            console.error('Gagal memuat jadwal:', error);
            pekanIniEl.innerHTML = '<p style="color:#c62828; text-align:center; padding:20px;">Gagal memuat data.</p>';
            pekanDepanEl.innerHTML = '<p style="color:#c62828; text-align:center; padding:20px;">Gagal memuat data.</p>';
        }
    }

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

            const btnDelete = card.querySelector('.btn-delete');
            btnDelete.addEventListener('click', function() {
                hapusJadwal(item.id, card);
            });

            // Event listener untuk tombol Edit
            const btnEdit = card.querySelector('.btn-edit');
            btnEdit.addEventListener('click', function() {
                openEditModal(item);
            });
            containerElement.appendChild(card);
        });
    }

    async function hapusJadwal(id, cardElement) {
        if (!confirm('Apakah anda yakin ingin menghapus jadwal ini?')) return;

        try {
            const response = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
            const data = await response.json();

            if (response.ok) {
                cardElement.remove();
                alert('Jadwal berhasil dihapus');
            } else {
                alert(data.message || 'Gagal menghapus jadwal');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal terhubung ke server');
        }
    }

    function formatTanggal(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    loadDashboardJadwal();

//  tombol logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('nama');
            window.location.href = '/login';
        });
    }
});