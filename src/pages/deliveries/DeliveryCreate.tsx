import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, Search, X, Check, FileText, Hash, FolderOpen, ExternalLink} from 'lucide-react';
import {useDeliveries} from '@/hooks/useDeliveries';
import useQuotes from '@/hooks/useQuotes';
import {useProjects} from '@/hooks/useProjects';
import DataTable, {Column} from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DeliveryForm from '../../components/forms/DeliveryForm';
import toast from 'react-hot-toast';

interface Quote {
    id: number;
    taskName: string;
    taskCode: string;
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
    const {createDelivery} = useDeliveries();
    const [loading, setLoading] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Hook para gerenciar quotes paginados
    const {
        quotes,
        pagination: quotePagination,
        loading: loadingQuotes,
        sorting: quoteSorting,
        filters: quoteFilters,
        setPage: setQuotePage,
        setPageSize: setQuotePageSize,
        setSorting: setQuoteSorting,
        setFilter: setQuoteFilter,
        clearFilters: clearQuoteFilters
    } = useQuotes({
        page: 0,
        size: 10,
        sort: [{field: 'id', direction: 'desc'}],
        filters: {}
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
        size: 10,
        sort: [{field: 'name', direction: 'asc'}],
        filters: {}
    });

    const handleQuoteSelect = (quote: Quote) => {
        setSelectedQuote(quote);
        setShowQuoteModal(false);
    };

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
        setShowProjectModal(false);
    };

    const handleSubmit = async (data: any) => {
        if (!selectedQuote) {
            toast.error('Selecione um orçamento');
            return;
        }

        if (!selectedProject) {
            toast.error('Selecione um projeto');
            return;
        }

        try {
            setLoading(true);
            await createDelivery(data);
            navigate('/deliveries');
        } catch (error: any) {
            console.error('Erro ao criar entrega:', error);
            let errorMessage = 'Erro ao criar entrega';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).join(', ');
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/deliveries');
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            DRAFT: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            DRAFT: 'Rascunho'
        };
        return labels[status] || status;
    };

    // Colunas para o DataTable de quotes
    const quoteColumns: Column<Quote>[] = [
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
            key: 'taskCode',
            title: 'Código',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400"/>
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.taskCode}
                    </span>
                </div>
            )
        },
        {
            key: 'taskName',
            title: 'Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '200px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400"/>
                    <div>
                        <p className="font-medium text-gray-900 truncate cursor-help" title={item.taskName}>
                            {item.taskName}
                        </p>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            title: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '120px',
            align: 'center',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                </span>
            )
        },
        {
            key: 'totalAmount',
            title: 'Valor',
            width: '120px',
            align: 'right',
            render: (item) => (
                <span className="text-sm font-medium text-green-600">
                    {formatCurrency(item.totalAmount)}
                </span>
            )
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
                        handleQuoteSelect(item);
                    }}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                >
                    <Check className="w-3 h-3 mr-1"/>
                    Selecionar
                </button>
            )
        }
    ];

    // Colunas para o DataTable de projects
    const projectColumns: Column<Project>[] = [
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
                    <FolderOpen className="w-4 h-4 text-gray-400"/>
                    <div>
                        <p className="font-medium text-gray-900" title={item.name}>
                            {item.name}
                        </p>
                    </div>
                </div>
            )
        },
        {
            key: 'repositoryUrl',
            title: 'Repositório',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '250px',
            render: (item) => (
                item.repositoryUrl ? (
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-400"/>
                        <a
                            href={item.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate text-sm"
                            onClick={(e) => e.stopPropagation()}
                            title={item.repositoryUrl}
                        >
                            {item.repositoryUrl}
                        </a>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )
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
                        handleProjectSelect(item);
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
                title="Nova Entrega"
                subtitle="Preencha as informações para criar uma nova entrega"
            >
                {/* Orçamento Selecionado */}
                {selectedQuote ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-blue-900">Orçamento Selecionado</h4>
                            <button
                                type="button"
                                onClick={() => setShowQuoteModal(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                title="Alterar orçamento"
                            >
                                Alterar
                            </button>
                        </div>
                        <div className="space-y-1 text-sm text-blue-800">
                            <div><strong>ID:</strong> #{selectedQuote.id}</div>
                            <div><strong>Código:</strong> {selectedQuote.taskCode}</div>
                            <div><strong>Tarefa:</strong> {selectedQuote.taskName}</div>
                            <div><strong>Status:</strong> {getStatusLabel(selectedQuote.status)}</div>
                            <div><strong>Valor:</strong> {formatCurrency(selectedQuote.totalAmount)}</div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Orçamento *
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowQuoteModal(true)}
                            className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <Search className="w-4 h-4 mx-auto mb-1"/>
                            Clique para selecionar um orçamento
                        </button>
                    </div>
                )}

                {/* Projeto Selecionado */}
                {selectedProject ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-green-900">Projeto Selecionado</h4>
                            <button
                                type="button"
                                onClick={() => setShowProjectModal(true)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                                title="Alterar projeto"
                            >
                                Alterar
                            </button>
                        </div>
                        <div className="space-y-1 text-sm text-green-800">
                            <div><strong>ID:</strong> #{selectedProject.id}</div>
                            <div><strong>Nome:</strong> {selectedProject.name}</div>
                            {selectedProject.repositoryUrl && (
                                <div><strong>Repositório:</strong> {selectedProject.repositoryUrl}</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Projeto *
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowProjectModal(true)}
                            className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <Search className="w-4 h-4 mx-auto mb-1"/>
                            Clique para selecionar um projeto
                        </button>
                    </div>
                )}

                {/* DeliveryForm */}
                <DeliveryForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                    selectedQuote={selectedQuote}
                    selectedProject={selectedProject}
                />
            </Card>

            {/* Modal de Seleção de Orçamento */}
            {showQuoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Selecionar Orçamento</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Escolha um orçamento para a entrega
                                </p>
                            </div>
                            <button
                                onClick={() => setShowQuoteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <DataTable
                                data={quotes}
                                columns={quoteColumns}
                                loading={loadingQuotes}
                                pagination={quotePagination}
                                sorting={quoteSorting}
                                filters={quoteFilters}
                                onPageChange={setQuotePage}
                                onPageSizeChange={setQuotePageSize}
                                onSort={setQuoteSorting}
                                onFilter={setQuoteFilter}
                                onClearFilters={clearQuoteFilters}
                                emptyMessage="Nenhum orçamento encontrado"
                                showColumnToggle={false}
                                className="h-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Projeto */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Selecionar Projeto</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Escolha um projeto para a entrega
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProjectModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>

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

export default DeliveryCreate;