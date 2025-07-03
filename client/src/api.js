// src/api.js
import axios from 'axios';

/* ------------------------------------------------------------------ */
/* 1. Axios instance                                                  */
/* ------------------------------------------------------------------ */
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true, // send cookies on every request
});

/* ------------------------------------------------------------------ */
/* 2. Refresh-lock internals                                          */
/* ------------------------------------------------------------------ */
let isRefreshing = false; // true while /auth/refresh is in flight
let refreshQueue = []; // queued requests waiting for a new token

/**  push a request onto the queue and resolve it later */
const enqueueRequest = (cb) =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject, cb });
  });

/**  release or fail all queued requests */
const flushQueue = (error) => {
  refreshQueue.forEach(({ resolve, reject, cb }) =>
    error ? reject(error) : resolve(cb())
  );
  refreshQueue = [];
};

/* ------------------------------------------------------------------ */
/* 3. Interceptors                                                    */
/* ------------------------------------------------------------------ */
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
        console.log(`[API] Auth error (${code}) → refreshing…`);

        try {
          const response = await API.post('/auth/refresh');
          console.log('[API] Refresh successful');
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

/* ------------------------------------------------------------------ */
/* 4. Helper: logout + event dispatch                                 */
/* ------------------------------------------------------------------ */
function handleLogout() {
  localStorage.removeItem('userPreferences');
  sessionStorage.clear();

  const authPaths = ['/login', '/register', '/join'];
  if (!authPaths.some((p) => window.location.pathname.includes(p))) {
    window.location.href = '/login';
  }

  window.dispatchEvent(new CustomEvent('auth:logout'));
}

/* ------------------------------------------------------------------ */
/* 5. Utility exports you already had                                 */
/* ------------------------------------------------------------------ */
export const logout = async () => {
  try {
    await API.post('/auth/logout');
  } catch (_) {
    /* ignore server errors on logout */
  }
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
  } catch (_) {
    /* ignore */
  }
};

/* ------------------------------------------------------------------ */
/* 6. Global event listeners (unchanged)                              */
/* ------------------------------------------------------------------ */
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    // handle cross-tab logout
  });

  window.addEventListener('auth:login', (e) => {
    // handle cross-tab login
  });
}

export default API;
