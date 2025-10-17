import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '@/types/task.types';
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
    Mail,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { formatPaginationText, formatMobileRecordCountText } from '@/utils/paginationUtils';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import toast from 'react-hot-toast';

interface SubTask {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    taskId?: number;
    excluded?: boolean;
    createdAt?: string;
    updatedAt?: string;
}


const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile, user } = useAuth();

    // Verifica se o usuário tem permissões
    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const isUser = hasProfile('USER');
    const canCreateTasks = isAdmin || isManager || isUser; // Todos podem criar tarefas
    const canViewValues = isAdmin || isManager; // ADMIN e MANAGER podem ver valores
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
    const [showFinancialEmailModal, setShowFinancialEmailModal] = useState(false);
    const [taskForEmail, setTaskForEmail] = useState<Task | null>(null);
    const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
    const [currentEmailInput, setCurrentEmailInput] = useState('');
    const [showTaskEmailModal, setShowTaskEmailModal] = useState(false);
    const [taskForTaskEmail, setTaskForTaskEmail] = useState<Task | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeletingSingle, setIsDeletingSingle] = useState(false);

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
        sendFinancialEmail,
        sendTaskEmail,
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
            subtasks: task.subTasks?.map(subtask => ({
                id: subtask.id || 0,
                title: subtask.title,
                description: subtask.description || subtask.title,
                completed: false,
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

    const handleDelete = (task: Task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        
        setIsDeletingSingle(true);
        try {
            await deleteTaskWithSubTasks(taskToDelete.id);
            setShowDeleteModal(false);
            setTaskToDelete(null);
            toast.success('Tarefa excluída com sucesso');
        } catch (error) {
            toast.error('Erro ao excluir tarefa');
        } finally {
            setIsDeletingSingle(false);
        }
    };

    const handleFinancialEmail = (task: Task) => {
        setTaskForEmail(task);
        setAdditionalEmails([]);
        setCurrentEmailInput('');
        setShowFinancialEmailModal(true);
    };

    const confirmSendFinancialEmail = async () => {
        if (!taskForEmail) return;

        try {
            await sendFinancialEmail(taskForEmail.id, additionalEmails);
        } catch (error) {
            // Error already handled by the hook
        } finally {
            setShowFinancialEmailModal(false);
            setTaskForEmail(null);
            setAdditionalEmails([]);
            setCurrentEmailInput('');
        }
    };

    const addEmail = () => {
        const email = currentEmailInput.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (!additionalEmails.includes(email)) {
                setAdditionalEmails([...additionalEmails, email]);
                setCurrentEmailInput('');
            } else {
                toast.error('Este email já foi adicionado');
            }
        } else if (email) {
            toast.error('Email inválido');
        }
    };

    const removeEmail = (index: number) => {
        setAdditionalEmails(additionalEmails.filter((_, i) => i !== index));
    };

    const handleTaskEmail = (task: Task) => {
        setTaskForTaskEmail(task);
        setAdditionalEmails([]);
        setCurrentEmailInput('');
        setShowTaskEmailModal(true);
    };

    const confirmSendTaskEmail = async () => {
        if (!taskForTaskEmail) return;

        try {
            await sendTaskEmail(taskForTaskEmail.id, additionalEmails);
        } catch (error) {
            // Error already handled by the hook
        } finally {
            setShowTaskEmailModal(false);
            setTaskForTaskEmail(null);
            setAdditionalEmails([]);
            setCurrentEmailInput('');
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
            task.requesterName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ===== Colunas (inclui checkbox de seleção) =====
    const columns: Column<Task>[] = [
        // Checkbox de seleção - para usuários que podem criar tarefas
        ...(canCreateTasks ? [{
            key: 'select',
            title: '',
            width: '50px',
            align: 'center' as const,
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
            align: 'center' as const,
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
            width: '280px',
            render: (item) => (
                <div className="max-w-[280px]">
                    <p 
                        className="font-medium text-gray-900 cursor-help line-clamp-2 break-words" 
                        title={item.title}
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            wordBreak: 'break-word',
                            lineHeight: '1.4'
                        }}
                    >
                        {item.title}
                    </p>
                </div>
            ),
        },
        {
            key: 'priority',
            title: 'Prioridade',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            align: 'center' as const,
            hideable: true,
            hidden: true,
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
            width: '160px',
            render: (item) => (
                <div className="max-w-[160px]">
                    <span className="text-sm text-gray-900 block truncate" title={item.requesterName || 'Não informado'}>
                        {item.requesterName || 'Não informado'}
                    </span>
                </div>
            ),
        },
        {
            key: 'link',
            title: 'Link',
            width: '80px',
            align: 'center' as const,
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
            align: 'center' as const,
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
            align: 'center' as const,
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
            width: '160px',
            render: (item) => (
                <div className="max-w-[160px]">
                    <span className="text-sm text-gray-700 block truncate" title={item.createdByUserName || '-'}>
                        {item.createdByUserName || '-'}
                    </span>
                </div>
            ),
            hideable: true,
            hidden: true,
        },

        // Coluna de valor total - para ADMIN e MANAGER (por último)
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
                    {/* 1. Visualizar */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(item)}
                        title="Visualizar detalhes"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    
                    {/* 2. Email Financeiro - apenas ADMIN */}
                    {isAdmin && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFinancialEmail(item)}
                            title={item.financialEmailSent ? "Email financeiro já enviado - Reenviar?" : "Enviar email financeiro"}
                            className={`${item.financialEmailSent ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'}`}
                        >
                            <DollarSign className="w-4 h-4" />
                        </Button>
                    )}
                    
                    {/* 3. Email da Tarefa - apenas ADMIN */}
                    {isAdmin && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskEmail(item)}
                            title={item.taskEmailSent ? "Email de tarefa já enviado - Reenviar?" : "Enviar email de tarefa"}
                            className={`${item.taskEmailSent ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'}`}
                        >
                            <Mail className="w-4 h-4" />
                        </Button>
                    )}

                    {/* 4. Editar - apenas quem pode modificar */}
                    {canModifyTask(item) && (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item.id)} title="Editar">
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}

                    {/* 5. Excluir - apenas quem pode modificar */}
                    {canModifyTask(item) && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item)}
                            title="Excluir"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // ===== Card (mobile) com checkbox + ações =====
    const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start gap-3 mb-3">
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
                    <div className="mb-2">
                        <h3 
                            className="font-semibold text-gray-900 text-lg leading-tight cursor-help line-clamp-2 break-words" 
                            title={task.title}
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word',
                                lineHeight: '1.4'
                            }}
                        >
                            {task.title}
                        </h3>
                    </div>
                    {task.taskType && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                {getTaskTypeLabel(task.taskType)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Informações da Task */}
            <div className="space-y-2">
                {/* Ações + Solicitante - na mesma linha para economizar espaço */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm flex-1">
                        {/* Ações compactas */}
                        <div className="flex gap-1 mr-3">
                            {/* 1. Visualizar */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(task)}
                                title="Visualizar detalhes"
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1"
                            >
                                <Eye className="w-3.5 h-3.5" />
                            </Button>
                            
                            {/* 2. Email Financeiro - apenas ADMIN */}
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleFinancialEmail(task)}
                                    title={task.financialEmailSent ? "Email financeiro já enviado - Reenviar?" : "Enviar email financeiro"}
                                    className={`p-1 ${task.financialEmailSent ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'}`}
                                >
                                    <DollarSign className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            
                            {/* 3. Email da Tarefa - apenas ADMIN */}
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleTaskEmail(task)}
                                    title={task.taskEmailSent ? "Email de tarefa já enviado - Reenviar?" : "Enviar email de tarefa"}
                                    className={`p-1 ${task.taskEmailSent ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'}`}
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                </Button>
                            )}

                            {/* 4. Editar - apenas quem pode modificar */}
                            {canModifyTask(task) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(task.id)}
                                    title="Editar"
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                            )}

                            {/* 5. Excluir - apenas quem pode modificar */}
                            {canModifyTask(task) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(task)}
                                    title="Excluir"
                                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                        
                        {/* Solicitante */}
                        {task.requesterName && (
                            <>
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{task.requesterName}</span>
                            </>
                        )}
                    </div>
                </div>

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
                                placeholder="Buscar por título, código ou solicitante..."
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
                                hiddenColumns={['createdAt', 'updatedAt', 'updatedByUserName', 'taskType', 'systemModule', 'link', 'meetingLink', 'priority', 'createdByUserName']}
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

                        {/* Paginação Melhorada (mobile) */}
                        {pagination && pagination.totalPages > 1 && (
                            <Card className="p-4">
                                <div className="space-y-3">
                                    {/* Informação de registros */}
                                    <div className="text-center text-sm text-gray-600">
                                        {formatMobileRecordCountText(
                                            pagination.currentPage,
                                            pagination.pageSize,
                                            pagination.totalElements
                                        )}
                                    </div>
                                    
                                    {/* Controles de navegação */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                            {/* Primeira página */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(0)}
                                                disabled={pagination.currentPage <= 0}
                                                title="Primeira página"
                                                className="p-2"
                                            >
                                                <ChevronsLeft className="w-4 h-4" />
                                            </Button>
                                            {/* Página anterior */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage <= 0}
                                                title="Página anterior"
                                            >
                                                Anterior
                                            </Button>
                                        </div>

                                        <span className="text-sm text-gray-600 font-medium">
                                            {formatPaginationText(pagination.currentPage, pagination.totalPages)}
                                        </span>

                                        <div className="flex gap-1">
                                            {/* Próxima página */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.currentPage + 1)}
                                                disabled={pagination.currentPage >= pagination.totalPages - 1}
                                                title="Próxima página"
                                            >
                                                Próxima
                                            </Button>
                                            {/* Última página */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.totalPages - 1)}
                                                disabled={pagination.currentPage >= pagination.totalPages - 1}
                                                title="Última página"
                                                className="p-2"
                                            >
                                                <ChevronsRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
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

            {/* Modal de confirmação de email financeiro */}
            {showFinancialEmailModal && taskForEmail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    💰 Email Financeiro
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Tarefa: {taskForEmail.code}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {taskForEmail.financialEmailSent ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Email já enviado
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        O email financeiro para esta tarefa já foi enviado anteriormente.
                                        Deseja enviar novamente?
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-orange-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Enviar email financeiro
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Deseja enviar um email com os detalhes financeiros desta tarefa para o departamento financeiro?
                                    </p>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">{taskForEmail.title}</h4>
                                <div className="text-sm text-gray-600">
                                    <p><strong>Solicitante:</strong> {taskForEmail.requesterName}</p>
                                </div>
                            </div>

                            {/* Seção de Emails Adicionais */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Emails adicionais em cópia (opcional)
                                </label>

                                {/* Input para adicionar email */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="email"
                                        value={currentEmailInput}
                                        onChange={(e) => setCurrentEmailInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addEmail();
                                            }
                                        }}
                                        placeholder="exemplo@email.com"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={addEmail}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                                    >
                                        Adicionar
                                    </Button>
                                </div>

                                {/* Lista de emails adicionados */}
                                {additionalEmails.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {additionalEmails.map((email, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {email}
                                                <button
                                                    onClick={() => removeEmail(index)}
                                                    className="hover:text-blue-900 font-bold"
                                                    title="Remover email"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowFinancialEmailModal(false);
                                        setTaskForEmail(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={confirmSendFinancialEmail}
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    {taskForEmail.financialEmailSent ? 'Reenviar' : 'Enviar Email'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmação de email de tarefa */}
            {showTaskEmailModal && taskForTaskEmail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    📧 Email de Tarefa
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Tarefa: {taskForTaskEmail.code}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {taskForTaskEmail.taskEmailSent ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Email já enviado
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        O email desta tarefa já foi enviado anteriormente.
                                        Deseja enviar novamente?
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Enviar email de tarefa
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Deseja enviar um email com os detalhes desta tarefa para o solicitante?
                                    </p>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">{taskForTaskEmail.title}</h4>
                                <div className="text-sm text-gray-600">
                                    <p><strong>Código:</strong> {taskForTaskEmail.code}</p>
                                    <p><strong>Solicitante:</strong> {taskForTaskEmail.requesterName}</p>
                                </div>
                            </div>

                            {/* Seção de Emails Adicionais */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Emails adicionais em cópia (opcional)
                                </label>

                                {/* Input para adicionar email */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="email"
                                        value={currentEmailInput}
                                        onChange={(e) => setCurrentEmailInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addEmail();
                                            }
                                        }}
                                        placeholder="exemplo@email.com"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={addEmail}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                                    >
                                        Adicionar
                                    </Button>
                                </div>

                                {/* Lista de emails adicionados */}
                                {additionalEmails.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {additionalEmails.map((email, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {email}
                                                <button
                                                    onClick={() => removeEmail(index)}
                                                    className="hover:text-blue-900 font-bold"
                                                    title="Remover email"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowTaskEmailModal(false);
                                        setTaskForTaskEmail(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={confirmSendTaskEmail}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    {taskForTaskEmail.taskEmailSent ? 'Reenviar' : 'Enviar Email'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmação de exclusão individual */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setTaskToDelete(null);
                }}
                onConfirm={confirmDelete}
                itemName={taskToDelete?.title}
                description={taskToDelete?.subTasks && taskToDelete.subTasks.length > 0 
                    ? `Esta tarefa possui ${taskToDelete.subTasks.length} subtarefa(s) que também serão excluídas.`
                    : undefined}
                isDeleting={isDeletingSingle}
            />
        </div>
    );
};

export default TaskList;
