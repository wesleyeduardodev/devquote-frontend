import {useState, useEffect, useCallback, useRef} from 'react';
import {projectService} from '@/services/projectService';
import toast from 'react-hot-toast';

interface Project {
    id: number;
    name: string;
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ProjectCreate {
    name: string;
    repositoryUrl?: string;
}

interface ProjectUpdate extends Partial<ProjectCreate> {
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
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface UseProjectsParams {
    page?: number;
    size?: number;
    sort?: SortInfo[];
    filters?: FilterParams;
}

interface UseProjectsReturn {
    projects: Project[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    sorting: SortInfo[];
    filters: FilterParams;
    fetchProjects: (params?: UseProjectsParams) => Promise<void>;
    createProject: (projectData: ProjectCreate) => Promise<Project>;
    updateProject: (id: number, projectData: ProjectUpdate) => Promise<Project>;
    deleteProject: (id: number) => Promise<void>;
    deleteBulkProjects: (ids: number[]) => Promise<void>;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSorting: (field: string, direction: 'asc' | 'desc') => void;
    setFilter: (field: string, value: string) => void;
    clearFilters: () => void;
}

export const useProjects = (initialParams?: UseProjectsParams): UseProjectsReturn => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
    const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 5);
    const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
        {field: 'id', direction: 'asc'}
    ]);
    const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

    // Refs para controlar o debounce
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchProjects = useCallback(async (params?: UseProjectsParams): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const page = params?.page ?? currentPage;
            const size = params?.size ?? pageSize;
            const sort = params?.sort ?? sorting;
            const currentFilters = params?.filters ?? filters;

            const data = await projectService.getAllPaginated({
                page,
                size,
                sort,
                filters: currentFilters
            });

            setProjects(data.content);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                totalElements: data.totalElements,
                first: data.first,
                last: data.last
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar projetos';
            setError(errorMessage);
            console.error('Erro ao buscar projetos:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, sorting, filters]);

    const createProject = useCallback(async (projectData: ProjectCreate): Promise<Project> => {
        try {
            const newProject = await projectService.create(projectData);
            await fetchProjects(); // Recarrega a lista após criação
            toast.success('Projeto criado com sucesso!');
            return newProject;
        } catch (err: any) {
            console.error('Erro ao criar projeto:', err);
            throw err;
        }
    }, [fetchProjects]);

    const updateProject = useCallback(async (id: number, projectData: ProjectUpdate): Promise<Project> => {
        try {
            const updatedProject = await projectService.update(id, projectData);
            await fetchProjects(); // Recarrega a lista após atualização
            toast.success('Projeto atualizado com sucesso!');
            return updatedProject;
        } catch (err: any) {
            console.error('Erro ao atualizar projeto:', err);
            throw err;
        }
    }, [fetchProjects]);

    const deleteProject = useCallback(async (id: number): Promise<void> => {
        try {
            await projectService.delete(id);
            await fetchProjects(); // Recarrega a lista após exclusão
            toast.success('Projeto excluído com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir projeto:', err);
            throw err;
        }
    }, [fetchProjects]);

    const deleteBulkProjects = useCallback(async (ids: number[]): Promise<void> => {
        try {
            await projectService.deleteBulk(ids);
            await fetchProjects(); // Recarrega a lista após exclusão
            toast.success(`${ids.length} projeto${ids.length === 1 ? '' : 's'} excluído${ids.length === 1 ? '' : 's'} com sucesso!`);
        } catch (err: any) {
            console.error('Erro ao excluir projetos:', err);
            throw err;
        }
    }, [fetchProjects]);

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

    // Effect to fetch data when parameters change (with debounce for filters)
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounce (1 second)
        debounceTimerRef.current = setTimeout(() => {
            fetchProjects();
        }, 1000);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentPage, pageSize, sorting, filters]);

    return {
        projects,
        pagination,
        loading,
        error,
        sorting,
        filters,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        deleteBulkProjects,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
    };
};

export default useProjects;
