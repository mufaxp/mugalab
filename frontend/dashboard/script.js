document.addEventListener('DOMContentLoaded', function() {
    // keamanan login sederhana
    const token = localStorage.getItem('token');
    const nama = localStorage.getItem('nama');
    if (!token || !nama) {
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
    const labFilterSelect = document.getElementById('labFilterSelect');

    function getCurrentLabFilter() {
        if (!labFilterSelect) return null;
        const value = labFilterSelect.value;
        if (value === 'all') return null;
        return parseInt(value);
    }
    // filter lab
    if (labFilterSelect) {
        labFilterSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue === 'all') {
                loadDashboardJadwal(); // semua lab
            } else {
                loadDashboardJadwal(parseInt(selectedValue)); // lab tertentu
            }
        })
    }

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

    // Submit form tambah/edit jadwal
    if (formTambahJadwal) {
        formTambahJadwal.addEventListener('submit', async function(e) {
            e.preventDefault();

            const lab_id = parseInt(document.getElementById('lab_id').value);
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

            try {
                const url = editMode ? `/api/jadwal/${editId}` : '/api/jadwal';
                const method = editMode ? 'PUT' : 'POST';

                const token = localStorage.getItem('token');
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ lab_id, penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(editMode ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!');
                    modalTambah.style.display = 'none';
                    editMode = false;
                    editId = null;
                    loadDashboardJadwal(getCurrentLabFilter());
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
        document.getElementById('tanggal').value = item.tanggal ? item.tanggal.substring(0, 10) : '';
        document.getElementById('jam_mulai').value = item.jam_mulai;
        document.getElementById('jam_selesai').value = item.jam_selesai;
        document.getElementById('lab_id').value = item.lab_id || 1;
        
        modalTambah.style.display = 'flex';
    }

    // load dashboard jadwal
    async function loadDashboardJadwal(labId = null) {
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

        // Buat URL dengan parameter lab_id
        let urlIni = `/api/jadwal?minggu_mulai=${mingguMulaiIni}`;
        let urlDepan = `/api/jadwal?minggu_mulai=${mingguMulaiDepan}`;
        
        if (labId) {
            urlIni += `&lab_id=${labId}`;
            urlDepan += `&lab_id=${labId}`;
        }

        const token = localStorage.getItem('token');
        const [resIni, resDepan] = await Promise.all([
            fetch(urlIni, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(urlDepan, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
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

    // fungsi hapus jadwal
    async function hapusJadwal(id, cardElement) {
         if (!confirm('Apakah anda yakin ingin menghapus jadwal ini?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/jadwal/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
            const data = await response.json();

            if (response.ok) {
                cardElement.remove();
                alert('Jadwal berhasil dihapus');
                loadDashboardJadwal(getCurrentLabFilter());
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

    // tab inventaris
    const invTabs = document.querySelectorAll('.inv-tab');
    const invPanels = document.querySelectorAll('.inv-panel');

    invTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            invTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const target = this.getAttribute('data-tab');
            invPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(target + 'Panel').classList.add('active');
        });
    });
    
    // variabel inventaris
    let alatEditMode = false;
    let alatEditId = null;
    let bahanEditMode = false;
    let bahanEditId = null;
    const invLabFilter = document.getElementById('invLabFilter');

    // filter lab berubah
    if (invLabFilter) {
        invLabFilter.addEventListener('change', function() {
            loadAlat();
            loadBahan();
        });
    }

    function getInvLabFilter() {
        if (!invLabFilter) return null;
        const val = invLabFilter.value;
        return val === 'all' ? null : parseInt(val);
    }

    // load dan render alat
    async function loadAlat() {
        const container = document.getElementById('alatList');
        if (!container) return;
        
        try {
            const token = localStorage.getItem('token');
            let url = '/api/alat';
            const labId = getInvLabFilter();
            if (labId) url += `?lab_id=${labId}`;
            
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            renderAlat(data);
        } catch (error) {
            container.innerHTML = '<p style="color:#c62828; text-align:center;">Gagal memuat data alat.</p>';
        }
    }

    function renderAlat(data) {
        const container = document.getElementById('alatList');
        if (data.length === 0) {
            container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Belum ada data alat.</p>';
            return;
        }
        
        let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f0f7f2;">
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kode</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Nama Alat</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Produsen</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Jumlah</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kondisi</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Aksi</th>
                </tr>
            </thead>
            <tbody>`;
        
        data.forEach(item => {
            const kondisiEmoji = item.kondisi === 'baik' ? '✅' : item.kondisi === 'rusak' ? '🔴' : '🟡';
            html += `<tr>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.kode_alat}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.nama_alat}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.produsen}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">
                    ${item.jumlah} total<br>
                    <span style="color:#c62828; font-size:11px;">${item.jumlah_rusak || 0} rusak</span>
                </td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${kondisiEmoji} ${item.kondisi}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">
                    <button class="btn-edit" data-edit-alat="${item.id}">Edit</button>
                    <button class="btn-delete" data-hapus-alat="${item.id}">Hapus</button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        // Event listener untuk tombol Edit & Hapus Alat
        container.querySelectorAll('.btn-edit[data-edit-alat]').forEach(btn => {
            btn.addEventListener('click', function() {
                editAlat(parseInt(this.getAttribute('data-edit-alat')));
            });
        });
        container.querySelectorAll('.btn-delete[data-hapus-alat]').forEach(btn => {
            btn.addEventListener('click', function() {
                hapusAlat(parseInt(this.getAttribute('data-hapus-alat')));
            });
        });
    }

    // CRUD alat
    document.getElementById('btnTambahAlat').addEventListener('click', function() {
        alatEditMode = false;
        alatEditId = null;
        document.getElementById('modalAlatTitle').textContent = 'Tambah Alat';
        document.getElementById('formAlat').reset();
        document.getElementById('modalAlat').style.display = 'flex';
    });

    document.getElementById('formAlat').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_alat: document.getElementById('alat_kode').value,
            nama_alat: document.getElementById('alat_nama').value,
            produsen: document.getElementById('alat_produsen').value || '-',
            jumlah: parseInt(document.getElementById('alat_jumlah').value),
            jumlah_rusak: parseInt(document.getElementById('alat_jumlah_rusak').value) || 0,
            kondisi: document.getElementById('alat_kondisi').value,
            lab_id: parseInt(document.getElementById('alat_lab').value),
            keterangan: document.getElementById('alat_keterangan').value
        };
        
        const url = alatEditMode ? `/api/alat/${alatEditId}` : '/api/alat';
        const method = alatEditMode ? 'PUT' : 'POST';
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                document.getElementById('modalAlat').style.display = 'none';
                loadAlat();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Gagal terhubung ke server');
        }
    });

    async function editAlat(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/alat?lab_id=${getInvLabFilter() || ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const item = data.find(a => a.id === id);
        if (!item) return;
        
        alatEditMode = true;
        alatEditId = id;
        document.getElementById('modalAlatTitle').textContent = 'Edit Alat';
        document.getElementById('alat_kode').value = item.kode_alat;
        document.getElementById('alat_nama').value = item.nama_alat;
        document.getElementById('alat_produsen').value = item.produsen;
        document.getElementById('alat_jumlah').value = item.jumlah;
        document.getElementById('alat_jumlah_rusak').value = item.jumlah_rusak || 0;
        document.getElementById('alat_kondisi').value = item.kondisi || 'baik';
        document.getElementById('alat_lab').value = item.lab_id;
        document.getElementById('alat_keterangan').value = item.keterangan || '';
        document.getElementById('modalAlat').style.display = 'flex';
    }

    async function hapusAlat(id) {
        if (!confirm('Yakin hapus alat ini?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/alat/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        alert(data.message);
        loadAlat();
    }

    // load dan render bahan
    async function loadBahan() {
        const container = document.getElementById('bahanList');
        if (!container) return;
        
        try {
            const token = localStorage.getItem('token');
            let url = '/api/bahan';
            const labId = getInvLabFilter();
            if (labId) url += `?lab_id=${labId}`;
            
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            renderBahan(data);
        } catch (error) {
            container.innerHTML = '<p style="color:#c62828; text-align:center;">Gagal memuat data bahan.</p>';
        }
    }

    function renderBahan(data) {
        const container = document.getElementById('bahanList');
        if (data.length === 0) {
            container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Belum ada data bahan.</p>';
            return;
        }
        
        let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f0f7f2;">
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kode</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Nama Bahan</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Produsen</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Stok</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Satuan</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kadaluarsa</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Aksi</th>
                </tr>
            </thead>
            <tbody>`;
        
        data.forEach(item => {
            const tgl = item.tanggal_kadaluarsa ? item.tanggal_kadaluarsa.substring(0, 10) : '-';
            html += `<tr>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.kode_bahan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.nama_bahan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.produsen}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.jumlah}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.satuan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${tgl}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">
                    <button class="btn-edit" data-edit-bahan="${item.id}">Edit</button>
                    <button class="btn-delete" data-hapus-bahan="${item.id}">Hapus</button>
                    <button class="btn-pakai" data-pakai-bahan='${JSON.stringify({id: item.id, nama: item.nama_bahan, stok: item.jumlah, satuan: item.satuan})}'>Pakai</button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        // Event listener untuk tombol Edit & Hapus Bahan
        container.querySelectorAll('.btn-edit[data-edit-bahan]').forEach(btn => {
            btn.addEventListener('click', function() {
                editBahan(parseInt(this.getAttribute('data-edit-bahan')));
            });
        });
        container.querySelectorAll('.btn-delete[data-hapus-bahan]').forEach(btn => {
            btn.addEventListener('click', function() {
                hapusBahan(parseInt(this.getAttribute('data-hapus-bahan')));
            });
        });
        // Event listener untuk tombol Pakai
        container.querySelectorAll('.btn-pakai[data-pakai-bahan]').forEach(btn => {
            btn.addEventListener('click', function() {
                const data = JSON.parse(this.getAttribute('data-pakai-bahan'));
                bukaModalPakai(data.id, data.nama, data.stok, data.satuan);
            });
        });
    }

    // CRUD bahan
    document.getElementById('btnTambahBahan').addEventListener('click', function() {
        bahanEditMode = false;
        bahanEditId = null;
        document.getElementById('modalBahanTitle').textContent = 'Tambah Bahan';
        document.getElementById('formBahan').reset();
        document.getElementById('modalBahan').style.display = 'flex';
    });

    document.getElementById('formBahan').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            kode_bahan: document.getElementById('bahan_kode').value,
            nama_bahan: document.getElementById('bahan_nama').value,
            produsen: document.getElementById('bahan_produsen').value || '-',
            jumlah: parseFloat(document.getElementById('bahan_jumlah').value),
            satuan: document.getElementById('bahan_satuan').value,
            tanggal_kadaluarsa: document.getElementById('bahan_kadaluarsa').value || null,
            lab_id: parseInt(document.getElementById('bahan_lab').value),
            keterangan: document.getElementById('bahan_keterangan').value
        };
        
        const url = bahanEditMode ? `/api/bahan/${bahanEditId}` : '/api/bahan';
        const method = bahanEditMode ? 'PUT' : 'POST';
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                document.getElementById('modalBahan').style.display = 'none';
                loadBahan();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Gagal terhubung ke server');
        }
    });

    async function editBahan(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/bahan?lab_id=${getInvLabFilter() || ''}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const item = data.find(b => b.id === id);
        if (!item) return;
        
        bahanEditMode = true;
        bahanEditId = id;
        document.getElementById('modalBahanTitle').textContent = 'Edit Bahan';
        document.getElementById('bahan_kode').value = item.kode_bahan;
        document.getElementById('bahan_nama').value = item.nama_bahan;
        document.getElementById('bahan_produsen').value = item.produsen;
        document.getElementById('bahan_jumlah').value = item.jumlah;
        document.getElementById('bahan_satuan').value = item.satuan;
        document.getElementById('bahan_kadaluarsa').value = item.tanggal_kadaluarsa ? item.tanggal_kadaluarsa.substring(0, 10) : '';
        document.getElementById('bahan_lab').value = item.lab_id;
        document.getElementById('bahan_keterangan').value = item.keterangan || '';
        document.getElementById('modalBahan').style.display = 'flex';
    }

    async function hapusBahan(id) {
        if (!confirm('Yakin hapus bahan ini?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/bahan/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        alert(data.message);
        loadBahan();
    }

    // pakai bahan
    function bukaModalPakai(id, nama, stok, satuan) {
        document.getElementById('pakai_bahan_id').value = id;
        document.getElementById('pakai_stok').textContent = `${stok} ${satuan}`;
        document.getElementById('formPakai').reset();
        document.getElementById('pakai_tanggal').valueAsDate = new Date();
        document.getElementById('modalPakai').style.display = 'flex';
    }

    document.getElementById('formPakai').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
            bahan_id: parseInt(document.getElementById('pakai_bahan_id').value),
            jumlah_digunakan: parseFloat(document.getElementById('pakai_jumlah').value),
            penanggung_jawab: document.getElementById('pakai_pj').value,
            kelas: document.getElementById('pakai_kelas').value || '-',
            kegiatan: document.getElementById('pakai_kegiatan').value,
            tanggal: document.getElementById('pakai_tanggal').value
        };
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/bahan/pakai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            alert(data.message);
            if (res.ok) {
                document.getElementById('modalPakai').style.display = 'none';
                loadBahan();
            }
        } catch (error) {
            alert('Gagal terhubung ke server');
        }
    });

    // search inventaris
    let allAlatData = [];
    let allBahanData = [];

    // Override loadAlat untuk menyimpan data mentah
    const originalLoadAlat = loadAlat;
    loadAlat = async function() {
        const container = document.getElementById('alatList');
        if (!container) return;
        try {
            const token = localStorage.getItem('token');
            let url = '/api/alat';
            const labId = getInvLabFilter();
            if (labId) url += `?lab_id=${labId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            allAlatData = await res.json();
            renderAlat(allAlatData);
        } catch (error) {
            container.innerHTML = '<p style="color:#c62828;">Gagal memuat data alat.</p>';
        }
    };

    // Override loadBahan untuk menyimpan data mentah
    const originalLoadBahan = loadBahan;
    loadBahan = async function() {
        const container = document.getElementById('bahanList');
        if (!container) return;
        try {
            const token = localStorage.getItem('token');
            let url = '/api/bahan';
            const labId = getInvLabFilter();
            if (labId) url += `?lab_id=${labId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            allBahanData = await res.json();
            renderBahan(allBahanData);
        } catch (error) {
            container.innerHTML = '<p style="color:#c62828;">Gagal memuat data bahan.</p>';
        }
    };

    // Search Alat
    const searchAlat = document.getElementById('searchAlat');
    const suggestAlat = document.getElementById('suggestAlat');

    searchAlat.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        if (!keyword) {
            suggestAlat.classList.remove('active');
            renderAlat(allAlatData);
            return;
        }
        const filtered = allAlatData.filter(item => 
            item.nama_alat.toLowerCase().includes(keyword) || 
            item.kode_alat.toLowerCase().includes(keyword)
        );
        suggestAlat.innerHTML = filtered.map(item => 
            `<div class="search-suggest-item" data-id="${item.id}">${item.kode_alat} - ${item.nama_alat}</div>`
        ).join('');
        suggestAlat.classList.add('active');
    });

    suggestAlat.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            const id = parseInt(item.getAttribute('data-id'));
            const selected = allAlatData.filter(a => a.id === id);
            renderAlat(selected);
            suggestAlat.classList.remove('active');
            searchAlat.value = selected[0].nama_alat;
        }
    });

    // Sembunyikan suggestion saat klik di luar
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper')) {
            suggestAlat.classList.remove('active');
        }
    });

    // Search Bahan
    const searchBahan = document.getElementById('searchBahan');
    const suggestBahan = document.getElementById('suggestBahan');

    searchBahan.addEventListener('input', function() {
        const keyword = this.value.toLowerCase().trim();
        if (!keyword) {
            suggestBahan.classList.remove('active');
            renderBahan(allBahanData);
            return;
        }
        const filtered = allBahanData.filter(item => 
            item.nama_bahan.toLowerCase().includes(keyword) || 
            item.kode_bahan.toLowerCase().includes(keyword)
        );
        suggestBahan.innerHTML = filtered.map(item => 
            `<div class="search-suggest-item" data-id="${item.id}">${item.kode_bahan} - ${item.nama_bahan}</div>`
        ).join('');
        suggestBahan.classList.add('active');
    });

    suggestBahan.addEventListener('click', function(e) {
        const item = e.target.closest('.search-suggest-item');
        if (item) {
            const id = parseInt(item.getAttribute('data-id'));
            const selected = allBahanData.filter(b => b.id === id);
            renderBahan(selected);
            suggestBahan.classList.remove('active');
            searchBahan.value = selected[0].nama_bahan;
        }
    });

    // Sembunyikan suggestion bahan saat klik di luar
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#bahanPanel .search-wrapper')) {
            suggestBahan.classList.remove('active');
        }
    });
    
    loadAlat();
    loadBahan();

    // search alat untuk laporan kerusakan alat
    const laporanAlatSearch = document.getElementById('laporan_alat_search');
    const laporanAlatHidden = document.getElementById('laporan_alat');
    const suggestLaporanAlat = document.getElementById('suggestLaporanAlat');

    if (laporanAlatSearch) {
        laporanAlatSearch.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            const data = window._laporanAlatList || [];
            
            if (!keyword) {
                suggestLaporanAlat.classList.remove('active');
                laporanAlatHidden.value = '';
                return;
            }
            
            const filtered = data.filter(item => 
                item.nama_alat.toLowerCase().includes(keyword) || 
                item.kode_alat.toLowerCase().includes(keyword)
            );
            
            suggestLaporanAlat.innerHTML = filtered.map(item => 
                `<div class="search-suggest-item" data-id="${item.id}" data-nama="${item.nama_alat}" data-kode="${item.kode_alat}" data-stok="${item.jumlah}">
                    ${item.kode_alat} - ${item.nama_alat} (Stok: ${item.jumlah})
                </div>`
            ).join('');
            
            suggestLaporanAlat.classList.add('active');
        });

        suggestLaporanAlat.addEventListener('click', function(e) {
            const item = e.target.closest('.search-suggest-item');
            if (item) {
                const id = item.getAttribute('data-id');
                const nama = item.getAttribute('data-nama');
                const kode = item.getAttribute('data-kode');
                const stok = item.getAttribute('data-stok');
                
                laporanAlatHidden.value = id;
                laporanAlatSearch.value = `${kode} - ${nama} (Stok: ${stok})`;
                suggestLaporanAlat.classList.remove('active');
            }
        });

        // Sembunyikan suggestion saat klik di luar
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#modalLaporan .search-wrapper')) {
                suggestLaporanAlat.classList.remove('active');
            }
        });
    }
    
    // laporan kerusakan
    const laporanLabFilter = document.getElementById('laporanLabFilter');

    if (laporanLabFilter) {
        laporanLabFilter.addEventListener('change', loadLaporan);
    }

    function getLaporanLabFilter() {
        if (!laporanLabFilter) return null;
        const val = laporanLabFilter.value;
        return val === 'all' ? null : parseInt(val);
    }

    // Load laporan
    async function loadLaporan() {
        const container = document.getElementById('laporanList');
        if (!container) return;

        try {
            const token = localStorage.getItem('token');
            let url = '/api/laporan-kerusakan';
            const labId = getLaporanLabFilter();
            if (labId) url += `?lab_id=${labId}`;

            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            renderLaporan(data);
        } catch (error) {
            container.innerHTML = '<p style="color:#c62828; text-align:center;">Gagal memuat data laporan.</p>';
        }
    }

    function renderLaporan(data) {
        const container = document.getElementById('laporanList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Belum ada laporan kerusakan.</p>';
            return;
        }

        const statusLabel = {
            'rusak': '🔴 Rusak',
            'diperbaiki': '🟡 Diperbaiki',
            'selesai': '🟢 Selesai',
            'dibuang': '⚫ Dibuang'
        };

        let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f0f7f2;">
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kode</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Nama Alat</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Jml Rusak</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Pelapor</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Tgl Lapor</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Status</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Aksi</th>
                </tr>
            </thead>
            <tbody>`;

        data.forEach(item => {
            const tgl = item.tanggal_lapor ? item.tanggal_lapor.substring(0, 10) : '-';
            const status = item.status;
            
            // Tombol berdasarkan status
            let tombol = '';
            if (status === 'rusak') {
                tombol = `
                    <button class="btn-edit btn-xs" data-action="perbaiki" data-id="${item.id}">Perbaiki</button>
                    <button class="btn-pakai btn-xs" data-action="selesai" data-id="${item.id}">Selesai</button>
                    <button class="btn-delete btn-xs" data-action="buang" data-id="${item.id}">Buang</button>
                    <button class="btn-delete btn-xs" data-action="hapus" data-id="${item.id}">Hapus</button>
                `;
            } else if (status === 'diperbaiki') {
                tombol = `
                    <button class="btn-pakai btn-xs" data-action="selesai" data-id="${item.id}">Selesai</button>
                    <button class="btn-delete btn-xs" data-action="buang" data-id="${item.id}">Buang</button>
                    <button class="btn-delete btn-xs" data-action="hapus" data-id="${item.id}">Hapus</button>
                `;
            } else {
                tombol = `
                    <button class="btn-delete btn-xs" data-action="hapus" data-id="${item.id}">Hapus</button>
                `;
            }

            html += `<tr>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.kode_alat}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.nama_alat}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.jumlah_rusak}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.pelapor}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${tgl}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${statusLabel[status] || status}</td>
                <td style="padding:8px; border:1px solid #d0e6d5; white-space:nowrap;">${tombol}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Event listener untuk semua tombol aksi
        container.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const id = parseInt(this.getAttribute('data-id'));
                handleLaporanAction(action, id);
            });
        });
    }

    // Handle aksi laporan
    async function handleLaporanAction(action, id) {
        if (action === 'hapus') {
            if (!confirm('Yakin hapus laporan ini?')) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/laporan-kerusakan/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                alert(data.message);
                loadLaporan();
                loadAlat(); // Refresh stok alat
            } catch (error) {
                alert('Gagal terhubung ke server');
            }
            return;
        }

        // Update status
        const statusMap = {
            'perbaiki': 'diperbaiki',
            'selesai': 'selesai',
            'buang': 'dibuang'
        };

        const newStatus = statusMap[action];
        if (!newStatus) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/laporan-kerusakan/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            alert(data.message);
            loadLaporan();
            loadAlat(); // Refresh stok alat
        } catch (error) {
            alert('Gagal terhubung ke server');
        }
    }

    // Buka modal lapor
    document.getElementById('btnTambahLaporan').addEventListener('click', async function() {
        // Reset form
        document.getElementById('formLaporan').reset();
        document.getElementById('laporan_alat').value = '';
        document.getElementById('laporan_alat_search').value = '';
        document.getElementById('suggestLaporanAlat').innerHTML = '';
        document.getElementById('laporan_tanggal').valueAsDate = new Date();
        document.getElementById('modalLaporan').style.display = 'flex';
        
        // Load data alat untuk search
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/alat', { headers: { 'Authorization': `Bearer ${token}` } });
            window._laporanAlatList = await res.json();
        } catch (error) {
            window._laporanAlatList = [];
        }
    });

    // Submit form laporan
    document.getElementById('formLaporan').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const body = {
            alat_id: parseInt(document.getElementById('laporan_alat').value),
            jumlah_rusak: parseInt(document.getElementById('laporan_jumlah').value),
            pelapor: document.getElementById('laporan_pelapor').value,
            tanggal_lapor: document.getElementById('laporan_tanggal').value,
            keterangan: document.getElementById('laporan_keterangan').value
        };
        
        if (!body.alat_id || !body.jumlah_rusak || !body.pelapor || !body.tanggal_lapor || !document.getElementById('laporan_alat_search').value) {
            alert('Semua field wajib diisi!');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/laporan-kerusakan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            alert(data.message);
            if (res.ok) {
                document.getElementById('modalLaporan').style.display = 'none';
                loadLaporan();
                loadAlat();
            }
        } catch (error) {
            alert('Gagal terhubung ke server');
        }
    });

    // Load laporan saat panel dibuka (via sidebar klik)
    const laporanSidebar = document.querySelector('.sidebar-item[data-panel="laporan"]');
    if (laporanSidebar) {
        laporanSidebar.addEventListener('click', loadLaporan);
    }

    // riwayat penggunaan bahan
    const riwayatLabFilter = document.getElementById('riwayatLabFilter');

    if (riwayatLabFilter) {
        riwayatLabFilter.addEventListener('change', loadRiwayat);
    }

    function getRiwayatLabFilter() {
        if (!riwayatLabFilter) return null;
        const val = riwayatLabFilter.value;
        return val === 'all' ? null : parseInt(val);
    }

    async function loadRiwayat() {
        const container = document.getElementById('riwayatList');
        if (!container) return;

        try {
            const token = localStorage.getItem('token');
            let url = '/api/bahan/pakai';
            const labId = getRiwayatLabFilter();
            if (labId) url += `?lab_id=${labId}`;

            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            renderRiwayat(data);
        } catch (error) {
            container.innerHTML = '<p style="color:#c62828; text-align:center;">Gagal memuat data riwayat.</p>';
        }
    }

    function renderRiwayat(data) {
        const container = document.getElementById('riwayatList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Belum ada riwayat penggunaan bahan.</p>';
            return;
        }

        let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f0f7f2;">
                    <th style="padding:8px; border:1px solid #d0e6d5;">Tanggal</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Nama Bahan</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Jumlah</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Satuan</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Penanggung Jawab</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kelas</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Kegiatan</th>
                    <th style="padding:8px; border:1px solid #d0e6d5;">Aksi</th>
                </tr>
            </thead>
            <tbody>`;

        data.forEach(item => {
            const tgl = item.tanggal ? item.tanggal.substring(0, 10) : '-';
            html += `<tr>
                <td style="padding:8px; border:1px solid #d0e6d5;">${tgl}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.nama_bahan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.jumlah_digunakan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.satuan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.penanggung_jawab}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.kelas || '-'}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">${item.kegiatan}</td>
                <td style="padding:8px; border:1px solid #d0e6d5;">
                    <button class="btn-delete btn-xs" data-hapus-riwayat="${item.id}">Hapus</button>
                </td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Event listener untuk tombol Hapus
        container.querySelectorAll('button[data-hapus-riwayat]').forEach(btn => {
            btn.addEventListener('click', function() {
                hapusRiwayat(parseInt(this.getAttribute('data-hapus-riwayat')));
            });
        });
    }

    async function hapusRiwayat(id) {
        if (!confirm('Yakin hapus riwayat ini? (Stok bahan tidak akan kembali)')) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/bahan/pakai/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message);
            if (res.ok) loadRiwayat();
        } catch (error) {
            alert('Gagal terhubung ke server');
        }
    }

    // Load riwayat saat panel dibuka
    const riwayatSidebar = document.querySelector('.sidebar-item[data-panel="riwayat"]');
    if (riwayatSidebar) {
        riwayatSidebar.addEventListener('click', loadRiwayat);
    }
    
    //  tombol logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('nama');
            window.location.href = '/login';
        });
    }
});