import { BaseEntity } from './api.types';

export type DeliveryStatus = 'PENDING' | 'DEVELOPMENT' | 'DELIVERED' | 'HOMOLOGATION' | 'APPROVED' | 'REJECTED' | 'PRODUCTION' | 'CANCELLED';

export interface DeliveryItem extends BaseEntity {
    id: number;
    deliveryId: number;
    projectId: number;
    taskId: number;
    taskName?: string;
    taskCode?: string;
    projectName?: string;
    status: DeliveryStatus;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

export interface Delivery extends BaseEntity {
    id: number;
    taskId: number;
    taskName?: string;
    taskCode?: string;
    taskType?: string;
    flowType?: string;
    environment?: string;
    status: DeliveryStatus;
    totalItems?: number;
    pendingCount?: number;
    developmentCount?: number;
    deliveredCount?: number;
    homologationCount?: number;
    approvedCount?: number;
    rejectedCount?: number;
    productionCount?: number;
    startedAt?: string;
    finishedAt?: string;
    deliveryEmailSent?: boolean;
    notes?: string;
    items?: DeliveryItem[];
    operationalItems?: any[];
}

export interface DeliveryStatusCount {
    pending: number;
    development: number;
    delivered: number;
    homologation: number;
    approved: number;
    rejected: number;
    production: number;
    cancelled: number;
}

export interface CreateDeliveryData {
    taskId: number;
    status?: DeliveryStatus;
    environment?: string;
    notes?: string;
    items: CreateDeliveryItemData[];
}

export interface CreateDeliveryItemData {
    projectId: number;
    status?: DeliveryStatus;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

export interface UpdateDeliveryData {
    taskId?: number;
    status?: DeliveryStatus;
    environment?: string;
    notes?: string;
    items?: UpdateDeliveryItemData[];
}

export interface UpdateDeliveryItemData extends Partial<CreateDeliveryItemData> {
    id?: number;
}

export interface DeliveryWithRelations extends Delivery {
    task?: {
        id: number;
        title?: string;
        code?: string;
        amount?: number;
        requester?: {
            id: number;
            name?: string;
        };
    };
}

export interface DeliveryGroupResponse {
    taskId: number;
    taskName: string;
    taskCode: string;
    taskType?: string;
    taskLink?: string;
    taskValue?: number;
    deliveryId?: number;
    deliveryStatus: DeliveryStatus;
    calculatedDeliveryStatus?: string;
    totalItems?: number;
    statusCounts: DeliveryStatusCount;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    createdAt?: string;
    updatedAt?: string;
    deliveries: Delivery[];
}

export interface DeliveryFilters {
    status?: DeliveryStatus | string;
    deliveryStatus?: DeliveryStatus | string;
    taskId?: number;
    taskName?: string;
    taskCode?: string;
    flowType?: string;
    taskType?: string;
    environment?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DeliveryItemFilters {
    status?: DeliveryStatus[];
    deliveryId?: number;
    projectId?: number;
    taskId?: number;
    branch?: string;
    pullRequest?: string;
}

export interface DeliveryStats {
    total: number;
    byStatus: Record<DeliveryStatus, number>;
    delivered: number;
    approved: number;
    rejected: number;
    inProgress: number;
}

export interface DeliveryFormData {
    selectedTask?: {
        id: number;
        title: string;
        code: string;
    };

    selectedProjects: number[];

    initialStatus: DeliveryStatus;

    itemsData: Map<number, DeliveryItemFormData>;
}

export interface DeliveryItemFormData {
    id?: number;
    deliveryId?: number;
    projectId: number;
    projectName?: string;
    status: DeliveryStatus;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

export interface AvailableTask {
    id: number;
    title: string;
    code: string;
    flowType?: string;
    taskType?: string;
    environment?: string;
    amount?: number;
    requester?: {
        name: string;
    };
    hasDelivery?: boolean;
}

export interface AvailableProject {
    id: number;
    name: string;
    description?: string;
    repositoryUrl?: string;
}

export interface DeliveryCreationState {
    step: 1 | 2 | 3 | 4;
    isLoading: boolean;
    selectedTask: AvailableTask | null;
    selectedProjects: AvailableProject[];
    deliveryId?: number;
    items: DeliveryItem[];
}