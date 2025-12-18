import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FolderOpen, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    AvailableTask,
    AvailableProject,
    CreateDeliveryData,
    DeliveryItemFormData
} from '../../types/delivery.types';
import { deliveryService } from '../../services/deliveryService';
import { deliveryItemService } from '../../services/deliveryItemService';
import TaskSelectionModal from '../../components/deliveries/TaskSelectionModal';
import ProjectSelectionModal from '../../components/deliveries/ProjectSelectionModal';
import DeliveryItemForm from '../../components/deliveries/DeliveryItemForm';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RichTextEditor from '../../components/ui/RichTextEditor';


const DeliveryCreate: React.FC = () => {
    const navigate = useNavigate();

    const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
    const [selectedProjects, setSelectedProjects] = useState<AvailableProject[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [isCreating, setIsCreating] = useState(false);
    const [createdDeliveryId, setCreatedDeliveryId] = useState<number | null>(null);
    const [deliveryItems, setDeliveryItems] = useState<any[]>([]);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);

    const [itemsFormData, setItemsFormData] = useState<Map<number, DeliveryItemFormData>>(new Map());

    const handleTaskSelect = (task: AvailableTask) => {
        setSelectedTask(task);
        setShowTaskModal(false);
        toast.success(`Tarefa "${task.code}" selecionada`);
    };

    const handleProjectsSelect = (projects: AvailableProject[]) => {
        setSelectedProjects(projects);
        setShowProjectModal(false);
        if (projects.length > 0) {
            toast.success(`${projects.length} projeto${projects.length > 1 ? 's' : ''} selecionado${projects.length > 1 ? 's' : ''}`);
        }
    };

    const handleCreateDelivery = async () => {
        if (!selectedTask) {
            toast.error('Selecione uma tarefa primeiro');
            return;
        }

        setIsCreating(true);

        try {
            const deliveryData: CreateDeliveryData = {
                taskId: selectedTask.id,
                status: 'PENDING',
                notes: notes,
                items: selectedProjects.map(project => ({
                    projectId: project.id,
                    status: 'PENDING'
                }))
            };

            const createdDelivery = await deliveryService.create(deliveryData);
                
            setCreatedDeliveryId(createdDelivery.id);

            if (selectedProjects.length > 0) {
                const items = await deliveryItemService.getByDeliveryId(createdDelivery.id);
                setDeliveryItems(items);

                const initialFormData = new Map<number, DeliveryItemFormData>();
                items.forEach(item => {
                    const project = selectedProjects.find(p => p.id === item.projectId);
                    if (project) {
                        initialFormData.set(project.id, {
                            id: item.id,
                            deliveryId: item.deliveryId,
                            projectId: project.id,
                            projectName: project.name,
                            status: item.status,
                            branch: item.branch || '',
                            sourceBranch: item.sourceBranch || '',
                            pullRequest: item.pullRequest || '',
                            script: item.script || '',
                            startedAt: item.startedAt || '',
                            finishedAt: item.finishedAt || '',
                            notes: item.notes || ''
                        });
                    }
                });
                setItemsFormData(initialFormData);
            }

            toast.success('Entrega criada com sucesso!');

            if (selectedTask.flowType === 'OPERACIONAL') {
                toast.success('Agora você pode adicionar os itens operacionais!');
                navigate(`/deliveries/${createdDelivery.id}/edit`);
                return;
            }

        } catch (error) {
            console.error('Erro ao criar entrega:', error);
            toast.error('Erro ao criar entrega. Tente novamente.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveItemData = async (projectId: number, data: DeliveryItemFormData) => {
        const item = deliveryItems.find(item => item.projectId === projectId);
        if (!item) return;

        try {
            await deliveryItemService.update(item.id, {
                deliveryId: item.deliveryId,
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
            newFormData.set(projectId, {
                ...data,
                id: item.id,
                deliveryId: item.deliveryId
            });
            setItemsFormData(newFormData);

            toast.success(`Dados do projeto ${data.projectName} salvos com sucesso!`);

        } catch (error) {
            console.error('Erro ao salvar item:', error);
            toast.error('Erro ao salvar dados do projeto. Tente novamente.');
        }
    };

    const handleRemoveItem = async (projectId: number) => {
        const item = deliveryItems.find(item => item.projectId === projectId);
        if (!item) return;

        try {
            await deliveryItemService.delete(item.id);

            setDeliveryItems(prev => prev.filter(i => i.id !== item.id));
            setSelectedProjects(prev => prev.filter(p => p.id !== projectId));

            setItemsFormData(prev => {
                const newMap = new Map(prev);
                newMap.delete(projectId);
                return newMap;
            });

            toast.success('Item removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            toast.error('Erro ao remover item');
        }
    };

    const handleFinish = () => {
        toast.success('Entrega configurada com sucesso!');
        navigate('/deliveries');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/deliveries')}
                        className="flex items-center p-2 sm:px-3 sm:py-2"
                    >
                        <ArrowLeft className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nova Entrega</h1>
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <div className="px-4 py-5 sm:px-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tarefa <span className="text-red-500">*</span>
                            </label>

                            {selectedTask ? (
                                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package className="h-5 w-5 text-blue-600" />
                                                <h3 className="font-medium text-gray-900">{selectedTask.title}</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">{selectedTask.code}</p>
                                            {selectedTask.flowType && (
                                                <div className="mb-2">
                                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                                        selectedTask.flowType === 'OPERACIONAL'
                                                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                    }`}>
                                                        {selectedTask.flowType === 'OPERACIONAL' ? '⚙️ Operacional' : '💻 Desenvolvimento'}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedTask.requester && (
                                                <p className="text-sm text-gray-500">
                                                    Solicitante: {selectedTask.requester.name}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowTaskModal(true)}
                                            className="ml-2"
                                        >
                                            Alterar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(true)}
                                    className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-gray-400 text-gray-600 hover:text-gray-700"
                                >
                                    <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    <p>Clique para selecionar uma tarefa</p>
                                </button>
                            )}
                        </div>

                        {selectedTask?.flowType !== 'OPERACIONAL' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Projetos/Repositórios
                                </label>

                                {selectedProjects.length > 0 ? (
                                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                        <div className="space-y-2">
                                            {selectedProjects.map(project => (
                                                <div key={project.id} className="flex items-center gap-3">
                                                    <FolderOpen className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm font-medium text-gray-900">{project.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowProjectModal(true)}
                                            >
                                                Alterar Seleção
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowProjectModal(true)}
                                        className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-gray-400 text-gray-600 hover:text-gray-700"
                                    >
                                        <FolderOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                        <p>Clique para selecionar projetos (opcional)</p>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mb-6">
                            <RichTextEditor
                                label="Observações Gerais da Entrega"
                                value={notes}
                                onChange={setNotes}
                                placeholder="Digite observações gerais sobre esta entrega. Você pode colar imagens diretamente..."
                                minHeight="150px"
                                context="delivery-notes-create"
                            />
                        </div>

                        {!createdDeliveryId && (
                            <div className="pt-4 border-t border-gray-200">
                                <Button
                                    onClick={handleCreateDelivery}
                                    disabled={!selectedTask || isCreating}
                                    className="w-full"
                                >
                                    {isCreating ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Criando Entrega...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Criar Entrega
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {createdDeliveryId && selectedProjects.length > 0 && (
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Configurar Itens da Entrega
                        </h3>
                        <div className="space-y-6">
                            {selectedProjects.map(project => {
                                const formData = itemsFormData.get(project.id);
                                if (!formData) return null;

                                return (
                                    <DeliveryItemForm
                                        key={project.id}
                                        project={project}
                                        initialData={formData}
                                        onSave={(data) => handleSaveItemData(project.id, data)}
                                        customActions={
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveItem(project.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remover
                                            </Button>
                                        }
                                    />
                                );
                            })}
                        </div>
                    </Card>
                )}

                {createdDeliveryId && selectedProjects.length === 0 && (
                    <Card className="p-6 text-center">
                        <div className="space-y-4">
                            <Package className="mx-auto h-12 w-12 text-green-600" />
                            <div>
                                <h3 className="font-medium text-gray-900">
                                    Entrega criada com sucesso!
                                </h3>
                                <p className="text-sm text-gray-600">
                                    A entrega foi criada para a tarefa "{selectedTask?.code}" sem itens específicos.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {createdDeliveryId && (
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/deliveries')}
                            className="w-full sm:w-auto"
                        >
                            Ver Lista de Entregas
                        </Button>
                        
                        <Button
                            onClick={handleFinish}
                            className="w-full sm:w-auto"
                        >
                            Finalizar
                        </Button>
                    </div>
                )}

                <TaskSelectionModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    onTaskSelect={handleTaskSelect}
                />

                <ProjectSelectionModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    onProjectsSelect={handleProjectsSelect}
                    selectedTaskTitle={selectedTask?.title}
                />
            </div>
        </div>
    );
};

export default DeliveryCreate;