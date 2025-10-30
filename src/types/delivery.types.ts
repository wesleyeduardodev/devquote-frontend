import { BaseEntity } from './api.types';

// Status específicos para entregas e itens de entrega
export type DeliveryStatus = 'PENDING' | 'DEVELOPMENT' | 'DELIVERED' | 'HOMOLOGATION' | 'APPROVED' | 'REJECTED' | 'PRODUCTION';

// Interface para DeliveryItem (arquitetura nova)
export interface DeliveryItem extends BaseEntity {
    id: number;
    deliveryId: number;
    projectId: number;
    taskId: number; // Para facilitar queries
    taskName?: string; // Para exibição
    taskCode?: string; // Para exibição  
    projectName?: string; // Para exibição
    status: DeliveryStatus;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

// Interface principal para Delivery (nova arquitetura)
export interface Delivery extends BaseEntity {
    id: number;
    taskId: number;
    taskName?: string; // Para exibição
    taskCode?: string; // Para exibição
    flowType?: string; // Tipo de fluxo da tarefa
    status: DeliveryStatus; // Status calculado automaticamente
    totalItems?: number;
    pendingCount?: number;
    developmentCount?: number;
    deliveredCount?: number;
    homologationCount?: number;
    approvedCount?: number;
    rejectedCount?: number;
    productionCount?: number;
    notes?: string; // Observações gerais da entrega
    items?: DeliveryItem[]; // Lista de itens
}

// Contadores de status para a entrega
export interface DeliveryStatusCount {
    pending: number;
    development: number;
    delivered: number;
    homologation: number;
    approved: number;
    rejected: number;
    production: number;
}

// Tipo para criação de delivery (novo fluxo)
export interface CreateDeliveryData {
    taskId: number;
    status?: DeliveryStatus; // Opcional, padrão PENDING
    notes?: string; // Observações gerais da entrega
    items: CreateDeliveryItemData[];
}

// Tipo para criação de item de entrega
export interface CreateDeliveryItemData {
    projectId: number;
    status?: DeliveryStatus; // Opcional, padrão PENDING
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    startedAt?: string;
    finishedAt?: string;
    notes?: string;
}

// Tipo para atualização de delivery
export interface UpdateDeliveryData {
    taskId?: number;
    status?: DeliveryStatus;
    notes?: string; // Observações gerais da entrega
    items?: UpdateDeliveryItemData[];
}

// Tipo para atualização de item de entrega
export interface UpdateDeliveryItemData extends Partial<CreateDeliveryItemData> {
    id?: number; // Para identificar qual item atualizar
}

// Delivery com dados relacionados (para exibição)
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

// Agrupamento por tarefa (para tela de listagem)
export interface DeliveryGroupResponse {
    taskId: number;
    taskName: string;
    taskCode: string;
    taskValue?: number;
    deliveryId?: number; // ID da entrega principal (1:1 com task)
    deliveryStatus: DeliveryStatus;
    calculatedDeliveryStatus?: string; // Status calculado para exibição
    totalItems?: number; // Quantidade de itens da entrega
    statusCounts: DeliveryStatusCount;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    createdAt?: string;
    updatedAt?: string;
    deliveries: Delivery[];
}

// Filtros para listagem de entregas (nova arquitetura)
export interface DeliveryFilters {
    status?: DeliveryStatus | string; // Para backend
    deliveryStatus?: DeliveryStatus | string; // Para frontend (campo da coluna)
    taskId?: number;
    taskName?: string;
    taskCode?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Filtros para listagem de itens de entrega
export interface DeliveryItemFilters {
    status?: DeliveryStatus[];
    deliveryId?: number;
    projectId?: number;
    taskId?: number;
    branch?: string;
    pullRequest?: string;
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

// Form data para criação de delivery (fluxo em passos)
export interface DeliveryFormData {
    // Passo 1: Seleção da tarefa
    selectedTask?: {
        id: number;
        title: string;
        code: string;
    };
    
    // Passo 2: Seleção de projetos
    selectedProjects: number[];
    
    // Passo 3: Status inicial (opcional)
    initialStatus: DeliveryStatus;
    
    // Passo 4: Detalhes por projeto
    itemsData: Map<number, DeliveryItemFormData>;
}

// Form data para item de entrega
export interface DeliveryItemFormData {
    id?: number; // Para identificar item existente
    deliveryId?: number; // Para associar ao delivery
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

// Dados da tarefa para seleção
export interface AvailableTask {
    id: number;
    title: string;
    code: string;
    flowType?: string;
    amount?: number;
    requester?: {
        name: string;
    };
    hasDelivery?: boolean; // Para filtrar tarefas disponíveis
}

// Dados do projeto para seleção
export interface AvailableProject {
    id: number;
    name: string;
    description?: string;
    repositoryUrl?: string;
}

// Status da criação de delivery (controle de fluxo)
export interface DeliveryCreationState {
    step: 1 | 2 | 3 | 4;
    isLoading: boolean;
    selectedTask: AvailableTask | null;
    selectedProjects: AvailableProject[];
    deliveryId?: number; // ID da delivery criada
    items: DeliveryItem[];
}