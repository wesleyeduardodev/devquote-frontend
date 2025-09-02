import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveryGroupService } from '@/services/deliveryGroupService';
import { deliveryService } from '@/services/deliveryService';
import toast from 'react-hot-toast';
import { handleApiError, getUserErrorMessage } from '@/utils/errorHandler';
import type { DeliveryStatusCount } from '@/types/deliveryStatusCount.types';

interface DeliveryGroup {
    taskId: number;
    taskName: string;
    taskCode: string;
    deliveryStatus: string;
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    statusCounts?: DeliveryStatusCount;
    deliveries: any[];
    latestDeliveryId?: number;
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

interface UseDeliveryGroupsProps {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: Record<string, any>;
}

export const useDeliveryGroups = (props: UseDeliveryGroupsProps = {}) => {
    const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroup[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [sorting, setSortingState] = useState<SortInfo[]>(props.sort || [
        { field: 'taskId', direction: 'desc' }
    ]);
    const [filters, setFilters] = useState<Record<string, any>>(props.filters || {});
    const [currentPage, setCurrentPage] = useState(props.page || 0);
    const [pageSize, setCurrentPageSize] = useState(props.size || 10);

    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const buildParams = useCallback(() => {
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('size', pageSize.toString());

        // Adiciona filtros
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });

        // Adiciona parâmetros de ordenação
        if (sorting.length > 0) {
            sorting.forEach(sort => {
                params.append('sort', `${sort.field},${sort.direction}`);
            });
        }

        return params;
    }, [currentPage, pageSize, sorting, filters]);

    const fetchDeliveryGroups = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoading(true);
            const params = buildParams();
            const response = await deliveryGroupService.getGroupedDeliveriesOptimized(params);

            if (!controller.signal.aborted) {
                setDeliveryGroups(response.content);
                setPagination({
                    currentPage: response.currentPage,
                    totalPages: response.totalPages,
                    pageSize: response.pageSize,
                    totalElements: response.totalElements,
                    first: response.first,
                    last: response.last,
                });
            }
        } catch (error: any) {
            if (!controller.signal.aborted) {
                handleApiError(error, 'carregamento dos grupos de entregas');
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [buildParams]);

    const getGroupDetails = useCallback(async (taskId: number): Promise<DeliveryGroup | null> => {
        try {
            const response = await deliveryGroupService.getGroupDetailsOptimized(taskId);
            return response;
        } catch (error: any) {
            handleApiError(error, 'carregamento dos detalhes do grupo');
            return null;
        }
    }, []);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page); // API usa 0-based, DataTable também usa 0-based
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0); // Volta para primeira página
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState(prevSorting => {
            // Remove existing sort para este campo e adiciona o novo no início
            const filteredSorting = prevSorting.filter(s => s.field !== field);
            return [{ field, direction }, ...filteredSorting];
        });
        setCurrentPage(0); // Reset to first page when sorting changes
    }, []);

    const setFilter = useCallback((key: string, value: string | number | null) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
        setCurrentPage(0); // Volta para primeira página
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    const deleteGroup = useCallback(async (taskId: number): Promise<void> => {
        try {
            await deliveryService.deleteByTaskId(taskId);
            toast.success('Grupo de entregas excluído com sucesso');
            await fetchDeliveryGroups();
        } catch (error: any) {
            handleApiError(error, 'exclusão do grupo de entregas');
            throw error;
        }
    }, [fetchDeliveryGroups]);

    const deleteGroups = useCallback(async (taskIds: number[]): Promise<void> => {
        try {
            // Excluir todos os grupos sequencialmente
            for (const taskId of taskIds) {
                await deliveryService.deleteByTaskId(taskId);
            }
            toast.success(`${taskIds.length} grupo(s) excluído(s) com sucesso`);
            await fetchDeliveryGroups();
        } catch (error: any) {
            handleApiError(error, 'exclusão dos grupos de entregas');
            throw error;
        }
    }, [fetchDeliveryGroups]);

    // Effect para buscar dados quando parâmetros mudarem (com debounce para filtros)
    useEffect(() => {
        // Limpa timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Define novo timer de debounce (1s)
        debounceTimerRef.current = setTimeout(() => {
            fetchDeliveryGroups();
        }, 1000);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [currentPage, pageSize, sorting, filters, fetchDeliveryGroups]);

    return {
        deliveryGroups,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        getGroupDetails,
        refetch: fetchDeliveryGroups,
        deleteGroup,
        deleteGroups,
    };
};