import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach JWT token if present in browser
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('qb_user');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
          }
        } catch (e) {
          console.error('Error parsing token from storage', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
