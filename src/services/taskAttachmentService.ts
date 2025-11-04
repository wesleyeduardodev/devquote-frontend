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

    uploadFiles: async (taskId: number, files: FileList | File[]): Promise<TaskAttachmentResponse[]> => {
        const formData = new FormData();

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


    getTaskAttachments: async (taskId: number): Promise<TaskAttachmentResponse[]> => {
        const response = await api.get(`/task-attachments/task/${taskId}`);
        return response.data;
    },


    getAttachment: async (attachmentId: number): Promise<TaskAttachmentResponse> => {
        const response = await api.get(`/task-attachments/${attachmentId}`);
        return response.data;
    },


    downloadAttachment: async (attachmentId: number): Promise<Blob> => {
        const response = await api.get(`/task-attachments/download/${attachmentId}`, {
            responseType: 'blob',
        });
        return response.data;
    },


    deleteAttachment: async (attachmentId: number): Promise<void> => {
        await api.delete(`/task-attachments/${attachmentId}`);
    },


    deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
        await api.delete(`/task-attachments/bulk`, { data: attachmentIds });
    },


    deleteAllTaskAttachments: async (taskId: number): Promise<void> => {
        await api.delete(`/task-attachments/task/${taskId}`);
    },
};