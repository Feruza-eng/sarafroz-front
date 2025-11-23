// edu-web-frontend/review-tasks/review-tasks.js

import { apiRequest } from '../assets/js/api.js';

const tasksList = document.getElementById('tasks-list');
const loadingMessage = document.getElementById('loading-message');

document.addEventListener('DOMContentLoaded', fetchSubmittedTasks);

// O'qituvchi o'zining topshirilgan vazifalarini yuklash funksiyasi
async function fetchSubmittedTasks() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const response = await apiRequest('/reviews/tasks', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        loadingMessage.style.display = 'none';
        displayTasks(response.tasks);

    } catch (error) {
        console.error('Vazifalarni yuklashda xato:', error);
        loadingMessage.textContent = error.message || 'Vazifalarni yuklashda xato yuz berdi.';
    }
}

// Vazifalarni HTMLga joylash
function displayTasks(tasks) {
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="text-info">Tekshiriladigan yangi vazifalar mavjud emas.</p>';
        return;
    }

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        // Sana formatlash
        const submittedDate = new Date(task.submittedAt).toLocaleDateString('uz-UZ', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        card.innerHTML = `
            <div class="task-info">Kurs: ${task.course.title}</div>
            <div class="task-info">Talaba: ${task.user.name} (${task.user.email})</div>
            <h4>Dars: ${task.lesson.title}</h4>
            <div class="task-info">Topshirilgan: ${submittedDate}</div>
            
            <p><strong>Talabaning javobi:</strong></p>
            <div class="task-submission">${task.submission}</div>
            
            <button class="approve-btn" data-progress-id="${task._id}">✅ Tasdiqlash va Baholash</button>
        `;

        tasksList.appendChild(card);
    });
    
    // Tasdiqlash tugmalari uchun hodisa tinglovchisini qo'shish
    tasksList.addEventListener('click', handleTaskActions);
}

// Vazifalarni tasdiqlash mantiqi
async function handleTaskActions(e) {
    if (!e.target.classList.contains('approve-btn')) return;

    const progressId = e.target.dataset.progressId;
    const token = localStorage.getItem('userToken');
    
    if (!confirm("Haqiqatan ham bu vazifani tasdiqlab, 'Completed' holatiga o'tkazmoqchimisiz?")) {
        return;
    }

    try {
        e.target.textContent = 'Yuklanmoqda...';
        e.target.disabled = true;

        const response = await apiRequest(`/reviews/tasks/${progressId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        alert(response.message);
        
        // Vazifalar ro'yxatini yangilash
        await fetchSubmittedTasks(); 

    } catch (error) {
        console.error('Tasdiqlashda xato:', error);
        alert(error.message || 'Vazifani tasdiqlashda xato yuz berdi.');
        e.target.textContent = '❌ Xato yuz berdi';
        e.target.disabled = false;
    }
}