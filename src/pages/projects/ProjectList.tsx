import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ExternalLink, Search, Filter, FolderOpen, Calendar, Github, Check } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import toast from 'react-hot-toast';

interface Project {
    id: number;
    name: string;
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

const ProjectList: React.FC = () => {
    const navigate = useNavigate();
    const { hasProfile, user } = useAuth();

    // Verifica se o usuário é ADMIN (apenas ADMIN pode acessar projetos)
    const isAdmin = hasProfile('ADMIN');
    const authLoading = !user;

    // Verificação de acesso - apenas ADMIN pode acessar projetos
    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
            navigate('/dashboard');
        }
    }, [hasProfile, navigate, authLoading, user, isAdmin]);

    // Se não é admin, não renderiza nada (vai redirecionar)
    if (!authLoading && user && !isAdmin) {
        return null;
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Project | null>(null);
    const [isDeletingSingle, setIsDeletingSingle] = useState(false);

    const {
        projects,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteProject,
        deleteBulkProjects
    } = useProjects();

    const handleEdit = (id: number) => {
        navigate(`/projects/${id}/edit`);
    };

    const handleDelete = (project: Project) => {
        setItemToDelete(project);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        setIsDeletingSingle(true);
        try {
            await deleteProject(itemToDelete.id);
        } catch (error) {
            toast.error('Erro ao excluir projeto');
        } finally {
            setIsDeletingSingle(false);
            setShowDeleteModal(false);
            setItemToDelete(null);
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
            minute: '2-digit'
        });
    };

    // Funções de seleção múltipla
    const toggleItem = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleAll = () => {
        const currentPageIds = projects.map(project => project.id);
        const allSelected = currentPageIds.every(id => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedItems(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const clearSelection = () => {
        setSelectedItems([]);
    };

    // Estados derivados
    const selectionState = useMemo(() => {
        const currentPageIds = projects.map(project => project.id);
        const selectedFromCurrentPage = selectedItems.filter(id => currentPageIds.includes(id));

        return {
            allSelected: currentPageIds.length > 0 && selectedFromCurrentPage.length === currentPageIds.length,
            someSelected: selectedFromCurrentPage.length > 0 && selectedFromCurrentPage.length < currentPageIds.length,
            hasSelection: selectedItems.length > 0,
            selectedFromCurrentPage
        };
    }, [projects, selectedItems]);

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteBulkProjects(selectedItems);
            clearSelection();
            setShowBulkDeleteModal(false);
            toast.success(`${selectedItems.length} projeto(s) excluído(s) com sucesso`);
        } catch (error) {
            toast.error('Erro ao excluir projetos selecionados');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filtrar projects baseado na busca (apenas para mobile)
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.repositoryUrl?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: Column<Project>[] = [
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
                            if (input) {
                                input.indeterminate = selectionState.someSelected;
                            }
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
            )
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
            )
        },
        {
            key: 'name',
            title: 'Nome do Projeto',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                </div>
            )
        },
        {
            key: 'repositoryUrl',
            title: 'URL do Repositório',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                item.repositoryUrl ? (
                    <div className="flex items-center gap-2">
                        <a
                            href={item.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 max-w-xs truncate"
                            onClick={(e) => e.stopPropagation()}
                            title={item.repositoryUrl}
                        >
                            <span className="truncate">{item.repositoryUrl}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
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
            render: (item) => formatDate(item.createdAt),
            hideable: true
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.updatedAt),
            hideable: true
        },
        // Coluna de ações - apenas para ADMIN
        ...(isAdmin ? [{
            key: 'actions',
            title: 'Ações',
            align: 'center' as const,
            width: '120px',
            render: (item: Project) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item.id)}
                        title="Editar"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                        title="Excluir"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }] : [])
    ];

    // Componente Card para visualização mobile
    const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox - apenas para ADMIN */}
                    {isAdmin && (
                        <div className="flex-shrink-0 pt-1">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(project.id)}
                                onChange={() => toggleItem(project.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                #{project.id}
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            {project.name}
                        </h3>
                    </div>
                </div>

                {/* Ações - apenas para ADMIN */}
                {isAdmin && (
                    <div className="flex gap-1 ml-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(project.id)}
                        title="Editar"
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(project)}
                        title="Excluir"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    </div>
                )}
            </div>

            {/* Informações do Projeto */}
            <div className="space-y-2">
                {project.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Criado em {formatDate(project.createdAt)}</span>
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'Gerenciamento de Projetos' : 'Visualização de Projetos'}
                    </h1>
                </div>
                {isAdmin && (
                    <Button
                        variant="primary"
                        onClick={() => navigate('/projects/create')}
                        className="flex items-center justify-center sm:justify-start"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Projeto
                    </Button>
                )}
            </div>

            {/* Filtros Mobile - Barra de pesquisa simples apenas para mobile */}
            <div className="lg:hidden space-y-4">
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou URL do repositório..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={toggleAll}
                                className="flex items-center gap-2"
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectionState.allSelected}
                                        ref={(input) => {
                                            if (input) {
                                                input.indeterminate = selectionState.someSelected;
                                            }
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
                    {/* Visualização Desktop - Tabela com filtros originais */}
                    <div className="hidden lg:block space-y-4">
                        {/* Barra de ações para desktop */}
                        {isAdmin && selectionState.hasSelection && (
                            <Card className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            {selectedItems.length} projeto(s) selecionado(s)
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

                        <Card className="p-0">
                            <DataTable
                                data={projects} // Usar dados originais sem filtro de busca
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
                                emptyMessage="Nenhum projeto encontrado"
                                showColumnToggle={true}
                                hiddenColumns={['createdAt', 'updatedAt']}
                            />
                        </Card>
                    </div>

                    {/* Visualização Mobile/Tablet - Cards com busca simples */}
                    <div className="lg:hidden">
                        {filteredProjects.length === 0 ? (
                            <Card className="p-8 text-center">
                                <div className="text-gray-500">
                                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
                                    <p>Tente ajustar os filtros de busca ou criar um novo projeto.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredProjects.map((project) => (
                                    <ProjectCard key={project.id} project={project} />
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
                entityName="projeto"
            />

            {/* Modal de confirmação de exclusão */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                itemName={itemToDelete?.name}
                isDeleting={isDeletingSingle}
            />
        </div>
    );
};

export default ProjectList;
