import api from './api';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    id?: string;
    requesterId?: string;
    requesterName?: string;
    title?: string;
    description?: string;
    code?: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PaginatedParams {
    page: number;
    size: number;
    sort: SortInfo[];
    filters?: FilterParams;
}

export const taskService = {
    getAll: async (): Promise<any> => {
        const response = await api.get('/tasks');
        return response.data;
    },

    getAllPaginated: async (params: PaginatedParams): Promise<any> => {
        const {page, size, sort, filters} = params;

        const sortParams = sort.map(s => `${s.field},${s.direction}`);

        const queryParams = new URLSearchParams({
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

        const response = await api.get(`/tasks?${queryParams.toString()}`);
        return response.data;
    },

    getUnlinkedPaginated: async (params: PaginatedParams): Promise<any> => {
        const {page, size, sort, filters} = params;

        const sortParams = sort.map(s => `${s.field},${s.direction}`);

        const queryParams = new URLSearchParams({
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

        const response = await api.get(`/tasks/unlinked-billing?${queryParams.toString()}`);
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

    createWithSubTasksAndFiles: async (data: any, files: File[]): Promise<any> => {
        const formData = new FormData();

        // Adiciona o JSON da tarefa como uma parte do FormData
        formData.append('task', new Blob([JSON.stringify(data)], {
            type: 'application/json'
        }));

        // Adiciona cada arquivo
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post('/tasks/full/with-files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

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

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/tasks/bulk', { data: ids });
    },

    exportToExcel: async (): Promise<Blob> => {
        const response = await api.get('/tasks/export/excel', {
            responseType: 'blob'
        });
        return response.data;
    },

    exportGeneralReport: async (): Promise<Blob> => {
        const response = await api.get('/tasks/export/general-report', {
            responseType: 'blob'
        });
        return response.data;
    },

    exportGeneralReportForUser: async (): Promise<Blob> => {
        const response = await api.get('/tasks/export/general-report-user', {
            responseType: 'blob'
        });
        return response.data;
    },

    sendFinancialEmail: async (taskId: number): Promise<void> => {
        await api.post(`/tasks/${taskId}/send-financial-email`);
    },

    sendTaskEmail: async (taskId: number): Promise<void> => {
        await api.post(`/tasks/${taskId}/send-task-email`);
    }
};