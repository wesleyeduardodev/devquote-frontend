import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook genérico para fazer chamadas de API com estados de loading e erro
 * @param {Function} apiFunction - Função que faz a chamada da API
 * @param {Object} options - Opções do hook
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    showSuccessToast = false,
    successMessage = 'Operação realizada com sucesso!',
    showErrorToast = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
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
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro inesperado';
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

  const reset = useCallback(() => {
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

/**
 * Hook específico para operações CRUD
 */
export const useCrud = (service) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listar todos
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAll();
      setItems(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      toast.error('Erro ao carregar dados');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Criar item
  const create = useCallback(async (itemData) => {
    try {
      const newItem = await service.create(itemData);
      setItems(prev => [...prev, newItem]);
      toast.success('Item criado com sucesso!');
      return newItem;
    } catch (err) {
      toast.error('Erro ao criar item');
      throw err;
    }
  }, [service]);

  // Atualizar item
  const update = useCallback(async (id, itemData) => {
    try {
      const updatedItem = await service.update(id, itemData);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      toast.success('Item atualizado com sucesso!');
      return updatedItem;
    } catch (err) {
      toast.error('Erro ao atualizar item');
      throw err;
    }
  }, [service]);

  // Deletar item
  const remove = useCallback(async (id) => {
    try {
      await service.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item excluído com sucesso!');
    } catch (err) {
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

export default useApi;