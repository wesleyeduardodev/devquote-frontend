import api from './api';
import { NotificationConfigType, NotificationType } from '@/hooks/useNotificationConfigs';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    configType?: string;
    notificationType?: string;
    primaryEmail?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

interface NotificationConfigData {
    configType: NotificationConfigType;
    notificationType: NotificationType;
    primaryEmail?: string;
    copyEmails?: string[];
    phoneNumbers?: string[];
}

export const notificationConfigService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/notification-configs');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
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
                    queryParams.append(key, value.toString());
                }
            });
        }

        const response = await api.get(`/notification-configs?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/notification-configs/${id}`);
        return response.data;
    },

    getByType: async (configType: NotificationConfigType, notificationType: NotificationType): Promise<any> => {
        const response = await api.get(`/notification-configs/by-type?configType=${configType}&notificationType=${notificationType}`);
        return response.data;
    },

    create: async (data: NotificationConfigData): Promise<any> => {
        const response = await api.post('/notification-configs', data);
        return response.data;
    },

    update: async (id: any, data: Partial<NotificationConfigData>): Promise<any> => {
        const response = await api.put(`/notification-configs/${id}`, data);
        return response.data;
    },

    delete: async (id: any): Promise<boolean> => {
        await api.delete(`/notification-configs/${id}`);
        return true;
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/notification-configs/bulk', { data: ids });
    }
};