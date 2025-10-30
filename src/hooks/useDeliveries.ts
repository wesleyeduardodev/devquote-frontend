import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveryService } from '../services/deliveryService';
import { 
    DeliveryGroupResponse, 
    DeliveryFilters
} from '../types/delivery.types';
import { PaginatedResponse } from '../types/api.types';
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
    deliveryGroups: DeliveryGroupResponse[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    exporting: boolean;
    sorting: SortInfo[];
    filters: DeliveryFilters;
    fetchDeliveryGroups: (params?: UseDeliveriesParams) => Promise<void>;
    deleteBulk: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
    exportToExcel: () => Promise<void>;
}

export const useDeliveries = (initialParams?: UseDeliveriesParams): UseDeliveriesReturn => {
    const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroupResponse[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        { field: 'task.id', direction: 'desc' }
    ]);
    const [filters, setFilters] = useState<DeliveryFilters>(initialParams?.filters || {});

    // Refs para controlar o debounce
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDeliveryGroups = useCallback(async (params?: UseDeliveriesParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            // Converter e mapear campos do frontend para o backend
            const apiFilters: DeliveryFilters = {};
            
            // Mapear campos específicos do frontend para backend
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (!value || value.toString().trim() === '') {
                    return; // Ignora valores vazios
                }
                
                // Mapeamento de campos frontend -> backend
                switch (key) {
                    case 'deliveryStatus':
                        // Converter status do português para inglês (enum)
                        const convertStatusLabelToEnum = (label: string): string | undefined => {
                            const labelToEnum: Record<string, string> = {
                                'Pendente': 'PENDING',
                                'Desenvolvimento': 'DEVELOPMENT', 
                                'Entregue': 'DELIVERED',
                                'Homologação': 'HOMOLOGATION',
                                'Aprovado': 'APPROVED',
                                'Rejeitado': 'REJECTED',
                                'Produção': 'PRODUCTION'
                            };
                            return labelToEnum[label] || label; // Se não encontrar, usa o valor original
                        };
                        apiFilters.status = convertStatusLabelToEnum(value as string) || value as string;
                        break;
                    case 'task.code':
                        apiFilters.taskCode = value as string;
                        break;
                    case 'task.title':
                        apiFilters.taskName = value as string;
                        break;
                    case 'task.id':
                        apiFilters.taskId = parseInt(value as string, 10);
                        break;
                    // Campos que não precisam de mapeamento
                    case 'taskId':
                    case 'taskName':
                    case 'taskCode':
                    case 'status':
                    case 'createdAt':
                    case 'updatedAt':
                        (apiFilters as any)[key] = value;
                        break;
                    default:
                        // Para outros campos, usar o nome original
                        (apiFilters as any)[key] = value;
                        break;
                }
            });

            const response = await deliveryService.getAllGroupedByTask({
                page,
                size,
                sort,
                filters: apiFilters
            });

            setDeliveryGroups(response.content || []);
            setPagination({
                currentPage: response.number || 0,
                totalPages: response.totalPages || 0,
                pageSize: response.size || 10,
                totalElements: response.totalElements || 0,
                first: response.first || false,
                last: response.last || false
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar entregas';
            setError(errorMessage);
            console.error('Erro ao buscar entregas:', err);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const deleteBulk = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await deliveryService.deleteBulk(ids);
            await fetchDeliveryGroups(); // Recarrega a lista após exclusão
            toast.success(`${ids.length} entrega${ids.length === 1 ? '' : 's'} excluída${ids.length === 1 ? '' : 's'} com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir entregas:', err);
            toast.error('Erro ao excluir entregas selecionadas');
            throw err;
        }
    }, [fetchDeliveryGroups]);

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

    const setFilter = useCallback((field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value || undefined
        }));
        setCurrentPage(0); // Reset to first page when filter changes
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    const exportToExcel = useCallback(async (flowType: string) => {
        try {
            setExporting(true);
            const response = await deliveryService.exportToExcelWithResponse(flowType);

            // Extrair nome do arquivo do Content-Disposition ou usar fallback
            const contentDisposition = response.headers['content-disposition'];
            const flowLabel = flowType === 'DESENVOLVIMENTO' ? 'desenvolvimento' : 'operacional';
            let filename = `relatorio_entregas_${flowLabel}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}_${new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-')}.xlsx`;

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

    // Effect to fetch data when parameters change (with debounce for filters)
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounce (1 second)
        debounceTimerRef.current = setTimeout(() => {
            fetchDeliveryGroups();
        }, 1000);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters]);

    return {
        deliveryGroups,
        pagination,
        loading,
        error,
        exporting,
        sorting,
        filters,
        fetchDeliveryGroups,
        deleteBulk,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        exportToExcel,
    };
};