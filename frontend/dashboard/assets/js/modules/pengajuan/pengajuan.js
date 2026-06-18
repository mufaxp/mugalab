/**
 * pengajuan.js - Pengajuan Jadwal Module
 * Tabel pengajuan + terima/tolak
 */

function initPengajuan() {
    loadPengajuan();

    const sidebar = document.querySelector('.sidebar-item[data-panel="pengajuan"]');
    if (sidebar) sidebar.addEventListener('click', loadPengajuan);

    console.log('✅ Modul Pengajuan Jadwal siap');
}

async function loadPengajuan() {
    const container = document.getElementById('pengajuanList');
    if (!container) return;

    try {
        const data = await apiGet('/api/pengajuan');
        renderPengajuan(data);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data pengajuan.</p>';
    }
}

function renderPengajuan(data) {
    const container = document.getElementById('pengajuanList');
    if (!data || !data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Tidak ada pengajuan jadwal.</p>';
        return;
    }

    const statusLabel = {
        'pending': '🟡 Pending',
        'diterima': '🟢 Diterima',
        'ditolak': '🔴 Ditolak'
    };

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Pengaju</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kegiatan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Mapel</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kelas</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Tanggal</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jam</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Lab</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Status</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const tgl = item.tanggal ? item.tanggal.substring(0, 10) : '-';
        const labName = item.lab_id == 1 ? 'Bio-Kim' : 'Fisika';
        const isPending = item.status === 'pending';

        let aksi = '';
        if (isPending) {
            aksi = `<button class="btn-edit btn-xs" data-action="terima" data-id="${item.id}">✅ Terima</button>
                <button class="btn-delete btn-xs" data-action="tolak" data-id="${item.id}">❌ Tolak</button>`;
        } else {
            aksi = `<span style="font-size:11px;color:#888;">${item.processed_at ? item.processed_at.substring(0,10) : '-'}</span>`;
        }

        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.pengaju || item.penanggung_jawab}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kegiatan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.mata_pelajaran || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kelas || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tgl}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jam_mulai}-${item.jam_selesai}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${labName}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${statusLabel[item.status] || item.status}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;white-space:nowrap;">${aksi}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Event listener Terima/Tolak
    container.querySelectorAll('[data-action="terima"]').forEach(btn => {
        btn.addEventListener('click', () => prosesPengajuan(btn.getAttribute('data-id'), 'diterima'));
    });
    container.querySelectorAll('[data-action="tolak"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const alasan = prompt('Alasan penolakan (opsional):');
            prosesPengajuan(id, 'ditolak', alasan || '');
        });
    });
}

async function prosesPengajuan(id, status, alasan = '') {
    const data = await apiPut(`/api/pengajuan/${id}`, { status, alasan_tolak: alasan });
    alert(data.message);
    if (!data.message.includes('Gagal')) {
        loadPengajuan();
        if (typeof loadDashboardJadwal === 'function') loadDashboardJadwal();
    }
}