import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, X, Check, FolderOpen, ExternalLink, Filter } from 'lucide-react';

import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import SubTaskForm from './SubTaskForm';

interface SubTask {
    title: string;
    description?: string;
    amount: string;
    taskId?: number | null;
    excluded?: boolean;
}

interface TaskData {
    requesterId: number;
    title: string;
    description?: string;
    code: string;
    link?: string;
    meetingLink?: string;
    notes?: string;
    hasSubTasks?: boolean;
    amount?: string;
    taskType?: string;
    serverOrigin?: string;
    systemModule?: string;
    priority?: string;
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
    code: yup.string().required('Código é obrigatório').max(50, 'Máximo 50 caracteres'),
    requesterId: yup.mixed().required('Solicitante é obrigatório'),
    link: yup.string().url('URL inválida').optional(),
    meetingLink: yup.string().url('URL inválida').max(500, 'Máximo 500 caracteres').optional(),
    notes: yup.string().max(256, 'Máximo 256 caracteres').optional(),
    hasSubTasks: yup.boolean().optional(),
    amount: yup.string().optional(),
    taskType: yup.string().optional(),
    serverOrigin: yup.string().max(100, 'Máximo 100 caracteres').optional(),
    systemModule: yup.string().max(100, 'Máximo 100 caracteres').optional(),
    priority: yup.string().required('Prioridade é obrigatória'),
    projectsIds: yup.array().of(yup.number()).optional(),
    subTasks: yup.array().optional(),
});

const TaskForm: React.FC<TaskFormProps> = ({
                                               initialData = null,
                                               onSubmit,
                                               onCancel,
                                               loading = false,
                                           }) => {
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');

    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [createDeliveries, setCreateDeliveries] = useState(false);
    const [linkTaskToBilling, setLinkTaskToBilling] = useState(false);

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
            code: initialData?.code || '',
            link: initialData?.link || '',
            meetingLink: initialData?.meetingLink || '',
            notes: initialData?.notes || '',
            hasSubTasks: initialData?.hasSubTasks !== undefined ? initialData.hasSubTasks : false,
            amount: initialData?.amount || '',
            taskType: initialData?.taskType || '',
            serverOrigin: initialData?.serverOrigin || '',
            systemModule: initialData?.systemModule || '',
            priority: initialData?.priority || 'MEDIUM',
            projectsIds: initialData?.projectsIds || [],
            subTasks:
                initialData?.subTasks || [
                    {
                        title: '',
                        description: '',
                        amount: '',
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

    const hasSubTasks = useWatch({ control, name: 'hasSubTasks' });
    const watchSubTasks = useWatch({ control, name: 'subTasks' });

    // Estado para controlar mensagem de erro
    const [subTaskError, setSubTaskError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Validação quando tentar desmarcar a flag com subtarefas existentes
    const handleHasSubTasksChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;

        // Se está tentando desmarcar e existem subtarefas não excluídas
        if (!isChecked && initialData?.id && watchSubTasks) {
            const activeSubTasks = watchSubTasks.filter((st: any) => !st?.excluded);
            if (activeSubTasks.length > 0) {
                setSubTaskError('Para desmarcar esta opção, você precisa remover todas as subtarefas primeiro e depois atualizar a tarefa.');
                // Mantém o checkbox marcado
                setTimeout(() => {
                    methods.setValue('hasSubTasks', true);
                }, 0);
                return;
            }
        }

        setSubTaskError(null);
        methods.setValue('hasSubTasks', isChecked);
    }, [initialData?.id, watchSubTasks, methods]);

    const handleFormSubmit = async (data: TaskData): Promise<void> => {
        try {
            // Limpa erros anteriores
            setSubTaskError(null);
            setFormError(null);

            // Validação customizada para subtarefas
            if (data.hasSubTasks) {
                if (!data.subTasks || data.subTasks.length === 0) {
                    setFormError('Quando "Esta tarefa possui subtarefas" estiver marcado, você deve adicionar pelo menos uma subtarefa.');
                    const formElement = document.querySelector('form');
                    if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    return;
                }
                
                // Validar se cada subtarefa tem título preenchido
                const invalidSubtasks = data.subTasks
                    .map((subTask: any, index: number) => ({
                        index: index + 1,
                        hasTitle: subTask.title && subTask.title.trim() !== ''
                    }))
                    .filter(st => !st.hasTitle);
                
                if (invalidSubtasks.length > 0) {
                    const errorMsg = invalidSubtasks.length === 1
                        ? `Subtarefa ${invalidSubtasks[0].index}: O título é obrigatório`
                        : `Subtarefas ${invalidSubtasks.map(st => st.index).join(', ')}: Os títulos são obrigatórios`;
                    
                    setFormError(errorMsg);
                    const formElement = document.querySelector('form');
                    if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    return;
                }
            }

            const formattedData = {
                ...data,
                requesterId: data.requesterId || initialData?.requesterId,
                projectsIds: selectedProjects.map((p) => p.id),
                createDeliveries: createDeliveries && selectedProjects.length > 0,
                linkTaskToBilling: linkTaskToBilling,
                amount: data.hasSubTasks ? undefined : (isAdmin ? parseFloat(data.amount || '0') : null),
                subTasks: data.hasSubTasks ? (data.subTasks || []).map((subTask: any) => ({
                    ...subTask,
                    amount: parseFloat(subTask.amount || '0'),
                    taskId: initialData?.id || null,
                })) : [],
            };

            await onSubmit(formattedData);
            
            // Só reseta se for uma criação bem-sucedida
            if (!initialData?.id) {
                reset();
                setSelectedProjects([]);
                setCreateDeliveries(false);
                setLinkTaskToBilling(false);
            }
        } catch (error: any) {
            console.error('Erro no formulário de tarefa:', error);
            
            // Captura erros relacionados às subtarefas
            if (error?.message && error.message.includes('Tem Subtarefas')) {
                setSubTaskError('Não é possível desmarcar "Tem Subtarefas" enquanto existirem subtarefas vinculadas. Remova todas as subtarefas primeiro.');
                // Volta o checkbox para marcado
                methods.setValue('hasSubTasks', true);
            } else if (error?.message && !error.message.includes('Requester not selected')) {
                // Mostra outros erros de API (exceto erro de requester que já é tratado no componente pai)
                let errorMessage = 'Erro ao processar solicitação';
                
                // Extrair mensagem detalhada do erro
                if (error.response?.data?.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.errors) {
                    // Erro de validação com múltiplos campos
                    const fieldErrors = error.response.data.errors
                        .map((err: any) => `${err.field}: ${err.message}`)
                        .join(', ');
                    errorMessage = `Campos inválidos: ${fieldErrors}`;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                setFormError(errorMessage);
                
                // Scroll para o topo para mostrar o erro
                const formElement = document.querySelector('form');
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // Re-lança o erro para ser tratado pelo componente pai (caso do requester)
                throw error;
            }
        }
    };

    const toggleProject = (project: Project) => {
        setSelectedProjects((curr) => {
            const exists = curr.some((p) => p.id === project.id);
            if (exists) return curr.filter((p) => p.id !== project.id);
            return [...curr, project];
        });
    };

    const toggleAllProjects = () => {
        const allSelected = projects.every(p => selectedProjects.some(sp => sp.id === p.id));
        if (allSelected) {
            // Deselecionar todos da página atual
            setSelectedProjects(curr =>
                curr.filter(sp => !projects.some(p => p.id === sp.id))
            );
        } else {
            // Selecionar todos da página atual que ainda não estão selecionados
            setSelectedProjects(curr => {
                const newSelections = projects.filter(p =>
                    !curr.some(sp => sp.id === p.id)
                );
                return [...curr, ...newSelections];
            });
        }
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
            headerRender: () => {
                const allSelected = projects.length > 0 && projects.every(p => selectedProjects.some(sp => sp.id === p.id));
                const someSelected = projects.some(p => selectedProjects.some(sp => sp.id === p.id));
                return (
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={toggleAllProjects}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    />
                );
            },
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
            width: '120px',
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
            render: (item) => (
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900" title={item.name}>
            {item.name}
          </span>
                </div>
            ),
        },
    ];


    const taskTypeOptions = [
        { value: '', label: 'Selecione...' },
        { value: 'BUG', label: '🐛 Bug' },
        { value: 'ENHANCEMENT', label: '📨 Melhoria' },
        { value: 'NEW_FEATURE', label: '✨ Nova Funcionalidade' },
    ];

    const priorityOptions = [
        { value: 'LOW', label: '🟢 Baixa' },
        { value: 'MEDIUM', label: '🟡 Média' },
        { value: 'HIGH', label: '🟠 Alta' },
        { value: 'URGENT', label: '🔴 Urgente' },
    ];

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                {/* Exibição de erro geral */}
                {formError && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Erro ao processar solicitação</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{formError}</p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormError(null)}
                                        className="text-sm font-medium text-red-800 underline hover:text-red-900"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Campo hidden para requesterId */}
                <input {...register('requesterId')} type="hidden" />
                
                {/* Informações Básicas */}
                <div className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            {...register('code')}
                            label="Código"
                            placeholder="Digite o código da tarefa"
                            error={errors.code?.message}
                            required
                        />

                        <Select {...register('priority')} label="Prioridade" error={errors.priority?.message} required>
                            {priorityOptions.map((option) => (
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select {...register('taskType')} label="Tipo de Tarefa" error={errors.taskType?.message}>
                            {taskTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>

                        <Input
                            {...register('systemModule')}
                            label="Módulo do Sistema"
                            placeholder="Ex: Autenticação, Relatórios, Dashboard..."
                            error={errors.systemModule?.message}
                        />
                    </div>

                    <Input
                        {...register('serverOrigin')}
                        label="Servidor de Origem"
                        placeholder="Ex: Produção, Homologação, Desenvolvimento..."
                        error={errors.serverOrigin?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            placeholder="Descreva a tarefa (opcional)&#10;Você pode usar múltiplas linhas..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                    </div>
                </div>

                {/* Links e Informações Adicionais */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div>
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
                </div>

                {/* Configuração de Subtarefas/Valor */}
                <div className="space-y-6">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center space-x-3">
                                <input
                                    {...register('hasSubTasks')}
                                    type="checkbox"
                                    id="hasSubTasks"
                                    onChange={handleHasSubTasksChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="hasSubTasks" className="text-sm font-medium text-gray-700">
                                    Esta tarefa possui subtarefas?
                                </label>
                            </div>
                            {subTaskError && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-600">{subTaskError}</p>
                                </div>
                            )}
                        </div>

                        {hasSubTasks ? (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Subtarefas</h3>
                                <SubTaskForm />
                                {errors.subTasks && <p className="mt-2 text-sm text-red-600">{(errors as any).subTasks?.message}</p>}
                            </div>
                        ) : (
                            isAdmin && (
                                <div>
                                    <Input
                                        {...register('amount')}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        label="Valor da Tarefa"
                                        placeholder="0.00"
                                        error={errors.amount?.message}
                                    />
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Configurações de Cotação - apenas criação e ADMIN */}
                {!initialData?.id && isAdmin && (
                    <div className="border-t pt-8">
                        <div className="space-y-6">
                            {/* Checkbox para criar entregas automaticamente */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="createDeliveries"
                                    checked={createDeliveries}
                                    onChange={(e) => {
                                        setCreateDeliveries(e.target.checked);
                                        // Limpa projetos selecionados ao desmarcar
                                        if (!e.target.checked) {
                                            setSelectedProjects([]);
                                        }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="createDeliveries" className="text-sm font-medium text-gray-700">
                                    Vincular projetos e criar entregas automaticamente
                                </label>
                            </div>

                            {/* Checkbox para vincular ao faturamento */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="linkTaskToBilling"
                                    checked={linkTaskToBilling}
                                    onChange={(e) => setLinkTaskToBilling(e.target.checked)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="linkTaskToBilling" className="text-sm font-medium text-gray-700">
                                    Vincular tarefa ao faturamento automaticamente
                                </label>
                            </div>

                            {/* Seção de projetos - só mostra se createDeliveries for true */}
                            {createDeliveries && (
                                <div className="space-y-4">
                                    {/* Lista de projetos selecionados */}
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
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-2xl">
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
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar projeto..."
                                    value={projectSearchTerm}
                                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                            {/* Botão Selecionar Todos Mobile */}
                            <div className="flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={toggleAllProjects}
                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={projects.length > 0 && projects.every(p => selectedProjects.some(sp => sp.id === p.id))}
                                        ref={(el) => {
                                            if (el) {
                                                const allSelected = projects.length > 0 && projects.every(p => selectedProjects.some(sp => sp.id === p.id));
                                                const someSelected = projects.some(p => selectedProjects.some(sp => sp.id === p.id));
                                                el.indeterminate = someSelected && !allSelected;
                                            }
                                        }}
                                        onChange={toggleAllProjects}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    {projects.length > 0 && projects.every(p => selectedProjects.some(sp => sp.id === p.id))
                                        ? 'Desmarcar Todos'
                                        : 'Selecionar Todos'
                                    }
                                </button>
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
                                    hiddenColumns={[]} // só 3 colunas: select, id, name
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
