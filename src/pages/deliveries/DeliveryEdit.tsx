import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Eye, Package2 } from 'lucide-react';
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
import TaskSelectionModal from '../../components/deliveries/TaskSelectionModal';
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
    const [saving, setSaving] = useState(false);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
    const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<AvailableProject[]>([]);

    // Estados dos modais
    const [showTaskModal, setShowTaskModal] = useState(false);
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

            // 4. Inicializar dados dos formulários dos itens
            const initialFormData = new Map<number, DeliveryItemFormData>();
            const projectIds: number[] = [];

            for (const item of items) {
                initialFormData.set(item.projectId, {
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

            // 5. Carregar dados dos projetos para exibição
            if (projectIds.length > 0) {
                const projects = await projectService.getByIds(projectIds);
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

    const handleTaskChange = (task: AvailableTask) => {
        setSelectedTask(task);
        setShowTaskModal(false);
    };

    const handleSaveItemData = async (projectId: number, data: DeliveryItemFormData) => {
        const item = deliveryItems.find(item => item.projectId === projectId);
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

            // Atualizar dados locais
            const newFormData = new Map(itemsFormData);
            newFormData.set(projectId, data);
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
            setSaving(true);
            const newItems: DeliveryItem[] = [];

            // Criar novos itens para cada projeto selecionado
            for (const project of projects) {
                // Verificar se já existe item para este projeto
                const existingItem = deliveryItems.find(item => item.projectId === project.id);
                if (existingItem) continue;

                const newItem = await deliveryItemService.create({
                    deliveryId: delivery.id,
                    projectId: project.id,
                    status: 'PENDING'
                });

                newItems.push(newItem);

                // Inicializar dados do formulário
                const newFormData = new Map(itemsFormData);
                newFormData.set(project.id, {
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
            setSelectedProjects([...selectedProjects, ...projects]);
            setShowProjectModal(false);

            toast.success(`${newItems.length} item(s) adicionado(s) com sucesso!`);
        } catch (error) {
            console.error('Erro ao adicionar itens:', error);
            toast.error('Erro ao adicionar itens');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            await deliveryItemService.delete(itemToDelete.id);

            // Remover das listas locais
            setDeliveryItems(deliveryItems.filter(item => item.id !== itemToDelete.id));
            setSelectedProjects(selectedProjects.filter(p => p.id !== itemToDelete.projectId));

            // Remover dos dados do formulário
            const newFormData = new Map(itemsFormData);
            newFormData.delete(itemToDelete.projectId);
            setItemsFormData(newFormData);

            setShowDeleteModal(false);
            setItemToDelete(null);
            toast.success('Item removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            toast.error('Erro ao remover item');
        }
    };

    const handleSaveDelivery = async () => {
        if (!delivery || !selectedTask) {
            toast.error('Dados incompletos');
            return;
        }

        try {
            setSaving(true);

            // Atualizar dados básicos da entrega se a tarefa mudou
            if (delivery.taskId !== selectedTask.id) {
                const updateData: UpdateDeliveryData = {
                    taskId: selectedTask.id
                };
                await deliveryService.update(delivery.id, updateData);
            }

            toast.success('Entrega salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar entrega:', error);
            toast.error('Erro ao salvar entrega');
        } finally {
            setSaving(false);
        }
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
            <div className="max-w-4xl mx-auto space-y-6">
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

                    {canEdit && (
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleSaveDelivery}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Salvar Entrega
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Seleção de Tarefa */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Tarefa Associada</h3>
                        {canEdit && (
                            <Button
                                variant="outline"
                                onClick={() => setShowTaskModal(true)}
                            >
                                Alterar Tarefa
                            </Button>
                        )}
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
                                {selectedTask.amount && (
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Valor</div>
                                        <div className="font-medium text-green-600">
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL'
                                            }).format(selectedTask.amount)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma tarefa selecionada</p>
                            {canEdit && (
                                <Button
                                    className="mt-4"
                                    onClick={() => setShowTaskModal(true)}
                                >
                                    Selecionar Tarefa
                                </Button>
                            )}
                        </div>
                    )}
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
                                disabled={saving}
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
                            {selectedProjects.map((project) => {
                                const formData = itemsFormData.get(project.id);
                                const item = deliveryItems.find(item => item.projectId === project.id);
                                
                                if (!item) return null;

                                return (
                                    <div key={project.id} className="border border-gray-200 rounded-lg p-1">
                                        <div className="flex items-center justify-between p-3 bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {project.name}
                                                    </div>
                                                    {project.description && (
                                                        <div className="text-sm text-gray-600">
                                                            {project.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setItemToDelete(item);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <DeliveryItemForm
                                            project={project}
                                            initialData={formData}
                                            onSave={(data) => handleSaveItemData(project.id, data)}
                                            isReadOnly={!canEdit}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            {/* Modais */}
            {showTaskModal && (
                <TaskSelectionModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    onSelect={handleTaskChange}
                    selectedTaskId={selectedTask?.id}
                    allowDeliveryTasks={true} // Permitir tarefas que já têm entrega na edição
                />
            )}

            {showProjectModal && (
                <ProjectSelectionModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    onSelect={handleAddProjects}
                    selectedProjectIds={selectedProjects.map(p => p.id)}
                    excludeSelected={true}
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