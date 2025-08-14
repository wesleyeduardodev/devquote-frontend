// Tipos comuns reutilizáveis

// Status genéricos
export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED' | 'DRAFT';

// Variantes de componentes UI
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Tipos para loading states
export interface LoadingState {
    loading: boolean;
    error?: string | null;
}

// Tipos para formulários
export interface FormState<T = any> {
    data: T;
    errors: Partial<Record<keyof T, string>>;
    isSubmitting: boolean;
    isDirty: boolean;
}

// Tipos para modais
export interface ModalState {
    isOpen: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Tipos para notificações/toast
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

// Tipos para tabelas/listas
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

// Tipos para navegação
export interface NavItem {
    label: string;
    path: string;
    icon?: React.ComponentType;
    children?: NavItem[];
}

// Tipos para permissões
export type Permission = string;
export type Role = string;

// Tipos para seleção
export interface SelectOption<T = any> {
    label: string;
    value: T;
    disabled?: boolean;
}

// Tipos para upload de arquivos
export interface FileUpload {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    url?: string;
    error?: string;
}