import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderOpen, Edit3, Calendar, Github, AlertCircle } from 'lucide-react';
import { projectService } from '@/services/projectService';
import useProjects from '../../hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectForm from '../../components/forms/ProjectForm';
import toast from 'react-hot-toast';

const ProjectEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updateProject } = useProjects();
    const { hasProfile, user } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [project, setProject] = useState<any>(null);
    const [fetching, setFetching] = useState<boolean>(true);

    // Verifica se o usuário é ADMIN (apenas ADMIN pode editar projetos)
    const isAdmin = hasProfile('ADMIN');
    const authLoading = !user;

    // Verificação de acesso - apenas ADMIN pode editar projetos
    useEffect(() => {
        if (!authLoading && user && !isAdmin) {
            toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
            navigate('/dashboard');
        }
    }, [hasProfile, navigate, authLoading, user, isAdmin]);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) {
                navigate('/projects');
                return;
            }

            // Só carrega se for admin
            if (!authLoading && !isAdmin) {
                return;
            }

            try {
                const data = await projectService.getById(Number(id));
                setProject(data);
            } catch (error) {
                console.error('Erro ao carregar projeto:', error);
                toast.error('Erro ao carregar projeto. Redirecionando...');
                navigate('/projects');
            } finally {
                setFetching(false);
            }
        };

        if (id && !authLoading) {
            fetchProject();
        }
    }, [id, navigate, authLoading, isAdmin]);

    // Se não é admin, não renderiza nada (vai redirecionar)
    if (!authLoading && user && !isAdmin) {
        return null;
    }

    const handleSubmit = async (data: any) => {
        if (!id) return;

        try {
            setLoading(true);
            await updateProject(Number(id), data);
            navigate('/projects');
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            toast.error('Erro ao atualizar projeto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/projects');
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

    if (fetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando projeto...</p>
                </Card>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Projeto não encontrado
                    </h2>
                    <p className="text-gray-600 mb-6">
                        O projeto que você está procurando não foi encontrado.
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
            <div className="max-w-2xl mx-auto space-y-6">
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
                                        Editar Projeto
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                        #{project.id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Atualize os dados do projeto "{project.name}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulário */}
                    <div className="px-4 py-5 sm:px-6">
                        <ProjectForm
                            initialData={project}
                            onSubmit={handleSubmit}
                            loading={loading}
                        />
                    </div>
                </Card>

                {/* Informações Adicionais - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Metadados */}
                    <Card className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Informações do Projeto
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Criado em:</span>
                                <span className="text-gray-900">{formatDate(project.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Atualizado em:</span>
                                <span className="text-gray-900">{formatDate(project.updatedAt)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectEdit;