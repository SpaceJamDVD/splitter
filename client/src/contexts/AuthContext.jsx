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
      // Check if we have stored user data (quick check)
      const hasStoredUser = !!authService.getCurrentUser();

      // If we have stored user data, set it temporarily
      if (hasStoredUser) {
        const storedUser = authService.getCurrentUser();
        setUser(storedUser);
      }

      // Try to verify current session with server (checks httpOnly cookies)
      try {
        const verificationResult = await authService.verifyToken();

        if (verificationResult.success && verificationResult.user) {
          setUser(verificationResult.user);
        } else {
          // Clear user data if verification fails
          await logout();
        }
      } catch (error) {
        await logout();
      }
    } catch (error) {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  // Simplified login method for cookie-based auth
  const login = async (userData) => {
    try {
      // Store user data locally (server already set httpOnly cookies)
      if (userData) {
        authService.storeUserData(userData);
        setUser(userData);
      } else {
        // If no user data provided, fetch it from server
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
      await logout();
    }
  };

  // Updated logout method
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with local logout even if server fails
    }

    // Clear local state
    setUser(null);

    // Emit logout event for other parts of the app
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  // Update user data (for profile updates, etc.)
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    authService.storeUserData(newUserData);
    setUser(newUserData);
  };

  // Refresh user data from server
  const refreshUserData = async () => {
    if (!authService.isLoggedIn()) {
      return user;
    }

    try {
      const verificationResult = await authService.verifyToken();

      if (verificationResult.success && verificationResult.user) {
        setUser(verificationResult.user);
        return verificationResult.user;
      }

      return user;
    } catch (error) {
      // If authentication failed completely, logout user
      if (error.response?.status === 401) {
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
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
