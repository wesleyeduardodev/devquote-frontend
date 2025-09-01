// Tipos para o sistema de faturamento (BillingPeriod)

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

// Tipos para a associação de tarefas ao período de faturamento
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

// Tipos para estatísticas e relatórios
export interface BillingPeriodStatistics {
  [status: string]: number;
}

// Tipos para paginação
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
}

// Tipos para operações em lote
export interface BulkTaskLinkRequest {
  billingPeriodId: number;
  taskIds: number[];
}

// Compatibilidade com tipos antigos (será removido gradualmente)
export interface BillingMonth extends BillingPeriod {}
export interface BillingMonthCreate extends BillingPeriodRequest {}
export interface BillingMonthUpdate extends BillingPeriodUpdate {}