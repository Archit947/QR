const getApiBaseUrl = () => {
    // 1) Explicit env var wins
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const { hostname, protocol } = window.location;

    // 2) Dev tunnel heuristic: swap 5173 -> 5000
    if (hostname.includes('5173')) {
        const newHostname = hostname.replace('5173', '5000');
        return `${protocol}//${newHostname}/api`;
    }

    // 3) Vercel / any non-localhost: use same-origin /api
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return '/api';
    }

    // 4) Local dev fallback
    return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper for fetch requests
const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    console.log(`[API] Fetching ${url}`);

    try {
        const response = await fetch(url, config);
        
        // Check for HTML response (which means we hit the wrong server/404 page)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
            const text = await response.text();
            console.error('[API] Received non-JSON response:', text.substring(0, 100));
            throw new Error(`API Configuration Error: Server returned HTML instead of JSON. Check VITE_API_URL.`);
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    } catch (error) {
        console.error('[API] Request failed:', error);
        throw error;
    }
};

// Dashboard API
export const dashboardAPI = {
    getStats: async () => {
        try {
            const data = await request('/stats');
            return data;
        } catch (error) {
            // Fallback to mock data when backend is unavailable
            console.warn('Using mock dashboard data:', error.message);
            return {
                totalScans: 1234,
                activeEmployees: 56,
                completedTrainings: 890,
                complianceRate: 98,
            };
        }
    },
};

// QR Code API
export const qrAPI = {
    getAll: () => request('/qr'),
    getById: (id) => request(`/qr/${id}`),
    create: (data) =>
        request('/qr', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Content API
export const contentAPI = {
    getAll: () => request('/content'),
    upload: (data) =>
        request('/content/upload', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    delete: (id) => request(`/content/${id}`, { method: 'DELETE' }),
    updateLinks: (id, qrIds) => 
        request(`/content/${id}/links`, {
            method: 'PUT',
            body: JSON.stringify({ qrIds }),
        }),
};

// Employee API
export const employeeAPI = {
    getAll: () => request('/employees'),
    getStats: () => request('/employees/stats'),
    getProgress: (userId) => request(`/employees/${userId}/progress`),
    updateProgress: (data) =>
        request('/employees/progress', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
