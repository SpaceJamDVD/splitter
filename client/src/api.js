import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

const enqueueRequest = (cb) =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject, cb });
  });

const flushQueue = (error) => {
  refreshQueue.forEach(({ resolve, reject, cb }) =>
    error ? reject(error) : resolve(cb())
  );
  refreshQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const code = error?.response?.data?.code;

    if (error.response?.status === 401) {
      const code = error?.response?.data?.code;
      const isTokenError = [
        'TOKEN_EXPIRED',
        'NO_TOKEN',
        'INVALID_TOKEN',
      ].includes(code);

      if (isTokenError && !original._retry) {
        original._retry = true;

        if (isRefreshing) {
          return enqueueRequest(() => API(original));
        }

        isRefreshing = true;

        try {
          const response = await API.post('/auth/refresh');
          flushQueue(null);
          return API(original);
        } catch (refreshErr) {
          console.error('[API] Refresh failed:', refreshErr.response?.data);
          flushQueue(refreshErr);
          handleLogout();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  localStorage.removeItem('userPreferences');
  sessionStorage.clear();

  const authPaths = ['/login', '/register', '/join'];
  if (!authPaths.some((p) => window.location.pathname.includes(p))) {
    window.location.href = '/login';
  }

  window.dispatchEvent(new CustomEvent('auth:logout'));
}

export const logout = async () => {
  try {
    await API.post('/auth/logout');
  } catch (_) {}
  handleLogout();
};

export const checkAuthStatus = async () => {
  try {
    const { data } = await API.get('/auth/verify');
    return { isAuthenticated: true, user: data.user };
  } catch (err) {
    return {
      isAuthenticated: false,
      user: null,
      error: err.response?.data?.error,
    };
  }
};

export const refreshTokenManually = async () => {
  const { data } = await API.post('/auth/refresh');
  return data;
};

export const debugAuth = async () => checkAuthStatus();

export const testTokenExpiration = async () => {
  try {
    await API.get('/auth/verify');
  } catch (_) {}
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {});
  window.addEventListener('auth:login', (e) => {});
}

export default API;
