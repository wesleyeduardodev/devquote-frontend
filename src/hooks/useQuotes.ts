import { useState, useEffect } from 'react';
import { quoteService } from '../services/quoteService';
import toast from 'react-hot-toast';

export const useQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quoteService.getAll();
      setQuotes(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar orçamentos:', err);
      toast.error('Erro ao buscar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
  };
};

export default useQuotes;
