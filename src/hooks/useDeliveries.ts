import {useState, useEffect, useCallback, useRef} from 'react';
import {deliveryService} from '@/services/deliveryService';
import toast from 'react-hot-toast';

interface Delivery {
    id: number;
    taskName: string;
    taskCode: string;
    projectName: string;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    notes?: string;
    status: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface DeliveryCreate {
    quoteId: number;
    projectId: number;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    script?: string;
    notes?: string;
    status: string;
    startedAt?: string;
    finishedAt?: string;
}

interface DeliveryUpdate extends Partial<DeliveryCreate> {
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
    taskName?: string;
    taskCode?: string;
    projectName?: string;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    notes?: string;
    status?: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseDeliveriesParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseDeliveriesReturn {
    deliveries: Delivery[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchDeliveries: (params?: UseDeliveriesParams) => Promise<void>;
    createDelivery: (deliveryData: DeliveryCreate) => Promise<Delivery>;
    updateDelivery: (id: number, deliveryData: DeliveryUpdate) => Promise<Delivery>;
    deleteDelivery: (id: number) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
}

export const useDeliveries = (initialParams?: UseDeliveriesParams): UseDeliveriesReturn => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
    const [sorting, setSortingState] = useState<SortInfo[]>(
        initialParams?.sort || [{ field: 'id', direction: 'desc' }]
    );
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    // Refs para controlar o debounce
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDeliveries = useCallback(async (params?: UseDeliveriesParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await deliveryService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters,
            });

            setDeliveries(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last,
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar entregas';
            setError(errorMessage);
            console.error('Erro ao buscar entregas:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createDelivery = useCallback(async (deliveryData: DeliveryCreate): Promise<Delivery> => {
        try {
            const newDelivery = await deliveryService.create(deliveryData);
            await fetchDeliveries(); // Recarrega a lista após criação
            toast.success('Entrega criada com sucesso!');
            return newDelivery;
        } catch (err: any) {
            console.error('Erro ao criar entrega:', err);
            throw err;
        }
    }, [fetchDeliveries]);

    const updateDelivery = useCallback(async (id: number, deliveryData: DeliveryUpdate): Promise<Delivery> => {
        try {
            const updatedDelivery = await deliveryService.update(id, deliveryData);
            await fetchDeliveries(); // Recarrega a lista após atualização
            toast.success('Entrega atualizada com sucesso!');
            return updatedDelivery;
        } catch (err: any) {
            console.error('Erro ao atualizar entrega:', err);
            throw err;
        }
    }, [fetchDeliveries]);

    const deleteDelivery = useCallback(async (id: number): Promise<void> => {
        try {
            await deliveryService.delete(id);
            await fetchDeliveries(); // Recarrega a lista após exclusão
            toast.success('Entrega excluída com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir entrega:', err);
            throw err;
        }
    }, [fetchDeliveries]);

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
            fetchDeliveries();
        }, 1000);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters, fetchDeliveries]);

    return {
        deliveries,
        pagination,
        loading,
        error,
        sorting,
        filters,
        fetchDeliveries,
        createDelivery,
        updateDelivery,
        deleteDelivery,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
    };
};