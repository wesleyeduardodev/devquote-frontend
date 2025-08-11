import api from './api.js';

export const taskService = {
  // Listar todas as tarefas
  getAll: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  // Buscar tarefa por ID
  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Criar tarefa com subtarefas
  createWithSubTasks: async (data) => {
    const response = await api.post('/tasks/full', data);
    return response.data;
  },

  // Atualizar tarefa com subtarefas
  updateWithSubTasks: async (id, data) => {
    const response = await api.put(`/tasks/full/${id}`, data);
    return response.data;
  },

  // Deletar tarefa com subtarefas
  deleteTaskWithSubTasks: async (id) => {
    await api.delete(`/tasks/full/${id}`);
    return true;
  },
};