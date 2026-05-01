import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'token';
const STORAGE_USER_KEY = 'user';
const LEGACY_STORAGE_TOKEN_KEY = 'sms_token';
const LEGACY_STORAGE_USER_KEY = 'sms_user';

const migrateLegacyStorage = () => {
  const legacyToken = localStorage.getItem(LEGACY_STORAGE_TOKEN_KEY);
  const currentToken = localStorage.getItem(STORAGE_TOKEN_KEY);

  if (!currentToken && legacyToken) {
    localStorage.setItem(STORAGE_TOKEN_KEY, legacyToken);
  }

  if (legacyToken) {
    localStorage.removeItem(LEGACY_STORAGE_TOKEN_KEY);
  }

  const legacyUser = localStorage.getItem(LEGACY_STORAGE_USER_KEY);
  const currentUser = localStorage.getItem(STORAGE_USER_KEY);

  if (!currentUser && legacyUser) {
    localStorage.setItem(STORAGE_USER_KEY, legacyUser);
  }

  if (legacyUser) {
    localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
  }
};

const readStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(STORAGE_USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    migrateLegacyStorage();
    return getStoredToken();
  });
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    setAuthToken(token);

    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(LEGACY_STORAGE_TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
    }
  }, [user]);

  const login = (payload) => {
    setToken(payload?.token || '');
    setUser(payload?.user || null);
  };

  const logoutLocal = () => {
    setToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logoutLocal,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
