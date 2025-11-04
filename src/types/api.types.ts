
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

export type ApiStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 422 | 500;

export interface TimestampFields {
    createdAt: string;
    updatedAt: string;
}

export interface BaseEntity extends TimestampFields {
    id: number | string;
}