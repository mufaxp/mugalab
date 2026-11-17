document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Username dan password harus diisi');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            const userData = data.data;

            localStorage.setItem('token', userData.token);
            localStorage.setItem('nama', userData.nama);
            localStorage.setItem('role', userData.role || 'guru');
            localStorage.setItem('mata_pelajaran', userData.mata_pelajaran || '');

            window.location.href = '/dashboard';
        } else {
            alert(data.message || 'Login gagal');
        }
    } catch (error) {
        console.error('Error', error);
        alert('Gagal terhubung ke server');
    }
});

// Face recognition login
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
let videoLogin = document.getElementById('videoLoginWajah');
let currentLoginDescriptor = null;
let intervalLogin = null;

document.getElementById('btnLoginWajah').addEventListener('click', async () => {
    document.getElementById('modalLoginWajah').style.display = 'flex';
    const status = document.getElementById('statusLoginWajah');
    const btn = document.getElementById('btnVerifikasiWajah');
    
    status.textContent = 'Memuat model AI...';
    btn.disabled = true;

    try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        status.textContent = 'Menyalakan kamera...';
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoLogin.srcObject = stream;

        videoLogin.onplaying = () => {
            status.textContent = 'Wajah terdeteksi! Silakan klik Verifikasi.';
            btn.disabled = false;
            
            if (intervalLogin) clearInterval(intervalLogin);

            intervalLogin = setInterval(async () => {
                const det = await faceapi.detectSingleFace(videoLogin).withFaceLandmarks().withFaceDescriptor();
                if (det) {
                    currentLoginDescriptor = Array.from(det.descriptor);
                } else {
                    currentLoginDescriptor = null;
                }
            }, 500);
        };
    } catch (err) {
        status.textContent = 'Error: Kamera tidak diizinkan atau AI gagal dimuat.';
    }
});

document.getElementById('btnVerifikasiWajah').addEventListener('click', async () => {
    const username = document.getElementById('login_face_username').value.trim();
    const status = document.getElementById('statusLoginWajah');
    const btn = document.getElementById('btnVerifikasiWajah');

    if (!username) return alert('Masukkan username Anda!');
    
    if (!currentLoginDescriptor || currentLoginDescriptor.length !== 128) {
        return alert('Wajah belum terdeteksi dengan jelas. Pastikan wajah Anda terlihat penuh di kamera.');
    }

    btn.disabled = true;
    btn.textContent = 'Memverifikasi...';
    status.textContent = 'Mencocokkan wajah...';

    try {
        const response = await fetch('/api/auth/login-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, descriptor: JSON.stringify(currentLoginDescriptor) })
        });

        const data = await response.json();

        if (response.ok) {
            const userData = data.data;
            localStorage.setItem('token', userData.token);
            localStorage.setItem('nama', userData.nama);
            localStorage.setItem('role', userData.role || 'guru');
            localStorage.setItem('mata_pelajaran', userData.mata_pelajaran || '');
            window.location.href = '/dashboard';
        } else {
            alert(data.message || 'Wajah tidak cocok');
            status.textContent = 'Wajah tidak cocok. Coba lagi.';
            btn.disabled = false;
            btn.textContent = 'Verifikasi & Masuk';
        }
    } catch (err) {
        alert('Gagal terhubung ke server');
        btn.disabled = false;
        btn.textContent = 'Verifikasi & Masuk';
    }
});