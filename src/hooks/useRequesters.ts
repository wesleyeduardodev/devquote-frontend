import {useState, useEffect, useCallback} from 'react';
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

interface UseRequestersParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
}

interface UseRequestersReturn {
    requesters: Requester[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    fetchRequesters: (params?: UseRequestersParams) => Promise<void>;
    createRequester: (requesterData: RequesterCreate) => Promise<Requester>;
    updateRequester: (id: number, requesterData: RequesterUpdate) => Promise<Requester>;
    deleteRequester: (id: number) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
}

export const useRequesters = (initialParams?: UseRequestersParams): UseRequestersReturn => {
    const [requesters, setRequesters] = useState<Requester[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        { field: 'id', direction: 'asc' }
    ]);

    const fetchRequesters = useCallback(async (params?: UseRequestersParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;

            const data = await requesterService.getAllPaginated({
                page,
                size,
                sort
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
    }, [currentPage, pageSize, sorting]);

    const createRequester = useCallback(async (requesterData: RequesterCreate): Promise<Requester> => {
        try {
            const newRequester = await requesterService.create(requesterData);
            await fetchRequesters(); // Recarrega a lista após criação
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
            await fetchRequesters(); // Recarrega a lista após atualização
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
            await fetchRequesters(); // Recarrega a lista após exclusão
            toast.success('Solicitante excluído com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir solicitante:', err);
            throw err;
        }
    }, [fetchRequesters]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0); // Reset to first page when changing page size
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState(prevSorting => {
            // Remove existing sort for this field and add new one at the beginning
            const filteredSorting = prevSorting.filter(s => s.field !== field);
            return [{ field, direction }, ...filteredSorting];
        });
        setCurrentPage(0); // Reset to first page when sorting changes
    }, []);

    // Effect to fetch data when parameters change
    useEffect(() => {
        fetchRequesters();
    }, [fetchRequesters]);

    return {
        requesters,
        pagination,
        loading,
        error,
        sorting,
        fetchRequesters,
        createRequester,
        updateRequester,
        deleteRequester,
        setPage,
        setPageSize,
        setSorting,
    };
};
