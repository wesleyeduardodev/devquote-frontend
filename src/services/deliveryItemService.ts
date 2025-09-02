import api from './api';
import {
    DeliveryItem,
    CreateDeliveryItemData,
    UpdateDeliveryItemData,
    DeliveryItemFilters
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
    filters?: DeliveryItemFilters;
}

export const deliveryItemService = {
    // CRUD básico para DeliveryItems
    getAll: async (): Promise<DeliveryItem[]> => {
        const response = await api.get('/delivery-items');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<PaginatedResponse<DeliveryItem>> => {
        const { page, size, sort, filters } = params;
        
        const sortParams = sort.map(s => `${s.field},${s.direction}`);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        // Adiciona parâmetros de ordenação
        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        // Adiciona parâmetros de filtro
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

        const response = await api.get(`/delivery-items?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: number): Promise<DeliveryItem> => {
        const response = await api.get(`/delivery-items/${id}`);
        return response.data;
    },

    create: async (data: CreateDeliveryItemData): Promise<DeliveryItem> => {
        const response = await api.post('/delivery-items', data);
        return response.data;
    },

    update: async (id: number, data: UpdateDeliveryItemData): Promise<DeliveryItem> => {
        const response = await api.put(`/delivery-items/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<boolean> => {
        await api.delete(`/delivery-items/${id}`);
        return true;
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/delivery-items/bulk', { data: ids });
    },

    // Métodos específicos por relacionamento
    getByDeliveryId: async (deliveryId: number): Promise<DeliveryItem[]> => {
        const response = await api.get(`/delivery-items/by-delivery/${deliveryId}`);
        return response.data;
    },

    getByTaskId: async (taskId: number): Promise<DeliveryItem[]> => {
        const response = await api.get(`/delivery-items/by-task/${taskId}`);
        return response.data;
    },

    getByTaskIdOptimized: async (taskId: number): Promise<DeliveryItem[]> => {
        const response = await api.get(`/delivery-items/by-task/${taskId}/optimized`);
        return response.data;
    },

    getByProjectId: async (projectId: number): Promise<DeliveryItem[]> => {
        const response = await api.get(`/delivery-items/by-project/${projectId}`);
        return response.data;
    },

    getByStatus: async (status: string): Promise<DeliveryItem[]> => {
        const response = await api.get(`/delivery-items/by-status/${status}`);
        return response.data;
    },

    // Operações em lote
    createMultipleItems: async (deliveryId: number, items: CreateDeliveryItemData[]): Promise<DeliveryItem[]> => {
        const response = await api.post(`/delivery-items/delivery/${deliveryId}/bulk`, items);
        return response.data;
    },

    updateMultipleItems: async (itemIds: number[], items: UpdateDeliveryItemData[]): Promise<DeliveryItem[]> => {
        const queryParams = itemIds.map(id => `itemIds=${id}`).join('&');
        const response = await api.put(`/delivery-items/bulk?${queryParams}`, items);
        return response.data;
    },

    // Contadores
    countByDeliveryId: async (deliveryId: number): Promise<number> => {
        const response = await api.get(`/delivery-items/count/by-delivery/${deliveryId}`);
        return response.data;
    },

    countByDeliveryIdAndStatus: async (deliveryId: number, status: string): Promise<number> => {
        const response = await api.get(`/delivery-items/count/by-delivery/${deliveryId}/status/${status}`);
        return response.data;
    },

    // Export
    exportToExcel: async (): Promise<Blob> => {
        const response = await api.get('/delivery-items/export/excel', {
            responseType: 'blob'
        });
        return response.data;
    }
};