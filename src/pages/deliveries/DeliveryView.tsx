import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    GitBranch,
    Package,
    Truck,
    Check,
    Play,
    Flag,
    Copy,
    StickyNote,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    ExternalLink,
    Edit3,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { deliveryService } from '@/services/deliveryService';
import { DeliveryGroupResponse } from '@/types/delivery.types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DeliveryAttachmentList } from '@/components/deliveries/DeliveryAttachmentList';
import { DeliveryOperationalAttachmentList } from '@/components/deliveries/DeliveryOperationalAttachmentList';

const DeliveryView: React.FC = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');

    const [deliveryGroup, setDeliveryGroup] = useState<DeliveryGroupResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        const fetchDelivery = async () => {
            if (!taskId) {
                navigate('/deliveries');
                return;
            }

            try {
                setLoading(true);
                const data = await deliveryService.getGroupDetailsByTaskId(Number(taskId));
                setDeliveryGroup(data);
            } catch (error) {
                console.error('Erro ao carregar entrega:', error);
                navigate('/deliveries');
            } finally {
                setLoading(false);
            }
        };

        fetchDelivery();
    }, [taskId, navigate]);

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
            PENDING: 'text-yellow-700 bg-yellow-50 border-yellow-200',
            DEVELOPMENT: 'text-blue-700 bg-blue-50 border-blue-200',
            DELIVERED: 'text-green-700 bg-green-50 border-green-200',
            HOMOLOGATION: 'text-amber-700 bg-amber-50 border-amber-200',
            APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            REJECTED: 'text-rose-700 bg-rose-50 border-rose-200',
            PRODUCTION: 'text-violet-700 bg-violet-50 border-violet-200',
            CANCELLED: 'text-red-600 bg-red-50 border-red-200'
        };
        return colors[status] || 'text-gray-700 bg-gray-50 border-gray-200';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            DEVELOPMENT: 'Desenvolvimento',
            DELIVERED: 'Entregue',
            HOMOLOGATION: 'Homologacao',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            PRODUCTION: 'Producao',
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
            'DATABASE_APPLICATION': 'Aplicacao de Banco',
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
            'HOMOLOGACAO': 'Homologacao',
            'PRODUCAO': 'Producao'
        };
        return environments[environment] || environment;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Carregando entrega...</p>
                </Card>
            </div>
        );
    }

    if (!deliveryGroup) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Entrega nao encontrada
                    </h2>
                    <p className="text-gray-600 mb-6">
                        A entrega que voce esta procurando nao foi encontrada.
                    </p>
                    <Button onClick={() => navigate('/deliveries')} variant="primary" className="w-full">
                        Voltar para Listagem
                    </Button>
                </Card>
            </div>
        );
    }

    const delivery = deliveryGroup.deliveries?.[0];
    const isOperacional = delivery?.flowType === 'OPERACIONAL';
    const items = isOperacional ? delivery?.operationalItems : delivery?.items;
    const itemCount = items?.length || 0;

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full lg:w-[80%] mx-auto space-y-6">
                {/* Header com acoes */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/deliveries')}
                        className="flex items-center w-fit"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>

                    {isAdmin && delivery && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/deliveries/${delivery.id}/edit`)}
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
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Truck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                                        {deliveryGroup.taskName}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 text-blue-100 text-sm mt-1">
                                        <span>Entrega #{delivery?.id}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs">
                                            {deliveryGroup.taskId} - {deliveryGroup.taskCode}
                                        </span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>{deliveryGroup.totalDeliveries} entregas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badges de Status */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {delivery?.flowType && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    delivery.flowType === 'OPERACIONAL'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {getFlowTypeLabel(delivery.flowType)}
                                </span>
                            )}
                            {delivery?.taskType && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                    {getTaskTypeLabel(delivery.taskType)}
                                </span>
                            )}
                            {delivery?.environment && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {getEnvironmentLabel(delivery.environment)}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Cronograma da Entrega */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Cronograma da Entrega
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm text-green-700 mb-1 flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                Data Inicio
                            </p>
                            <p className="font-medium text-green-900">
                                {delivery?.startedAt
                                    ? formatDate(delivery.startedAt)
                                    : 'Nao informado'
                                }
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm text-green-700 mb-1 flex items-center gap-1">
                                <Flag className="w-3 h-3" />
                                Data Fim
                            </p>
                            <p className="font-medium text-green-900">
                                {delivery?.finishedAt
                                    ? formatDate(delivery.finishedAt)
                                    : 'Nao informado'
                                }
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Itens de Entrega */}
                <Card className="p-3 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Itens de Entrega
                        <span className="text-sm font-normal text-gray-500">
                            ({itemCount})
                        </span>
                    </h2>

                    {items && items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map((item: any) => {
                                const isExpanded = expandedItems.has(item.id);

                                return (
                                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Header clicavel */}
                                        <div
                                            className="bg-white p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleItem(item.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                    )}
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                                            {isOperacional ? item.title : item.projectName}
                                                        </h4>
                                                        <p className="text-xs sm:text-sm text-gray-500">Item #{item.id}</p>
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)} flex-shrink-0 ml-2`}>
                                                    {getStatusLabel(item.status)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conteudo expansivel */}
                                        {isExpanded && (
                                            <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200">
                                                <div className="space-y-4">
                                                    {isOperacional ? (
                                                        <>
                                                            {/* Descricao do Item Operacional */}
                                                            {item.description && (
                                                                <div>
                                                                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Descricao</h5>
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 prose prose-sm max-w-none">
                                                                        <div
                                                                            className="text-sm text-gray-700 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                                                            dangerouslySetInnerHTML={{ __html: item.description }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Datas */}
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                                    Cronograma
                                                                </h5>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                                                                            <Play className="w-3 h-3" />
                                                                            Inicio:
                                                                        </span>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {item.startedAt ? formatDate(item.startedAt) : 'Nao informado'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                                                                            <Flag className="w-3 h-3" />
                                                                            Finalizacao:
                                                                        </span>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {item.finishedAt ? formatDate(item.finishedAt) : 'Nao informado'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Anexos Operacionais */}
                                                            <DeliveryOperationalAttachmentList
                                                                operationalItemId={item.id}
                                                                readOnly={true}
                                                                forceExpanded={false}
                                                                className="border-t pt-4"
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Informacoes de Desenvolvimento */}
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                    <GitBranch className="w-4 h-4 text-blue-600" />
                                                                    Informacoes de Desenvolvimento
                                                                </h5>

                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {/* Pull Request */}
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-sm text-gray-600 block mb-2">Link da Entrega (Pull Request):</span>
                                                                        <div className="flex items-center gap-2">
                                                                            {item.pullRequest ? (
                                                                                <>
                                                                                    <a
                                                                                        href={item.pullRequest}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all bg-gray-50 px-2 py-1 rounded border flex-1"
                                                                                    >
                                                                                        <ExternalLink className="w-3 h-3 inline mr-1" />
                                                                                        {item.pullRequest.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                                                    </a>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleCopy(item.pullRequest!, `pr-${item.id}`);
                                                                                        }}
                                                                                        className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                            copiedField === `pr-${item.id}`
                                                                                                ? 'bg-green-100 text-green-600'
                                                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border'
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
                                                                                <div className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded border flex-1">
                                                                                    Nao informado
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Branch */}
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-sm text-gray-600 block mb-2">Branch:</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <code className="text-xs bg-gray-50 text-gray-800 px-2 py-1 rounded border font-mono flex-1">
                                                                                {item.branch || 'Nao informado'}
                                                                            </code>
                                                                            {item.branch && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleCopy(item.branch!, `branch-${item.id}`);
                                                                                    }}
                                                                                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                        copiedField === `branch-${item.id}`
                                                                                            ? 'bg-green-100 text-green-600'
                                                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border'
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
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-sm text-gray-600 block mb-2">Branch de Origem:</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <code className="text-xs bg-gray-50 text-gray-800 px-2 py-1 rounded border font-mono flex-1">
                                                                                {item.sourceBranch || 'Nao informado'}
                                                                            </code>
                                                                            {item.sourceBranch && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleCopy(item.sourceBranch!, `sourceBranch-${item.id}`);
                                                                                    }}
                                                                                    className={`flex items-center justify-center p-1.5 rounded transition-all ${
                                                                                        copiedField === `sourceBranch-${item.id}`
                                                                                            ? 'bg-green-100 text-green-600'
                                                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border'
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

                                                            {/* Observacoes */}
                                                            {item.notes && (
                                                                <div>
                                                                    <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                        <StickyNote className="w-4 h-4 text-blue-600" />
                                                                        Observacoes
                                                                    </h5>
                                                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg prose prose-sm max-w-none">
                                                                        <div
                                                                            className="text-sm text-gray-700 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                                                            dangerouslySetInnerHTML={{ __html: item.notes }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Datas */}
                                                            <div>
                                                                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                                    Cronograma
                                                                </h5>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                                                                            <Play className="w-3 h-3" />
                                                                            Inicio:
                                                                        </span>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {item.startedAt ? formatDate(item.startedAt) : 'Nao informado'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="text-gray-500 flex items-center gap-1 mb-1">
                                                                            <Flag className="w-3 h-3" />
                                                                            Finalizacao:
                                                                        </span>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {item.finishedAt ? formatDate(item.finishedAt) : 'Nao informado'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Anexos do Item */}
                                                            <DeliveryAttachmentList
                                                                deliveryItemId={item.id}
                                                                readOnly={true}
                                                                forceExpanded={false}
                                                                className="border-t pt-4"
                                                            />
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
                            <div className="text-gray-400 mb-4">
                                <Package className="w-12 h-12 mx-auto" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhum item encontrado
                            </h4>
                            <p className="text-gray-600">
                                Esta entrega ainda nao possui itens cadastrados.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Observacoes Gerais da Entrega */}
                {delivery?.notes && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <StickyNote className="w-5 h-5 text-amber-600" />
                            Observacoes Gerais da Entrega
                        </h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 prose prose-sm max-w-none">
                            <div
                                className="text-gray-700 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                dangerouslySetInnerHTML={{ __html: delivery.notes }}
                            />
                        </div>
                    </Card>
                )}

                {/* Anexos da Entrega */}
                {delivery?.id && (
                    <Card className="p-6">
                        <DeliveryAttachmentList
                            deliveryId={delivery.id}
                            readOnly={true}
                            forceExpanded={false}
                        />
                    </Card>
                )}
            </div>
        </div>
    );
};

export default DeliveryView;
