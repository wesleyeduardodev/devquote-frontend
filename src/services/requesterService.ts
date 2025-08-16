import api from './api';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
}

export const requesterService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/requesters');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
        const {page, size, sort} = params;

        const sortParams = sort.map(s => `${s.field},${s.direction}`);

        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        sortParams.forEach(sortParam => {
            queryParams.append('sort', sortParam);
        });

        const response = await api.get(`/requesters?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/requesters/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<any> => {
        const response = await api.post('/requesters', data);
        return response.data;
    },

    update: async (id: any, data: any): Promise<any> => {
        const response = await api.put(`/requesters/${id}`, data);
        return response.data;
    },

    delete: async (id: any): Promise<boolean> => {
        await api.delete(`/requesters/${id}`);
        return true;
    },
};
