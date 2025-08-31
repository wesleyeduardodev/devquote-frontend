import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Calendar,
  Users,
  Download,
  Eye,
  Activity,
  BarChart3,
  FileText,
  Plus,
  Loader2,
  Database
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import { deliveryService } from '@/services/deliveryService';
import billingPeriodService from '@/services/billingPeriodService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { stats, loading, error } = useDashboard();
  const { user, hasProfile } = useAuth();

  // Estados de loading para exportações
  const [exportingTasks, setExportingTasks] = useState(false);
  const [exportingDeliveries, setExportingDeliveries] = useState(false);
  const [exportingGeneral, setExportingGeneral] = useState(false);
  const [exportingBilling, setExportingBilling] = useState(false);

  // Função para fazer download de blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Função para exportar tarefas
  const handleExportTasks = async () => {
    try {
      setExportingTasks(true);
      const blob = await taskService.exportToExcel();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `relatorio_tarefas_${timestamp}.xlsx`);
      toast.success('Relatório de tarefas exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar tarefas:', error);
      toast.error('Erro ao exportar relatório de tarefas');
    } finally {
      setExportingTasks(false);
    }
  };

  // Função para exportar entregas
  const handleExportDeliveries = async () => {
    try {
      setExportingDeliveries(true);
      const blob = await deliveryService.exportToExcel();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `relatorio_entregas_${timestamp}.xlsx`);
      toast.success('Relatório de entregas exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar entregas:', error);
      toast.error('Erro ao exportar relatório de entregas');
    } finally {
      setExportingDeliveries(false);
    }
  };

  // Função para exportar relatório geral
  const handleExportGeneral = async () => {
    try {
      setExportingGeneral(true);
      
      // Escolhe o relatório baseado no perfil do usuário
      const blob = hasProfile('ADMIN') || hasProfile('MANAGER') 
        ? await taskService.exportGeneralReport()
        : await taskService.exportGeneralReportForUser();
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      const filename = hasProfile('ADMIN') || hasProfile('MANAGER') 
        ? `relatorio_geral_completo_${timestamp}.xlsx`
        : `relatorio_geral_user_${timestamp}.xlsx`;
      
      downloadBlob(blob, filename);
      toast.success('Relatório geral exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar relatório geral:', error);
      toast.error('Erro ao exportar relatório geral');
    } finally {
      setExportingGeneral(false);
    }
  };


  // Função para exportar faturamento
  const handleExportBilling = async () => {
    try {
      setExportingBilling(true);
      const blob = await billingPeriodService.exportToExcel({});
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `relatorio_faturamento_${timestamp}.xlsx`);
      toast.success('Relatório de faturamento exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar faturamento:', error);
      toast.error('Erro ao exportar relatório de faturamento');
    } finally {
      setExportingBilling(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Geral
                </h1>
                <p className="text-gray-600 mt-2">
                  Bem-vindo de volta, {user?.username || 'Usuário'}!
                </p>
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
                <div className="flex items-center mt-2 text-green-600">
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Sistema Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tasks */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Tarefas</p>
                <p className="text-3xl font-bold">
                  {stats.tasks?.total || 0}
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  {stats.tasks?.active || 0} ativas
                </p>
              </div>
              <CheckSquare className="w-12 h-12 text-blue-200" />
            </div>
          </Card>

          {/* Completed Tasks */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Tarefas Concluídas</p>
                <p className="text-3xl font-bold">
                  {stats.tasks?.completed || 0}
                </p>
                <p className="text-green-200 text-xs mt-1">
                  {((stats.tasks?.completed || 0) / (stats.tasks?.total || 1) * 100).toFixed(1)}% do total
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          {/* Total Deliveries */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total de Entregas</p>
                <p className="text-3xl font-bold">
                  {stats.deliveries?.total || 0}
                </p>
                <p className="text-purple-200 text-xs mt-1">
                  {stats.deliveries?.active || 0} pendentes
                </p>
              </div>
              <Truck className="w-12 h-12 text-purple-200" />
            </div>
          </Card>

          {/* Completion Rate */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Taxa de Sucesso</p>
                <p className="text-3xl font-bold">
                  {stats.general?.completionRate?.toFixed(1) || 0}%
                </p>
                <p className="text-orange-200 text-xs mt-1">
                  Performance geral
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Seção de Relatórios - Primeira posição */}
        <Card title="📊 Relatórios e Exportações" className="hover:shadow-xl transition-shadow duration-300 border-l-4 border-indigo-500">
          <div className={`grid gap-4 ${hasProfile('ADMIN') || hasProfile('MANAGER') ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3'}`}>
            {/* Relatório Geral - Disponível para todos os perfis */}
            <div
              onClick={handleExportGeneral}
              className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 cursor-pointer border-2 border-indigo-200 hover:border-indigo-300 shadow-md hover:shadow-lg"
            >
              {exportingGeneral ? (
                <Loader2 className="w-8 h-8 text-indigo-600 mb-2 animate-spin" />
              ) : (
                <Database className="w-8 h-8 text-indigo-600 mb-2" />
              )}
              <span className="text-sm font-bold text-indigo-800 text-center">
                {exportingGeneral ? 'Gerando...' : 'Relatório Geral'}
              </span>
              <span className="text-xs text-indigo-600 mt-1 text-center">
                {hasProfile('ADMIN') || hasProfile('MANAGER') ? 'Visão Completa' : 'Visão User'}
              </span>
            </div>

            {/* Exportar Tarefas */}
            <div
              onClick={handleExportTasks}
              className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {exportingTasks ? (
                <Loader2 className="w-8 h-8 text-blue-600 mb-2 animate-spin" />
              ) : (
                <Download className="w-8 h-8 text-blue-600 mb-2" />
              )}
              <span className="text-sm font-medium text-blue-800 text-center">
                {exportingTasks ? 'Exportando...' : 'Relatório Tarefas'}
              </span>
            </div>


            {/* Exportar Entregas */}
            <div
              onClick={handleExportDeliveries}
              className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
            >
              {exportingDeliveries ? (
                <Loader2 className="w-8 h-8 text-purple-600 mb-2 animate-spin" />
              ) : (
                <Truck className="w-8 h-8 text-purple-600 mb-2" />
              )}
              <span className="text-sm font-medium text-purple-800 text-center">
                {exportingDeliveries ? 'Exportando...' : 'Relatório Entregas'}
              </span>
            </div>

            {/* Exportar Faturamento */}
            {hasProfile('ADMIN') || hasProfile('MANAGER') ? (
              <div
                onClick={handleExportBilling}
                className="flex flex-col items-center p-6 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer"
              >
                {exportingBilling ? (
                  <Loader2 className="w-8 h-8 text-yellow-600 mb-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-8 h-8 text-yellow-600 mb-2" />
                )}
                <span className="text-sm font-medium text-yellow-800 text-center">
                  {exportingBilling ? 'Exportando...' : 'Relatório Faturamento'}
                </span>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Seção de Atalhos - Segunda posição */}
        <Card title="🚀 Atalhos Rápidos" className="hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500">
          <div className={`grid gap-4 ${
            hasProfile('ADMIN') ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 
            hasProfile('MANAGER') ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-4' : 
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
          }`}>
            {/* Ver Tarefas */}
            <Link to="/tasks">
              <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-800 text-center">Ver Tarefas</span>
              </div>
            </Link>


            {/* Ver Entregas */}
            <Link to="/deliveries">
              <div className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <Truck className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-800 text-center">Ver Entregas</span>
              </div>
            </Link>

            {/* Ver Projetos - Somente ADMIN */}
            {hasProfile('ADMIN') ? (
              <Link to="/projects">
                <div className="flex flex-col items-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                  <CheckSquare className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-800 text-center">Ver Projetos</span>
                </div>
              </Link>
            ) : null}

            {/* Ver Solicitantes - Somente ADMIN */}
            {hasProfile('ADMIN') ? (
              <Link to="/requesters">
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <Users className="w-8 h-8 text-gray-600 mb-2" />
                  <span className="text-sm font-medium text-gray-800 text-center">Ver Solicitantes</span>
                </div>
              </Link>
            ) : null}

            {/* Ver Faturamento - Somente ADMIN/MANAGER */}
            {hasProfile('ADMIN') || hasProfile('MANAGER') ? (
              <Link to="/billing">
                <div className="flex flex-col items-center p-6 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                  <TrendingUp className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-sm font-medium text-yellow-800 text-center">Ver Faturamento</span>
                </div>
              </Link>
            ) : null}
          </div>
        </Card>

        {/* Main Content Grid - Agora apenas com Tarefas e Entregas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Module */}
          <Card title="Gestão de Tarefas" className="hover:shadow-xl transition-shadow duration-300">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{stats.tasks?.total || 0}</div>
                  <div className="text-xs text-blue-600 font-medium">Total</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-600">{stats.tasks?.active || 0}</div>
                  <div className="text-xs text-yellow-600 font-medium">Em Progresso</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{stats.tasks?.completed || 0}</div>
                  <div className="text-xs text-green-600 font-medium">Concluídas</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Progresso Geral</span>
                  <span className="font-semibold text-gray-900">
                    {((stats.tasks?.completed || 0) / (stats.tasks?.total || 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((stats.tasks?.completed || 0) / (stats.tasks?.total || 1) * 100)}%` }}
                  ></div>
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
                    Nova Tarefa
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Deliveries Module */}
          <Card title="Gestão de Entregas" className="hover:shadow-xl transition-shadow duration-300">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{stats.deliveries?.total || 0}</div>
                  <div className="text-xs text-purple-600 font-medium">Total</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{stats.deliveries?.active || 0}</div>
                  <div className="text-xs text-orange-600 font-medium">Pendentes</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{stats.deliveries?.completed || 0}</div>
                  <div className="text-xs text-green-600 font-medium">Aprovadas</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Taxa de Aprovação</span>
                  <span className="font-semibold text-gray-900">
                    {((stats.deliveries?.completed || 0) / (stats.deliveries?.total || 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((stats.deliveries?.completed || 0) / (stats.deliveries?.total || 1) * 100)}%` }}
                  ></div>
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
                    Nova Entrega
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Tasks Stats */}
          {stats.tasksByStatus && stats.tasksByStatus.length > 0 && (
            <Card title="Estatísticas Mensais de Tarefas" className="hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-4">
                {stats.tasksByStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        status.status.includes('Criadas') ? 'bg-blue-500' :
                        status.status.includes('Concluídas') ? 'bg-green-500' :
                        status.status.includes('progresso') ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {status.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                      <div className="text-xs text-gray-500">tarefas</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Monthly Deliveries Stats */}
          {stats.deliveriesByStatus && stats.deliveriesByStatus.length > 0 && (
            <Card title="Estatísticas Mensais de Entregas" className="hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-4">
                {stats.deliveriesByStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        status.status.includes('Criadas') ? 'bg-purple-500' :
                        status.status.includes('Iniciadas') ? 'bg-orange-500' :
                        status.status.includes('Finalizadas') ? 'bg-green-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {status.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                      <div className="text-xs text-gray-500">entregas</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
