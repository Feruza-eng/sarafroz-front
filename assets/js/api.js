// Backend API'ga ulanish uchun asosiy manzil
export const BASE_URL = 'http://192.168.1.4:5000/api';
// Agar Render ishlatsangiz:
// export const BASE_URL = 'https://edu-web-backend.onrender.com/api';

export async function apiRequest(endpoint, options = {}) {
    const url = ${BASE_URL}${endpoint};

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || HTTP xatosi! Status: ${response.status});
            } else {
                throw new Error(Server xatosi: ${response.status} ${response.statusText});
            }
        }

        if (
            response.status === 204 ||
            response.status === 304 ||
            response.headers.get('content-length') === '0'
        ) {
            return {};
        }

        return await response.json();

    } catch (error) {
        console.error("API so'rovida xato yuz berdi:", error.message);
        throw error;
    }
}