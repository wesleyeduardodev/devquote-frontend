import { BaseEntity } from './api.types';

// Status específicos para entregas
export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'TESTING' | 'DELIVERED' | 'APPROVED' | 'REJECTED';

// Interface principal para Delivery
export interface Delivery extends BaseEntity {
    id: number;
    taskId: number;
    projectId: number;
    status: DeliveryStatus;
    branch?: string;
    pullRequest?: string;
    script?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

// Tipo para criação de delivery
export interface CreateDeliveryData {
    taskId: number;
    projectId: number;
    status: DeliveryStatus;
    branch?: string;
    pullRequest?: string;
    script?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

// Tipo para atualização de delivery
export interface UpdateDeliveryData extends Partial<CreateDeliveryData> {
    id?: never; // Impede atualização do ID
}

// Delivery com dados relacionados (para exibição)
export interface DeliveryWithRelations extends Delivery {
    task?: {
        id: number;
        title?: string;
        code?: string;
    };
    project?: {
        id: number;
        name?: string;
        repositoryUrl?: string;
    };
}

// Filtros para listagem de entregas
export interface DeliveryFilters {
    status?: DeliveryStatus[];
    taskId?: number;
    projectId?: number;
    startDate?: string;
    endDate?: string;
    branch?: string;
}

// Estatísticas de entregas
export interface DeliveryStats {
    total: number;
    byStatus: Record<DeliveryStatus, number>;
    delivered: number;
    approved: number;
    rejected: number;
    inProgress: number;
}

// Form data para componentes de formulário
export interface DeliveryFormData {
    taskId: string | number;
    projectId: string | number;
    status: DeliveryStatus;
    branch?: string;
    pullRequest?: string;
    script?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}