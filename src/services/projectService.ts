import api from './api';

export const projectService = {

    getAll: async (): Promise<any> => {
        const response = await api.get('/projects');
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
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
    }
};