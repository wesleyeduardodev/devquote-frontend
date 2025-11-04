import {useState, useCallback} from 'react';
import toast from 'react-hot-toast';

interface ApiOptions<T> {
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
    onSuccess?: (result: T) => void;
    onError?: (error: any) => void;
}

interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    execute: (...args: any[]) => Promise<T>;
    reset: () => void;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

interface CrudService<T> {
    getAll: () => Promise<T[]>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: string | number, data: Partial<T>) => Promise<T>;
    delete: (id: string | number) => Promise<void>;
}

interface CrudResponse<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    fetchAll: () => Promise<T[]>;
    create: (itemData: Partial<T>) => Promise<T>;
    update: (id: string | number, itemData: Partial<T>) => Promise<T>;
    remove: (id: string | number) => Promise<void>;
}

interface CrudItem {
    id: string | number;
}

/**
 * Hook genérico para fazer chamadas de API com estados de loading e erro
 */
export const useApi = <T = any>(
    apiFunction: (...args: any[]) => Promise<T>,
    options: ApiOptions<T> = {}
): ApiResponse<T> => {
    const {
        showSuccessToast = false,
        successMessage = 'Operação realizada com sucesso!',
        showErrorToast = true,
        onSuccess,
        onError,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (...args: any[]): Promise<T> => {
        try {
            setLoading(true);
            setError(null);

            const result = await apiFunction(...args);

            setData(result);

            if (showSuccessToast) {
                toast.success(successMessage);
            }

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err: any) {
            const apiError = err as ApiError;
            const errorMessage = apiError.response?.data?.message || apiError.message || 'Erro inesperado';
            setError(errorMessage);

            if (showErrorToast) {
                toast.error(errorMessage);
            }

            if (onError) {
                onError(err);
            }

            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunction, showSuccessToast, successMessage, showErrorToast, onSuccess, onError]);

    const reset = useCallback((): void => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        execute,
        reset,
    };
};

export const useCrud = <T extends CrudItem>(service: CrudService<T>): CrudResponse<T> => {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async (): Promise<T[]> => {
        try {
            setLoading(true);
            setError(null);
            const data = await service.getAll();
            setItems(data);
            return data;
        } catch (err: any) {
            const apiError = err as ApiError;
            const errorMessage = apiError.response?.data?.message || apiError.message || 'Erro ao carregar dados';
            setError(errorMessage);
            toast.error('Erro ao carregar dados');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [service]);

    const create = useCallback(async (itemData: Partial<T>): Promise<T> => {
        try {
            const newItem = await service.create(itemData);
            setItems(prev => [...prev, newItem]);
            toast.success('Item criado com sucesso!');
            return newItem;
        } catch (err: any) {
            toast.error('Erro ao criar item');
            throw err;
        }
    }, [service]);

    const update = useCallback(async (id: string | number, itemData: Partial<T>): Promise<T> => {
        try {
            const updatedItem = await service.update(id, itemData);
            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
            toast.success('Item atualizado com sucesso!');
            return updatedItem;
        } catch (err: any) {
            toast.error('Erro ao atualizar item');
            throw err;
        }
    }, [service]);

    const remove = useCallback(async (id: string | number): Promise<void> => {
        try {
            await service.delete(id);
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Item excluído com sucesso!');
        } catch (err: any) {
            toast.error('Erro ao excluir item');
            throw err;
        }
    }, [service]);

    return {
        items,
        loading,
        error,
        fetchAll,
        create,
        update,
        remove,
    };
};