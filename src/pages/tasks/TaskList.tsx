import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    ExternalLink,
    CheckSquare,
    DollarSign,
    Search,
    Filter,
    User,
    Video,
    Calendar,
    Eye,
    Download,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { formatPaginationText } from '@/utils/paginationUtils';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import toast from 'react-hot-toast';

interface SubTask {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    status: string;
    taskId?: number;
    excluded?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface Task {
    id: number;
    requesterId: number;
    requesterName?: string;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    amount?: number;
    hasSubTasks?: boolean;
    taskType?: string;
    serverOrigin?: string;
    systemModule?: string;
    priority?: string;
    subTasks?: SubTask[];
    createdAt?: string;
    updatedAt?: string;
    createdByUserId?: number;
    createdByUserName?: string;
    updatedByUserId?: number;
    updatedByUserName?: string;
    hasDelivery?: boolean;
    hasQuoteInBilling?: boolean;
}

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile, user } = useAuth();

    // Verifica se o usuário tem permissões
    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const isUser = hasProfile('USER');
    const canCreateTasks = isAdmin || isManager || isUser; // Todos podem criar tarefas
    const canViewValues = isAdmin; // Apenas ADMIN pode ver valores
    const canViewDeliveryColumns = isAdmin || isManager; // Apenas ADMIN e MANAGER podem ver colunas de entrega
    const currentUserId = user?.id;

    // Função para verificar se pode editar/excluir uma tarefa
    const canModifyTask = (task: Task) => {
        if (isAdmin) return true; // ADMIN pode modificar qualquer tarefa
        if (!currentUserId) return false;
        return task.createdByUserId === currentUserId; // MANAGER/USER podem modificar apenas suas próprias tarefas
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const {
        tasks,
        pagination,
        loading,
        exporting,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteTaskWithSubTasks,
        deleteBulkTasks, // <-- deve existir no hook; ajuste o nome se necessário
        exportToExcel,
    } = useTasks();

    const handleEdit = (id: number) => {
        navigate(`/tasks/${id}/edit`);
    };

    const handleView = (task: Task) => {
        // Mapear a estrutura da task para o formato esperado pelo modal
        const taskForModal = {
            id: task.id,
            name: task.title,
            code: task.code,
            description: task.description,
            status: task.status,
            priority: task.priority || 'MEDIUM',
            taskType: task.taskType,
            serverOrigin: task.serverOrigin,
            systemModule: task.systemModule,
            estimatedHours: undefined,
            actualHours: undefined,
            requesterName: task.requesterName,
            projectName: undefined,
            projects: undefined, // Pode ser preenchido se houver dados de projetos
            link: task.link,
            meetingLink: task.meetingLink,
            notes: task.notes,
            subtasks: task.subTasks?.map(subtask => ({
                id: subtask.id || 0,
                title: subtask.title,
                description: subtask.description || subtask.title,
                completed: subtask.status === 'COMPLETED',
                status: subtask.status,
                amount: subtask.amount,
                createdAt: subtask.createdAt
            })),
            totalAmount: calculateTaskTotal(task),
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
        };

        setSelectedTask(taskForModal);
        setShowDetailModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta tarefa e todas as suas subtarefas?')) {
            try {
                await deleteTaskWithSubTasks(id);
            } catch (error) {
                toast.error('Erro ao excluir tarefa');
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Progresso',
            COMPLETED: 'Concluída',
            CANCELLED: 'Cancelada',
        };
        return labels[status] || status;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            LOW: 'bg-green-100 text-green-800',
            MEDIUM: 'bg-yellow-100 text-yellow-800',
            HIGH: 'bg-orange-100 text-orange-800',
            URGENT: 'bg-red-100 text-red-800',
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            LOW: '🟢 Baixa',
            MEDIUM: '🟡 Média',
            HIGH: '🟠 Alta',
            URGENT: '🔴 Urgente',
        };
        return labels[priority] || priority;
    };

    const getTaskTypeLabel = (taskType?: string) => {
        if (!taskType) return '-';
        const labels: Record<string, string> = {
            BUG: '🐛 Bug',
            ENHANCEMENT: '📨 Melhoria',
            NEW_FEATURE: '✨ Nova Funcionalidade',
        };
        return labels[taskType] || taskType;
    };

    const calculateTaskTotal = (task?: Task) => {
        if (!task) return 0;
        // Usar o campo amount da tarefa principal
        return parseFloat(task.amount?.toString() || '0') || 0;
    };

    // ===== Seleção múltipla (todos podem ver, só ADMIN pode selecionar todas) =====
    const toggleItem = (id: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task || !canModifyTask(task)) return; // Só permite selecionar se puder modificar

        setSelectedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        const currentPageIds = tasks
            .filter(task => canModifyTask(task)) // Só incluir tarefas modificáveis do usuário atual
            .map((t) => t.id);
        const allSelected = currentPageIds.every((id) => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const clearSelection = () => setSelectedItems([]);

    const selectionState = useMemo(() => {
        const modifiableTaskIds = tasks.filter(task => canModifyTask(task)).map((t) => t.id);
        const selectedFromCurrentPage = selectedItems.filter((id) => modifiableTaskIds.includes(id));

        return {
            allSelected:
                modifiableTaskIds.length > 0 && selectedFromCurrentPage.length === modifiableTaskIds.length,
            someSelected:
                selectedFromCurrentPage.length > 0 && selectedFromCurrentPage.length < modifiableTaskIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrentPage,
        };
    }, [tasks, selectedItems, currentUserId]);

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;
        setIsDeleting(true);
        try {
            await deleteBulkTasks(selectedItems);
            const qty = selectedItems.length;
            clearSelection();
            setShowBulkDeleteModal(false);
            toast.success(`${qty} tarefa(s) excluída(s) com sucesso`);
        } catch (error) {
            toast.error('Erro ao excluir tarefas selecionadas');
        } finally {
            setIsDeleting(false);
        }
    };


    // ===== Busca simples (mobile) =====
    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getStatusLabel(task.status).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ===== Colunas (inclui checkbox de seleção) =====
    const columns: Column<Task>[] = [
        // Checkbox de seleção - para usuários que podem criar tarefas
        ...(canCreateTasks ? [{
            key: 'select',
            title: '',
            width: '50px',
            align: 'center',
            headerRender: () => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectionState.allSelected}
                        ref={(input) => {
                            if (input) input.indeterminate = selectionState.someSelected;
                        }}
                        onChange={toggleAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        title={selectionState.allSelected ? 'Desmarcar tarefas próprias' : 'Selecionar tarefas próprias'}
                    />
                </div>
            ),
            render: (item) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        disabled={!canModifyTask(item)}
                        className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                            !canModifyTask(item) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        title={canModifyTask(item) ? 'Selecionar tarefa' : 'Você não pode modificar esta tarefa'}
                    />
                </div>
            ),
        }] : []),
        // Colunas que todos podem ver
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '100px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          #{item.id}
        </span>
            ),
        },
        {
            key: 'code',
            title: 'Código',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            render: (item) => (
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {item.code}
        </span>
            ),
        },
        {
            key: 'title',
            title: 'Título',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '250px',
            render: (item) => (
                <div>
                    <p className="font-medium text-gray-900 truncate cursor-help" title={item.title}>
                        {item.title}
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '140px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
          {getStatusLabel(item.status)}
        </span>
            ),
        },
        {
            key: 'priority',
            title: 'Prioridade',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority || 'MEDIUM')}`}>
                    {getPriorityLabel(item.priority || 'MEDIUM')}
                </span>
            ),
        },
        {
            key: 'taskType',
            title: 'Tipo',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '150px',
            render: (item) => (
                <span className="text-sm text-gray-700">
                    {getTaskTypeLabel(item.taskType)}
                </span>
            ),
            hideable: true,
        },
        {
            key: 'systemModule',
            title: 'Módulo',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            render: (item) => (
                <span className="text-sm text-gray-600" title={item.systemModule}>
                    {item.systemModule ? item.systemModule.substring(0, 15) + (item.systemModule.length > 15 ? '...' : '') : '-'}
                </span>
            ),
            hideable: true,
        },
        {
            key: 'requesterName',
            title: 'Solicitante',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => <span className="text-sm text-gray-900">{item.requesterName || 'Não informado'}</span>,
        },
        {
            key: 'link',
            title: 'Link',
            width: '80px',
            align: 'center',
            render: (item) =>
                item.link ? (
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        title={item.link}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
            hideable: true,
        },
        {
            key: 'meetingLink',
            title: 'Reunião',
            width: '80px',
            align: 'center',
            render: (item) =>
                item.meetingLink ? (
                    <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                        title={item.meetingLink}
                    >
                        <Video className="w-4 h-4" />
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
            hideable: true,
        },
        {
            key: 'subTasks',
            title: 'Subtarefas',
            width: '120px',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <CheckSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{item.subTasks?.length || 0}</span>
                </div>
            ),
        },
        // Colunas de Entrega e Faturamento - apenas para ADMIN e MANAGER
        ...(canViewDeliveryColumns ? [{
            key: 'hasDelivery',
            title: 'Entrega',
            sortable: false,
            filterable: false,
            width: '120px',
            align: 'center' as const,
            render: (item: Task) => (
                <div className="flex items-center justify-center">
                    {item.hasDelivery ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Vinculado
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✗ Pendente
                        </span>
                    )}
                </div>
            ),
        }, {
            key: 'hasQuoteInBilling',
            title: 'Faturamento',
            sortable: false,
            filterable: false,
            width: '120px',
            align: 'center' as const,
            render: (item: Task) => (
                <div className="flex items-center justify-center">
                    {item.hasQuoteInBilling ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✓ Faturado
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Aguardando
                        </span>
                    )}
                </div>
            ),
        }] : []),

        {
            key: 'createdByUserName',
            title: 'Criado por',
            sortable: false,
            filterable: false,
            render: (item) => item.createdByUserName || '-',
            hideable: true,
        },

        // Coluna de valor total - apenas para ADMIN (por último)
        ...(canViewValues ? [{
            key: 'total',
            title: 'Valor Total',
            width: '120px',
            align: 'right' as const,
            render: (item: Task) => (
                <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                        {formatCurrency(calculateTaskTotal(item))}
                    </span>
                </div>
            ),
        }] : []),
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.createdAt),
            hideable: true,
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.updatedAt),
            hideable: true,
        },
        {
            key: 'updatedByUserName',
            title: 'Alterado por',
            sortable: false,
            filterable: false,
            render: (item) => item.updatedByUserName || '-',
            hideable: true,
        },
        // Coluna de ações
        {
            key: 'actions',
            title: 'Ações',
            align: 'center' as const,
            width: '150px',
            render: (item: Task) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(item)}
                        title="Visualizar detalhes"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    {canModifyTask(item) && (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(item.id)} title="Editar">
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                title="Excluir"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    // ===== Card (mobile) com checkbox + ações =====
    const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox - para usuários que podem criar tarefas */}
                    {canCreateTasks && (
                        <div className="flex-shrink-0 pt-1">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(task.id)}
                                onChange={() => toggleItem(task.id)}
                                disabled={!canModifyTask(task)}
                                className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                                    !canModifyTask(task) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title={canModifyTask(task) ? 'Selecionar tarefa' : 'Você não pode modificar esta tarefa'}
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                #{task.id}
              </span>
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {task.code}
              </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority || 'MEDIUM')}`}>
                {getPriorityLabel(task.priority || 'MEDIUM')}
              </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{task.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
                            {task.taskType && (
                                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                    {getTaskTypeLabel(task.taskType)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex gap-1 ml-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(task)}
                        title="Visualizar detalhes"
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    {canModifyTask(task) && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(task.id)}
                                title="Editar"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(task.id)}
                                title="Excluir"
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Informações da Task */}
            <div className="space-y-2">
                {task.requesterName && (
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700">{task.requesterName}</span>
                    </div>
                )}

                {task.systemModule && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 flex-shrink-0">📁</span>
                        <span className="text-gray-600">{task.systemModule}</span>
                    </div>
                )}

                {task.serverOrigin && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 flex-shrink-0">🖥️</span>
                        <span className="text-gray-600">{task.serverOrigin}</span>
                    </div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{task.subTasks?.length || 0} subtarefa(s)</span>
                    </div>

                    {canViewValues && (
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                                {formatCurrency(calculateTaskTotal(task))}
                            </span>
                        </div>
                    )}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 text-sm">
                    {task.link && (
                        <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <a
                                href={task.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                            >
                                Ver link da tarefa
                            </a>
                        </div>
                    )}

                    {task.meetingLink && (
                        <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <a
                                href={task.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 hover:underline truncate"
                            >
                                Entrar na reunião
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Tarefas
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isAdmin ? 'Gerencie todas as tarefas do sistema' : 'Visualize todas as tarefas - Edite apenas as suas'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={exportToExcel}
                        loading={exporting}
                        disabled={exporting}
                        className="flex items-center justify-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {exporting ? 'Exportando...' : 'Exportar Excel'}
                    </Button>
                    {canCreateTasks && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/tasks/create')}
                            className="flex items-center justify-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Tarefa
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros Mobile - Busca + seleção e bulk delete */}
            <div className="lg:hidden space-y-4">
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por título, código, solicitante ou status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        {canCreateTasks && (
                            <div className="flex items-center justify-between gap-3">
                                <Button size="sm" variant="ghost" onClick={toggleAll} className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectionState.allSelected}
                                            ref={(input) => {
                                                if (input) input.indeterminate = selectionState.someSelected;
                                            }}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <span className="text-sm">{selectionState.allSelected ? 'Desmarcar Minhas Tarefas' : 'Selecionar Minhas Tarefas'}</span>
                                </Button>

                                {selectionState.hasSelection && (
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm">Excluir ({selectedItems.length})</span>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Conteúdo Responsivo */}
            {loading ? (
                <Card className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-4 text-gray-600">Carregando...</span>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Desktop - Barra de ações quando há seleção */}
                    <div className="hidden lg:block space-y-4">
                        {canCreateTasks && selectionState.hasSelection && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.length} tarefa(s) selecionada(s)
                    </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={clearSelection}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            Limpar seleção
                                        </Button>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Selecionadas
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Desktop - Tabela */}
                        <Card className="p-0">
                            <DataTable
                                data={tasks} // dados originais (filtros e ordenações do DataTable)
                                columns={columns}
                                loading={loading}
                                pagination={pagination}
                                sorting={sorting}
                                filters={filters}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                onSort={setSorting}
                                onFilter={setFilter}
                                onClearFilters={clearFilters}
                                emptyMessage="Nenhuma tarefa encontrada"
                                showColumnToggle={true}
                                hiddenColumns={['createdAt', 'updatedAt', 'updatedByUserName', 'taskType', 'systemModule', 'link', 'meetingLink']}
                            />
                        </Card>
                    </div>

                    {/* Mobile/Tablet - Cards com busca simples */}
                    <div className="lg:hidden">
                        {filteredTasks.length === 0 ? (
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
                                    <p>Tente ajustar os filtros de busca ou criar uma nova tarefa.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </div>
                        )}

                        {/* Paginação Simplificada (mobile) */}
                        {pagination && pagination.totalPages > 1 && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setPage(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                    >
                                        Anterior
                                    </Button>

                                    <span className="text-sm text-gray-600">
{formatPaginationText(pagination.currentPage, pagination.totalPages)}
                  </span>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setPage(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.totalPages}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {/* Modal de exclusão em massa */}
            <BulkDeleteModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                selectedCount={selectedItems.length}
                isDeleting={isDeleting}
                entityName="tarefa"
            />

            {/* Modal de detalhes da tarefa */}
            <TaskDetailModal
                task={selectedTask}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedTask(null);
                }}
                canViewValues={canViewValues}
            />
        </div>
    );
};

export default TaskList;
