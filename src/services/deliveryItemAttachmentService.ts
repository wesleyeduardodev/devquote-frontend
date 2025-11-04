import api from './api';

export interface DeliveryItemAttachmentResponse {
  id: number;
  deliveryItemId: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
  createdAt: string;
}

export const deliveryItemAttachmentService = {

  uploadFiles: async (deliveryItemId: number, files: FileList | File[]): Promise<DeliveryItemAttachmentResponse[]> => {
    const formData = new FormData();
    formData.append('deliveryItemId', deliveryItemId.toString());

    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post('/delivery-item-attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  getDeliveryItemAttachments: async (deliveryItemId: number): Promise<DeliveryItemAttachmentResponse[]> => {
    const response = await api.get(`/delivery-item-attachments/delivery-item/${deliveryItemId}`);
    return response.data;
  },


  getAttachmentById: async (attachmentId: number): Promise<DeliveryItemAttachmentResponse> => {
    const response = await api.get(`/delivery-item-attachments/${attachmentId}`);
    return response.data;
  },


  downloadAttachment: async (attachmentId: number, fileName: string): Promise<void> => {
    const response = await api.get(`/delivery-item-attachments/${attachmentId}/download`, {
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
    await api.delete(`/delivery-item-attachments/${attachmentId}`);
  },


  deleteAttachments: async (attachmentIds: number[]): Promise<void> => {
    await api.delete(`/delivery-item-attachments/bulk`, { data: attachmentIds });
  },


  deleteAllDeliveryItemAttachments: async (deliveryItemId: number): Promise<void> => {
    await api.delete(`/delivery-item-attachments/delivery-item/${deliveryItemId}`);
  },
};