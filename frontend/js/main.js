document.addEventListener('DOMContentLoaded', function() {
    const weekSelect = document.getElementById('weekSelect');

    function getSundayOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day; //mundur ke Ahad
        const sunday = new Date(date);
        sunday.setDate(diff);
        sunday.setHours(0, 0, 0, 0); // set ke awal hari
        return sunday;
    }

    // Format tanggal DD/MM
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    // Hitung rentang Ahad - Sabtu
    function getWeekRange(sunday) {
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        return {
            start: formatDate(sunday),
            end: formatDate(saturday)
        };
    }

    // Hitung tanggal untuk 3 pekan
    const today = new Date();
    // pekan ini
    const currentSunday = getSundayOfWeek(today);

    // pekan lalu
    const prevSunday = new Date(currentSunday);
    prevSunday.setDate(currentSunday.getDate() - 7);

    // pekan depan
    const nextSunday = new Date(currentSunday);
    nextSunday.setDate(currentSunday.getDate() + 7);

    const prevRange = getWeekRange(prevSunday);
    const currentRange = getWeekRange(currentSunday);
    const nextRange = getWeekRange(nextSunday);

    // perbarui teks dropdown
    const options = weekSelect.options;
    options[0].textContent = `Pekan Lalu (${prevRange.start} - ${prevRange.end})`;
    options[1].textContent = `Pekan Ini (${currentRange.start} - ${currentRange.end})`;
    options[2].textContent = `Pekan Depan (${nextRange.start} - ${nextRange.end})`;
    weekSelect.value = 'current'; // set default ke pekan ini

    // ambil data jadwal dari API
    async function loadJadwal(mingguMulai) {
        try {
            const response = await fetch(`/api/jadwal?minggu_mulai=${mingguMulai}`);
            const data = await response.json();
            renderJadwal(data);
        } catch (error) {
            console.error('Gagal memuat jadwal:', error);
        }
    }

    // render card di tabel
    function renderJadwal(jadwalList) {
        const semuaSel = tbody.querySelectorAll('td:not(:first-child)');
        semuaSel.forEach(td => {
            td.innerHTML = '';
            td.style.position = 'relative';
        });

        // Hari ke- indeks kolom
        const hariKeKolom = {
            'Ahad': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
        };

        jadwalList.forEach(item => {
            const tanggal = new Date(item.tanggal);
            const hari = tanggal.toLocaleDateString('id-ID, { weekday: "long" }');
            const hariKapital = hari.charAt(0).toUpperCase() + hari.slice(1);
            const kolomIndex = hariKeKolom[hariKapital] + 1;

            const jamMulai = item.jam_mulai;
            const jamSelesai = item.jam_selesai;
            const rentang = jamSelesai - jamMulai + 1;

            // cari baris jam_mulai
            const barisMulai = tbody.querySelectorAll('tr')[jamMulai -1];
            if (!barisMulai) return; // jika jam_mulai di luar 1-10, abaikan

            // buat card
            const card = document.createElement('div');
            card.className = 'jadwal-card';
            card.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0;
                height: ${rentang * 100}%;
                background-color: #E3F2FD;
                border-left: 4px solid #1E88E5;
                border-radius: 6px;
                padding: 4px 6px;
                font-size: clamp(6px, 0.8vw, 10px);
                line-height: 1.3;
                overflow: hidden;
                z-index: 5;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                `;
            card.innerHTML = `
                <strong>${item.kelas !== '-' ? item.kelas : ''}</strong>
                <div style="font-weight: 500;">${item.kegiatan}</div>
                <div style="color:#555; font-size: 0.9em;">${item.penanggung_jawab}</div>
                `;

            // hapus placeholder
            selTarget.innerHTML = '';
            setTarget.style.position = 'relative';
            selTarget.appendChild(card);
        });
    }

    // load data saat halaman dibuka (pekan ini)
    loadJadwal(formatDateISO(currentSunday));

    // event: dropdown berubah
    weekSelect.addEventListener('change', function() {
        let selectedSunday;
        if (this.value === 'prev') selectedSunday = prevSunday;
        else if (this.value === 'current') selectedSunday = currentSunday;
        else if (this.value === 'next') selectedSunday = nextSunday;

        loadJadwal(formatDateISO(selectedSunday));
    });
    // event listener untuk perubahan pilihan pekan
    // weekSelect.addEventListener('change', function() {
    //     const selectedValue = this.value;
    //     console.log('Pekan dipilih:', selectedValue);
    //     alert(`menampikan jadwal untuk: ${this.options[this.selectedIndex].textContent }`);
    // })
});