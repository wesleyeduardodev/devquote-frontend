import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Plus, Edit, Trash2, FileText, DollarSign, Calendar} from 'lucide-react';
import {quoteService} from '@/services/quoteService';
import {taskService} from '@/services/taskService';
import toast from 'react-hot-toast';

const QuoteList: React.FC = () => {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [quotesResponse, tasksResponse] = await Promise.all([
                quoteService.getAll(),
                taskService.getAll()
            ]);
            setQuotes(quotesResponse);
            setTasks(tasksResponse);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar orçamentos');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
            try {
                setDeletingId(id);
                await quoteService.delete(id);
                toast.success('Orçamento excluído com sucesso!');
                fetchData(); // Recarregar dados
            } catch (error) {
                console.error('Erro ao excluir orçamento:', error);
                toast.error('Erro ao excluir orçamento');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const getTaskName = (taskId: number) => {
        const task = tasks.find((t: any) => t.id === taskId);
        return task ? task.title : `Tarefa #${taskId}`;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            'PENDING': {bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente'},
            'APPROVED': {bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado'},
            'REJECTED': {bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado'},
            'DRAFT': {bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho'}
        };

        const config = statusConfig[status] || {bg: 'bg-gray-100', text: 'text-gray-800', label: status};

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Carregando orçamentos...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Orçamentos
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Gerencie os orçamentos do sistema
                    </p>
                </div>

                <Link to="/quotes/create">
                    <button
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4 mr-2"/>
                        Novo Orçamento
                    </button>
                </Link>
            </div>

            {/* Lista de Orçamentos */}
            {quotes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-100">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum orçamento encontrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Comece criando seu primeiro orçamento para uma tarefa.
                    </p>
                    <Link to="/quotes/create">
                        <button
                            className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4 mr-2"/>
                            Criar Primeiro Orçamento
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map((quote: any) => (
                        <div key={quote.id}
                             className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="space-y-4">
                                {/* Header do Card */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Orçamento
                                            </h3>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                #{quote.id}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <FileText className="w-4 h-4 mr-2 flex-shrink-0"/>
                                                <span className="truncate">{getTaskName(quote.taskId)}</span>
                                            </div>

                                            <div className="flex items-center text-sm text-gray-600">
                                                <DollarSign className="w-4 h-4 mr-2 flex-shrink-0"/>
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(quote.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-2">
                                        {getStatusBadge(quote.status)}
                                    </div>
                                </div>

                                {/* Datas */}
                                <div className="text-xs text-gray-500 border-t pt-3">
                                    <div className="flex items-center mb-1">
                                        <Calendar className="w-3 h-3 mr-1"/>
                                        Criado: {formatDate(quote.createdAt)}
                                    </div>
                                    {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1"/>
                                            Atualizado: {formatDate(quote.updatedAt)}
                                        </div>
                                    )}
                                </div>

                                {/* Botões de Ação */}
                                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                                    <Link to={`/quotes/${quote.id}/edit`}>
                                        <button
                                            className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                            <Edit className="w-4 h-4 mr-1"/>
                                            Editar
                                        </button>
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(quote.id)}
                                        disabled={deletingId === quote.id}
                                        className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === quote.id ? (
                                            <div
                                                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                        ) : (
                                            <Trash2 className="w-4 h-4 mr-1"/>
                                        )}
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuoteList;
