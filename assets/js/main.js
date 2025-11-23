// edu-web-frontend/assets/js/main.js

// api.js faylidan so'rov funksiyasini import qilish shart
import { apiRequest } from './api.js';

// MUHIM: Bu o'zgaruvchilar boshqa modullar uchun eksport qilinadi
export let currentUser = null;
export let currentUserRole = null; 

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // Sahifa yuklanganda foydalanuvchi ma'lumotlarini yuklash
    await fetchCurrentUser();
}

/**
 * Tizimga kirgan foydalanuvchining ma'lumotlarini (shu jumladan rolni) serverdan oladi.
 */
async function fetchCurrentUser() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        // Token yo'q bo'lsa, xech narsa qilmaymiz.
        return;
    }

    try {
        // /users/me API manziliga so'rov yuborish
        const response = await apiRequest('/auth/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Olingan ma'lumotlarni global o'zgaruvchilarga saqlash
        currentUser = response.user;
        currentUserRole = response.user.role; // Rol qiymatini saqlash
        
    } catch (error) {
        console.error('Foydalanuvchi ma\'lumotlarini yuklashda xato:', error);
        // Tokenni olib tashlash, agar eskirgan bo'lsa
        localStorage.removeItem('userToken');
        currentUser = null;
        currentUserRole = null;
    }
}

// Qo'shimcha: Logout funksiyasi (agar zarur bo'lsa)
export function handleLogout() {
    localStorage.removeItem('userToken');
    // Kirish sahifasiga yo'naltirish
    window.location.href = '../login/login.html'; 
}

// Eslatma: Boshqa fayllarda rolni ishlatish uchun:
// import { currentUserRole } from '../assets/js/main.js';