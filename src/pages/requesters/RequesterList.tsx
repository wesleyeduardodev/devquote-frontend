import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, User, Mail, Phone } from 'lucide-react';
import { useRequesters } from '../../hooks/useRequesters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const RequesterList = () => {
  const { requesters, loading, deleteRequester } = useRequesters();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este solicitante?')) {
      try {
        setDeletingId(id);
        await deleteRequester(id);
      } catch (error) {
        // Error handled by the hook
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitantes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os solicitantes do sistema de orçamento
          </p>
        </div>
        
        <Link to="/requesters/create">
          <Button className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Novo Solicitante
          </Button>
        </Link>
      </div>

      {requesters.length === 0 ? (
        <Card className="text-center py-12">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum solicitante encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Comece criando seu primeiro solicitante para o sistema de orçamento.
          </p>
          <Link to="/requesters/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Solicitante
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requesters.map((requester) => (
            <Card key={requester.id} className="hover:shadow-custom-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {requester.name}
                    </h3>
                    
                    <div className="space-y-2">
                      {requester.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{requester.email}</span>
                        </div>
                      )}
                      
                      {requester.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{requester.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 border-t pt-3">
                  <div>Criado em: {formatDate(requester.createdAt)}</div>
                  {requester.updatedAt !== requester.createdAt && (
                    <div className="mt-1">
                      Atualizado em: {formatDate(requester.updatedAt)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Link to={`/requesters/${requester.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(requester.id)}
                    loading={deletingId === requester.id}
                    disabled={deletingId === requester.id}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequesterList;