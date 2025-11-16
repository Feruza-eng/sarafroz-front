import { apiRequest } from '../assets/js/api.js';

const coursesList = document.getElementById('courses-list');
const loadingMessage = document.getElementById('loading-message');
const addCourseBtn = document.getElementById('add-course-btn');
const createFormContainer = document.getElementById('create-form-container');
const createCourseForm = document.getElementById('create-course-form');
const cancelCreateBtn = document.getElementById('cancel-create-btn');

// ... (mavjud constlar) ...

const editFormContainer = document.getElementById('edit-form-container'); // YANGI
const editCourseForm = document.getElementById('edit-course-form');       // YANGI
const cancelEditBtn = document.getElementById('cancel-edit-btn');         // YANGI

document.addEventListener('DOMContentLoaded', fetchCoursesAndCheckRole);

// Global o'zgaruvchilar
let currentUserRole = 'student'; 
let currentUserId = null; // YANGI: Tizimga kirgan foydalanuvchining ID'si

// Boshlanish funksiyasi (Loyihaning asosiy kirish nuqtasi)
async function fetchCoursesAndCheckRole() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        alert("Iltimos, avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }
    
    // Foydalanuvchi rolini olish va kurslarni yuklash
    try {
        await checkUserRole(token);
        await fetchAllCourses(token);
        // Kurslar yuklangandan keyin o'chirish/tahrirlash uchun tinglovchilarni qo'shamiz
        addActionListeners(); 
    } catch (error) {
        // Agar token yaroqsiz bo'lsa, login sahifasiga o'tkazish
        console.error("Kurslarni yuklashda xato:", error);
        alert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.");
        localStorage.removeItem('userToken');
        window.location.href = '../login/login.html';
    }
}

// 1. Foydalanuvchi rolini tekshirish
async function checkUserRole(token) {
    const profileResponse = await apiRequest('/users/profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    currentUserRole = profileResponse.user.role;
    currentUserId = profileResponse.user._id; // ID ni global o'zgaruvchiga saqlaymiz!
    
    if (currentUserRole === 'admin' || currentUserRole === 'teacher') {
        addCourseBtn.style.display = 'block';
    }
}


// 2. Barcha kurslarni Backenddan yuklash
async function fetchAllCourses(token) {
    try {
        const response = await apiRequest('/courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        loadingMessage.style.display = 'none';
        displayCourses(response.courses);
        
    } catch (error) {
        loadingMessage.textContent = 'Kurslarni yuklashda xato yuz berdi.';
        console.error('Kurslar API xatosi:', error);
    }
}

// 3. Kurslarni HTMLga joylash
function displayCourses(courses) {
    coursesList.innerHTML = ''; // Eski ma'lumotlarni tozalash

    if (courses.length === 0) {
        coursesList.innerHTML = '<p>Hozircha kurslar mavjud emas.</p>';
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        // EGALIKNI TEKSHIRISHNI TUZATISH: Endi currentUserId dan foydalanamiz
        const isOwner = course.teacher._id === currentUserId; 
        
        card.innerHTML = `
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <div class="teacher">O'qituvchi: ${course.teacher.name} (${course.teacher.role})</div>
            <div class="price">$${course.price.toFixed(2)}</div>
            ${currentUserRole === 'admin' || isOwner ? 
                `<div class="course-actions">
                    <button class="edit-btn" data-id="${course._id}">Tahrirlash</button>
                    <button class="delete-btn" data-id="${course._id}">O'chirish</button>
                </div>` 
                : ''}
        `;
        coursesList.appendChild(card);
    });
}

// 4. Kurs yaratish formasi funksiyasi
addCourseBtn.addEventListener('click', () => {
    createFormContainer.style.display = 'block';
    addCourseBtn.style.display = 'none';
});

cancelCreateBtn.addEventListener('click', () => {
    createFormContainer.style.display = 'none';
    addCourseBtn.style.display = 'block';
    createCourseForm.reset();
});

createCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');

    const courseData = {
        title: document.getElementById('course-title').value,
        description: document.getElementById('course-description').value,
        price: parseFloat(document.getElementById('course-price').value),
    };

    try {
        const response = await apiRequest('/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(courseData)
        });

        alert(`Kurs muvaffaqiyatli yaratildi: ${response.course.title}`);
        createFormContainer.style.display = 'none';
        addCourseBtn.style.display = 'block';
        createCourseForm.reset();
        
        // Kurslarni qayta yuklash va action listener'larni qayta qo'shish
        await fetchAllCourses(token); 
        addActionListeners();

    } catch (error) {
        console.error('Kurs yaratishda xato:', error);
        alert(error.message || 'Kurs yaratishda xato yuz berdi.');
    }
});


// --- YANGI FUNKSIYALAR: O'CHIRISH VA TAHRIRLASH ---

// Tugmachalarga hodisa tinglovchilarini qo'shish
function addActionListeners() {
    // Listener'ni faqat bir marta qo'yishni ta'minlash uchun, uni coursesList'ga qo'yamiz
    // va har safar chaqirilganda eskisini o'chirish o'rniga, u allaqachon mavjud bo'lishi mumkin.
    // DOMContentLoaded ichida bir marta chaqirilishi uni to'g'rilaydi.
    coursesList.removeEventListener('click', handleCourseActions); 
    coursesList.addEventListener('click', handleCourseActions);
}

// Barcha action tugmalari uchun bitta universal handler



// O'chirish (DELETE) funksiyasi
async function handleDelete(courseId, token) {
    if (!confirm("Haqiqatan ham bu kursni o'chirmoqchimisiz?")) {
        return;
    }

    try {
        await apiRequest(`/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        alert("Kurs muvaffaqiyatli o'chirildi.");
        
        // Kurslar ro'yxatini qayta yuklash
        await fetchAllCourses(token);
        addActionListeners(); // Qayta yuklangandan so'ng listener'larni yana qo'shamiz

    } catch (error) {
        console.error('Kursni o\'chirishda xato:', error);
        alert(error.message || 'Kursni o\'chirishda xato yuz berdi. Ruxsatlaringizni tekshiring.');
    }
}

// Tahrirlash modalini ochish, ma'lumotlarni yuklash va formani to'ldirish
async function handleEdit(courseId, token) {
    try {
        // 1. Backenddan kurs ma'lumotlarini olish
        const response = await apiRequest(`/courses/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const course = response.course;

        // 2. Formani ma'lumotlar bilan to'ldirish
        document.getElementById('edit-course-id').value = course._id;
        document.getElementById('edit-title').value = course.title;
        document.getElementById('edit-description').value = course.description;
        document.getElementById('edit-price').value = course.price.toFixed(2);
        document.getElementById('edit-ispublished').value = course.isPublished.toString(); // Boolean ni String'ga aylantirish

        // 3. Modalni ko'rsatish
        editFormContainer.style.display = 'block';

    } catch (error) {
        console.error('Kurs ma\'lumotlarini olishda xato:', error);
        alert('Kurs ma\'lumotlarini yuklab bo\'lmadi: ' + (error.message || 'Server xatosi'));
    }
}


// Edit tugmasini bosish handler'ini yangilash
async function handleCourseActions(e) {
    const token = localStorage.getItem('userToken');
        
    if (e.target.classList.contains('delete-btn')) {
        const courseId = e.target.dataset.id;
        handleDelete(courseId, token);
    } 
        
    if (e.target.classList.contains('edit-btn')) {
        const courseId = e.target.dataset.id;
        // ALERt o'rniga haqiqiy tahrirlash funksiyasini chaqiramiz
        handleEdit(courseId, token); 
    }
}


// Bekor qilish tugmasini bosish (Formani yashirish)
cancelEditBtn.addEventListener('click', () => {
    editFormContainer.style.display = 'none';
    editCourseForm.reset();
});


// Formani SUBMIT qilish (PUT so'rovini yuborish)
editCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');

    const courseId = document.getElementById('edit-course-id').value;
    
    // Tahrirlangan ma'lumotlarni yig'ish
    const updatedData = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        price: parseFloat(document.getElementById('edit-price').value),
        // String qiymatini Boolean qiymatiga aylantirish
        isPublished: document.getElementById('edit-ispublished').value === 'true'
    };

    try {
        const response = await apiRequest(`/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        alert(`Kurs muvaffaqiyatli yangilandi: ${response.course.title}`);
        editFormContainer.style.display = 'none'; // Formani yopish
        editCourseForm.reset();
        
        // Kurslar ro'yxatini qayta yuklash
        await fetchAllCourses(token);
        addActionListeners();

    } catch (error) {
        console.error('Kursni yangilashda xato:', error);
        alert(error.message || 'Kursni yangilashda xato yuz berdi. Ruxsatlaringizni tekshiring.');
    }
});
