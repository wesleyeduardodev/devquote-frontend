import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Calendar,
    AlertCircle,
    ListChecks,
    Briefcase,
    Target,
    Video,
    FolderOpen,
    Link,
    DollarSign,
    Copy,
    Check,
    Paperclip,
    ChevronDown,
    ChevronUp,
    Edit3,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AttachmentList from '@/components/ui/AttachmentList';
import SubTaskAttachmentList from '@/components/ui/SubTaskAttachmentList';

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
    title: string;
    name?: string;
    code?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    taskType?: string;
    flowType?: 'DESENVOLVIMENTO' | 'OPERACIONAL';
    environment?: 'DESENVOLVIMENTO' | 'HOMOLOGACAO' | 'PRODUCAO';
    serverOrigin?: string;
    systemModule?: string;
    estimatedHours?: number;
    actualHours?: number;
    requesterName?: string;
    requesterId?: number;
    projectName?: string;
    projects?: Project[];
    link?: string;
    meetingLink?: string;
    subtasks?: Subtask[];
    subTasks?: Subtask[];
    totalAmount?: number;
    amount?: number;
    createdAt?: string;
    updatedAt?: string;
    createdByUserId?: number;
    createdByUserName?: string;
    updatedByUserId?: number;
    updatedByUserName?: string;
}

const TaskView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isAttachmentSectionExpanded, setIsAttachmentSectionExpanded] = useState(false);
    const [taskAttachmentCount, setTaskAttachmentCount] = useState(0);
    const [subTaskAttachmentCounts, setSubTaskAttachmentCounts] = useState<Record<number, number>>({});
    const [expandedSubTaskAttachments, setExpandedSubTaskAttachments] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchTask = async () => {
            if (!id) {
                navigate('/tasks');
                return;
            }

            try {
                setLoading(true);
                const data = await taskService.getById(Number(id));
                setTask(data);
            } catch (error) {
                console.error('Erro ao carregar tarefa:', error);
                navigate('/tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id, navigate]);

    const handleCopy = async (content: string, fieldName: string) => {
        if (!content || content === '-') return;

        try {
            await navigator.clipboard.writeText(content);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
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

    const calculateTaskTotal = () => {
        if (!task) return 0;
        if (task.totalAmount !== undefined) return task.totalAmount;
        if (task.amount !== undefined) return task.amount;
        const subtasks = task.subtasks || task.subTasks || [];
        return subtasks.reduce((total, subtask) => total + (subtask.amount || 0), 0);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-danger-soft text-[var(--danger-strong)]';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'MEDIUM': return 'bg-warning-soft text-[var(--warning-strong)]';
            case 'LOW': return 'bg-success-soft text-[var(--success-strong)]';
            default: return 'bg-surface-2 text-text-primary';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'Urgente';
            case 'HIGH': return 'Alta';
            case 'MEDIUM': return 'Media';
            case 'LOW': return 'Baixa';
            default: return 'Nao definida';
        }
    };

    const getTaskTypeLabel = (taskType?: string) => {
        if (!taskType) return 'Nao informado';
        switch (taskType) {
            case 'BUG': return 'Bug';
            case 'ENHANCEMENT': return 'Melhoria';
            case 'NEW_FEATURE': return 'Nova Funcionalidade';
            case 'BACKUP': return 'Backup';
            case 'DEPLOY': return 'Deploy';
            case 'LOGS': return 'Logs';
            case 'DATABASE_APPLICATION': return 'Aplicacao de Banco';
            case 'NOVO_SERVIDOR': return 'Novo Servidor';
            case 'MONITORING': return 'Monitoramento';
            case 'SUPPORT': return 'Suporte';
            case 'CODE_REVIEW': return 'Code Review'
            default: return taskType;
        }
    };

    const getEnvironmentLabel = (environment?: string) => {
        if (!environment) return null;
        switch (environment) {
            case 'DESENVOLVIMENTO': return 'Desenvolvimento';
            case 'HOMOLOGACAO': return 'Homologacao';
            case 'PRODUCAO': return 'Producao';
            default: return environment;
        }
    };

    const getFlowTypeStyle = (flowType?: string) => {
        if (flowType === 'OPERACIONAL') {
            return 'bg-purple-100 text-purple-800';
        }
        return 'bg-accent-soft text-accent';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-app flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-text-secondary">Carregando tarefa...</p>
                </Card>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-surface-app flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-[var(--danger-strong)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2">
                        Tarefa nao encontrada
                    </h2>
                    <p className="text-text-secondary mb-6">
                        A tarefa que voce esta procurando nao foi encontrada.
                    </p>
                    <Button onClick={() => navigate('/tasks')} variant="primary" className="w-full">
                        Voltar para Listagem
                    </Button>
                </Card>
            </div>
        );
    }

    const subtasks = task.subtasks || task.subTasks || [];
    const totalSubtasks = subtasks.length;
    const taskName = task.title || task.name || '';

    return (
        <div className="min-h-screen bg-surface-app py-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full mx-auto space-y-6">
                {/* Header com acoes */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/tasks')}
                        className="flex items-center w-fit"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>

                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tasks/${task.id}/edit`)}
                                className="flex items-center"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Card do Cabecalho */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 sm:py-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-1/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white">Tarefa #{task.id}</h1>
                                    {task.code && (
                                        <span className="inline-block text-xs sm:text-sm font-mono bg-surface-1/20 px-2 py-1 rounded text-white mt-1">
                                            {task.code}
                                        </span>
                                    )}
                                    <p className="text-blue-100 text-sm sm:text-base mt-1">{task.requesterName || 'Sem solicitante'}</p>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="text-left sm:text-right bg-surface-1/10 sm:bg-transparent rounded-lg p-3 sm:p-0">
                                    <p className="text-blue-100 text-xs sm:text-sm">Valor Total</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">
                                        {formatCurrency(calculateTaskTotal())}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badges de Status */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-surface-app border-b border-border-subtle">
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {task.priority && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {getPriorityLabel(task.priority)}
                                </span>
                            )}
                            {task.flowType && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFlowTypeStyle(task.flowType)}`}>
                                    {task.flowType === 'OPERACIONAL' ? 'Operacional' : 'Desenvolvimento'}
                                </span>
                            )}
                            {task.taskType && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                    {getTaskTypeLabel(task.taskType)}
                                </span>
                            )}
                            {task.environment && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-soft text-[var(--success-strong)]">
                                    {getEnvironmentLabel(task.environment)}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Nome da Tarefa */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent" />
                        Nome da Tarefa
                    </h2>
                    <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                        <p className="text-text-primary text-lg whitespace-pre-wrap break-words">
                            {taskName}
                        </p>
                    </div>
                </Card>

                {/* Descricao */}
                {task.description && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-accent" />
                            Descricao
                        </h2>
                        <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                            <div
                                className="prose prose-sm max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg"
                                dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                        </div>
                    </Card>
                )}

                {/* Informacoes Adicionais */}
                {(task.systemModule || task.serverOrigin || task.link || task.meetingLink) && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-accent" />
                            Informacoes Adicionais
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {task.systemModule && (
                                <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                                    <p className="text-sm text-text-tertiary mb-1">Modulo do Sistema</p>
                                    <p className="text-text-primary font-medium">{task.systemModule}</p>
                                </div>
                            )}
                            {task.serverOrigin && (
                                <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                                    <p className="text-sm text-text-tertiary mb-1">Servidor</p>
                                    <p className="text-text-primary font-medium">{task.serverOrigin}</p>
                                </div>
                            )}
                            {task.link && (
                                <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                                    <p className="text-sm text-text-tertiary mb-1 flex items-center gap-1">
                                        <Link className="w-3 h-3" />
                                        Link da Tarefa
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={task.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:text-accent underline break-all flex-1"
                                        >
                                            {task.link}
                                        </a>
                                        <button
                                            onClick={() => handleCopy(task.link!, 'taskLink')}
                                            className={`p-1.5 rounded transition-all ${
                                                copiedField === 'taskLink'
                                                    ? 'bg-success-soft text-[var(--success-strong)]'
                                                    : 'bg-surface-3 text-text-tertiary hover:bg-gray-300'
                                            }`}
                                            title="Copiar link"
                                        >
                                            {copiedField === 'taskLink' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {task.meetingLink && (
                                <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                                    <p className="text-sm text-text-tertiary mb-1 flex items-center gap-1">
                                        <Video className="w-3 h-3" />
                                        Link da Gravacao
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={task.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:text-accent underline break-all flex-1"
                                        >
                                            {task.meetingLink}
                                        </a>
                                        <button
                                            onClick={() => handleCopy(task.meetingLink!, 'meetingLink')}
                                            className={`p-1.5 rounded transition-all ${
                                                copiedField === 'meetingLink'
                                                    ? 'bg-success-soft text-[var(--success-strong)]'
                                                    : 'bg-surface-3 text-text-tertiary hover:bg-gray-300'
                                            }`}
                                            title="Copiar link"
                                        >
                                            {copiedField === 'meetingLink' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Projetos Associados */}
                {task.projects && task.projects.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-accent" />
                            Projetos Associados
                            <span className="text-sm font-normal text-text-tertiary">({task.projects.length})</span>
                        </h2>
                        <div className="grid gap-3">
                            {task.projects.map((project) => (
                                <div key={project.id} className="flex items-center gap-3 p-4 bg-surface-app rounded-lg border border-border-subtle">
                                    <FolderOpen className="w-5 h-5 text-accent flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-text-primary">{project.name}</p>
                                        {project.repositoryUrl && (
                                            <a
                                                href={project.repositoryUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-accent hover:underline"
                                            >
                                                {project.repositoryUrl}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Subtarefas */}
                {subtasks.length > 0 && (
                    <Card className="p-3 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-accent" />
                            Subtarefas
                            <span className="text-sm font-normal text-text-tertiary">
                                ({totalSubtasks})
                            </span>
                        </h2>

                        <div className="space-y-3 sm:space-y-4">
                            {subtasks.map((subtask) => (
                                <div key={subtask.id} className="relative">
                                    <div
                                        className={`p-3 sm:p-4 rounded-lg border ${
                                            subtask.completed
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-border-subtle bg-surface-1'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                {subtask.title && (
                                                    <p className={`font-medium mb-1 sm:mb-2 text-sm sm:text-base ${
                                                        subtask.completed ? 'text-green-700 line-through' : 'text-text-primary'
                                                    }`}>
                                                        {subtask.title}
                                                    </p>
                                                )}
                                                {subtask.description && (
                                                    <div
                                                        className={`prose prose-sm max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg ${
                                                            subtask.completed ? 'text-[var(--success-strong)]' : 'text-text-secondary'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: subtask.description }}
                                                    />
                                                )}
                                                {subtask.createdAt && (
                                                    <p className="text-xs text-text-tertiary mt-2 sm:mt-3">
                                                        Criada em {formatDate(subtask.createdAt)}
                                                    </p>
                                                )}

                                                {/* Anexos da SubTask */}
                                                <div className="mt-3 pt-3 border-t border-border-subtle">
                                                    <div
                                                        className="cursor-pointer flex items-center justify-between py-2 hover:bg-surface-2 rounded px-2 -mx-2"
                                                        onClick={() => setExpandedSubTaskAttachments(prev => ({
                                                            ...prev,
                                                            [subtask.id]: !prev[subtask.id]
                                                        }))}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Paperclip className="w-4 h-4 text-text-tertiary" />
                                                            <span className="text-sm text-text-secondary">Anexos</span>
                                                            {subTaskAttachmentCounts[subtask.id] > 0 && (
                                                                <span className="text-xs font-medium text-accent">
                                                                    ({subTaskAttachmentCounts[subtask.id]})
                                                                </span>
                                                            )}
                                                        </div>
                                                        {expandedSubTaskAttachments[subtask.id] ? (
                                                            <ChevronUp className="w-4 h-4 text-text-tertiary" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-text-tertiary" />
                                                        )}
                                                    </div>

                                                    {/* Componente oculto para carregar contagem */}
                                                    {!expandedSubTaskAttachments[subtask.id] && (
                                                        <div className="hidden">
                                                            <SubTaskAttachmentList
                                                                subTaskId={subtask.id}
                                                                onCountChange={(count) => setSubTaskAttachmentCounts(prev => ({
                                                                    ...prev,
                                                                    [subtask.id]: count
                                                                }))}
                                                            />
                                                        </div>
                                                    )}

                                                    {expandedSubTaskAttachments[subtask.id] && (
                                                        <div className="mt-2">
                                                            <SubTaskAttachmentList
                                                                subTaskId={subtask.id}
                                                                forceExpanded={true}
                                                                readOnly={true}
                                                                onCountChange={(count) => setSubTaskAttachmentCounts(prev => ({
                                                                    ...prev,
                                                                    [subtask.id]: count
                                                                }))}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isAdmin && subtask.amount !== undefined && subtask.amount > 0 && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <DollarSign className="w-4 h-4 text-[var(--success-strong)]" />
                                                    <span className="font-bold text-[var(--success-strong)]">
                                                        {formatCurrency(subtask.amount)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Anexos da Task */}
                <Card className="overflow-hidden">
                    <div
                        className="cursor-pointer px-6 py-4 hover:bg-surface-app transition-colors"
                        onClick={() => setIsAttachmentSectionExpanded(!isAttachmentSectionExpanded)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Paperclip className="w-5 h-5 text-text-tertiary" />
                                <span className="text-lg font-semibold text-text-primary">Anexos da Tarefa</span>
                                {taskAttachmentCount > 0 && (
                                    <span className="text-sm font-medium text-accent">({taskAttachmentCount})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-tertiary">
                                    {isAttachmentSectionExpanded ? 'Recolher' : 'Expandir'}
                                </span>
                                {isAttachmentSectionExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-text-tertiary" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Componente oculto para carregar contagem */}
                    {!isAttachmentSectionExpanded && (
                        <div className="hidden">
                            <AttachmentList
                                taskId={task.id}
                                onCountChange={setTaskAttachmentCount}
                            />
                        </div>
                    )}

                    {isAttachmentSectionExpanded && (
                        <div className="px-6 pb-6 border-t border-border-subtle pt-4">
                            <AttachmentList
                                taskId={task.id}
                                forceExpanded={true}
                                readOnly={true}
                                onCountChange={setTaskAttachmentCount}
                            />
                        </div>
                    )}
                </Card>

                {/* Informacoes de Registro */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" />
                        Informacoes de Registro
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                            <p className="text-sm text-text-tertiary mb-1">Data de Criacao</p>
                            <p className="font-medium text-text-primary">{formatDate(task.createdAt)}</p>
                            {task.createdByUserName && (
                                <p className="text-sm text-text-secondary mt-1">por {task.createdByUserName}</p>
                            )}
                        </div>
                        <div className="bg-surface-app rounded-lg p-4 border border-border-subtle">
                            <p className="text-sm text-text-tertiary mb-1">Ultima Atualizacao</p>
                            <p className="font-medium text-text-primary">{formatDate(task.updatedAt)}</p>
                            {task.updatedByUserName && (
                                <p className="text-sm text-text-secondary mt-1">por {task.updatedByUserName}</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TaskView;
