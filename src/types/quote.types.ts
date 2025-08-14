import { BaseEntity } from './api.types';

// Status do orçamento
export type QuoteStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

// Interface principal para Quote
export interface Quote extends BaseEntity {
    id: number;
    taskId: number;
    title?: string;
    description?: string;
    status: QuoteStatus;
    totalAmount: number;
    validUntil?: string;
    terms?: string;
    notes?: string;
    clientId?: number;
    approvedAt?: string;
    approvedBy?: string;
}

// Tipo para criação de orçamento
export interface CreateQuoteData {
    taskId: number;
    title?: string;
    description?: string;
    status: QuoteStatus;
    totalAmount: number;
    validUntil?: string;
    terms?: string;
    notes?: string;
    clientId?: number;
}

// Tipo para atualização de orçamento
export interface UpdateQuoteData extends Partial<CreateQuoteData> {
    id?: never; // Impede atualização do ID
}

// Quote com dados relacionados
export interface QuoteWithRelations extends Quote {
    task?: {
        id: number;
        title: string;
        description?: string;
        code?: string;
        subTasks?: SubTask[];
    };
    client?: {
        id: number;
        name: string;
        email?: string;
    };
    billingMonths?: {
        id: number;
        month: number;
        year: number;
        status: string;
    }[];
}

// Subtarefa (do task relacionado)
export interface SubTask {
    id: number;
    title: string;
    description?: string;
    amount: number;
    status: string;
    estimatedHours?: number;
}

// Filtros para listagem de orçamentos
export interface QuoteFilters {
    status?: QuoteStatus[];
    taskId?: number;
    clientId?: number;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Estatísticas de orçamentos
export interface QuoteStats {
    total: number;
    byStatus: Record<QuoteStatus, number>;
    totalValue: number;
    approvedValue: number;
    pendingValue: number;
    averageValue: number;
    approved: number;
    pending: number;
    rejected: number;
}

// Form data para componentes de formulário
export interface QuoteFormData {
    taskId: string | number;
    title?: string;
    description?: string;
    status: QuoteStatus;
    totalAmount: string | number;
    validUntil?: string;
    terms?: string;
    notes?: string;
    clientId?: string | number;
}

// Item do orçamento (breakdown detalhado)
export interface QuoteItem {
    id: number;
    quoteId: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
}

// Template de orçamento
export interface QuoteTemplate {
    id: number;
    name: string;
    description?: string;
    items: Omit<QuoteItem, 'id' | 'quoteId'>[];
    terms?: string;
    validityDays?: number;
}

// Histórico de aprovações
export interface QuoteApproval {
    id: number;
    quoteId: number;
    action: 'APPROVED' | 'REJECTED' | 'REQUESTED_CHANGES';
    comment?: string;
    approvedBy: string;
    approvedAt: string;
}