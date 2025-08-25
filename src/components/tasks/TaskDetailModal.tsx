import React from 'react';
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
    Link
} from 'lucide-react';

interface Subtask {
    id: number;
    title?: string;
    description: string;
    completed: boolean;
    status?: string;
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
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedHours?: number;
    actualHours?: number;
    requesterName?: string;
    projectName?: string;
    projects?: Project[];
    link?: string;
    meetingLink?: string;
    notes?: string;
    subtasks?: Subtask[];
    createdAt?: string;
    updatedAt?: string;
}

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
    if (!isOpen || !task) return null;

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'bg-red-100 text-red-800';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800';
            case 'LOW':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'Concluída';
            case 'IN_PROGRESS':
                return 'Em Progresso';
            case 'PENDING':
                return 'Pendente';
            case 'CANCELLED':
                return 'Cancelada';
            default:
                return status;
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'Alta';
            case 'MEDIUM':
                return 'Média';
            case 'LOW':
                return 'Baixa';
            default:
                return priority;
        }
    };

    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const completionPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
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
                        <div className="border-b border-gray-100 px-6 py-4">
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
                    <div className="px-6 py-6 space-y-6">
                        {/* Task Name and Description */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Informações da Tarefa
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
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
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Status:</span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                            {task.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {task.status === 'IN_PROGRESS' && <Activity className="w-3 h-3 mr-1" />}
                                            {task.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                            {task.status === 'CANCELLED' && <X className="w-3 h-3 mr-1" />}
                                            {getStatusLabel(task.status)}
                                        </span>
                                    </div>

                                    {task.priority && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Prioridade:</span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                {getPriorityLabel(task.priority)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nome da Tarefa</p>
                                    <p className="text-base font-medium text-gray-900">{task.name}</p>
                                </div>
                                
                                {task.description && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Descrição</p>
                                        <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                                    </div>
                                )}

                                {task.notes && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                            <StickyNote className="w-3 h-3" />
                                            Notas
                                        </p>
                                        <p className="text-gray-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                                            {task.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Links */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {task.link && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                                <Link className="w-3 h-3" />
                                                Link da Tarefa
                                            </p>
                                            <a
                                                href={task.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Abrir Link
                                            </a>
                                        </div>
                                    )}
                                    
                                    {task.meetingLink && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                                <Video className="w-3 h-3" />
                                                Link da Reunião
                                            </p>
                                            <a
                                                href={task.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <Video className="w-4 h-4" />
                                                Entrar na Reunião
                                            </a>
                                        </div>
                                    )}
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

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {task.subtasks.map((subtask) => (
                                            <div 
                                                key={subtask.id}
                                                className={`p-4 bg-white rounded-lg border ${
                                                    subtask.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {subtask.completed ? (
                                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        {subtask.title && (
                                                            <p className={`text-sm font-medium mb-1 ${
                                                                subtask.completed ? 'text-green-700 line-through' : 'text-gray-900'
                                                            }`}>
                                                                {subtask.title}
                                                            </p>
                                                        )}
                                                        {subtask.description && (
                                                            <p className={`text-sm ${
                                                                subtask.completed ? 'text-green-600 line-through' : 'text-gray-700'
                                                            }`}>
                                                                {subtask.description}
                                                            </p>
                                                        )}
                                                        {subtask.status && (
                                                            <div className="mt-2">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                                                                    {getStatusLabel(subtask.status)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {subtask.createdAt && (
                                                            <p className="text-xs text-gray-400 mt-2">
                                                                Criada em {formatDate(subtask.createdAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Última Atualização</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(task.updatedAt)}
                                        </p>
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