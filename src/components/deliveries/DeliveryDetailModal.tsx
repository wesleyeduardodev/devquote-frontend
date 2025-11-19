import React, { useState } from 'react';
import {
    X,
    User,
    FileText,
    Calendar,
    Clock,
    CheckCircle2,
    Activity,
    Target,
    ExternalLink,
    Package,
    Hash,
    StickyNote,
    GitBranch,
    GitMerge,
    Play,
    Flag,
    Database,
    Code,
    Copy,
    Check
} from 'lucide-react';

interface Delivery {
    id: number;
    name: string;
    description?: string;
    status: 'PENDING' | 'DEVELOPMENT' | 'DELIVERED' | 'HOMOLOGATION' | 'APPROVED' | 'REJECTED' | 'PRODUCTION';
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    notes?: string;
    deliveryNotes?: string;
    startedAt?: string;
    finishedAt?: string;

    taskId?: number;
    taskName?: string;
    taskCode?: string;
    taskType?: string;
    environment?: string;

    flowType?: string;

    projectId?: number;
    projectName?: string;
    projectRepository?: string;
    requesterName?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface DeliveryDetailModalProps {
    delivery: Delivery | null;
    isOpen: boolean;
    onClose: () => void;
}

const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({ delivery, isOpen, onClose }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!isOpen || !delivery) return null;

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

    const formatDateOnly = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'DEVELOPMENT':
                return 'bg-blue-100 text-blue-800';
            case 'DELIVERED':
                return 'bg-green-100 text-green-800';
            case 'HOMOLOGATION':
                return 'bg-purple-100 text-purple-800';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'PRODUCTION':
                return 'bg-teal-100 text-teal-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'Pendente';
            case 'DEVELOPMENT':
                return 'Desenvolvimento';
            case 'DELIVERED':
                return 'Entregue';
            case 'HOMOLOGATION':
                return 'Homologação';
            case 'APPROVED':
                return 'Aprovado';
            case 'REJECTED':
                return 'Rejeitado';
            case 'PRODUCTION':
                return 'Produção';
            default:
                return status;
        }
    };

    const getFlowTypeLabel = (flowType?: string) => {
        if (!flowType) return '-';
        switch (flowType) {
            case 'DESENVOLVIMENTO':
                return 'Desenvolvimento';
            case 'OPERACIONAL':
                return 'Operacional';
            default:
                return flowType;
        }
    };

    const getTaskTypeLabel = (taskType?: string) => {
        if (!taskType) return '-';
        switch (taskType) {

            case 'BACKUP': return 'Backup';
            case 'DEPLOY': return 'Deploy';
            case 'LOGS': return 'Logs';
            case 'DATABASE_APPLICATION': return 'Aplicação de Banco';
            case 'NEW_SERVER': return 'Novo Servidor';
            case 'MONITORING': return 'Monitoramento';
            case 'SUPPORT': return 'Suporte';

            case 'BUG': return 'Bug';
            case 'ENHANCEMENT': return 'Melhoria';
            case 'NEW_FEATURE': return 'Nova Funcionalidade';
            default: return taskType;
        }
    };

    const getEnvironmentLabel = (environment?: string) => {
        if (!environment) return '-';
        switch (environment) {
            case 'DESENVOLVIMENTO': return '🔧 Desenvolvimento';
            case 'HOMOLOGACAO': return '🧪 Homologação';
            case 'PRODUCAO': return '🚀 Produção';
            default: return environment;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white truncate">
                                    {delivery.taskName ? delivery.taskName : 'Detalhes da Entrega'}
                                </h2>
                                <p className="text-blue-100 text-sm truncate">
                                    {delivery.taskCode && `${delivery.taskCode} • `}ID #{delivery.id}
                                </p>
                            </div>
                        </div>
                        <div className="w-10 flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="w-full h-10 text-white/80 hover:text-white hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Solicitante Section */}
                    {delivery.requesterName && (
                        <div className="border-b border-gray-100 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Solicitante</p>
                                    <p className="text-lg font-semibold text-gray-900">{delivery.requesterName}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Details Section */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Tarefa */}
                        {(delivery.taskId || delivery.taskName) && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Tarefa
                                </h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                    {delivery.taskCode && (
                                        <div>
                                            <span className="text-sm font-medium text-blue-900">Código:</span>
                                            <span className="text-sm text-blue-800 ml-2">{delivery.taskCode}</span>
                                        </div>
                                    )}
                                    {delivery.taskName && (
                                        <div>
                                            <span className="text-sm font-medium text-blue-900">Nome:</span>
                                            <span className="text-sm text-blue-800 ml-2">{delivery.taskName}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-medium text-blue-900">Fluxo:</span>
                                        <span className="text-sm text-blue-800 ml-2">{getFlowTypeLabel(delivery.flowType)}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-blue-900">Tipo:</span>
                                        <span className="text-sm text-blue-800 ml-2">{getTaskTypeLabel(delivery.taskType)}</span>
                                    </div>
                                    {delivery.environment && (
                                        <div>
                                            <span className="text-sm font-medium text-blue-900">Ambiente:</span>
                                            <span className="text-sm text-blue-800 ml-2">{getEnvironmentLabel(delivery.environment)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Projeto */}
                        {(delivery.projectId || delivery.projectName) && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Projeto
                                </h3>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                                    {delivery.projectName && (
                                        <div>
                                            <span className="text-sm font-medium text-green-900">Nome:</span>
                                            <span className="text-sm text-green-800 ml-2">{delivery.projectName}</span>
                                        </div>
                                    )}
                                    {delivery.projectRepository && (
                                        <div>
                                            <span className="text-sm font-medium text-green-900">Repositório:</span>
                                            <span className="text-sm text-green-800 ml-2">{delivery.projectRepository}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status e Datas */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                Status e Cronograma
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm text-gray-500">Status:</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                        {delivery.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                        {delivery.status === 'DELIVERED' && <Package className="w-3 h-3 mr-1" />}
                                        {delivery.status === 'TESTING' && <Activity className="w-3 h-3 mr-1" />}
                                        {delivery.status === 'IN_PROGRESS' && <Activity className="w-3 h-3 mr-1" />}
                                        {delivery.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                        {delivery.status === 'REJECTED' && <X className="w-3 h-3 mr-1" />}
                                        {getStatusLabel(delivery.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Play className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Data de Início</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatDateOnly(delivery.startedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Data de Finalização</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatDateOnly(delivery.finishedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Observações Gerais da Entrega */}
                        {delivery.deliveryNotes && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <StickyNote className="w-5 h-5 text-amber-600" />
                                    Observações Gerais da Entrega
                                </h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="max-h-32 overflow-y-auto">
                                        <p className="text-gray-700 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {delivery.deliveryNotes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Git e Pull Request */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <GitBranch className="w-5 h-5 text-blue-600" />
                                Informações do Git
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <GitMerge className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Branch</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded text-gray-900 flex-1">
                                                    {delivery.branch || '-'}
                                                </code>
                                                {delivery.branch && (
                                                    <button
                                                        onClick={() => handleCopy(delivery.branch!, 'branch')}
                                                        className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                            copiedField === 'branch'
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                        title="Copiar branch"
                                                    >
                                                        {copiedField === 'branch' ? (
                                                            <Check className="w-3 h-3" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <GitBranch className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Branch de Origem</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded text-gray-900 flex-1">
                                                    {delivery.sourceBranch || '-'}
                                                </code>
                                                {delivery.sourceBranch && (
                                                    <button
                                                        onClick={() => handleCopy(delivery.sourceBranch!, 'sourceBranch')}
                                                        className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                            copiedField === 'sourceBranch'
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                        title="Copiar branch de origem"
                                                    >
                                                        {copiedField === 'sourceBranch' ? (
                                                            <Check className="w-3 h-3" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Link da Entrega
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            {delivery.pullRequest ? (
                                                <a
                                                    href={delivery.pullRequest}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                                                >
                                                    {delivery.pullRequest}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </div>
                                        {delivery.pullRequest && (
                                            <button
                                                onClick={() => handleCopy(delivery.pullRequest!, 'pullRequest')}
                                                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                    copiedField === 'pullRequest'
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                                title="Copiar link da entrega"
                                            >
                                                {copiedField === 'pullRequest' ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Observações do Item */}
                        {delivery.notes && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <StickyNote className="w-5 h-5 text-blue-600" />
                                    Observações do Item
                                </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="max-h-32 overflow-y-auto">
                                    <p className="text-gray-700 whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {delivery.notes}
                                    </p>
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
                                            {formatDate(delivery.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Última Atualização</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(delivery.updatedAt)}
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

export default DeliveryDetailModal;
