import { useState, useEffect } from 'react';
import { deliveryService } from '../services/deliveryService';
import toast from 'react-hot-toast';

export const useDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await deliveryService.getAll();
            setDeliveries(data);
        } catch (err) {
            setError(err.message);
            console.error('Erro ao buscar entregas:', err);
        } finally {
            setLoading(false);
        }
    };

    const createDelivery = async (deliveryData) => {
        try {
            const newDelivery = await deliveryService.create(deliveryData);
            setDeliveries(prev => [...prev, newDelivery]);
            toast.success('Entrega criada com sucesso!');
            return newDelivery;
        } catch (err) {
            console.error('Erro ao criar entrega:', err);
            throw err;
        }
    };

    const updateDelivery = async (id, deliveryData) => {
        try {
            const updatedDelivery = await deliveryService.update(id, deliveryData);
            setDeliveries(prev =>
                prev.map(delivery => delivery.id === id ? updatedDelivery : delivery)
            );
            toast.success('Entrega atualizada com sucesso!');
            return updatedDelivery;
        } catch (err) {
            console.error('Erro ao atualizar entrega:', err);
            throw err;
        }
    };

    const deleteDelivery = async (id) => {
        try {
            await deliveryService.delete(id);
            setDeliveries(prev => prev.filter(delivery => delivery.id !== id));
            toast.success('Entrega excluída com sucesso!');
        } catch (err) {
            console.error('Erro ao excluir entrega:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

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

export default useDeliveries;