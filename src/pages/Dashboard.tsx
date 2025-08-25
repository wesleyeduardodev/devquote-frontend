import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckSquare, 
  FileText, 
  FolderGit2, 
  Truck, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Target,
  Award,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { stats, loading, error } = useDashboard();
  const { user, hasScreenAccess } = useAuth();
  
  // DEBUG FUNCTION - TEMPORARY
  const debugAuth = async () => {
    try {
      const token = localStorage.getItem('auth.token');
      console.log('Token exists:', !!token);
      console.log('Token value:', token);
      
      const response = await fetch('http://localhost:8080/api/auth/debug', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('=== DEBUG AUTH RESPONSE ===');
      console.log('Authorities:', data.authorities);
      console.log('Has ROLE_ADMIN:', data.hasRoleAdmin);
      console.log('Has ADMIN:', data.hasAdmin);
      console.log('Full response:', data);
      
      // Check stored permissions
      const storedPermissions = localStorage.getItem('auth.permissions');
      console.log('=== STORED PERMISSIONS ===');
      console.log('Raw:', storedPermissions);
      if (storedPermissions) {
        const parsed = JSON.parse(storedPermissions);
        console.log('Parsed:', parsed);
        console.log('Profiles:', parsed.profiles);
      }
      
      alert('Check console for debug info (F12)');
    } catch (error) {
      console.error('Debug error:', error);
      alert('Error - check console');
    }
  };
  
  // Force reload permissions
  const reloadPermissions = async () => {
    try {
      const token = localStorage.getItem('auth.token');
      const response = await fetch('http://localhost:8080/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const permissions = await response.json();
      console.log('=== RELOADED PERMISSIONS ===');
      console.log(permissions);
      
      // Save to localStorage
      localStorage.setItem('auth.permissions', JSON.stringify(permissions));
      
      alert('Permissions reloaded! Refresh the page.');
    } catch (error) {
      console.error('Error reloading permissions:', error);
      alert('Error - check console');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Bem-vindo de volta, {user?.username || 'Usuário'}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={debugAuth} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  DEBUG AUTH
                </Button>
                <Button 
                  onClick={reloadPermissions} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  RELOAD PERMISSIONS
                </Button>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          {(stats.quotes || stats.tasks) && (
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Receita Total</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(stats.general.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </Card>
          )}

          {/* Completion Rate */}
          {stats.tasks && (
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Taxa de Conclusão</p>
                  <p className="text-3xl font-bold">
                    {formatPercentage(stats.general.completionRate)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-200" />
              </div>
            </Card>
          )}

          {/* Total Users */}
          {stats.requesters && (
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Usuários</p>
                  <p className="text-3xl font-bold">{stats.general.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </Card>
          )}

          {/* Completed Tasks */}
          {stats.tasks && (
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Tarefas Concluídas</p>
                  <p className="text-3xl font-bold">{stats.general.completedTasks}</p>
                </div>
                <Award className="w-8 h-8 text-orange-200" />
              </div>
            </Card>
          )}
        </div>

        {/* Module Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Tasks Module */}
          {stats.tasks && (
            <Card title="Tarefas" className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.tasks.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.tasks.active}</div>
                    <div className="text-xs text-gray-600">Ativas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.tasks.completed}</div>
                    <div className="text-xs text-gray-600">Concluídas</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Valor Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(stats.tasks.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Médio</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(stats.tasks.averageValue)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to="/tasks" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Todas
                    </Button>
                  </Link>
                  <Link to="/tasks/create" className="flex-1">
                    <Button size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Nova
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Quotes Module */}
          {stats.quotes && (
            <Card title="Orçamentos" className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.quotes.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.quotes.active}</div>
                    <div className="text-xs text-gray-600">Ativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.quotes.completed}</div>
                    <div className="text-xs text-gray-600">Aprovados</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Valor Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(stats.quotes.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Médio</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(stats.quotes.averageValue)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to="/quotes" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Todos
                    </Button>
                  </Link>
                  <Link to="/quotes/create" className="flex-1">
                    <Button size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Projects Module */}
          {stats.projects && (
            <Card title="Projetos" className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.projects.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.projects.active}</div>
                    <div className="text-xs text-gray-600">Ativos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.projects.completed}</div>
                    <div className="text-xs text-gray-600">Concluídos</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to="/projects" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Todos
                    </Button>
                  </Link>
                  <Link to="/projects/create" className="flex-1">
                    <Button size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Deliveries Module */}
          {stats.deliveries && (
            <Card title="Entregas" className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.deliveries.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.deliveries.active}</div>
                    <div className="text-xs text-gray-600">Pendentes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.deliveries.completed}</div>
                    <div className="text-xs text-gray-600">Aprovadas</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to="/deliveries" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Todas
                    </Button>
                  </Link>
                  <Link to="/deliveries/create" className="flex-1">
                    <Button size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Nova
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Requesters Module */}
          {stats.requesters && (
            <Card title="Solicitantes" className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.requesters.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.requesters.active}</div>
                    <div className="text-xs text-gray-600">Ativos</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to="/requesters" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Todos
                    </Button>
                  </Link>
                  <Link to="/requesters/create" className="flex-1">
                    <Button size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Status Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Tasks by Status */}
          {stats.tasksByStatus && stats.tasksByStatus.length > 0 && (
            <Card title="Tarefas por Status" className="hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {stats.tasksByStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'COMPLETED' ? 'bg-green-500' :
                        status.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                        status.status === 'PENDING' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {status.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{status.count}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(status.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quotes by Status */}
          {stats.quotesByStatus && stats.quotesByStatus.length > 0 && (
            <Card title="Orçamentos por Status" className="hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {stats.quotesByStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'APPROVED' ? 'bg-green-500' :
                        status.status === 'PENDING' ? 'bg-yellow-500' :
                        status.status === 'REJECTED' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {status.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{status.count}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(status.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Deliveries by Status */}
          {stats.deliveriesByStatus && stats.deliveriesByStatus.length > 0 && (
            <Card title="Entregas por Status" className="hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {stats.deliveriesByStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'APPROVED' ? 'bg-green-500' :
                        status.status === 'DELIVERED' ? 'bg-blue-500' :
                        status.status === 'PENDING' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {status.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{status.count}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(status.percentage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* System Overview */}
        <Card title="Visão Geral do Sistema" className="hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {stats.requesters && (
              <div className="text-center space-y-2">
                <Users className="w-8 h-8 text-blue-500 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">{stats.requesters.total}</div>
                <div className="text-sm text-gray-600">Solicitantes</div>
              </div>
            )}
            
            {stats.tasks && (
              <div className="text-center space-y-2">
                <CheckSquare className="w-8 h-8 text-green-500 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">{stats.tasks.total}</div>
                <div className="text-sm text-gray-600">Tarefas</div>
              </div>
            )}
            
            {stats.quotes && (
              <div className="text-center space-y-2">
                <FileText className="w-8 h-8 text-yellow-500 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">{stats.quotes.total}</div>
                <div className="text-sm text-gray-600">Orçamentos</div>
              </div>
            )}
            
            {stats.projects && (
              <div className="text-center space-y-2">
                <FolderGit2 className="w-8 h-8 text-purple-500 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">{stats.projects.total}</div>
                <div className="text-sm text-gray-600">Projetos</div>
              </div>
            )}
            
            {stats.deliveries && (
              <div className="text-center space-y-2">
                <Truck className="w-8 h-8 text-orange-500 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">{stats.deliveries.total}</div>
                <div className="text-sm text-gray-600">Entregas</div>
              </div>
            )}
            
            {stats.tasks && (
              <div className="text-center space-y-2">
                <Target className="w-8 h-8 text-indigo-500 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(stats.general.completionRate)}
                </div>
                <div className="text-sm text-gray-600">Taxa Sucesso</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;