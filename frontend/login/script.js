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
            // simpan nama ke localStorage
            localStorage.setItem('nama', data.nama);
            // redirect ke dashboard
            window.location.href = '/dashboard';
        } else {
            alert(data.message || 'Login gagal');
        }
    } catch (error) {
        console.error('Error', error);
        alert('Gagal terhubung ke server');
    }
});