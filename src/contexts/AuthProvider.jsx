import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api/client';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (mounted) setUser(data.user || null);
      } catch (error) {
        // 401 es esperado cuando no hay sesión activa; no es un error crítico.
        if (mounted && error?.response?.status !== 401) {
          console.error('Error verificando sesión:', error);
        }
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // ignore
    }
    setUser(null);
  };

  const verifyEmail = async (payload) => {
    const { data } = await api.post('/auth/verify-email', payload);
    if (data.user) setUser(data.user);
    return data;
  };

  const resendVerification = async (payload) => {
    const { data } = await api.post('/auth/resend-verification', payload);
    return data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

