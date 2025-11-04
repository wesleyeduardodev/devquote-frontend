import {createContext, useContext, useMemo, useState, ReactNode, useEffect, useCallback, createElement} from 'react';
import { AuthService } from '../services/authService';
import type {AuthLoginRequest, AuthUser} from '@/types/auth';

type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    // Profile-based checks (escalável para novos perfis)
    hasProfile: (profile: string) => boolean;
    hasAnyProfile: (profiles: string[]) => boolean;
    hasAllProfiles: (profiles: string[]) => boolean;
    // Helpers para perfis existentes (ADMIN, MANAGER, USER)
    isAdmin: () => boolean;
    isManager: () => boolean;
    isUser: () => boolean;
    // Actions
    login: (data: AuthLoginRequest) => Promise<AuthUser>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('auth.user');
    if (!raw) return null;
    try {
        const user = JSON.parse(raw) as AuthUser;
        // Validate token is still valid
        if (!AuthService.isValidSession()) {
            AuthService.clearStoredAuth();
            return null;
        }
        return user;
    } catch {
        AuthService.clearStoredAuth();
        return null;
    }
}

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(readStoredUser());
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
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
            const response = await AuthService.login(data);

            // Store token first so it's available for subsequent requests
            window.localStorage.setItem('auth.token', response.token);

            // Fetch detailed user info including name and id
            let userName = '';
            let userId: number | undefined = undefined;
            try {
                const userInfo = await AuthService.getCurrentUser();
                userName = userInfo.name || '';
                userId = userInfo.id;
            } catch (error) {
                console.warn('Failed to fetch user info:', error);
            }

            // Create user object (apenas com roles - perfis)
            const newUser: AuthUser = {
                id: userId,
                username: response.username,
                email: response.email,
                name: userName,
                roles: response.roles ?? [],
                token: response.token
            };

            // Store user data
            window.localStorage.setItem('auth.user', JSON.stringify(newUser));
            setUser(newUser);

            return newUser;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await AuthService.logout();
        } finally {
            AuthService.clearStoredAuth();
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const value: AuthContextValue = useMemo(() => ({
        user,
        isAuthenticated: !!user?.token && AuthService.isValidSession(),
        isLoading,

        // Profile-based checks (escalável para novos perfis)
        hasProfile: (profile: string) => {
            return user?.roles?.includes(profile) ?? false;
        },
        hasAnyProfile: (profiles: string[]) => {
            return profiles.some(profile => user?.roles?.includes(profile)) ?? false;
        },
        hasAllProfiles: (profiles: string[]) => {
            return profiles.every(profile => user?.roles?.includes(profile)) ?? false;
        },

        // Helpers para perfis existentes (conveniente mas não obrigatório)
        isAdmin: () => user?.roles?.includes('ADMIN') ?? false,
        isManager: () => user?.roles?.includes('MANAGER') ?? false,
        isUser: () => user?.roles?.includes('USER') ?? false,

        // Actions
        login,
        logout,
    }), [user, isLoading, login, logout]);

    return createElement(AuthContext.Provider, {value}, children);
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
