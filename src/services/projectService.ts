import api from './api';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    name?: string;
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

export const projectService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/projects');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
        const {page, size, sort, filters} = params;

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

        const response = await api.get(`/projects?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    getByIds: async (ids: number[]): Promise<any[]> => {
        if (ids.length === 0) return [];

        const projects = await Promise.all(
            ids.map(id => projectService.getById(id))
        );
        return projects;
    },

    create: async (data: any): Promise<any> => {
        const response = await api.post('/projects', data);
        return response.data;
    },

    update: async (id: any, data: any): Promise<any> => {
        const response = await api.put(`/projects/${id}`, data);
        return response.data;
    },

    delete: async (id: any): Promise<void> => {
        await api.delete(`/projects/${id}`);
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/projects/bulk', { data: ids });
    }
};
