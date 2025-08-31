import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Check, FileText, FolderOpen, ExternalLink, Plus } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DeliveryForm from '../../components/forms/DeliveryForm';
import toast from 'react-hot-toast';

interface Task {
    id: number;
    title: string;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

interface Project {
    id: number;
    name: string;
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

const DeliveryCreate = () => {
    const navigate = useNavigate();
    const { createDelivery } = useDeliveries();
    const [loading, setLoading] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Hook para gerenciar tasks paginados
    const {
        tasks,
        pagination: taskPagination,
        loading: loadingTasks,
        sorting: taskSorting,
        filters: taskFilters,
        setPage: setTaskPage,
        setPageSize: setTaskPageSize,
        setSorting: setTaskSorting,
        setFilter: setTaskFilter,
        clearFilters: clearTaskFilters
    } = useTasks({
        page: 0,
        size: 5,
        status: 'COMPLETED' // Apenas tarefas concluídas para entregas
    });

    // Hook para gerenciar projects paginados
    const {
        projects,
        pagination: projectPagination,
        loading: loadingProjects,
        sorting: projectSorting,
        filters: projectFilters,
        setPage: setProjectPage,
        setPageSize: setProjectPageSize,
        setSorting: setProjectSorting,
        setFilter: setProjectFilter,
        clearFilters: clearProjectFilters
    } = useProjects({
        page: 0,
        size: 5
    });

    const handleTaskSelect = (task: Task) => {
        setSelectedTask(task);
        setShowTaskModal(false);
    };

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
        setShowProjectModal(false);
    };

    const handleSubmit = async (data: any) => {
        if (!selectedTask) {
            toast.error('Selecione uma tarefa');
            return;
        }

        if (!selectedProject) {
            toast.error('Selecione um projeto');
            return;
        }

        try {
            setLoading(true);

            const deliveryData = {
                ...data,
                taskId: selectedTask.id,
                projectId: selectedProject.id
            };

            await createDelivery(deliveryData);
            toast.success('Entrega criada com sucesso!');
            navigate('/deliveries');
        } catch (error) {
            console.error('Erro ao criar entrega:', error);
            toast.error('Erro ao criar entrega');
        } finally {
            setLoading(false);
        }
    };


    // Helper functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            'PENDING': 'Pendente',
            'IN_PROGRESS': 'Em Progresso',
            'COMPLETED': 'Concluída',
            'CANCELLED': 'Cancelada',
            'ON_HOLD': 'Em Espera'
        };
        return labels[status] || status;
    };

    // Colunas para o DataTable de tasks
    const taskColumns: Column<Task>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '80px',
            mobileHidden: true,
            render: (item) => `#${item.id}`
        },
        {
            key: 'code',
            title: 'Código',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '100px',
            render: (item) => (
                <span className="font-mono text-xs sm:text-sm">{item.code}</span>
            )
        },
        {
            key: 'title',
            title: 'Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <div className="max-w-[120px] sm:max-w-xs truncate text-xs sm:text-sm">{item.title}</div>
            )
        },
        {
            key: 'actions',
            title: 'Ações',
            width: '90px',
            render: (item) => (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTaskSelect(item);
                    }}
                    className="inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                >
                    <Check className="w-3 h-3 mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Selecionar</span>
                </Button>
            )
        }
    ];

    // Colunas para o DataTable de projects
    const projectColumns: Column<Project>[] = [
        {
            key: 'name',
            title: 'Nome do Projeto',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <div className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{item.name}</div>
            )
        },
        {
            key: 'actions',
            title: 'Ações',
            width: '90px',
            render: (item) => (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleProjectSelect(item);
                    }}
                    className="inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                >
                    <Check className="w-3 h-3 mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Selecionar</span>
                </Button>
            )
        }
    ];


    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div className="space-y-3 sm:space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/deliveries')}
                    className="flex items-center text-sm sm:text-base"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nova Entrega</h1>
                    <p className="text-gray-600 text-sm sm:text-base mt-1">Crie uma nova entrega selecionando uma tarefa e projeto</p>
                </div>
            </div>

            <Card className="mx-2 sm:mx-0">
                <div className="px-3 sm:px-4 py-4 sm:py-5 md:px-6">
                    {/* Tarefa Selecionada */}
                    {selectedTask ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <h3 className="text-base sm:text-lg font-medium text-blue-900 flex items-center">
                                    <FileText className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                                    Tarefa Selecionada
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(true)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium self-start sm:self-center px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                    title="Alterar tarefa"
                                >
                                    Alterar
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="font-semibold text-blue-900 text-sm sm:text-base break-words">{selectedTask.title}</div>
                                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-blue-800">
                                    <span><strong>Código:</strong> {selectedTask.code}</span>
                                    <span><strong>Status:</strong> {getStatusLabel(selectedTask.status)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <FileText className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-gray-400" />
                                Selecione uma Tarefa
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowTaskModal(true)}
                                className="w-full px-3 sm:px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm sm:text-base"
                            >
                                <Plus className="w-4 sm:w-5 h-4 sm:h-5 mx-auto mb-2" />
                                Clique para selecionar uma tarefa
                            </button>
                        </div>
                    )}

                    {/* Projeto Selecionado */}
                    {selectedProject ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <h3 className="text-base sm:text-lg font-medium text-green-900 flex items-center">
                                    <FolderOpen className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                                    Projeto Selecionado
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowProjectModal(true)}
                                    className="text-green-600 hover:text-green-700 text-sm font-medium self-start sm:self-center px-2 py-1 rounded hover:bg-green-100 transition-colors"
                                    title="Alterar projeto"
                                >
                                    Alterar
                                </button>
                            </div>
                            <div>
                                <div className="font-semibold text-green-900 text-sm sm:text-base break-words">{selectedProject.name}</div>
                                {selectedProject.repositoryUrl && (
                                    <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-1 sm:gap-2">
                                        <span className="text-xs sm:text-sm text-green-800">Repositório:</span>
                                        <a
                                            href={selectedProject.repositoryUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 flex items-center gap-1 break-all"
                                        >
                                            <ExternalLink className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                                            <span className="text-xs sm:text-sm">Ver repositório</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 flex items-center">
                                <FolderOpen className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-gray-400" />
                                Selecione um Projeto
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowProjectModal(true)}
                                className="w-full px-3 sm:px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm sm:text-base"
                            >
                                <Plus className="w-4 sm:w-5 h-4 sm:h-5 mx-auto mb-2" />
                                Clique para selecionar um projeto
                            </button>
                        </div>
                    )}

                    {/* Formulário de Entrega */}
                    <DeliveryForm
                        onCancel={() => navigate('/deliveries')}
                        onSubmit={handleSubmit}
                        loading={loading}
                        selectedTask={selectedTask}
                        selectedProject={selectedProject}
                    />
                </div>
            </Card>

            {/* Modal de Seleção de Tarefa */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col max-w-7xl mx-auto">
                        {/* Header do Modal */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="text-lg font-medium text-gray-900 truncate">Selecionar Tarefa</h3>
                                <p className="text-sm text-gray-500 hidden sm:block">Escolha uma tarefa para criar a entrega</p>
                            </div>
                            <button
                                onClick={() => setShowTaskModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            <DataTable
                                data={tasks}
                                columns={taskColumns}
                                loading={loadingTasks}
                                pagination={taskPagination}
                                sorting={taskSorting}
                                filters={taskFilters}
                                onPageChange={setTaskPage}
                                onPageSizeChange={setTaskPageSize}
                                onSort={setTaskSorting}
                                onFilter={setTaskFilter}
                                onClearFilters={clearTaskFilters}
                                emptyMessage="Nenhuma tarefa encontrada"
                                showColumnToggle={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Projeto */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col max-w-4xl mx-auto">
                        {/* Header do Modal */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="text-lg font-medium text-gray-900 truncate">Selecionar Projeto</h3>
                                <p className="text-sm text-gray-500 hidden sm:block">Escolha um projeto para criar a entrega</p>
                            </div>
                            <button
                                onClick={() => setShowProjectModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            <DataTable
                                data={projects}
                                columns={projectColumns}
                                loading={loadingProjects}
                                pagination={projectPagination}
                                sorting={projectSorting}
                                filters={projectFilters}
                                onPageChange={setProjectPage}
                                onPageSizeChange={setProjectPageSize}
                                onSort={setProjectSorting}
                                onFilter={setProjectFilter}
                                onClearFilters={clearProjectFilters}
                                emptyMessage="Nenhum projeto encontrado"
                                showColumnToggle={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryCreate;
