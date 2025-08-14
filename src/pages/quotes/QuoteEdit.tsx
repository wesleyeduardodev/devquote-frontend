import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {ArrowLeft, Calculator} from 'lucide-react';
import {quoteService} from '@/services/quoteService';
import {taskService} from '@/services/taskService';
import toast from 'react-hot-toast';

const QuoteEdit: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchLoading, setFetchLoading] = useState<boolean>(true);
    const [quote, setQuote] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        taskId: '',
        status: 'DRAFT',
        totalAmount: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        if (!id) {
            navigate('/quotes');
            return;
        }

        try {
            setFetchLoading(true);
            const [quoteResponse, tasksResponse] = await Promise.all([
                quoteService.getById(Number(id)),
                taskService.getAll()
            ]);

            setQuote(quoteResponse);
            setTasks(tasksResponse);
            setFormData({
                taskId: quoteResponse.taskId.toString(),
                status: quoteResponse.status,
                totalAmount: quoteResponse.totalAmount.toString()
            });
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar orçamento');
            navigate('/quotes');
        } finally {
            setFetchLoading(false);
        }
    };

    const calculateTaskTotal = (taskId: string) => {
        const task = tasks.find((t: any) => t.id === parseInt(taskId));
        if (!task || !task.subTasks) return 0;

        return task.subTasks.reduce((total: number, subTask: any) => {
            return total + (parseFloat(subTask.amount) || 0);
        }, 0);
    };

    const handleTaskChange = (taskId: string) => {
        const taskTotal = calculateTaskTotal(taskId);
        setFormData(prev => ({
            ...prev,
            taskId,
            totalAmount: taskTotal.toFixed(2)
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;

        if (name === 'taskId') {
            handleTaskChange(value);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.taskId) {
            toast.error('Selecione uma tarefa');
            return;
        }

        if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
            toast.error('Valor total deve ser maior que zero');
            return;
        }

        if (!id) return;

        try {
            setLoading(true);
            await quoteService.update(Number(id), {
                taskId: parseInt(formData.taskId),
                status: formData.status,
                totalAmount: parseFloat(formData.totalAmount)
            });
            toast.success('Orçamento atualizado com sucesso!');
            navigate('/quotes');
        } catch (error) {
            console.error('Erro ao atualizar orçamento:', error);
            toast.error('Erro ao atualizar orçamento');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/quotes');
    };

    const handleRecalculate = () => {
        if (formData.taskId) {
            const taskTotal = calculateTaskTotal(formData.taskId);
            setFormData(prev => ({
                ...prev,
                totalAmount: taskTotal.toFixed(2)
            }));
            toast.success('Valor recalculado com base nas subtarefas');
        }
    };

    const getTaskDetails = (taskId: string) => {
        const task = tasks.find((t: any) => t.id === parseInt(taskId));
        if (!task) return null;

        const subTasksCount = task.subTasks ? task.subTasks.length : 0;
        const calculatedTotal = calculateTaskTotal(taskId);

        return {
            title: task.title,
            description: task.description,
            subTasksCount,
            calculatedTotal
        };
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Carregando orçamento...</span>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Orçamento não encontrado</h2>
                <p className="text-gray-600 mb-4">O orçamento que você está procurando não foi encontrado.</p>
                <button
                    onClick={handleCancel}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Voltar para Listagem
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleCancel}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1"/>
                    Voltar
                </button>
            </div>

            {/* Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Editar Orçamento</h1>
                    <p className="text-gray-600 mt-1">Orçamento #{quote.id}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seleção de Tarefa */}
                    <div>
                        <label htmlFor="taskId" className="block text-sm font-medium text-gray-700 mb-2">
                            Tarefa *
                        </label>
                        <select
                            id="taskId"
                            name="taskId"
                            value={formData.taskId}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Selecione uma tarefa</option>
                            {tasks.map((task: any) => (
                                <option key={task.id} value={task.id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Detalhes da Tarefa Selecionada */}
                    {formData.taskId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-blue-900">Detalhes da Tarefa</h4>
                                <button
                                    type="button"
                                    onClick={handleRecalculate}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                                >
                                    <Calculator className="w-4 h-4 mr-1"/>
                                    Recalcular
                                </button>
                            </div>
                            {(() => {
                                const details = getTaskDetails(formData.taskId);
                                if (!details) return null;

                                return (
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <div><strong>Título:</strong> {details.title}</div>
                                        {details.description && (
                                            <div><strong>Descrição:</strong> {details.description}</div>
                                        )}
                                        <div><strong>Subtarefas:</strong> {details.subTasksCount}</div>
                                        <div className="flex items-center">
                                            <Calculator className="w-4 h-4 mr-1"/>
                                            <strong>Total Calculado:</strong> {formatCurrency(details.calculatedTotal)}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status *
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="DRAFT">Rascunho</option>
                            <option value="PENDING">Pendente</option>
                            <option value="APPROVED">Aprovado</option>
                            <option value="REJECTED">Rejeitado</option>
                        </select>
                    </div>

                    {/* Valor Total */}
                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Total *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">R$</span>
                            <input
                                type="number"
                                id="totalAmount"
                                name="totalAmount"
                                value={formData.totalAmount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0.01"
                                required
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Valor calculado automaticamente com base nas subtarefas, mas pode ser editado
                        </p>
                    </div>
                    <div className="flex space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div
                                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuoteEdit;