// edu-web-frontend/lesson-management/lesson-management.js

import { apiRequest } from '../assets/js/api.js';

let currentCourseId = null;
let currentLessons = [];
const token = localStorage.getItem('userToken');

// =========================================================
// 1. DOM Elementlarini bog'lash (HTML dagi ID larga mos)
// =========================================================
const courseTitleSpan = document.getElementById('current-course-title');
const lessonForm = document.getElementById('lesson-form');
const lessonsListAdmin = document.getElementById('lessons-list-admin');
const lessonCountSpan = document.getElementById('lesson-count');
const viewLessonsBtn = document.getElementById('view-lessons-btn');

// Input Maydonlari
const lessonTitleInput = document.getElementById('lesson-title-input');
const videoUrlInput = document.getElementById('video-url-input');
const documentationUrlInput = document.getElementById('documentation-url-input');
const taskFileUrlInput = document.getElementById('task-file-url-input');
const taskDescriptionInput = document.getElementById('task-description-input');


document.addEventListener('DOMContentLoaded', initializeLessonManager);

// =========================================================
// 2. Boshlash Mantiqi
// =========================================================

// URL dan courseId'ni oluvchi funksiya
function getCourseIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('courseId');
}

async function initializeLessonManager() {
    if (!token) {
        alert("Avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }

    currentCourseId = getCourseIdFromUrl();
    if (!currentCourseId) {
        courseTitleSpan.textContent = 'Xato: Kurs ID si topilmadi!';
        return;
    }
    
    // Kurs nomini yuklash va darslarni ko'rsatish
    await fetchCourseDetails(currentCourseId);
    
    // Eventlar
    lessonForm.addEventListener('submit', handleAddLesson);
    viewLessonsBtn.addEventListener('click', handleViewLessons);
}

// =========================================================
// 3. Ma'lumotlarni Yuklash
// =========================================================

// Kurs nomi va darslarni yuklash
async function fetchCourseDetails(courseId) {
    try {
        // Kurs ma'lumotlarini olish (Nomini ko'rsatish uchun)
        const courseResponse = await apiRequest(`/courses/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        courseTitleSpan.textContent = courseResponse.course.title;

        // Darslarni yuklash (tartib raqamini aniqlash uchun)
        const lessonsResponse = await apiRequest(`/lessons/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Darslarni tartib raqami bo'yicha saralash
        currentLessons = (lessonsResponse.lessons || []).sort((a, b) => a.order - b.order);
        renderLessonsList(currentLessons);

    } catch (error) {
        console.error("Kurs ma'lumotlarini yuklashda xato:", error);
        courseTitleSpan.textContent = 'Xato yuz berdi! Server aloqasini tekshiring.';
    }
}

// =========================================================
// 4. Dars Ro'yxatini Ko'rsatish
// =========================================================

function renderLessonsList(lessons) {
    lessonsListAdmin.innerHTML = '';
    lessonCountSpan.textContent = lessons.length;

    if (lessons.length === 0) {
         lessonsListAdmin.innerHTML = '<li>Hozircha birorta ham dars qo\'shilmagan.</li>';
         return;
    }

    lessons.forEach(lesson => {
        const li = document.createElement('li');
        
        // Har bir darsning barcha 4 ta komponenti qo'shilganini ko'rsatamiz
        let contentSummary = `
            Video: ${lesson.videoUrl ? '✅' : '❌'}, 
            Docs: ${lesson.documentationUrl ? '✅' : '❌'}, 
            Task: ${lesson.taskFileUrl ? '✅' : '❌'}
        `;
        
        li.innerHTML = `
            <div>
                <strong>${lesson.order}. ${lesson.title}</strong><br>
                <small>${contentSummary}</small>
            </div>
            <button data-id="${lesson._id}" class="delete-lesson-btn action-btn delete-btn">🗑️ O'chirish</button>
        `;
        lessonsListAdmin.appendChild(li);
    });
    
    // O'chirish tugmalarini boshqarish
    lessonsListAdmin.querySelectorAll('.delete-lesson-btn').forEach(button => {
        button.addEventListener('click', handleDeleteLesson);
    });
}

// =========================================================
// 5. Harakatlarni Boshqarish (Qo'shish, O'chirish, Ko'rish)
// =========================================================

// Yangi dars qo'shish
async function handleAddLesson(e) {
    e.preventDefault();
    
    const title = lessonTitleInput.value.trim();
    const videoUrl = videoUrlInput.value.trim();
    const documentationUrl = documentationUrlInput.value.trim();
    const taskFileUrl = taskFileUrlInput.value.trim();
    const taskDescription = taskDescriptionInput.value.trim();
    
    // Keyingi darsning tartib raqami hozirgi darslar sonidan 1 taga ko'p bo'ladi
    const newLessonOrder = currentLessons.length + 1;

    // Backendga yuboriladigan ma'lumotlar Lesson Modeliga mos bo'lishi kerak
    const data = {
        title,
        course: currentCourseId,
        order: newLessonOrder,
        videoUrl,
        documentationUrl,
        taskFileUrl,
        taskDescription
    };

    try {
        const response = await apiRequest('/lessons', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        alert(`Dars "${response.lesson.title}" muvaffaqiyatli yaratildi (Tartib: ${response.lesson.order}).`);
        lessonForm.reset(); // Formani tozalash
        await fetchCourseDetails(currentCourseId); // Ro'yxatni yangilash

    } catch (error) {
        alert(error.message || 'Dars qo\'shishda xato yuz berdi. Iltimos, server konsolini tekshiring.');
        console.error('Dars qo\'shishda xato:', error);
    }
}


// Darsni o'chirish
async function handleDeleteLesson(e) {
    const lessonId = e.target.dataset.id;
    if (!confirm('Haqiqatan ham bu darsni o\'chirmoqchimisiz? Kursdagi keyingi darslarning tartibi o\'zgaradi va talabalarning progresslari buzilishi mumkin!')) {
        return;
    }

    try {
        await apiRequest(`/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Dars muvaffaqiyatli o\'chirildi.');
        await fetchCourseDetails(currentCourseId); // Ro'yxatni yangilash
    } catch (error) {
        alert(error.message || 'Darsni o\'chirishda xato yuz berdi.');
        console.error('Darsni o\'chirishda xato:', error);
    }
}

// Kurs materiallarini ko'rish tugmasini bosish
function handleViewLessons() {
    window.location.href = `../lesson-view/lesson-view.html?courseId=${currentCourseId}`;
}