const jwt = require('jsonwebtoken');

/**
 * middleware untuk memverifikasi JWT token.
 * Token dikirimi via header: Authorization: Bearer <token>
 */

function verifyToken(req, res, next) {
    // Ambil header Authorization
    const authHeader = req.headers['authorization'];
    
    // Format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login ulang.' });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Simpan data user ke request (untuk dipakai di route berikutnya)
        req.user = decoded;
        
        // Lanjut ke route handler
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
    }
}

module.exports = verifyToken;