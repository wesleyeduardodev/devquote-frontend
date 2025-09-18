import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationConfigService } from '@/services/notificationConfigService';
import toast from 'react-hot-toast';

export enum NotificationConfigType {
    NOTIFICACAO_DADOS_TAREFA = 'NOTIFICACAO_DADOS_TAREFA',
    NOTIFICACAO_ORCAMENTO_TAREFA = 'NOTIFICACAO_ORCAMENTO_TAREFA',
    NOTIFICACAO_ENTREGA = 'NOTIFICACAO_ENTREGA',
    NOTIFICACAO_FATURAMENTO = 'NOTIFICACAO_FATURAMENTO'
}

export enum NotificationType {
    EMAIL = 'EMAIL',
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS'
}

interface NotificationConfig {
    id: number;
    configType: NotificationConfigType;
    notificationType: NotificationType;
    primaryEmail?: string;
    copyEmails: string[];
    phoneNumbers: string[];
    createdAt?: string;
    updatedAt?: string;
}

interface NotificationConfigCreate {
    configType: NotificationConfigType;
    notificationType: NotificationType;
    primaryEmail?: string;
    copyEmails?: string[];
    phoneNumbers?: string[];
}

interface NotificationConfigUpdate extends Partial<NotificationConfigCreate> {
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
    configType?: string;
    notificationType?: string;
    primaryEmail?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseNotificationConfigsParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseNotificationConfigsReturn {
    notificationConfigs: NotificationConfig[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchNotificationConfigs: (params?: UseNotificationConfigsParams) => Promise<void>;
    createNotificationConfig: (data: NotificationConfigCreate) => Promise<NotificationConfig>;
    updateNotificationConfig: (id: number, data: NotificationConfigUpdate) => Promise<NotificationConfig>;
    deleteNotificationConfig: (id: number) => Promise<void>;
    deleteBulkNotificationConfigs: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
}

export const useNotificationConfigs = (initialParams?: UseNotificationConfigsParams): UseNotificationConfigsReturn => {
    const [notificationConfigs, setNotificationConfigs] = useState<NotificationConfig[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        { field: 'id', direction: 'asc' }
    ]);
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchNotificationConfigs = useCallback(async (params?: UseNotificationConfigsParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await notificationConfigService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters
            });

            setNotificationConfigs(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar configurações de notificação';
            setError(errorMessage);
            console.error('Erro ao buscar configurações de notificação:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createNotificationConfig = useCallback(async (data: NotificationConfigCreate): Promise<NotificationConfig> => {
        try {
            setLoading(true);
            const newConfig = await notificationConfigService.create(data);
            toast.success('Configuração de notificação criada com sucesso!');
            await fetchNotificationConfigs();
            return newConfig;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao criar configuração de notificação';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchNotificationConfigs]);

    const updateNotificationConfig = useCallback(async (id: number, data: NotificationConfigUpdate): Promise<NotificationConfig> => {
        try {
            setLoading(true);
            const updatedConfig = await notificationConfigService.update(id, data);
            toast.success('Configuração de notificação atualizada com sucesso!');
            await fetchNotificationConfigs();
            return updatedConfig;
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao atualizar configuração de notificação';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchNotificationConfigs]);

    const deleteNotificationConfig = useCallback(async (id: number): Promise<void> => {
        try {
            setLoading(true);
            await notificationConfigService.delete(id);
            toast.success('Configuração de notificação excluída com sucesso!');
            await fetchNotificationConfigs();
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao excluir configuração de notificação';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchNotificationConfigs]);

    const deleteBulkNotificationConfigs = useCallback(async (ids: number[]): Promise<void> => {
        try {
            setLoading(true);
            await notificationConfigService.deleteBulk(ids);
            toast.success(`${ids.length} configuração(ões) excluída(s) com sucesso!`);
            await fetchNotificationConfigs();
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao excluir configurações de notificação';
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchNotificationConfigs]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(0); // Reset to first page when changing page size
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
            setCurrentPage(0); // Reset to first page when filtering
        }, 500);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(0);
    }, []);

    useEffect(() => {
        fetchNotificationConfigs();
    }, [currentPage, pageSize, sorting, filters]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        notificationConfigs,
        pagination,
        loading,
        error,
        sorting,
        filters,
        fetchNotificationConfigs,
        createNotificationConfig,
        updateNotificationConfig,
        deleteNotificationConfig,
        deleteBulkNotificationConfigs,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters
    };
};