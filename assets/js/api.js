// Backend API'ga ulanish uchun asosiy manzil
export const BASE_URL = 'http://localhost:5000/api';

/**
 * Umumiy API so'rov funksiyasi (qulaylik uchun)
 * @param {string} endpoint - /auth/login kabi API manzili
 * @param {object} options - fetch funksiyasi uchun konfiguratsiya (method, body, headers)
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, options);

        // Agar javob HTTP 400 yoki 500 bo'lsa, xatolikni tashlash
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP xatosi! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API so'rovida xato yuz berdi:", error.message);
        throw error;
    }
}