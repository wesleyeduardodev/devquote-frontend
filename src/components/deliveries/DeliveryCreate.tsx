import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, Package, FolderOpen, Settings, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    AvailableTask,
    AvailableProject,
    DeliveryItemFormData,
    CreateDeliveryData,
    DeliveryCreationState
} from '../../types/delivery.types';
import { deliveryService } from '../../services/deliveryService';
import { deliveryItemService } from '../../services/deliveryItemService';
import TaskSelectionModal from './TaskSelectionModal';
import ProjectSelectionModal from './ProjectSelectionModal';
import DeliveryItemForm from './DeliveryItemForm';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DeliveryCreateProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeliveryCreate({ isOpen, onClose, onSuccess }: DeliveryCreateProps) {
    // Estado do fluxo de criação
    const [creationState, setCreationState] = useState<DeliveryCreationState>({
        step: 1,
        isLoading: false,
        selectedTask: null,
        selectedProjects: [],
        deliveryId: undefined,
        items: []
    });

    // Estados dos modais
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);

    // Dados dos formulários de itens
    const [itemsFormData, setItemsFormData] = useState<Map<number, DeliveryItemFormData>>(new Map());

    // Resetar estado ao abrir/fechar modal
    React.useEffect(() => {
        if (isOpen) {
            // Começar sempre do passo 1
            setCreationState({
                step: 1,
                isLoading: false,
                selectedTask: null,
                selectedProjects: [],
                deliveryId: undefined,
                items: []
            });
            setItemsFormData(new Map());
            setShowTaskModal(true); // Abrir modal de tarefa automaticamente
        }
    }, [isOpen]);

    // Handlers dos modais
    const handleTaskSelect = (task: AvailableTask) => {
        setCreationState(prev => ({
            ...prev,
            selectedTask: task,
            step: 2
        }));
        setShowTaskModal(false);
        setShowProjectModal(true); // Abrir modal de projeto automaticamente
    };

    const handleProjectsSelect = async (projects: AvailableProject[]) => {
        setCreationState(prev => ({
            ...prev,
            selectedProjects: projects,
            step: 3,
            isLoading: true
        }));
        setShowProjectModal(false);

        try {
            // Criar a entrega no backend
            if (!creationState.selectedTask) {
                throw new Error('Nenhuma tarefa selecionada');
            }

            const deliveryData: CreateDeliveryData = {
                taskId: creationState.selectedTask.id,
                status: 'PENDING',
                items: projects.map(project => ({
                    projectId: project.id,
                    status: 'PENDING'
                }))
            };

            const createdDelivery = await deliveryService.create(deliveryData);
            
            // Buscar itens criados
            const items = await deliveryItemService.getByDeliveryId(createdDelivery.id);

            setCreationState(prev => ({
                ...prev,
                deliveryId: createdDelivery.id,
                items: items,
                step: 4,
                isLoading: false
            }));

            // Inicializar dados dos formulários
            const initialFormData = new Map<number, DeliveryItemFormData>();
            items.forEach(item => {
                const project = projects.find(p => p.id === item.projectId);
                if (project) {
                    initialFormData.set(project.id, {
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

            toast.success('Entrega criada com sucesso! Agora preencha os detalhes por projeto.');

        } catch (error) {
            console.error('Erro ao criar entrega:', error);
            toast.error('Erro ao criar entrega. Tente novamente.');
            setCreationState(prev => ({
                ...prev,
                isLoading: false,
                step: 2 // Voltar para seleção de projetos
            }));
            setShowProjectModal(true);
        }
    };

    // Salvar dados de um item
    const handleSaveItemData = async (projectId: number, data: DeliveryItemFormData) => {
        const item = creationState.items.find(item => item.projectId === projectId);
        if (!item) return;

        try {
            await deliveryItemService.update(item.id, {
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

            toast.success(`Dados do projeto ${data.projectName} salvos com sucesso!`);

        } catch (error) {
            console.error('Erro ao salvar item:', error);
            toast.error('Erro ao salvar dados do projeto. Tente novamente.');
        }
    };

    // Finalizar criação
    const handleFinishCreation = () => {
        toast.success('Entrega criada com sucesso!');
        onSuccess();
        onClose();
    };

    // Voltar ao passo anterior
    const handlePreviousStep = () => {
        if (creationState.step === 2) {
            setCreationState(prev => ({ ...prev, step: 1 }));
            setShowTaskModal(true);
        } else if (creationState.step === 3) {
            setCreationState(prev => ({ ...prev, step: 2 }));
            setShowProjectModal(true);
        }
        // Passo 4 não pode voltar (entrega já foi criada)
    };

    // Indicador de progresso
    const ProgressIndicator = () => {
        const steps = [
            { number: 1, label: 'Tarefa', icon: Package, completed: creationState.step > 1 },
            { number: 2, label: 'Projetos', icon: FolderOpen, completed: creationState.step > 2 },
            { number: 3, label: 'Criação', icon: Save, completed: creationState.step > 3 },
            { number: 4, label: 'Detalhes', icon: Settings, completed: false }
        ];

        return (
            <div className="flex items-center justify-center mb-6">
                {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                        <div className={`flex items-center flex-col ${
                            creationState.step >= step.number ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${
                                step.completed 
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : creationState.step === step.number
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-300'
                            }`}>
                                {step.completed ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <step.icon className="h-4 w-4" />
                                )}
                            </div>
                            <span className="text-xs font-medium">{step.label}</span>
                        </div>
                        
                        {index < steps.length - 1 && (
                            <ArrowRight className={`h-4 w-4 mx-4 mt-1 ${
                                creationState.step > step.number ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
            
            {/* Modal Principal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Nova Entrega
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        
                        <ProgressIndicator />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                        {creationState.step === 3 && creationState.isLoading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 text-gray-600">Criando entrega...</p>
                                <p className="text-sm text-gray-500">
                                    Salvando tarefa e criando itens para os projetos selecionados
                                </p>
                            </div>
                        )}

                        {creationState.step === 4 && (
                            <div className="p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Preencha os Detalhes por Projeto
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Tarefa:</strong> [{creationState.selectedTask?.code}] {creationState.selectedTask?.title}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Configure os detalhes técnicos para cada repositório/projeto onde você vai trabalhar.
                                        Você pode expandir cada projeto e preencher as informações conforme for desenvolvendo.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {creationState.selectedProjects.map((project) => {
                                        const formData = itemsFormData.get(project.id);
                                        return (
                                            <DeliveryItemForm
                                                key={project.id}
                                                project={project}
                                                initialData={formData}
                                                onSave={(data) => handleSaveItemData(project.id, data)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {creationState.step === 4 && (
                                <>
                                    Entrega criada • {creationState.selectedProjects.length} projeto{creationState.selectedProjects.length !== 1 ? 's' : ''} configurado{creationState.selectedProjects.length !== 1 ? 's' : ''}
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {creationState.step > 1 && creationState.step < 4 && (
                                <Button
                                    variant="outline"
                                    onClick={handlePreviousStep}
                                    disabled={creationState.isLoading}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Voltar
                                </Button>
                            )}
                            
                            {creationState.step === 4 && (
                                <Button
                                    onClick={handleFinishCreation}
                                >
                                    Concluir Criação
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals de seleção */}
            <TaskSelectionModal
                isOpen={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    if (creationState.step === 1) {
                        onClose(); // Fechar modal principal se cancelar na primeira etapa
                    }
                }}
                onTaskSelect={handleTaskSelect}
            />

            <ProjectSelectionModal
                isOpen={showProjectModal}
                onClose={() => {
                    setShowProjectModal(false);
                    // Não fechar o modal principal, apenas voltar ao passo anterior
                }}
                onProjectsSelect={handleProjectsSelect}
                selectedTaskTitle={creationState.selectedTask?.title}
            />
        </>
    );
}