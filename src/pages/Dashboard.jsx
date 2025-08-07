import { Link } from 'react-router-dom';
import { Users, Plus, TrendingUp, DollarSign, CheckSquare, FileText } from 'lucide-react';
import { useRequesters } from '../hooks/useRequesters';
import { useTasks } from '../hooks/useTasks';
import { useQuotes } from '../hooks/useQuotes';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { requesters, loading: requestersLoading } = useRequesters();
  const { tasks, loading: tasksLoading } = useTasks();
  const { quotes, loading: quotesLoading } = useQuotes();

  // Estatísticas de tarefas
  const calculateTaskStats = () => {
    if (!tasks.length) return { total: 0, totalValue: 0, completedTasks: 0 };

    const totalValue = tasks.reduce((sum, task) => {
      const taskTotal = task.subTasks?.reduce((subSum, subTask) => subSum + (subTask.amount || 0), 0) || 0;
      return sum + taskTotal;
    }, 0);

    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;

    return {
      total: tasks.length,
      totalValue,
      completedTasks
    };
  };

  const taskStats = calculateTaskStats();

  // Estatísticas de orçamentos
  const calculateQuoteStats = () => {
    if (!quotes.length) return { total: 0, totalValue: 0 };

    const totalValue = quotes.reduce((sum, quote) => sum + (quote.totalAmount || 0), 0);

    return {
      total: quotes.length,
      totalValue
    };
  };

  const quoteStats = calculateQuoteStats();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stats = [
    {
      title: 'Total de Solicitantes',
      value: requestersLoading ? '-' : requesters.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total de Tarefas',
      value: tasksLoading ? '-' : taskStats.total,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Valor Total Tarefas',
      value: tasksLoading ? '-' : formatCurrency(taskStats.totalValue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total de Orçamentos',
      value: quotesLoading ? '-' : quoteStats.total,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Valor Total Orçamentos',
      value: quotesLoading ? '-' : formatCurrency(quoteStats.totalValue),
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bem-vindo ao sistema de controle de orçamento</p>
      </div>

      {/* Cards Estatísticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-custom-lg transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Ações rápidas: Solicitantes e Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Solicitantes" subtitle="Gerencie os solicitantes do sistema">
          <div className="space-y-4">
            {requestersLoading ? (
              <div className="text-gray-600">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <p className="text-gray-600">
                Você tem {requesters.length} solicitante{requesters.length !== 1 ? 's' : ''} cadastrado{requesters.length !== 1 ? 's' : ''}
              </p>
            )}

            <div className="flex space-x-3">
              <Link to="/requesters">
                <Button variant="outline">Ver Todos</Button>
              </Link>
              <Link to="/requesters/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Solicitante
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card title="Tarefas" subtitle="Gerencie tarefas e subtarefas">
          <div className="space-y-4">
            <div className="text-gray-600">
              {tasksLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <div className="space-y-1">
                  <p>{taskStats.total} tarefa{taskStats.total !== 1 ? 's' : ''} cadastrada{taskStats.total !== 1 ? 's' : ''}</p>
                  <p>{taskStats.completedTasks} concluída{taskStats.completedTasks !== 1 ? 's' : ''}</p>
                  <p className="font-semibold text-primary-600">
                    Total: {formatCurrency(taskStats.totalValue)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Link to="/tasks">
                <Button variant="outline">Ver Todas</Button>
              </Link>
              <Link to="/tasks/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </Link>
            </div>
          </div>
        </Card>
          <Card title="Orçamentos" subtitle="Gerencie os orçamentos do sistema">
              <div className="space-y-4">
                <div className="text-gray-600">
                  {quotesLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <div className="space-y-1">
                      <p>{quoteStats.total} orçamento{quoteStats.total !== 1 ? 's' : ''} cadastrados</p>
                      <p className="font-semibold text-primary-600">
                        Total: {formatCurrency(quoteStats.totalValue)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Link to="/quotes">
                    <Button variant="outline">Ver Todos</Button>
                  </Link>
                  <Link to="/quotes/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Orçamento
                    </Button>
                  </Link>
                </div>
              </div>
            </Card> 
      </div>

      {/* Resumo do Sistema */}
      <Card title="Resumo do Sistema">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">{requesters.length}</div>
            <div className="text-sm text-gray-600">Solicitantes Ativos</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">{taskStats.total}</div>
            <div className="text-sm text-gray-600">Tarefas Cadastradas</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-purple-600">
              {taskStats.total > 0 ? Math.round((taskStats.completedTasks / taskStats.total) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Conclusão</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-yellow-600">{quoteStats.total}</div>
            <div className="text-sm text-gray-600">Orçamentos Cadastrados</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
