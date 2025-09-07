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
  /**
   * Faz upload de múltiplos arquivos para um período de faturamento
   */
  uploadFiles: async (billingPeriodId: number, files: FileList | File[]): Promise<BillingPeriodAttachmentResponse[]> => {
    const formData = new FormData();
    
    // Convert FileList to Array if needed
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

  /**
   * Faz upload de um único arquivo para um período de faturamento
   */
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

  /**
   * Lista todos os anexos de um período de faturamento
   */
  getBillingPeriodAttachments: async (billingPeriodId: number): Promise<BillingPeriodAttachmentResponse[]> => {
    const response = await api.get(`/billing-period-attachments/billing-period/${billingPeriodId}`);
    return response.data;
  },

  /**
   * Busca anexo por ID
   */
  getAttachmentById: async (attachmentId: number): Promise<BillingPeriodAttachmentResponse> => {
    const response = await api.get(`/billing-period-attachments/${attachmentId}`);
    return response.data;
  },

  /**
   * Faz download de um anexo
   */
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

  /**
   * Exclui um anexo
   */
  deleteAttachment: async (attachmentId: number): Promise<void> => {
    await api.delete(`/billing-period-attachments/${attachmentId}`);
  },

  /**
   * Exclui múltiplos anexos
   */
  deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
    await api.delete(`/billing-period-attachments/bulk`, { data: attachmentIds });
  },

  /**
   * Exclui todos os anexos de um período de faturamento
   */
  deleteAllBillingPeriodAttachments: async (billingPeriodId: number): Promise<void> => {
    await api.delete(`/billing-period-attachments/billing-period/${billingPeriodId}`);
  },
};