import { createContext, useContext, useState, type ReactNode } from 'react';
import { ROLE } from '@/types/enums';
import type { Role } from '@/types/enums';

// ─── Types ──────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  loginId: string;
  position: string;
}

interface AuthState {
  user: MockUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (role?: Role) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

// ─── Mock Data ──────────────────────────────────────────────────

const MOCK_USER: MockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@shivfurniture.com',
  role: ROLE.ADMIN,
  loginId: 'admin001',
  position: 'System Administrator',
};

// ─── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(MOCK_USER);
  const [token, setToken] = useState<string | null>('mock-jwt-token');

  const login = (role?: Role) => {
    const loginUser = { ...MOCK_USER, role: role ?? ROLE.ADMIN };
    setUser(loginUser);
    setToken('mock-jwt-token');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const switchRole = (role: Role) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        switchRole,
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
