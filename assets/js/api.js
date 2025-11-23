// Backend API'ga ulanish uchun asosiy manzil
export const BASE_URL = 'http://localhost:5000/api';

/**
 * Umumiy API so'rov funksiyasi (qulaylik uchun)
 * @param {string} endpoint - /auth/login kabi API manzili
 * @param {object} options - fetch funksiyasi uchun konfiguratsiya (method, body, headers)
 */
// edu-web-frontend/assets/js/api.js

// export const BASE_URL = 'http://localhost:5000/api';

// export async function apiRequest(endpoint, options = {}) {
//     const url = `${BASE_URL}${endpoint}`;
//     try {
//         const response = await fetch(url, options);

//         // 1. Agar javob 400 yoki 500 statusida bo'lsa, xatolikni tashlash
//         if (!response.ok) {
//             let errorData;
            
//             // Javob JSON ekanligini tekshiramiz. Agar JSON bo'lmasa (masalan, HTML xato sahifasi),
//             // biz shunchaki status va statusText orqali xato chiqaramiz.
//             const contentType = response.headers.get('content-type');
            
//             if (contentType && contentType.includes('application/json')) {
//                 errorData = await response.json();
//             } else {
//                 // Agar JSON emas, masalan HTML bo'lsa
//                 const errorText = await response.text(); 
//                 throw new Error(`Server xatosi: ${response.status} ${response.statusText}. Tafsilotlar uchun konsolni tekshiring.`);
//             }
            
//             throw new Error(errorData.message || `HTTP xatosi! Status: ${response.status}`);
//         }

//         // 2. MUHIM QO'SHIMCHA: Agar javob tanasi (body) mavjud bo'lmasa (304, 204), bo'sh obyekt qaytarish
//         if (response.status === 204 || response.status === 304 || response.headers.get('content-length') === '0') {
//             // Agar 304 bo'lsa, keshdan foydalanish kerak, lekin API funksiyasi JSON kutayotgani uchun bo'sh obyekt qaytaramiz
//             return {}; 
//         }

//         // 3. Qolgan (200, 201) muvaffaqiyatli javoblarni JSON formatida qaytarish
//         return await response.json();
        
//     } catch (error) {
//         console.error("API so'rovida xato yuz berdi:", error.message);
//         throw error;
//     }
// }
// Backend API'ga ulanish uchun asosiy manzil
// export const BASE_URL = 'http://localhost:5000/api';

/**
 * Umumiy API so'rov funksiyasi (qulaylik uchun)
 * @param {string} endpoint - /auth/login kabi API manzili
 * @param {object} options - fetch funksiyasi uchun konfiguratsiya (method, body, headers)
 */
// edu-web-frontend/assets/js/api.js

// export const BASE_URL = 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, options);

        // 1. Agar javob 400 yoki 500 statusida bo'lsa, xatolikni tashlash
        if (!response.ok) {
            let errorData;
            
            // Javob JSON ekanligini tekshiramiz. Agar JSON bo'lmasa (masalan, HTML xato sahifasi),
            // biz shunchaki status va statusText orqali xato chiqaramiz.
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                // Agar JSON emas, masalan HTML bo'lsa
                const errorText = await response.text(); 
                throw new Error(`Server xatosi: ${response.status} ${response.statusText}. Tafsilotlar uchun konsolni tekshiring.`);
            }
            
            throw new Error(errorData.message || `HTTP xatosi! Status: ${response.status}`);
        }

        // 2. MUHIM QO'SHIMCHA: Agar javob tanasi (body) mavjud bo'lmasa (304, 204), bo'sh obyekt qaytarish
        if (response.status === 204 || response.status === 304 || response.headers.get('content-length') === '0') {
            // Agar 304 bo'lsa, keshdan foydalanish kerak, lekin API funksiyasi JSON kutayotgani uchun bo'sh obyekt qaytaramiz
            return {}; 
        }

        // 3. Qolgan (200, 201) muvaffaqiyatli javoblarni JSON formatida qaytarish
        return await response.json();
        
    } catch (error) {
        console.error("API so'rovida xato yuz berdi:", error.message);
        throw error;
    }
}