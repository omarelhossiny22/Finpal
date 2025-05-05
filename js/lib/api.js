const API_BASE = 'http://localhost:5000/api';

export const api = {
    async get(url) {
        const response = await fetch(`${API_BASE}${url}`);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        return response.json();
    },
    
    async post(url, data) {
        const response = await fetch(`${API_BASE}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        return response.json();
    }
};