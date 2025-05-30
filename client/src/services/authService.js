// services/authService.js
import API from '../api';

class AuthService {
  constructor() {
    // Note: No token storage needed - server manages httpOnly cookies
    // No isRefreshing or failedQueue needed - api.js handles this
  }

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

      // Server automatically sets httpOnly cookies
      // No need to store tokens manually!
      this.storeUserData(response.data.user);

      console.log('🎉 Registration successful - cookies set by server');

      return {
        success: true,
        user: response.data.user,
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data);
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

      // Server automatically sets httpOnly cookies
      // No need to store tokens manually!
      this.storeUserData(response.data.user);

      console.log('🔑 Login successful - cookies set by server');

      return {
        success: true,
        user: response.data.user,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data);

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

  // Verify current session (server-side verification only)
  async verifyToken() {
    try {
      const response = await API.get('/auth/verify');

      // Update stored user data with fresh server data
      if (response.data.user) {
        this.storeUserData(response.data.user);
      }

      return {
        success: true,
        valid: response.data.valid,
        user: response.data.user,
      };
    } catch (error) {
      console.error('❌ Token verification failed:', error.response?.data);

      // Note: api.js automatically handles token refresh on 401 TOKEN_EXPIRED
      // So if we get here, either refresh worked (and this is a different error)
      // or refresh failed (and user should be logged out)

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

      // Update stored user data
      this.storeUserData(response.data.user);

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

      // Update stored user with new preferences
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.preferences = response.data.preferences;
        this.storeUserData(currentUser);
      }

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
      // Tell server to clear httpOnly cookies and blacklist refresh token
      await API.post('/auth/logout');

      console.log('🚪 Server logout successful - cookies cleared');
    } catch (error) {
      console.error(
        '⚠️  Server logout failed, clearing local data anyway:',
        error
      );
    }

    // Always clear local user data, even if server logout fails
    this.clearUserData();

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // Delete user account (soft delete)
  async deleteAccount() {
    try {
      const response = await API.delete('/auth/account');

      // Clear local storage after account deletion
      this.clearUserData();

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

  // =============================================================================
  // USER DATA STORAGE (Non-sensitive data only)
  // =============================================================================

  // Store user data (only non-sensitive info for offline access)
  storeUserData(user) {
    // Only store essential, non-sensitive user data for offline access
    const safeUserData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      plan: user.plan,
      // Store preferences for offline access (user settings, UI preferences, etc.)
      preferences: user.preferences,
    };

    localStorage.setItem('user', JSON.stringify(safeUserData));
    console.log('👤 User data stored (non-sensitive only)');
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

  // Clear user data (but not auth cookies - server handles those)
  clearUserData() {
    localStorage.removeItem('user');
    console.log('🧹 User data cleared');
  }

  // =============================================================================
  // AUTHENTICATION STATE METHODS (Simplified)
  // =============================================================================

  // Check if user is logged in (based on stored user data)
  // Note: This is just a quick check - real auth is server-side via cookies
  isLoggedIn() {
    const user = this.getCurrentUser();
    return !!user;
  }

  // More reliable auth check - calls server to verify cookies
  async checkAuthStatus() {
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

  // For components that might still call these old methods
  getAccessToken() {
    console.warn('⚠️  getAccessToken() not needed with httpOnly cookies');
    return null; // httpOnly cookies can't be accessed by JavaScript
  }

  getRefreshToken() {
    console.warn('⚠️  getRefreshToken() not needed with httpOnly cookies');
    return null; // httpOnly cookies can't be accessed by JavaScript
  }

  // For AuthContext backward compatibility
  getCurrentToken() {
    console.warn('⚠️  getCurrentToken() deprecated - using httpOnly cookies');
    return null;
  }

  // Clear everything (for compatibility)
  clearAuthData() {
    console.warn('⚠️  clearAuthData() deprecated - use clearUserData()');
    this.clearUserData();
  }
}

export default new AuthService();
