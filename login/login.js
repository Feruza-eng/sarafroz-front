import { apiRequest } from '../assets/js/api.js';

const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-btn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = 'Tekshirilmoqda...';
    
    // Formadagi ma'lumotlarni olish
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

        // YENGI QADAM: Tokenni Local Storage'ga saqlash
        localStorage.setItem('userToken', data.token);

        // Muvaffaqiyatli javob
        console.log('Kirish muvaffaqiyatli:', data);
        alert(`Xush kelibsiz, ${data.name}!`);
        
        // Tizimga kirish muvaffaqiyatli bo'lsa, dashboardga yo'naltirish
        window.location.href = '../dashboard/dashboard.html';

    } catch (error) {
        // Xatoni ko'rsatish
        console.error('Kirishda xato:', error);
        alert(error.message || 'Kirishda xato yuz berdi. Email yoki parolni tekshiring.');

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Kirish';
    }
});