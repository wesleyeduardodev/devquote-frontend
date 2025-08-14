import { useState, useEffect, useCallback } from 'react';
import { deliveryService } from '@/services/deliveryService';
import toast from 'react-hot-toast';

interface Delivery {
    id: number;
    quoteId: number;
    projectId: number;
    branch: string;
    pullRequest: string;
    script: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt?: string;
    updatedAt?: string;
}

interface DeliveryCreate {
    quoteId: number;
    projectId: number;
    branch?: string;
    pullRequest?: string;
    script?: string;
    status: string;
    startedAt?: string | null;
    finishedAt?: string | null;
}

interface DeliveryUpdate extends Partial<DeliveryCreate> {
    id?: number;
}

interface UseDeliveriesReturn {
    deliveries: Delivery[];
    loading: boolean;
    error: string | null;
    fetchDeliveries: () => Promise<void>;
    createDelivery: (deliveryData: DeliveryCreate) => Promise<Delivery>;
    updateDelivery: (id: number, deliveryData: DeliveryUpdate) => Promise<Delivery>;
    deleteDelivery: (id: number) => Promise<void>;
}

export const useDeliveries = (): UseDeliveriesReturn => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDeliveries = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await deliveryService.getAll();
            setDeliveries(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar entregas');
            console.error('Erro ao buscar entregas:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createDelivery = useCallback(async (deliveryData: DeliveryCreate): Promise<Delivery> => {
        try {
            const newDelivery = await deliveryService.create(deliveryData);
            setDeliveries(prev => [...prev, newDelivery]);
            toast.success('Entrega criada com sucesso!');
            return newDelivery;
        } catch (err: any) {
            console.error('Erro ao criar entrega:', err);
            throw err;
        }
    }, []);

    const updateDelivery = useCallback(async (id: number, deliveryData: DeliveryUpdate): Promise<Delivery> => {
        try {
            const updatedDelivery = await deliveryService.update(id, deliveryData);
            setDeliveries(prev =>
                prev.map(delivery => delivery.id === id ? updatedDelivery : delivery)
            );
            toast.success('Entrega atualizada com sucesso!');
            return updatedDelivery;
        } catch (err: any) {
            console.error('Erro ao atualizar entrega:', err);
            throw err;
        }
    }, []);

    const deleteDelivery = useCallback(async (id: number): Promise<void> => {
        try {
            await deliveryService.delete(id);
            setDeliveries(prev => prev.filter(delivery => delivery.id !== id));
            toast.success('Entrega excluída com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir entrega:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    return {
        deliveries,
        loading,
        error,
        fetchDeliveries,
        createDelivery,
        updateDelivery,
        deleteDelivery,
    };
};