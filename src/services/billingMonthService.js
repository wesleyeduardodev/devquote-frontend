const API_BASE_URL = '/api';

const billingMonthService = {
    // QuoteBillingMonth endpoints
    findAll: () => {
        return fetch(`${API_BASE_URL}/quote-billing-months`);
    },

    findById: (id) => {
        return fetch(`${API_BASE_URL}/quote-billing-months/${id}`);
    },

    create: (data) => {
        return fetch(`${API_BASE_URL}/quote-billing-months`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    },

    update: (id, data) => {
        return fetch(`${API_BASE_URL}/quote-billing-months/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    },

    delete: (id) => {
        return fetch(`${API_BASE_URL}/quote-billing-months/${id}`, {
            method: 'DELETE'
        });
    },

    // QuoteBillingMonthQuote endpoints (para vincular orçamentos)
    findAllQuoteLinks: () => {
        return fetch(`${API_BASE_URL}/quote-billing-month-quotes`);
    },

    findQuoteLinkById: (id) => {
        return fetch(`${API_BASE_URL}/quote-billing-month-quotes/${id}`);
    },

    createQuoteLink: (data) => {
        return fetch(`${API_BASE_URL}/quote-billing-month-quotes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    },

    updateQuoteLink: (id, data) => {
        return fetch(`${API_BASE_URL}/quote-billing-month-quotes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    },

    deleteQuoteLink: (id) => {
        return fetch(`${API_BASE_URL}/quote-billing-month-quotes/${id}`, {
            method: 'DELETE'
        });
    },

    // Buscar orçamentos vinculados a um período específico
    findQuotesByBillingMonth: (billingMonthId) => {
        return fetch(`${API_BASE_URL}/quote-billing-month-quotes?quoteBillingMonthId=${billingMonthId}`);
    }
};

export default billingMonthService;