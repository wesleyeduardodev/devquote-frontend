import { BaseEntity } from './common';

// Tipos para User
export interface User extends BaseEntity {
    username: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    lastLogin?: string;
}

// Tipos para requests/responses
export interface UserRequest {
    username: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    active?: boolean;
}

export interface UserResponse extends BaseEntity {
    username: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    lastLogin?: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
    active?: boolean;
}

// Enum para roles
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    MANAGER = 'MANAGER',
    VIEWER = 'VIEWER'
}

// Tipos para autenticação
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: UserResponse;
    token: string;
    refreshToken?: string;
    expiresIn: number;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

// Tipos para perfil do usuário
export interface UserProfile {
    id: number;
    username: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    preferences: UserPreferences;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: 'pt-BR' | 'en-US';
    notifications: {
        email: boolean;
        push: boolean;
        inApp: boolean;
    };
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// Tipos para permissões
export interface Permission {
    id: number;
    name: string;
    resource: string;
    action: string;
}

export interface RolePermissions {
    role: UserRole;
    permissions: Permission[];
}