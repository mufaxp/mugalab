document.addEventListener('DOMContentLoaded', function() {
    const weekSelect = document.getElementById('weekSelect');
    const tbody = document.querySelector('tbody');

    // fungsi untuk mendapatkan tanggal Ahad (Minggu) dari sebuah tanggal
    function getSundayOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day;
        const sunday = new Date(date);
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

    // hitung tanggal pekan lalu, ini, dan depan
    const today = new Date();
    const currentSunday = getSundayOfWeek(today);
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
    async function loadJadwal(mingguMulai) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/jadwal?minggu_mulai=${mingguMulai}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
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
            'Ahad': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3,
            'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
        };

        jadwalList.forEach(item => {
            const tanggal = new Date(item.tanggal);
            const hari = tanggal.toLocaleDateString('id-ID', { weekday: 'long' });
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
    }

    // load data pekan ini saat pertama kali halaman dimuat
    loadJadwal(formatDateISO(currentSunday));

    // event: dropdown berubah
    weekSelect.addEventListener('change', function() {
        let selectedSunday;
        if (this.value === 'prev') selectedSunday = prevSunday;
        else if (this.value === 'current') selectedSunday = currentSunday;
        else if (this.value === 'next') selectedSunday = nextSunday;

        loadJadwal(formatDateISO(selectedSunday));
    });
});