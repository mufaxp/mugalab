/**
 * Middleware untuk membatasi akses berdasarkan role.
 * Cara pakai: requireRole('admin') atau requireRole('admin','laboran')
 */

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin.' });
        }
        next();
    };
}

module.exports = requireRole;