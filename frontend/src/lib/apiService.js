const getApiBaseUrl = () => {
    // If env var is set to a specific API URL, use it
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('5173')) {
        return import.meta.env.VITE_API_URL;
    }

    const { hostname, protocol } = window.location;

    // Intelligent detection for Dev Tunnels / Port Forwarding
    // If current URL has '5173' in it (standard Vite port), try to replace it with '5000' (standard Express port)
    if (hostname.includes('5173')) {
        const newHostname = hostname.replace('5173', '5000');
        return `${protocol}//${newHostname}/api`;
    }
    
    // Fallback for localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    // Default fallback if we can't determine
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
