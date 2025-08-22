import React, { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, X, Check, FolderOpen, ExternalLink, Filter } from 'lucide-react';

import { useProjects } from '@/hooks/useProjects';
import DataTable, { Column } from '@/components/ui/DataTable';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
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
                                               loading = false,
                                           }) => {
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');

    // Hook padronizado como DeliveryCreate (com paginação, ordenação e filtros)
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
        clearFilters: clearProjectFilters,
    } = useProjects({
        page: 0,
        size: 8,
        sort: [{ field: 'name', direction: 'asc' }],
        filters: {},
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
            subTasks:
                initialData?.subTasks || [
                    {
                        title: '',
                        description: '',
                        amount: '',
                        status: 'PENDING',
                    },
                ],
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
    } = methods;

    // pré-carrega seleção (edição)
    useEffect(() => {
        if (initialData?.projects && Array.isArray(initialData.projects)) {
            setSelectedProjects(initialData.projects);
        } else if (initialData?.projectsIds?.length) {
            // se vier só os ids, mantém e seleciona quando aparecerem na lista
            setSelectedProjects((prev) => prev);
        }
    }, [initialData]);

    const createQuote = useWatch({ control, name: 'createQuote' });

    const handleFormSubmit = async (data: TaskData): Promise<void> => {
        const formattedData = {
            ...data,
            requesterId: initialData?.requesterId,
            projectsIds: selectedProjects.map((p) => p.id),
            subTasks: (data.subTasks || []).map((subTask: any) => ({
                ...subTask,
                amount: parseFloat(subTask.amount || '0'),
                taskId: initialData?.id || null,
            })),
        };

        await onSubmit(formattedData);
        if (!initialData?.id) {
            reset();
            setSelectedProjects([]);
        }
    };

    const toggleProject = (project: Project) => {
        setSelectedProjects((curr) => {
            const exists = curr.some((p) => p.id === project.id);
            if (exists) return curr.filter((p) => p.id !== project.id);
            return [...curr, project];
        });
    };

    const removeProject = (id: number) => {
        setSelectedProjects((curr) => curr.filter((p) => p.id !== id));
    };

    // filtragem rápida para os cards mobile (a DataTable já tem filtros por coluna)
    const filteredProjectsMobile = useMemo(
        () =>
            projects.filter(
                (p) =>
                    p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
                    p.repositoryUrl?.toLowerCase().includes(projectSearchTerm.toLowerCase())
            ),
        [projects, projectSearchTerm]
    );

    // colunas padronizadas + coluna de seleção múltipla
    const projectColumns: Column<Project>[] = [
        {
            key: 'select',
            title: '',
            width: '48px',
            align: 'center',
            render: (item) => {
                const checked = selectedProjects.some((p) => p.id === item.id);
                return (
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProject(item)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                );
            },
        },
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '80px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          #{item.id}
        </span>
            ),
        },
        {
            key: 'name',
            title: 'Nome',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '240px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900" title={item.name}>
            {item.name}
          </span>
                </div>
            ),
        },
        {
            key: 'repositoryUrl',
            title: 'Repositório',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '280px',
            hideable: true,
            render: (item) =>
                item.repositoryUrl ? (
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate max-w-[220px]">{item.repositoryUrl}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
    ];

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Progresso' },
        { value: 'COMPLETED', label: 'Concluída' },
        { value: 'CANCELLED', label: 'Cancelada' },
    ];

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            {...register('code')}
                            label="Código"
                            placeholder="Digite o código da tarefa"
                            error={errors.code?.message}
                            required
                        />

                        <Select {...register('status')} label="Status" error={errors.status?.message} required>
                            {statusOptions.map((option) => (
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                placeholder="Descreva a tarefa (opcional)&#10;Você pode usar múltiplas linhas..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                placeholder="Adicione notas sobre a tarefa (opcional)&#10;Máximo 256 caracteres..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                                maxLength={256}
                            />
                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
                        </div>

                        <Input
                            {...register('link')}
                            type="url"
                            label="Link da Tarefa"
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
                    </div>
                </div>

                {/* Subtarefas */}
                <div className="border-t pt-8">
                    <SubTaskForm />
                    {errors.subTasks && <p className="mt-2 text-sm text-red-600">{(errors as any).subTasks?.message}</p>}
                </div>

                {/* Configurações de Cotação - apenas criação */}
                {!initialData?.id && (
                    <div className="border-t pt-8">
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-6">Configurações de Cotação</h2>

                        <div className="space-y-6">
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

                            {/* Seleção de Projetos */}
                            {createQuote && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Projetos Associados</label>

                                    {/* Lista de selecionados */}
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
                                                            <span className="text-sm font-medium text-blue-900">{project.name}</span>
                                                            {project.repositoryUrl && (
                                                                <div className="text-xs text-blue-700">{project.repositoryUrl}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProject(project.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

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
                        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || loading}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" loading={isSubmitting || loading} disabled={isSubmitting || loading}>
                        {initialData?.id ? 'Atualizar' : 'Criar'} Tarefa
                    </Button>
                </div>
            </form>

            {/* Modal Seleção de Projetos (padronizado) */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-6xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Selecionar Projetos</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Escolha os projetos para associar à tarefa ({selectedProjects.length} selecionado
                                    {selectedProjects.length !== 1 ? 's' : ''})
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedProjects.length > 0 && (
                                    <Button size="sm" variant="primary" onClick={() => setShowProjectModal(false)}>
                                        Confirmar ({selectedProjects.length})
                                    </Button>
                                )}
                                <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Busca Mobile */}
                        <div className="lg:hidden p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar projeto..."
                                    value={projectSearchTerm}
                                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {/* Desktop - DataTable com filtros/ordenação/paginação */}
                            <div className="hidden lg:block h-full">
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
                                    hiddenColumns={['repositoryUrl']} // pode reexibir pelo toggle se habilitar
                                    rowClassName={(item: Project) =>
                                        selectedProjects.some((p) => p.id === item.id) ? 'bg-blue-50' : ''
                                    }
                                />
                            </div>

                            {/* Mobile - Cards com seleção múltipla */}
                            <div className="lg:hidden h-full overflow-y-auto">
                                {loadingProjects ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredProjectsMobile.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">Nenhum projeto encontrado</h3>
                                        <p className="text-gray-600">Tente ajustar sua busca.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {filteredProjectsMobile.map((project) => {
                                            const isSelected = selectedProjects.some((p) => p.id === project.id);
                                            return (
                                                <div
                                                    key={project.id}
                                                    onClick={() => toggleProject(project)}
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
                                                                    onChange={() => toggleProject(project)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                                <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                                                <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                                    {project.name}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Paginação Mobile */}
                                {projectPagination && projectPagination.totalPages > 1 && !projectSearchTerm && (
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setProjectPage(projectPagination.currentPage - 1)}
                                                disabled={projectPagination.currentPage <= 1}
                                            >
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-gray-600">
                        Página {projectPagination.currentPage} de {projectPagination.totalPages}
                      </span>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setProjectPage(projectPagination.currentPage + 1)}
                                                disabled={projectPagination.currentPage >= projectPagination.totalPages}
                                            >
                                                Próxima
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </FormProvider>
    );
};

export default TaskForm;
