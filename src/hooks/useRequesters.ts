import {useState, useEffect, useCallback} from 'react';
import {requesterService} from '@/services/requesterService';
import toast from 'react-hot-toast';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface RequesterCreate {
    name: string;
    email?: string;
    phone?: string;
}

interface RequesterUpdate extends Partial<RequesterCreate> {
    id?: number;
}

interface UseRequestersReturn {
    requesters: Requester[];
    loading: boolean;
    error: string | null;
    fetchRequesters: () => Promise<void>;
    createRequester: (requesterData: RequesterCreate) => Promise<Requester>;
    updateRequester: (id: number, requesterData: RequesterUpdate) => Promise<Requester>;
    deleteRequester: (id: number) => Promise<void>;
}

export const useRequesters = (): UseRequestersReturn => {
    const [requesters, setRequesters] = useState<Requester[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRequesters = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await requesterService.getAll();
            setRequesters(data);
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar solicitantes';
            setError(errorMessage);
            console.error('Erro ao buscar solicitantes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createRequester = useCallback(async (requesterData: RequesterCreate): Promise<Requester> => {
        try {
            const newRequester = await requesterService.create(requesterData);
            setRequesters(prev => [...prev, newRequester]);
            toast.success('Solicitante criado com sucesso!');
            return newRequester;
        } catch (err: any) {
            console.error('Erro ao criar solicitante:', err);
            throw err;
        }
    }, []);

    const updateRequester = useCallback(async (id: number, requesterData: RequesterUpdate): Promise<Requester> => {
        try {
            const updatedRequester = await requesterService.update(id, requesterData);
            setRequesters(prev =>
                prev.map(req => req.id === id ? updatedRequester : req)
            );
            toast.success('Solicitante atualizado com sucesso!');
            return updatedRequester;
        } catch (err: any) {
            console.error('Erro ao atualizar solicitante:', err);
            throw err;
        }
    }, []);

    const deleteRequester = useCallback(async (id: number): Promise<void> => {
        try {
            await requesterService.delete(id);
            setRequesters(prev => prev.filter(req => req.id !== id));
            toast.success('Solicitante excluído com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir solicitante:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchRequesters();
    }, [fetchRequesters]);

    return {
        requesters,
        loading,
        error,
        fetchRequesters,
        createRequester,
        updateRequester,
        deleteRequester,
    };
};