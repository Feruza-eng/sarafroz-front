// edu-web-frontend/lesson-view/lesson-view.js

import { apiRequest } from '../assets/js/api.js';

const courseTitleEl = document.getElementById('course-title');
const lessonListEl = document.getElementById('lesson-list');
const lessonTitleEl = document.getElementById('lesson-title');
const lessonContentEl = document.getElementById('lesson-content');
const taskSubmissionBoxEl = document.getElementById('task-submission-box');
const submissionInputEl = document.getElementById('task-solution'); // HTML dan to'g'ri ID
const submitTaskBtn = document.getElementById('submit-task-btn');
const submissionMessageEl = document.getElementById('submission-message');
let currentCourseId = null;
let allLessons = [];
let currentLessonId = null;
const token = localStorage.getItem('userToken');

document.addEventListener('DOMContentLoaded', initializeLessonView);
submitTaskBtn.addEventListener('click', handleSubmitTask); // Vazifa topshirish uchun listener

// URL dan courseId'ni oluvchi funksiya
function getCourseIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('courseId');
}

// ... (initializeLessonView va fetchCourseAndLessons funksiyalari avvalgidek qoladi) ...

async function initializeLessonView() {
    if (!token) {
        alert("Avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }

    currentCourseId = getCourseIdFromUrl();
    if (!currentCourseId) {
        lessonContentEl.innerHTML = '<p class="error">Kurs ID si topilmadi.</p>';
        return;
    }
    
    // 1. Kurs va Darslarni yuklash
    await fetchCourseAndLessons(currentCourseId);
    
    // 2. Birinchi darsni yuklash (agar mavjud bo'lsa)
    if (allLessons.length > 0) {
        displayLessonContent(allLessons[0]);
    }
}


async function fetchCourseAndLessons(courseId) {
    try {
        // Kurs ma'lumotlarini olish
        const courseResponse = await apiRequest(`/courses/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        courseTitleEl.textContent = courseResponse.course.title;

        // Darslar ro'yxatini olish
        const lessonsResponse = await apiRequest(`/lessons/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        allLessons = lessonsResponse.lessons || [];
        renderLessonList(allLessons);

    } catch (error) {
        console.error("Darslarni yuklashda xato:", error);
        lessonContentEl.innerHTML = '<p class="error">Kurs ma\'lumotlarini yuklashda xato yuz berdi.</p>';
    }
}


// Chap panelda darslar ro'yxatini ko'rsatish
function renderLessonList(lessons) {
    lessonListEl.innerHTML = '';
    
    lessons.forEach(lesson => {
        const li = document.createElement('li');
        
        // --- Kontent turini aniqlash mantiqi (Taxmin qilinmoqda) ---
        let contentType = '';
        if (lesson.videoUrl) contentType = 'Video';
        else if (lesson.taskDescription) contentType = 'Vazifa';
        else if (lesson.documentationUrl) contentType = 'Qo\'llanma';
        // -----------------------------------------------------------

        let icon = '';
        
        if (lesson.isLocked) {
            // 🔒 Qulflangan Dars (Backenddan isLocked: true kelgan)
            icon = '🔒';
            li.classList.add('locked-lesson', 'locked'); 
            li.title = "Oldingi darsni tugating.";
        } else {
            // ✅ Ochiq Dars (Backenddan isLocked: false kelgan)
            const progressStatus = lesson.progressStatus;
            
            li.classList.add('unlocked'); // Ochiq bo'lishi shart
            
            switch (progressStatus) {
                case 'completed':
                case 'approved': // Agar Backendda 'approved' statusi bo'lsa
                    icon = '✅'; 
                    li.classList.add('completed');
                    break;
                case 'submitted':
                    icon = '⏳'; // Vazifa topshirilgan (Tekshirilmoqda)
                    break;
                case 'started':
                    icon = '▶️'; // Boshlangan
                    break;
                default: // 'locked' yoki undefined kelgan bo'lsa (1-dars uchun bu holat bo'ladi)
                    icon = '💡'; 
                    break;
            }
        }

        // Kontent turi nomini to'g'ri ko'rsatish
        li.innerHTML = `${icon} ${lesson.order}. ${lesson.title} [${contentType}]`; 
        li.dataset.lessonId = lesson._id;
        
        // Bosish mantiqi faqat qulflanmagan darslar uchun
        if (!lesson.isLocked) {
            li.addEventListener('click', () => {
                displayLessonContent(lesson);
            });
        }
        
        lessonListEl.appendChild(li);
    });
}

// ----------------------------------------------------------------------
// ASOSIY YANGILANISH: BARCHA MA'LUMOTLARNI BIR VAZTDA KO'RSATISH
// ----------------------------------------------------------------------

/**
 * Tanlangan darsning barcha mavjud kontentini asosiy maydonda ko'rsatish
 * (If/else o'rniga ketma-ket qo'shish)
 * @param {object} lesson - Dars ma'lumotlari obyekti
 */
    // ... (displayLessonContent funksiyasining boshlanishi) ...

async function displayLessonContent(lesson) {
    // Avvalgi tanlangan darsning highlightini olib tashlash
    document.querySelectorAll('#lesson-list li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Joriy darsni highlight qilish
    document.querySelector(`[data-lesson-id="${lesson._id}"]`).classList.add('active');
    
    lessonTitleEl.textContent = lesson.title;
    currentLessonId = lesson._id; // Vazifa topshirish uchun ID ni saqlash

    // Dars qulflangan bo'lsa...
    if (lesson.isLocked) {
        lessonContentEl.innerHTML = '<p class="error">Bu dars hali qulflangan. Oldingi vazifani yakunlang.</p>';
        taskSubmissionBoxEl.style.display = 'none'; // Vazifa topshirish qutisini yashirish
        return; 
    }

    // 1. Darsni boshlash (Progress yaratish) mantiqi... (oldingidek qolsin)
    if (lesson.progressStatus === 'locked' && !lesson.isLocked) {
         // ... (try/catch bloklari) ...
         try {
            await apiRequest('/progress', { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId: lesson._id, courseId: currentCourseId }) // currentCourseId ni ishlatish
            });
            // Statusni yangilash
            lesson.progressStatus = 'started'; 
            // Dars ro'yxatini tez yangilash
            await fetchCourseAndLessons(currentCourseId); 
        } catch (error) {
            console.error('Progress yaratishda xato:', error);
        }
    }

    // ----------------------------------------------------------------------
    // 🔥🔥 ASOSIY KONTENTNI CHIQARISH MANTIQI 🔥🔥
    // ----------------------------------------------------------------------
    let contentHTML = '';

    // A. Video kontentni qo'shish (Agar video mavjud bo'lsa)
    if (lesson.videoUrl) {
        // Iltimos, video URL ni to'g'ri iframe manziliga aylantiring (masalan, YouTube uchun)
        // Hozircha oddiy iframe ishlatamiz.
        contentHTML += `
            <div class="lesson-video">
                <h3>Video dars</h3>
                <iframe width="100%" height="400" src="${lesson.videoUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }

    // B. Dokumentatsiya (Qo'llanma) kontentni qo'shish
    if (lesson.documentationUrl) {
        contentHTML += `
            <div class="lesson-documentation">
                <h3>Qo'llanma va materiallar</h3>
                <p>Qo'shimcha material: <a href="${lesson.documentationUrl}" target="_blank">Qo'llanmani ochish</a></p>
            </div>
        `;
    }

    // C. Vazifa tavsifi (Task Description) kontentni qo'shish
    if (lesson.taskDescription) {
        contentHTML += `
            <div class="lesson-task-description">
                <h3>Vazifa tavsifi</h3>
                <p>${lesson.taskDescription}</p>
        `;
        // Agar vazifa fayli mavjud bo'lsa
        if (lesson.taskFileUrl) {
             contentHTML += `<p>Vazifa fayli: <a href="${lesson.taskFileUrl}" target="_blank">Faylni yuklab olish</a></p>`;
        }
        contentHTML += `</div>`;
        
        // Agar darsda vazifa bo'lsa, topshirish maydonini ko'rsatamiz.
        taskSubmissionBoxEl.style.display = 'block'; 
        
        // Submission maydonining holatini yangilash
        if (lesson.progressStatus === 'submitted') {
             submissionMessageEl.textContent = '⏳ Vazifa topshirilgan. O\'qituvchi tekshirishini kuting.';
             submitTaskBtn.disabled = true;
             submissionInputEl.disabled = true;
        } else if (lesson.progressStatus === 'completed' || lesson.progressStatus === 'approved') {
             submissionMessageEl.textContent = '✅ Vazifa muvaffaqiyatli yakunlandi.';
             submitTaskBtn.disabled = true;
             submissionInputEl.disabled = true;
        } else {
             submissionMessageEl.textContent = '';
             submitTaskBtn.disabled = false;
             submissionInputEl.disabled = false;
        }

    } else {
        // Agar darsda vazifa bo'lmasa, topshirish maydonini yashiramiz
        taskSubmissionBoxEl.style.display = 'none';
    }

    // Nihoyat, HTMLni asosiy kontent elementiga joylashtirish
    lessonContentEl.innerHTML = contentHTML;
}

















// async function displayLessonContent(lesson) {























//     // ... (boshlang'ich kodlar) ...

//     // Dars qulflangan bo'lsa, kontentni ko'rsatmaslik.
//     // Eslatma: Backend qulflangan dars kontentini o'chirib yuboradi, bu faqat xavfsizlik uchun.
//     if (lesson.isLocked) {
//         lessonContentEl.innerHTML = '<p class="error">Bu dars hali qulflangan. Oldingi vazifani yakunlang.</p>';
//         return; 
//     }
    
//     // 1. Darsni boshlash (Progress yaratish)
//     // Agar dars "unlocked" bo'lsa, uni "started" ga o'tkazamiz
//     if (lesson.progressStatus === 'locked' && !lesson.isLocked) {
//         try {
//             await apiRequest('/progress', { 
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ lessonId: lesson._id, courseId: currentCourseId }) // currentCourseId ni ishlatish
//             });
//             // Statusni yangilash
//             lesson.progressStatus = 'started'; 
//             // Dars ro'yxatini tez yangilash
//             await fetchCourseAndLessons(currentCourseId); 
//         } catch (error) {
//             console.error('Progress yaratishda xato:', error);
//         }
//     }
    
//     // ... (Barcha kontentni ko'rsatish mantiqi) ...
// }

// ----------------------------------------------------------------------
// VAZIFA TOPSHIRISH MANTIQI
// ----------------------------------------------------------------------

async function handleSubmitTask() {
    if (!currentLessonId) {
        submissionMessageEl.textContent = 'Xato: Dars ID si topilmadi.';
        return;
    }
    
    const submissionText = submissionInputEl.value.trim();
    if (submissionText === '') {
        submissionMessageEl.textContent = 'Iltimos, vazifa yechimi manzilini yoki matnini kiriting.';
        return;
    }

    try {
        submissionMessageEl.textContent = 'Vazifa yuborilmoqda...';
        
        const data = {
            lessonId: currentLessonId,
            submissionText: submissionText,
            // courseId: currentCourseId, // Bu ham kerak bo'lishi mumkin
        };

        // Backendda Submission yaratish uchun API so'rovi
        const response = await apiRequest('/submissions', { // Sizning submission endpointingiz
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        submissionMessageEl.textContent = `✅ Vazifa muvaffaqiyatli topshirildi. Status: ${response.submission?.status || 'Tekshirilmoqda'}.`;
        submissionInputEl.value = ''; // Inputni tozalash
        
        // Dars ro'yxatini yangilash orqali statusni ko'rsatish
        // await fetchCourseAndLessons(currentCourseId); 

    } catch (error) {
        console.error('Vazifani topshirishda xato:', error);
        submissionMessageEl.textContent = `❌ Vazifani topshirishda xato: ${error.message || 'Server xatosi'}`;
    }
}