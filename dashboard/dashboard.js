import { apiRequest } from '../assets/js/api.js';

const loadingMessage = document.getElementById('loading-message');
const profileInfo = document.getElementById('profile-info');
const logoutButton = document.getElementById('logout-btn');

document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
    // 1. Tokenni tekshirish
    const token = localStorage.getItem('userToken');

    if (!token) {
        // Token yo'q bo'lsa, Login sahifasiga yo'naltirish
        alert("Iltimos, avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }

    try {
        // 2. Himoyalangan API'ga so'rov yuborish
        // Authorization header'ini qo'shish kerak
        const response = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // TOKENNI HEADERGA QO'SHISH MUHIM
                'Authorization': `Bearer ${token}` 
            },
        });

        // 3. Ma'lumotlarni sahifada ko'rsatish
        displayProfile(response.user);
        
    } catch (error) {
        // Token yaroqsiz bo'lsa (Backend 401 qaytaradi)
        console.error("Profil yuklashda xato:", error);
        alert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.");
        
        // Xato yuz bersa ham chiqish
        handleLogout(); 
    }
}

function displayProfile(user) {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-id').textContent = user._id;

    loadingMessage.style.display = 'none';
    profileInfo.style.display = 'block';
}

// 4. Chiqish (Logout) funksiyasi
function handleLogout() {
    localStorage.removeItem('userToken'); // Tokenni o'chirish
    alert('Tizimdan chiqdingiz.');
    window.location.href = '../login/login.html'; // Login sahifasiga qaytish
}

logoutButton.addEventListener('click', handleLogout);