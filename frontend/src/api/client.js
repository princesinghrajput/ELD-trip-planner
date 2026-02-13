import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Use env var in prod, proxy in dev
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for global error handling (optional later)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default client;
