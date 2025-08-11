import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar tarefas:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTaskWithSubTasks = async (taskData) => {
    try {
      const newTask = await taskService.createWithSubTasks(taskData);
      setTasks(prev => [...prev, newTask]);
      toast.success('Tarefa criada com sucesso!');
      return newTask;
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      throw err;
    }
  };

  const updateTaskWithSubTasks = async (id, taskData) => {
    try {
      const updatedTask = await taskService.updateWithSubTasks(id, taskData);
      setTasks(prev => 
        prev.map(task => task.id === id ? updatedTask : task)
      );
      toast.success('Tarefa atualizada com sucesso!');
      return updatedTask;
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      throw err;
    }
  };

  const deleteTaskWithSubTasks = async (id) => {
    try {
      await taskService.deleteTaskWithSubTasks(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Tarefa excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTaskWithSubTasks,
    updateTaskWithSubTasks,
    deleteTaskWithSubTasks,
  };
};

export default useTasks;