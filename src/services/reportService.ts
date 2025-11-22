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
    }
};
