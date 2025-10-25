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
import { DeliveryAttachmentList } from './DeliveryAttachmentList';

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
            DEVELOPMENT: 'text-blue-700 bg-blue-50 border-blue-100',
            DELIVERED: 'text-green-700 bg-green-50 border-green-100',
            HOMOLOGATION: 'text-amber-700 bg-amber-50 border-amber-100',
            APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-100',
            REJECTED: 'text-rose-700 bg-rose-50 border-rose-100',
            PRODUCTION: 'text-violet-700 bg-violet-50 border-violet-100'
        };
        return colors[status] || 'text-gray-700 bg-gray-50 border-gray-100';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            DEVELOPMENT: 'Desenvolvimento',
            DELIVERED: 'Entregue',
            HOMOLOGATION: 'Homologação',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            PRODUCTION: 'Produção'
        };
        return labels[status] || status;
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
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
                                className="w-full h-10 text-white/80 hover:text-white hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>


                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="p-6 space-y-6">
                        {/* Itens de Entrega */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Itens de Entrega ({deliveryGroup.deliveries?.[0]?.items?.length || 0})
                            </h3>
                        
                        {deliveryGroup.deliveries?.[0]?.items && deliveryGroup.deliveries[0].items.length > 0 ? (
                            <div className="space-y-3">
                                {deliveryGroup.deliveries[0].items.map((item) => {
                                    const isExpanded = expandedItems.has(item.id);
                                    
                                    return (
                                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Header clicável */}
                                            <div 
                                                className="bg-white p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleItem(item.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                                        )}
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <FolderOpen className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{item.projectName}</h4>
                                                            <p className="text-sm text-gray-500">Item #{item.id}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                                        {getStatusLabel(item.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Conteúdo expansível */}
                                            {isExpanded && (
                                                <div className="bg-gray-50 p-4 border-t border-gray-200">
                                                    <div className="space-y-4">
                                                        {/* Informações de Desenvolvimento */}
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <GitBranch className="w-4 h-4 text-blue-600" />
                                                                Informações de Desenvolvimento
                                                            </h5>
                                                            
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {/* Pull Request */}
                                                                <div>
                                                                    <span className="text-sm text-gray-600 block mb-1">Link da Entrega (Pull Request):</span>
                                                                    <div className="flex items-center gap-2">
                                                                        {item.pullRequest ? (
                                                                            <>
                                                                                <a
                                                                                    href={item.pullRequest}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all bg-white px-2 py-1 rounded border flex-1"
                                                                                >
                                                                                    <ExternalLink className="w-3 h-3 inline mr-1" />
                                                                                    {item.pullRequest.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                                                </a>
                                                                                <button
                                                                                    onClick={() => handleCopy(item.pullRequest!, `pr-${item.id}`)}
                                                                                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                        copiedField === `pr-${item.id}`
                                                                                            ? 'bg-green-100 text-green-600'
                                                                                            : 'bg-white text-gray-500 hover:bg-gray-100 border'
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
                                                                            <div className="text-xs bg-white text-gray-500 px-2 py-1 rounded border flex-1">
                                                                                Não informado
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Branch */}
                                                                <div>
                                                                    <span className="text-sm text-gray-600 block mb-1">Branch:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="text-xs bg-white text-gray-800 px-2 py-1 rounded border font-mono flex-1">
                                                                            {item.branch || 'Não informado'}
                                                                        </code>
                                                                        {item.branch && (
                                                                            <button
                                                                                onClick={() => handleCopy(item.branch!, `branch-${item.id}`)}
                                                                                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                    copiedField === `branch-${item.id}`
                                                                                        ? 'bg-green-100 text-green-600'
                                                                                        : 'bg-white text-gray-500 hover:bg-gray-100 border'
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
                                                                    <span className="text-sm text-gray-600 block mb-1">Branch de Origem:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="text-xs bg-white text-gray-800 px-2 py-1 rounded border font-mono flex-1">
                                                                            {item.sourceBranch || 'Não informado'}
                                                                        </code>
                                                                        {item.sourceBranch && (
                                                                            <button
                                                                                onClick={() => handleCopy(item.sourceBranch!, `sourceBranch-${item.id}`)}
                                                                                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                    copiedField === `sourceBranch-${item.id}`
                                                                                        ? 'bg-green-100 text-green-600'
                                                                                        : 'bg-white text-gray-500 hover:bg-gray-100 border'
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
                                                                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                    <StickyNote className="w-4 h-4 text-blue-600" />
                                                                    Observações
                                                                </h5>
                                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                        {item.notes}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Datas */}
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                                Cronograma
                                                            </h5>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500 flex items-center gap-1 mb-1">
                                                                        <Play className="w-3 h-3" />
                                                                        Início:
                                                                    </span>
                                                                    <span className="text-gray-900 font-medium">
                                                                        {item.startedAt ? formatDate(item.startedAt) : 'Não informado'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 flex items-center gap-1 mb-1">
                                                                        <Flag className="w-3 h-3" />
                                                                        Finalização:
                                                                    </span>
                                                                    <span className="text-gray-900 font-medium">
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
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <Package className="w-12 h-12 mx-auto" />
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                    Nenhum item encontrado
                                </h4>
                                <p className="text-gray-600">
                                    Esta entrega ainda não possui itens cadastrados.
                                </p>
                            </div>
                        )}
                        </div>

                        {/* Observações Gerais da Entrega */}
                        {deliveryGroup.deliveries?.[0]?.notes && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <StickyNote className="w-5 h-5 text-amber-600" />
                                    Observações Gerais da Entrega
                                </h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {deliveryGroup.deliveries[0].notes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryGroupModal;