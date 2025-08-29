import api from './api';

interface DeliveryGroup {
    quoteId: number;
    taskName: string;
    taskCode: string;
    quoteStatus: string;
    quoteValue: number;
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    deliveries: any[];
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

    async getGroupDetails(quoteId: number): Promise<DeliveryGroup> {
        const response = await api.get(`/deliveries/group/${quoteId}`);
        return response.data;
    },
};