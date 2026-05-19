import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveryService } from '../services/deliveryService';
import {
    Delivery,
    DeliveryFilters,
    DeliveryStatsSummary,
} from '../types/delivery.types';
import toast from 'react-hot-toast';

interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
    first: boolean;
    last: boolean;
}

interface UseDeliveriesParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: DeliveryFilters;
}

interface UseDeliveriesReturn {
    deliveries: Delivery[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    exporting: boolean;
    sorting: SortInfo[];
    filters: DeliveryFilters;
    stats: DeliveryStatsSummary | null;
    totalAmount: number | null;
    fetchDeliveries: (params?: UseDeliveriesParams) => Promise<void>;
    refreshStats: () => Promise<void>;
    deleteBulk: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
    exportToExcel: (flowType?: string, canViewAmounts?: boolean) => Promise<void>;
    exportDeliveriesOnlyToExcel: (canViewAmounts?: boolean) => Promise<void>;
}

const buildApiFilters = (currentFilters: DeliveryFilters): DeliveryFilters => {
    const apiFilters: DeliveryFilters = {};

    const convertDateFormat = (dateStr: string): string | undefined => {
        if (!dateStr) return undefined;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    };

    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || value.toString().trim() === '') return;

        switch (key) {
            case 'startDate': {
                const formatted = convertDateFormat(value as string);
                if (formatted) apiFilters.startDate = formatted;
                break;
            }
            case 'endDate': {
                const formatted = convertDateFormat(value as string);
                if (formatted) apiFilters.endDate = formatted;
                break;
            }
            case 'taskId':
                apiFilters.taskId = typeof value === 'number' ? value : parseInt(value as string, 10);
                break;
            default:
                (apiFilters as any)[key] = value;
                break;
        }
    });

    return apiFilters;
};

export const useDeliveries = (initialParams?: UseDeliveriesParams): UseDeliveriesReturn => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 100);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        { field: 'id', direction: 'desc' }
    ]);
    const [filters, setFilters] = useState<DeliveryFilters>(initialParams?.filters || {});
    const [stats, setStats] = useState<DeliveryStatsSummary | null>(null);
    const [totalAmount, setTotalAmount] = useState<number | null>(null);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDeliveries = useCallback(async (params?: UseDeliveriesParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const apiFilters = buildApiFilters(currentFilters);

            const response: any = await deliveryService.getAllPaginated({
                page,
                size,
                sort,
                filters: apiFilters,
            });

            setDeliveries(response.content || []);
            setPagination({
                currentPage: response.number || 0,
                totalPages: response.totalPages || 0,
                pageSize: size,
                totalElements: response.totalElements || 0,
                first: response.first || false,
                last: response.last || false,
            });

            try {
                const total = await deliveryService.getTotalAmount(apiFilters);
                setTotalAmount(total);
            } catch {
                setTotalAmount(null);
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar entregas';
            setError(errorMessage);
            console.error('Erro ao buscar entregas:', err);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const refreshStats = useCallback(async (): Promise<void> => {
        try {
            const data = await deliveryService.getStats();
            setStats(data);
        } catch (err) {
            console.error('Erro ao carregar estatísticas:', err);
        }
    }, []);

    const deleteBulk = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await deliveryService.deleteBulk(ids);
            await fetchDeliveries();
            await refreshStats();
            toast.success(`${ids.length} entrega${ids.length === 1 ? '' : 's'} excluída${ids.length === 1 ? '' : 's'} com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir entregas:', err);
            toast.error('Erro ao excluir entregas selecionadas');
            throw err;
        }
    }, [fetchDeliveries, refreshStats]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0);
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState([{ field, direction }]);
        setCurrentPage(0);
    }, []);

    const setFilter = useCallback((field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value || undefined,
        }));
        setCurrentPage(0);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    const exportToExcel = useCallback(async (flowType?: string, canViewAmounts?: boolean) => {
        try {
            setExporting(true);
            const response = await deliveryService.exportToExcelWithResponse(flowType, canViewAmounts);

            const contentDisposition = response.headers['content-disposition'];
            const flowLabel = flowType === 'DESENVOLVIMENTO' ? 'desenvolvimento'
                : flowType === 'OPERACIONAL' ? 'operacional'
                : 'todas';
            let filename = `relatorio_entregas_${flowLabel}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Exportação concluída!');
        } catch (error: any) {
            console.error('Erro ao exportar:', error);
            toast.error('Erro ao exportar dados');
        } finally {
            setExporting(false);
        }
    }, []);

    const exportDeliveriesOnlyToExcel = useCallback(async (canViewAmounts?: boolean) => {
        try {
            setExporting(true);
            const response = await deliveryService.exportDeliveriesOnlyToExcelWithResponse(canViewAmounts);

            const contentDisposition = response.headers['content-disposition'];
            let filename = `relatorio_entregas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;

            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Exportação concluída!');
        } catch (error: any) {
            console.error('Erro ao exportar:', error);
            toast.error('Erro ao exportar dados');
        } finally {
            setExporting(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchDeliveries();
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters]);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    return {
        deliveries,
        pagination,
        loading,
        error,
        exporting,
        sorting,
        filters,
        stats,
        totalAmount,
        fetchDeliveries,
        refreshStats,
        deleteBulk,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        exportToExcel,
        exportDeliveriesOnlyToExcel,
    };
};
