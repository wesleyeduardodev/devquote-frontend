import api from './api';

export interface OperationalReportRequest {
    dataInicio: string;
    dataFim: string;
    tipoTarefa?: string | null;
    ambiente?: string | null;
}

export const reportService = {
    generateOperationalPdf: async (request: OperationalReportRequest): Promise<Blob> => {
        const response = await api.post('/reports/operational/pdf', request, {
            responseType: 'blob'
        });
        return response.data;
    },

    generateTaskPdf: async (taskId: number): Promise<Blob> => {
        const response = await api.get(`/reports/task/${taskId}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    generateDeliveryPdf: async (deliveryId: number): Promise<Blob> => {
        const response = await api.get(`/reports/delivery/${deliveryId}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }
};
