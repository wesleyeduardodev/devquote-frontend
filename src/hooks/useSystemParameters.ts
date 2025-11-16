import { useState, useEffect, useCallback, useRef } from 'react';
import { systemParameterService } from '@/services/systemParameterService';
import toast from 'react-hot-toast';

interface SystemParameter {
    id: number;
    name: string;
    value?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface SystemParameterCreate {
    name: string;
    value?: string;
    description?: string;
}

interface SystemParameterUpdate extends Partial<SystemParameterCreate> {
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
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseSystemParametersParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseSystemParametersReturn {
    systemParameters: SystemParameter[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchSystemParameters: (params?: UseSystemParametersParams) => Promise<void>;
    createSystemParameter: (data: SystemParameterCreate) => Promise<SystemParameter>;
    updateSystemParameter: (id: number, data: SystemParameterUpdate) => Promise<SystemParameter>;
    deleteSystemParameter: (id: number) => Promise<void>;
    deleteBulkSystemParameters: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
}

export const useSystemParameters = (initialParams?: UseSystemParametersParams): UseSystemParametersReturn => {
    const [systemParameters, setSystemParameters] = useState<SystemParameter[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 25);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        { field: 'id', direction: 'asc' }
    ]);
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSystemParameters = useCallback(async (params?: UseSystemParametersParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await systemParameterService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters
            });

            setSystemParameters(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar parâmetros do sistema';
            setError(errorMessage);
            console.error('Erro ao buscar parâmetros do sistema:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createSystemParameter = useCallback(async (data: SystemParameterCreate): Promise<SystemParameter> => {
        try {
            setLoading(true);
            const newParameter = await systemParameterService.create(data);
            await fetchSystemParameters();
            toast.success('Parâmetro criado com sucesso!');
            return newParameter;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao criar parâmetro';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSystemParameters]);

    const updateSystemParameter = useCallback(async (id: number, data: SystemParameterUpdate): Promise<SystemParameter> => {
        try {
            setLoading(true);
            const updatedParameter = await systemParameterService.update(id, data);
            await fetchSystemParameters();
            toast.success('Parâmetro atualizado com sucesso!');
            return updatedParameter;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao atualizar parâmetro';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSystemParameters]);

    const deleteSystemParameter = useCallback(async (id: number): Promise<void> => {
        try {
            setLoading(true);
            await systemParameterService.delete(id);
            await fetchSystemParameters();
            toast.success('Parâmetro excluído com sucesso!');
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao excluir parâmetro';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSystemParameters]);

    const deleteBulkSystemParameters = useCallback(async (ids: number[]): Promise<void> => {
        try {
            setLoading(true);
            await systemParameterService.deleteBulk(ids);
            await fetchSystemParameters();
            toast.success(`${ids.length} parâmetro(s) excluído(s) com sucesso!`);
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao excluir parâmetros';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSystemParameters]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0);
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState([{ field, direction }]);
    }, []);

    const setFilter = useCallback((field: string, value: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                [field]: value || undefined
            }));
            setCurrentPage(0);
        }, 500);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    useEffect(() => {
        fetchSystemParameters();
    }, [fetchSystemParameters, currentPage, pageSize, sorting, filters]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        systemParameters,
        pagination,
        loading,
        error,
        sorting,
        filters,
        fetchSystemParameters,
        createSystemParameter,
        updateSystemParameter,
        deleteSystemParameter,
        deleteBulkSystemParameters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters
    };
};
