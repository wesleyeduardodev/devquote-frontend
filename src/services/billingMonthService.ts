import api from './api';

const billingMonthService = {

    findAll: async (): Promise<any> => {
        const res = await api.get('/quote-billing-months');
        return res.data;
    },

    findById: async (id: any): Promise<any> => {
        const res = await api.get(`/quote-billing-months/${id}`);
        return res.data;
    },

    create: async (data: any): Promise<any> => {
        const res = await api.post('/quote-billing-months', data);
        return res.data;
    },

    update: async (id: any, data: any): Promise<any> => {
        const res = await api.put(`/quote-billing-months/${id}`, data);
        return res.data;
    },

    delete: async (id: any): Promise<boolean> => {
        await api.delete(`/quote-billing-months/${id}`);
        return true;
    },

    findAllQuoteLinks: async (): Promise<any> => {
        const res = await api.get('/quote-billing-month-quotes');
        return res.data;
    },

    findQuoteLinkById: async (id: any): Promise<any> => {
        const res = await api.get(`/quote-billing-month-quotes/${id}`);
        return res.data;
    },

    createQuoteLink: async (data: any): Promise<any> => {
        const res = await api.post('/quote-billing-month-quotes', data);
        return res.data;
    },

    updateQuoteLink: async (id: any, data: any): Promise<any> => {
        const res = await api.put(`/quote-billing-month-quotes/${id}`, data);
        return res.data;
    },

    deleteQuoteLink: async (id: any): Promise<boolean> => {
        await api.delete(`/quote-billing-month-quotes/${id}`);
        return true;
    },

    findQuoteLinksByBillingMonth: async (billingMonthId: any): Promise<any> => {
        const res = await api.get(`/quote-billing-month-quotes/by-billing-month/${billingMonthId}`);
        return res.data;
    },

    deleteBulk: async (ids: number[]): Promise<void> => {
        await api.delete('/quote-billing-months/bulk', { data: ids });
    }
};

export default billingMonthService;