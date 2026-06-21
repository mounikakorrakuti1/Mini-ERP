import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ROLE } from '@/types/enums';
import type { Role } from '@/types/enums';
import { api } from '@/lib/api';
import type { DynamicPermission } from '@/lib/permissions';

// ─── Types ──────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  loginId: string;
  position: string;
  avatar?: string | null;
  permissions: DynamicPermission[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// ─── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token') || null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }, [token]);

  const login = async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    const { accessToken, user: userData } = res.data.data;
    setToken(accessToken);
    setUser({
      ...userData,
      email: userData.email || '',
      position: userData.position || 'Staff',
      loginId: credentials.loginId,
    });
  };

  const register = async (data: any) => {
    await api.post('/auth/register', data);
    // Auto login after register
    await login({ loginId: data.loginId, password: data.password });
  };

  const logout = () => {
    // Optionally call backend logout
    api.post('/auth/logout').catch(() => {});
    setUser(null);
    setToken(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthStore must be used within an AuthProvider');
  }
  return ctx;
}
