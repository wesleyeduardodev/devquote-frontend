import api from './api';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

export const userManagementService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/admin/users');
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

        const response = await api.get(`/admin/users?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: number): Promise<any> => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<any> => {
        const response = await api.post('/admin/users', data);
        return response.data;
    },

    update: async (id: number, data: any): Promise<any> => {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },

    updatePermissions: async (id: number, data: any): Promise<any> => {
        const response = await api.put(`/admin/users/${id}/permissions`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/users/${id}`);
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/admin/users/bulk', { data: ids });
    },

    getAllPermissions: async (): Promise<any> => {
        const response = await api.get('/admin/users/permissions');
        return response.data;
    }
};