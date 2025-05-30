// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true, // CRUCIAL: Tells axios to send cookies with requests
});

// =============================================================================
// REQUEST INTERCEPTOR - Much simpler now!
// =============================================================================

API.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        withCredentials: config.withCredentials,
        hasCookies: 'Browser handles cookies automatically',
      });
    }

    // No need to manually add Authorization headers!
    // Browser automatically includes httpOnly cookies
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR - Simplified for cookie-based auth
// =============================================================================

API.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📥 ${response.status} ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `❌ ${
          error.response?.status
        } ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`
      );
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.code;

      console.log('🔐 401 Error detected, code:', errorCode);

      // Handle token expiration with automatic refresh
      if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        // Mark this request as retried to prevent infinite loops
        originalRequest._retry = true;

        try {
          console.log('🔄 Access token expired, attempting refresh...');

          // Call refresh endpoint - cookies are sent automatically!
          const refreshResponse = await API.post('/auth/refresh');

          console.log('✅ Token refresh successful via cookies');

          // Retry the original request - new cookie is now set automatically
          console.log('🔁 Retrying original request with refreshed cookie');
          return API(originalRequest);
        } catch (refreshError) {
          console.error(
            '❌ Token refresh failed:',
            refreshError.response?.data
          );

          // If refresh fails, handle logout
          const refreshErrorCode = refreshError.response?.data?.code;

          if (refreshErrorCode === 'REFRESH_TOKEN_EXPIRED') {
            console.log('🚪 Refresh token expired, user needs to log in again');
            handleLogout();
          } else {
            console.log('🚪 Refresh failed, clearing auth state');
            handleLogout();
          }

          return Promise.reject(refreshError);
        }
      }

      // Handle other 401 errors (invalid token, missing token, etc.)
      if (
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 'NO_TOKEN' ||
        !errorCode
      ) {
        console.log('🚪 Invalid/missing token, clearing auth state');
        handleLogout();
      }
    }

    // Handle account locked errors
    if (error.response?.status === 423) {
      console.warn('🔒 Account locked');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('🚨 Server error:', error.response?.data?.error);
    }

    // Return the original error for other cases
    return Promise.reject(error);
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Centralized logout function
const handleLogout = () => {
  // Clear any client-side cached data (non-auth)
  localStorage.removeItem('userPreferences'); // Keep non-sensitive cached data if you have any
  sessionStorage.clear(); // Clear any session data

  // Note: We don't clear auth cookies here - server handles that
  // httpOnly cookies can't be cleared by JavaScript anyway

  // Only redirect to login if not already on auth pages
  const currentPath = window.location.pathname;
  const authPaths = ['/login', '/register', '/join'];
  const isOnAuthPage = authPaths.some((path) => currentPath.includes(path));

  if (!isOnAuthPage) {
    console.log('🚪 Redirecting to login');
    window.location.href = '/login';
  }

  // Emit logout event for components to react
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

// Manual logout function (call server to clear cookies)
export const logout = async () => {
  try {
    console.log('🚪 Manual logout triggered');

    // Call server logout endpoint (clears httpOnly cookies)
    await API.post('/auth/logout');

    console.log('✅ Server logout successful');
  } catch (error) {
    console.error('⚠️  Server logout failed:', error);
    // Continue with client logout even if server fails
  }

  handleLogout();
};

// Function to check if user is authenticated by calling server
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

// Function to manually trigger a token refresh (useful for debugging)
export const refreshTokenManually = async () => {
  try {
    console.log('🔄 Manual token refresh triggered');
    const response = await API.post('/auth/refresh');
    console.log('✅ Manual refresh successful');
    return response.data;
  } catch (error) {
    console.error('❌ Manual refresh failed:', error);
    throw error;
  }
};

// =============================================================================
// DEBUGGING FUNCTIONS (Remove in production)
// =============================================================================

// Function to test auth status
export const debugAuth = async () => {
  try {
    const authStatus = await checkAuthStatus();
    console.log('🔍 Auth Debug Info:', {
      isAuthenticated: authStatus.isAuthenticated,
      user: authStatus.user?.username || 'none',
      // Note: Can't check httpOnly cookies from JavaScript
      cookieNote:
        'httpOnly cookies are invisible to JavaScript (this is good!)',
    });
    return authStatus;
  } catch (error) {
    console.error('❌ Auth debug failed:', error);
  }
};

// Function to test token expiration handling
export const testTokenExpiration = async () => {
  console.log('🧪 Testing token expiration...');

  try {
    const response = await API.get('/auth/verify');
    console.log('✅ Auth verification successful:', response.data);
  } catch (error) {
    console.log('❌ Auth verification failed:', error.response?.data);
  }
};

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Listen for custom auth events
if (typeof window !== 'undefined') {
  // Handle logout events from anywhere in the app
  window.addEventListener('auth:logout', () => {
    console.log('🚪 Auth logout event received');
    // Don't need to clear cookies - server handles that
  });

  // Handle login events
  window.addEventListener('auth:login', (event) => {
    console.log('🔑 Auth login event received');
  });
}

export default API;
