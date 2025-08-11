import { BaseEntity, SelectOption } from './common';
import { Quote } from './quote';

// Tipos principais para QuoteBillingMonth
export interface QuoteBillingMonth extends BaseEntity {
    id: number;
    month: number;
    year: number;
    paymentDate?: string;
    status: BillingStatus;
}

// Tipos para requests/responses da API
export interface QuoteBillingMonthRequest {
    month: number;
    year: number;
    paymentDate?: string;
    status: BillingStatus;
}

export interface QuoteBillingMonthResponse extends BaseEntity {
    id: number;
    month: number;
    year: number;
    paymentDate?: string;
    status: BillingStatus;
}

// Tipos para vínculos QuoteBillingMonthQuote
export interface QuoteBillingMonthQuote extends BaseEntity {
    id: number;
    quoteBillingMonthId: number;
    quoteId: number;
    quote?: Quote;
}

export interface QuoteBillingMonthQuoteRequest {
    quoteBillingMonthId: number;
    quoteId: number;
}

export interface QuoteBillingMonthQuoteResponse extends BaseEntity {
    id: number;
    quoteBillingMonthId: number;
    quoteId: number;
}

// Enum para status do faturamento
export enum BillingStatus {
    PENDENTE = 'PENDENTE',
    PROCESSANDO = 'PROCESSANDO',
    FATURADO = 'FATURADO',
    PAGO = 'PAGO',
    ATRASADO = 'ATRASADO',
    CANCELADO = 'CANCELADO'
}

// Tipos para formulários
export interface BillingFormData {
    month: string | number;
    year: number;
    paymentDate: string;
    status: BillingStatus;
}

export interface BillingFormErrors {
    month?: string;
    year?: string;
    paymentDate?: string;
    status?: string;
    [key: string]: string | undefined;
}

// Tipos para opções de select
export interface MonthOption extends SelectOption {
    value: number;
    label: string;
}

export interface StatusOption extends SelectOption {
    value: BillingStatus;
    label: string;
}

// Tipos para componentes
export interface BillingMonthFormProps {
    initialData?: Partial<BillingFormData>;
    onSubmit: (data: QuoteBillingMonthRequest) => void;
    onCancel: () => void;
    loading?: boolean;
}

// Tipos para gerenciamento de vínculos
export interface LinkedQuoteDetailed extends Quote {
    linkId: number;
    quoteBillingMonthId: number;
}

export interface BillingManagementState {
    billingMonths: QuoteBillingMonthResponse[];
    totals: Record<number, number>;
    selectedBilling: QuoteBillingMonthResponse | null;
    links: QuoteBillingMonthQuoteResponse[];
    linkedQuotesDetailed: LinkedQuoteDetailed[];
    availableQuotes: Quote[];
    loading: {
        list: boolean;
        totals: boolean;
        links: boolean;
        linking: boolean;
        create: boolean;
    };
}

// Tipos para filtros
export interface BillingFilters {
    year?: number;
    month?: number;
    status?: BillingStatus[];
    dateFrom?: string;
    dateTo?: string;
}

// Tipos para estatísticas
export interface BillingStats {
    totalPeriods: number;
    totalValue: number;
    paidValue: number;
    pendingValue: number;
    byStatus: Record<BillingStatus, number>;
    monthlyStats: MonthlyBillingStats[];
}

export interface MonthlyBillingStats {
    month: number;
    year: number;
    periodsCount: number;
    quotesCount: number;
    totalValue: number;
    status: BillingStatus;
}

// Constantes úteis
export const MONTH_OPTIONS: MonthOption[] = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
];

export const STATUS_OPTIONS: StatusOption[] = [
    { value: BillingStatus.PENDENTE, label: 'Pendente' },
    { value: BillingStatus.PROCESSANDO, label: 'Processando' },
    { value: BillingStatus.FATURADO, label: 'Faturado' },
    { value: BillingStatus.PAGO, label: 'Pago' },
    { value: BillingStatus.ATRASADO, label: 'Atrasado' },
    { value: BillingStatus.CANCELADO, label: 'Cancelado' }
];