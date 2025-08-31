import React, { useState } from 'react';
import {
    X,
    Calendar,
    GitBranch,
    GitMerge,
    ExternalLink,
    Package,
    Truck,
    Check,
    Clock,
    Activity,
    CheckCircle2,
    AlertTriangle,
    Play,
    Flag,
    Database,
    Copy,
    StickyNote,
    FolderOpen
} from 'lucide-react';

interface Delivery {
    id: number;
    taskName: string;
    taskCode: string;
    projectName: string;
    branch?: string;
    sourceBranch?: string;
    pullRequest?: string;
    script?: string;
    notes?: string;
    status: string;
    startedAt?: string;
    finishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface DeliveryGroup {
    taskId: number;
    taskName: string;
    taskCode: string;
    taskStatus: string;
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    deliveries: Delivery[];
}

interface DeliveryGroupModalProps {
    deliveryGroup: DeliveryGroup | null;
    isOpen: boolean;
    onClose: () => void;
}

const DeliveryGroupModal: React.FC<DeliveryGroupModalProps> = ({ deliveryGroup, isOpen, onClose }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!isOpen || !deliveryGroup) return null;

    const handleCopy = async (content: string, fieldName: string) => {
        if (!content || content === '-') return;
        
        try {
            await navigator.clipboard.writeText(content);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
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

    const formatDateShort = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
            TESTING: 'bg-purple-100 text-purple-800 border-purple-200',
            DELIVERED: 'bg-green-100 text-green-800 border-green-200',
            APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            REJECTED: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Progresso',
            TESTING: 'Em Teste',
            DELIVERED: 'Entregue',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado'
        };
        return labels[status] || status;
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, React.ReactNode> = {
            PENDING: <Clock className="w-4 h-4" />,
            IN_PROGRESS: <Activity className="w-4 h-4" />,
            TESTING: <Activity className="w-4 h-4" />,
            DELIVERED: <Package className="w-4 h-4" />,
            APPROVED: <CheckCircle2 className="w-4 h-4" />,
            REJECTED: <AlertTriangle className="w-4 h-4" />
        };
        return icons[status] || <Activity className="w-4 h-4" />;
    };

    const DeliveryCard: React.FC<{ delivery: Delivery }> = ({ delivery }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">{delivery.projectName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                ID #{delivery.id}
                            </span>
                            <span className="text-xs text-gray-500">
                                {delivery.taskName} ({delivery.taskCode})
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(delivery.status)}`}>
                    {getStatusIcon(delivery.status)}
                    {getStatusLabel(delivery.status)}
                </div>
            </div>

            {/* Seção de Desenvolvimento */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-600" />
                    Informações de Desenvolvimento
                </h5>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">


                        <div>
                            <span className="text-sm text-gray-600 block mb-1">Link da Entrega (Pull Request):</span>
                            <div className="flex items-center gap-2">
                                {delivery.pullRequest ? (
                                    <>
                                        <a
                                            href={delivery.pullRequest}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all bg-white px-2 py-1 rounded border flex-1"
                                        >
                                            {delivery.pullRequest.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                        </a>
                                        <button
                                            onClick={() => handleCopy(delivery.pullRequest!, `pr-${delivery.id}`)}
                                            className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                copiedField === `pr-${delivery.id}`
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-white text-gray-500 hover:bg-gray-100 border'
                                            }`}
                                            title="Copiar link"
                                        >
                                            {copiedField === `pr-${delivery.id}` ? (
                                                <Check className="w-3 h-3" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-xs bg-white text-gray-500 px-2 py-1 rounded border flex-1">
                                        Não informado
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm text-gray-600 block mb-1">Branch:</span>
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-white text-gray-800 px-2 py-1 rounded border font-mono flex-1">
                                    {delivery.branch || 'Não informado'}
                                </code>
                                {delivery.branch && (
                                    <button
                                        onClick={() => handleCopy(delivery.branch!, `branch-${delivery.id}`)}
                                        className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                            copiedField === `branch-${delivery.id}`
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-white text-gray-500 hover:bg-gray-100 border'
                                        }`}
                                        title="Copiar branch"
                                    >
                                        {copiedField === `branch-${delivery.id}` ? (
                                            <Check className="w-3 h-3" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm text-gray-600 block mb-1">Branch de Origem:</span>
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-white text-gray-800 px-2 py-1 rounded border font-mono flex-1">
                                    {delivery.sourceBranch || 'Não informado'}
                                </code>
                                {delivery.sourceBranch && (
                                    <button
                                        onClick={() => handleCopy(delivery.sourceBranch!, `sourceBranch-${delivery.id}`)}
                                        className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                            copiedField === `sourceBranch-${delivery.id}`
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-white text-gray-500 hover:bg-gray-100 border'
                                        }`}
                                        title="Copiar branch de origem"
                                    >
                                        {copiedField === `sourceBranch-${delivery.id}` ? (
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
            </div>

            {/* Script */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        Script de Banco de Dados
                    </h5>
                    {delivery.script && (
                        <button
                            onClick={() => handleCopy(delivery.script!, `script-${delivery.id}`)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                                copiedField === `script-${delivery.id}`
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                        >
                            {copiedField === `script-${delivery.id}` ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    Copiar Script
                                </>
                            )}
                        </button>
                    )}
                </div>
                {delivery.script ? (
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                            <code>{delivery.script}</code>
                        </pre>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-4 border text-center">
                        <span className="text-gray-500 text-sm">Nenhum script de banco fornecido</span>
                    </div>
                )}
            </div>

            {/* Notas */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-blue-600" />
                    Observações e Notas
                </h5>
                {delivery.notes ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {delivery.notes}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-4 border text-center">
                        <span className="text-gray-500 text-sm">Nenhuma observação adicional</span>
                    </div>
                )}
            </div>

            {/* Datas e Timestamps */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                            <Play className="w-3 h-3" />
                            Data de Início:
                        </span>
                        <span className="text-gray-900 font-medium">
                            {delivery.startedAt ? formatDate(delivery.startedAt) : 'Não informado'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                            <Flag className="w-3 h-3" />
                            Data de Finalização:
                        </span>
                        <span className="text-gray-900 font-medium">
                            {delivery.finishedAt ? formatDate(delivery.finishedAt) : 'Não informado'}
                        </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            Criado em:
                        </span>
                        <span className="text-gray-700">
                            {delivery.createdAt ? formatDate(delivery.createdAt) : 'Não informado'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3" />
                            Atualizado em:
                        </span>
                        <span className="text-gray-700">
                            {delivery.updatedAt ? formatDate(delivery.updatedAt) : 'Não informado'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{deliveryGroup.taskName}</h2>
                                <div className="flex items-center gap-3 text-blue-100 text-sm">
                                    <span>Tarefa #{deliveryGroup.taskId}</span>
                                    <span>•</span>
                                    <span>{deliveryGroup.taskCode}</span>
                                    <span>•</span>
                                    <span>{deliveryGroup.totalDeliveries} entregas</span>
                                </div>
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

                {/* Summary */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{deliveryGroup.totalDeliveries}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{deliveryGroup.completedDeliveries}</div>
                            <div className="text-sm text-gray-600">Concluídas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{deliveryGroup.pendingDeliveries}</div>
                            <div className="text-sm text-gray-600">Pendentes</div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Entregas por Projeto
                        </h3>
                        
                        {deliveryGroup.deliveries && deliveryGroup.deliveries.length > 0 ? (
                            <div className="grid gap-6">
                                {deliveryGroup.deliveries.map((delivery) => (
                                    <DeliveryCard key={delivery.id} delivery={delivery} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <Package className="w-12 h-12 mx-auto" />
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                    Nenhuma entrega encontrada
                                </h4>
                                <p className="text-gray-600">
                                    Este grupo ainda não possui entregas cadastradas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryGroupModal;