import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Edit, Plus, Truck, Package, Trash2, Clock, Activity, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useDeliveryGroups } from '@/hooks/useDeliveryGroups';
import { useDeliveries } from '@/hooks/useDeliveries';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DeliveryForm from '@/components/forms/DeliveryForm';
import toast from 'react-hot-toast';

interface DeliveryGroup {
    taskId: number;
    taskName: string;
    taskCode: string;
    deliveryStatus: string;
    createdAt: string;
    updatedAt: string;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    statusCounts?: {
        pending: number;
        development: number;
        delivered: number;
        homologation: number;
        approved: number;
        rejected: number;
        production: number;
    };
    deliveries: Delivery[];
}

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
    taskId: number;
    projectId: number;
}

const DeliveryGroupEdit: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const { getGroupDetails } = useDeliveryGroups();
    const { updateDelivery, createDelivery, deleteDelivery } = useDeliveries();
    
    const [deliveryGroup, setDeliveryGroup] = useState<DeliveryGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const loadDeliveryGroup = async () => {
            if (!taskId) return;

            try {
                setLoading(true);
                const groupDetails = await getGroupDetails(parseInt(taskId));
                if (groupDetails) {
                    setDeliveryGroup(groupDetails);
                } else {
                    toast.error('Grupo de entregas não encontrado');
                    navigate('/deliveries');
                }
            } catch (error) {
                console.error('Erro ao carregar grupo:', error);
                toast.error('Erro ao carregar dados do grupo');
                navigate('/deliveries');
            } finally {
                setLoading(false);
            }
        };

        loadDeliveryGroup();
    }, [taskId, getGroupDetails, navigate]);

    const handleEditDelivery = (delivery: Delivery) => {
        setEditingDelivery(delivery);
        setShowDeliveryForm(true);
    };

    const handleAddDelivery = () => {
        setEditingDelivery(null);
        setShowDeliveryForm(true);
    };

    const handleSaveDelivery = async (deliveryData: any) => {
        try {
            setSaving(true);
            
            if (editingDelivery) {
                // Atualizar entrega existente
                await updateDelivery(editingDelivery.id, deliveryData);
                toast.success('Entrega atualizada com sucesso!');
            } else {
                // Criar nova entrega
                const newDeliveryData = {
                    ...deliveryData,
                    taskId: parseInt(taskId!)
                };
                await createDelivery(newDeliveryData);
                toast.success('Nova entrega criada com sucesso!');
            }

            // Recarregar dados do grupo
            const updatedGroup = await getGroupDetails(parseInt(taskId!));
            if (updatedGroup) {
                setDeliveryGroup(updatedGroup);
            }

            setShowDeliveryForm(false);
            setEditingDelivery(null);
        } catch (error) {
            console.error('Erro ao salvar entrega:', error);
            toast.error('Erro ao salvar entrega');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setShowDeliveryForm(false);
        setEditingDelivery(null);
    };

    const handleDeleteDelivery = (delivery: Delivery) => {
        setDeliveryToDelete(delivery);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!deliveryToDelete) return;

        try {
            setDeleting(true);
            await deleteDelivery(deliveryToDelete.id);
            
            // Recarregar dados do grupo
            const updatedGroup = await getGroupDetails(parseInt(taskId!));
            if (updatedGroup) {
                setDeliveryGroup(updatedGroup);
            }

            setShowDeleteConfirm(false);
            setDeliveryToDelete(null);
            toast.success('Entrega excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir entrega:', error);
            toast.error('Erro ao excluir entrega');
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeliveryToDelete(null);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            DEVELOPMENT: 'bg-blue-100 text-blue-800 border-blue-200',
            DELIVERED: 'bg-green-100 text-green-800 border-green-200',
            HOMOLOGATION: 'bg-purple-100 text-purple-800 border-purple-200',
            APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            REJECTED: 'bg-red-100 text-red-800 border-red-200',
            PRODUCTION: 'bg-teal-100 text-teal-800 border-teal-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-4 text-gray-600">Carregando...</span>
                    </div>
                </Card>
            </div>
        );
    }

    if (!deliveryGroup) {
        return (
            <div className="space-y-6">
                <Card className="p-8 text-center">
                    <div className="text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">Grupo não encontrado</h3>
                        <p>O grupo de entregas solicitado não foi encontrado.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/deliveries')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Editar Grupo de Entregas
                        </h1>
                        <p className="text-gray-600">
                            {deliveryGroup.taskName} ({deliveryGroup.taskCode}) - Tarefa #{deliveryGroup.taskId}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleAddDelivery}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Entrega
                </Button>
            </div>

            {/* Estatísticas por Status - Cards Detalhados */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {/* Pendente */}
                <div className="bg-white rounded-lg shadow p-4 border border-yellow-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-yellow-600">Pendente</div>
                            <div className="text-lg font-bold text-yellow-700">
                                {deliveryGroup.statusCounts?.pending || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desenvolvimento */}
                <div className="bg-white rounded-lg shadow p-4 border border-blue-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-blue-600">Desenvolvimento</div>
                            <div className="text-lg font-bold text-blue-700">
                                {deliveryGroup.statusCounts?.development || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Entregue */}
                <div className="bg-white rounded-lg shadow p-4 border border-green-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-green-600">Entregue</div>
                            <div className="text-lg font-bold text-green-700">
                                {deliveryGroup.statusCounts?.delivered || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Homologação */}
                <div className="bg-white rounded-lg shadow p-4 border border-purple-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Play className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-purple-600">Homologação</div>
                            <div className="text-lg font-bold text-purple-700">
                                {deliveryGroup.statusCounts?.homologation || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aprovado */}
                <div className="bg-white rounded-lg shadow p-4 border border-emerald-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-emerald-600">Aprovado</div>
                            <div className="text-lg font-bold text-emerald-700">
                                {deliveryGroup.statusCounts?.approved || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rejeitado */}
                <div className="bg-white rounded-lg shadow p-4 border border-red-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-red-600">Rejeitado</div>
                            <div className="text-lg font-bold text-red-700">
                                {deliveryGroup.statusCounts?.rejected || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Produção */}
                <div className="bg-white rounded-lg shadow p-4 border border-teal-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Truck className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="ml-3">
                            <div className="text-xs font-medium text-teal-600">Produção</div>
                            <div className="text-lg font-bold text-teal-700">
                                {deliveryGroup.statusCounts?.production || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Lista de Entregas */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Entregas do Grupo
                </h2>

                {deliveryGroup.deliveries && deliveryGroup.deliveries.length > 0 ? (
                    <div className="grid gap-4">
                        {deliveryGroup.deliveries.map((delivery) => (
                            <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{delivery.projectName}</h3>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                ID #{delivery.id}
                                            </span>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                                                {getStatusLabel(delivery.status)}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                            <div className="md:col-span-2">
                                                <span className="font-medium text-blue-700">🔗 Link da Entrega (Pull Request):</span>
                                                <div className="text-gray-900 mt-1">
                                                    {delivery.pullRequest ? (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                                                            <a 
                                                                href={delivery.pullRequest} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-blue-700 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                                                            >
                                                                <span className="truncate">
                                                                    {delivery.pullRequest.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                                </span>
                                                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Link não informado</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Branch:</span>
                                                <div className="text-gray-900 mt-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {delivery.branch || 'Não informado'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Branch Origem:</span>
                                                <div className="text-gray-900 mt-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {delivery.sourceBranch || 'Não informado'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Script de BD:</span>
                                                <div className="text-gray-900 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        delivery.script 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {delivery.script ? '✓ Sim' : '✗ Não'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {delivery.notes && (
                                            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                                                <p className="text-sm text-gray-700">{delivery.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditDelivery(delivery)}
                                            className="flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteDelivery(delivery)}
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                            </div>
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
                        <p className="text-gray-600 mb-4">
                            Este grupo ainda não possui entregas cadastradas.
                        </p>
                        <Button onClick={handleAddDelivery} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Adicionar Primeira Entrega
                        </Button>
                    </div>
                )}
            </Card>

            {/* Modal de Formulário */}
            {showDeliveryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {editingDelivery ? 'Editar Entrega' : 'Nova Entrega'}
                                </h2>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                            <DeliveryForm
                                initialData={editingDelivery}
                                onSubmit={handleSaveDelivery}
                                onCancel={handleCancelEdit}
                                loading={saving}
                                selectedTask={deliveryGroup ? {
                                    id: deliveryGroup.taskId,
                                    name: deliveryGroup.taskName,
                                    code: deliveryGroup.taskCode
                                } : undefined}
                                selectedProject={editingDelivery ? {
                                    id: editingDelivery.projectId,
                                    name: editingDelivery.projectName
                                } : undefined}
                                showProjectSelector={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteConfirm && deliveryToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Excluir Entrega</h3>
                                    <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-700">
                                    Deseja realmente excluir a entrega do projeto{' '}
                                    <strong>{deliveryToDelete.projectName}</strong>?
                                </p>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">ID:</span> #{deliveryToDelete.id}
                                        <br />
                                        <span className="font-medium">Branch:</span> {deliveryToDelete.branch || 'Não informado'}
                                        <br />
                                        <span className="font-medium">Status:</span> {getStatusLabel(deliveryToDelete.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleCancelDelete}
                                    disabled={deleting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleConfirmDelete}
                                    loading={deleting}
                                    disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                >
                                    {deleting ? 'Excluindo...' : 'Excluir'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryGroupEdit;