// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      const errorCode = error.response.data?.code;

      if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await API.post('/auth/refresh');
          return API(originalRequest);
        } catch (refreshError) {
          const refreshErrorCode = refreshError.response?.data?.code;

          if (refreshErrorCode === 'REFRESH_TOKEN_EXPIRED') {
            handleLogout();
          } else {
            handleLogout();
          }

          return Promise.reject(refreshError);
        }
      }

      if (
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 'NO_TOKEN' ||
        !errorCode
      ) {
        handleLogout();
      }
    }

    if (error.response?.status === 423) {
      // Handle account locked errors
    }

    if (error.response?.status >= 500) {
      // Handle server errors
    }

    return Promise.reject(error);
  }
);

const handleLogout = () => {
  localStorage.removeItem('userPreferences');
  sessionStorage.clear();

  const currentPath = window.location.pathname;
  const authPaths = ['/login', '/register', '/join'];
  const isOnAuthPage = authPaths.some((path) => currentPath.includes(path));

  if (!isOnAuthPage) {
    window.location.href = '/login';
  }

  window.dispatchEvent(new CustomEvent('auth:logout'));
};

export const logout = async () => {
  try {
    await API.post('/auth/logout');
  } catch (error) {
    // Continue with client logout even if server fails
  }

  handleLogout();
};

export const checkAuthStatus = async () => {
  try {
    const response = await API.get('/auth/verify');
    return {
      isAuthenticated: true,
      user: response.data.user,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      error: error.response?.data?.error,
    };
  }
};

export const refreshTokenManually = async () => {
  try {
    const response = await API.post('/auth/refresh');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const debugAuth = async () => {
  try {
    const authStatus = await checkAuthStatus();
    return authStatus;
  } catch (error) {
    // Handle error
  }
};

export const testTokenExpiration = async () => {
  try {
    const response = await API.get('/auth/verify');
  } catch (error) {
    // Handle error
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    // Handle logout events
  });

  window.addEventListener('auth:login', (event) => {
    // Handle login events
  });
}

export default API;
