import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedUser = jwtDecode(storedToken);
        const now = Date.now() / 1000;
        if (decodedUser.exp && decodedUser.exp < now) {
          console.warn('Token expired');
          logout();
        } else {
          setUser(decodedUser);
          setToken(storedToken); // Update token state
        }
      } catch (error) {
        console.error('Invalid token', error);
        logout();
      }
    }
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken); // Update token state
    const decodedUser = jwtDecode(newToken);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null); // Clear token state
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
