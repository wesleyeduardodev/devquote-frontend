import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus, Edit, Trash2, FolderGit2} from 'lucide-react';
import useProjects from '../../hooks/useProjects';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ProjectList: React.FC = () => {
    const {projects, loading, deleteProject} = useProjects();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
            try {
                setDeletingId(id);
                await deleteProject(id);
            } finally {
                setDeletingId(null);
            }
        }
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg"/>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
                    <p className="text-gray-600 mt-1">Gerencie seus projetos de orçamento</p>
                </div>
                <Link to="/projects/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2"/>
                        Novo Projeto
                    </Button>
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-100">
                    <FolderGit2 className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum projeto encontrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Comece criando seu primeiro projeto para organizar seus repositórios.
                    </p>
                    <Link to="/projects/create">
                        <button
                            className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4 mr-2"/>
                            Criar Primeiro Projeto
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                        <Card key={project.id} className="min-h-[200px]">
                            <div className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-start flex-grow">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {project.name}
                                            </h3>
                                            <span
                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                #{project.id}
                                            </span>
                                        </div>
                                        {project.repositoryUrl && (
                                            <div className="text-sm text-blue-600 break-all">
                                                <a
                                                    href={project.repositoryUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline"
                                                >
                                                    {project.repositoryUrl}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 border-t pt-3">
                                    <div>Criado em: {formatDate(project.createdAt)}</div>
                                    {project.updatedAt && project.updatedAt !== project.createdAt && (
                                        <div>Atualizado em: {formatDate(project.updatedAt)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2 border-t pt-2">
                                    <Link to={`/projects/${project.id}/edit`}>
                                        <Button size="sm" variant="outline">
                                            <Edit className="w-4 h-4 mr-1"/>
                                            Editar
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(project.id)}
                                        loading={deletingId === project.id}
                                        disabled={deletingId === project.id}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1"/>
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;
