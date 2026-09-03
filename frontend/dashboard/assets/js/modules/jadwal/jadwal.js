/**
 * jadwal.js - Jadwal Module
 * CRUD jadwal, render card, filter lab
 */

let editMode = false;
let editId = null;

async function initJadwal() {
    const currentRole = getRole();
    const btnTambah = document.querySelector('#jadwal .btn-tambah');
    if (btnTambah && currentRole === 'guru') {
        btnTambah.style.display = 'none';
    }
    const modalTambah = document.getElementById('modalTambah');
    const formTambahJadwal = document.getElementById('formTambahJadwal');
    const labFilterSelect = document.getElementById('labFilterSelect');

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
            this.value === 'all' ? loadDashboardJadwal() : loadDashboardJadwal(parseInt(this.value));
        });
    }

    // modal tambah jadwal
    if (btnTambah) {
        btnTambah.addEventListener('click', function() {
            editMode = false;
            editId = null;
            setModalTitle('modalTambah', 'Tambah Jadwal Baru');
            setSubmitButton('modalTambah', 'Simpan');
            openModal('modalTambah');
            formTambahJadwal.reset();
            document.getElementById('tanggal').valueAsDate = new Date();
        });
    }

    // Tombol Batal
    document.getElementById('btnBatalTambah').addEventListener('click', () => closeModal('modalTambah'));
    
    // Klik di luar modal
    closeModalOnClickOutside('modalTambah');

    // submit form jadwal
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
        const method = editMode ? 'PUT' : 'POST';

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

    // pemanggilan method load jadwal
    await loadDashboardJadwal();
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
    const pekanIniEl = document.getElementById('jadwalPekanIni');
    const pekanDepanEl = document.getElementById('jadwalPekanDepan');
    if (!pekanIniEl || !pekanDepanEl) return;

    try {
        const sundayIni = getCurrentSunday();
        const sundayDepan = new Date(sundayIni);
        sundayDepan.setDate(sundayIni.getDate() + 7);

        const paramsIni = { minggu_mulai: formatDateISO(sundayIni) };
        const paramsDepan = { minggu_mulai: formatDateISO(sundayDepan) };
        if (labId) {
            paramsIni.lab_id = labId;
            paramsDepan.lab_id = labId;
        }

        const dataIni = await apiGet('/api/jadwal', paramsIni);
        const dataDepan = await apiGet('/api/jadwal', paramsDepan);

        renderJadwalSection(pekanIniEl, dataIni, 'pekan ini');
        renderJadwalSection(pekanDepanEl, dataDepan, 'pekan depan');
    } catch (err) {
        console.error('Gagal memuat jadwal:', err);
    }
}

// fitur render jadwal
function renderJadwalSection(container, data, label) {
    if (!container) return;

    const currentRole = localStorage.getItem('role') || 'guru';
    const canModify = currentRole !== 'guru';

    if (!data || !data.length) {
        container.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">Belum ada jadwal untuk ${label}.</p>`;
        return;
    }

    container.innerHTML = '';
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

        // Event Hapus (hanya jika tombol ada)
        const btnDelete = card.querySelector('.btn-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', () => hapusJadwal(item.id, card));
        }

        // Event Edit (hanya jika tombol ada)
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
            loadDashboardJadwal();
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
    }
}