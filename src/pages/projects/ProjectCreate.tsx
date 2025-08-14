import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import useProjects from '../../hooks/useProjects';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectForm from '../../components/forms/ProjectForm';

const ProjectCreate: React.FC = () => {
    const navigate = useNavigate();
    const {createProject} = useProjects();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);
            await createProject(data);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1"/> Voltar
                </Button>
            </div>

            <Card title="Novo Projeto" subtitle="Preencha os dados para criar um novo projeto">
                <ProjectForm onSubmit={handleSubmit} loading={loading}/>
            </Card>
        </div>
    );
};

export default ProjectCreate;