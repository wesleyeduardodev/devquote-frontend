import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, User, Mail, Phone, Edit3, Calendar, Filter } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useRequesters } from '@/hooks/useRequesters';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageHeader } from '@/components/ui-v2/PageHeader';
import TaskForm from '../../components/forms/TaskForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

const TaskEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateTaskWithSubTasks } = useTasks();
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');
    
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [showRequesterModal, setShowRequesterModal] = useState(false);
    const [selectedRequester, setSelectedRequester] = useState<Requester | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const {
        requesters,
        pagination,
        loading: loadingRequesters,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters
    } = useRequesters({
        page: 0,
        size: 10,
        sort: [{ field: 'name', direction: 'asc' }],
        filters: {}
    });

    useEffect(() => {
        const fetchTask = async () => {
            if (!id) {
                navigate('/tasks');
                return;
            }

            try {
                setFetchLoading(true);
                const data = await taskService.getById(Number(id));
                setTask(data);
            } catch (error) {
                navigate('/tasks');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchTask();
        }
    }, [id, navigate]);

    useEffect(() => {
        if (!task || !Array.isArray(requesters) || requesters.length === 0) return;
        const found = requesters.find((r: any) => r.id === (task as any)?.requesterId);
        if (found) {
            setSelectedRequester(found);
        }
    }, [task, requesters]);

    const handleRequesterSelect = (requester: Requester) => {
        setSelectedRequester(requester);
        setShowRequesterModal(false);
    };

    const handleSubmit = async (data: any, pendingFiles?: File[]) => {
        if (!id) return;

        if (!selectedRequester) {
            return;
        }

        try {
            setLoading(true);

            const processedSubTasks = data.subTasks ? data.subTasks.map((subTask: any) => ({
                ...subTask,
                amount: isAdmin ? (subTask.amount || '0') : '0'
            })) : [];

            const taskData = {
                ...data,
                subTasks: processedSubTasks,
                requesterId: selectedRequester.id
            };

            const updatedTask = await updateTaskWithSubTasks(Number(id), taskData);

            setTask(updatedTask);
        } catch (error) {
            // rethrow pra TaskForm exibir o erro inline (sem resetar campos)
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/tasks');
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredRequesters = requesters.filter(requester =>
        requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const requesterColumns: Column<Requester>[] = useMemo(
        () => [
            {
                key: 'id',
                title: 'ID',
                sortable: true,
                filterable: true,
                filterType: 'number',
                width: '80px',
                align: 'center',
                render: (item) => (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent-soft text-accent">
                        #{item.id}
                    </span>
                )
            },
            {
                key: 'name',
                title: 'Nome',
                sortable: true,
                filterable: true,
                filterType: 'text',
                width: '200px',
                render: (item) => (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-text-tertiary" />
                        <div>
                            <p className="font-medium text-text-primary" title={item.name}>
                                {item.name}
                            </p>
                        </div>
                    </div>
                )
            },
            {
                key: 'phone',
                title: 'Telefone',
                sortable: true,
                filterable: true,
                filterType: 'text',
                width: '150px',
                render: (item) => (
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm text-text-secondary">
                            {item.phone || 'Não informado'}
                        </span>
                    </div>
                )
            },
            {
                key: 'createdAt',
                title: 'Criado em',
                sortable: true,
                filterable: true,
                filterType: 'date',
                width: '160px',
                render: (item) => (
                    <span className="text-sm text-text-secondary">
                        {formatDate(item.createdAt)}
                    </span>
                ),
                hideable: true
            },
            {
                key: 'actions',
                title: 'Selecionar',
                align: 'center',
                width: '100px',
                render: (item) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRequesterSelect(item);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-accent bg-accent-soft rounded-full hover:bg-accent-soft transition-colors"
                    >
                        <Check className="w-3 h-3 mr-1" />
                        Selecionar
                    </button>
                )
            }
        ],

        []
    );

    const RequesterCard: React.FC<{ requester: Requester }> = ({ requester }) => (
        <div className="bg-surface-1 rounded-lg border border-border-subtle p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent-soft text-accent">
                            #{requester.id}
                        </span>
                    </div>
                    <h3 className="font-semibold text-text-primary text-base leading-tight mb-2">
                        {requester.name}
                    </h3>

                    <div className="space-y-1">
                        {requester.phone && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Phone className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                                <span>{requester.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRequesterSelect(requester)}
                    className="ml-3"
                >
                    <Check className="w-4 h-4 mr-1" />
                    Selecionar
                </Button>
            </div>
        </div>
    );

    if (fetchLoading) {
        return (
            <div className="min-h-dvh bg-surface-app flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-text-secondary">Carregando tarefa...</p>
                </Card>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-dvh bg-surface-app flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                        <Edit3 className="w-8 h-8 text-[var(--danger-strong)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2">
                        Tarefa não encontrada
                    </h2>
                    <p className="text-text-secondary mb-6">
                        A tarefa que você está procurando não foi encontrada.
                    </p>
                    <Button
                        onClick={handleCancel}
                        variant="primary"
                        className="w-full"
                    >
                        Voltar para Listagem
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="w-full space-y-4">
                <PageHeader
                    title={
                        <span className="inline-flex items-center gap-2">
                            Editar tarefa
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-soft text-accent">
                                #{(task as any)?.id}
                            </span>
                        </span>
                    }
                    subtitle={(task as any)?.title || 'Carregando…'}
                />

                {/* Solicitante (inline, compacto) */}
                <div className="rounded-lg border border-border-subtle bg-surface-1 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-accent-soft text-accent grid place-items-center font-semibold text-sm shrink-0">
                            {selectedRequester?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Solicitante</div>
                            {selectedRequester ? (
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-sm font-medium text-text-primary truncate">{selectedRequester.name}</span>
                                    {selectedRequester.phone && (
                                        <span className="text-xs text-text-tertiary truncate">· {selectedRequester.phone}</span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-text-tertiary mt-0.5">Nenhum solicitante selecionado</p>
                            )}
                        </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setShowRequesterModal(true)}>
                        {selectedRequester ? 'Alterar' : 'Selecionar'}
                    </Button>
                </div>

                <TaskForm
                    initialData={{
                        ...task,
                        requesterId: selectedRequester?.id || (task as any)?.requesterId,
                        requesterName: selectedRequester?.name || (task as any)?.requesterName,
                    }}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                    taskId={(task as any)?.id}
                    onFilesUploaded={() => { toast.success('Arquivos enviados com sucesso!') }}
                />

                {/* Informações Adicionais - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Metadados */}
                    <Card className="p-4">
                        <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-text-tertiary" />
                            Informações da Tarefa
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Criado em:</span>
                                <span className="text-text-primary">{formatDate((task as any)?.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Atualizado em:</span>
                                <span className="text-text-primary">{formatDate((task as any)?.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Informações Adicionais - Desktop */}
                <div className="hidden lg:block">
                    <Card className="p-4">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-text-secondary">Criado em:</span>
                                <p className="text-text-primary font-medium">{formatDate((task as any)?.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-text-secondary">Última atualização:</span>
                                <p className="text-text-primary font-medium">{formatDate((task as any)?.updatedAt)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de Seleção de Requester */}
            {showRequesterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-1 rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-5xl">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
                                    Selecionar Solicitante
                                </h2>
                                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                                    Escolha um solicitante para editar a tarefa
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRequesterModal(false)}
                                className="text-text-tertiary hover:text-text-secondary p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Busca Mobile */}
                        <div className="lg:hidden p-4 border-b border-border-subtle">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar solicitante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-blue-500 text-base"
                                />
                            </div>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="flex-1 overflow-hidden">
                            {/* Desktop - DataTable */}
                            <div className="hidden lg:block h-full">
                                <DataTable
                                    data={requesters}
                                    columns={requesterColumns}
                                    loading={loadingRequesters}
                                    pagination={pagination}
                                    sorting={sorting}
                                    filters={filters}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                    onSort={setSorting}
                                    onFilter={setFilter}
                                    onClearFilters={clearFilters}
                                    emptyMessage="Nenhum solicitante encontrado"
                                    showColumnToggle={false}
                                    hiddenColumns={['createdAt']}
                                    className="h-full"
                                />
                            </div>

                            {/* Mobile - Cards */}
                            <div className="lg:hidden h-full overflow-y-auto">
                                {loadingRequesters ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-text-secondary">Carregando...</span>
                                    </div>
                                ) : filteredRequesters.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Filter className="w-12 h-12 mx-auto mb-4 text-text-tertiary/60" />
                                        <h3 className="text-lg font-medium mb-2 text-text-primary">
                                            Nenhum solicitante encontrado
                                        </h3>
                                        <p className="text-text-secondary">
                                            Tente ajustar sua busca ou limpar os filtros.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {filteredRequesters.map((requester) => (
                                            <RequesterCard key={requester.id} requester={requester} />
                                        ))}
                                    </div>
                                )}

                                {/* Paginação Mobile */}
                                {pagination && pagination.totalPages > 1 && !searchTerm && (
                                    <div className="p-4 border-t border-border-subtle">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setPage(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage <= 1}
                                            >
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-text-secondary">
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
                </div>
            )}
        </div>
    );
};

export default TaskEdit;