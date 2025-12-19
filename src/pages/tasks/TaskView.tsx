import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
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
    FileDown,
    Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AttachmentList from '@/components/ui/AttachmentList';

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
            case 'URGENT': return 'bg-red-100 text-red-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'LOW': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
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
        return 'bg-blue-100 text-blue-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Carregando tarefa...</p>
                </Card>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Tarefa nao encontrada
                    </h2>
                    <p className="text-gray-600 mb-6">
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
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const totalSubtasks = subtasks.length;
    const completionPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
    const taskName = task.title || task.name || '';

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full lg:w-[80%] mx-auto space-y-6">
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
                </div>

                {/* Card do Cabecalho */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-bold text-white">Tarefa #{task.id}</h1>
                                        {task.code && (
                                            <span className="text-sm font-mono bg-white/20 px-2 py-1 rounded text-white">
                                                {task.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-blue-100">{task.requesterName || 'Sem solicitante'}</p>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="text-right">
                                    <p className="text-blue-100 text-sm">Valor Total</p>
                                    <p className="text-2xl font-bold text-white">
                                        {formatCurrency(calculateTaskTotal())}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Badges de Status */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-wrap gap-3">
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
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {getEnvironmentLabel(task.environment)}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Nome da Tarefa */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Nome da Tarefa
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-900 text-lg whitespace-pre-wrap break-words">
                            {taskName}
                        </p>
                    </div>
                </Card>

                {/* Descricao */}
                {task.description && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Descricao
                        </h2>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            Informacoes Adicionais
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {task.systemModule && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Modulo do Sistema</p>
                                    <p className="text-gray-900 font-medium">{task.systemModule}</p>
                                </div>
                            )}
                            {task.serverOrigin && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Servidor</p>
                                    <p className="text-gray-900 font-medium">{task.serverOrigin}</p>
                                </div>
                            )}
                            {task.link && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                        <Link className="w-3 h-3" />
                                        Link da Tarefa
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={task.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline break-all flex-1"
                                        >
                                            {task.link}
                                        </a>
                                        <button
                                            onClick={() => handleCopy(task.link!, 'taskLink')}
                                            className={`p-1.5 rounded transition-all ${
                                                copiedField === 'taskLink'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                            }`}
                                            title="Copiar link"
                                        >
                                            {copiedField === 'taskLink' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {task.meetingLink && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                        <Video className="w-3 h-3" />
                                        Link da Gravacao
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={task.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline break-all flex-1"
                                        >
                                            {task.meetingLink}
                                        </a>
                                        <button
                                            onClick={() => handleCopy(task.meetingLink!, 'meetingLink')}
                                            className={`p-1.5 rounded transition-all ${
                                                copiedField === 'meetingLink'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
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
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                            Projetos Associados
                            <span className="text-sm font-normal text-gray-500">({task.projects.length})</span>
                        </h2>
                        <div className="grid gap-3">
                            {task.projects.map((project) => (
                                <div key={project.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{project.name}</p>
                                        {project.repositoryUrl && (
                                            <a
                                                href={project.repositoryUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline"
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
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-blue-600" />
                            Subtarefas
                            <span className="text-sm font-normal text-gray-500">
                                ({completedSubtasks} de {totalSubtasks} concluidas)
                            </span>
                        </h2>

                        {/* Barra de progresso */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Progresso</span>
                                <span>{Math.round(completionPercentage)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {subtasks.map((subtask, index) => (
                                <div key={subtask.id} className="relative">
                                    <div
                                        className={`p-4 rounded-lg border ${
                                            subtask.completed
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Numero e Checkbox */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-sm font-medium text-gray-500 w-6">
                                                    {index + 1}.
                                                </span>
                                                {subtask.completed ? (
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                                                )}
                                            </div>

                                            {/* Conteudo */}
                                            <div className="flex-1 min-w-0">
                                                {subtask.title && (
                                                    <p className={`font-medium mb-2 ${
                                                        subtask.completed ? 'text-green-700 line-through' : 'text-gray-900'
                                                    }`}>
                                                        {subtask.title}
                                                    </p>
                                                )}
                                                {subtask.description && (
                                                    <div
                                                        className={`prose prose-sm max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg ${
                                                            subtask.completed ? 'text-green-600' : 'text-gray-700'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: subtask.description }}
                                                    />
                                                )}
                                                {subtask.createdAt && (
                                                    <p className="text-xs text-gray-400 mt-3">
                                                        Criada em {formatDate(subtask.createdAt)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Valor */}
                                            {isAdmin && subtask.amount !== undefined && subtask.amount > 0 && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                    <span className="font-bold text-green-600">
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

                {/* Anexos */}
                <Card className="overflow-hidden">
                    <div
                        className="cursor-pointer px-6 py-4 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsAttachmentSectionExpanded(!isAttachmentSectionExpanded)}
                    >
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

                    {isAttachmentSectionExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                            <AttachmentList
                                taskId={task.id}
                                forceExpanded={true}
                                readOnly={true}
                            />
                        </div>
                    )}
                </Card>

                {/* Informacoes de Registro */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Informacoes de Registro
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Data de Criacao</p>
                            <p className="font-medium text-gray-900">{formatDate(task.createdAt)}</p>
                            {task.createdByUserName && (
                                <p className="text-sm text-gray-600 mt-1">por {task.createdByUserName}</p>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Ultima Atualizacao</p>
                            <p className="font-medium text-gray-900">{formatDate(task.updatedAt)}</p>
                            {task.updatedByUserName && (
                                <p className="text-sm text-gray-600 mt-1">por {task.updatedByUserName}</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TaskView;
