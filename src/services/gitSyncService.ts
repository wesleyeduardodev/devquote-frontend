import api from './api';

export interface GitSyncResponse {
    success: boolean;
    message: string;
    durationMs?: number;
    deliveryItemId?: number;
    updated?: boolean;
}

export const gitSyncService = {
    syncMergedPullRequests: async (): Promise<GitSyncResponse> => {
        const response = await api.post<GitSyncResponse>('git-sync/sync');
        return response.data;
    },

    checkDeliveryItemPullRequest: async (deliveryItemId: number): Promise<GitSyncResponse> => {
        const response = await api.post<GitSyncResponse>(`git-sync/check/${deliveryItemId}`);
        return response.data;
    }
};
