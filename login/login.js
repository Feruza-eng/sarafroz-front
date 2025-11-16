import { apiRequest } from '../assets/js/api.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Backend'dagi /api/auth/login endpointiga so'rov yuborish
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        console.log('Login muvaffaqiyatli:', data);
        // Tizimga kirish muvaffaqiyatli bo'lsa, foydalanuvchini dashboardga yo'naltirish
        window.location.href = '../dashboard/dashboard.html';

    } catch (error) {
        // Xatoni foydalanuvchiga ko'rsatish
        alert('Login yoki parol noto\'g\'ri!');
    }
});