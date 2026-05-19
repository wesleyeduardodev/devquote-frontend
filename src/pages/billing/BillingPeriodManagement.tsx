import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Calendar,
  DollarSign,
  FileText,
  Link2,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Download,
  Eye,
  TrendingUp,
  Loader2,
  Hash,
} from 'lucide-react';
import { formatInputDate } from '../../utils/formatters';

import { useBillingPeriods } from '../../hooks/useBillingPeriods';
import { useAuth } from '../../hooks/useAuth';
import billingPeriodService from '../../services/billingPeriodService';
import { useTasks } from '../../hooks/useTasks';

import BulkDeleteModal from '../../components/ui/BulkDeleteModal';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import BillingPeriodForm from '../../components/forms/BillingPeriodForm';
import Modal from '../../components/ui/Modal';
import { FlowTypeFilter, FlowTypeFilterValue } from '../../components/filters/FlowTypeFilter';

import { 
  BillingPeriod, 
  BillingPeriodRequest, 
  BillingPeriodTask,
  BillingPeriodTaskRequest 
} from '@/types/billing.types';

type StatusValue = 'PENDENTE' | 'FATURADO' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

interface TaskLinkManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingPeriod: BillingPeriod | null;
  flowType: FlowTypeFilterValue;
  onSuccess?: () => void;
}

const TaskLinkManagementModal: React.FC<TaskLinkManagementModalProps> = ({
  isOpen,
  onClose,
  billingPeriod,
  flowType,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [linkedTasks, setLinkedTasks] = useState<BillingPeriodTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const { tasks } = useTasks();

  useEffect(() => {
    if (isOpen && billingPeriod) {
      loadLinkedTasks();
    }
  }, [isOpen, billingPeriod, flowType]);

  const loadLinkedTasks = async () => {
    if (!billingPeriod) return;

    setLoading(true);
    try {
      const links = await billingPeriodService.findTaskLinksByBillingPeriod(billingPeriod.id, flowType);
      setLinkedTasks(links);
    } catch (error: any) {
      toast.error('Erro ao carregar tarefas vinculadas');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkTasks = async () => {
    if (!billingPeriod || selectedTasks.length === 0) return;

    setLoading(true);
    try {
      const requests: BillingPeriodTaskRequest[] = selectedTasks.map(taskId => ({
        billingPeriodId: billingPeriod.id,
        taskId
      }));

      await billingPeriodService.bulkLinkTasks(requests);
      toast.success(`${selectedTasks.length} tarefa(s) vinculada(s) com sucesso`);
      setSelectedTasks([]);
      await loadLinkedTasks();
      onSuccess?.();
    } catch (error: any) {
      if (error.message.includes('já está incluída')) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao vincular tarefas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTasks = async (taskIds: number[]) => {
    if (!billingPeriod) return;

    setLoading(true);
    try {
      await billingPeriodService.bulkUnlinkTasks(billingPeriod.id, taskIds);
      toast.success(`${taskIds.length} tarefa(s) desvinculada(s) com sucesso`);
      await loadLinkedTasks();
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao desvincular tarefas');
    } finally {
      setLoading(false);
    }
  };

  const availableTasks = tasks.filter(task => {
    const notLinked = !linkedTasks.some(link => link.taskId === task.id);
    const matchesFlowType = flowType === 'TODOS' || task.flowType === flowType;
    return notLinked && matchesFlowType;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Tarefas do Período">
      <div className="space-y-6">
        {/* Tarefas Vinculadas */}
        <div>
          <h3 className="text-lg font-medium mb-3">Tarefas Vinculadas</h3>
          {linkedTasks.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {linkedTasks.map((link) => {
                const task = tasks.find(t => t.id === link.taskId);
                return (
                  <div key={link.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task?.title || `Tarefa #${link.taskId}`}</p>
                      <p className="text-sm text-text-tertiary">{task?.code}</p>
                    </div>
                    <button
                      onClick={() => handleUnlinkTasks([link.taskId])}
                      className="text-[var(--danger-strong)] hover:text-[var(--danger-strong)] p-1"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-tertiary text-center py-4">Nenhuma tarefa vinculada</p>
          )}
        </div>

        {/* Adicionar Tarefas */}
        <div>
          <h3 className="text-lg font-medium mb-3">Adicionar Tarefas</h3>
          {availableTasks.length > 0 ? (
            <>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {availableTasks.map((task) => (
                  <label key={task.id} className="flex items-center p-3 hover:bg-surface-app">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks(prev => [...prev, task.id]);
                        } else {
                          setSelectedTasks(prev => prev.filter(id => id !== task.id));
                        }
                      }}
                      className="rounded border-border-strong text-accent mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-text-tertiary">{task.code}</p>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-text-secondary">
                  {selectedTasks.length} tarefa(s) selecionada(s)
                </p>
                <button
                  onClick={handleLinkTasks}
                  disabled={selectedTasks.length === 0 || loading}
                  className="px-4 py-2 bg-accent text-white rounded-lg disabled:bg-gray-300 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Vincular Tarefas
                </button>
              </div>
            </>
          ) : (
            <p className="text-text-tertiary text-center py-4">Todas as tarefas já estão vinculadas</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

const BillingPeriodManagement: React.FC = () => {
  const { user } = useAuth();
  const {
    billingPeriods,
    loading,
    error,
    fetchBillingPeriods,
    createBillingPeriod,
    updateBillingPeriod,
    deleteBillingPeriod,
    deleteBulkBillingPeriods,
    getStatistics,
    exportToExcel
  } = useBillingPeriods();

  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BillingPeriod | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedPeriodForTasks, setSelectedPeriodForTasks] = useState<BillingPeriod | null>(null);
  const [statistics, setStatistics] = useState<{ byStatus?: { [key: string]: number } }>({});
  const [yearFilter, setYearFilter] = useState<number | undefined>();
  const [monthFilter, setMonthFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<StatusValue | ''>('');
  const [flowType, setFlowType] = useState<FlowTypeFilterValue>('TODOS');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BillingPeriod | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  useEffect(() => {
    fetchBillingPeriods(yearFilter, monthFilter, statusFilter || undefined, flowType);
  }, [yearFilter, monthFilter, statusFilter, flowType, fetchBillingPeriods]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getStatistics();
        setStatistics(stats);
      } catch (error) {
      }
    };
    loadStats();
  }, [billingPeriods]);

  const handleCreate = async (data: BillingPeriodRequest) => {
    try {
      await createBillingPeriod(data);
      toast.success('Período de faturamento criado com sucesso!');
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar período de faturamento');
    }
  };

  const handleUpdate = async (data: BillingPeriodRequest) => {
    if (!editingPeriod) return;

    try {
      await updateBillingPeriod(editingPeriod.id, data);
      toast.success('Período atualizado com sucesso!');
      setEditingPeriod(null);
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar período');
    }
  };

  const handleDelete = (period: BillingPeriod) => {
    setItemToDelete(period);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeletingSingle(true);
    try {
      await deleteBillingPeriod(itemToDelete.id);
      toast.success('Período excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir período');
    } finally {
      setIsDeletingSingle(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteBulkBillingPeriods(selectedPeriods);
      toast.success(`${selectedPeriods.length} período(s) excluído(s) com sucesso!`);
      setSelectedPeriods([]);
      setShowBulkDeleteModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir períodos');
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportToExcel({
        month: undefined,
        year: undefined,
        status: statusFilter || undefined
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio-faturamento-${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar relatório');
    }
  };

  const handleOpenTaskModal = (period: BillingPeriod) => {
    setSelectedPeriodForTasks(period);
    setShowTaskModal(true);
  };

  const getStatusIcon = (status: StatusValue) => {
    switch (status) {
      case 'PAGO': return <CheckCircle className="text-[var(--success-strong)]" size={16} />;
      case 'FATURADO': return <FileText className="text-accent" size={16} />;
      case 'ATRASADO': return <AlertCircle className="text-[var(--danger-strong)]" size={16} />;
      case 'CANCELADO': return <XCircle className="text-text-secondary" size={16} />;
      default: return <Clock className="text-orange-600" size={16} />;
    }
  };

  const getStatusColor = (status: StatusValue) => {
    switch (status) {
      case 'PAGO': return 'bg-success-soft text-[var(--success-strong)]';
      case 'FATURADO': return 'bg-accent-soft text-info-strong';
      case 'ATRASADO': return 'bg-danger-soft text-[var(--danger-strong)]';
      case 'CANCELADO': return 'bg-surface-2 text-text-primary';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const formatMonth = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || month;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-[var(--danger-strong)] font-medium">Erro ao carregar períodos</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Períodos de Faturamento</h1>
          <p className="text-text-secondary mt-1">Gerencie os períodos mensais de faturamento de tarefas</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          Novo Período
        </button>
      </div>

      {/* Estatísticas */}
      {statistics.byStatus && Object.keys(statistics.byStatus).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(statistics.byStatus).map(([status, count]: [string, number]) => (
            <div key={status} className="bg-surface-1 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">{status}</p>
                  <p className="text-2xl font-bold text-text-primary">{count}</p>
                </div>
                {getStatusIcon(status as StatusValue)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-surface-1 p-4 rounded-lg border space-y-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={yearFilter || ''}
            onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="">Todos os anos</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>

          <select
            value={monthFilter || ''}
            onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="">Todos os meses</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusValue | '')}
            className="px-3 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="FATURADO">Faturado</option>
            <option value="PAGO">Pago</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <select
            value={flowType}
            onChange={(e) => setFlowType(e.target.value as FlowTypeFilterValue)}
            className="px-3 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="TODOS">Todos os fluxos</option>
            <option value="DESENVOLVIMENTO">Desenvolvimento</option>
            <option value="OPERACIONAL">Operacional</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Exportar Excel
          </button>
        </div>

        {/* Ações em lote */}
        {selectedPeriods.length > 0 && (
          <div className="flex items-center justify-between bg-info-soft p-3 rounded-lg">
            <span className="text-info-strong font-medium">
              {selectedPeriods.length} período(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                Excluir Selecionados
              </button>
              <button
                onClick={() => setSelectedPeriods([])}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Limpar Seleção
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Períodos */}
      <div className="bg-surface-1 rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin mr-2" size={24} />
            Carregando períodos...
          </div>
        ) : billingPeriods.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto text-text-tertiary mb-4" size={48} />
            <h3 className="text-lg font-medium text-text-primary mb-2">Nenhum período encontrado</h3>
            <p className="text-text-secondary">
              {yearFilter || monthFilter || statusFilter || flowType !== 'TODOS' ? 'Tente ajustar os filtros.' : 'Crie seu primeiro período de faturamento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-app">
                <tr>
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={selectedPeriods.length === billingPeriods.length && billingPeriods.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeriods(billingPeriods.map(p => p.id));
                        } else {
                          setSelectedPeriods([]);
                        }
                      }}
                      className="rounded border-border-strong text-accent"
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-text-primary">Período</th>
                  <th className="text-left p-3 font-medium text-text-primary">Data de Pagamento</th>
                  <th className="text-left p-3 font-medium text-text-primary">Status</th>
                  <th className="text-left p-3 font-medium text-text-primary">Criado em</th>
                  <th className="text-right p-3 font-medium text-text-primary">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billingPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-surface-app">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedPeriods.includes(period.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPeriods(prev => [...prev, period.id]);
                          } else {
                            setSelectedPeriods(prev => prev.filter(id => id !== period.id));
                          }
                        }}
                        className="rounded border-border-strong text-accent"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="text-text-tertiary" size={16} />
                        <div>
                          <p className="font-medium text-text-primary">
                            {formatMonth(period.month)} {period.year}
                          </p>
                          <p className="text-sm text-text-tertiary">#{period.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {period.paymentDate ? (
                        <span className="text-text-primary">
                          {formatInputDate(period.paymentDate)}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">Não definida</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(period.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                          {period.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-text-secondary">
                      {period.createdAt ? new Date(period.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenTaskModal(period)}
                          className="p-1 text-accent hover:text-info-strong hover:bg-accent-soft rounded"
                          title="Gerenciar Tarefas"
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPeriod(period);
                            setShowForm(true);
                          }}
                          className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded"
                          title="Editar"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(period)}
                          className="p-1 text-[var(--danger-strong)] hover:text-[var(--danger-strong)] hover:bg-danger-soft rounded"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPeriod(null);
        }}
        title={editingPeriod ? "Editar Período" : "Novo Período"}
      >
        <BillingPeriodForm
          initialData={editingPeriod || undefined}
          onSubmit={editingPeriod ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingPeriod(null);
          }}
          loading={loading}
        />
      </Modal>

      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        count={selectedPeriods.length}
        itemName="período(s) de faturamento"
        loading={loading}
      />

      <TaskLinkManagementModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedPeriodForTasks(null);
        }}
        billingPeriod={selectedPeriodForTasks}
        flowType={flowType}
        onSuccess={() => {
          fetchBillingPeriods(yearFilter, monthFilter, statusFilter || undefined, flowType);
        }}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete ? `${formatMonth(itemToDelete.month)} ${itemToDelete.year}` : undefined}
        isDeleting={isDeletingSingle}
        title="Confirmar Exclusão do Período"
      />
    </div>
  );
};

export default BillingPeriodManagement;