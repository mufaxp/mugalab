require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});