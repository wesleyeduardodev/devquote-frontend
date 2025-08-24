import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, FileText, Hash, FolderOpen, ExternalLink, Edit3, Calendar, Filter, DollarSign, Truck, AlertCircle, GitBranch, StickyNote, GitMerge } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import useQuotes from '@/hooks/useQuotes';
import { useProjects } from '@/hooks/useProjects';
import { deliveryService } from '@/services/deliveryService';
import DataTable, { Column } from '@/components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DeliveryForm from '../../components/forms/DeliveryForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
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

const DeliveryEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updateDelivery } = useDeliveries();
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
    const [projectSearchTerm, setProjectSearchTerm] = useState('');

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
        size: 50, // Aumentar para pegar mais quotes
        sort: [{ field: 'id', direction: 'desc' }],
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
        size: 50, // Aumentar para pegar mais projetos
        sort: [{ field: 'name', direction: 'asc' }],
        filters: {}
    });

    useEffect(() => {
        const fetchDelivery = async () => {
            if (!id) {
                navigate('/deliveries');
                return;
            }

            try {
                setFetchLoading(true);
                const data = await deliveryService.getById(Number(id));
                setDelivery(data);
            } catch (error) {
                console.error('Erro ao carregar entrega:', error);
                toast.error('Erro ao carregar entrega');
                navigate('/deliveries');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchDelivery();
        }
    }, [id, navigate]);

    // Quando tivermos a delivery e os quotes/projects carregados, tentamos "casar" os IDs
    useEffect(() => {
        if (!delivery || !delivery.quoteId || !Array.isArray(quotes) || quotes.length === 0) return;
        // Buscar pelo ID na resposta da API de delivery
        const found = quotes.find((q: any) => q.id === delivery.quoteId);
        if (found) {
            setSelectedQuote(found);
        } else {
            // Se não encontrou na lista paginada, criar um quote "mock" com os dados da delivery
            setSelectedQuote({
                id: delivery.quoteId,
                taskName: delivery.taskName || 'Carregando...',
                taskCode: delivery.taskCode || 'Carregando...',
                status: 'PENDING',
                totalAmount: 0,
                createdAt: '',
                updatedAt: ''
            });
        }
    }, [delivery, quotes]);

    useEffect(() => {
        if (!delivery || !delivery.projectId || !Array.isArray(projects) || projects.length === 0) return;
        // Buscar pelo ID na resposta da API de delivery
        const found = projects.find((p: any) => p.id === delivery.projectId);
        if (found) {
            setSelectedProject(found);
        } else {
            // Se não encontrou na lista paginada, criar um project "mock" com os dados da delivery
            setSelectedProject({
                id: delivery.projectId,
                name: delivery.projectName || 'Carregando...',
                repositoryUrl: undefined,
                createdAt: undefined,
                updatedAt: undefined
            });
        }
    }, [delivery, projects]);

    const handleQuoteSelect = (quote: Quote) => {
        setSelectedQuote(quote);
        setShowQuoteModal(false);
    };

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
        setShowProjectModal(false);
    };

    const handleSubmit = async (data: any) => {
        if (!id) return;

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
            await updateDelivery(Number(id), data);
            navigate('/deliveries');
        } catch (error: any) {
            console.error('Erro ao atualizar entrega:', error);
            let errorMessage = 'Erro ao atualizar entrega';
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).join(', ');
            } else if (error?.message) {
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

    // Filtrar para modals mobile
    const filteredQuotes = quotes.filter(quote =>
        quote.taskName.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
        quote.taskCode.toLowerCase().includes(quoteSearchTerm.toLowerCase())
    );

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.repositoryUrl?.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );

    // Colunas para DataTable (mesmas do Create)
    const quoteColumns: Column<Quote>[] = useMemo(
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
                key: 'taskCode',
                title: 'Código',
                sortable: true,
                filterable: true,
                filterType: 'text',
                width: '120px',
                render: (item) => (
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
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
                        <FileText className="w-4 h-4 text-gray-400" />
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
                        <Check className="w-3 h-3 mr-1" />
                        Selecionar
                    </button>
                )
            }
        ],
        []
    );

    const projectColumns: Column<Project>[] = useMemo(
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
                        <FolderOpen className="w-4 h-4 text-gray-400" />
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
                            <ExternalLink className="w-4 h-4 text-gray-400" />
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
                        <Check className="w-3 h-3 mr-1" />
                        Selecionar
                    </button>
                )
            }
        ],
        []
    );

    // Componentes Card para mobile
    const QuoteCard: React.FC<{ quote: Quote }> = ({ quote }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            #{quote.id}
                        </span>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {quote.taskCode}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                        {quote.taskName}
                    </h3>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                                {getStatusLabel(quote.status)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="font-medium text-green-600">
                                {formatCurrency(quote.totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleQuoteSelect(quote)}
                    className="ml-3"
                >
                    <Check className="w-4 h-4 mr-1" />
                    Selecionar
                </Button>
            </div>
        </div>
    );

    // Componente ProjectCard atualizado para DeliveryEdit.tsx
    const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        #{project.id}
                    </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        {project.name}
                    </h3>
                </div>
                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleProjectSelect(project)}
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
                    <p className="mt-4 text-gray-600">Carregando entrega...</p>
                </Card>
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Entrega não encontrada
                    </h2>
                    <p className="text-gray-600 mb-6">
                        A entrega que você está procurando não foi encontrada.
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
            <div className="max-w-4xl mx-auto space-y-6">
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
                                        Editar Entrega
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                        #{delivery.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Atualize as informações da entrega
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-4 py-5 sm:px-6">
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
                                    <Search className="w-4 h-4 mx-auto mb-1" />
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
                                    <Search className="w-4 h-4 mx-auto mb-1" />
                                    Clique para selecionar um projeto
                                </button>
                            </div>
                        )}

                        {/* DeliveryForm */}
                        <DeliveryForm
                            initialData={delivery && selectedQuote && selectedProject ? {
                                ...delivery,
                                quoteId: selectedQuote.id,
                                projectId: selectedProject.id,
                            } : delivery}
                            onSubmit={handleSubmit}
                            loading={loading}
                            selectedQuote={selectedQuote}
                            selectedProject={selectedProject}
                        />
                    </div>
                </Card>

                {/* Informações Adicionais - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Metadados */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Informações da Entrega
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Criado em:</span>
                                <span className="text-gray-900">{formatDate(delivery?.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Atualizado em:</span>
                                <span className="text-gray-900">{formatDate(delivery?.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Dicas */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Dicas de Edição</h4>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Orçamento:</strong> Verifique se o orçamento está correto
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FolderOpen className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Projeto:</strong> Confirme o projeto de entrega
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <GitMerge className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Branch Origem:</strong> Atualize a branch de origem se necessário
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <GitBranch className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Branch Destino:</strong> Atualize a branch de destino se necessário
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <StickyNote className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Notas:</strong> Adicione ou atualize observações importantes
                                </div>
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
                                <p className="text-gray-900 font-medium">{formatDate(delivery?.createdAt)}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Última atualização:</span>
                                <p className="text-gray-900 font-medium">{formatDate(delivery?.updatedAt)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de Seleção de Orçamento */}
            {showQuoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-6xl">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Selecionar Orçamento</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Escolha um orçamento para editar a entrega
                                </p>
                            </div>
                            <button
                                onClick={() => setShowQuoteModal(false)}
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
                                    placeholder="Buscar orçamento..."
                                    value={quoteSearchTerm}
                                    onChange={(e) => setQuoteSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {/* Desktop - DataTable */}
                            <div className="hidden lg:block h-full">
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

                            {/* Mobile - Cards */}
                            <div className="lg:hidden h-full overflow-y-auto">
                                {loadingQuotes ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredQuotes.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                                            Nenhum orçamento encontrado
                                        </h3>
                                        <p className="text-gray-600">
                                            Tente ajustar sua busca.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {filteredQuotes.map((quote) => (
                                            <QuoteCard key={quote.id} quote={quote} />
                                        ))}
                                    </div>
                                )}

                                {/* Paginação Mobile */}
                                {quotePagination && quotePagination.totalPages > 1 && !quoteSearchTerm && (
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setQuotePage(quotePagination.currentPage - 1)}
                                                disabled={quotePagination.currentPage <= 1}
                                            >
                                                Anterior
                                            </Button>

                                            <span className="text-sm text-gray-600">
                                                Página {quotePagination.currentPage} de {quotePagination.totalPages}
                                            </span>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setQuotePage(quotePagination.currentPage + 1)}
                                                disabled={quotePagination.currentPage >= quotePagination.totalPages}
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

            {/* Modal de Seleção de Projeto */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-6xl">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Selecionar Projeto</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Escolha um projeto para editar a entrega
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProjectModal(false)}
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
                                    placeholder="Buscar projeto..."
                                    value={projectSearchTerm}
                                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {/* Desktop - DataTable */}
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
                                    className="h-full"
                                />
                            </div>

                            {/* Mobile - Cards */}
                            <div className="lg:hidden h-full overflow-y-auto">
                                {loadingProjects ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Carregando...</span>
                                    </div>
                                ) : filteredProjects.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">
                                            Nenhum projeto encontrado
                                        </h3>
                                        <p className="text-gray-600">
                                            Tente ajustar sua busca.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {filteredProjects.map((project) => (
                                            <ProjectCard key={project.id} project={project} />
                                        ))}
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
        </div>
    );
};

export default DeliveryEdit;