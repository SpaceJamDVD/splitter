import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import API from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Check if token is expired
      try {
        const decodedToken = jwtDecode(storedToken);
        const now = Date.now() / 1000;

        if (decodedToken.exp && decodedToken.exp < now) {
          console.warn('Token expired, logging out');
          logout();
          return;
        }
      } catch (error) {
        console.error('Invalid token format', error);
        logout();
        return;
      }

      // Set token first for API calls
      setToken(storedToken);

      // Try to get fresh user data from server
      try {
        const response = await API.get('/auth/verify');
        const userData = response.data.user;

        // Update stored user data with fresh data from server
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        console.error('Token verification failed', error);

        // If server verification fails but we have stored user data, use it
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (parseError) {
            console.error('Stored user data corrupted', parseError);
            logout();
            return;
          }
        } else {
          logout();
          return;
        }
      }
    } catch (error) {
      console.error('Auth initialization error', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData = null) => {
    try {
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);

      // If user data provided, use it; otherwise decode from token
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        const decodedUser = jwtDecode(newToken);
        setUser(decodedUser);
      }
    } catch (error) {
      console.error('Login error', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const refreshUserData = async () => {
    if (!token) return;

    try {
      const response = await API.get('/auth/verify');
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data', error);
      // Don't logout on refresh failure, just return current user
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

  // Get user preference
  const getPreference = (path) => {
    if (!user || !user.preferences) return null;

    // Support dot notation like 'notifications.email.budgetAlerts'
    return path.split('.').reduce((obj, key) => obj?.[key], user.preferences);
  };

  const contextValue = {
    // Auth state
    user,
    token,
    loading,
    isLoggedIn: !!user && !!token,

    // Auth actions
    login,
    logout,
    updateUser,
    refreshUserData,

    // User helpers
    hasFeature,
    getPreference,

    // User properties for easy access
    userId: user?.id,
    username: user?.username,
    email: user?.email,
    fullName: user?.fullName,
    groupId: user?.groupId,
    isEmailVerified: user?.isEmailVerified,
    plan: user?.plan || 'free',
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
