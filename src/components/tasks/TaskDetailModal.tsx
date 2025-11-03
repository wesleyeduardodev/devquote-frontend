import React, { useState } from 'react';
import { 
    X, 
    User, 
    FileText, 
    Calendar, 
    Clock, 
    CheckCircle2,
    AlertCircle,
    ListChecks,
    Hash,
    Briefcase,
    Target,
    Activity,
    ExternalLink,
    Video,
    StickyNote,
    FolderOpen,
    Link,
    DollarSign,
    Copy,
    Check,
    Paperclip,
    ChevronDown,
    ChevronUp,
    Download
} from 'lucide-react';

import AttachmentList from '../ui/AttachmentList';

interface Subtask {
    id: number;
    title?: string;
    description: string;
    completed: boolean;
    amount?: number;
    createdAt?: string;
}

interface Project {
    id: number;
    name: string;
    repositoryUrl?: string;
}

interface Task {
    id: number;
    name: string;
    code?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    taskType?: string;
    flowType?: 'DESENVOLVIMENTO' | 'OPERACIONAL';
    serverOrigin?: string;
    systemModule?: string;
    estimatedHours?: number;
    actualHours?: number;
    requesterName?: string;
    projectName?: string;
    projects?: Project[];
    link?: string;
    meetingLink?: string;
    subtasks?: Subtask[];
    totalAmount?: number;
    createdAt?: string;
    updatedAt?: string;
    createdByUserId?: number;
    createdByUserName?: string;
    updatedByUserId?: number;
    updatedByUserName?: string;
}

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    canViewValues?: boolean;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, canViewValues = false }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isAttachmentSectionExpanded, setIsAttachmentSectionExpanded] = useState(false);

    if (!isOpen || !task) return null;

    // Estilo customizado para scrollbar
    const scrollbarStyle: React.CSSProperties = {
        scrollbarWidth: 'thin' as const,
        scrollbarColor: '#9ca3af #e5e7eb',
    };

    // Estilo para campos redimensionáveis
    const resizableStyle: React.CSSProperties = {
        scrollbarWidth: 'thin' as const,
        scrollbarColor: '#9ca3af #e5e7eb',
        resize: 'vertical' as const,
        overflow: 'auto',
    };

    const handleCopy = async (content: string, fieldName: string) => {
        if (!content || content === '-') return;
        
        try {
            await navigator.clipboard.writeText(content);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
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
            minute: '2-digit'
        });
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Calcula o total das subtarefas se não estiver disponível
    const calculateTaskTotal = () => {
        if (task.totalAmount !== undefined) {
            return task.totalAmount;
        }
        return task.subtasks?.reduce((total, subtask) => total + (subtask.amount || 0), 0) || 0;
    };


    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'bg-red-100 text-red-800';
            case 'HIGH':
                return 'bg-orange-100 text-orange-800';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800';
            case 'LOW':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'URGENT': return '🔴 Urgente';
            case 'HIGH': return '🟠 Alta';
            case 'MEDIUM': return '🟡 Média';
            case 'LOW': return '🟢 Baixa';
            default: return 'Não definida';
        }
    };

    const getTaskTypeLabel = (taskType?: string) => {
        if (!taskType) return 'Não informado';
        switch (taskType) {
            case 'BUG': return '🐛 Bug';
            case 'ENHANCEMENT': return '📨 Melhoria';
            case 'NEW_FEATURE': return '✨ Nova Funcionalidade';
            default: return taskType;
        }
    };



    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const completionPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Detalhes da Tarefa</h2>
                                <p className="text-blue-100 text-sm">ID #{task.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Solicitante Section */}
                    {task.requesterName && (
                        <div className="border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Solicitante</p>
                                    <p className="text-lg font-semibold text-gray-900">{task.requesterName}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Details Section */}
                    <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {/* Task Name and Description */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Informações da Tarefa
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-4 space-y-3 sm:space-y-4">
                                {/* Código e Status */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {task.code && (
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Código</p>
                                                <span className="text-sm font-mono text-gray-900 bg-gray-200 px-2 py-1 rounded">
                                                    {task.code}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    

                                    {task.priority && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Prioridade:</span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                {getPriorityLabel(task.priority)}
                                            </span>
                                        </div>
                                    )}

                                    {task.flowType && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Fluxo:</span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                task.flowType === 'OPERACIONAL'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {task.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                                            </span>
                                        </div>
                                    )}

                                    {task.taskType && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Tipo:</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {getTaskTypeLabel(task.taskType)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs sm:text-sm text-gray-500">Nome da Tarefa</p>
                                        {canViewValues && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                <span className="text-sm sm:text-lg font-bold text-green-600">
                                                    {formatCurrency(calculateTaskTotal())}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 sm:p-4 border border-gray-200">
                                        <div className="max-h-20 overflow-y-auto">
                                            <p className="text-sm sm:text-base font-medium text-gray-900 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{task.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {task.description && (
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Descrição</p>
                                        <div
                                            className="bg-white rounded-lg p-2.5 sm:p-4 min-h-[100px] max-h-[40vh] border border-gray-200"
                                            style={resizableStyle}
                                        >
                                            <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{task.description}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Novos campos */}
                                {(task.systemModule || task.serverOrigin) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {task.systemModule && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                                    📁 Módulo do Sistema
                                                </p>
                                                <p className="text-gray-700 bg-gray-100 px-3 py-2 rounded">{task.systemModule}</p>
                                            </div>
                                        )}
                                        {task.serverOrigin && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                                    🖥️ Servidor de Origem
                                                </p>
                                                <p className="text-gray-700 bg-gray-100 px-3 py-2 rounded">{task.serverOrigin}</p>
                                            </div>
                                        )}
                                    </div>
                                )}


                                {/* Links */}
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                            <Link className="w-3 h-3" />
                                            Link da Tarefa
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                {task.link ? (
                                                    <a
                                                        href={task.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                                                    >
                                                        {task.link}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </div>
                                            {task.link && (
                                                <button
                                                    onClick={() => handleCopy(task.link!, 'taskLink')}
                                                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                        copiedField === 'taskLink'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                    title="Copiar link da tarefa"
                                                >
                                                    {copiedField === 'taskLink' ? (
                                                        <Check className="w-3 h-3" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                            <Video className="w-3 h-3" />
                                            Link da Gravação
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                {task.meetingLink ? (
                                                    <a
                                                        href={task.meetingLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                                                    >
                                                        {task.meetingLink}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </div>
                                            {task.meetingLink && (
                                                <button
                                                    onClick={() => handleCopy(task.meetingLink!, 'meetingLink')}
                                                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                        copiedField === 'meetingLink'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                    title="Copiar link da gravação"
                                                >
                                                    {copiedField === 'meetingLink' ? (
                                                        <Check className="w-3 h-3" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Project and Hours */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {task.projectName && (
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Projeto</p>
                                                <p className="text-sm font-medium text-gray-900">{task.projectName}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {(task.estimatedHours || task.actualHours) && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Horas</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {task.actualHours || 0}h / {task.estimatedHours || 0}h estimadas
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Projects Section */}
                        {task.projects && task.projects.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FolderOpen className="w-5 h-5 text-blue-600" />
                                    Projetos Associados
                                    <span className="text-sm font-normal text-gray-500">
                                        ({task.projects.length})
                                    </span>
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid gap-3">
                                        {task.projects.map((project) => (
                                            <div key={project.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                                <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                                    {project.repositoryUrl && (
                                                        <p className="text-xs text-gray-500 mt-1">{project.repositoryUrl}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subtasks Section */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <ListChecks className="w-5 h-5 text-blue-600" />
                                    Subtarefas
                                    <span className="text-sm font-normal text-gray-500">
                                        ({completedSubtasks} de {totalSubtasks} concluídas)
                                    </span>
                                </h3>
                                
                                {/* Progress bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                        <span>Progresso</span>
                                        <span>{Math.round(completionPercentage)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${completionPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
                                    <div
                                        className="space-y-2 sm:space-y-3 max-h-[50vh] overflow-y-auto"
                                        style={scrollbarStyle}
                                    >
                                        {task.subtasks.map((subtask) => (
                                            <div key={subtask.id}>
                                                {/* Card da Subtarefa */}
                                                <div
                                                    className={`p-2.5 sm:p-4 bg-white rounded-lg border ${
                                                        subtask.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        {/* Checkbox */}
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            {subtask.completed ? (
                                                                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 rounded-full" />
                                                            )}
                                                        </div>

                                                        {/* Conteúdo - Título e Descrição */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Título */}
                                                            {subtask.title && (
                                                                <div
                                                                    className="bg-gray-50 rounded p-2 mb-2 min-h-[50px] sm:min-h-[60px] max-h-[15vh]"
                                                                    style={resizableStyle}
                                                                >
                                                                    <p className={`text-xs sm:text-sm font-medium whitespace-pre-wrap break-words ${
                                                                        subtask.completed ? 'text-green-700 line-through' : 'text-gray-900'
                                                                    }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                                        {subtask.title}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Descrição */}
                                                            {subtask.description && (
                                                                <div
                                                                    className="bg-gray-50 rounded p-2 min-h-[70px] sm:min-h-[80px] max-h-[20vh]"
                                                                    style={resizableStyle}
                                                                >
                                                                    <p className={`text-xs sm:text-sm whitespace-pre-wrap break-words ${
                                                                        subtask.completed ? 'text-green-600 line-through' : 'text-gray-700'
                                                                    }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                                        {subtask.description}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Data de Criação */}
                                                            {subtask.createdAt && (
                                                                <p className="text-xs text-gray-400 mt-2">
                                                                    Criada em {formatDate(subtask.createdAt)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Valor ABAIXO do card (só para ADMIN) */}
                                                {canViewValues && subtask.amount !== undefined && (
                                                    <div className="flex items-center justify-end gap-1 mt-1 px-2 sm:px-0">
                                                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                        <span className="text-sm sm:text-base font-bold text-green-600">
                                                            {formatCurrency(subtask.amount)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Attachments Section */}
                        <div>
                            {/* Cabeçalho clicável da seção de anexos */}
                            <div 
                                className="cursor-pointer border border-gray-200 rounded-lg"
                                onClick={() => setIsAttachmentSectionExpanded(!isAttachmentSectionExpanded)}
                            >
                                <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="w-5 h-5 text-gray-500" />
                                            <span className="text-lg font-semibold text-gray-900">Anexos</span>
                                            <span className="text-sm text-gray-500">(clique para visualizar)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">
                                                {isAttachmentSectionExpanded ? 'Recolher' : 'Expandir'}
                                            </span>
                                            {isAttachmentSectionExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo da seção quando expandida */}
                            {isAttachmentSectionExpanded && (
                                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Arquivos anexados à esta tarefa
                                    </p>
                                    
                                    <AttachmentList 
                                        taskId={task.id}
                                        forceExpanded={true}
                                        readOnly={true}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Timestamps Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Informações de Registro
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Data de Criação</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(task.createdAt)}
                                        </p>
                                        {task.createdByUserName && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                por {task.createdByUserName}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Última Atualização</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(task.updatedAt)}
                                        </p>
                                        {task.updatedByUserName && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                por {task.updatedByUserName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;