import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Eye, Package2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { deliveryService } from '../../services/deliveryService';
import { deliveryItemService } from '../../services/deliveryItemService';
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
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DeliveryItemForm from '../../components/deliveries/DeliveryItemForm';
import ProjectSelectionModal from '../../components/deliveries/ProjectSelectionModal';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const DeliveryEdit: React.FC = () => {
    const { deliveryId } = useParams<{ deliveryId: string }>();
    const navigate = useNavigate();
    const { hasProfile } = useAuth();

    // Permissões
    const isAdmin = hasProfile('ADMIN');
    const isManager = hasProfile('MANAGER');
    const canEdit = isAdmin || isManager;
    const canDelete = isAdmin;

    // Estados principais
    const [loading, setLoading] = useState(true);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
    const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<AvailableProject[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [originalNotes, setOriginalNotes] = useState<string>('');
    const [savingNotes, setSavingNotes] = useState(false);

    // Estados dos modais
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DeliveryItem | null>(null);

    // Estados dos formulários
    const [itemsFormData, setItemsFormData] = useState<Map<number, DeliveryItemFormData>>(new Map());

    // Carregar dados da entrega
    useEffect(() => {
        if (deliveryId) {
            loadDeliveryData();
        }
    }, [deliveryId]);

    const loadDeliveryData = async () => {
        setLoading(true);
        try {
            // 1. Carregar dados básicos da entrega
            const deliveryData = await deliveryService.getById(parseInt(deliveryId));
            setDelivery(deliveryData);
            const initialNotes = deliveryData.notes || '';
            setNotes(initialNotes);
            setOriginalNotes(initialNotes);

            // 2. Carregar dados da tarefa associada
            if (deliveryData.taskId) {
                const taskData = await taskService.getById(deliveryData.taskId);
                setSelectedTask({
                    id: taskData.id,
                    title: taskData.title,
                    code: taskData.code,
                    amount: taskData.amount,
                    requester: {
                        id: taskData.requesterId,
                        name: taskData.requesterName
                    },
                    hasDelivery: true
                });
            }

            // 3. Carregar itens da entrega
            const items = await deliveryItemService.getByDeliveryId(deliveryData.id);
            setDeliveryItems(items);

            // 4. Inicializar dados dos formulários dos itens (usando item.id como chave para suportar projetos repetidos)
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
                    startedAt: item.startedAt || '',
                    finishedAt: item.finishedAt || '',
                    notes: item.notes || ''
                });
                projectIds.push(item.projectId);
            }
            setItemsFormData(initialFormData);

            // 5. Carregar dados dos projetos únicos para exibição
            if (projectIds.length > 0) {
                const uniqueProjectIds = Array.from(new Set(projectIds));
                const projects = await projectService.getByIds(uniqueProjectIds);
                setSelectedProjects(projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description
                })));
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

            // Atualizar dados locais (usando itemId como chave para suportar projetos repetidos)
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

            // Criar novos itens para cada projeto selecionado (permitindo projetos repetidos)
            for (const project of projects) {
                const newItem = await deliveryItemService.create({
                    deliveryId: delivery.id,
                    projectId: project.id,
                    status: 'PENDING'
                });

                newItems.push(newItem);

                // Inicializar dados do formulário (usando item.id como chave para suportar projetos repetidos)
                const newFormData = new Map(itemsFormData);
                newFormData.set(newItem.id, {
                    id: newItem.id,
                    deliveryId: newItem.deliveryId,
                    projectId: newItem.projectId,
                    projectName: project.name,
                    status: 'PENDING',
                    branch: '',
                    sourceBranch: '',
                    pullRequest: '',
                    script: '',
                    startedAt: '',
                    finishedAt: '',
                    notes: ''
                });
                setItemsFormData(newFormData);
            }

            // Atualizar listas locais
            setDeliveryItems([...deliveryItems, ...newItems]);

            // Adicionar projetos únicos ao selectedProjects (se ainda não existirem)
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

            // Remover item da lista
            const updatedItems = deliveryItems.filter(item => item.id !== itemToDelete.id);
            setDeliveryItems(updatedItems);

            // Remover projeto apenas se não houver outros itens usando o mesmo projeto
            const stillHasProject = updatedItems.some(item => item.projectId === itemToDelete.projectId);
            if (!stillHasProject) {
                setSelectedProjects(selectedProjects.filter(p => p.id !== itemToDelete.projectId));
            }

            // Remover dos dados do formulário (usando item.id como chave)
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

    // Funções auxiliares para formatação
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
                                    <div className="text-sm text-gray-500 mt-1">
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
                                        await deliveryService.update(delivery.id, {
                                            taskId: delivery.taskId,
                                            notes: notes
                                        });
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
                            Itens de Entrega ({deliveryItems.length})
                        </h3>
                        {canEdit && (
                            <Button
                                onClick={() => setShowProjectModal(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Projetos
                            </Button>
                        )}
                    </div>

                    {deliveryItems.length === 0 ? (
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
        </div>
    );
};

export default DeliveryEdit;