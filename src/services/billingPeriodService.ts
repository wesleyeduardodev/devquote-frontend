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
  PaginatedResponse
} from '@/types';

const billingPeriodService = {
  // ========== OPERAÇÕES DE BILLING PERIOD ==========

  findAll: async (): Promise<BillingPeriod[]> => {
    const res = await api.get('/billing-periods');
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

  getStatistics: async (): Promise<BillingPeriodStatistics> => {
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

  findTaskLinksByBillingPeriod: async (billingPeriodId: number): Promise<BillingPeriodTask[]> => {
    const res = await api.get(`/billing-period-tasks/billing-period/${billingPeriodId}`);
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

  // ========== MÉTODOS DE COMPATIBILIDADE (DEPRECATED) ==========
  // Manter temporariamente para compatibilidade com código existente

  /** @deprecated Use findAll() instead */
  findAllBillingMonths: async (): Promise<BillingPeriod[]> => {
    console.warn('findAllBillingMonths is deprecated. Use findAll() instead.');
    return billingPeriodService.findAll();
  },

  /** @deprecated Use create() instead */
  createBillingMonth: async (data: BillingPeriodRequest): Promise<BillingPeriod> => {
    console.warn('createBillingMonth is deprecated. Use create() instead.');
    return billingPeriodService.create(data);
  },

  /** @deprecated Use update() instead */
  updateBillingMonth: async (id: number, data: BillingPeriodUpdate): Promise<BillingPeriod> => {
    console.warn('updateBillingMonth is deprecated. Use update() instead.');
    return billingPeriodService.update(id, data);
  },

  /** @deprecated Use delete() instead */
  deleteBillingMonth: async (id: number): Promise<boolean> => {
    console.warn('deleteBillingMonth is deprecated. Use delete() instead.');
    return billingPeriodService.delete(id);
  },

  /** @deprecated Quote operations are no longer available. Use Task operations instead. */
  linkQuoteToBilling: async (billingPeriodId: number, quoteId: number): Promise<never> => {
    throw new Error('Quote operations are no longer available. Use linkTaskToBilling instead.');
  },

  /** @deprecated Quote operations are no longer available. Use Task operations instead. */
  unlinkQuoteFromBilling: async (linkId: number): Promise<never> => {
    throw new Error('Quote operations are no longer available. Use unlinkTaskFromBilling instead.');
  },

  /** @deprecated Quote operations are no longer available. Use Task operations instead. */
  bulkLinkQuotes: async (requests: any[]): Promise<never> => {
    throw new Error('Quote operations are no longer available. Use bulkLinkTasks instead.');
  },

  /** @deprecated Quote operations are no longer available. Use Task operations instead. */
  bulkUnlinkQuotes: async (billingPeriodId: number, quoteIds: number[]): Promise<never> => {
    throw new Error('Quote operations are no longer available. Use bulkUnlinkTasks instead.');
  },

  // Send billing email
  sendBillingEmail: async (id: number): Promise<void> => {
    await api.post(`/billing-periods/${id}/send-billing-email`);
  }
};

export default billingPeriodService;