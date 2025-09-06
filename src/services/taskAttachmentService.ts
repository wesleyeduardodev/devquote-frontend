import api from './api';

export interface TaskAttachmentResponse {
    id: number;
    taskId: number;
    fileName: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    filePath: string;
    fileUrl?: string;
    excluded: boolean;
    uploadedAt: string;
    createdAt: string;
    updatedAt: string;
}

export const taskAttachmentService = {
    /**
     * Faz upload de múltiplos arquivos para uma tarefa
     */
    uploadFiles: async (taskId: number, files: FileList | File[]): Promise<TaskAttachmentResponse[]> => {
        const formData = new FormData();
        
        // Convert FileList to Array if needed
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post(`/task-attachments/upload/${taskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Faz upload de um arquivo para uma tarefa
     */
    uploadFile: async (taskId: number, file: File): Promise<TaskAttachmentResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/task-attachments/upload-single/${taskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Lista todos os anexos de uma tarefa
     */
    getTaskAttachments: async (taskId: number): Promise<TaskAttachmentResponse[]> => {
        const response = await api.get(`/task-attachments/task/${taskId}`);
        return response.data;
    },

    /**
     * Busca anexo por ID
     */
    getAttachment: async (attachmentId: number): Promise<TaskAttachmentResponse> => {
        const response = await api.get(`/task-attachments/${attachmentId}`);
        return response.data;
    },

    /**
     * Faz download de um anexo
     */
    downloadAttachment: async (attachmentId: number): Promise<Blob> => {
        const response = await api.get(`/task-attachments/download/${attachmentId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Exclui um anexo
     */
    deleteAttachment: async (attachmentId: number): Promise<void> => {
        await api.delete(`/task-attachments/${attachmentId}`);
    },

    /**
     * Exclui múltiplos anexos
     */
    deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
        await api.delete(`/task-attachments/bulk`, { data: attachmentIds });
    },

    /**
     * Exclui todos os anexos de uma tarefa
     */
    deleteAllTaskAttachments: async (taskId: number): Promise<void> => {
        await api.delete(`/task-attachments/task/${taskId}`);
    },
};