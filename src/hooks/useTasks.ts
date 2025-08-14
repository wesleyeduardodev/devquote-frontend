import { useState, useEffect, useCallback } from 'react';
import { taskService } from '@/services/taskService';
import toast from 'react-hot-toast';

interface SubTask {
    id?: number;
    title: string;
    description?: string;
    amount: number;
    status: string;
    taskId?: number;
    excluded?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface Task {
    id: number;
    requesterId: number;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    subTasks?: SubTask[];
    createdAt?: string;
    updatedAt?: string;
}

interface TaskCreate {
    requesterId: number;
    title: string;
    description?: string;
    status: string;
    code: string;
    link?: string;
    subTasks: Omit<SubTask, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
}

interface TaskUpdate extends Partial<TaskCreate> {
    id?: number;
    subTasks?: SubTask[];
}

interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    fetchTasks: () => Promise<void>;
    createTaskWithSubTasks: (taskData: TaskCreate) => Promise<Task>;
    updateTaskWithSubTasks: (id: number, taskData: TaskUpdate) => Promise<Task>;
    deleteTaskWithSubTasks: (id: number) => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await taskService.getAll();
            setTasks(data);
        } catch (err: any) {
            const errorMessage = err.message || 'Erro ao buscar tarefas';
            setError(errorMessage);
            console.error('Erro ao buscar tarefas:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTaskWithSubTasks = useCallback(async (taskData: TaskCreate): Promise<Task> => {
        try {
            const newTask = await taskService.createWithSubTasks(taskData);
            setTasks(prev => [...prev, newTask]);
            toast.success('Tarefa criada com sucesso!');
            return newTask;
        } catch (err: any) {
            console.error('Erro ao criar tarefa:', err);
            throw err;
        }
    }, []);

    const updateTaskWithSubTasks = useCallback(async (id: number, taskData: TaskUpdate): Promise<Task> => {
        try {
            const updatedTask = await taskService.updateWithSubTasks(id, taskData);
            setTasks(prev =>
                prev.map(task => task.id === id ? updatedTask : task)
            );
            toast.success('Tarefa atualizada com sucesso!');
            return updatedTask;
        } catch (err: any) {
            console.error('Erro ao atualizar tarefa:', err);
            throw err;
        }
    }, []);

    const deleteTaskWithSubTasks = useCallback(async (id: number): Promise<void> => {
        try {
            await taskService.deleteTaskWithSubTasks(id);
            setTasks(prev => prev.filter(task => task.id !== id));
            toast.success('Tarefa excluída com sucesso!');
        } catch (err: any) {
            console.error('Erro ao excluir tarefa:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

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