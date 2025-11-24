// edu-web-frontend/teacher-panel/teacher-panel.js

import { apiRequest } from '../assets/js/api.js'; // apiRequest ni import qilish shart

const token = localStorage.getItem('userToken');
const submissionListContainer = document.getElementById('submissions-list-container');
const submissionCountEl = document.getElementById('submission-count');
const modal = document.getElementById('feedback-modal');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const closeBtn = document.getElementById('close-modal-btn');
const reviewModalForm = document.getElementById('review-modal-form'); // Modal ichidagi formani olish
const submissionDataMap = new Map(); // 🔥 Submission ob'ektlarini saqlash uchun Map

let currentSubmissionId = null; 

document.addEventListener('DOMContentLoaded', initializeTeacherPanel);
approveBtn.addEventListener('click', () => handleSubmissionReview('approved'));
rejectBtn.addEventListener('click', () => handleSubmissionReview('rejected'));
closeBtn.addEventListener('click', () => modal.style.display = 'none');
// reviewModalForm.addEventListener('submit', (e) => e.preventDefault()); // Agar form ishlatilsa.


// 1. Panelni yuklash
async function initializeTeacherPanel() {
    if (!token) {
        alert("Avtorizatsiyadan o'ting.");
        window.location.href = '../login/login.html';
        return;
    }
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
        
        // 🔥 Ma'lumotlarni Mapga saqlash
        submissionDataMap.clear();
        submissions.forEach(sub => submissionDataMap.set(sub._id, sub));
        
        renderSubmissionsList(submissions);

    } catch (error) {
        console.error("Vazifalarni yuklashda xato:", error);
        submissionListContainer.innerHTML = '<p class="error">Tekshirilmagan vazifalarni yuklashda xato yuz berdi. Konsolni tekshiring.</p>';
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
        const lessonTitle = submission.lesson ? `${submission.lesson.order}. ${submission.lesson.title}` : 'Dars nomi topilmadi';
        const studentName = submission.user ? submission.user.name : 'Talaba nomi topilmadi';
        
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.innerHTML = `
            <h4>Dars: ${lessonTitle}</h4>
            <p>Talaba: <strong>${studentName}</strong> (${submission.user.email})</p>
            <p>Topshirilgan sana: ${new Date(submission.createdAt).toLocaleString()}</p>
            <p>Status: <span class="status ${submission.status}">${submission.status}</span></p>
            <button class="review-btn" data-submission-id="${submission._id}">
                Ko'rib chiqish
            </button>
        `;
        
        submissionListContainer.appendChild(card);
    });
    
    // Har bir "Ko'rib chiqish" tugmasiga listener qo'shish
    document.querySelectorAll('.review-btn').forEach(button => {
        button.addEventListener('click', openReviewModal); // 🔥 Endi faqat ID orqali chaqiramiz
    });
}


// 4. Modalni ochish va ma'lumotlarni to'ldirish (YANGILANGAN)
function openReviewModal(e) {
    const btn = e.target;
    currentSubmissionId = btn.dataset.submissionId;

    // 🔥 MAP DAN TO'LIQ SUBMISSION OB'YEKTI OLISH
    const submission = submissionDataMap.get(currentSubmissionId);

    if (!submission) {
        console.error("Submission ma'lumotlari Mapda topilmadi.");
        return;
    }
    
    document.getElementById('modal-lesson-title').textContent = submission.lesson.title;
    document.getElementById('modal-student-name').textContent = submission.user.name;

    // 🔥 SUBMISSION KONTENTINI FAYLGA MOSLASH VA MODALGA JOYLASHTIRISH
    const submissionContentEl = document.getElementById('modal-submission-text'); // Eski nomini ishlatamiz

    let contentHTML = '';
    
    // Asosiy server manzilini olish (Hozirgi holatda localhost:5000)
    const baseUrl = 'http://localhost:5000'; 
    
    // Agar submissionUrl mavjud bo'lsa
    if (submission.submissionUrl) {
        const fileUrl = baseUrl + submission.submissionUrl;
        const fileName = submission.submissionUrl.split('/').pop();

        contentHTML += `<h4>Topshirilgan fayl/link:</h4>`;
        contentHTML += `<p class="submission-file-info">
                            <a href="${fileUrl}" target="_blank" download class="download-link">
                                ⬇️ Faylni Yuklab Olish (${fileName})
                            </a>
                        </p>`;
    } else {
         contentHTML += `<p>Talaba fayl yuklamagan. Eski matn/link: ${submission.submissionText || 'Mavjud emas'}</p>`;
    }
    
    // Agar talaba kommentariya yozgan bo'lsa (submissionComment modelga qo'shilgan)
    if (submission.submissionComment) {
         contentHTML += `<h4>Talaba Izohi:</h4>`;
         contentHTML += `<p class="comment-text">${submission.submissionComment}</p>`;
    }

    submissionContentEl.innerHTML = contentHTML;

    // Eski feedback va bahoni tozalash
    document.getElementById('grade-input').value = submission.grade || 100;
    document.getElementById('feedback-input').value = submission.feedback || '';
    
    modal.style.display = 'flex'; // Modalni ko'rsatish
}


// 5. Vazifani tasdiqlash yoki rad etish
async function handleSubmissionReview(status) {
    if (!currentSubmissionId) return;
    
    const grade = document.getElementById('grade-input').value;
    const feedback = document.getElementById('feedback-input').value;
    
    // Faqat tasdiqlashda bahoni tekshirish
    if (status === 'approved' && (!grade || grade < 0 || grade > 100)) {
        alert("Iltimos, 0 dan 100 gacha bo'lgan to'g'ri baho kiriting.");
        return;
    }
    
    const url = `/submissions/review/${currentSubmissionId}`; 

    try {
        // Baho rad etishda 0, tasdiqlashda kiritilgan baho bo'lsin
        const finalGrade = status === 'approved' ? grade : 0;

        const response = await apiRequest(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                grade: finalGrade,
                feedback: feedback,
                status: status 
            })
        });

        alert(response.message); 
        
        modal.style.display = 'none';
        await fetchPendingSubmissions(); 

    } catch (error) {
        console.error("Vazifani baholashda xato:", error);
        alert(`❌ Xato: Vazifani baholashda xato yuz berdi. Konsolni tekshiring.`);
    }
}