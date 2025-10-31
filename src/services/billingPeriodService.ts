import api from './api';
import {
  BillingPeriod,
  BillingPeriodRequest,
  BillingPeriodUpdate,
  BillingPeriodTask,
  BillingPeriodTaskRequest,
  BillingPeriodPaginatedParams,
  BillingPeriodTaskPaginatedParams,
  BillingPeriodStatistics,
  BillingStatistics,
  PaginatedResponse
} from '@/types';

const billingPeriodService = {
  // ========== OPERAÇÕES DE BILLING PERIOD ==========

  findAll: async (): Promise<BillingPeriod[]> => {
    const res = await api.get('/billing-periods');
    return res.data;
  },

  findAllWithFilters: async (params: {
    year?: number;
    month?: number;
    status?: string;
    flowType?: string;
  }): Promise<BillingPeriod[]> => {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.month) queryParams.append('month', params.month.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.flowType && params.flowType !== 'TODOS') queryParams.append('flowType', params.flowType);

    const url = queryParams.toString()
      ? `/billing-periods?${queryParams.toString()}`
      : '/billing-periods';

    const res = await api.get(url);
    return res.data;
  },

  findAllWithTotals: async (): Promise<BillingPeriod[]> => {
    const res = await api.get('/billing-periods/with-totals');
    return res.data;
  },

  findById: async (id: number): Promise<BillingPeriod> => {
    const res = await api.get(`/billing-periods/${id}`);
    return res.data;
  },

  create: async (data: BillingPeriodRequest): Promise<BillingPeriod> => {
    const res = await api.post('/billing-periods', data);
    return res.data;
  },

  update: async (id: number, data: BillingPeriodUpdate): Promise<BillingPeriod> => {
    const res = await api.put(`/billing-periods/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<boolean> => {
    await api.delete(`/billing-periods/${id}`);
    return true;
  },

  deleteBulk: async (ids: number[]): Promise<void> => {
    await api.delete('/billing-periods/bulk', { data: ids });
  },

  deleteWithAllLinkedTasks: async (id: number): Promise<void> => {
    await api.delete(`/billing-periods/${id}/delete-with-tasks`);
  },

  updateStatus: async (id: number, status: string): Promise<BillingPeriod> => {
    const res = await api.patch(`/billing-periods/${id}/status`, null, { params: { status } });
    return res.data;
  },

  findAllPaginated: async (params: BillingPeriodPaginatedParams): Promise<PaginatedResponse<BillingPeriod>> => {
    const res = await api.get('/billing-periods/paginated', { params });
    return res.data;
  },

  getStatistics: async (): Promise<BillingStatistics> => {
    const res = await api.get('/billing-periods/statistics');
    return res.data;
  },

  exportToExcel: async (params: {
    month?: number;
    year?: number;
    status?: string;
  }): Promise<Blob> => {
    const response = await api.get('/billing-periods/export/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // ========== OPERAÇÕES DE BILLING PERIOD TASK ==========

  findAllTaskLinks: async (): Promise<BillingPeriodTask[]> => {
    const res = await api.get('/billing-period-tasks');
    return res.data;
  },

  findTaskLinkById: async (id: number): Promise<BillingPeriodTask> => {
    const res = await api.get(`/billing-period-tasks/${id}`);
    return res.data;
  },

  createTaskLink: async (data: BillingPeriodTaskRequest): Promise<BillingPeriodTask> => {
    const res = await api.post('/billing-period-tasks', data);
    return res.data;
  },

  updateTaskLink: async (id: number, data: BillingPeriodTaskRequest): Promise<BillingPeriodTask> => {
    const res = await api.put(`/billing-period-tasks/${id}`, data);
    return res.data;
  },

  deleteTaskLink: async (id: number): Promise<boolean> => {
    await api.delete(`/billing-period-tasks/${id}`);
    return true;
  },

  findTaskLinksByBillingPeriod: async (billingPeriodId: number, flowType?: string): Promise<BillingPeriodTask[]> => {
    const params = new URLSearchParams();
    if (flowType && flowType !== 'TODOS') {
      params.append('flowType', flowType);
    }
    const url = params.toString()
      ? `/billing-period-tasks/billing-period/${billingPeriodId}?${params.toString()}`
      : `/billing-period-tasks/billing-period/${billingPeriodId}`;
    const res = await api.get(url);
    return res.data;
  },

  findTaskLinksPaginated: async (
    billingPeriodId: number, 
    params: BillingPeriodTaskPaginatedParams
  ): Promise<PaginatedResponse<BillingPeriodTask>> => {
    const res = await api.get(`/billing-period-tasks/billing-period/${billingPeriodId}/paginated`, { params });
    return res.data;
  },

  bulkLinkTasks: async (requests: BillingPeriodTaskRequest[]): Promise<BillingPeriodTask[]> => {
    const res = await api.post('/billing-period-tasks/bulk-link', requests);
    return res.data;
  },

  bulkUnlinkTasks: async (billingPeriodId: number, taskIds: number[]): Promise<void> => {
    await api.delete(`/billing-period-tasks/billing-period/${billingPeriodId}/bulk-unlink`, {
      data: taskIds
    });
  },

  // ========== EMAIL ==========

  // Send billing email
  sendBillingEmail: async (id: number, additionalEmails?: string[]): Promise<void> => {
    await api.post(`/billing-periods/${id}/send-billing-email`, {
      additionalEmails: additionalEmails || []
    });
  }
};

export default billingPeriodService;