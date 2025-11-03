import api from './api';

export const subTaskService = {
    deleteSubTask: async (id: number): Promise<void> => {
        await api.delete(`/sub-tasks/${id}`);
    }
};
