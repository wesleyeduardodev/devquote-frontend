import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderOpen, Github, Code, Globe } from 'lucide-react';
import useProjects from '../../hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectForm from '../../components/forms/ProjectForm';
import toast from 'react-hot-toast';

const ProjectCreate: React.FC = () => {
    const navigate = useNavigate();
    const { createProject } = useProjects();
    const { hasProfile, user } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);

    // Verifica se o usuário é ADMIN (apenas ADMIN pode criar projetos)
    const isAdmin = hasProfile('ADMIN');
    const authLoading = !user;

    // Verificação de acesso - apenas ADMIN pode criar projetos
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

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);
            await createProject(data);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/projects');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Mobile/Desktop */}
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
                                    <FolderOpen className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Novo Projeto
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Preencha os dados para criar um novo projeto
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulário Responsivo */}
                    <div className="px-4 py-5 sm:px-6">
                        <ProjectForm
                            onSubmit={handleSubmit}
                            loading={loading}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProjectCreate;