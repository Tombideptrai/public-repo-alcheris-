import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../lib/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../lib/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expired
          await logout();
        } else {
          // ✅ FIX: Re-attach the token to the headers BEFORE making the request
          // This ensures the page reload doesn't result in a 401 Unauthorized
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            const res = await api.get('/api/users/me/');
            setUser(res.data);
          } catch (err) {
            console.warn("Could not fetch full profile, using token data", err);
            setUser({ 
              username: decoded.username || 'User', 
              id: decoded.user_id 
              // Note: Role might be missing here if not in token
            });
          }
        }
      } catch (error) {
        console.error("Invalid token:", error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (userData) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    const res = await api.get('/api/users/me/');
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    delete api.defaults.headers.common['Authorization']; // Clean up on logout
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);