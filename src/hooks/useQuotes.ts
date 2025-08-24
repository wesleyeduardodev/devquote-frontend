import {useState, useEffect, useCallback, useRef} from 'react';
import {quoteService} from '@/services/quoteService';
import toast from 'react-hot-toast';

interface Quote {
    id: number;
    taskId: number;
    taskName: string;
    taskCode: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

interface QuoteCreate {
    taskId: number;
    status: string;
    totalAmount: number;
}

interface QuoteUpdate extends Partial<QuoteCreate> {
    id?: number;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
    first: boolean;
    last: boolean;
}

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface FilterParams {
    [key: string]: string | undefined;

    id?: string;
    taskId?: string;
    taskName?: string;
    taskCode?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseQuotesParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseQuotesReturn {
    quotes: Quote[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchQuotes: (params?: UseQuotesParams) => Promise<void>;
    createQuote: (quoteData: QuoteCreate) => Promise<Quote>;
    updateQuote: (id: number, quoteData: QuoteUpdate) => Promise<Quote>;
    deleteQuote: (id: number) => Promise<void>;
    deleteBulkQuotes: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
}

const useQuotes = (initialParams?: UseQuotesParams): UseQuotesReturn => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 5);
    const [sorting, setSortingState] = useState<SortInfo[]>(
        initialParams?.sort || [{ field: 'id', direction: 'desc' }]
    );
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    // Refs para controlar o debounce
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchQuotes = useCallback(async (params?: UseQuotesParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await quoteService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters,
            });

            setQuotes(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last,
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar orçamentos';
            setError(errorMessage);
            console.error('Erro ao buscar orçamentos:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createQuote = useCallback(async (quoteData: QuoteCreate): Promise<Quote> => {
        try {
            const newQuote = await quoteService.create(quoteData);
            await fetchQuotes(); // Recarrega a lista após criação
            toast.success('Orçamento criado com sucesso!');
            return newQuote;
        } catch (err: any) {
            console.error('Erro ao criar orçamento:', err);
            throw err;
        }
    }, [fetchQuotes]);

    const updateQuote = useCallback(async (id: number, quoteData: QuoteUpdate): Promise<Quote> => {
        try {
            const updatedQuote = await quoteService.update(id, quoteData);
            await fetchQuotes(); // Recarrega a lista após atualização
            toast.success('Orçamento atualizado com sucesso!');
            return updatedQuote;
        } catch (err: any) {
            console.error('Erro ao atualizar orçamento:', err);
            throw err;
        }
    }, [fetchQuotes]);

    const deleteQuote = useCallback(async (id: number): Promise<void> => {
        try {
            await quoteService.delete(id);
            await fetchQuotes(); // Recarrega a lista após exclusão
            toast.success('Orçamento excluído com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir orçamento:', err);
            throw err;
        }
    }, [fetchQuotes]);

    const deleteBulkQuotes = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await quoteService.deleteBulk(ids);
            await fetchQuotes(); // Recarrega a lista após exclusão
            toast.success(`${ids.length} orçamento${ids.length === 1 ? '' : 's'} excluído${ids.length === 1 ? '' : 's'} com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir orçamentos:', err);
            throw err;
        }
    }, [fetchQuotes]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0); // Reset to first page when changing page size
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState(prevSorting => {
            // Remove existing sort para este campo e adiciona o novo no início
            const filteredSorting = prevSorting.filter(s => s.field !== field);
            return [{ field, direction }, ...filteredSorting];
        });
        setCurrentPage(0); // Reset to first page when sorting changes
    }, []);

    const setFilter = useCallback((field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value || undefined,
        }));
        setCurrentPage(0); // Reset to first page when filter changes
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    // Effect para buscar dados quando parâmetros mudarem (com debounce para filtros)
    useEffect(() => {
        // Limpa timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Define novo timer de debounce (1s)
        debounceTimerRef.current = setTimeout(() => {
            fetchQuotes();
        }, 1000);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters, fetchQuotes]);

    return {
        quotes,
        pagination,
        loading,
        error,
        sorting,
        filters,
        fetchQuotes,
        createQuote,
        updateQuote,
        deleteQuote,
        deleteBulkQuotes,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
    };
};

export default useQuotes;
