import { useState, useEffect, useCallback } from 'react';

interface BillingMonth {
    id: number;
    month: number;
    year: number;
    paymentDate?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

interface BillingMonthCreate {
    month: number;
    year: number;
    paymentDate?: string;
    status: string;
}

interface BillingMonthUpdate extends Partial<BillingMonthCreate> {
    id?: number;
}

interface LinkQuoteRequest {
    quoteBillingMonthId: number;
    quoteId: number;
}

interface UseBillingMonthsReturn {
    billingMonths: BillingMonth[];
    loading: boolean;
    error: string | null;
    fetchBillingMonths: () => Promise<void>;
    createBillingMonth: (data: BillingMonthCreate) => Promise<BillingMonth>;
    updateBillingMonth: (id: number, data: BillingMonthUpdate) => Promise<BillingMonth>;
    deleteBillingMonth: (id: number) => Promise<void>;
    linkQuoteToBilling: (quoteBillingMonthId: number, quoteId: number) => Promise<any>;
    unlinkQuoteFromBilling: (linkId: number) => Promise<void>;
}

export const useBillingMonths = (): UseBillingMonthsReturn => {
    const [billingMonths, setBillingMonths] = useState<BillingMonth[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const request = async <T = any>(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        data: any = null
    ): Promise<T> => {
        const options: RequestInit = {
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

    const fetchBillingMonths = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await request<BillingMonth[]>('/quote-billing-months', 'GET');
            setBillingMonths(response);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar períodos de faturamento');
        } finally {
            setLoading(false);
        }
    }, []);

    const createBillingMonth = useCallback(async (data: BillingMonthCreate): Promise<BillingMonth> => {
        setLoading(true);
        setError(null);
        try {
            const response = await request<BillingMonth>('/quote-billing-months', 'POST', data);
            setBillingMonths(prev => [...prev, response]);
            return response;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar período de faturamento');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBillingMonth = useCallback(async (id: number, data: BillingMonthUpdate): Promise<BillingMonth> => {
        setLoading(true);
        setError(null);
        try {
            const response = await request<BillingMonth>(`/quote-billing-months/${id}`, 'PUT', data);
            setBillingMonths(prev =>
                prev.map(item => item.id === id ? response : item)
            );
            return response;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar período de faturamento');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteBillingMonth = useCallback(async (id: number): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await request(`/quote-billing-months/${id}`, 'DELETE');
            setBillingMonths(prev => prev.filter(item => item.id !== id));
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir período de faturamento');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const linkQuoteToBilling = useCallback(async (quoteBillingMonthId: number, quoteId: number): Promise<any> => {
        setLoading(true);
        setError(null);
        try {
            const response = await request('/quote-billing-month-quotes', 'POST', {
                quoteBillingMonthId,
                quoteId
            });
            return response;
        } catch (err: any) {
            setError(err.message || 'Erro ao vincular orçamento');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const unlinkQuoteFromBilling = useCallback(async (linkId: number): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await request(`/quote-billing-month-quotes/${linkId}`, 'DELETE');
        } catch (err: any) {
            setError(err.message || 'Erro ao desvincular orçamento');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBillingMonths();
    }, [fetchBillingMonths]);

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