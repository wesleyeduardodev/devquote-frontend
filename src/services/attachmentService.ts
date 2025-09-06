import api from './api';
import { TaskAttachment } from '@/types/attachments';

export const attachmentService = {
    async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
        const response = await api.get(`/task-attachments/task/${taskId}`);
        return response.data;
    },

    async downloadAttachment(attachmentId: number): Promise<Blob> {
        const response = await api.get(`/task-attachments/download/${attachmentId}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    async deleteAttachment(attachmentId: number): Promise<void> {
        await api.delete(`/task-attachments/${attachmentId}`);
    },

    async getAttachment(attachmentId: number): Promise<TaskAttachment> {
        const response = await api.get(`/task-attachments/${attachmentId}`);
        return response.data;
    }
};