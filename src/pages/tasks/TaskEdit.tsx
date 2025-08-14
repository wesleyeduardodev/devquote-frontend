import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useTasks} from '@/hooks/useTasks';
import {taskService} from '@/services/taskService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TaskForm from '../../components/forms/TaskForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TaskEdit = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {updateTaskWithSubTasks} = useTasks();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        const fetchTask = async () => {
            if (!id) {
                navigate('/tasks');
                return;
            }

            try {
                setFetchLoading(true);
                const data = await taskService.getById(Number(id));
                setTask(data);
            } catch (error) {
                navigate('/tasks');
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) {
            fetchTask();
        }
    }, [id, navigate]);

    const handleSubmit = async (data: any) => {
        if (!id) return;

        try {
            setLoading(true);
            await updateTaskWithSubTasks(Number(id), data);
            navigate('/tasks');
        } catch (error) {
            // Error handled by the hook and form
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/tasks');
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg"/>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Tarefa não encontrada.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 mr-1"/>
                    Voltar
                </Button>
            </div>

            <Card
                title="Editar Tarefa"
                subtitle={`Atualize as informações da tarefa: ${(task as any)?.title || 'Carregando...'}`}
            >
                <TaskForm
                    initialData={task}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default TaskEdit;