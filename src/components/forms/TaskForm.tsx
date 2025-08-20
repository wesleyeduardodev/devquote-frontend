import React, { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, X, Check, FolderOpen, ExternalLink } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SubTaskForm from './SubTaskForm';

interface SubTask {
    title: string;
    description?: string;
    amount: string;
    status: string;
    taskId?: number | null;
    excluded?: boolean;
}

interface TaskData {
    requesterId: number;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    createQuote?: boolean;
    linkQuoteToBilling?: boolean;
    projectsIds?: number[];
    subTasks?: any[];
}

interface TaskFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

interface Project {
    id: number;
    name: string;
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

const schema = yup.object({
    title: yup.string().required('Título é obrigatório').max(200, 'Máximo 200 caracteres'),
    description: yup.string().optional(),
    status: yup.string().required('Status é obrigatório'),
    code: yup.string().required('Código é obrigatório').max(50, 'Máximo 50 caracteres'),
    link: yup.string().url('URL inválida').optional(),
    meetingLink: yup.string().url('URL inválida').max(500, 'Máximo 500 caracteres').optional(),
    notes: yup.string().max(256, 'Máximo 256 caracteres').optional(),
    createQuote: yup.boolean().optional(),
    linkQuoteToBilling: yup.boolean().optional(),
    projectsIds: yup.array().of(yup.number()).optional(),
    subTasks: yup.array().optional(),
});

const TaskForm: React.FC<TaskFormProps> = ({
                                               initialData = null,
                                               onSubmit,
                                               onCancel,
                                               loading = false
                                           }) => {
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Hook para gerenciar projects
    const {
        projects,
        pagination,
        loading: loadingProjects,
        setPage
    } = useProjects({
        page: 0,
        size: 20,
        sort: [{ field: 'name', direction: 'asc' }],
        filters: {}
    });

    const methods = useForm<TaskData>({
        resolver: yupResolver(schema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            status: initialData?.status || 'PENDING',
            code: initialData?.code || '',
            link: initialData?.link || '',
            meetingLink: initialData?.meetingLink || '',
            notes: initialData?.notes || '',
            createQuote: initialData?.createQuote || false,
            linkQuoteToBilling: initialData?.linkQuoteToBilling || false,
            projectsIds: initialData?.projectsIds || [],
            subTasks: initialData?.subTasks || [{
                title: '',
                description: '',
                amount: '',
                status: 'PENDING'
            }],
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
        setValue
    } = methods;

    // Watch createQuote para mostrar/esconder modal de projetos
    const createQuote = useWatch({
        control,
        name: 'createQuote'
    });

    const handleFormSubmit = async (data: TaskData): Promise<void> => {
        try {
            // Incluir o requesterId do initialData (que vem da seleção do modal)
            const formattedData = {
                ...data,
                requesterId: initialData?.requesterId, // Vem da seleção no modal
                projectsIds: selectedProjects.map(p => p.id),
                subTasks: (data.subTasks || []).map((subTask: any) => ({
                    ...subTask,
                    amount: parseFloat(subTask.amount || '0'),
                    taskId: initialData?.id || null
                }))
            };

            await onSubmit(formattedData);
            if (!initialData?.id) {
                reset(); // Reset form only for create mode
                setSelectedProjects([]);
            }
        } catch (error) {
            // Error is handled by the parent component
        }
    };

    const handleProjectToggle = (project: Project) => {
        const isSelected = selectedProjects.find(p => p.id === project.id);
        if (isSelected) {
            setSelectedProjects(selectedProjects.filter(p => p.id !== project.id));
        } else {
            setSelectedProjects([...selectedProjects, project]);
        }
    };

    const handleProjectRemove = (projectId: number) => {
        setSelectedProjects(selectedProjects.filter(p => p.id !== projectId));
    };

    // Filtrar projects para o modal
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.repositoryUrl?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Progresso' },
        { value: 'COMPLETED', label: 'Concluída' },
        { value: 'CANCELLED', label: 'Cancelada' }
    ];

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                {/* Informações da Tarefa */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                        Informações da Tarefa
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            {...register('code')}
                            label="Código"
                            placeholder="Digite o código da tarefa"
                            error={errors.code?.message}
                            required
                        />

                        <Select
                            {...register('status')}
                            label="Status"
                            error={errors.status?.message}
                            required
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>

                        <div className="md:col-span-2">
                            <Input
                                {...register('title')}
                                label="Título"
                                placeholder="Digite o título da tarefa"
                                error={errors.title?.message}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                {...register('description')}
                                label="Descrição"
                                placeholder="Descreva a tarefa (opcional)"
                                error={errors.description?.message}
                            />
                        </div>

                        <Input
                            {...register('link')}
                            type="url"
                            label="Link"
                            placeholder="https://exemplo.com (opcional)"
                            error={errors.link?.message}
                        />

                        <Input
                            {...register('meetingLink')}
                            type="url"
                            label="Link da Reunião"
                            placeholder="https://meet.google.com/... (opcional)"
                            error={errors.meetingLink?.message}
                        />

                        <div className="md:col-span-2">
                            <Input
                                {...register('notes')}
                                label="Notas"
                                placeholder="Adicione notas sobre a tarefa (opcional)"
                                error={errors.notes?.message}
                            />
                        </div>
                    </div>
                </div>

                {/* Subtarefas */}
                <div className="border-t pt-8">
                    <SubTaskForm />
                    {errors.subTasks && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.subTasks.message}
                        </p>
                    )}
                </div>

                {/* Configurações de Cotação - Apenas no modo de criação */}
                {!initialData?.id && (
                    <div className="border-t pt-8">
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-6">
                            Configurações de Cotação
                        </h2>

                        <div className="space-y-6">
                            {/* Checkbox para criar cotação */}
                            <div className="flex items-center">
                                <input
                                    {...register('createQuote')}
                                    type="checkbox"
                                    id="createQuote"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="createQuote" className="ml-2 block text-sm text-gray-900">
                                    Criar cotação para esta tarefa
                                </label>
                            </div>

                            {createQuote && (
                                <div className="flex items-center">
                                    <input
                                        {...register('linkQuoteToBilling')}
                                        type="checkbox"
                                        id="linkQuoteToBilling"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="linkQuoteToBilling" className="ml-2 block text-sm text-gray-900">
                                        Vincular cotação ao faturamento
                                    </label>
                                </div>
                            )}

                            {/* Seleção de Projetos - só aparece se createQuote estiver marcado */}
                            {createQuote && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Projetos Associados
                                    </label>

                                    {/* Projetos Selecionados */}
                                    {selectedProjects.length > 0 && (
                                        <div className="space-y-2">
                                            {selectedProjects.map((project) => (
                                                <div
                                                    key={project.id}
                                                    className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FolderOpen className="w-4 h-4 text-blue-600" />
                                                        <div>
                                                            <span className="text-sm font-medium text-blue-900">
                                                                {project.name}
                                                            </span>
                                                            {project.repositoryUrl && (
                                                                <div className="text-xs text-blue-700">
                                                                    {project.repositoryUrl}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProjectRemove(project.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Botão para adicionar projeto */}
                                    <button
                                        type="button"
                                        onClick={() => setShowProjectModal(true)}
                                        className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <Search className="w-4 h-4 mx-auto mb-1" />
                                        Clique para adicionar projetos
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isSubmitting || loading}
                        >
                            Cancelar
                        </Button>
                    )}

                    <Button
                        type="submit"
                        loading={isSubmitting || loading}
                        disabled={isSubmitting || loading}
                    >
                        {initialData?.id ? 'Atualizar' : 'Criar'} Tarefa
                    </Button>
                </div>
            </form>

            {/* Modal de Seleção de Projetos */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-4xl">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    Selecionar Projetos
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Escolha os projetos para associar à tarefa ({selectedProjects.length} selecionado{selectedProjects.length !== 1 ? 's' : ''})
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedProjects.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => setShowProjectModal(false)}
                                    >
                                        Confirmar ({selectedProjects.length})
                                    </Button>
                                )}
                                <button
                                    onClick={() => setShowProjectModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Busca e Controles */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Buscar projeto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                    />
                                </div>
                                {selectedProjects.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setSelectedProjects([])}
                                        className="whitespace-nowrap"
                                    >
                                        Limpar Seleção
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="flex-1 overflow-hidden">
                            {/* Desktop - Tabela com seleção múltipla */}
                            <div className="hidden lg:block h-full">
                                {loadingProjects ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredProjects.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                                            Nenhum projeto encontrado
                                        </h3>
                                        <p className="text-gray-600">
                                            Tente ajustar sua busca.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-full overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={filteredProjects.length > 0 && filteredProjects.every(p => selectedProjects.some(sp => sp.id === p.id))}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const newSelections = filteredProjects.filter(p => !selectedProjects.some(sp => sp.id === p.id));
                                                                setSelectedProjects([...selectedProjects, ...newSelections]);
                                                            } else {
                                                                const filteredIds = new Set(filteredProjects.map(p => p.id));
                                                                setSelectedProjects(selectedProjects.filter(p => !filteredIds.has(p.id)));
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Nome do Projeto
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    URL do Repositório
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredProjects.map((project) => {
                                                const isSelected = selectedProjects.some(p => p.id === project.id);
                                                return (
                                                    <tr
                                                        key={project.id}
                                                        onClick={() => handleProjectToggle(project)}
                                                        className={`cursor-pointer hover:bg-gray-50 ${
                                                            isSelected ? 'bg-blue-50' : ''
                                                        }`}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleProjectToggle(project)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                                    #{project.id}
                                                                </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                                                <span className="font-medium text-gray-900">
                                                                        {project.name}
                                                                    </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {project.repositoryUrl ? (
                                                                <div className="flex items-center gap-2">
                                                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm text-gray-600 truncate max-w-xs">
                                                                            {project.repositoryUrl}
                                                                        </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Mobile - Cards com seleção múltipla */}
                            <div className="lg:hidden h-full overflow-y-auto">
                                {loadingProjects ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredProjects.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                                            Nenhum projeto encontrado
                                        </h3>
                                        <p className="text-gray-600">
                                            Tente ajustar sua busca.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {filteredProjects.map((project) => {
                                            const isSelected = selectedProjects.some(p => p.id === project.id);
                                            return (
                                                <div
                                                    key={project.id}
                                                    onClick={() => handleProjectToggle(project)}
                                                    className={`rounded-lg border p-4 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleProjectToggle(project)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                                <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                                                <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                                    {project.name}
                                                                </h3>
                                                            </div>

                                                            {project.repositoryUrl && (
                                                                <div className="flex items-center gap-2 text-sm ml-6">
                                                                    <ExternalLink className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                                                                    <span className={`truncate ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                                                        {project.repositoryUrl}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Paginação Mobile */}
                                {pagination && pagination.totalPages > 1 && !searchTerm && (
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage <= 1}
                                            >
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-gray-600">
                                                Página {pagination.currentPage} de {pagination.totalPages}
                                            </span>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.currentPage + 1)}
                                                disabled={pagination.currentPage >= pagination.totalPages}
                                            >
                                                Próxima
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Paginação Desktop */}
                            {pagination && pagination.totalPages > 1 && !searchTerm && (
                                <div className="hidden lg:block p-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setPage(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage <= 1}
                                        >
                                            Anterior
                                        </Button>

                                        <span className="text-sm text-gray-600">
                                            Página {pagination.currentPage} de {pagination.totalPages}
                                        </span>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setPage(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage >= pagination.totalPages}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </FormProvider>
    );
};

export default TaskForm;