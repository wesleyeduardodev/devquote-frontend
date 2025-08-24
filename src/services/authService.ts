import api from './api';
import type { AuthLoginRequest, AuthLoginResponse, UserPermissions } from '@/types/auth';

export class AuthService {
  static async login(credentials: AuthLoginRequest): Promise<AuthLoginResponse> {
    const response = await api.post<AuthLoginResponse>('/auth/login', credentials);
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors - we'll clear local storage anyway
      console.warn('Logout API call failed:', error);
    }
  }

  static async getAllowedScreens(): Promise<string[]> {
    const response = await api.get<string[]>('/auth/screens');
    return response.data;
  }

  static async getUserPermissions(): Promise<UserPermissions> {
    const response = await api.get<UserPermissions>('/auth/permissions');
    return response.data;
  }

  static async refreshUserData(): Promise<{
    allowedScreens: string[];
    permissions: UserPermissions;
  }> {
    const [allowedScreens, permissions] = await Promise.all([
      this.getAllowedScreens(),
      this.getUserPermissions()
    ]);

    return { allowedScreens, permissions };
  }

  static clearStoredAuth(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth.token');
      window.localStorage.removeItem('auth.user');
      window.localStorage.removeItem('auth.permissions');
      window.localStorage.removeItem('auth.screens');
    }
  }

  static getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('auth.token');
    }
    return null;
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  static isValidSession(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }
}