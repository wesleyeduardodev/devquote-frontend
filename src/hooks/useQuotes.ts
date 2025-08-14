import {useState, useEffect, useCallback} from 'react';
import {quoteService} from '@/services/quoteService';
import toast from 'react-hot-toast';

interface Quote {
    id: number;
    title?: string;
    description?: string;
    amount?: number;
    status?: string;
    requesterId?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface UseQuotesReturn {
    quotes: Quote[];
    loading: boolean;
    error: string | null;
    fetchQuotes: () => Promise<void>;
}

export const useQuotes = (): UseQuotesReturn => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuotes = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await quoteService.getAll();
            setQuotes(data);
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar orçamentos';
            setError(errorMessage);
            console.error('Erro ao buscar orçamentos:', err);
            toast.error('Erro ao buscar orçamentos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    return {
        quotes,
        loading,
        error,
        fetchQuotes,
    };
};

export default useQuotes;