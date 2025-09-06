import api from './api';

export interface DeliveryAttachmentResponse {
  id: number;
  deliveryId: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
  createdAt: string;
}

export const deliveryAttachmentService = {
  /**
   * Faz upload de múltiplos arquivos para uma entrega
   */
  uploadFiles: async (deliveryId: number, files: FileList | File[]): Promise<DeliveryAttachmentResponse[]> => {
    const formData = new FormData();
    formData.append('deliveryId', deliveryId.toString());
    
    // Convert FileList to Array if needed
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post('/delivery-attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Lista todos os anexos de uma entrega
   */
  getDeliveryAttachments: async (deliveryId: number): Promise<DeliveryAttachmentResponse[]> => {
    const response = await api.get(`/delivery-attachments/delivery/${deliveryId}`);
    return response.data;
  },

  /**
   * Busca anexo por ID
   */
  getAttachmentById: async (attachmentId: number): Promise<DeliveryAttachmentResponse> => {
    const response = await api.get(`/delivery-attachments/${attachmentId}`);
    return response.data;
  },

  /**
   * Faz download de um anexo
   */
  downloadAttachment: async (attachmentId: number, fileName: string): Promise<void> => {
    const response = await api.get(`/delivery-attachments/${attachmentId}/download`, {
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
    await api.delete(`/delivery-attachments/${attachmentId}`);
  },

  /**
   * Exclui múltiplos anexos
   */
  deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
    await api.delete(`/delivery-attachments/bulk`, { data: attachmentIds });
  },

  /**
   * Exclui todos os anexos de uma entrega
   */
  deleteAllDeliveryAttachments: async (deliveryId: number): Promise<void> => {
    await api.delete(`/delivery-attachments/delivery/${deliveryId}`);
  },
};