import React, { useState } from 'react';
import {
    X,
    Calendar,
    GitBranch,
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
    FolderOpen,
    ChevronRight,
    ChevronDown,
    ExternalLink
} from 'lucide-react';
import { DeliveryGroupResponse, DeliveryItem } from '../../types/delivery.types';
import { DeliveryOperationalItem } from '../../types/deliveryOperational';
import { DeliveryAttachmentList } from './DeliveryAttachmentList';
import { DeliveryOperationalAttachmentList } from './DeliveryOperationalAttachmentList';

interface DeliveryGroupModalProps {
    deliveryGroup: DeliveryGroupResponse | null;
    isOpen: boolean;
    onClose: () => void;
}

const DeliveryGroupModal: React.FC<DeliveryGroupModalProps> = ({ deliveryGroup, isOpen, onClose }) => {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
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

    const toggleItem = (itemId: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'text-yellow-700 bg-yellow-50 border-yellow-100',
            DEVELOPMENT: 'text-accent bg-info-soft border-blue-100',
            DELIVERED: 'text-green-700 bg-green-50 border-green-100',
            HOMOLOGATION: 'text-amber-700 bg-amber-50 border-amber-100',
            APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-100',
            REJECTED: 'text-rose-700 bg-rose-50 border-rose-100',
            PRODUCTION: 'text-violet-700 bg-violet-50 border-violet-100',
            CANCELLED: 'text-red-600 bg-red-50 border-red-200'
        };
        return colors[status] || 'text-text-secondary bg-surface-app border-gray-100';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            DEVELOPMENT: 'Desenvolvimento',
            DELIVERED: 'Entregue',
            HOMOLOGATION: 'Homologação',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            PRODUCTION: 'Produção',
            CANCELLED: 'Cancelado'
        };
        return labels[status] || status;
    };

    const getFlowTypeLabel = (flowType?: string) => {
        if (!flowType) return '-';
        return flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : 'Operacional';
    };

    const getTaskTypeLabel = (taskType?: string) => {
        if (!taskType) return '-';
        const types: Record<string, string> = {

            'BACKUP': 'Backup',
            'DEPLOY': 'Deploy',
            'LOGS': 'Logs',
            'DATABASE_APPLICATION': 'Aplicação de Banco',
            'NEW_SERVER': 'Novo Servidor',
            'MONITORING': 'Monitoramento',
            'SUPPORT': 'Suporte',

            'BUG': 'Bug',
            'ENHANCEMENT': 'Melhoria',
            'NEW_FEATURE': 'Nova Funcionalidade'
        };
        return types[taskType] || taskType;
    };

    const getEnvironmentLabel = (environment?: string) => {
        if (!environment) return '-';
        const environments: Record<string, string> = {
            'DESENVOLVIMENTO': 'Desenvolvimento',
            'HOMOLOGACAO': 'Homologação',
            'PRODUCAO': 'Produção'
        };
        return environments[environment] || environment;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface-1 rounded-xl shadow-2xl w-[80vw] h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <div className="w-10 h-10 bg-surface-1/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white truncate">{deliveryGroup.taskName}</h2>
                                <div className="flex items-center gap-3 text-blue-100 text-sm truncate">
                                    <span>Tarefa #{deliveryGroup.taskId}</span>
                                    <span>•</span>
                                    <span>{deliveryGroup.taskCode}</span>
                                    <span>•</span>
                                    <span>{deliveryGroup.totalDeliveries} entregas</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-10 flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="w-full h-10 text-white/80 hover:text-white hover:bg-surface-1/20 rounded-lg flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>


                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Informações da Tarefa */}
                        <div className="bg-info-soft border border-accent/20 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-blue-900">Fluxo:</span>
                                    <span className="text-sm text-info-strong ml-2">
                                        {getFlowTypeLabel(deliveryGroup.deliveries?.[0]?.flowType)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-blue-900">Tipo de Tarefa:</span>
                                    <span className="text-sm text-info-strong ml-2">
                                        {getTaskTypeLabel(deliveryGroup.deliveries?.[0]?.taskType)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-blue-900">Ambiente:</span>
                                    <span className="text-sm text-info-strong ml-2">
                                        {getEnvironmentLabel(deliveryGroup.deliveries?.[0]?.environment)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cronograma da Entrega */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-600" />
                                Cronograma da Entrega
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-green-900 flex items-center gap-1">
                                        <Play className="w-3 h-3" />
                                        Data Início:
                                    </span>
                                    <span className="text-sm text-green-800 block mt-1 font-medium">
                                        {deliveryGroup.deliveries?.[0]?.startedAt
                                            ? formatDate(deliveryGroup.deliveries[0].startedAt)
                                            : 'Não informado'
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-green-900 flex items-center gap-1">
                                        <Flag className="w-3 h-3" />
                                        Data Fim:
                                    </span>
                                    <span className="text-sm text-green-800 block mt-1 font-medium">
                                        {deliveryGroup.deliveries?.[0]?.finishedAt
                                            ? formatDate(deliveryGroup.deliveries[0].finishedAt)
                                            : 'Não informado'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Itens de Entrega */}
                        <div>
                            {(() => {
                                const delivery = deliveryGroup.deliveries?.[0];
                                const isOperacional = delivery?.flowType === 'OPERACIONAL';
                                const items = isOperacional ? delivery?.operationalItems : delivery?.items;
                                const itemCount = items?.length || 0;

                                return (
                                    <>
                                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                            <Package className="w-5 h-5 text-accent" />
                                            Itens de Entrega ({itemCount})
                                        </h3>

                        {items && items.length > 0 ? (
                            <div className="space-y-3">
                                {items.map((item: any) => {
                                    const isExpanded = expandedItems.has(item.id);
                                    
                                    return (
                                        <div key={item.id} className="border border-border-subtle rounded-lg overflow-hidden">
                                            {/* Header clicável */}
                                            <div 
                                                className="bg-surface-1 p-4 cursor-pointer hover:bg-surface-app transition-colors"
                                                onClick={() => toggleItem(item.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-5 h-5 text-text-tertiary" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-text-tertiary" />
                                                        )}
                                                        <div className="w-10 h-10 bg-accent-soft rounded-lg flex items-center justify-center">
                                                            <FolderOpen className="w-5 h-5 text-accent" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-text-primary">
                                                                {isOperacional ? item.title : item.projectName}
                                                            </h4>
                                                            <p className="text-sm text-text-tertiary">Item #{item.id}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                                        {getStatusLabel(item.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Conteúdo expansível */}
                                            {isExpanded && (
                                                <div className="bg-surface-app p-4 border-t border-border-subtle">
                                                    <div className="space-y-4">
                                                        {isOperacional ? (
                                                            <>
                                                                {/* Descrição do Item Operacional */}
                                                                {item.description && (
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold text-text-primary mb-3">Descrição</h5>
                                                                        <div className="bg-surface-1 border border-border-subtle rounded-lg p-3 prose prose-sm max-w-none">
                                                                            <div
                                                                                className="text-sm text-text-secondary [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                                                                dangerouslySetInnerHTML={{ __html: item.description }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Datas */}
                                                                <div>
                                                                    <h5 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4 text-accent" />
                                                                        Cronograma
                                                                    </h5>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="text-text-tertiary flex items-center gap-1 mb-1">
                                                                                <Play className="w-3 h-3" />
                                                                                Início:
                                                                            </span>
                                                                            <span className="text-text-primary font-medium">
                                                                                {item.startedAt ? formatDate(item.startedAt) : 'Não informado'}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-text-tertiary flex items-center gap-1 mb-1">
                                                                                <Flag className="w-3 h-3" />
                                                                                Finalização:
                                                                            </span>
                                                                            <span className="text-text-primary font-medium">
                                                                                {item.finishedAt ? formatDate(item.finishedAt) : 'Não informado'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Anexos Operacionais */}
                                                                <div>
                                                                    <DeliveryOperationalAttachmentList
                                                                        operationalItemId={item.id}
                                                                        readOnly={true}
                                                                        forceExpanded={false}
                                                                        className="border-t pt-4"
                                                                    />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                        {/* Informações de Desenvolvimento */}
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                                                <GitBranch className="w-4 h-4 text-accent" />
                                                                Informações de Desenvolvimento
                                                            </h5>
                                                            
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {/* Pull Request */}
                                                                <div>
                                                                    <span className="text-sm text-text-secondary block mb-1">Link da Entrega (Pull Request):</span>
                                                                    <div className="flex items-center gap-2">
                                                                        {item.pullRequest ? (
                                                                            <>
                                                                                <a
                                                                                    href={item.pullRequest}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-xs text-accent hover:text-info-strong hover:underline break-all bg-surface-1 px-2 py-1 rounded border flex-1"
                                                                                >
                                                                                    <ExternalLink className="w-3 h-3 inline mr-1" />
                                                                                    {item.pullRequest.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                                                </a>
                                                                                <button
                                                                                    onClick={() => handleCopy(item.pullRequest!, `pr-${item.id}`)}
                                                                                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                        copiedField === `pr-${item.id}`
                                                                                            ? 'bg-green-100 text-green-600'
                                                                                            : 'bg-surface-1 text-text-tertiary hover:bg-surface-2 border'
                                                                                    }`}
                                                                                    title="Copiar link"
                                                                                >
                                                                                    {copiedField === `pr-${item.id}` ? (
                                                                                        <Check className="w-3 h-3" />
                                                                                    ) : (
                                                                                        <Copy className="w-3 h-3" />
                                                                                    )}
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-xs bg-surface-1 text-text-tertiary px-2 py-1 rounded border flex-1">
                                                                                Não informado
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Branch */}
                                                                <div>
                                                                    <span className="text-sm text-text-secondary block mb-1">Branch:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="text-xs bg-surface-1 text-text-primary px-2 py-1 rounded border font-mono flex-1">
                                                                            {item.branch || 'Não informado'}
                                                                        </code>
                                                                        {item.branch && (
                                                                            <button
                                                                                onClick={() => handleCopy(item.branch!, `branch-${item.id}`)}
                                                                                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                    copiedField === `branch-${item.id}`
                                                                                        ? 'bg-green-100 text-green-600'
                                                                                        : 'bg-surface-1 text-text-tertiary hover:bg-surface-2 border'
                                                                                }`}
                                                                                title="Copiar branch"
                                                                            >
                                                                                {copiedField === `branch-${item.id}` ? (
                                                                                    <Check className="w-3 h-3" />
                                                                                ) : (
                                                                                    <Copy className="w-3 h-3" />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Branch de Origem */}
                                                                <div>
                                                                    <span className="text-sm text-text-secondary block mb-1">Branch de Origem:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="text-xs bg-surface-1 text-text-primary px-2 py-1 rounded border font-mono flex-1">
                                                                            {item.sourceBranch || 'Não informado'}
                                                                        </code>
                                                                        {item.sourceBranch && (
                                                                            <button
                                                                                onClick={() => handleCopy(item.sourceBranch!, `sourceBranch-${item.id}`)}
                                                                                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                    copiedField === `sourceBranch-${item.id}`
                                                                                        ? 'bg-green-100 text-green-600'
                                                                                        : 'bg-surface-1 text-text-tertiary hover:bg-surface-2 border'
                                                                                }`}
                                                                                title="Copiar branch de origem"
                                                                            >
                                                                                {copiedField === `sourceBranch-${item.id}` ? (
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


                                                        {/* Observações */}
                                                        {item.notes && (
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                                                    <StickyNote className="w-4 h-4 text-accent" />
                                                                    Observações
                                                                </h5>
                                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg prose prose-sm max-w-none">
                                                                    <div
                                                                        className="text-sm text-text-secondary [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                                                        dangerouslySetInnerHTML={{ __html: item.notes }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Datas */}
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-accent" />
                                                                Cronograma
                                                            </h5>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-text-tertiary flex items-center gap-1 mb-1">
                                                                        <Play className="w-3 h-3" />
                                                                        Início:
                                                                    </span>
                                                                    <span className="text-text-primary font-medium">
                                                                        {item.startedAt ? formatDate(item.startedAt) : 'Não informado'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-text-tertiary flex items-center gap-1 mb-1">
                                                                        <Flag className="w-3 h-3" />
                                                                        Finalização:
                                                                    </span>
                                                                    <span className="text-text-primary font-medium">
                                                                        {item.finishedAt ? formatDate(item.finishedAt) : 'Não informado'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Anexos do Item */}
                                                        <div>
                                                            <DeliveryAttachmentList
                                                                deliveryItemId={item.id}
                                                                readOnly={true}
                                                                forceExpanded={false}
                                                                className="border-t pt-4"
                                                            />
                                                        </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-text-tertiary mb-4">
                                    <Package className="w-12 h-12 mx-auto" />
                                </div>
                                <h4 className="text-lg font-medium text-text-primary mb-2">
                                    Nenhum item encontrado
                                </h4>
                                <p className="text-text-secondary">
                                    Esta entrega ainda não possui itens cadastrados.
                                </p>
                            </div>
                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Observações Gerais da Entrega */}
                        {deliveryGroup.deliveries?.[0]?.notes && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <StickyNote className="w-5 h-5 text-amber-600" />
                                    Observações Gerais da Entrega
                                </h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 prose prose-sm max-w-none">
                                    <div
                                        className="text-text-secondary [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                        dangerouslySetInnerHTML={{ __html: deliveryGroup.deliveries[0].notes }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Anexos da Entrega */}
                        {deliveryGroup.deliveries?.[0]?.id && (
                            <div className="mt-6">
                                <DeliveryAttachmentList
                                    deliveryId={deliveryGroup.deliveries[0].id}
                                    readOnly={true}
                                    forceExpanded={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryGroupModal;