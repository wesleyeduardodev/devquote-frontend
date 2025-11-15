import api from './api';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    name?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

interface SystemParameterData {
    name: string;
    value?: string;
    description?: string;
}

export const systemParameterService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/system-parameters');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
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

        const response = await api.get(`/system-parameters/paginated?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/system-parameters/${id}`);
        return response.data;
    },

    getByName: async (name: string): Promise<any> => {
        const response = await api.get(`/system-parameters/by-name?name=${encodeURIComponent(name)}`);
        return response.data;
    },

    create: async (data: SystemParameterData): Promise<any> => {
        const response = await api.post('/system-parameters', data);
        return response.data;
    },

    update: async (id: any, data: Partial<SystemParameterData>): Promise<any> => {
        const response = await api.put(`/system-parameters/${id}`, data);
        return response.data;
    },

    delete: async (id: any): Promise<boolean> => {
        await api.delete(`/system-parameters/${id}`);
        return true;
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/system-parameters/bulk', { data: ids });
    }
};
