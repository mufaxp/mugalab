# 1. Instal LibreOffice (sekali saja)
sudo apt install -y libreoffice libreoffice-writer fonts-noto fonts-noto-cjk

# 2. Clone / pull repositori
cd /var/www/lab && git pull

# 3. Instal dependensi Node.js
cd backend && npm install

# 4. Restart aplikasi
pm2 restart mugalab-backend