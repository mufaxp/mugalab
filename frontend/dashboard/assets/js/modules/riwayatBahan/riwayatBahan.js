/**
 * riwayatBahan.js - Riwayat Bahan Module
 * Tabel historis penggunaan bahan + export Excel
 */

function initRiwayatBahan() {
    const riwayatLabFilter = document.getElementById('riwayatLabFilter');

    function getRiwayatLabFilter() {
        if (!riwayatLabFilter) return null;
        const v = riwayatLabFilter.value;
        return v === 'all' ? null : parseInt(v);
    }

    if (riwayatLabFilter) {
        riwayatLabFilter.addEventListener('change', () => loadRiwayat());
    }

    // fitur ekspor riwayat penggunaan bahan
    document.getElementById('btnExportRiwayat').addEventListener('click', async function() {
        try {
            const labId = getRiwayatLabFilter();
            const params = labId ? { lab_id: labId } : {};
            const data = await apiGet('/api/bahan/pakai', params);
            if (!data || !data.length) return alert('Tidak ada data untuk diexport');

            const excelData = data.map((item, index) => ({
                'No': index + 1,
                'Tanggal': item.tanggal ? item.tanggal.substring(0, 10) : '-',
                'Nama Bahan': item.nama_bahan,
                'Jumlah Digunakan': item.jumlah_digunakan,
                'Satuan': item.satuan,
                'Penanggung Jawab': item.penanggung_jawab,
                'Kelas': item.kelas || '-',
                'Kegiatan': item.kegiatan
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            ws['!cols'] = [
                { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
                { wch: 10 }, { wch: 25 }, { wch: 10 }, { wch: 30 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Penggunaan Bahan');
            XLSX.writeFile(wb, `Riwayat_Penggunaan_Bahan_${new Date().toISOString().substring(0, 10)}.xlsx`);
        } catch (err) {
            alert('Gagal mengexport data');
        }
    });

    // load riwayat
    loadRiwayat();

    // Load saat panel dibuka
    const sidebar = document.querySelector('.sidebar-item[data-panel="riwayat"]');
    if (sidebar) sidebar.addEventListener('click', loadRiwayat);

    console.log('✅ Modul Riwayat Bahan siap');
}

// method load dan render
async function loadRiwayat() {
    const container = document.getElementById('riwayatList');
    if (!container) return;
    try {
        const labId = document.getElementById('riwayatLabFilter')?.value;
        const params = (labId && labId !== 'all') ? { lab_id: labId } : {};
        const data = await apiGet('/api/bahan/pakai', params);
        renderRiwayat(data);
    } catch (err) {
        container.innerHTML = '<p style="color:#c62828;text-align:center;">Gagal memuat data riwayat.</p>';
    }
}

function renderRiwayat(data) {
    const container = document.getElementById('riwayatList');
    if (!data || !data.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Belum ada riwayat penggunaan bahan.</p>';
        return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0f7f2;">
            <th style="padding:8px;border:1px solid #d0e6d5;">Tanggal</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Nama Bahan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Jumlah</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Satuan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Penanggung Jawab</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kelas</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Kegiatan</th>
            <th style="padding:8px;border:1px solid #d0e6d5;">Aksi</th>
        </tr></thead><tbody>`;

    data.forEach(item => {
        const tgl = item.tanggal ? formatTanggal(item.tanggal) : '-';
        html += `<tr>
            <td style="padding:8px;border:1px solid #d0e6d5;">${tgl}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.nama_bahan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.jumlah_digunakan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.satuan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.penanggung_jawab}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kelas || '-'}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">${item.kegiatan}</td>
            <td style="padding:8px;border:1px solid #d0e6d5;">
                <button class="btn-delete btn-xs" data-hapus-riwayat="${item.id}">Hapus</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('[data-hapus-riwayat]').forEach(btn => {
        btn.addEventListener('click', () => hapusRiwayat(parseInt(btn.getAttribute('data-hapus-riwayat'))));
    });
}

// menghapus riwayat penggunaan bahan
async function hapusRiwayat(id) {
    if (!confirm('Yakin hapus riwayat ini? (Stok bahan tidak akan kembali)')) return;
    const data = await apiDelete(`/api/bahan/pakai/${id}`);
    alert(data.message);
    if (!data.message.includes('Gagal')) loadRiwayat();
}