import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import toast from 'react-hot-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      toast.error('Erro ao buscar projetos');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    const newProject = await projectService.create(projectData);
    setProjects(prev => [...prev, newProject]);
    toast.success('Projeto criado com sucesso!');
  };

  const updateProject = async (id, projectData) => {
    const updated = await projectService.update(id, projectData);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
    toast.success('Projeto atualizado com sucesso!');
  };

  const deleteProject = async (id) => {
    await projectService.delete(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Projeto excluído com sucesso!');
  };

  useEffect(() => { fetchProjects(); }, []);

  return { projects, loading, createProject, updateProject, deleteProject };
};

export default useProjects;
