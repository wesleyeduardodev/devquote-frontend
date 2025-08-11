import { AxiosResponse } from 'axios';

// Configuração da API
export interface ApiConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
}

// Tipos para requisições HTTP
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
    method?: HttpMethod;
    url: string;
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
}

// Tipos para responses da API
export interface ApiErrorResponse {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
    timestamp: string;
}

export interface ApiSuccessResponse<T = any> {
    data: T;
    message?: string;
    status: number;
}

// Tipos para interceptors
export type RequestInterceptor = (config: any) => any;
export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse;
export type ErrorInterceptor = (error: any) => Promise<any>;

// Tipos para autenticação
export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

// Tipos para validação
export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResponse {
    valid: boolean;
    errors: ValidationError[];
}

// Enum para códigos de status HTTP
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500
}