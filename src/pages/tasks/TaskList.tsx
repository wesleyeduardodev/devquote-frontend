import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, CheckSquare, DollarSign, User, ExternalLink } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useRequesters } from '../../hooks/useRequesters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TaskList = () => {
  const { tasks, loading, deleteTaskWithSubTasks } = useTasks();
  const { requesters } = useRequesters();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa e todas as suas subtarefas?')) {
      try {
        setDeletingId(id);
        await deleteTaskWithSubTasks(id);
      } catch (error) {
        // Error handled by the hook
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getRequesterName = (requesterId) => {
    const requester = requesters.find(r => r.id === requesterId);
    return requester?.name || 'Solicitante não encontrado';
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em Progresso',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada'
    };
    return labels[status] || status;
  };

  const calculateTaskTotal = (subTasks) => {
    return subTasks?.reduce((total, subTask) => total + (subTask.amount || 0), 0) || 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
            Tarefas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie tarefas e subtarefas do sistema de orçamento
          </p>
        </div>
        
        <Link to="/tasks/create">
          <Button className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center py-12">
          <CheckSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma tarefa encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            Comece criando sua primeira tarefa para o sistema de orçamento.
          </p>
          <Link to="/tasks/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Tarefa
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-custom-lg transition-shadow">
              <div className="space-y-4">
                {/* Header da Tarefa */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {task.code}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Informações da Tarefa */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{getRequesterName(task.requesterId)}</span>
                  </div>
                  
                  {task.link && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a 
                        href={task.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 truncate"
                      >
                        Ver Link
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <CheckSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{task.subTasks?.length || 0} subtarefa{task.subTasks?.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center text-primary-600 font-semibold">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>{formatCurrency(calculateTaskTotal(task.subTasks))}</span>
                    </div>
                  </div>
                </div>

                {/* Subtarefas Preview */}
                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Subtarefas:</h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {task.subTasks.slice(0, 3).map((subTask, index) => (
                        <div key={subTask.id || index} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate flex-1 mr-2">
                            {subTask.title}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(subTask.status)}`}>
                              {getStatusLabel(subTask.status)}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {formatCurrency(subTask.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {task.subTasks.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{task.subTasks.length - 3} subtarefa{task.subTasks.length - 3 !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data de criação */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  <div>Criada em: {formatDate(task.createdAt)}</div>
                  {task.updatedAt !== task.createdAt && (
                    <div className="mt-1">
                      Atualizada em: {formatDate(task.updatedAt)}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Link to={`/tasks/${task.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(task.id)}
                    loading={deletingId === task.id}
                    disabled={deletingId === task.id}
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

export default TaskList;