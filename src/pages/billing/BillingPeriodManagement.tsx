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

// Novos hooks e serviços
import { useBillingPeriods } from '../../hooks/useBillingPeriods';
import { useAuth } from '../../hooks/useAuth';
import billingPeriodService from '../../services/billingPeriodService';
import useTasks from '../../hooks/useTasks'; // Para gerenciar tarefas em vez de quotes

// Componentes
import BulkDeleteModal from '../../components/ui/BulkDeleteModal';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import BillingPeriodForm from '../../components/forms/BillingPeriodForm';
import Modal from '../../components/ui/Modal';

// Tipos
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
  onSuccess?: () => void;
}

const TaskLinkManagementModal: React.FC<TaskLinkManagementModalProps> = ({
  isOpen,
  onClose,
  billingPeriod,
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
  }, [isOpen, billingPeriod]);

  const loadLinkedTasks = async () => {
    if (!billingPeriod) return;
    
    setLoading(true);
    try {
      const links = await billingPeriodService.findTaskLinksByBillingPeriod(billingPeriod.id);
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

  const availableTasks = tasks.filter(task => 
    !linkedTasks.some(link => link.taskId === task.id)
  );

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
                      <p className="text-sm text-gray-500">{task?.code}</p>
                    </div>
                    <button
                      onClick={() => handleUnlinkTasks([link.taskId])}
                      className="text-red-600 hover:text-red-800 p-1"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma tarefa vinculada</p>
          )}
        </div>

        {/* Adicionar Tarefas */}
        <div>
          <h3 className="text-lg font-medium mb-3">Adicionar Tarefas</h3>
          {availableTasks.length > 0 ? (
            <>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {availableTasks.map((task) => (
                  <label key={task.id} className="flex items-center p-3 hover:bg-gray-50">
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
                      className="rounded border-gray-300 text-blue-600 mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.code}</p>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  {selectedTasks.length} tarefa(s) selecionada(s)
                </p>
                <button
                  onClick={handleLinkTasks}
                  disabled={selectedTasks.length === 0 || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Vincular Tarefas
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">Todas as tarefas já estão vinculadas</p>
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
    createBillingPeriod,
    updateBillingPeriod,
    deleteBillingPeriod,
    deleteBulkBillingPeriods,
    getStatistics,
    exportToExcel
  } = useBillingPeriods();

  // Estados do componente
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BillingPeriod | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedPeriodForTasks, setSelectedPeriodForTasks] = useState<BillingPeriod | null>(null);
  const [statistics, setStatistics] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusValue | ''>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BillingPeriod | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getStatistics();
        setStatistics(stats);
      } catch (error) {
        // Ignorar erro de estatísticas
      }
    };
    loadStats();
  }, [billingPeriods]);

  // Filtros e busca
  const filteredPeriods = useMemo(() => {
    return billingPeriods.filter(period => {
      const matchesSearch = searchTerm === '' || 
        `${period.month}/${period.year}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        period.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || period.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [billingPeriods, searchTerm, statusFilter]);

  // Handlers
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

  // Status helpers
  const getStatusIcon = (status: StatusValue) => {
    switch (status) {
      case 'PAGO': return <CheckCircle className="text-green-600" size={16} />;
      case 'FATURADO': return <FileText className="text-blue-600" size={16} />;
      case 'ATRASADO': return <AlertCircle className="text-red-600" size={16} />;
      case 'CANCELADO': return <XCircle className="text-gray-600" size={16} />;
      default: return <Clock className="text-orange-600" size={16} />;
    }
  };

  const getStatusColor = (status: StatusValue) => {
    switch (status) {
      case 'PAGO': return 'bg-green-100 text-green-800';
      case 'FATURADO': return 'bg-blue-100 text-blue-800';
      case 'ATRASADO': return 'bg-red-100 text-red-800';
      case 'CANCELADO': return 'bg-gray-100 text-gray-800';
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
              <h3 className="text-red-800 font-medium">Erro ao carregar períodos</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Períodos de Faturamento</h1>
          <p className="text-gray-600 mt-1">Gerencie os períodos mensais de faturamento de tarefas</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Novo Período
        </button>
      </div>

      {/* Estatísticas */}
      {Object.keys(statistics).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(statistics).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{status}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                {getStatusIcon(status as StatusValue)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por mês/ano ou status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusValue | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="FATURADO">Faturado</option>
            <option value="PAGO">Pago</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
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
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <span className="text-blue-800 font-medium">
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
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin mr-2" size={24} />
            Carregando períodos...
          </div>
        ) : filteredPeriods.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum período encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter ? 'Tente ajustar os filtros de busca.' : 'Crie seu primeiro período de faturamento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={selectedPeriods.length === filteredPeriods.length && filteredPeriods.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeriods(filteredPeriods.map(p => p.id));
                        } else {
                          setSelectedPeriods([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-gray-900">Período</th>
                  <th className="text-left p-3 font-medium text-gray-900">Data de Pagamento</th>
                  <th className="text-left p-3 font-medium text-gray-900">Status</th>
                  <th className="text-left p-3 font-medium text-gray-900">Criado em</th>
                  <th className="text-right p-3 font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
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
                        className="rounded border-gray-300 text-blue-600"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="text-gray-400" size={16} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatMonth(period.month)} {period.year}
                          </p>
                          <p className="text-sm text-gray-500">#{period.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {period.paymentDate ? (
                        <span className="text-gray-900">
                          {new Date(period.paymentDate).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-gray-500">Não definida</span>
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
                    <td className="p-3 text-gray-600">
                      {period.createdAt ? new Date(period.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenTaskModal(period)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                          title="Gerenciar Tarefas"
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPeriod(period);
                            setShowForm(true);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(period)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
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
        onSuccess={() => {
          // Recarregar dados se necessário
        }}
      />

      {/* Modal de confirmação de exclusão */}
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