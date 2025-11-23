// edu-web-frontend/teacher-panel/teacher-panel.js

import { apiRequest } from '../assets/js/api.js'; // apiRequest ni import qilish shart

const token = localStorage.getItem('userToken');
const submissionListContainer = document.getElementById('submissions-list-container');
const submissionCountEl = document.getElementById('submission-count');
const modal = document.getElementById('feedback-modal');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const closeBtn = document.getElementById('close-modal-btn');

let currentSubmissionId = null; 

document.addEventListener('DOMContentLoaded', initializeTeacherPanel);
approveBtn.addEventListener('click', () => handleSubmissionReview('approved')); // 🔥 Yangilandi
rejectBtn.addEventListener('click', () => handleSubmissionReview('rejected')); // 🔥 Yangilandi
closeBtn.addEventListener('click', () => modal.style.display = 'none');


// 1. Panelni yuklash
async function initializeTeacherPanel() {
    if (!token) {
        alert("Avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }
    
    // Test uchun avtorizatsiyadan o'tganingizga ishonch hosil qiling
    // O'qituvchi emas, balki talaba sifatida kirgan bo'lsangiz, API xato beradi.
    await fetchPendingSubmissions();
}


// 2. Vazifalar ro'yxatini Backenddan olish
async function fetchPendingSubmissions() {
    try {
        const response = await apiRequest('/submissions/teacher/pending', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const submissions = response.submissions || [];
        submissionCountEl.textContent = submissions.length;
        
        renderSubmissionsList(submissions);

    } catch (error) {
        console.error("Vazifalarni yuklashda xato:", error);
        submissionListContainer.innerHTML = '<p class="error">Tekshirilmagan vazifalarni yuklashda xato yuz berdi.</p>';
    }
}


// 3. Vazifalar ro'yxatini HTMLda ko'rsatish
function renderSubmissionsList(submissions) {
    submissionListContainer.innerHTML = '';
    
    if (submissions.length === 0) {
        submissionListContainer.innerHTML = '<p>Hozircha tekshirilmagan vazifalar mavjud emas. ✅</p>';
        return;
    }

    submissions.forEach(submission => {
        // Submission obyektida Lesson obyektiga kirishda ehtiyot bo'ling
        const lessonTitle = submission.lesson ? `${submission.lesson.order}. ${submission.lesson.title}` : 'Dars nomi topilmadi';
        const studentName = submission.user ? submission.user.name : 'Talaba nomi topilmadi';
        
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.innerHTML = `
            <h4>Dars: ${lessonTitle}</h4>
            <p>Talaba: <strong>${studentName}</strong> (${submission.user.email})</p>
            <p>Topshirilgan sana: ${new Date(submission.createdAt).toLocaleString()}</p>
            <p>Status: <span class="status ${submission.status}">${submission.status}</span></p>
            <button class="review-btn" data-submission-id="${submission._id}" 
                data-lesson-title="${lessonTitle}" 
                data-student-name="${studentName}"
                data-submission-text="${submission.submissionText}">
                Ko'rib chiqish
            </button>
        `;
        
        submissionListContainer.appendChild(card);
    });
    
    // Har bir "Ko'rib chiqish" tugmasiga listener qo'shish
    document.querySelectorAll('.review-btn').forEach(button => {
        button.addEventListener('click', openReviewModal);
    });
}


// 4. Modalni ochish va ma'lumotlarni to'ldirish
function openReviewModal(e) {
    const btn = e.target;
    currentSubmissionId = btn.dataset.submissionId;
    
    document.getElementById('modal-lesson-title').textContent = btn.dataset.lessonTitle;
    document.getElementById('modal-student-name').textContent = btn.dataset.studentName;
    document.getElementById('modal-submission-text').textContent = btn.dataset.submissionText; // Vazifa matni
    
    // Eski feedback va bahoni tozalash
    document.getElementById('grade-input').value = 100;
    document.getElementById('feedback-input').value = '';
    
    modal.style.display = 'flex'; // Modalni ko'rsatish
}


// 5. Vazifani tasdiqlash yoki rad etish
async function handleSubmissionReview(status) { // 🔥 Funksiya nomi va parametrni o'zgartirdik
    if (!currentSubmissionId) return;
    
    const grade = document.getElementById('grade-input').value;
    const feedback = document.getElementById('feedback-input').value;
    
    // Faqat tasdiqlashda bahoni tekshirish
    if (status === 'approved' && (!grade || grade < 0 || grade > 100)) {
        alert("Iltimos, 0 dan 100 gacha bo'lgan to'g'ri baho kiriting.");
        return;
    }
    
    // 🔥 Yangi marshrutga moslash
    const url = `/submissions/review/${currentSubmissionId}`; 

    try {
        const response = await apiRequest(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                grade: (status === 'approved' ? grade : 0),
                feedback: feedback,
                status: status // 🔥 status ni Backendga yuboramiz
            })
        });

        alert(response.message); // Backenddan kelgan xabarni ko'rsatish
        
        modal.style.display = 'none';
        await fetchPendingSubmissions(); // Ro'yxatni yangilash

    } catch (error) {
        console.error("Vazifani baholashda xato:", error);
        alert(`❌ Xato: Vazifani baholashda xato yuz berdi. Konsolni tekshiring.`);
    }
}


// async function handleApproval(action) {
//     if (!currentSubmissionId) return;
    
//     const grade = document.getElementById('grade-input').value;
//     const feedback = document.getElementById('feedback-input').value;

//     if (action === 'approved' && (!grade || grade < 0 || grade > 100)) {
//         alert("Iltimos, 0 dan 100 gacha bo'lgan to'g'ri baho kiriting.");
//         return;
//     }
    
//     const url = `/submissions/approve/${currentSubmissionId}`; // Bizning Backend marshrutimiz

//     try {
//         const response = await apiRequest(url, {
//             method: 'PUT',
//             headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 grade: (action === 'approved' ? grade : 0), // Rad etishda baho 0 bo'lishi mumkin
//                 feedback: feedback 
//             })
//         });

//         alert(`Vazifa muvaffaqiyatli ${action === 'approved' ? 'tasdiqlandi' : 'rad etildi'}. Talaba progressi yangilandi.`);
        
//         // Modalni yopish va ro'yxatni yangilash
//         modal.style.display = 'none';
//         await fetchPendingSubmissions();

//     } catch (error) {
//         console.error("Vazifani tasdiqlashda xato:", error);
//         alert(`❌ Xato: Vazifani ${action} qilishda xato yuz berdi. Konsolni tekshiring.`);
//     }
// }