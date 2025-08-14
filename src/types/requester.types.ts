import { BaseEntity } from './api.types';

// Interface principal para Requester
export interface Requester extends BaseEntity {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    department?: string;
    position?: string;
    address?: RequesterAddress;
    status?: RequesterStatus;
    notes?: string;
}

// Status do solicitante
export type RequesterStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

// Endereço do solicitante
export interface RequesterAddress {
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

// Tipo para criação de solicitante
export interface CreateRequesterData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    department?: string;
    position?: string;
    address?: RequesterAddress;
    status?: RequesterStatus;
    notes?: string;
}

// Tipo para atualização de solicitante
export interface UpdateRequesterData extends Partial<CreateRequesterData> {
    id?: never; // Impede atualização do ID
}

// Requester com dados relacionados
export interface RequesterWithRelations extends Requester {
    tasks?: {
        id: number;
        title: string;
        status: string;
        createdAt: string;
    }[];
    quotes?: {
        id: number;
        title?: string;
        totalAmount: number;
        status: string;
    }[];
    projects?: {
        id: number;
        name: string;
        status: string;
    }[];
}

// Filtros para listagem de solicitantes
export interface RequesterFilters {
    status?: RequesterStatus[];
    company?: string;
    department?: string;
    city?: string;
    state?: string;
    search?: string;
}

// Estatísticas de solicitantes
export interface RequesterStats {
    total: number;
    byStatus: Record<RequesterStatus, number>;
    active: number;
    inactive: number;
    byCompany: Record<string, number>;
    byDepartment: Record<string, number>;
}

// Form data para componentes de formulário
export interface RequesterFormData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    department?: string;
    position?: string;
    status: RequesterStatus;
    notes?: string;
    // Address fields flattened
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

// Contato do solicitante
export interface RequesterContact {
    type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'other';
    value: string;
    label?: string;
    isPrimary?: boolean;
}

// Histórico de interações
export interface RequesterInteraction {
    id: number;
    requesterId: string | number;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK_CREATED' | 'QUOTE_SENT' | 'OTHER';
    subject?: string;
    description?: string;
    date: string;
    createdBy: string;
}

// Preferências do solicitante
export interface RequesterPreferences {
    preferredContactMethod: 'email' | 'phone' | 'whatsapp';
    timezone?: string;
    language?: string;
    notifications: {
        email: boolean;
        sms: boolean;
        whatsapp: boolean;
    };
}