import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api/client';

const saveTokens = (data) => {
  if (!data?.accessToken) return;
  localStorage.setItem('access_token', data.accessToken);
  // Evita guardar el texto "undefined" si el backend no envía refresh token.
  if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      return data.user || null;
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error('Error verificando sesión:', error);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchUser().then((u) => {
      if (!mounted) return;
      setUser(u);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [fetchUser]);

  // Si se cierra sesión en otra pestaña, esta también se entera.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'access_token' && !e.newValue) setUser(null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await fetchUser();
    setUser(u);
    return u;
  }, [fetchUser]);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    saveTokens(data);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    saveTokens(data);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', { refresh_token: localStorage.getItem('refresh_token') });
    } catch {
      // Aunque falle el servidor, la sesión local se cierra igual.
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};