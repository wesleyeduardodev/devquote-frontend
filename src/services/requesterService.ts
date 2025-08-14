import api from './api';

export const requesterService = {

    getAll: async (): Promise<any> => {
        const response = await api.get('/requesters');
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