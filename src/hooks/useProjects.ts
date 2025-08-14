import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services/projectService';
import toast from 'react-hot-toast';

interface Project {
    id: number;
    name: string;
    repositoryUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ProjectCreate {
    name: string;
    repositoryUrl?: string;
}

interface ProjectUpdate extends Partial<ProjectCreate> {
    id?: number;
}

interface UseProjectsReturn {
    projects: Project[];
    loading: boolean;
    error?: string | null;
    fetchProjects: () => Promise<void>;
    createProject: (projectData: ProjectCreate) => Promise<Project>;
    updateProject: (id: number, projectData: ProjectUpdate) => Promise<Project>;
    deleteProject: (id: number) => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const data = await projectService.getAll();
            setProjects(data);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar projetos:', err);
            setError(err.message || 'Erro ao buscar projetos');
            toast.error('Erro ao buscar projetos');
        } finally {
            setLoading(false);
        }
    }, []);

    const createProject = useCallback(async (projectData: ProjectCreate): Promise<Project> => {
        try {
            const newProject = await projectService.create(projectData);
            setProjects(prev => [...prev, newProject]);
            toast.success('Projeto criado com sucesso!');
            return newProject;
        } catch (err: any) {
            console.error('Erro ao criar projeto:', err);
            throw err;
        }
    }, []);

    const updateProject = useCallback(async (id: number, projectData: ProjectUpdate): Promise<Project> => {
        try {
            const updated = await projectService.update(id, projectData);
            setProjects(prev => prev.map(p => p.id === id ? updated : p));
            toast.success('Projeto atualizado com sucesso!');
            return updated;
        } catch (err: any) {
            console.error('Erro ao atualizar projeto:', err);
            throw err;
        }
    }, []);

    const deleteProject = useCallback(async (id: number): Promise<void> => {
        try {
            await projectService.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success('Projeto excluído com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir projeto:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return {
        projects,
        loading,
        error,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject
    };
};

export default useProjects;