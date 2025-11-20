import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Eye, Package2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { deliveryService } from '../../services/deliveryService';
import { deliveryItemService } from '../../services/deliveryItemService';
import deliveryOperationalService from '../../services/deliveryOperationalService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import {
    Delivery,
    DeliveryItem,
    DeliveryItemFormData,
    UpdateDeliveryData,
    AvailableProject,
    AvailableTask
} from '../../types/delivery.types';
import { DeliveryOperationalItem } from '../../types/deliveryOperational';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DeliveryItemForm from '../../components/deliveries/DeliveryItemForm';
import DeliveryOperationalItemForm, { DeliveryOperationalItemFormData } from '../../components/deliveries/DeliveryOperationalItemForm';
import ProjectSelectionModal from '../../components/deliveries/ProjectSelectionModal';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const DeliveryEdit: React.FC = () => {
    const { deliveryId } = useParams<{ deliveryId: string }>();
    const navigate = useNavigate();
    const { hasProfile } = useAuth();

    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const canEdit = isAdmin || isManager;
    const canDelete = isAdmin;

    const [loading, setLoading] = useState(true);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
    const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
    const [operationalItems, setOperationalItems] = useState<DeliveryOperationalItem[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<AvailableProject[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [originalNotes, setOriginalNotes] = useState<string>('');
    const [savingNotes, setSavingNotes] = useState(false);

    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DeliveryItem | null>(null);
    const [showDeleteOperationalModal, setShowDeleteOperationalModal] = useState(false);
    const [operationalItemToDelete, setOperationalItemToDelete] = useState<DeliveryOperationalItem | null>(null);

    const [itemsFormData, setItemsFormData] = useState<Map<number, DeliveryItemFormData>>(new Map());

    const formatTaskType = (taskType?: string, flowType?: string): string => {
        if (!taskType) return '-';

        if (flowType === 'DESENVOLVIMENTO') {
            const devTypes: Record<string, string> = {
                'BUG': '🐛 Bug',
                'ENHANCEMENT': '🔧 Melhoria',
                'NEW_FEATURE': '✨ Nova Funcionalidade'
            };
            return devTypes[taskType] || taskType;
        }

        const opTypes: Record<string, string> = {
            'BACKUP': '📦 Backup',
            'DEPLOY': '🚀 Deploy',
            'LOGS': '📄 Logs',
            'DATABASE_APPLICATION': '🗄️ Aplicação de Banco',
            'NEW_SERVER': '💻 Novo Servidor',
            'MONITORING': '📊 Monitoramento',
            'SUPPORT': '🛠️ Suporte'
        };
        return opTypes[taskType] || taskType;
    };

    const formatEnvironment = (environment?: string): { label: string; colorClass: string } => {
        if (!environment) return { label: '-', colorClass: 'bg-gray-100 text-gray-800' };

        const envConfig: Record<string, { label: string; colorClass: string }> = {
            'PRODUCAO': { label: 'Produção', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
            'DESENVOLVIMENTO': { label: 'Desenvolvimento', colorClass: 'bg-green-100 text-green-800 border-green-200' },
            'HOMOLOGACAO': { label: 'Homologação', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
        };

        return envConfig[environment] || { label: environment, colorClass: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    const formatDateTimeForInput = (dateTime: string | undefined): string => {
        if (!dateTime) return '';
        // Remove seconds from datetime string (2025-11-20T11:01:19 -> 2025-11-20T11:01)
        return dateTime.substring(0, 16);
    };

    useEffect(() => {
        if (deliveryId) {
            loadDeliveryData();
        }
    }, [deliveryId]);

    const loadDeliveryData = async () => {
        setLoading(true);
        try {
            const deliveryData = await deliveryService.getById(parseInt(deliveryId));
            setDelivery(deliveryData);
            const initialNotes = deliveryData.notes || '';
            setNotes(initialNotes);
            setOriginalNotes(initialNotes);

            let taskFlowType: string | undefined;
            if (deliveryData.taskId) {
                const taskData = await taskService.getById(deliveryData.taskId);
                taskFlowType = taskData.flowType;

                setSelectedTask({
                    id: taskData.id,
                    title: taskData.title,
                    code: taskData.code,
                    flowType: taskData.flowType,
                    taskType: taskData.taskType,
                    environment: taskData.environment,
                    amount: taskData.amount,
                    requester: {
                        id: taskData.requesterId,
                        name: taskData.requesterName
                    },
                    hasDelivery: true
                });
            }

            if (taskFlowType === 'OPERACIONAL') {

                const opItems = await deliveryOperationalService.getItemsByDelivery(deliveryData.id);
                setOperationalItems(opItems);
            } else {

                const items = await deliveryItemService.getByDeliveryId(deliveryData.id);
                setDeliveryItems(items);

                const initialFormData = new Map<number, DeliveryItemFormData>();
                const projectIds: number[] = [];

                for (const item of items) {
                    initialFormData.set(item.id, {
                        id: item.id,
                        deliveryId: item.deliveryId,
                        projectId: item.projectId,
                        projectName: item.projectName,
                        status: item.status,
                        branch: item.branch || '',
                        sourceBranch: item.sourceBranch || '',
                        pullRequest: item.pullRequest || '',
                        script: item.script || '',
                        startedAt: formatDateTimeForInput(item.startedAt),
                        finishedAt: formatDateTimeForInput(item.finishedAt),
                        notes: item.notes || ''
                    });
                    projectIds.push(item.projectId);
                }
                setItemsFormData(initialFormData);

                if (projectIds.length > 0) {
                    const uniqueProjectIds = Array.from(new Set(projectIds));
                    const projects = await projectService.getByIds(uniqueProjectIds);
                    setSelectedProjects(projects.map(p => ({
                        id: p.id,
                        name: p.name,
                        description: p.description
                    })));
                }
            }

        } catch (error) {
            console.error('Erro ao carregar dados da entrega:', error);
            toast.error('Erro ao carregar dados da entrega');
        } finally {
            setLoading(false);
        }
    };


    const handleSaveItemData = async (itemId: number, data: DeliveryItemFormData) => {
        const item = deliveryItems.find(item => item.id === itemId);
        if (!item || !delivery) return;

        try {
            await deliveryItemService.update(item.id, {
                deliveryId: delivery.id,
                projectId: item.projectId,
                status: data.status,
                branch: data.branch,
                sourceBranch: data.sourceBranch,
                pullRequest: data.pullRequest,
                script: data.script,
                startedAt: data.startedAt,
                finishedAt: data.finishedAt,
                notes: data.notes
            });

            const newFormData = new Map(itemsFormData);
            newFormData.set(itemId, data);
            setItemsFormData(newFormData);

            toast.success('Item salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            toast.error('Erro ao salvar item');
        }
    };

    const handleAddProjects = async (projects: AvailableProject[]) => {
        if (!delivery) return;

        try {
            const newItems: DeliveryItem[] = [];

            for (const project of projects) {
                const newItem = await deliveryItemService.create({
                    deliveryId: delivery.id,
                    projectId: project.id,
                    status: 'PENDING'
                });

                newItems.push(newItem);

                const newFormData = new Map(itemsFormData);
                newFormData.set(newItem.id, {
                    id: newItem.id,
                    deliveryId: newItem.deliveryId,
                    projectId: newItem.projectId,
                    projectName: project.name,
                    status: newItem.status,
                    branch: newItem.branch || '',
                    sourceBranch: newItem.sourceBranch || '',
                    pullRequest: newItem.pullRequest || '',
                    script: newItem.script || '',
                    startedAt: formatDateTimeForInput(newItem.startedAt),
                    finishedAt: formatDateTimeForInput(newItem.finishedAt),
                    notes: newItem.notes || ''
                });
                setItemsFormData(newFormData);
            }

            setDeliveryItems([...deliveryItems, ...newItems]);

            const existingProjectIds = new Set(selectedProjects.map(p => p.id));
            const newUniqueProjects = projects.filter(p => !existingProjectIds.has(p.id));
            if (newUniqueProjects.length > 0) {
                setSelectedProjects([...selectedProjects, ...newUniqueProjects]);
            }

            setShowProjectModal(false);

            toast.success(`${newItems.length} item(s) adicionado(s) com sucesso!`);
        } catch (error) {
            console.error('Erro ao adicionar itens:', error);
            toast.error('Erro ao adicionar itens');
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            await deliveryItemService.delete(itemToDelete.id);

            const updatedItems = deliveryItems.filter(item => item.id !== itemToDelete.id);
            setDeliveryItems(updatedItems);

            const stillHasProject = updatedItems.some(item => item.projectId === itemToDelete.projectId);
            if (!stillHasProject) {
                setSelectedProjects(selectedProjects.filter(p => p.id !== itemToDelete.projectId));
            }

            const newFormData = new Map(itemsFormData);
            newFormData.delete(itemToDelete.id);
            setItemsFormData(newFormData);

            setShowDeleteModal(false);
            setItemToDelete(null);
            toast.success('Item removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            toast.error('Erro ao remover item');
        }
    };


    const handleAddOperationalItem = async () => {
        if (!delivery) return;

        try {
            const newItem = await deliveryOperationalService.createItem({
                deliveryId: delivery.id,
                title: 'Novo Item Operacional',
                status: 'PENDING'
            });

            setOperationalItems([...operationalItems, newItem]);
            toast.success('Item operacional criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar item operacional:', error);
            toast.error('Erro ao criar item operacional');
        }
    };

    const handleSaveOperationalItem = async (itemId: number, data: DeliveryOperationalItemFormData) => {
        try {
            const updated = await deliveryOperationalService.updateItem(itemId, {
                deliveryId: delivery!.id,
                title: data.title,
                description: data.description,
                status: data.status,
                startedAt: data.startedAt,
                finishedAt: data.finishedAt
            });

            setOperationalItems(operationalItems.map(item => item.id === itemId ? updated : item));
            toast.success('Item operacional salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar item operacional:', error);
            toast.error('Erro ao salvar item operacional');
        }
    };

    const handleDeleteOperationalItemClick = (item: DeliveryOperationalItem) => {
        setOperationalItemToDelete(item);
        setShowDeleteOperationalModal(true);
    };

    const handleConfirmDeleteOperationalItem = async () => {
        if (!operationalItemToDelete) return;

        try {
            await deliveryOperationalService.deleteItem(operationalItemToDelete.id);
            setOperationalItems(operationalItems.filter(item => item.id !== operationalItemToDelete.id));
            toast.success('Item operacional excluído com sucesso!');
            setShowDeleteOperationalModal(false);
            setOperationalItemToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir item operacional:', error);
            toast.error('Erro ao excluir item operacional');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'text-yellow-700 bg-yellow-50 border border-yellow-100',
            DEVELOPMENT: 'text-blue-700 bg-blue-50 border border-blue-100',
            DELIVERED: 'text-green-700 bg-green-50 border border-green-100',
            HOMOLOGATION: 'text-amber-700 bg-amber-50 border border-amber-100',
            APPROVED: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
            REJECTED: 'text-rose-700 bg-rose-50 border border-rose-100',
            PRODUCTION: 'text-violet-700 bg-violet-50 border border-violet-100'
        };
        return colors[status] || colors.PENDING;
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Entrega não encontrada</h3>
                    <Button onClick={() => navigate('/deliveries')}>
                        Voltar para Entregas
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/deliveries')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Editar Entrega</h1>
                            <p className="text-gray-600">ID: {delivery.id}</p>
                        </div>
                    </div>

                </div>

                {/* Seleção de Tarefa */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Tarefa Associada</h3>
                    </div>

                    {selectedTask ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900">
                                        #{selectedTask.id} - {selectedTask.code}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {selectedTask.title}
                                    </div>
                                    {selectedTask.flowType && (
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                                selectedTask.flowType === 'OPERACIONAL'
                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                            }`}>
                                                {selectedTask.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                                            </span>
                                        </div>
                                    )}
                                    {selectedTask.taskType && (
                                        <div className="mt-2">
                                            <span className="text-sm text-gray-700">
                                                <span className="font-medium">Tipo:</span> {formatTaskType(selectedTask.taskType, selectedTask.flowType)}
                                            </span>
                                        </div>
                                    )}
                                    {selectedTask.environment && (
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${formatEnvironment(selectedTask.environment).colorClass}`}>
                                                {formatEnvironment(selectedTask.environment).label}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-500 mt-2">
                                        Solicitante: {selectedTask.requester?.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma tarefa selecionada</p>
                        </div>
                    )}
                </Card>

                {/* Observações Gerais */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Observações Gerais da Entrega</h3>
                        {canEdit && notes !== originalNotes && (
                            <Button
                                onClick={async () => {
                                    if (!delivery) return;
                                    try {
                                        setSavingNotes(true);
                                        await deliveryService.updateNotes(delivery.id, notes);
                                        setOriginalNotes(notes);
                                        toast.success('Observações salvas com sucesso!');
                                    } catch (error) {
                                        console.error('Erro ao salvar observações:', error);
                                        toast.error('Erro ao salvar observações');
                                    } finally {
                                        setSavingNotes(false);
                                    }
                                }}
                                disabled={savingNotes}
                                size="sm"
                            >
                                {savingNotes ? 'Salvando...' : 'Salvar'}
                            </Button>
                        )}
                    </div>
                    <div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            readOnly={!canEdit}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
                                !canEdit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                            }`}
                            placeholder={canEdit ? "Digite observações gerais sobre esta entrega..." : "Nenhuma observação registrada"}
                        />
                    </div>
                </Card>

                {/* Itens de Entrega */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">
                            {selectedTask?.flowType === 'OPERACIONAL'
                                ? `Itens Operacionais (${operationalItems.length})`
                                : `Itens de Entrega (${deliveryItems.length})`
                            }
                        </h3>
                        {canEdit && selectedTask && (
                            <Button
                                onClick={selectedTask.flowType === 'OPERACIONAL'
                                    ? handleAddOperationalItem
                                    : () => setShowProjectModal(true)
                                }
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {selectedTask.flowType === 'OPERACIONAL'
                                    ? 'Adicionar Item Operacional'
                                    : 'Adicionar Projetos'
                                }
                            </Button>
                        )}
                    </div>

                    {/* Renderização Condicional: Itens Operacionais */}
                    {selectedTask?.flowType === 'OPERACIONAL' ? (
                        operationalItems.length === 0 ? (
                            <div className="text-center py-12">
                                <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                    Nenhum item operacional
                                </h4>
                                <p className="text-gray-500 mb-4">
                                    Adicione itens operacionais para esta entrega
                                </p>
                                {canEdit && (
                                    <Button onClick={handleAddOperationalItem}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar Item Operacional
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {operationalItems.map((item) => (
                                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                                        <DeliveryOperationalItemForm
                                            initialData={item}
                                            onSave={(data) => handleSaveOperationalItem(item.id, data)}
                                            onDelete={() => handleDeleteOperationalItemClick(item)}
                                            isReadOnly={!canEdit}
                                        />
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Renderização Original: Itens de Desenvolvimento */
                        deliveryItems.length === 0 ? (
                            <div className="text-center py-12">
                                <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                    Nenhum item de entrega
                                </h4>
                                <p className="text-gray-500 mb-4">
                                    Adicione projetos para criar itens de entrega
                                </p>
                                {canEdit && (
                                    <Button onClick={() => setShowProjectModal(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar Projetos
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {deliveryItems.map((item) => {
                                    const project = selectedProjects.find(p => p.id === item.projectId);
                                    const formData = itemsFormData.get(item.id);

                                    if (!project) return null;

                                    return (
                                        <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-150">
                                            <DeliveryItemForm
                                                project={project}
                                                initialData={formData}
                                                onSave={(data) => handleSaveItemData(item.id, data)}
                                                isReadOnly={!canEdit}
                                                customActions={
                                                    canDelete ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setItemToDelete(item);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                            title={`Remover ${project.name}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : undefined
                                                }
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </Card>

            </div>

            {/* Modais */}

            {showProjectModal && (
                <ProjectSelectionModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    onProjectsSelect={handleAddProjects}
                />
            )}

            {showDeleteModal && itemToDelete && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteItem}
                    title="Remover Item de Entrega"
                    message={`Tem certeza que deseja remover este item de entrega? Esta ação não pode ser desfeita.`}
                />
            )}

            {/* Modal de confirmação para excluir item operacional */}
            <DeleteConfirmationModal
                isOpen={showDeleteOperationalModal}
                onClose={() => {
                    setShowDeleteOperationalModal(false);
                    setOperationalItemToDelete(null);
                }}
                onConfirm={handleConfirmDeleteOperationalItem}
                title="Excluir Item Operacional"
                itemName={operationalItemToDelete?.title}
            />
        </div>
    );
};

export default DeliveryEdit;