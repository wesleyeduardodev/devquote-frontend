import api from './api';
import {
    Delivery,
    DeliveryItem,
    CreateDeliveryData,
    UpdateDeliveryData,
    DeliveryFilters,
    DeliveryGroupResponse,
    DeliveryStatusCount,
    AvailableTask,
    DeliveryCreationState
} from '../types/delivery.types';
import { PaginatedResponse } from '../types/api.types';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: DeliveryFilters;
}

interface TaskFilterParams {
    id?: string;
    requesterId?: string;
    requesterName?: string;
    title?: string;
    description?: string;
    code?: string;
    link?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface TaskPaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: TaskFilterParams;
}

export const deliveryService = {

    getAll: async (): Promise<Delivery[]> => {
        const response = await api.get('/deliveries');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<PaginatedResponse<Delivery>> => {
        const { page, size, sort, filters } = params;
        
        const sortParams = sort.map(s => `${s.field},${s.direction}`);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    if (Array.isArray(value)) {

                        value.forEach(v => queryParams.append(key, v));
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }

        const response = await api.get(`/deliveries?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: number): Promise<Delivery> => {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    create: async (data: CreateDeliveryData, files?: File[]): Promise<Delivery> => {
        if (files && files.length > 0) {
            const formData = new FormData();

            formData.append('dto', JSON.stringify(data));

            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await api.post('/deliveries', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            return response.data;
        } else {
            const response = await api.post('/deliveries', data);
            return response.data;
        }
    },

    update: async (id: number, data: UpdateDeliveryData): Promise<Delivery> => {
        const response = await api.put(`/deliveries/${id}`, data);
        return response.data;
    },

    updateNotes: async (id: number, notes: string): Promise<Delivery> => {
        const response = await api.patch(`/deliveries/${id}/notes`, { notes });
        return response.data;
    },

    delete: async (id: number): Promise<boolean> => {
        await api.delete(`/deliveries/${id}`);
        return true;
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/deliveries/bulk', { data: ids });
    },

    getByTaskId: async (taskId: number): Promise<Delivery | null> => {
        try {
            const response = await api.get(`/deliveries/by-task/${taskId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    getAvailableTasks: async (): Promise<AvailableTask[]> => {
        const response = await api.get('/tasks/unlinked-delivery');
        const tasks = response.data.content || [];

        return tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            code: task.code,
            flowType: task.flowType,
            amount: task.amount,
            requester: {
                name: task.requesterName
            },
            hasDelivery: false
        }));
    },

    getAvailableTasksPaginated: async (params: TaskPaginatedParams): Promise<PaginatedResponse<AvailableTask>> => {
        const { page, size, sort, filters } = params;
        
        const sortParams = sort.map(s => `${s.field},${s.direction}`);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const response = await api.get(`/tasks/unlinked-delivery?${queryParams.toString()}`);

        const convertedContent = (response.data.content || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            code: task.code,
            flowType: task.flowType,
            amount: task.amount,
            requester: {
                name: task.requesterName
            },
            hasDelivery: false
        }));

        return {
            ...response.data,
            content: convertedContent
        };
    },

    getAllGroupedByTask: async (params: PaginatedParams): Promise<PaginatedResponse<DeliveryGroupResponse>> => {
        const { page, size, sort, filters } = params;
        
        const sortParams = sort.map(s => `${s.field},${s.direction}`);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => queryParams.append(key, v));
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }

        const response = await api.get(`/deliveries/grouped-by-task?${queryParams.toString()}`);
        return response.data;
    },

    getGroupDetailsByTaskId: async (taskId: number): Promise<DeliveryGroupResponse> => {
        const response = await api.get(`/deliveries/group/${taskId}`);
        return response.data;
    },

    exportToExcel: async (flowType?: string): Promise<Blob> => {
        const params: any = {};
        if (flowType && flowType !== 'TODOS') {
            params.flowType = flowType;
        }
        const response = await api.get('/deliveries/export/excel', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    exportToExcelWithResponse: async (flowType?: string): Promise<{ data: Blob; headers: any }> => {
        const params: any = {};
        if (flowType && flowType !== 'TODOS') {
            params.flowType = flowType;
        }
        const response = await api.get('/deliveries/export/excel', {
            params,
            responseType: 'blob'
        });
        return { data: response.data, headers: response.headers };
    },

    getGlobalStatistics: async (): Promise<DeliveryStatusCount> => {
        const response = await api.get('/deliveries/statistics');
        return response.data;
    },

    taskHasDelivery: async (taskId: number): Promise<boolean> => {
        const delivery = await deliveryService.getByTaskId(taskId);
        return delivery !== null;
    },

    sendDeliveryEmail: async (id: number, additionalEmails?: string[], additionalWhatsAppRecipients?: string[], sendEmail?: boolean, sendWhatsApp?: boolean): Promise<void> => {
        const payload: any = {
            sendEmail: sendEmail !== undefined ? sendEmail : true,
            sendWhatsApp: sendWhatsApp !== undefined ? sendWhatsApp : true
        };

        if (additionalEmails && additionalEmails.length > 0) {
            payload.additionalEmails = additionalEmails;
        }

        if (additionalWhatsAppRecipients && additionalWhatsAppRecipients.length > 0) {
            payload.additionalWhatsAppRecipients = additionalWhatsAppRecipients;
        }

        const response = await api.post(`/deliveries/${id}/send-delivery-email`, payload);
        return response.data;
    }
};