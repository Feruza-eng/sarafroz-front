import { apiRequest } from '../assets/js/api.js';

const registerForm = document.getElementById('register-form');
const registerButton = document.getElementById('register-btn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Formaning standart yuborilishini to'xtatish

    // Tugmani bloklash va matnni o'zgartirish
    registerButton.disabled = true;
    registerButton.textContent = 'Yuklanmoqda...';
    
    // Formadagi ma'lumotlarni olish
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Backend'dagi /api/auth/register endpointiga so'rov yuborish
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        // Muvaffaqiyatli javob
        console.log('Ro\'yxatdan o\'tish muvaffaqiyatli:', data);
        alert(`Muvaffaqiyatli! Foydalanuvchi: ${data.name}. Endi tizimga kirishingiz mumkin.`);
        
        // Kirish sahifasiga yo'naltirish
        window.location.href = '../login/login.html';

    } catch (error) {
        // Xatoni ko'rsatish
        console.error('Ro\'yxatdan o\'tishda xato:', error);
        alert(error.message || 'Ro\'yxatdan o\'tishda kutilmagan xato yuz berdi.');

    } finally {
        // Tugmani qayta tiklash
        registerButton.disabled = false;
        registerButton.textContent = 'Ro\'yxatdan O\'tish';
    }
});