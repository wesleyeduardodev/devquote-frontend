import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Profile, CreateProfileRequest, UpdateProfileRequest } from '@/types/profile';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Profile[]>('/permissions/profiles');
      setProfiles(response.data);
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

  useEffect(() => {
    fetchProfiles();
  }, []);

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
    refetch
  };
};