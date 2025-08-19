import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, Search, X, Check, User, Mail, Phone} from 'lucide-react';
import {useTasks} from '@/hooks/useTasks';
import {useRequesters} from '@/hooks/useRequesters';
import DataTable, {Column} from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TaskForm from '../../components/forms/TaskForm';

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
    const {createTaskWithSubTasks} = useTasks();
    const [loading, setLoading] = useState(false);
    const [showRequesterModal, setShowRequesterModal] = useState(false);
    const [selectedRequester, setSelectedRequester] = useState<Requester | null>(null);

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
        sort: [{field: 'name', direction: 'asc'}],
        filters: {}
    });

    const handleRequesterSelect = (requester: Requester) => {
        setSelectedRequester(requester);
        setShowRequesterModal(false);
    };

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);

            // Adiciona o requester selecionado aos dados
            const taskData = {
                ...data,
                requesterId: selectedRequester?.id || data.requesterId
            };

            await createTaskWithSubTasks(taskData);
            navigate('/tasks');
        } catch (error) {
            // Error handled by the hook and form
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
                    <User className="w-4 h-4 text-gray-400"/>
                    <div>
                        <p className="font-medium text-gray-900" title={item.name}>
                            {item.name}
                        </p>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '200px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm text-gray-600">
                        {item.email || 'Não informado'}
                    </span>
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
                    <Phone className="w-4 h-4 text-gray-400"/>
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
                    <Check className="w-3 h-3 mr-1"/>
                    Selecionar
                </button>
            )
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1"/>
                    Voltar
                </Button>
            </div>

            <Card
                title="Nova Tarefa"
                subtitle="Preencha as informações para criar uma nova tarefa com suas subtarefas"
            >
                {/* Seleção de Requester */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Solicitante *
                    </label>

                    {selectedRequester ? (
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                        {selectedRequester.name}
                                    </div>
                                    {selectedRequester.email && (
                                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                            <Mail className="w-4 h-4"/>
                                            {selectedRequester.email}
                                        </div>
                                    )}
                                    {selectedRequester.phone && (
                                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                            <Phone className="w-4 h-4"/>
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
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowRequesterModal(true)}
                            className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <Search className="w-4 h-4 mx-auto mb-1"/>
                            Clique para selecionar um solicitante
                        </button>
                    )}
                </div>

                {/* TaskForm com requester pré-selecionado */}
                <TaskForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                    initialData={selectedRequester ? {
                        requesterId: selectedRequester.id,
                        requesterName: selectedRequester.name
                    } : undefined}
                />
            </Card>

            {/* Modal de Seleção de Requester */}
            {showRequesterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Selecionar Solicitante</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Escolha um solicitante para a tarefa
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRequesterModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        {/* DataTable Container */}
                        <div className="flex-1 overflow-hidden">
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskCreate;