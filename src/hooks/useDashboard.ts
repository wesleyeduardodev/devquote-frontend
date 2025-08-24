import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { DashboardStatsResponse } from '@/types/dashboard';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Erro ao carregar estatísticas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const refetch = () => {
    fetchDashboardStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
};