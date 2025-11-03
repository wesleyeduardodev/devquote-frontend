import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, User, Mail, Phone, Plus, Filter } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useRequesters } from '@/hooks/useRequesters';
import { useAuth } from '@/hooks/useAuth';
import { ScreenGuard } from '@/components/auth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TaskForm from '../../components/forms/TaskForm';
import toast from 'react-hot-toast';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

const TaskCreate = () => {
    const navigate = useNavigate();
    const { createTaskWithSubTasks } = useTasks();
    const { hasProfile } = useAuth();
    const isAdmin = hasProfile('ADMIN');

    const [loading, setLoading] = useState(false);
    const [showRequesterModal, setShowRequesterModal] = useState(false);
    const [selectedRequester, setSelectedRequester] = useState<Requester | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [requesterError, setRequesterError] = useState<string | null>(null);

    // Hook para gerenciar requesters paginados
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

    const handleRequesterSelect = (requester: Requester) => {
        setSelectedRequester(requester);
        setShowRequesterModal(false);
        setRequesterError(null); // Limpa o erro quando um requester é selecionado
    };

    const handleSubmit = async (data: any, pendingFiles?: File[]) => {
        try {
            setLoading(true);

            // Processar subtarefas: MANAGER/USER sempre enviam valor 0
            const processedSubTasks = data.subTasks ? data.subTasks.map((subTask: any) => ({
                ...subTask,
                amount: isAdmin ? (subTask.amount || '0') : '0' // Força 0 para MANAGER/USER
            })) : [];

            // Adiciona o requester selecionado aos dados
            const taskData = {
                ...data,
                subTasks: processedSubTasks,
                requesterId: selectedRequester?.id || data.requesterId
            };

            // Criar a tarefa COM arquivos (se houver) - usando o método atualizado
            await createTaskWithSubTasks(taskData, pendingFiles);

            navigate('/tasks');
        } catch (error) {
            // Error handled by the hook
            console.error('Erro ao criar tarefa:', error);
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

    // Filtrar requesters para o modal mobile
    const filteredRequesters = requesters.filter(requester =>
        requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Colunas para o DataTable do modal de requesters
    const requesterColumns: Column<Requester>[] = [
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
    ];

    // Componente Card para requesters no mobile
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

    return (
        <ScreenGuard requiredScreen="tasks">
            <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
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

                        {/* Conteúdo do Card */}
                        <div className="px-4 py-5 sm:px-6">
                            {/* Seleção de Requester */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Solicitante <span className="text-red-500">*</span>
                                </label>
                                {selectedRequester ? (
                                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {selectedRequester.name}
                                                </div>
                                                {selectedRequester.phone && (
                                                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {selectedRequester.phone}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRequester(null);
                                                }}
                                                className="ml-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowRequesterModal(true)}
                                        className={`w-full px-4 py-3 border border-dashed rounded-lg transition-colors ${
                                            requesterError
                                                ? 'border-red-300 text-red-600 hover:border-red-400 hover:text-red-700 bg-red-50'
                                                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                                        }`}
                                    >
                                        <Search className="w-4 h-4 mx-auto mb-1" />
                                        Clique para selecionar um solicitante
                                    </button>
                                )}
                                {requesterError && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {requesterError}
                                    </p>
                                )}
                            </div>

                            {/* TaskForm com requester pré-selecionado */}
                            <TaskForm
                                onSubmit={(data: any, pendingFiles?: File[]) => {
                                    // Validar requester antes de chamar handleSubmit
                                    if (!selectedRequester) {
                                        setRequesterError('Por favor, selecione um solicitante');
                                        // Fazer scroll para o topo onde está o erro
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        return Promise.reject(new Error('Requester not selected'));
                                    }
                                    return handleSubmit(data, pendingFiles);
                                }}
                                onCancel={handleCancel}
                                loading={loading}
                                initialData={selectedRequester ? {
                                    requesterId: selectedRequester.id,
                                    requesterName: selectedRequester.name
                                } : undefined}
                            />
                        </div>
                    </Card>
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
        </ScreenGuard>
    );
};

export default TaskCreate;