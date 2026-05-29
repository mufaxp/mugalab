document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    alert(`Login dengan:\nUsername: ${username}\nPassword: ${password}`);
    // Nanti di sini akan diisi fetch ke backend
});