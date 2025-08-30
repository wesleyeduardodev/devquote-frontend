import {useState, useEffect, useCallback, useRef} from 'react';
import {taskService} from '@/services/taskService';
import toast from 'react-hot-toast';

interface SubTask {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    status: string;
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
    status: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    subTasks?: SubTask[];
    createdAt?: string;
    updatedAt?: string;
}

interface TaskCreate {
    requesterId: number;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    createQuote?: boolean;
    linkQuoteToBilling?: boolean;
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
    status?: string;
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
    sorting: SortInfo[];
    filters: FilterParams;
    fetchTasks: (params?: UseTasksParams) => Promise<void>;
    createTaskWithSubTasks: (taskData: TaskCreate) => Promise<Task>;
    updateTaskWithSubTasks: (id: number, taskData: TaskUpdate) => Promise<Task>;
    deleteTaskWithSubTasks: (id: number) => Promise<void>;
    deleteBulkTasks: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
    exportToExcel: () => Promise<void>;
}

export const useTasks = (initialParams?: UseTasksParams): UseTasksReturn => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        {field: 'id', direction: 'desc'}
    ]);
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    // Refs para controlar o debounce
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
                pageSize: data.pageSize,
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

    const createTaskWithSubTasks = useCallback(async (taskData: TaskCreate): Promise<Task> => {
        try {
            const newTask = await taskService.createWithSubTasks(taskData);
            await fetchTasks(); // Recarrega a lista após criação
            toast.success('Tarefa criada com sucesso!');
            return newTask;
        } catch (err: any) {
            console.error('Erro ao criar tarefa:', err);
            throw err;
        }
    }, [fetchTasks]);

    const updateTaskWithSubTasks = useCallback(async (id: number, taskData: TaskUpdate): Promise<Task> => {
        try {
            const updatedTask = await taskService.updateWithSubTasks(id, taskData);
            await fetchTasks(); // Recarrega a lista após atualização
            toast.success('Tarefa atualizada com sucesso!');
            return updatedTask;
        } catch (err: any) {
            console.error('Erro ao atualizar tarefa:', err);
            throw err;
        }
    }, [fetchTasks]);

    const deleteTaskWithSubTasks = useCallback(async (id: number): Promise<void> => {
        try {
            await taskService.deleteTaskWithSubTasks(id);
            await fetchTasks(); // Recarrega a lista após exclusão
            toast.success('Tarefa excluída com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir tarefa:', err);
            throw err;
        }
    }, [fetchTasks]);

    const deleteBulkTasks = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await taskService.deleteBulk(ids);
            await fetchTasks(); // Recarrega a lista após exclusão
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
        setCurrentPage(0); // Reset to first page when changing page size
    }, []);

    const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSortingState(prevSorting => {
            // Remove existing sort for this field and add new one at the beginning
            const filteredSorting = prevSorting.filter(s => s.field !== field);
            return [{field, direction}, ...filteredSorting];
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

    const exportToExcel = useCallback(async () => {
        try {
            const blob = await taskService.exportToExcel();
            
            // Criar nome do arquivo com timestamp
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `Relatorio_Tarefas_${timestamp}.xlsx`;
            
            // Criar e baixar o arquivo
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
            toast.error('Erro ao exportar relatório: ' + (error.message || 'Erro desconhecido'));
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
            fetchTasks();
        }, 1000);

        // Cleanup on unmount or when dependencies change
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
    };
};