import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Phone,
    Mail,
    Calendar,
    XCircle,
} from 'lucide-react';
import { useRequesters } from '@/hooks/useRequesters';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import toast from 'react-hot-toast';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

const RequesterList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile, user, isLoading: authLoading } = useAuth();
    
    // Verifica se o usuário tem permissão (apenas ADMIN)
    const isAdmin = hasProfile('ADMIN');

    // Verificação de acesso - apenas ADMIN pode acessar solicitantes
    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
            navigate('/dashboard');
        }
    }, [hasProfile, navigate, authLoading, user, isAdmin]);

    // Se não é admin e já carregou auth, redireciona
    if (!authLoading && !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
                </div>
            </div>
        );
    }
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        requesters,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteRequester,
        deleteBulkRequesters, // <-- deve existir no hook, igual ao de Projects
    } = useRequesters();

    const handleEdit = (id: number) => {
        navigate(`/requesters/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este solicitante?')) {
            try {
                await deleteRequester(id);
            } catch (error) {
                toast.error('Erro ao excluir solicitante');
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

    // ===== Seleção múltipla (igual ProjectList) =====
    const toggleItem = (id: number) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const currentPageIds = requesters.map((r) => r.id);
        const allSelected = currentPageIds.every((id) => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const clearSelection = () => setSelectedItems([]);

    const selectionState = useMemo(() => {
        const currentPageIds = requesters.map((r) => r.id);
        const selectedFromCurrentPage = selectedItems.filter((id) =>
            currentPageIds.includes(id)
        );

        return {
            allSelected:
                currentPageIds.length > 0 &&
                selectedFromCurrentPage.length === currentPageIds.length,
            someSelected:
                selectedFromCurrentPage.length > 0 &&
                selectedFromCurrentPage.length < currentPageIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrentPage,
        };
    }, [requesters, selectedItems]);

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteBulkRequesters(selectedItems);
            const qty = selectedItems.length;
            clearSelection();
            setShowBulkDeleteModal(false);
            toast.success(`${qty} solicitante(s) excluído(s) com sucesso`);
        } catch (error) {
            toast.error('Erro ao excluir solicitantes selecionados');
        } finally {
            setIsDeleting(false);
        }
    };

    // ===== Busca simples (mobile) =====
    const filteredRequesters = requesters.filter(
        (r) =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.phone?.includes(searchTerm)
    );

    // ===== Colunas da tabela (inclui coluna de seleção) =====
    const columns: Column<Requester>[] = [
        // Checkbox de seleção - apenas para ADMIN
        ...(isAdmin ? [{
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
        }] : []),
        // Colunas que todos podem ver
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
                <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                </div>
            ),
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <a
                    href={item.email ? `mailto:${item.email}` : undefined}
                    className={`${
                        item.email ? 'text-blue-600 hover:text-blue-800 hover:underline' : 'text-gray-400'
                    }`}
                    onClick={(e) => {
                        if (!item.email) e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    {item.email || '-'}
                </a>
            ),
        },
        {
            key: 'phone',
            title: 'Telefone',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => item.phone || '-',
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.createdAt),
            hideable: true,
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.updatedAt),
            hideable: true,
        },
        // Coluna de ações - apenas para ADMIN
        ...(isAdmin ? [{
            key: 'actions',
            title: 'Ações',
            align: 'center' as const,
            width: '120px',
            render: (item: Requester) => (
                <div className="flex items-center justify-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item.id)} title="Editar">
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        }] : []),
    ];

    // ===== Card (mobile) com checkbox de seleção =====
    const RequesterCard: React.FC<{ requester: Requester }> = ({ requester }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox - apenas para ADMIN */}
                    {isAdmin && (
                        <div className="flex-shrink-0 pt-1">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(requester.id)}
                                onChange={() => toggleItem(requester.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                #{requester.id}
              </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">{requester.name}</h3>
                    </div>
                </div>

                {/* Ações - apenas para ADMIN */}
                {isAdmin && (
                    <div className="flex gap-1 ml-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(requester.id)}
                            title="Editar"
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(requester.id)}
                            title="Excluir"
                            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Informações de Contato */}
            <div className="space-y-2">
                {requester.email && (
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${requester.email}`} className="text-blue-600 hover:text-blue-800 hover:underline truncate">
                            {requester.email}
                        </a>
                    </div>
                )}

                {requester.phone && (
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${requester.phone}`} className="text-gray-700 hover:text-blue-600">
                            {requester.phone}
                        </a>
                    </div>
                )}
            </div>

            {/* Datas (opcional) */}
            {(requester.createdAt || requester.updatedAt) && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
            {requester.createdAt
                ? `Criado em ${formatDate(requester.createdAt)}`
                : requester.updatedAt
                    ? `Atualizado em ${formatDate(requester.updatedAt)}`
                    : '-'}
          </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'Gerenciamento de Solicitantes' : 'Visualização de Solicitantes'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isAdmin ? 'Gerencie os solicitantes cadastrados' : 'Visualize os solicitantes cadastrados'}
                    </p>
                </div>
                {isAdmin && (
                    <Button
                        variant="primary"
                        onClick={() => navigate('/requesters/create')}
                        className="flex items-center justify-center sm:justify-start"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Solicitante
                    </Button>
                )}
            </div>

            {/* Filtros Mobile - Busca simples + seleção e bulk delete */}
            <div className="lg:hidden space-y-4">
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou telefone..."
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

                            {isAdmin && selectionState.hasSelection && (
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

            {/* Conteúdo */}
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
                        {isAdmin && selectionState.hasSelection && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedItems.length} solicitante(s) selecionado(s)
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
                                data={requesters}
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
                                emptyMessage="Nenhum solicitante encontrado"
                                showColumnToggle={true}
                                hiddenColumns={['createdAt', 'updatedAt']}
                            />
                        </Card>
                    </div>

                    {/* Mobile/Tablet - Cards */}
                    <div className="lg:hidden">
                        {filteredRequesters.length === 0 ? (
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum solicitante encontrado</h3>
                                    <p>Tente ajustar os filtros de busca ou criar um novo solicitante.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredRequesters.map((requester) => (
                                    <RequesterCard key={requester.id} requester={requester} />
                                ))}
                            </div>
                        )}

                        {/* Paginação Simplificada (mobile) */}
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
                entityName="solicitante"
            />
        </div>
    );
};

export default RequesterList;
