import { createContext, useContext, useMemo, useState, ReactNode, useEffect, useCallback, createElement } from 'react';
import api from '../services/api';
import type { AuthLoginRequest, AuthLoginResponse, AuthUser } from '../types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  login: (data: AuthLoginRequest) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('auth.user');
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // keep state in sync when tab storage changes
    const handler = (e: StorageEvent) => {
      if (e.key === 'auth.user') {
        setUser(readStoredUser());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = useCallback(async (data: AuthLoginRequest): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      // Atenção: api.ts já tem baseURL com /api → então aqui é só /auth/login
      const res = await api.post<AuthLoginResponse>('/auth/login', data);
      const payload = res.data;
      const u: AuthUser = {
        username: payload.username,
        email: payload.email,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
        token: payload.token
      };
      window.localStorage.setItem('auth.token', u.token);
      window.localStorage.setItem('auth.user', JSON.stringify(u));
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem('auth.token');
      window.localStorage.removeItem('auth.user');
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user?.token,
    isLoading,
    hasRole: (role: string) => !!user?.roles?.includes(role),
    hasPermission: (perm: string) => !!user?.permissions?.includes(perm),
    hasAnyPermission: (perms: string[]) => perms.some((p) => !!user?.permissions?.includes(p)),
    login,
    logout
  }), [user, isLoading, login, logout]);

  // Sem JSX em arquivo .ts
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
