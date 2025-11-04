import api from './api';

export interface BillingPeriodAttachmentResponse {
  id: number;
  billingPeriodId: number;
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

export const billingPeriodAttachmentService = {

  uploadFiles: async (billingPeriodId: number, files: FileList | File[]): Promise<BillingPeriodAttachmentResponse[]> => {
    const formData = new FormData();

    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/billing-period-attachments/upload/${billingPeriodId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },


  uploadFile: async (billingPeriodId: number, file: File): Promise<BillingPeriodAttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/billing-period-attachments/upload-single/${billingPeriodId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },


  getBillingPeriodAttachments: async (billingPeriodId: number): Promise<BillingPeriodAttachmentResponse[]> => {
    const response = await api.get(`/billing-period-attachments/billing-period/${billingPeriodId}`);
    return response.data;
  },


  getAttachmentById: async (attachmentId: number): Promise<BillingPeriodAttachmentResponse> => {
    const response = await api.get(`/billing-period-attachments/${attachmentId}`);
    return response.data;
  },

  downloadAttachment: async (attachmentId: number, fileName: string): Promise<void> => {
    const response = await api.get(`/billing-period-attachments/${attachmentId}/download`, {
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
    await api.delete(`/billing-period-attachments/${attachmentId}`);
  },


  deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
    await api.delete(`/billing-period-attachments/bulk`, { data: attachmentIds });
  },

  deleteAllBillingPeriodAttachments: async (billingPeriodId: number): Promise<void> => {
    await api.delete(`/billing-period-attachments/billing-period/${billingPeriodId}`);
  },
};