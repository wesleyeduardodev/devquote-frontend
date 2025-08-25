import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Profile, CreateProfileRequest, UpdateProfileRequest } from '@/types/profile';
import type { SortInfo, FilterValues } from '@/components/ui/DataTable';

interface PagedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export const useProfiles = (paginated: boolean = false) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Sorting state
  const [sorting, setSorting] = useState<SortInfo[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterValues>({});

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (paginated) {
        // Build query params
        const params = new URLSearchParams({
          paginated: 'true',
          page: page.toString(),
          size: pageSize.toString(),
        });
        
        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
        
        // Add sorting
        sorting.forEach(sort => {
          params.append('sort', `${sort.field},${sort.direction}`);
        });
        
        const response = await api.get<PagedResponse<Profile>>(`/permissions/profiles?${params}`);
        setProfiles(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        const response = await api.get<Profile[]>('/permissions/profiles');
        setProfiles(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      setError(err.message || 'Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (data: CreateProfileRequest): Promise<Profile> => {
    try {
      const response = await api.post<Profile>('/permissions/profiles', data);
      await fetchProfiles(); // Refresh list
      return response.data;
    } catch (err: any) {
      console.error('Error creating profile:', err);
      throw new Error(err.response?.data?.message || 'Erro ao criar perfil');
    }
  };

  const updateProfile = async (id: number, data: UpdateProfileRequest): Promise<Profile> => {
    try {
      const response = await api.put<Profile>(`/permissions/profiles/${id}`, data);
      await fetchProfiles(); // Refresh list
      return response.data;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw new Error(err.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  const deleteProfile = async (id: number): Promise<void> => {
    try {
      await api.delete(`/permissions/profiles/${id}`);
      await fetchProfiles(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      throw new Error(err.response?.data?.message || 'Erro ao deletar perfil');
    }
  };

  const getProfile = async (id: number): Promise<Profile> => {
    try {
      const response = await api.get<Profile>(`/permissions/profiles/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      throw new Error(err.response?.data?.message || 'Erro ao carregar perfil');
    }
  };

  const setFilter = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
    setPage(0); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0); // Reset to first page
  };

  useEffect(() => {
    fetchProfiles();
  }, [page, pageSize, sorting, filters, paginated]);

  const refetch = () => {
    fetchProfiles();
  };

  return {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfile,
    refetch,
    // Pagination
    pagination: paginated ? {
      currentPage: page,
      totalPages,
      pageSize,
      totalElements,
      first: page === 0,
      last: page === totalPages - 1
    } : null,
    setPage,
    setPageSize,
    // Sorting
    sorting,
    setSorting: (field: string, direction: 'asc' | 'desc') => {
      setSorting([{ field, direction }]);
      setPage(0); // Reset to first page when sorting
    },
    // Filters
    filters,
    setFilter,
    clearFilters
  };
};