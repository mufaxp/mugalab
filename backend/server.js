require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ✅ Route health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend mugalab berjalan dengan baik!',
        timestamp: new Date().toISOString()
    });
});

// ✅ Route root
app.get('/', (req, res) => {
    res.send('Server mugalab aktif. Akses /api/health untuk cek kesehatan.');
});

// ✅ 404 handler (harus diletakkan paling bawah)
app.use((req, res) => {
    res.status(404).json({ error: 'Route tidak ditemukan', path: req.originalUrl });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});