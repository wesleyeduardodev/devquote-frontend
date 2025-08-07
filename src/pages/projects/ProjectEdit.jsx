import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { projectService } from '../../services/projectService';
import useProjects from '../../hooks/useProjects';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectForm from '../../components/forms/ProjectForm';

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateProject } = useProjects();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getById(id);
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

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      await updateProject(id, data);
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
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      </div>

      <Card title="Editar Projeto" subtitle={`Atualize os dados do projeto "${project.name}"`}>
        <ProjectForm initialData={project} onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
};

export default ProjectEdit;
