import api from './api';

export const quoteService = {

    getAll: async (): Promise<any> => {
        const response = await api.get('/quotes');
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/quotes/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<any> => {
        const response = await api.post('/quotes', data);
        return response.data;
    },

    update: async (id: any, data: any): Promise<any> => {
        const response = await api.put(`/quotes/${id}`, data);
        return response.data;
    },

    delete: async (id: any): Promise<boolean> => {
        await api.delete(`/quotes/${id}`);
        return true;
    },
};