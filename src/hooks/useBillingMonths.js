import { useState, useEffect } from 'react';

export const useBillingMonths = () => {
    const [billingMonths, setBillingMonths] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async (url, method = 'GET', data = null) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`/api${url}`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    };

    const fetchBillingMonths = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await request('/quote-billing-months', 'GET');
            setBillingMonths(response);
        } catch (err) {
            setError(err.message || 'Erro ao carregar períodos de faturamento');
        } finally {
            setLoading(false);
        }
    };

    const createBillingMonth = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await request('/quote-billing-months', 'POST', data);
            setBillingMonths(prev => [...prev, response]);
            return response;
        } catch (err) {
            setError(err.message || 'Erro ao criar período de faturamento');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateBillingMonth = async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await request(`/quote-billing-months/${id}`, 'PUT', data);
            setBillingMonths(prev =>
                prev.map(item => item.id === id ? response : item)
            );
            return response;
        } catch (err) {
            setError(err.message || 'Erro ao atualizar período de faturamento');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteBillingMonth = async (id) => {
        setLoading(true);
        setError(null);
        try {
            await request(`/quote-billing-months/${id}`, 'DELETE');
            setBillingMonths(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            setError(err.message || 'Erro ao excluir período de faturamento');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const linkQuoteToBilling = async (quoteBillingMonthId, quoteId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await request('/quote-billing-month-quotes', 'POST', {
                quoteBillingMonthId,
                quoteId
            });
            return response;
        } catch (err) {
            setError(err.message || 'Erro ao vincular orçamento');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const unlinkQuoteFromBilling = async (linkId) => {
        setLoading(true);
        setError(null);
        try {
            await request(`/quote-billing-month-quotes/${linkId}`, 'DELETE');
        } catch (err) {
            setError(err.message || 'Erro ao desvincular orçamento');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingMonths();
    }, []);

    return {
        billingMonths,
        loading,
        error,
        fetchBillingMonths,
        createBillingMonth,
        updateBillingMonth,
        deleteBillingMonth,
        linkQuoteToBilling,
        unlinkQuoteFromBilling
    };
};