import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nyayasuno_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nyayasuno_token') || null);
  const [language, setLanguageState] = useState(() => localStorage.getItem('nyayasuno_lang') || 'en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      authAPI.getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('nyayasuno_user', JSON.stringify(res.data));
          if (res.data.preferred_language) {
            setLanguage(res.data.preferred_language);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('nyayasuno_lang', lang);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('nyayasuno_token', access_token);
      localStorage.setItem('nyayasuno_user', JSON.stringify(userData));
      if (userData.preferred_language) {
        setLanguage(userData.preferred_language);
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, preferred_language = language) => {
    setLoading(true);
    try {
      const res = await authAPI.register({ name, email, password, preferred_language });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('nyayasuno_token', access_token);
      localStorage.setItem('nyayasuno_user', JSON.stringify(userData));
      setLanguage(preferred_language);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nyayasuno_token');
    localStorage.removeItem('nyayasuno_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      language,
      setLanguage,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

