import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useRequesters } from '../../hooks/useRequesters';
import { requesterService } from '../../services/requesterService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RequesterForm from '../../components/forms/RequesterForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const RequesterEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateRequester } = useRequesters();
  const [requester, setRequester] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchRequester = async () => {
      try {
        setFetchLoading(true);
        const data = await requesterService.getById(id);
        setRequester(data);
      } catch (error) {
        navigate('/requesters');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchRequester();
    }
  }, [id, navigate]);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      await updateRequester(id, data);
      navigate('/requesters');
    } catch (error) {
      // Error handled by the hook and form
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/requesters');
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!requester) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Solicitante não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </div>

      <Card
        title="Editar Solicitante"
        subtitle={`Atualize as informações de ${requester.name}`}
      >
        <RequesterForm
          initialData={requester}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default RequesterEdit;