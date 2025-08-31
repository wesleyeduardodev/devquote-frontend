import api from './api';

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
};