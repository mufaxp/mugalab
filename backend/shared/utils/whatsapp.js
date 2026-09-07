/**
 * Utilitas pengiriman notifikasi WhatsApp via Fonnte.
 * Memanfaatkan environment variables:
 * - TOKEN_FONNTE
 * - ADMIN_WA
 */

async function sendWANotification(jadwal, action) {
    try {
        const labName = jadwal.lab_id == 1 
            ? 'Ruang Laboratorium Biologi dan Kimia' 
            : 'Ruang Laboratorium Fisika';

        const message = 
            `📅 *Jadwal Lab ${action}*\n\n` +
            `*Kegiatan:* ${jadwal.kegiatan}\n` +
            `*Kelas:* ${jadwal.kelas}\n` +
            `*Penanggungjawab:* ${jadwal.penanggung_jawab}\n` +
            `*Tanggal:* ${jadwal.tanggal}\n` +
            `*Jam:* ${jadwal.jam_mulai}-${jadwal.jam_selesai}\n` +
            `*Ruangan:* ${labName}\n\n` +
            `🔗 https://lab.mugalearning.web.id`;

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': process.env.TOKEN_FONNTE,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: process.env.ADMIN_WA,
                message: message,
                countryCode: '62'
            })
        });

        const result = await response.json();
        if (result.status) {
            console.log('Notif WA terkirim');
        } else {
            console.log('Gagal kirim WA:', result.reason || 'Unknown');
        }
    } catch (error) {
        console.error('Error kirim WA:', error.message);
    }
}

async function sendWANotificationToAdmin(message) {
    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': process.env.TOKEN_FONNTE,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: process.env.ADMIN_WA,
                message: message,
                countryCode: '62'
            })
        });

        const result = await response.json();
        if (!result.status) {
            console.log('Gagal kirim WA ke admin:', result.reason);
        }
    } catch (err) {
        console.error('Gagal kirim WA ke admin:', err.message);
    }
}

async function sendWANotificationToGuru(nomorWa, message) {
    if (!nomorWa) return;
    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': process.env.TOKEN_FONNTE,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: nomorWa.replace(/\D/g, ''),
                message: message,
                countryCode: '62'
            })
        });

        const result = await response.json();
        if (!result.status) {
            console.log('Gagal kirim WA ke guru:', result.reason);
        }
    } catch (err) {
        console.error('Gagal kirim WA ke guru:', err.message);
    }
}

module.exports = {
    sendWANotification,
    sendWANotificationToAdmin,
    sendWANotificationToGuru
};