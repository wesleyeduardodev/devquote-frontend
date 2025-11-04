

export interface BillingPeriod {
  id: number;
  month: number;
  year: number;
  paymentDate?: string;
  status: string;
  billingEmailSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalAmount?: number;
  taskCount?: number;
}

export interface BillingPeriodRequest {
  month: number;
  year: number;
  paymentDate?: string;
  status: string;
}

export interface BillingPeriodResponse extends BillingPeriod {}

export interface BillingPeriodUpdate extends Partial<BillingPeriodRequest> {
  id?: number;
}

export interface BillingPeriodTask {
  id: number;
  billingPeriodId: number;
  taskId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingPeriodTaskRequest {
  billingPeriodId: number;
  taskId: number;
}

export interface BillingPeriodTaskResponse extends BillingPeriodTask {}

export interface BillingPeriodStatistics {
  [status: string]: number;
}

export interface BillingStatusCount {
  status: string;
  count: number;
}

export interface BillingStatistics {
  totalPeriods: number;
  byStatus: {
    [status: string]: number;
  };
}

export interface BillingPeriodPaginatedParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  month?: number;
  year?: number;
  status?: string;
}

export interface BillingPeriodTaskPaginatedParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  flowType?: string;
}

export interface BulkTaskLinkRequest {
  billingPeriodId: number;
  taskIds: number[];
}