import api from './api';

export const deliveryService = {

    getAll: async (): Promise<any> => {
        const response = await api.get('/deliveries');
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    create: async (data: any): Promise<any> => {
        const response = await api.post('/deliveries', data);
        return response.data;
    },

    update: async (id: any, data: any): Promise<any> => {
        const response = await api.put(`/deliveries/${id}`, data);
        return response.data;
    },

    delete: async (id: any): Promise<boolean> => {
        await api.delete(`/deliveries/${id}`);
        return true;
    },
};