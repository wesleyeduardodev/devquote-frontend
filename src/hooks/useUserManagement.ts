import { useState, useEffect, useCallback, useRef } from 'react';
import { userManagementService } from '@/services/userManagementService';
import toast from 'react-hot-toast';
import type { UserProfile, AssignProfileRequest } from '@/types/profile';
import type { CreateUserDto, UpdateUserDto } from '@/types/user';

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
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: string;
}

interface UseUserManagementParams {
  page?: number;
  size?: number;
  sort?: SortInfo[];
  filters?: FilterParams;
}

interface UseUserManagementReturn {
  users: UserProfile[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  sorting: SortInfo[];
  filters: FilterParams;
  fetchUsers: (params?: UseUserManagementParams) => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<UserProfile>;
  updateUser: (id: number, data: UpdateUserDto) => Promise<UserProfile>;
  deleteUser: (id: number) => Promise<void>;
  deleteBulkUsers: (ids: number[]) => Promise<void>;
  getUser: (id: number) => Promise<UserProfile>;
  assignProfile: (data: AssignProfileRequest) => Promise<void>;
  removeProfile: (userId: number, profileId: number) => Promise<void>;
  removeAllProfiles: (userId: number) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (field: string, direction: 'asc' | 'desc') => void;
  setFilter: (field: string, value: string) => void;
  clearFilters: () => void;
  refetch: () => void;
}

export const useUserManagement = (initialParams?: UseUserManagementParams): UseUserManagementReturn => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
  const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 5);
  const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
    { field: 'id', direction: 'asc' }
  ]);
  const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

  // Refs para controlar o debounce
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (params?: UseUserManagementParams): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const page = params?.page ?? currentPage;
      const size = params?.size ?? pageSize;
      const sort = params?.sort ?? sorting;
      const currentFilters = params?.filters ?? filters;
      
      const data = await userManagementService.getAllPaginated({
        page,
        size,
        sort,
        filters: currentFilters
      });

      setUsers(data.content);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar usuários';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sorting, filters]);

  const createUser = useCallback(async (data: CreateUserDto): Promise<UserProfile> => {
    try {
      const newUser = await userManagementService.create(data);
      await fetchUsers(); // Refresh list
      toast.success('Usuário criado com sucesso!');
      return newUser;
    } catch (err: any) {
      console.error('Error creating user:', err);
      throw err;
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: number, data: UpdateUserDto): Promise<UserProfile> => {
    try {
      const updatedUser = await userManagementService.update(id, data);
      await fetchUsers(); // Refresh list
      toast.success('Usuário atualizado com sucesso!');
      return updatedUser;
    } catch (err: any) {
      console.error('Error updating user:', err);
      throw err;
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: number): Promise<void> => {
    try {
      await userManagementService.delete(id);
      await fetchUsers(); // Refresh list
      toast.success('Usuário excluído com sucesso!');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, [fetchUsers]);

  const deleteBulkUsers = useCallback(async (ids: number[]): Promise<void> => {
    try {
      await userManagementService.deleteBulk(ids);
      await fetchUsers(); // Refresh list
      toast.success(`${ids.length} usuário(s) excluído(s) com sucesso!`);
    } catch (err: any) {
      console.error('Error deleting users:', err);
      throw err;
    }
  }, [fetchUsers]);

  const getUser = useCallback(async (id: number): Promise<UserProfile> => {
    try {
      const user = await userManagementService.getById(id);
      return user;
    } catch (err: any) {
      console.error('Error fetching user:', err);
      throw err;
    }
  }, []);

  const assignProfile = useCallback(async (data: AssignProfileRequest): Promise<void> => {
    try {
      // TODO: Implementar no service
      // await userManagementService.assignProfile(data);
      await fetchUsers(); // Refresh list
      toast.success('Perfil atribuído com sucesso!');
    } catch (err: any) {
      console.error('Error assigning profile:', err);
      throw err;
    }
  }, [fetchUsers]);

  const removeProfile = useCallback(async (userId: number, profileId: number): Promise<void> => {
    try {
      // TODO: Implementar no service
      // await userManagementService.removeProfile(userId, profileId);
      await fetchUsers(); // Refresh list
      toast.success('Perfil removido com sucesso!');
    } catch (err: any) {
      console.error('Error removing profile:', err);
      throw err;
    }
  }, [fetchUsers]);

  const removeAllProfiles = useCallback(async (userId: number): Promise<void> => {
    try {
      // TODO: Implementar no service
      // await userManagementService.removeAllProfiles(userId);
      await fetchUsers(); // Refresh list
      toast.success('Todos os perfis removidos com sucesso!');
    } catch (err: any) {
      console.error('Error removing all profiles:', err);
      throw err;
    }
  }, [fetchUsers]);

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

  // Effect to fetch data when parameters change (with debounce for filters)
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounce (1 second)
    debounceTimerRef.current = setTimeout(() => {
      fetchUsers();
    }, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentPage, pageSize, sorting, filters]);

  const refetch = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    pagination,
    loading,
    error,
    sorting,
    filters,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    deleteBulkUsers,
    getUser,
    assignProfile,
    removeProfile,
    removeAllProfiles,
    setPage,
    setPageSize,
    setSorting,
    setFilter,
    clearFilters,
    refetch
  };
};