import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors globally
    if (error.response?.status === 401) {
      console.warn('Authentication failed, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect to login if not already on auth pages
      const currentPath = window.location.pathname;
      const authPaths = ['/login', '/register', '/join'];
      const isOnAuthPage = authPaths.some((path) => currentPath.includes(path));

      if (!isOnAuthPage) {
        window.location.href = '/login';
      }
    }

    // Handle account locked errors
    if (error.response?.status === 423) {
      console.warn('Account locked');
      // You might want to show a specific locked account message
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data?.error);
      // You might want to show a generic "server error" message
    }

    return Promise.reject(error);
  }
);

// Helper function for logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default API;
