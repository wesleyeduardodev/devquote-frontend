export interface BillingNote {
  id: number;
  /** Nulo = anotação geral de faturamento. Preenchido = anotação do período. */
  billingPeriodId?: number | null;
  billingPeriodMonth?: number | null;
  billingPeriodYear?: number | null;
  title?: string | null;
  content?: string | null;
  createdByUserId?: number | null;
  createdByName?: string | null;
  attachmentCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingNoteRequest {
  billingPeriodId?: number | null;
  title?: string | null;
  content?: string | null;
}

export interface BillingNoteAttachment {
  id: number;
  billingNoteId: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  fileUrl?: string;
  excluded: boolean;
  uploadedAt: string;
  createdAt: string;
  updatedAt?: string;
}

/** Chave "general" para as anotações gerais; demais chaves são IDs de período. */
export type BillingNoteCounts = Record<string, number>;
