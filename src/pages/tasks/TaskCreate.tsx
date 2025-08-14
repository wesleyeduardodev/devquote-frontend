import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {useTasks} from '@/hooks/useTasks';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TaskForm from '../../components/forms/TaskForm';

const TaskCreate = () => {
    const navigate = useNavigate();
    const {createTaskWithSubTasks} = useTasks();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);
            await createTaskWithSubTasks(data);
            navigate('/tasks');
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/tasks');
    };

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
                title="Nova Tarefa"
                subtitle="Preencha as informações para criar uma nova tarefa com suas subtarefas"
            >
                <TaskForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
            </Card>
        </div>
    );
};

export default TaskCreate;