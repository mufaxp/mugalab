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

    // event listener untuk perubahan pilihan pekan
    weekSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        console.log('Pekan dipilih:', selectedValue);
        alert(`menampikan jadwal untuk: ${this.options[this.selectedIndex].textContent }`);
    })
})