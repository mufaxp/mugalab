/**
 * jadwal.js - Jadwal Module
 * CRUD jadwal, render card, filter lab, filter pekan
 */

let editMode = false;
let editId = null;
let currentSunday = getCurrentSunday(); // Mengambil hari Minggu pekan ini dari utils.js

// Helper untuk format rentang tanggal (misal: 01/11 - 07/11)
function getWeekRange(sunday) {
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const f = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${f(sunday)} - ${f(saturday)}`;
}

async function initJadwal() {
    const labFilterSelect = document.getElementById('labFilterSelect');
    const weekSelect = document.getElementById('dashboardWeekSelect');

    await loadLabOptions('lab_id');
    await loadLabOptions('labFilterSelect', true);
    
    // filter ruang lab
    function getCurrentLabFilter() {
        if (!labFilterSelect) return null;
        const v = labFilterSelect.value;
        return v === 'all' ? null : parseInt(v);
    }

    if (labFilterSelect) {
        labFilterSelect.addEventListener('change', function() {
            loadDashboardJadwal(getCurrentLabFilter());
        });
    }

    // Setup Dropdown Pekan
    if (weekSelect) {
        const currentSun = getCurrentSunday();
        const prevSun = new Date(currentSun); prevSun.setDate(currentSun.getDate() - 7);
        const nextSun = new Date(currentSun); nextSun.setDate(currentSun.getDate() + 7);

        const options = weekSelect.options;
        options[0].text = `Pekan Lalu (${getWeekRange(prevSun)})`;
        options[1].text = `Pekan Ini (${getWeekRange(currentSun)})`;
        options[2].text = `Pekan Depan (${getWeekRange(nextSun)})`;
        weekSelect.value = 'current';

        weekSelect.addEventListener('change', function() {
            if (this.value === 'prev') {
                currentSunday.setDate(currentSunday.getDate() - 7);
            } else if (this.value === 'next') {
                currentSunday.setDate(currentSunday.getDate() + 7);
            } else {
                currentSunday = getCurrentSunday();
            }
            loadDashboardJadwal(getCurrentLabFilter());
        });
    }

    // Tombol Batal modal
    const btnBatalTambah = document.getElementById('btnBatalTambah');
    if (btnBatalTambah) btnBatalTambah.addEventListener('click', () => closeModal('modalTambah'));
    
    // Klik di luar modal
    closeModalOnClickOutside('modalTambah');

    // submit form jadwal
    const formTambahJadwal = document.getElementById('formTambahJadwal');
    if (formTambahJadwal) {
        formTambahJadwal.addEventListener('submit', async function(e) {
            e.preventDefault();

            const body = {
                lab_id: parseInt(document.getElementById('lab_id').value),
                penanggung_jawab: document.getElementById('penanggung_jawab').value.trim(),
                kegiatan: document.getElementById('kegiatan').value.trim(),
                kelas: document.getElementById('kelas').value.trim() || '-',
                tanggal: document.getElementById('tanggal').value,
                jam_mulai: parseInt(document.getElementById('jam_mulai').value),
                jam_selesai: parseInt(document.getElementById('jam_selesai').value)
            };

            if (!body.penanggung_jawab || !body.kegiatan || !body.tanggal || !body.jam_mulai || !body.jam_selesai) {
                return alert('Semua field wajib diisi!');
            }
            if (body.jam_selesai < body.jam_mulai) {
                return alert('Jam selesai harus >= jam mulai!');
            }

            const url = editMode ? `/api/jadwal/${editId}` : '/api/jadwal';

            try {
                const data = editMode ? await apiPut(url, body) : await apiPost(url, body);
                alert(data.message);
                if (data.message && !data.message.includes('Gagal')) {
                    closeModal('modalTambah');
                    editMode = false;
                    editId = null;
                    loadDashboardJadwal(getCurrentLabFilter());
                }
            } catch (err) {
                alert('Gagal terhubung ke server');
            }
        });
    }

    // pemanggilan method load jadwal
    await loadDashboardJadwal();
    
    // Siapkan modal Laprak agar suggestion alat & bahan langsung muncul
    if (typeof initLaprakModal === 'function') {
        await initLaprakModal();
    }

    console.log('✅ Modul Jadwal siap');
}

// fungsi edit jadwal (buka modal)
window.openEditModal = function(item) {
    editMode = true;
    editId = item.id;
    setModalTitle('modalTambah', 'Edit Jadwal');
    setSubmitButton('modalTambah', 'Update');
    
    document.getElementById('penanggung_jawab').value = item.penanggung_jawab;
    document.getElementById('kegiatan').value = item.kegiatan;
    document.getElementById('kelas').value = item.kelas === '-' ? '' : item.kelas;
    document.getElementById('tanggal').value = toLocalDate(item.tanggal);
    document.getElementById('jam_mulai').value = item.jam_mulai;
    document.getElementById('jam_selesai').value = item.jam_selesai;
    document.getElementById('lab_id').value = item.lab_id || 1;
    
    openModal('modalTambah');
};

// fitur load jadwal
async function loadDashboardJadwal(labId = null) {
    const container = document.getElementById('jadwalList');
    if (!container) return;

    container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Memuat data jadwal...</p>';

    try {
        const params = { minggu_mulai: formatDateISO(currentSunday) };
        if (labId) {
            params.lab_id = labId;
        }

        if (getRole() === 'guru') {
            const mapel = getMapel();
            if (mapel) params.mata_pelajaran = mapel;
        }

        const response = await apiGet('/api/jadwal', params);
        const data = Array.isArray(response) ? response : (response.data || []);

        renderJadwal(data);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;padding:20px;">Gagal memuat jadwal.</p>';
        console.error('Gagal memuat jadwal:', err);
    }
}

// fitur render jadwal
function renderJadwal(data) {
    const container = document.getElementById('jadwalList');
    if (!container) return;

    const currentRole = localStorage.getItem('role') || 'guru';
    const canModify = currentRole !== 'guru';

    if (!data || !data.length) {
        container.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">Belum ada jadwal untuk pekan ini.</p>`;
        return;
    }

    container.innerHTML = '';
    
    // Sort data berdasarkan tanggal dan jam mulai
    data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal) || a.jam_mulai - b.jam_mulai);

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
                <button class="btn-laporan" data-laporan='${JSON.stringify(item)}'>Laporan</button>
                ${canModify ? `
                    <button class="btn-edit">Edit</button>
                    <button class="btn-delete" data-id="${item.id}">Hapus</button>
                ` : ''}
            </div>`;

        // Event Hapus
        const btnDelete = card.querySelector('.btn-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', () => hapusJadwal(item.id, card));
        }

        // Event Edit
        const btnEdit = card.querySelector('.btn-edit');
        if (btnEdit) {
            btnEdit.addEventListener('click', () => openEditModal(item));
        }

        // Event Laporan
        const btnLaporan = card.querySelector('.btn-laporan');
        if (item.has_laporan) {
            btnLaporan.textContent = '✅ Ada Laporan';
            btnLaporan.style.cssText = 'background:#E0E0E0;color:#999;cursor:not-allowed;pointer-events:none;border:1px solid #ccc;';
        } else {
            btnLaporan.addEventListener('click', () => {
                const d = JSON.parse(btnLaporan.getAttribute('data-laporan'));
                if (typeof bukaModalLaporan === 'function') bukaModalLaporan(d);
            });
        }

        container.appendChild(card);
    });
}

// fitur hapus jadwal
async function hapusJadwal(id, card) {
    if (!confirm('Yakin hapus jadwal ini?')) return;
    try {
        const data = await apiDelete(`/api/jadwal/${id}`);
        alert(data.message);
        if (!data.message.includes('Gagal')) {
            card.remove();
            const container = document.getElementById('jadwalList');
            if (container && container.children.length === 0) {
                container.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">Belum ada jadwal untuk pekan ini.</p>`;
            }
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    }
}