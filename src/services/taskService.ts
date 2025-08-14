import api from './api';

export const taskService = {

    getAll: async (): Promise<any> => {
        const response = await api.get('/tasks');
        return response.data;
    },

    getById: async (id: any): Promise<any> => {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    createWithSubTasks: async (data: any): Promise<any> => {
        const response = await api.post('/tasks/full', data);
        return response.data;
    },

    updateWithSubTasks: async (id: any, data: any): Promise<any> => {
        const response = await api.put(`/tasks/full/${id}`, data);
        return response.data;
    },

    deleteTaskWithSubTasks: async (id: any): Promise<boolean> => {
        await api.delete(`/tasks/full/${id}`);
        return true;
    },
};