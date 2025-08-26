import {createContext, useContext, useMemo, useState, ReactNode, useEffect, useCallback, createElement} from 'react';
import { AuthService } from '../services/authService';
import type {AuthLoginRequest, AuthUser, UserPermissions} from '@/types/auth';

type AuthContextValue = {
    user: AuthUser | null;
    permissions: UserPermissions | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    // Profile-based checks
    hasProfile: (profile: string) => boolean;
    hasAnyProfile: (profiles: string[]) => boolean;
    // Screen-based checks
    hasScreenAccess: (screen: string) => boolean;
    hasAnyScreenAccess: (screens: string[]) => boolean;
    // Resource permission checks
    hasResourcePermission: (resource: string, operation: string) => boolean;
    hasAnyResourcePermission: (resource: string, operations: string[]) => boolean;
    // Field permission checks  
    getFieldPermission: (resource: string, field: string) => 'READ' | 'EDIT' | 'HIDDEN';
    canEditField: (resource: string, field: string) => boolean;
    // Legacy compatibility
    hasRole: (role: string) => boolean;
    hasPermission: (perm: string) => boolean;
    hasAnyPermission: (perms: string[]) => boolean;
    // Actions
    login: (data: AuthLoginRequest) => Promise<AuthUser>;
    logout: () => Promise<void>;
    refreshPermissions: () => Promise<void>;
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

function readStoredPermissions(): UserPermissions | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('auth.permissions');
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserPermissions;
    } catch {
        return null;
    }
}

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(readStoredUser());
    const [permissions, setPermissions] = useState<UserPermissions | null>(readStoredPermissions());
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === 'auth.user') {
                setUser(readStoredUser());
            } else if (e.key === 'auth.permissions') {
                setPermissions(readStoredPermissions());
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    // Auto-refresh permissions on mount if user exists but permissions don't
    useEffect(() => {
        if (user && !permissions && !isLoading) {
            refreshPermissions();
        }
    }, [user, permissions, isLoading]);

    const login = useCallback(async (data: AuthLoginRequest): Promise<AuthUser> => {
        setIsLoading(true);
        try {
            const response = await AuthService.login(data);
            
            // Store token first so it's available for subsequent requests
            window.localStorage.setItem('auth.token', response.token);
            
            // Fetch detailed user info including name
            let userName = '';
            try {
                const userInfo = await AuthService.getCurrentUser();
                userName = userInfo.name || '';
            } catch (error) {
                console.warn('Failed to fetch user info:', error);
            }
            
            // Create user object
            const newUser: AuthUser = {
                username: response.username,
                email: response.email,
                name: userName,
                roles: response.roles ?? [],
                permissions: response.permissions ?? [],
                allowedScreens: response.allowedScreens ?? [],
                token: response.token
            };

            // Store user data
            window.localStorage.setItem('auth.user', JSON.stringify(newUser));
            setUser(newUser);

            // Fetch detailed permissions
            try {
                const userPermissions = await AuthService.getUserPermissions();
                window.localStorage.setItem('auth.permissions', JSON.stringify(userPermissions));
                setPermissions(userPermissions);
            } catch (error) {
                console.warn('Failed to fetch detailed permissions:', error);
            }

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
            setPermissions(null);
            setIsLoading(false);
        }
    }, []);

    const refreshPermissions = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { allowedScreens, permissions: userPermissions } = await AuthService.refreshUserData();
            
            // Update user with fresh screens
            const updatedUser = { ...user, allowedScreens };
            window.localStorage.setItem('auth.user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            // Update permissions
            window.localStorage.setItem('auth.permissions', JSON.stringify(userPermissions));
            setPermissions(userPermissions);
        } catch (error) {
            console.error('Failed to refresh permissions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const value: AuthContextValue = useMemo(() => ({
        user,
        permissions,
        isAuthenticated: !!user?.token && AuthService.isValidSession(),
        isLoading,
        
        // Profile-based checks
        hasProfile: (profile: string) => {
            if (!permissions?.profiles) return false;
            return permissions.profiles.some(p => p.code === profile && p.active);
        },
        hasAnyProfile: (profiles: string[]) => {
            if (!permissions?.profiles) return false;
            return profiles.some(profile => 
                permissions.profiles.some(p => p.code === profile && p.active)
            );
        },
        
        // Screen-based checks
        hasScreenAccess: (screen: string) => {
            return user?.allowedScreens?.includes(screen) ?? false;
        },
        hasAnyScreenAccess: (screens: string[]) => {
            return screens.some(screen => user?.allowedScreens?.includes(screen)) ?? false;
        },
        
        // Resource permission checks
        hasResourcePermission: (resource: string, operation: string) => {
            const resourcePerms = permissions?.resourcePermissions[resource];
            return resourcePerms?.includes(operation) ?? false;
        },
        hasAnyResourcePermission: (resource: string, operations: string[]) => {
            const resourcePerms = permissions?.resourcePermissions[resource];
            return operations.some(op => resourcePerms?.includes(op)) ?? false;
        },
        
        // Field permission checks
        getFieldPermission: (resource: string, field: string) => {
            return permissions?.fieldPermissions[resource]?.[field] ?? 'EDIT';
        },
        canEditField: (resource: string, field: string) => {
            const permission = permissions?.fieldPermissions[resource]?.[field];
            return permission === 'EDIT' || permission === undefined;
        },
        
        // Legacy compatibility
        hasRole: (role: string) => !!user?.roles?.includes(role),
        hasPermission: (perm: string) => !!user?.permissions?.includes(perm),
        hasAnyPermission: (perms: string[]) => perms.some(p => !!user?.permissions?.includes(p)),
        
        // Actions
        login,
        logout,
        refreshPermissions
    }), [user, permissions, isLoading, login, logout, refreshPermissions]);

    return createElement(AuthContext.Provider, {value}, children);
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
