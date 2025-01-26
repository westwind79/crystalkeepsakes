// src/config/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://crystalkeepsakes.com/api'
    : '/api';

export const API_ENDPOINTS = {
    createPayment: `${API_BASE_URL}/create-payment.php`
};

// src/utils/apiUtils.js
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

export const handleApiError = (error) => {
    if (error.name === 'AbortError') {
        return 'Request timed out. Please try again.';
    }
    
    if (!error.response) {
        return 'Network error. Please check your connection.';
    }

    if (error.response.status === 400) {
        return 'Invalid request. Please check your cart items.';
    }

    return 'An unexpected error occurred. Please try again later.';
};