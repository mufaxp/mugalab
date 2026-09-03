document.addEventListener('DOMContentLoaded', function() {
    const weekSelect = document.getElementById('weekSelect');
    const tbody = document.querySelector('tbody');

    // fungsi getCurrentSunday
    function getCurrentSunday() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        const sunday = new Date(today);
        sunday.setDate(diff);
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    function formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getWeekRange(sunday) {
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        return { start: formatDate(sunday), end: formatDate(saturday) };
    }

    function hitungTanggalDariHari(hari, currentSunday) {
        const hariMap = { 'Ahad': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
        const target = new Date(currentSunday);
        target.setDate(target.getDate() + hariMap[hari]);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    
    // data lab dan navigasi
    let labs = [];
    let currentLabIndex = 0;
    let currentSunday = getCurrentSunday();
    const modalPengajuan = document.getElementById('modalPengajuan');
    const formPengajuan = document.getElementById('formPengajuan');

    async function loadLabs() {
        try {
            const response = await fetch('/api/lab');
            labs = await response.json();
            if (labs.length > 0) {
                updateLabDisplay();
            }
        } catch (error) {
            console.error('Gagal memuat data lab:', error);
        }
    }

    function updateLabDisplay() {
        const labTitle = document.getElementById('labTitle');
        if (labTitle && labs[currentLabIndex]) {
            labTitle.textContent = labs[currentLabIndex].nama;
        }
        loadJadwal(formatDateISO(currentSunday), labs[currentLabIndex].id);
    }

    // Event listener tombol panah
    document.getElementById('labPrev').addEventListener('click', function() {
        if (labs.length === 0) return;
        currentLabIndex = (currentLabIndex - 1 + labs.length) % labs.length;
        updateLabDisplay();
    });

    document.getElementById('labNext').addEventListener('click', function() {
        if (labs.length === 0) return;
        currentLabIndex = (currentLabIndex + 1) % labs.length;
        updateLabDisplay();
    });


    // hitung tanggal pekan lalu, ini, dan depan
    const today = new Date();
    const prevSunday = new Date(currentSunday); prevSunday.setDate(currentSunday.getDate() - 7);
    const nextSunday = new Date(currentSunday); nextSunday.setDate(currentSunday.getDate() + 7);

    const prevRange = getWeekRange(prevSunday);
    const currentRange = getWeekRange(currentSunday);
    const nextRange = getWeekRange(nextSunday);

    // isi dropdown dengan rentang tanggal
    const options = weekSelect.options;
    options[0].text = `Pekan Lalu (${prevRange.start} - ${prevRange.end})`;
    options[1].text = `Pekan Ini (${currentRange.start} - ${currentRange.end})`;
    options[2].text = `Pekan Depan (${nextRange.start} - ${nextRange.end})`;
    weekSelect.value = 'current';

    // ambil data jadwal dari backend
    async function loadJadwal(mingguMulai, labId) {
        try {
            const token = localStorage.getItem('token');
            let url = `/api/jadwal/public?minggu_mulai=${mingguMulai}`;
            if (labId) url += `&lab_id=${labId}`;

            const response = await fetch(url);
            const data = await response.json();
            renderJadwal(data);
        } catch (error) {
            console.error('Gagal memuat jadwal:', error);
        }
    }

    // render card jadwal ke tabel
    function renderJadwal(jadwalList) {
        // Reset semua sel (kecuali kolom Jam)
        const semuaSel = tbody.querySelectorAll('td:not(:first-child)');
        semuaSel.forEach(td => {
            td.innerHTML = '';
            td.style.position = 'relative';
        });

        // Hari ke indeks kolom (Ahad=0, Senin=1, ..., Sabtu=6)
        const hariKeKolom = {
            'Ahad': 0, 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3,
            'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
        };

        jadwalList.forEach(item => {
            const tglItem = new Date(item.tanggal);
            const hari = tglItem.toLocaleDateString('id-ID', { weekday: 'long' });
            const hariKapital = hari.charAt(0).toUpperCase() + hari.slice(1); // Ahad, Senin, dll
            const kolomIndex = hariKeKolom[hariKapital] + 1; // +1 karena kolom pertama Jam

            const jamMulai = item.jam_mulai;
            const jamSelesai = item.jam_selesai;
            const rentang = jamSelesai - jamMulai + 1;

            // Cari baris jam_mulai
            const barisMulai = tbody.querySelectorAll('tr')[jamMulai - 1];
            if (!barisMulai) return;

            const selTarget = barisMulai.querySelectorAll('td')[kolomIndex];
            if (!selTarget) return;

            // Buat card
            const card = document.createElement('div');
            card.className = 'jadwal-card';
            card.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0;
                height: ${rentang * 100}%;
                background: linear-gradient(135deg, #f0f7f2, #d0e6d5);
                border-left: 4px solid #0a5c32;
                border-radius: 6px;
                padding: 4px 6px;
                font-size: clamp(8px, 1vw, 13px);
                line-height: 1.3;
                overflow: hidden;
                z-index: 5;
                box-shadow: 0 2px 8px rgba(14, 112, 63, 0.1);
                text-align: left;
            `;

            card.innerHTML = `
                <strong>${item.kelas !== '-' ? item.kelas : ''}</strong>
                <div style="font-weight:500;">${item.kegiatan}</div>
                <div style="color:#555; font-size:0.9em;">${item.penanggung_jawab}</div>
            `;

            // Hapus placeholder "—"
            selTarget.innerHTML = '';
            selTarget.style.position = 'relative';
            selTarget.appendChild(card);
        });

        // Event listener klik sel kosong
        const allTd = tbody.querySelectorAll('td:not(:first-child)');
            allTd.forEach(td => {
                td.addEventListener('click', function() {
                    // Cek apakah sel ini berisi card (sudah terisi jadwal)
                    if (this.querySelector('.jadwal-card')) return; // Abaikan jika sudah terisi

                    const row = this.closest('tr');
                    const jamMulai = parseInt(row.querySelector('td:first-child').textContent);
                    const colIndex = Array.from(row.children).indexOf(this);
                    const hari = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][colIndex - 1];
                    const tanggal = hitungTanggalDariHari(hari, currentSunday);

                    // Isi modal
                    const tglObj = new Date(tanggal + 'T00:00:00');
                    document.getElementById('pengajuan_hari_tanggal').textContent = `${hari}, ${tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                    document.getElementById('pengajuan_lab').textContent = labs[currentLabIndex]?.nama || 'Lab';
                    document.getElementById('pengajuan_jam_mulai').value = jamMulai;

                    // Reset form
                    formPengajuan.reset();
                    document.getElementById('pengajuan_jam_mulai').value = jamMulai;
                    updateJamSelesaiOptions(jamMulai);
                    document.getElementById('pengajuan_jam_selesai').value = Math.min(jamMulai + 1, 10);

                    // Simpan data tersembunyi
                    document.getElementById('modalPengajuan').setAttribute('data-tanggal', tanggal);
                    document.getElementById('modalPengajuan').setAttribute('data-lab-id', labs[currentLabIndex]?.id || 1);

                    // Tampilkan modal
                    document.getElementById('modalPengajuan').style.display = 'flex';
                });
            });
        }

        function updateJamSelesaiOptions(jamMulai) {
        const sel = document.getElementById('pengajuan_jam_selesai');
        sel.innerHTML = '';
        for (let i = jamMulai; i <= 10; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            sel.appendChild(opt);
        }
    }

    document.getElementById('pengajuan_jam_mulai').addEventListener('change', function() {
        const mulai = parseInt(this.value);
        updateJamSelesaiOptions(mulai);
        document.getElementById('pengajuan_jam_selesai').value = Math.min(mulai + 1, 10);
    });

    // submit form pengajuan
    formPengajuan.addEventListener('submit', async function(e) {
        e.preventDefault();

        const body = {
            pengaju: document.getElementById('pengajuan_nama').value,
            nomor_wa: document.getElementById('pengajuan_wa').value,
            penanggung_jawab: document.getElementById('pengajuan_nama').value,
            mata_pelajaran: document.getElementById('pengajuan_mapel').value,
            kegiatan: document.getElementById('pengajuan_kegiatan').value,
            kelas: document.getElementById('pengajuan_kelas').value || '-',
            tanggal: document.getElementById('modalPengajuan').getAttribute('data-tanggal'),
            jam_mulai: parseInt(document.getElementById('pengajuan_jam_mulai').value),
            jam_selesai: parseInt(document.getElementById('pengajuan_jam_selesai').value),
            lab_id: parseInt(document.getElementById('modalPengajuan').getAttribute('data-lab-id'))
        };

        if (!body.pengaju || !body.nomor_wa || !body.kegiatan) {
            return alert('Nama, No WA, dan Kegiatan wajib diisi!');
        }

        try {
            const res = await fetch('/api/pengajuan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            alert(data.message || 'Pengajuan berhasil dikirim!');
            if (res.ok) {
                document.getElementById('modalPengajuan').style.display = 'none';
            }
        } catch (err) {
            alert('Gagal mengirim pengajuan. Silakan coba lagi.');
        }
    });

    // tutup modal saat klik di luar konten
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('modalPengajuan')) {
            document.getElementById('modalPengajuan').style.display = 'none';
        }
    });

    // load labs
    loadLabs().then(() => {
        if (labs.length > 0) {
            loadJadwal(formatDateISO(currentSunday), labs[currentLabIndex].id);
        } else {
            loadJadwal(formatDateISO(currentSunday));
        }
    });

    // event: dropdown berubah
    weekSelect.addEventListener('change', function() {
        if (this.value === 'prev') {
            currentSunday = new Date(prevSunday);
        } else if (this.value === 'current') {
            currentSunday = getCurrentSunday();
        } else if (this.value === 'next') {
            currentSunday = new Date(nextSunday);
        }

        const labId = labs.length > 0 ? labs[currentLabIndex].id : null;
        loadJadwal(formatDateISO(currentSunday), labId);
    });

    async function loadSettings() {
        try {
            const res = await fetch('/api/settings/public');
            const data = await res.json();

            if (data.nama_sekolah) {
                document.getElementById('nama_sekolah_display').textContent = data.nama_sekolah;
            }
            if (data.nama_lab) {
                document.getElementById('nama_lab_display').textContent = data.nama_lab;
            }
        } catch (err) {
            console.warn('Gagal memuat pengaturan:', err);
        }
    }

    // Panggil saat halaman dimuat
    loadSettings();
});