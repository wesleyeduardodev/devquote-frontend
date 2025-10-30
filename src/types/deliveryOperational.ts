export interface DeliveryOperationalAttachment {
  id: number;
  deliveryOperationalItemId: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryOperationalItem {
  id: number;
  deliveryId: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'DELIVERED';
  startedAt?: string;
  finishedAt?: string;
  attachments: DeliveryOperationalAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryOperationalItemRequest {
  deliveryId: number;
  title: string;
  description?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
}
