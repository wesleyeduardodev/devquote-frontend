import { useState, useEffect } from 'react';
import { requesterService } from '../services/requesterService';
import toast from 'react-hot-toast';

export const useRequesters = () => {
  const [requesters, setRequesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequesters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requesterService.getAll();
      setRequesters(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar solicitantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRequester = async (requesterData) => {
    try {
      const newRequester = await requesterService.create(requesterData);
      setRequesters(prev => [...prev, newRequester]);
      toast.success('Solicitante criado com sucesso!');
      return newRequester;
    } catch (err) {
      console.error('Erro ao criar solicitante:', err);
      throw err;
    }
  };

  const updateRequester = async (id, requesterData) => {
    try {
      const updatedRequester = await requesterService.update(id, requesterData);
      setRequesters(prev => 
        prev.map(req => req.id === id ? updatedRequester : req)
      );
      toast.success('Solicitante atualizado com sucesso!');
      return updatedRequester;
    } catch (err) {
      console.error('Erro ao atualizar solicitante:', err);
      throw err;
    }
  };

  const deleteRequester = async (id) => {
    try {
      await requesterService.delete(id);
      setRequesters(prev => prev.filter(req => req.id !== id));
      toast.success('Solicitante excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir solicitante:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRequesters();
  }, []);

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

// Export default também para compatibilidade
export default useRequesters;