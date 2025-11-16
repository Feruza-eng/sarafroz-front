import { apiRequest } from '../assets/js/api.js';

const myCoursesList = document.getElementById('my-courses-list');
const loadingMessage = document.getElementById('loading-message');

document.addEventListener('DOMContentLoaded', fetchMyEnrolledCourses);

// 1. Ro'yxatdan o'tilgan kurslarni Backenddan yuklash funksiyasi
async function fetchMyEnrolledCourses() {
    const token = localStorage.getItem('userToken');

    if (!token) {
        alert("Iltimos, avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const response = await apiRequest('/enroll/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        loadingMessage.style.display = 'none';
        displayCourses(response.courses || []); // Agar kurs bo'lmasa, bo'sh massiv yuborish
        
    } catch (error) {
        // Avtorizatsiya xatosi yoki boshqa xatolar uchun
        console.error("Mening kurslarimni yuklashda xato:", error);
        loadingMessage.textContent = 'Kurslarni yuklashda xato yuz berdi. Iltimos, qayta kiring.';
        alert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.");
        localStorage.removeItem('userToken');
        window.location.href = '../login/login.html';
    }
}


// 2. Kurslarni HTMLga joylash
function displayCourses(courses) {
    myCoursesList.innerHTML = '';

    if (courses.length === 0) {
        myCoursesList.innerHTML = '<p>Hozirda siz ro\'yxatdan o\'tgan kurslar mavjud emas.</p>';
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card enrolled-card';
        
        card.innerHTML = `
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <div class="teacher">O'qituvchi: ${course.teacher.name}</div>
            <div class="status">Ro'yxatdan o'tish sanasi: ${new Date(course.enrollmentDate).toLocaleDateString()}</div>
            <button class="view-content-btn" disabled>Kurs Materiallariga O'tish (Keyingi bosqich)</button>
        `;
        myCoursesList.appendChild(card);
    });
}