import { useState, useEffect, useCallback } from 'react';
import {
  BillingPeriod,
  BillingPeriodRequest,
  BillingPeriodUpdate,
  BillingPeriodTask,
  BillingPeriodTaskRequest,
  BillingPeriodPaginatedParams,
  BillingPeriodStatistics
} from '@/types';

interface UseBillingPeriodsReturn {
  billingPeriods: BillingPeriod[];
  loading: boolean;
  error: string | null;
  fetchBillingPeriods: () => Promise<void>;
  createBillingPeriod: (data: BillingPeriodRequest) => Promise<BillingPeriod>;
  updateBillingPeriod: (id: number, data: BillingPeriodUpdate) => Promise<BillingPeriod>;
  deleteBillingPeriod: (id: number) => Promise<void>;
  deleteBulkBillingPeriods: (ids: number[]) => Promise<void>;
  linkTaskToBilling: (billingPeriodId: number, taskId: number) => Promise<BillingPeriodTask>;
  unlinkTaskFromBilling: (linkId: number) => Promise<void>;
  bulkLinkTasks: (requests: BillingPeriodTaskRequest[]) => Promise<BillingPeriodTask[]>;
  bulkUnlinkTasks: (billingPeriodId: number, taskIds: number[]) => Promise<void>;
  getStatistics: () => Promise<BillingPeriodStatistics>;
  exportToExcel: (params?: { month?: number; year?: number; status?: string }) => Promise<Blob>;
}

export const useBillingPeriods = (): UseBillingPeriodsReturn => {
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const request = async <T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data: any = null,
    options: RequestInit = {}
  ): Promise<T> => {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (data && method !== 'GET') {
      if (requestOptions.headers?.['Content-Type'] === 'application/json') {
        requestOptions.body = JSON.stringify(data);
      } else {
        requestOptions.body = data;
      }
    }

    const response = await fetch(`/api${url}`, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Para responses que retornam Blob (como Excel)
    if (options.headers?.['Accept'] === 'application/octet-stream') {
      return response.blob() as T;
    }

    return response.json();
  };

  const fetchBillingPeriods = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<BillingPeriod[]>('/billing-periods', 'GET');
      setBillingPeriods(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar períodos de faturamento');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBillingPeriod = useCallback(async (data: BillingPeriodRequest): Promise<BillingPeriod> => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<BillingPeriod>('/billing-periods', 'POST', data);
      setBillingPeriods(prev => [...prev, response]);
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar período de faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBillingPeriod = useCallback(async (id: number, data: BillingPeriodUpdate): Promise<BillingPeriod> => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<BillingPeriod>(`/billing-periods/${id}`, 'PUT', data);
      setBillingPeriods(prev =>
        prev.map(item => item.id === id ? response : item)
      );
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar período de faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBillingPeriod = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await request(`/billing-periods/${id}`, 'DELETE');
      setBillingPeriods(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir período de faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBulkBillingPeriods = useCallback(async (ids: number[]): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await request('/billing-periods/bulk', 'DELETE', ids);
      setBillingPeriods(prev => prev.filter(item => !ids.includes(item.id)));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir períodos de faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // IMPORTANTE: Estas funções agora lidam com Tasks, não mais Quotes
  const linkTaskToBilling = useCallback(async (billingPeriodId: number, taskId: number): Promise<BillingPeriodTask> => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<BillingPeriodTask>('/billing-period-tasks', 'POST', {
        billingPeriodId,
        taskId
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular tarefa ao faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unlinkTaskFromBilling = useCallback(async (linkId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await request(`/billing-period-tasks/${linkId}`, 'DELETE');
    } catch (err: any) {
      setError(err.message || 'Erro ao desvincular tarefa do faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkLinkTasks = useCallback(async (requests: BillingPeriodTaskRequest[]): Promise<BillingPeriodTask[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<BillingPeriodTask[]>('/billing-period-tasks/bulk-link', 'POST', requests);
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular tarefas em lote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUnlinkTasks = useCallback(async (billingPeriodId: number, taskIds: number[]): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await request(`/billing-period-tasks/billing-period/${billingPeriodId}/bulk-unlink`, 'DELETE', taskIds);
    } catch (err: any) {
      setError(err.message || 'Erro ao desvincular tarefas em lote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatistics = useCallback(async (): Promise<BillingPeriodStatistics> => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<BillingPeriodStatistics>('/billing-periods/statistics', 'GET');
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToExcel = useCallback(async (params?: { 
    month?: number; 
    year?: number; 
    status?: string 
  }): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await request<Blob>(
        `/billing-periods/export/excel${queryParams.toString() ? '?' + queryParams.toString() : ''}`, 
        'GET',
        null,
        { headers: { 'Accept': 'application/octet-stream' } }
      );
      return response;
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar relatório');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingPeriods();
  }, [fetchBillingPeriods]);

  return {
    billingPeriods,
    loading,
    error,
    fetchBillingPeriods,
    createBillingPeriod,
    updateBillingPeriod,
    deleteBillingPeriod,
    deleteBulkBillingPeriods,
    linkTaskToBilling,
    unlinkTaskFromBilling,
    bulkLinkTasks,
    bulkUnlinkTasks,
    getStatistics,
    exportToExcel
  };
};