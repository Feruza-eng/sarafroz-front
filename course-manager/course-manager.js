// edu-web-frontend/course-manager/course-manager.js

import { apiRequest } from '../assets/js/api.js';
import { currentUserRole } from '../assets/js/main.js'; // Rolni main.js dan olamiz

// DOM Elementlari
const courseListEl = document.getElementById('course-list');
const loadingMessage = document.getElementById('loading-message');
const addCourseBtnContainer = document.getElementById('add-course-btn-container');

// Modal Elementlari
const courseModal = document.getElementById('course-modal');
const closeBtn = document.querySelector('.close-btn');
const modalTitle = document.getElementById('modal-title');
const courseForm = document.getElementById('course-form');
const courseIdInput = document.getElementById('course-id');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const priceInput = document.getElementById('price');


document.addEventListener('DOMContentLoaded', initializeCourseManager);

async function initializeCourseManager() {
    setupEventListeners();
    await fetchCourses();
}

function setupEventListeners() {
    // Modalni yopish
    closeBtn.onclick = () => courseModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === courseModal) {
            courseModal.style.display = 'none';
        }
    };
    
    // Kurs qo'shish tugmasini JS orqali joylashtirish
    if (currentUserRole === 'admin' || currentUserRole === 'teacher') {
        addCourseBtnContainer.innerHTML = `
            <button id="add-course-btn" class="btn action-btn manage-lessons-btn">➕ Yangi Kurs Qo'shish</button>
        `;
        document.getElementById('add-course-btn').addEventListener('click', () => openCourseModal('add'));
    }

    // Form submission
    courseForm.addEventListener('submit', handleFormSubmit);
    
    // Kurs kartochkalari harakatlari (edit/delete/manage)
    courseListEl.addEventListener('click', handleCourseActions);
}

// ---------------------------
// A. Ma'lumotlarni Yuklash
// ---------------------------
async function fetchCourses() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }

    // Rolega qarab API manzilini aniqlash
    let url = '/courses'; // Default: Barcha kurslar

    // Agar o'qituvchi yoki admin bo'lsa, faqat o'ziga tegishli kurslarni yuklash
    if (currentUserRole === 'teacher' || currentUserRole === 'admin') {
        url = '/courses/teacher/me'; 
    }
    // Eslatma: Talabalar uchun '/courses' qolishi mumkin, ammo bu sahifa faqat boshqaruv uchun.

    try {
        const response = await apiRequest(url, { // <-- Yangi URL ishlatiladi
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        loadingMessage.style.display = 'none';
        displayCourses(response.courses);

    } catch (error) {
        console.error('Kurslarni yuklashda xato:', error);
        loadingMessage.textContent = error.message || 'Kurslarni yuklashda xato yuz berdi.';
    }
}

// ---------------------------
// B. Ma'lumotlarni Ko'rsatish
// ---------------------------
function displayCourses(courses) {
    courseListEl.innerHTML = '';

    if (courses.length === 0) {
        courseListEl.innerHTML = '<p class="text-info">Hozircha kurslar mavjud emas.</p>';
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        card.innerHTML = `
            <h4>${course.title}</h4>
            <p>${course.description.substring(0, 100)}...</p>
            <p><strong>Narxi:</strong> ${course.price.toLocaleString('uz-UZ')} so'm</p>
            <p>O'qituvchi: ${course.teacher?.name || 'Noma\'lum'}</p>
            
            <div class="course-actions">
                <a href="../lesson-management/lesson-management.html?courseId=${course._id}" 
   class="action-btn manage-lessons-btn">📚 Darslarni Boshqarish</a>
                
                ${(currentUserRole === 'admin' || currentUserRole === 'teacher') ? `
                    <button class="action-btn edit-btn" data-id="${course._id}" 
                            data-title="${course.title}" data-desc="${course.description}" data-price="${course.price}">
                        ✏️ Tahrirlash
                    </button>
                    <button class="action-btn delete-btn" data-id="${course._id}">
                        🗑️ O'chirish
                    </button>
                ` : ''}
            </div>
        `;

        courseListEl.appendChild(card);
    });
}

// ---------------------------
// C. Formani Boshqarish
// ---------------------------

function openCourseModal(mode, course = null) {
    courseForm.reset();
    if (mode === 'add') {
        modalTitle.textContent = 'Yangi Kurs Qo\'shish';
        courseIdInput.value = '';
        priceInput.value = 0; // Default qiymat
    } else if (mode === 'edit' && course) {
        modalTitle.textContent = 'Kursni Tahrirlash';
        courseIdInput.value = course.id;
        titleInput.value = course.title;
        descriptionInput.value = course.description;
        priceInput.value = course.price;
    }
    courseModal.style.display = 'block';
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = courseIdInput.value;
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const price = parseInt(priceInput.value);

    const data = { title, description, price };
    const token = localStorage.getItem('userToken');
    
    let url = '/courses';
    let method = 'POST';

    if (id) { // Tahrirlash rejimi
        url = `/courses/${id}`;
        method = 'PUT';
    }

    try {
        const response = await apiRequest(url, {
            method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        alert(`Kurs muvaffaqiyatli ${id ? 'yangilandi' : 'yaratildi'}!`);
        courseModal.style.display = 'none';
        fetchCourses(); // Ro'yxatni yangilash

    } catch (error) {
        alert(error.message || `Kursni ${id ? 'yangilashda' : 'yaratishda'} xato yuz berdi.`);
        console.error('Kurs yaratish/tahrirlashda xato:', error);
    }
}

// ---------------------------
// D. Harakatlar (Tahrirlash/O'chirish)
// ---------------------------

async function handleCourseActions(e) {
    const target = e.target;
    const id = target.dataset.id;
    const token = localStorage.getItem('userToken');

    if (target.classList.contains('edit-btn')) {
        // Tahrirlash tugmasi
        const course = {
            id: id,
            title: target.dataset.title,
            description: target.dataset.desc,
            price: parseInt(target.dataset.price)
        };
        openCourseModal('edit', course);
    } else if (target.classList.contains('delete-btn')) {
        // O'chirish tugmasi
        if (!confirm('Haqiqatan ham bu kursni o\'chirmoqchimisiz? Kursga bog\'liq barcha darslar va progresslar ham o\'chiriladi!')) {
            return;
        }

        try {
            await apiRequest(`/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Kurs muvaffaqiyatli o\'chirildi.');
            fetchCourses();
        } catch (error) {
            alert(error.message || 'Kursni o\'chirishda xato yuz berdi.');
            console.error('Kursni o\'chirishda xato:', error);
        }
    }
}