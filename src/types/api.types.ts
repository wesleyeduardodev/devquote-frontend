// Tipos básicos para respostas da API
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success?: boolean;
}

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiRequestConfig {
    timeout?: number;
    retries?: number;
    cache?: boolean;
}

// Tipos para filtros e ordenação
export interface ApiFilters {
    [key: string]: any;
}

export interface ApiSort {
    field: string;
    order: 'asc' | 'desc';
}

export interface ApiPagination {
    page: number;
    limit: number;
    offset?: number;
}

// Status codes comuns
export type ApiStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 422 | 500;

// Tipos para timestamps
export interface TimestampFields {
    createdAt: string;
    updatedAt: string;
}

// Base para entidades com ID
export interface BaseEntity extends TimestampFields {
    id: number | string;
}