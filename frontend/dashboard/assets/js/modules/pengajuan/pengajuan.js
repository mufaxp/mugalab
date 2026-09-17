/**
 * pengajuan.js - Pengajuan Jadwal Module
 * Tabel pengajuan + terima/tolak + preview lampiran PDF
 */

let allLabsData = [];

async function initPengajuan() {
    await loadlabsForPengajuan();
    loadPengajuan();

    const sidebar = document.querySelector('.sidebar-item[data-panel="pengajuan"]');
    if (sidebar) sidebar.addEventListener('click', loadPengajuan);

    // Modal preview PDF (dibuat sekali)
    if (!document.getElementById('modalPdfPreview')) {
        const modal = document.createElement('div');
        modal.id = 'modalPdfPreview';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:900px; width:95%; height:90vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 class="modal-title" style="margin:0; text-align:left;" id="pdfPreviewTitle">📄 Lampiran PDF</h3>
                    <button type="button" class="btn-batal" id="pdfPreviewClose" style="padding:6px 14px;">Tutup</button>
                </div>
                <iframe id="pdfPreviewFrame" style="flex:1; width:100%; border:1px solid #d0e6d5; border-radius:8px;" src=""></iframe>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = document.getElementById('pdfPreviewClose');
        closeBtn.addEventListener('click', () => {
            document.getElementById('modalPdfPreview').style.display = 'none';
            document.getElementById('pdfPreviewFrame').src = '';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.getElementById('pdfPreviewFrame').src = '';
            }
        });
    }

    console.log('✅ Modul Pengajuan Jadwal siap');
}

async function loadlabsForPengajuan() {
    try {
        const response = await apiGet('/api/lab');
        allLabsData = Array.isArray(response) ? response : (response.data || []);
    } catch (err) {
        console.warn('Gagal memuat daftar lab:', err);
        allLabsData = [];
    }
}

function getLabName(labId) {
    const lab = allLabsData.find(l => l.id == labId);
    return lab ? lab.nama : `Lab #${labId}`;
}

async function loadPengajuan() {
    const container = document.getElementById('pengajuanList');
    if (!container) return;

    try {
        const response = await apiGet('/api/pengajuan');
        const data = Array.isArray(response) ? response : (response.data || []);
        renderPengajuan(data);
    } catch (err) {
        console.error('Error di loadPengajuan:', err);
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data pengajuan.</p>';
    }
}

/**
 * Buka preview PDF di modal
 */
function openPdfPreview(filename) {
    const modal = document.getElementById('modalPdfPreview');
    const iframe = document.getElementById('pdfPreviewFrame');
    const title = document.getElementById('pdfPreviewTitle');

    if (!modal || !iframe) return;

    title.textContent = '📄 ' + filename;
    iframe.src = `/uploads/pengajuan/${filename}`;
    modal.style.display = 'flex';
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

    // Cek role user (admin/laboran/guru — semua boleh lihat lampiran)
    const role = (localStorage.getItem('role') || '').toLowerCase();
    const canSeeLampiran = ['admin', 'laboran', 'guru'].includes(role);
    const canAct = ['admin', 'laboran'].includes(role); // hanya admin & laboran yang bisa terima/tolak

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Pemohon</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kegiatan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Mapel</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kelas</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Tanggal</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jam</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Lab</th>
            ${canSeeLampiran ? '<th style="padding:8px;border:1px solid #d0e6d5;">Lampiran</th>' : ''}
            <th style="padding:8px;border:1px solid #d0e6d5;">Status</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const d = new Date(item.tanggal);
        const tgl = item.tanggal
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            : '-';
        const labName = getLabName(item.lab_id);
        const isPending = item.status === 'pending';

        let aksi = '';
        if (isPending && canAct) {
            aksi = `<button class="btn-edit btn-xs" data-action="terima" data-id="${item.id}">✅ Terima</button>
                <button class="btn-delete btn-xs" data-action="tolak" data-id="${item.id}">❌ Tolak</button>`;
        } else if (isPending && !canAct) {
            aksi = `<span style="font-size:11px;color:#888;">Menunggu admin</span>`;
        } else {
            aksi = `<span style="font-size:11px;color:#888;">${item.processed_at ? item.processed_at.substring(0,10) : '-'}</span>`;
        }

        // Kolom Lampiran
        let lampiranCell = '';
        if (canSeeLampiran) {
            if (item.file_pdf) {
                lampiranCell = `<td style="padding:8px;border:1px solid #d0e6d5;text-align:center;">
                    <button class="btn-pdf btn-xs" data-pdf="${item.file_pdf}" title="Lihat lampiran PDF">
                        📄 PDF
                    </button>
                </td>`;
            } else {
                lampiranCell = `<td style="padding:8px;border:1px solid #d0e6d5;text-align:center;color:#bbb;">—</td>`;
            }
        }

        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.pengaju || item.penanggung_jawab}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kegiatan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.mata_pelajaran || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kelas || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tgl}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jam_mulai}-${item.jam_selesai}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${labName}</td>
            ${lampiranCell}
            <td style="padding:8px;border:1px solid #d0e6d5;">${statusLabel[item.status] || item.status}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;white-space:nowrap;">${aksi}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Event listener Terima
    container.querySelectorAll('[data-action="terima"]').forEach(btn => {
        btn.addEventListener('click', () => prosesPengajuan(btn.getAttribute('data-id'), 'diterima'));
    });

    // Event listener Tolak
    container.querySelectorAll('[data-action="tolak"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const alasan = prompt('Alasan penolakan (opsional):');
            if (alasan === null) return;
            prosesPengajuan(id, 'ditolak', alasan.trim());
        });
    });

    // Event listener Preview PDF
    container.querySelectorAll('[data-pdf]').forEach(btn => {
        btn.addEventListener('click', () => {
            openPdfPreview(btn.getAttribute('data-pdf'));
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