import api from './api';
import {
  BillingNote,
  BillingNoteAttachment,
  BillingNoteCounts,
  BillingNoteRequest,
} from '@/types/billingNote.types';

export const billingNoteService = {

  getGeneralNotes: async (): Promise<BillingNote[]> => {
    const response = await api.get('/billing-notes/general');
    return response.data;
  },

  getNotesByBillingPeriod: async (billingPeriodId: number): Promise<BillingNote[]> => {
    const response = await api.get(`/billing-notes/billing-period/${billingPeriodId}`);
    return response.data;
  },

  getCounts: async (): Promise<BillingNoteCounts> => {
    const response = await api.get('/billing-notes/counts');
    return response.data;
  },

  create: async (data: BillingNoteRequest): Promise<BillingNote> => {
    const response = await api.post('/billing-notes', data);
    return response.data;
  },

  update: async (id: number, data: BillingNoteRequest): Promise<BillingNote> => {
    const response = await api.put(`/billing-notes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/billing-notes/${id}`);
  },

  getAttachments: async (billingNoteId: number): Promise<BillingNoteAttachment[]> => {
    const response = await api.get(`/billing-note-attachments/billing-note/${billingNoteId}`);
    return response.data;
  },

  uploadAttachments: async (billingNoteId: number, files: File[]): Promise<BillingNoteAttachment[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await api.post(`/billing-note-attachments/upload/${billingNoteId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadAttachment: async (attachmentId: number, fileName: string): Promise<void> => {
    const response = await api.get(`/billing-note-attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteAttachment: async (attachmentId: number): Promise<void> => {
    await api.delete(`/billing-note-attachments/${attachmentId}`);
  },
};

export default billingNoteService;
