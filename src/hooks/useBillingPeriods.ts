import { useState, useEffect, useCallback } from 'react';
import billingPeriodService from '@/services/billingPeriodService';
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
  fetchBillingPeriods: (year?: number, month?: number, status?: string, flowType?: string) => Promise<void>;
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

  const fetchBillingPeriods = useCallback(async (
    year?: number,
    month?: number,
    status?: string,
    flowType?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await billingPeriodService.findAllWithFilters({
        year,
        month,
        status,
        flowType
      });
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
      const response = await billingPeriodService.create(data);
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
      const response = await billingPeriodService.update(id, data);
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
      await billingPeriodService.delete(id);
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
      await billingPeriodService.deleteBulk(ids);
      setBillingPeriods(prev => prev.filter(item => !ids.includes(item.id)));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir períodos de faturamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const linkTaskToBilling = useCallback(async (billingPeriodId: number, taskId: number): Promise<BillingPeriodTask> => {
    setLoading(true);
    setError(null);
    try {
      const response = await billingPeriodService.createTaskLink({
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
      await billingPeriodService.deleteTaskLink(linkId);
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
      const response = await billingPeriodService.bulkLinkTasks(requests);
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
      await billingPeriodService.bulkUnlinkTasks(billingPeriodId, taskIds);
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
      const response = await billingPeriodService.getStatistics();
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
      const response = await billingPeriodService.exportToExcel(params || {});
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