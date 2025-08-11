import { BaseEntity } from './common';

// Tipos principais para Quote
export interface Quote extends BaseEntity {
    id: number;
    status: QuoteStatus;
    totalAmount: number;
    requester: Requester;
    tasks: Task[];
    project?: Project;
    description?: string;
    notes?: string;
    approvedAt?: string;
    rejectedAt?: string;
    approvedBy?: number;
    rejectedBy?: number;
}

// Tipos para requests/responses
export interface QuoteRequest {
    requesterId: number;
    projectId?: number;
    description?: string;
    notes?: string;
    tasks: TaskRequest[];
}

export interface QuoteResponse extends BaseEntity {
    id: number;
    status: QuoteStatus;
    totalAmount: number;
    requester: RequesterResponse;
    tasks: TaskResponse[];
    project?: ProjectResponse;
    description?: string;
    notes?: string;
    approvedAt?: string;
    rejectedAt?: string;
    approvedBy?: number;
    rejectedBy?: number;
}

export interface UpdateQuoteRequest {
    status?: QuoteStatus;
    description?: string;
    notes?: string;
    tasks?: TaskRequest[];
}

// Enum para status do orçamento
export enum QuoteStatus {
    RASCUNHO = 'RASCUNHO',
    PENDENTE = 'PENDENTE',
    APROVADO = 'APROVADO',
    APPROVED = 'APPROVED', // Para compatibilidade
    REJEITADO = 'REJEITADO',
    CANCELADO = 'CANCELADO'
}

// Tipos relacionados (simplificados - detalhes nos arquivos específicos)
export interface Requester extends BaseEntity {
    name: string;
    email: string;
    phone?: string;
}

export interface RequesterResponse extends BaseEntity {
    name: string;
    email: string;
    phone?: string;
}

export interface Task extends BaseEntity {
    title: string;
    description?: string;
    value: number;
    status: TaskStatus;
    estimatedHours?: number;
    actualHours?: number;
}

export interface TaskRequest {
    title: string;
    description?: string;
    value: number;
    estimatedHours?: number;
}

export interface TaskResponse extends BaseEntity {
    title: string;
    description?: string;
    value: number;
    status: TaskStatus;
    estimatedHours?: number;
    actualHours?: number;
}

export enum TaskStatus {
    PENDENTE = 'PENDENTE',
    EM_ANDAMENTO = 'EM_ANDAMENTO',
    CONCLUIDA = 'CONCLUIDA',
    CANCELADA = 'CANCELADA'
}

export interface Project extends BaseEntity {
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
}

export interface ProjectResponse extends BaseEntity {
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
}

export enum ProjectStatus {
    PLANEJAMENTO = 'PLANEJAMENTO',
    EM_ANDAMENTO = 'EM_ANDAMENTO',
    CONCLUIDO = 'CONCLUIDO',
    CANCELADO = 'CANCELADO',
    PAUSADO = 'PAUSADO'
}

// Tipos para filtros e buscas
export interface QuoteFilters {
    status?: QuoteStatus[];
    requesterId?: number;
    projectId?: number;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
}

// Tipos para estatísticas
export interface QuoteStats {
    total: number;
    byStatus: Record<QuoteStatus, number>;
    totalValue: number;
    averageValue: number;
    monthlyStats: MonthlyQuoteStats[];
}

export interface MonthlyQuoteStats {
    month: string;
    count: number;
    totalValue: number;
}