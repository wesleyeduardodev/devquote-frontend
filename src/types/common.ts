// Tipos para API responses genéricos
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// Tipos para formulários genéricos
export interface FormProps<T> {
    initialData?: Partial<T>;
    onSubmit: (data: T) => void;
    onCancel: () => void;
    loading?: boolean;
}

// Tipos de eventos comuns
export type ChangeHandler = (field: string, value: any) => void;
export type SubmitHandler = (e: React.FormEvent) => void;

// Tipos para hooks genéricos
export interface UseApiReturn<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Tipos para opções de select
export interface SelectOption {
    value: string | number;
    label: string;
}

// Tipos para paginação
export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

// Tipos para filtros
export interface FilterParams {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    [key: string]: any;
}

// Enum para status gerais
export enum CommonStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    DELETED = 'DELETED'
}

// Tipos para componentes de tabela
export interface TableColumn<T> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
    onRowClick?: (item: T) => void;
}

// Tipos base para entidades
export interface BaseEntity {
    id: number;
    createdAt: string;
    updatedAt: string;
}