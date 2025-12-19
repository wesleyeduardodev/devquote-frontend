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
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
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
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="font-medium text-gray-900" title={item.name}>
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
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
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
                    <span className="text-sm text-gray-600">
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
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            #{requester.id}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                        {requester.name}
                    </h3>

                    <div className="space-y-1">
                        {requester.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Carregando tarefa...</p>
                </Card>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Edit3 className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Tarefa não encontrada
                    </h2>
                    <p className="text-gray-600 mb-6">
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
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full lg:w-[80%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="flex items-center p-2 sm:px-3 sm:py-2"
                    >
                        <ArrowLeft className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Button>
                </div>

                {/* Card Principal */}
                <Card className="overflow-hidden">
                    {/* Header do Card */}
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Edit3 className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Editar Tarefa
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                        #{(task as any)?.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Atualize as informações da tarefa: {(task as any)?.title || 'Carregando...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="px-4 py-5 sm:px-6">
                        {/* Solicitante Selecionado */}
                        {selectedRequester ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-blue-900">Solicitante Selecionado</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowRequesterModal(true)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        title="Alterar solicitante"
                                    >
                                        Alterar
                                    </button>
                                </div>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <div><strong>Nome:</strong> {selectedRequester.name}</div>
                                    {selectedRequester.phone && (
                                        <div><strong>Telefone:</strong> {selectedRequester.phone}</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Solicitante *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowRequesterModal(true)}
                                    className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <Search className="w-4 h-4 mx-auto mb-1" />
                                    Clique para selecionar um solicitante
                                </button>
                            </div>
                        )}

                        {/* TaskForm com requester pré-selecionado */}
                        <TaskForm
                            initialData={{
                                ...task,
                                requesterId: selectedRequester?.id || (task as any)?.requesterId,
                                requesterName: selectedRequester?.name || (task as any)?.requesterName
                            }}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            loading={loading}
                            taskId={(task as any)?.id}
                            onFilesUploaded={() => {
                                toast.success('Arquivos enviados com sucesso!');
                            }}
                        />
                    </div>
                </Card>

                {/* Informações Adicionais - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Metadados */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Informações da Tarefa
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Criado em:</span>
                                <span className="text-gray-900">{formatDate((task as any)?.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Atualizado em:</span>
                                <span className="text-gray-900">{formatDate((task as any)?.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Informações Adicionais - Desktop */}
                <div className="hidden lg:block">
                    <Card className="p-4">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-gray-600">Criado em:</span>
                                <p className="text-gray-900 font-medium">{formatDate((task as any)?.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Última atualização:</span>
                                <p className="text-gray-900 font-medium">{formatDate((task as any)?.updatedAt)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de Seleção de Requester */}
            {showRequesterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-5xl">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    Selecionar Solicitante
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Escolha um solicitante para editar a tarefa
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRequesterModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Busca Mobile */}
                        <div className="lg:hidden p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar solicitante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
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
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredRequesters.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                                            Nenhum solicitante encontrado
                                        </h3>
                                        <p className="text-gray-600">
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskEdit;