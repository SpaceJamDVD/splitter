// services/authService.js
import API from '../api';

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await API.post('/auth/register', {
        username: userData.username?.trim(),
        email: userData.email?.trim().toLowerCase(),
        password: userData.password,
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
      });

      return {
        success: true,
        data: response.data,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await API.post('/auth/login', {
        username: credentials.username?.trim(),
        password: credentials.password,
      });

      return {
        success: true,
        data: response.data,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      let errorMessage = 'Login failed';

      if (error.response?.status === 423) {
        errorMessage = 'Account temporarily locked. Please try again later.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username/email or password';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      return {
        success: false,
        error: errorMessage,
        isLocked: error.response?.status === 423,
      };
    }
  }

  // Verify current token
  async verifyToken() {
    try {
      const response = await API.get('/auth/verify');
      return {
        success: true,
        valid: response.data.valid,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.response?.data?.error || 'Token verification failed',
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await API.put('/auth/profile', {
        firstName: profileData.firstName?.trim(),
        lastName: profileData.lastName?.trim(),
        timezone: profileData.timezone,
        currency: profileData.currency,
      });

      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed',
      };
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await API.put('/auth/preferences', {
        preferences,
      });

      return {
        success: true,
        preferences: response.data.preferences,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Preferences update failed',
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await API.post('/auth/logout');

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      // Even if server logout fails, clear local data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return {
        success: true, // Still consider it successful
        message: 'Logged out locally',
      };
    }
  }

  // Delete user account (soft delete)
  async deleteAccount() {
    try {
      const response = await API.delete('/auth/account');

      // Clear local storage after account deletion
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Account deletion failed',
      };
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  // Get current token from localStorage
  getCurrentToken() {
    return localStorage.getItem('token');
  }

  // Check if user is logged in
  isLoggedIn() {
    const token = this.getCurrentToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Check if user has specific feature/plan
  hasFeature(feature) {
    const user = this.getCurrentUser();
    if (!user) return false;

    switch (feature) {
      case 'premium':
        return user.plan === 'premium' || user.plan === 'family';
      case 'family':
        return user.plan === 'family';
      case 'email_verified':
        return user.isEmailVerified;
      default:
        return false;
    }
  }

  // Get user preference by path (supports dot notation)
  getPreference(path) {
    const user = this.getCurrentUser();
    if (!user || !user.preferences) return null;

    return path.split('.').reduce((obj, key) => obj?.[key], user.preferences);
  }

  // Store user data in localStorage
  storeUserData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Clear all auth data
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export default new AuthService();
