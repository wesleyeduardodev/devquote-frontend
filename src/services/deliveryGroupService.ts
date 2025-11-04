import api from './api';
import type { DeliveryStatusCount } from '@/types/deliveryStatusCount.types';

interface DeliveryGroup {
    taskId: number;
    taskName: string;
    taskCode: string;
    deliveryStatus: string;
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    statusCounts?: DeliveryStatusCount;
    deliveries: any[];
    latestDeliveryId?: number;
}

interface PaginatedDeliveryGroups {
    content: DeliveryGroup[];
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
    first: boolean;
    last: boolean;
}

export const deliveryGroupService = {

    async getGroupedDeliveries(params: URLSearchParams): Promise<PaginatedDeliveryGroups> {
        const response = await api.get(`/deliveries/grouped?${params.toString()}`);
        return response.data;
    },

    async getGroupDetails(taskId: number): Promise<DeliveryGroup> {
        const response = await api.get(`/deliveries/group/${taskId}`);
        return response.data;
    },

    async getGroupedDeliveriesOptimized(params: URLSearchParams): Promise<PaginatedDeliveryGroups> {
        const response = await api.get(`/deliveries/grouped/optimized?${params.toString()}`);
        return response.data;
    },

    async getGroupDetailsOptimized(taskId: number): Promise<DeliveryGroup> {
        const response = await api.get(`/deliveries/group/${taskId}/optimized`);
        return response.data;
    },
};