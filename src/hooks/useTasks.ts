import {useState, useEffect, useCallback, useRef} from 'react';
import {taskService} from '@/services/taskService';
import toast from 'react-hot-toast';

interface SubTask {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    taskId?: number;
    excluded?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface Task {
    id: number;
    requesterId: number;
    requesterName?: string;
    title: string;
    description?: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    subTasks?: SubTask[];
    createdAt?: string;
    updatedAt?: string;
    hasDelivery?: boolean;
    hasQuoteInBilling?: boolean;
    financialEmailSent?: boolean;
}

interface TaskCreate {
    requesterId: number;
    title: string;
    description?: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    createQuote?: boolean;
    linkQuoteToBilling?: boolean;
    createDeliveries?: boolean;
    projectsIds?: number[];
    subTasks: Omit<SubTask, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
}

interface TaskUpdate extends Partial<TaskCreate> {
    id?: number;
    subTasks?: SubTask[];
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
    requesterId?: string;
    requesterName?: string;
    title?: string;
    description?: string;
    code?: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseTasksParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseTasksReturn {
    tasks: Task[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    exporting: boolean;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchTasks: (params?: UseTasksParams) => Promise<void>;
    createTaskWithSubTasks: (taskData: TaskCreate, files?: File[]) => Promise<Task>;
    updateTaskWithSubTasks: (id: number, taskData: TaskUpdate) => Promise<Task>;
    deleteTaskWithSubTasks: (id: number) => Promise<void>;
    deleteBulkTasks: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
    exportToExcel: () => Promise<void>;
    sendFinancialEmail: (taskId: number, additionalEmails?: string[]) => Promise<void>;
    sendTaskEmail: (taskId: number, additionalEmails?: string[]) => Promise<void>;
}

export const useTasks = (initialParams?: UseTasksParams): UseTasksReturn => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 25);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        {field: 'id', direction: 'desc'}
    ]);
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchTasks = useCallback(async (params?: UseTasksParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await taskService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters
            });

            setTasks(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: size,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar tarefas';
            setError(errorMessage);
            console.error('Erro ao buscar tarefas:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createTaskWithSubTasks = useCallback(async (taskData: TaskCreate, files?: File[]): Promise<Task> => {
        try {
            let newTask;

            if (files && files.length > 0) {
                newTask = await taskService.createWithSubTasksAndFiles(taskData, files);
                toast.success(`Tarefa criada com ${files.length} arquivo(s) anexado(s)!`);
            } else {
                newTask = await taskService.createWithSubTasks(taskData);
                toast.success('Tarefa criada com sucesso!');
            }

            await fetchTasks();
            return newTask;
        } catch (err: any) {
            console.error('Erro ao criar tarefa:', err);

            let errorMessage = 'Erro ao criar tarefa';

            if (err.response?.data?.errorCode === 'DUPLICATE_TASK_CODE') {
                errorMessage = err.response.data.message || 'Já existe uma tarefa com este código. Por favor, use um código diferente.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {

                const fieldErrors = err.response.data.errors
                    .map((error: any) => {

                        if (error.field?.includes('subTasks')) {
                            const match = error.field.match(/subTasks\[(\d+)\]\.(\w+)/);
                            if (match) {
                                const index = parseInt(match[1]) + 1;
                                const field = match[2];
                                return `Subtarefa ${index} - ${field}: ${error.message}`;
                            }
                        }
                        return `${error.field}: ${error.message}`;
                    })
                    .join(', ');
                errorMessage = fieldErrors;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast.error(errorMessage);
            throw err;
        }
    }, [fetchTasks]);

    const updateTaskWithSubTasks = useCallback(async (id: number, taskData: TaskUpdate): Promise<Task> => {
        try {
            const updatedTask = await taskService.updateWithSubTasks(id, taskData);
            await fetchTasks();
            toast.success('Tarefa atualizada com sucesso!');
            return updatedTask;
        } catch (err: any) {
            console.error('Erro ao atualizar tarefa:', err);

            let errorMessage = 'Erro ao atualizar tarefa';

            if (err.response?.data?.errorCode === 'DUPLICATE_TASK_CODE') {
                errorMessage = err.response.data.message || 'Já existe uma tarefa com este código. Por favor, use um código diferente.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast.error(errorMessage);
            throw err;
        }
    }, [fetchTasks]);

    const deleteTaskWithSubTasks = useCallback(async (id: number): Promise<void> => {
        try {
            await taskService.deleteTaskWithSubTasks(id);
            await fetchTasks();
            toast.success('Tarefa excluída com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir tarefa:', err);
            throw err;
        }
    }, [fetchTasks]);

    const deleteBulkTasks = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await taskService.deleteBulk(ids);
            await fetchTasks();
            toast.success(`${ids.length} tarefa${ids.length === 1 ? '' : 's'} excluída${ids.length === 1 ? '' : 's'} com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir tarefas:', err);
            throw err;
        }
    }, [fetchTasks]);

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
            return [{field, direction}, ...filteredSorting];
        });
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

    const exportToExcel = useCallback(async () => {
        try {
            setExporting(true);
            const blob = await taskService.exportToExcel(filters.flowType);

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `Relatorio_Tarefas_${timestamp}.xlsx`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Relatório exportado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao exportar relatório:', error);
            console.error('Detalhes do erro:', error.response?.data);
            console.error('Status do erro:', error.response?.status);
            toast.error('Erro ao exportar relatório: ' + (error.response?.data?.message || error.message || 'Erro desconhecido'));
        } finally {
            setExporting(false);
        }
    }, [filters.flowType]);

    const sendFinancialEmail = useCallback(async (taskId: number, additionalEmails?: string[], additionalWhatsAppRecipients?: string[]): Promise<void> => {
        try {
            await taskService.sendFinancialEmail(taskId, additionalEmails, additionalWhatsAppRecipients);
            await fetchTasks();
            toast.success('Notificação financeira enviada com sucesso!');
        } catch (err: any) {
            console.error('Erro ao enviar notificação financeira:', err);
            toast.error(err.message || 'Erro ao enviar notificação financeira');
            throw err;
        }
    }, [fetchTasks]);

    const sendTaskEmail = useCallback(async (taskId: number, additionalEmails?: string[]): Promise<void> => {
        try {
            await taskService.sendTaskEmail(taskId, additionalEmails);
            await fetchTasks();
            toast.success('Email de tarefa enviado com sucesso!');
        } catch (err: any) {
            console.error('Erro ao enviar email de tarefa:', err);
            toast.error(err.message || 'Erro ao enviar email de tarefa');
            throw err;
        }
    }, [fetchTasks]);

    useEffect(() => {

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchTasks();
        }, 1000);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters]);

    return {
        tasks,
        pagination,
        loading,
        error,
        exporting,
        sorting,
        filters,
        fetchTasks,
        createTaskWithSubTasks,
        updateTaskWithSubTasks,
        deleteTaskWithSubTasks,
        deleteBulkTasks,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        exportToExcel,
        sendFinancialEmail,
        sendTaskEmail,
    };
};