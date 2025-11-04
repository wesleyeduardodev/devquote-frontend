import api from './api';
import type { AuthLoginRequest, AuthLoginResponse } from '@/types/auth';

interface UpdateProfileRequest {
  username?: string;
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export class AuthService {
  static async login(credentials: AuthLoginRequest): Promise<AuthLoginResponse> {
    const response = await api.post<AuthLoginResponse>('/auth/login', credentials);
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {

      console.warn('Logout API call failed:', error);
    }
  }

  static async getCurrentUser(): Promise<any> {
    const response = await api.get('/auth/user');
    return response.data;
  }

  static async updateProfile(data: UpdateProfileRequest): Promise<void> {
    await api.put('/auth/profile', data);
  }

  static clearStoredAuth(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth.token');
      window.localStorage.removeItem('auth.user');
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