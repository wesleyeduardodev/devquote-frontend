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

// Interface específica para filtros de tarefas disponíveis
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
    // CRUD básico para Deliveries
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

        // Adiciona parâmetros de ordenação
        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        // Adiciona parâmetros de filtro (nova arquitetura - sem campos antigos)
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    if (Array.isArray(value)) {
                        // Para arrays (como status), adiciona múltiplos parâmetros
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
            
            // Adicionar dados da entrega como JSON
            formData.append('dto', JSON.stringify(data));
            
            // Adicionar arquivos
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

    // Métodos específicos da nova arquitetura
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

    // Buscar tarefas sem entrega (para seleção)
    getAvailableTasks: async (): Promise<AvailableTask[]> => {
        const response = await api.get('/tasks/unlinked-delivery');
        const tasks = response.data.content || [];
        
        // Converter TaskResponse para AvailableTask
        return tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            code: task.code,
            flowType: task.flowType,
            amount: task.amount,
            requester: {
                name: task.requesterName
            },
            hasDelivery: false // Por definição, são tarefas sem entrega
        }));
    },

    // Buscar tarefas sem entrega com paginação (para modal)
    getAvailableTasksPaginated: async (params: TaskPaginatedParams): Promise<PaginatedResponse<AvailableTask>> => {
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

        // Adiciona parâmetros de filtro (MESMA LÓGICA DO taskService)
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.toString().trim() !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const response = await api.get(`/tasks/unlinked-delivery?${queryParams.toString()}`);
        
        // Converter TaskResponse para AvailableTask
        const convertedContent = (response.data.content || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            code: task.code,
            flowType: task.flowType,
            amount: task.amount,
            requester: {
                name: task.requesterName
            },
            hasDelivery: false // Por definição, são tarefas sem entrega
        }));

        return {
            ...response.data,
            content: convertedContent
        };
    },

    // Agrupamento por tarefa (para listagem principal)
    getAllGroupedByTask: async (params: PaginatedParams): Promise<PaginatedResponse<DeliveryGroupResponse>> => {
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

        const response = await api.get(`/deliveries/grouped-by-task?${queryParams.toString()}`);
        return response.data;
    },

    getGroupDetailsByTaskId: async (taskId: number): Promise<DeliveryGroupResponse> => {
        const response = await api.get(`/deliveries/group/${taskId}`);
        return response.data;
    },

    // Export
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

    // Estatísticas globais
    getGlobalStatistics: async (): Promise<DeliveryStatusCount> => {
        const response = await api.get('/deliveries/statistics');
        return response.data;
    },

    // Método auxiliar para verificar se tarefa já tem entrega
    taskHasDelivery: async (taskId: number): Promise<boolean> => {
        const delivery = await deliveryService.getByTaskId(taskId);
        return delivery !== null;
    },

    // Envio de email manual para entrega
    sendDeliveryEmail: async (id: number, additionalEmails?: string[]): Promise<void> => {
        const payload = additionalEmails && additionalEmails.length > 0
            ? { additionalEmails }
            : {};

        const response = await api.post(`/deliveries/${id}/send-delivery-email`, payload);
        return response.data;
    }
};