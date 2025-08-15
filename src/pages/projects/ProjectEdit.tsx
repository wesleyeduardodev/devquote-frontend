import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {projectService} from '@/services/projectService';
import useProjects from '../../hooks/useProjects';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectForm from '../../components/forms/ProjectForm';

const ProjectEdit: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {updateProject} = useProjects();
    const [loading, setLoading] = useState<boolean>(false);
    const [project, setProject] = useState<any>(null);
    const [fetching, setFetching] = useState<boolean>(true);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) {
                navigate('/projects');
                return;
            }

            try {
                const data = await projectService.getById(Number(id));
                setProject(data);
            } catch (error) {
                alert('Erro ao carregar projeto');
                navigate('/projects');
            } finally {
                setFetching(false);
            }
        };

        if (id) fetchProject();
    }, [id, navigate]);

    const handleSubmit = async (data: any) => {
        if (!id) return;

        try {
            setLoading(true);
            await updateProject(Number(id), data);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-center py-8">Carregando...</div>;
    if (!project) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1"/> Voltar
                </Button>
            </div>

            <Card
                title={
                    <div className="flex items-center gap-2">
                        <span>Editar Projeto</span>
                        <span
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            #{project.id}
                        </span>
                    </div>
                }
                subtitle={`Atualize os dados do projeto "${project.name}"`}
            >
                <ProjectForm initialData={project} onSubmit={handleSubmit} loading={loading}/>
            </Card>
        </div>
    );
};

export default ProjectEdit;
