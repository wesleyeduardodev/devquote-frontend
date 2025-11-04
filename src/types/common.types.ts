

export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingState {
    loading: boolean;
    error?: string | null;
}

export interface FormState<T = any> {
    data: T;
    errors: Partial<Record<keyof T, string>>;
    isSubmitting: boolean;
    isDirty: boolean;
}

export interface ModalState {
    isOpen: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

export interface TableColumn<T = any> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: any, record: T) => React.ReactNode;
}

export interface TableState<T = any> {
    data: T[];
    loading: boolean;
    error?: string;
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
    sorting: {
        field?: keyof T;
        order?: 'asc' | 'desc';
    };
}

export interface NavItem {
    label: string;
    path: string;
    icon?: React.ComponentType;
    children?: NavItem[];
}

export type Permission = string;
export type Role = string;

export interface SelectOption<T = any> {
    label: string;
    value: T;
    disabled?: boolean;
}

export interface FileUpload {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    url?: string;
    error?: string;
}