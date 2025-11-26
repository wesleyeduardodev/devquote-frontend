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
  Loader2
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import { deliveryService } from '@/services/deliveryService';
import billingPeriodService from '@/services/billingPeriodService';
import { reportService } from '@/services/reportService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { stats, loading, error } = useDashboard();
  const { user, hasProfile } = useAuth();

  const [exportingTasks, setExportingTasks] = useState(false);
  const [exportingTasksWithItems, setExportingTasksWithItems] = useState(false);
  const [exportingDeliveries, setExportingDeliveries] = useState(false);
  const [exportingDeliveriesDev, setExportingDeliveriesDev] = useState(false);
  const [exportingDeliveriesOp, setExportingDeliveriesOp] = useState(false);
  const [exportingBilling, setExportingBilling] = useState(false);
  const [exportingStatistics, setExportingStatistics] = useState(false);

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

  const handleExportTasks = async () => {
    try {
      setExportingTasks(true);
      const blob = await taskService.exportTasksOnlyToExcel();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `Relatorio_Tarefas_${timestamp}.xlsx`);
      toast.success('Relatório de tarefas exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar tarefas:', error);
      toast.error('Erro ao exportar relatório de tarefas');
    } finally {
      setExportingTasks(false);
    }
  };

  const handleExportTasksWithItems = async () => {
    try {
      setExportingTasksWithItems(true);
      const blob = await taskService.exportToExcel();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `Relatorio_Tarefas_Itens_${timestamp}.xlsx`);
      toast.success('Relatório de tarefas + itens exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar tarefas + itens:', error);
      toast.error('Erro ao exportar relatório de tarefas + itens');
    } finally {
      setExportingTasksWithItems(false);
    }
  };

  const handleExportDeliveries = async () => {
    try {
      setExportingDeliveries(true);
      const canViewAmounts = hasProfile('ADMIN') || hasProfile('MANAGER');
      const blob = await deliveryService.exportDeliveriesOnlyToExcel(canViewAmounts);
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

  const handleExportDeliveriesDev = async () => {
    try {
      setExportingDeliveriesDev(true);
      const canViewAmounts = hasProfile('ADMIN') || hasProfile('MANAGER');
      const blob = await deliveryService.exportToExcel('DESENVOLVIMENTO', canViewAmounts);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `relatorio_entregas_desenvolvimento_${timestamp}.xlsx`);
      toast.success('Relatório de entregas (Desenvolvimento) exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar entregas desenvolvimento:', error);
      toast.error('Erro ao exportar relatório de entregas');
    } finally {
      setExportingDeliveriesDev(false);
    }
  };

  const handleExportDeliveriesOp = async () => {
    try {
      setExportingDeliveriesOp(true);
      const canViewAmounts = hasProfile('ADMIN') || hasProfile('MANAGER');
      const blob = await deliveryService.exportToExcel('OPERACIONAL', canViewAmounts);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `relatorio_entregas_operacional_${timestamp}.xlsx`);
      toast.success('Relatório de entregas (Operacional) exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar entregas operacional:', error);
      toast.error('Erro ao exportar relatório de entregas');
    } finally {
      setExportingDeliveriesOp(false);
    }
  };

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

  const handleExportStatistics = async () => {
    try {
      setExportingStatistics(true);
      const blob = await reportService.generateOperationalPdf({
        dataInicio: '',
        dataFim: ''
      });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '').replace('T', '_');
      downloadBlob(blob, `relatorio_estatisticas_${timestamp}.pdf`);
      toast.success('Relatório de estatísticas exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar estatísticas:', error);
      toast.error('Erro ao exportar relatório de estatísticas');
    } finally {
      setExportingStatistics(false);
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
                <p className="text-blue-100 text-sm font-medium">Tarefas Cadastradas</p>
                <p className="text-3xl font-bold">
                  {stats.tasks?.total || 0}
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  Total no sistema
                </p>
              </div>
              <CheckSquare className="w-12 h-12 text-blue-200" />
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
                  {stats.deliveries?.active || 0} em andamento
                </p>
              </div>
              <Truck className="w-12 h-12 text-purple-200" />
            </div>
          </Card>

          {/* Approved Deliveries */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Entregas Aprovadas</p>
                <p className="text-3xl font-bold">
                  {stats.deliveries?.completed || 0}
                </p>
                <p className="text-green-200 text-xs mt-1">
                  {((stats.deliveries?.completed || 0) / (stats.deliveries?.total || 1) * 100).toFixed(1)}% do total
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          {/* Taxa de Aprovação */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Taxa de Aprovação</p>
                <p className="text-3xl font-bold">
                  {((stats.deliveries?.completed || 0) / (stats.deliveries?.total || 1) * 100).toFixed(1)}%
                </p>
                <p className="text-orange-200 text-xs mt-1">
                  Entregas aprovadas
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Seção de Relatórios - Primeira posição */}
        <Card title="📊 Relatórios e Exportações" className="hover:shadow-xl transition-shadow duration-300 border-l-4 border-indigo-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* 1. Relatório Tarefas (só tarefas) */}
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

            {/* 2. Tarefas + Itens */}
            <div
              onClick={handleExportTasksWithItems}
              className="flex flex-col items-center p-6 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors cursor-pointer"
            >
              {exportingTasksWithItems ? (
                <Loader2 className="w-8 h-8 text-cyan-600 mb-2 animate-spin" />
              ) : (
                <FileText className="w-8 h-8 text-cyan-600 mb-2" />
              )}
              <span className="text-sm font-medium text-cyan-800 text-center">
                {exportingTasksWithItems ? 'Exportando...' : 'Tarefas + Itens'}
              </span>
            </div>

            {/* 3. Entregas (só entregas, ambos fluxos) */}
            <div
              onClick={handleExportDeliveries}
              className="flex flex-col items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              {exportingDeliveries ? (
                <Loader2 className="w-8 h-8 text-green-600 mb-2 animate-spin" />
              ) : (
                <Download className="w-8 h-8 text-green-600 mb-2" />
              )}
              <span className="text-sm font-medium text-green-800 text-center">
                {exportingDeliveries ? 'Exportando...' : 'Entregas'}
              </span>
            </div>

            {/* 4. Entrega Desenvolvimento (com itens) */}
            <div
              onClick={handleExportDeliveriesDev}
              className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
            >
              {exportingDeliveriesDev ? (
                <Loader2 className="w-8 h-8 text-purple-600 mb-2 animate-spin" />
              ) : (
                <Truck className="w-8 h-8 text-purple-600 mb-2" />
              )}
              <span className="text-sm font-medium text-purple-800 text-center">
                {exportingDeliveriesDev ? 'Exportando...' : 'Entrega Desenvolvimento'}
              </span>
            </div>

            {/* 5. Entrega Operacional (com itens) */}
            <div
              onClick={handleExportDeliveriesOp}
              className="flex flex-col items-center p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              {exportingDeliveriesOp ? (
                <Loader2 className="w-8 h-8 text-indigo-600 mb-2 animate-spin" />
              ) : (
                <Truck className="w-8 h-8 text-indigo-600 mb-2" />
              )}
              <span className="text-sm font-medium text-indigo-800 text-center">
                {exportingDeliveriesOp ? 'Exportando...' : 'Entrega Operacional'}
              </span>
            </div>

            {/* 6. Relatório Faturamento - Somente ADMIN/MANAGER */}
            {(hasProfile('ADMIN') || hasProfile('MANAGER')) && (
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
            )}

            {/* 7. Estatísticas - Somente ADMIN/MANAGER */}
            {(hasProfile('ADMIN') || hasProfile('MANAGER')) && (
              <div
                onClick={handleExportStatistics}
                className="flex flex-col items-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
              >
                {exportingStatistics ? (
                  <Loader2 className="w-8 h-8 text-orange-600 mb-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-8 h-8 text-orange-600 mb-2" />
                )}
                <span className="text-sm font-medium text-orange-800 text-center">
                  {exportingStatistics ? 'Exportando...' : 'Estatísticas'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Seção de Atalhos - Segunda posição */}
        <Card title="🚀 Atalhos Rápidos" className="hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500">
          <div className={`grid gap-6 max-w-5xl mx-auto ${
            hasProfile('ADMIN') ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
            hasProfile('MANAGER') ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3' :
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

      </div>
    </div>
  );
};

export default Dashboard;
