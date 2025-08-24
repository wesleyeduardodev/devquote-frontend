import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    FileText,
    DollarSign,
    Calendar,
    Hash,
    Tag,
    Search,
    Filter,
} from 'lucide-react';
import useQuotes from '@/hooks/useQuotes';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import toast from 'react-hot-toast';

interface Quote {
    id: number;
    taskId: number;
    taskName: string;
    taskCode: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

const QuoteList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        quotes,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteQuote,
        deleteBulkQuotes, // <-- deve existir no hook
    } = useQuotes();

    const handleEdit = (id: number) => {
        navigate(`/quotes/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
            try {
                await deleteQuote(id);
            } catch (error) {
                toast.error('Erro ao excluir orçamento');
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            DRAFT: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Pendente',
            APPROVED: 'Aprovado',
            REJECTED: 'Rejeitado',
            DRAFT: 'Rascunho',
        };
        return labels[status] || status;
    };

    // ===== Seleção múltipla (igual ao ProjectList) =====
    const toggleItem = (id: number) => {
        setSelectedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        const currentPageIds = quotes.map((q: Quote) => q.id);
        const allSelected = currentPageIds.every((id) => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const clearSelection = () => setSelectedItems([]);

    const selectionState = useMemo(() => {
        const currentPageIds = quotes.map((q: Quote) => q.id);
        const selectedFromCurrentPage = selectedItems.filter((id) => currentPageIds.includes(id));

        return {
            allSelected:
                currentPageIds.length > 0 && selectedFromCurrentPage.length === currentPageIds.length,
            someSelected:
                selectedFromCurrentPage.length > 0 && selectedFromCurrentPage.length < currentPageIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrentPage,
        };
    }, [quotes, selectedItems]);

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteBulkQuotes(selectedItems);
            const qty = selectedItems.length;
            clearSelection();
            setShowBulkDeleteModal(false);
            toast.success(`${qty} orçamento(s) excluído(s) com sucesso`);
        } catch (error) {
            toast.error('Erro ao excluir orçamentos selecionados');
        } finally {
            setIsDeleting(false);
        }
    };

    // ===== Busca simples (mobile) =====
    const filteredQuotes = quotes.filter((quote: Quote) =>
        quote.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.taskCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStatusLabel(quote.status).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ===== Colunas (inclui checkbox de seleção) =====
    const columns: Column<Quote>[] = [
        {
            key: 'select',
            title: '',
            width: '50px',
            align: 'center',
            headerRender: () => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectionState.allSelected}
                        ref={(input) => {
                            if (input) input.indeterminate = selectionState.someSelected;
                        }}
                        onChange={toggleAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        title={selectionState.allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    />
                </div>
            ),
            render: (item) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ),
        },
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '100px',
            align: 'center',
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          #{item.id}
        </span>
            ),
        },
        {
            key: 'taskCode',
            title: 'Código da Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '140px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {item.taskCode}
          </span>
                </div>
            ),
        },
        {
            key: 'taskName',
            title: 'Nome da Tarefa',
            sortable: true,
            filterable: true,
            filterType: 'text',
            width: '250px',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-900 truncate cursor-help" title={item.taskName}>
                            {item.taskName}
                        </p>
                    </div>
                </div>
            ),
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
            ),
        },
        {
            key: 'totalAmount',
            title: 'Valor Total',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '150px',
            align: 'right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">
            {formatCurrency(item.totalAmount)}
          </span>
                </div>
            ),
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            width: '160px',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(item.createdAt)}</span>
                </div>
            ),
            hideable: true,
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            width: '160px',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(item.updatedAt)}</span>
                </div>
            ),
            hideable: true,
        },
        {
            key: 'actions',
            title: 'Ações',
            align: 'center',
            width: '120px',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item.id)}
                        title="Editar orçamento"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir orçamento"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // ===== Card (mobile) com checkbox + ações =====
    const QuoteCard: React.FC<{ quote: Quote }> = ({ quote }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                        <input
                            type="checkbox"
                            checked={selectedItems.includes(quote.id)}
                            onChange={() => toggleItem(quote.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                #{quote.id}
              </span>
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {quote.taskCode}
              </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
                            {quote.taskName}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                {getStatusLabel(quote.status)}
              </span>
                        </div>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex gap-1 ml-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(quote.id)}
                        title="Editar"
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(quote.id)}
                        title="Excluir"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Informações do Orçamento */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valor do Orçamento</span>
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
              {formatCurrency(quote.totalAmount)}
            </span>
                    </div>
                </div>

                {quote.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Criado em {formatDate(quote.createdAt)}</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/quotes/create')}
                    className="flex items-center justify-center sm:justify-start"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Orçamento
                </Button>
            </div>

            {/* Estatísticas - Responsivas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Total</div>
                            <div className="text-lg sm:text-2xl font-bold text-gray-900">
                                {pagination?.totalElements || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Pendentes</div>
                            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                                {quotes.filter((q: Quote) => q.status === 'PENDING').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Aprovados</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-600">
                                {quotes.filter((q: Quote) => q.status === 'APPROVED').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-100 col-span-2 lg:col-span-1">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-500">Valor Total</div>
                            <div className="text-sm sm:text-lg font-bold text-blue-600">
                                {formatCurrency(quotes.reduce((sum: number, q: Quote) => sum + q.totalAmount, 0))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros Mobile - Busca + seleção e bulk delete */}
            <div className="lg:hidden space-y-4">
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por tarefa, código ou status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Button size="sm" variant="ghost" onClick={toggleAll} className="flex items-center gap-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectionState.allSelected}
                                        ref={(input) => {
                                            if (input) input.indeterminate = selectionState.someSelected;
                                        }}
                                        readOnly
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </div>
                                <span className="text-sm">Selecionar Todos</span>
                            </Button>

                            {selectionState.hasSelection && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => setShowBulkDeleteModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm">Excluir ({selectedItems.length})</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Conteúdo Responsivo */}
            {loading ? (
                <Card className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-4 text-gray-600">Carregando...</span>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Desktop - Barra de ações quando há seleção */}
                    <div className="hidden lg:block space-y-4">
                        {selectionState.hasSelection && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.length} orçamento(s) selecionado(s)
                    </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={clearSelection}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            Limpar seleção
                                        </Button>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Selecionados
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Desktop - Tabela */}
                        <Card className="p-0">
                            <DataTable
                                data={quotes} // Usar dados originais sem filtro de busca
                                columns={columns}
                                loading={loading}
                                pagination={pagination}
                                sorting={sorting}
                                filters={filters}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                onSort={setSorting}
                                onFilter={setFilter}
                                onClearFilters={clearFilters}
                                emptyMessage="Nenhum orçamento encontrado"
                                showColumnToggle={true}
                                hiddenColumns={['createdAt', 'updatedAt']}
                            />
                        </Card>
                    </div>

                    {/* Mobile/Tablet - Cards com busca simples */}
                    <div className="lg:hidden">
                        {filteredQuotes.length === 0 ? (
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum orçamento encontrado</h3>
                                    <p>Tente ajustar os filtros de busca ou criar um novo orçamento.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredQuotes.map((quote: Quote) => (
                                    <QuoteCard key={quote.id} quote={quote} />
                                ))}
                            </div>
                        )}

                        {/* Paginação Simplificada para Mobile */}
                        {pagination && pagination.totalPages > 1 && (
                            <Card className="p-4">
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
                            </Card>
                        )}
                    </div>
                </>
            )}

            {/* Modal de exclusão em massa */}
            <BulkDeleteModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                selectedCount={selectedItems.length}
                isDeleting={isDeleting}
                entityName="orçamento"
            />
        </div>
    );
};

export default QuoteList;
