import api from './api';
import {
  DeliveryOperationalItem,
  DeliveryOperationalItemRequest,
  DeliveryOperationalAttachment
} from '../types/deliveryOperational';

const deliveryOperationalService = {
  // ========== CRUD Itens Operacionais ==========

  createItem: async (data: DeliveryOperationalItemRequest): Promise<DeliveryOperationalItem> => {
    const response = await api.post('/delivery-operational', data);
    return response.data;
  },

  updateItem: async (id: number, data: DeliveryOperationalItemRequest): Promise<DeliveryOperationalItem> => {
    const response = await api.put(`/delivery-operational/${id}`, data);
    return response.data;
  },

  getItem: async (id: number): Promise<DeliveryOperationalItem> => {
    const response = await api.get(`/delivery-operational/${id}`);
    return response.data;
  },

  getItemsByDelivery: async (deliveryId: number): Promise<DeliveryOperationalItem[]> => {
    const response = await api.get(`/delivery-operational/delivery/${deliveryId}`);
    return response.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/delivery-operational/${id}`);
  },

  // ========== Anexos ==========

  uploadAttachments: async (itemId: number, files: File[]): Promise<DeliveryOperationalAttachment[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await api.post(`/delivery-operational/${itemId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAttachments: async (itemId: number): Promise<DeliveryOperationalAttachment[]> => {
    const response = await api.get(`/delivery-operational/${itemId}/attachments`);
    return response.data;
  },

  downloadAttachment: async (id: number): Promise<Blob> => {
    const response = await api.get(`/delivery-operational/attachments/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  deleteAttachment: async (id: number): Promise<void> => {
    await api.delete(`/delivery-operational/attachments/${id}`);
  },
};

export default deliveryOperationalService;
