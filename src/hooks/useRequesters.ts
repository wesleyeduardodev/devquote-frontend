import {useState, useEffect, useCallback, useRef} from 'react';
import {requesterService} from '@/services/requesterService';
import toast from 'react-hot-toast';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface RequesterCreate {
    name: string;
    email?: string;
    phone?: string;
}

interface RequesterUpdate extends Partial<RequesterCreate> {
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
    name?: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseRequestersParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseRequestersReturn {
    requesters: Requester[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchRequesters: (params?: UseRequestersParams) => Promise<void>;
    createRequester: (requesterData: RequesterCreate) => Promise<Requester>;
    updateRequester: (id: number, requesterData: RequesterUpdate) => Promise<Requester>;
    deleteRequester: (id: number) => Promise<void>;
    deleteBulkRequesters: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
}

export const useRequesters = (initialParams?: UseRequestersParams): UseRequestersReturn => {
    const [requesters, setRequesters] = useState<Requester[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        {field: 'id', direction: 'asc'}
    ]);
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchRequesters = useCallback(async (params?: UseRequestersParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await requesterService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters
            });

            setRequesters(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar solicitantes';
            setError(errorMessage);
            console.error('Erro ao buscar solicitantes:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createRequester = useCallback(async (requesterData: RequesterCreate): Promise<Requester> => {
        try {
            const newRequester = await requesterService.create(requesterData);
            await fetchRequesters();
            toast.success('Solicitante criado com sucesso!');
            return newRequester;
        } catch (err: any) {
            console.error('Erro ao criar solicitante:', err);
            throw err;
        }
    }, [fetchRequesters]);

    const updateRequester = useCallback(async (id: number, requesterData: RequesterUpdate): Promise<Requester> => {
        try {
            const updatedRequester = await requesterService.update(id, requesterData);
            await fetchRequesters();
            toast.success('Solicitante atualizado com sucesso!');
            return updatedRequester;
        } catch (err: any) {
            console.error('Erro ao atualizar solicitante:', err);
            throw err;
        }
    }, [fetchRequesters]);

    const deleteRequester = useCallback(async (id: number): Promise<void> => {
        try {
            await requesterService.delete(id);
            await fetchRequesters();
            toast.success('Solicitante excluído com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir solicitante:', err);
            throw err;
        }
    }, [fetchRequesters]);

    const deleteBulkRequesters = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await requesterService.deleteBulk(ids);
            await fetchRequesters();
            toast.success(`${ids.length} solicitante${ids.length === 1 ? '' : 's'} excluído${ids.length === 1 ? '' : 's'} com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir solicitantes:', err);
            throw err;
        }
    }, [fetchRequesters]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0);
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState(prevSorting => {
            const filteredSorting = prevSorting.filter(s => s.field !== field);
            return [{field, direction}, ...filteredSorting];        });
        setCurrentPage(0);
    }, []);

    const setFilter = useCallback((field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value || undefined
        }));
        setCurrentPage(0);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            fetchRequesters();
        }, 1000);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters]);

    return {
        requesters,
        pagination,
        loading,
        error,
        sorting,
        filters,
        fetchRequesters,
        createRequester,
        updateRequester,
        deleteRequester,
        deleteBulkRequesters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
    };
};
