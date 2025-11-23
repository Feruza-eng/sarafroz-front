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
let enrolledCourseIds = []; // <<<<<< MUHIM QO'SHIMCHA: Bo'sh massiv sifatida e'lon qiling

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
        
        // FQ'AT TALABALAR UCHUN: Ro'yxatdan o'tilgan kurslar IDlarini olish
        if (currentUserRole === 'student') {
            await fetchEnrolledCourseIds(token); // YANGI FUNKSIYANI CHAQRIRAMIZ
        }

        await fetchAllCourses(token);
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

// Ro'yxatdan o'tilgan kurslarning ID larini Backenddan yuklash
async function fetchEnrolledCourseIds(token) {
    try {
        const response = await apiRequest('/enroll/my-courses', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // FQ'AT KURS ID'LARINI SAQLAYMIZ
        // MUHIM TEKSHIRUV: Agar 304 kelib bo'sh obyekt qaytgan bo'lsa yoki 'courses' topilmasa
        if (response && response.courses && Array.isArray(response.courses)) {
            enrolledCourseIds = response.courses.map(course => course._id);
        } else {
            // Agar javobda kurslar ro'yxati bo'lmasa yoki 304 bo'lsa, ro'yxatni bo'sh qoldiramiz
            enrolledCourseIds = [];
        }
        
        // Faqat kurs ID'larini saqlaymiz
        enrolledCourseIds = response.courses.map(course => course._id);
        
    } catch (error) {
        console.error("Ro'yxatdan o'tilgan kurslarni yuklashda xato:", error);
        // MUHIM: Xatoning nomi va xabari
        console.error("Xato tafsiloti:", error.name, error.message); 
        enrolledCourseIds = [];
        
        // Xatoni yuqoriga qayta tashlaymiz. 
                // Sababi: Agar bu API chaqirig'ida Avtorizatsiya xatosi bo'lsa, 
                // butun sahifa to'xtashi va login sahifasiga o'tkazilishi to'g'ri.
                // Hozirgi holatda bu yordamchi funksiya bo'lgani uchun, xatoni tashlab yuboramiz.
                throw error; // <<<< BU QATORNI QO'SHI 
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
// edu-web-frontend/courses/courses.js (displayCourses funksiyasining ichida)

function displayCourses(courses) {
    coursesList.innerHTML = ''; 

    if (courses.length === 0) {
        coursesList.innerHTML = '<p>Hozircha kurslar mavjud emas.</p>';
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        const isOwner = course.teacher._id === currentUserId; 
        
        // 1. Asosiy HTMLni o'rnatamiz
        card.innerHTML = `
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <div class="teacher">O'qituvchi: ${course.teacher.name} (${course.teacher.role})</div>
            <div class="price">$${course.price.toFixed(2)}</div>
        `;

        // 2. ActionsDiv elementini yaratamiz
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'course-actions';

        // 3. ActionsDiv ichiga tugmalarni qo'shamiz (bu qismi sizda to'g'ri yozilgan)
        // ------------------------------------------
        // TUGMALAR MANTIQI: Rolga Asoslangan Boshqaruv
        // ------------------------------------------
        
        // A. Tahrirlash va Boshqaruv tugmalari (Faqat Admin yoki Kursning O'qituvchisi uchun)
        if (currentUserRole === 'admin' || (currentUserRole === 'teacher' && isOwner)) {
            
            // --- Tahrirlash tugmasi ---
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Kursni Tahrirlash';
            editBtn.dataset.courseId = course._id;
            editBtn.dataset.action = 'edit';
            actionsDiv.appendChild(editBtn);

            // --- Material Qo'shish/Darslarni Boshqarish tugmasi (YANGI) ---
            const manageBtn = document.createElement('button');
            manageBtn.className = 'manage-btn';
            manageBtn.textContent = '📚 Darslarni Boshqarish'; 
            manageBtn.dataset.courseId = course._id;
            manageBtn.dataset.action = 'manage'; 
            actionsDiv.appendChild(manageBtn);

            // --- O'chirish tugmasi ---
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'O\'chirish';
            deleteBtn.dataset.courseId = course._id;
            deleteBtn.dataset.action = 'delete';
            actionsDiv.appendChild(deleteBtn);
            
        } 
        
        // B. Kursga yozilish (Faqat Talabalar uchun / Yoki O'qituvchi boshqaning kursiga yozilsa)
        if (currentUserRole === 'student' || (currentUserRole === 'teacher' && !isOwner)) {
            const isEnrolled = enrolledCourseIds.includes(course._id);
            const button = document.createElement('button');
            button.className = isEnrolled ? 'enrolled-btn' : 'enroll-btn';
            button.textContent = isEnrolled ? '✅ Ro\'yxatdan O\'tilgan' : 'Kursga Yozilish';
            button.disabled = isEnrolled;
            
            if (!isEnrolled) {
                button.dataset.courseId = course._id;
                button.dataset.action = 'enroll';
            }
            actionsDiv.appendChild(button);
        }

        // 4. ActionsDiv'ni asosiy card'ga qo'shamiz!
        card.appendChild(actionsDiv); 
        
        // 5. Card'ni ro'yxatga qo'shamiz
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

// Kursga ro'yxatdan o'tish (Enroll) funksiyasi
async function handleEnroll(courseId, token) {
    // Qo'shimcha tekshiruv: Talaba kursga yozilishni tasdiqlasin
    if (!confirm("Siz ro'yxatdan o'tishni tasdiqlaysizmi?")) {
        return;
    }

    try {
        const response = await apiRequest(`/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId }) // Backendga faqat kurs ID'sini yuboramiz
        });

        alert(response.message || "Kursga muvaffaqiyatli ro'yxatdan o'tildi!");
        
        // Ro'yxatdan o'tgandan so'ng, kurslar ro'yxatini yangilash zarur bo'lmasa-da, 
        // keyinchalik "Ro'yxatdan o'tish" tugmasini "Ro'yxatdan o'tilgan" qilish uchun foydali
        await fetchAllCourses(token);
        addActionListeners();

    } catch (error) {
        console.error('Kursga yozilishda xato:', error);
        alert(error.message || 'Kursga yozilishda xato yuz berdi. Balki siz allaqachon ro\'yxatdan o\'tgandirsiz.');
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
// courses/courses.js (handleCourseActions funksiyasi)

async function handleCourseActions(e) {
    // 1. Agar bosilgan element tugma bo'lmasa, chiqib ketamiz
    if (!e.target.tagName === 'BUTTON') return;
    
    // 2. Kerakli ma'lumotlarni yagona atributdan olamiz
    const action = e.target.dataset.action;
    const courseId = e.target.dataset.courseId; // Biz loyihada asosan shu atributni ishlatdik

    if (!action || !courseId) {
        console.error("Harakat turi yoki Kurs ID'si topilmadi.");
        return;
    }
    
    const token = localStorage.getItem('userToken');

    // 3. Action turiga qarab mantiqni chaqiramiz
    if (action === 'enroll') {
        // Enroll mantiqi (avvalgi loyihangizdan)
        handleEnroll(courseId, token);
        
    } else if (action === 'edit') {
        // Kurs ma'lumotlarini tahrirlash mantiqi
        handleEdit(courseId, token); 
        
    } else if (action === 'delete') {
        // Kursni o'chirish mantiqi
        handleDelete(courseId, token);
        
    } else if (action === 'manage') { 
        // Dars materiallarini boshqarish sahifasiga o'tish
        window.location.href = `../course-manager/course-manager.html`;
    }
}

// ESLATMA: Iltimos, barcha tugmalaringizda faqat bitta atributni ishlating: data-course-id="[ID]"
// (e.target.dataset.id o'rniga faqat e.target.dataset.courseId ishlatilishi kerak)


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
