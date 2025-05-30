import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing auth state...');

      // Check if we have stored user data (quick check)
      const hasStoredUser = !!authService.getCurrentUser();

      console.log('📊 Auth state check:', {
        hasStoredUser,
        cookieNote: 'Tokens are in httpOnly cookies (invisible to JS)',
      });

      // If we have stored user data, set it temporarily
      if (hasStoredUser) {
        const storedUser = authService.getCurrentUser();
        setUser(storedUser);
        console.log('👤 Loaded stored user data:', storedUser.username);
      }

      // Try to verify current session with server (checks httpOnly cookies)
      try {
        console.log('🔍 Verifying session with server...');
        const verificationResult = await authService.verifyToken();

        if (verificationResult.success && verificationResult.user) {
          console.log('✅ Session verification successful');
          setUser(verificationResult.user);
        } else {
          console.log('❌ Session verification failed');
          // Clear user data if verification fails
          await logout();
        }
      } catch (error) {
        console.error('❌ Session verification error:', error);

        // If server can't verify cookies, user is not authenticated
        console.log('🚪 Could not verify authentication cookies');
        await logout();
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      await logout();
    } finally {
      setLoading(false);
      console.log('✅ Auth initialization complete');
    }
  };

  // Simplified login method for cookie-based auth
  const login = async (userData) => {
    try {
      console.log('🔑 Logging in user with cookie-based auth');

      // Store user data locally (server already set httpOnly cookies)
      if (userData) {
        authService.storeUserData(userData);
        setUser(userData);
        console.log('👤 User logged in:', userData.username);
      } else {
        // If no user data provided, fetch it from server
        console.log('📡 Fetching fresh user data from server...');
        const verificationResult = await authService.verifyToken();
        if (verificationResult.success && verificationResult.user) {
          setUser(verificationResult.user);
        }
      }

      // Emit login event for other parts of the app
      window.dispatchEvent(
        new CustomEvent('auth:login', {
          detail: { user: userData },
        })
      );
    } catch (error) {
      console.error('❌ Login error:', error);
      await logout();
    }
  };

  // Updated logout method
  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');

      // Call server logout (clears httpOnly cookies and blacklists refresh token)
      await authService.logout();
    } catch (error) {
      console.error('⚠️  Server logout failed:', error);
      // Continue with local logout even if server fails
    }

    // Clear local state
    setUser(null);

    // Emit logout event for other parts of the app
    window.dispatchEvent(new CustomEvent('auth:logout'));

    console.log('✅ Logout complete');
  };

  // Update user data (for profile updates, etc.)
  const updateUser = (updatedUserData) => {
    console.log('📝 Updating user data');

    const newUserData = { ...user, ...updatedUserData };
    authService.storeUserData(newUserData);
    setUser(newUserData);
  };

  // Refresh user data from server
  const refreshUserData = async () => {
    if (!authService.isLoggedIn()) {
      console.log('❌ Cannot refresh user data - not logged in');
      return user;
    }

    try {
      console.log('🔄 Refreshing user data from server...');
      const verificationResult = await authService.verifyToken();

      if (verificationResult.success && verificationResult.user) {
        console.log('✅ User data refreshed');
        setUser(verificationResult.user);
        return verificationResult.user;
      }

      console.log('⚠️  User data refresh failed, keeping current data');
      return user;
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);

      // If authentication failed completely, logout user
      if (error.response?.status === 401) {
        console.log('🚪 Authentication failed during user data refresh');
        await logout();
        return null;
      }

      // For other errors, return current user data
      return user;
    }
  };

  // Check if user has specific permissions/features
  const hasFeature = (feature) => {
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
  };

  // Get user preference with dot notation support
  const getPreference = (path) => {
    if (!user || !user.preferences) return null;

    // Support dot notation like 'notifications.email.budgetAlerts'
    return path.split('.').reduce((obj, key) => obj?.[key], user.preferences);
  };

  // Helper method to check authentication status
  const isAuthenticated = () => {
    return authService.isLoggedIn() && !!user;
  };

  // Helper method to check auth status with server (more reliable)
  const checkServerAuth = async () => {
    try {
      const authStatus = await authService.checkAuthStatus();
      if (authStatus.isAuthenticated && authStatus.user) {
        setUser(authStatus.user);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Server auth check failed:', error);
      setUser(null);
      return false;
    }
  };

  const contextValue = {
    // Auth state
    user,
    loading,
    isLoggedIn: isAuthenticated(),

    // Auth actions
    login,
    logout,
    updateUser,
    refreshUserData,
    checkServerAuth, // For components that need server verification

    // User helpers
    hasFeature,
    getPreference,

    // User properties for easy access (with fallbacks)
    userId: user?.id,
    username: user?.username,
    email: user?.email,
    fullName: user?.fullName,
    groupId: user?.groupId,
    isEmailVerified: user?.isEmailVerified || false,
    plan: user?.plan || 'free',

    // Note: No token helpers needed - cookies are managed by server
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protecting routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isLoggedIn) {
      // Redirect to login or show login form
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};
