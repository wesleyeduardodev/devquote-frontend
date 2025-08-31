import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Edit, Plus, Truck, Package } from 'lucide-react';
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
    const { updateDelivery, createDelivery } = useDeliveries();
    
    const [deliveryGroup, setDeliveryGroup] = useState<DeliveryGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [saving, setSaving] = useState(false);

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

            {/* Resumo do Grupo */}
            <Card className="p-6">
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
            </Card>

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
                                            <div>
                                                <span className="font-medium">Branch:</span>
                                                <div className="text-gray-900">{delivery.branch || 'Não informado'}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Branch Origem:</span>
                                                <div className="text-gray-900">{delivery.sourceBranch || 'Não informado'}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Pull Request:</span>
                                                <div className="text-gray-900">
                                                    {delivery.pullRequest ? (
                                                        <a href={delivery.pullRequest} target="_blank" rel="noopener noreferrer" 
                                                           className="text-blue-600 hover:underline truncate block">
                                                            {delivery.pullRequest.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                                        </a>
                                                    ) : 'Não informado'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Script:</span>
                                                <div className="text-gray-900">
                                                    {delivery.script ? 'Sim' : 'Não'}
                                                </div>
                                            </div>
                                        </div>

                                        {delivery.notes && (
                                            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                                                <p className="text-sm text-gray-700">{delivery.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditDelivery(delivery)}
                                        className="flex items-center gap-2 ml-4"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar
                                    </Button>
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
        </div>
    );
};

export default DeliveryGroupEdit;