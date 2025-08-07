import { Link } from 'react-router-dom';
import { Users, Plus, TrendingUp, DollarSign } from 'lucide-react';
import { useRequesters } from '../hooks/useRequesters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { requesters, loading } = useRequesters();

  const stats = [
    {
      title: 'Total de Solicitantes',
      value: loading ? '-' : requesters.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Orçamentos',
      value: '0',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Crescimento',
      value: '0%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo ao sistema de controle de orçamento
        </p>
      </div>

      {/* Statistics Cards */}
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
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          title="Solicitantes"
          subtitle="Gerencie os solicitantes do sistema"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                `Você tem ${requesters.length} solicitante${requesters.length !== 1 ? 's' : ''} cadastrado${requesters.length !== 1 ? 's' : ''}`
              )}
            </p>
            <div className="flex space-x-3">
              <Link to="/requesters">
                <Button variant="outline">
                  Ver Todos
                </Button>
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

        <Card 
          title="Orçamentos"
          subtitle="Em breve - funcionalidade em desenvolvimento"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              A funcionalidade de orçamentos será implementada em breve.
            </p>
            <Button disabled variant="outline">
              Em Desenvolvimento
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Atividade Recente">
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Nenhuma atividade recente</p>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;