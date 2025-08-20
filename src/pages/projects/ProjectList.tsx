import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ExternalLink, Search, Filter, FolderOpen, Calendar, Github } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
    const [searchTerm, setSearchTerm] = useState('');

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
        deleteProject
    } = useProjects();

    const handleEdit = (id: number) => {
        navigate(`/projects/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
            try {
                await deleteProject(id);
            } catch (error) {
                toast.error('Erro ao excluir projeto');
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
            minute: '2-digit'
        });
    };

    // Filtrar projects baseado na busca (apenas para mobile)
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.repositoryUrl?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: Column<Project>[] = [
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
                        title="Editar"
                    >
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
            )
        }
    ];

    // Componente Card para visualização mobile
    const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
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

                {/* Ações */}
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
                        onClick={() => handleDelete(project.id)}
                        title="Excluir"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Informações do Projeto */}
            <div className="space-y-2">
                {project.repositoryUrl && (
                    <div className="flex items-center gap-2 text-sm">
                        <Github className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {project.repositoryUrl}
                        </a>
                        <ExternalLink className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    </div>
                )}

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
                    <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/projects/create')}
                    className="flex items-center justify-center sm:justify-start"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Projeto
                </Button>
            </div>

            {/* Filtros Mobile - Barra de pesquisa simples apenas para mobile */}
            <div className="lg:hidden">
                <Card className="p-4">
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
                    <div className="hidden lg:block">
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
        </div>
    );
};

export default ProjectList;