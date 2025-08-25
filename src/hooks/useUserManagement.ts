import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { UserProfile, AssignProfileRequest } from '@/types/profile';
import type { CreateUserDto, UpdateUserDto } from '@/types/user';

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const useUserManagement = (page: number = 0, size: number = 10) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PagedResponse<UserProfile>>(`/admin/users?page=${page}&size=${size}`);
      setUsers(response.data.content);
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: CreateUserDto): Promise<UserProfile> => {
    try {
      const response = await api.post<UserProfile>('/admin/users', data);
      await fetchUsers(); // Refresh list
      return response.data;
    } catch (err: any) {
      console.error('Error creating user:', err);
      throw new Error(err.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  const updateUser = async (id: number, data: UpdateUserDto): Promise<UserProfile> => {
    try {
      const response = await api.put<UserProfile>(`/admin/users/${id}`, data);
      await fetchUsers(); // Refresh list
      return response.data;
    } catch (err: any) {
      console.error('Error updating user:', err);
      throw new Error(err.response?.data?.message || 'Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting user:', err);
      throw new Error(err.response?.data?.message || 'Erro ao deletar usuário');
    }
  };

  const getUser = async (id: number): Promise<UserProfile> => {
    try {
      const response = await api.get<UserProfile>(`/admin/users/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching user:', err);
      throw new Error(err.response?.data?.message || 'Erro ao carregar usuário');
    }
  };

  const assignProfile = async (data: AssignProfileRequest): Promise<void> => {
    try {
      await api.post('/permissions/users/profiles', data);
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error assigning profile:', err);
      throw new Error(err.response?.data?.message || 'Erro ao atribuir perfil');
    }
  };

  const removeProfile = async (userId: number, profileId: number): Promise<void> => {
    try {
      await api.delete(`/permissions/users/${userId}/profiles/${profileId}`);
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error removing profile:', err);
      throw new Error(err.response?.data?.message || 'Erro ao remover perfil');
    }
  };

  const removeAllProfiles = async (userId: number): Promise<void> => {
    try {
      await api.delete(`/permissions/users/${userId}/profiles`);
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error removing all profiles:', err);
      throw new Error(err.response?.data?.message || 'Erro ao remover todos os perfis');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size]);

  const refetch = () => {
    fetchUsers();
  };

  return {
    users,
    totalElements,
    totalPages,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    assignProfile,
    removeProfile,
    removeAllProfiles,
    refetch
  };
};