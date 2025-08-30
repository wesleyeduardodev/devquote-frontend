import { useState, useEffect, useCallback, useRef } from 'react';
import { profileService } from '@/services/profileService';
import toast from 'react-hot-toast';
import type { Profile, CreateProfileRequest, UpdateProfileRequest } from '@/types/profile';

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
  code?: string;
  name?: string;
  description?: string;
  level?: string;
  active?: string;
}

interface UseProfilesParams {
  page?: number;
  size?: number;
  sort?: SortInfo[];
  filters?: FilterParams;
}

interface UseProfilesReturn {
  profiles: Profile[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  sorting: SortInfo[];
  filters: FilterParams;
  fetchProfiles: (params?: UseProfilesParams) => Promise<void>;
  createProfile: (data: CreateProfileRequest) => Promise<Profile>;
  updateProfile: (id: number, data: UpdateProfileRequest) => Promise<Profile>;
  deleteProfile: (id: number) => Promise<void>;
  deleteBulkProfiles: (ids: number[]) => Promise<void>;
  getProfile: (id: number) => Promise<Profile>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (field: string, direction: 'asc' | 'desc') => void;
  setFilter: (field: string, value: string) => void;
  clearFilters: () => void;
  refetch: () => void;
}

export const useProfiles = (paginated: boolean = false, initialParams?: UseProfilesParams): UseProfilesReturn => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialParams?.page || 0);
  const [pageSize, setCurrentPageSize] = useState(initialParams?.size || 10);
  const [sorting, setSortingState] = useState<SortInfo[]>(initialParams?.sort || [
    { field: 'id', direction: 'asc' }
  ]);
  const [filters, setFilters] = useState<FilterParams>(initialParams?.filters || {});

  // Refs para controlar o debounce
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfiles = useCallback(async (params?: UseProfilesParams): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const page = params?.page ?? currentPage;
      const size = params?.size ?? pageSize;
      const sort = params?.sort ?? sorting;
      const currentFilters = params?.filters ?? filters;
      
      if (paginated) {
        const data = await profileService.getAllPaginated({
          page,
          size,
          sort,
          filters: currentFilters
        });

        setProfiles(data.content);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          pageSize: data.pageSize,
          totalElements: data.totalElements,
          first: data.first,
          last: data.last
        });
      } else {
        const data = await profileService.getAll();
        setProfiles(data);
        setPagination(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar perfis';
      setError(errorMessage);
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sorting, filters, paginated]);

  const createProfile = useCallback(async (data: CreateProfileRequest): Promise<Profile> => {
    try {
      const newProfile = await profileService.create(data);
      await fetchProfiles(); // Refresh list
      toast.success('Perfil criado com sucesso!');
      return newProfile;
    } catch (err: any) {
      console.error('Error creating profile:', err);
      throw err;
    }
  }, [fetchProfiles]);

  const updateProfile = useCallback(async (id: number, data: UpdateProfileRequest): Promise<Profile> => {
    try {
      const updatedProfile = await profileService.update(id, data);
      await fetchProfiles(); // Refresh list
      toast.success('Perfil atualizado com sucesso!');
      return updatedProfile;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }, [fetchProfiles]);

  const deleteProfile = useCallback(async (id: number): Promise<void> => {
    try {
      await profileService.delete(id);
      await fetchProfiles(); // Refresh list
      toast.success('Perfil excluído com sucesso!');
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      throw err;
    }
  }, [fetchProfiles]);

  const deleteBulkProfiles = useCallback(async (ids: number[]): Promise<void> => {
    try {
      await profileService.deleteBulk(ids);
      await fetchProfiles(); // Refresh list
      toast.success(`${ids.length} perfil(is) excluído(s) com sucesso!`);
    } catch (err: any) {
      console.error('Error deleting profiles:', err);
      throw err;
    }
  }, [fetchProfiles]);

  const getProfile = useCallback(async (id: number): Promise<Profile> => {
    try {
      const profile = await profileService.getById(id);
      return profile;
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  }, []);

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
      fetchProfiles();
    }, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentPage, pageSize, sorting, filters]);

  const refetch = useCallback(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    pagination,
    loading,
    error,
    sorting,
    filters,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    deleteBulkProfiles,
    getProfile,
    setPage,
    setPageSize,
    setSorting,
    setFilter,
    clearFilters,
    refetch
  };
};