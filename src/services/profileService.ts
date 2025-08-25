import api from './api';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    level?: string;
    active?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

export const profileService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/permissions/profiles');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
        const { page, size, sort, filters } = params;

        const sortParams = sort.map(s => `${s.field},${s.direction}`);

        const queryParams = new URLSearchParams({
            paginated: 'true',
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

        const response = await api.get(`/permissions/profiles?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: number): Promise<any> => {
        const response = await api.get(`/permissions/profiles/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<any> => {
        const response = await api.post('/permissions/profiles', data);
        return response.data;
    },

    update: async (id: number, data: any): Promise<any> => {
        const response = await api.put(`/permissions/profiles/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/permissions/profiles/${id}`);
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/permissions/profiles/bulk', { data: ids });
    }
};