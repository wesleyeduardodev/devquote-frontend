import { BaseEntity } from './api.types';

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

export type RequesterStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

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

export interface UpdateRequesterData extends Partial<CreateRequesterData> {
    id?: never;
}

export interface RequesterWithRelations extends Requester {
    tasks?: {
        id: number;
        title: string;
        status: string;
        createdAt: string;
    }[];
    projects?: {
        id: number;
        name: string;
        status: string;
    }[];
}

export interface RequesterFilters {
    status?: RequesterStatus[];
    company?: string;
    department?: string;
    city?: string;
    state?: string;
    search?: string;
}

export interface RequesterStats {
    total: number;
    byStatus: Record<RequesterStatus, number>;
    active: number;
    inactive: number;
    byCompany: Record<string, number>;
    byDepartment: Record<string, number>;
}

export interface RequesterFormData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    department?: string;
    position?: string;
    status: RequesterStatus;
    notes?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

export interface RequesterContact {
    type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'other';
    value: string;
    label?: string;
    isPrimary?: boolean;
}

export interface RequesterInteraction {
    id: number;
    requesterId: string | number;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK_CREATED' | 'OTHER';
    subject?: string;
    description?: string;
    date: string;
    createdBy: string;
}

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