import api from './api';

export interface SubTaskAttachmentResponse {
    id: number;
    subTaskId: number;
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

export const subTaskAttachmentService = {

    uploadFiles: async (subTaskId: number, files: FileList | File[]): Promise<SubTaskAttachmentResponse[]> => {
        const formData = new FormData();

        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post(`/subtask-attachments/upload/${subTaskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    uploadFile: async (subTaskId: number, file: File): Promise<SubTaskAttachmentResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/subtask-attachments/upload-single/${subTaskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getSubTaskAttachments: async (subTaskId: number): Promise<SubTaskAttachmentResponse[]> => {
        const response = await api.get(`/subtask-attachments/subtask/${subTaskId}`);
        return response.data;
    },

    getAttachment: async (attachmentId: number): Promise<SubTaskAttachmentResponse> => {
        const response = await api.get(`/subtask-attachments/${attachmentId}`);
        return response.data;
    },

    downloadAttachment: async (attachmentId: number): Promise<Blob> => {
        const response = await api.get(`/subtask-attachments/download/${attachmentId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    deleteAttachment: async (attachmentId: number): Promise<void> => {
        await api.delete(`/subtask-attachments/${attachmentId}`);
    },

    deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
        await api.delete(`/subtask-attachments/bulk`, { data: attachmentIds });
    },

    deleteAllSubTaskAttachments: async (subTaskId: number): Promise<void> => {
        await api.delete(`/subtask-attachments/subtask/${subTaskId}`);
    },
};
