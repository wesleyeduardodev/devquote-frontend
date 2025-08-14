import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, DollarSign, CheckSquare, FileText, FolderGit2, Truck } from 'lucide-react';
import { useRequesters } from '@/hooks/useRequesters';
import { useTasks } from '@/hooks/useTasks';
import { useQuotes } from '@/hooks/useQuotes';
import { useProjects } from '@/hooks/useProjects';
import { useDeliveries } from '@/hooks/useDeliveries';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard = () => {
    const { requesters = [], loading: requestersLoading = true } = useRequesters();
    const { tasks = [], loading: tasksLoading = true } = useTasks();
    const { quotes = [], loading: quotesLoading = true } = useQuotes();
    const { projects = [], loading: projectsLoading = true } = useProjects();
    const { deliveries = [], loading: deliveriesLoading = true } = useDeliveries();

    const calculateTaskStats = () => {
        if (!tasks.length) return { total: 0, totalValue: 0, completedTasks: 0 };

        const totalValue = tasks.reduce((sum: number, task: any) => {
            const taskTotal = task.subTasks?.reduce((subSum: number, subTask: any) => subSum + (subTask.amount || 0), 0) || 0;
            return sum + taskTotal;
        }, 0);

        const completedTasks = tasks.filter((task: any) => task.status === 'COMPLETED').length;

        return {
            total: tasks.length,
            totalValue,
            completedTasks
        };
    };

    const taskStats = calculateTaskStats();

    // Estatísticas de orçamentos
    const calculateQuoteStats = () => {
        if (!quotes.length) return { total: 0, totalValue: 0 };

        const totalValue = quotes.reduce((sum: number, quote: any) => sum + (quote.totalAmount || 0), 0);

        return {
            total: quotes.length,
            totalValue
        };
    };

    const quoteStats = calculateQuoteStats();

    const calculateDeliveryStats = () => {
        if (!deliveries.length) return { total: 0, delivered: 0, approved: 0 };

        const delivered = deliveries.filter((delivery: any) => delivery.status === 'DELIVERED').length;
        const approved = deliveries.filter((delivery: any) => delivery.status === 'APPROVED').length;

        return {
            total: deliveries.length,
            delivered,
            approved
        };
    };

    const deliveryStats = calculateDeliveryStats();

    const formatCurrency = (value: any) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const stats = [
        {
            title: 'Total de Solicitantes',
            value: requestersLoading ? '-' : requesters.length,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Total de Tarefas',
            value: tasksLoading ? '-' : taskStats.total,
            icon: CheckSquare,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Valor Total Tarefas',
            value: tasksLoading ? '-' : formatCurrency(taskStats.totalValue),
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Total de Orçamentos',
            value: quotesLoading ? '-' : quoteStats.total,
            icon: FileText,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Valor Total Orçamentos',
            value: quotesLoading ? '-' : formatCurrency(quoteStats.totalValue),
            icon: DollarSign,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100',
        },
        {
            title: 'Total de Projetos',
            value: projectsLoading ? '-' : projects.length,
            icon: FolderGit2,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
        },
        {
            title: 'Total de Entregas',
            value: deliveriesLoading ? '-' : deliveryStats.total,
            icon: Truck,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Bem-vindo ao sistema de controle de orçamento</p>
            </div>

            {/* Cards Estatísticos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="hover:shadow-custom-lg transition-shadow">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Ações rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card title="Solicitantes" subtitle="Gerencie os solicitantes do sistema">
                    <div className="space-y-4">
                        {requestersLoading ? (
                            <div className="text-gray-600">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : (
                            <p className="text-gray-600">
                                {requesters.length} solicitante{requesters.length !== 1 ? 's' : ''} cadastrado{requesters.length !== 1 ? 's' : ''}
                            </p>
                        )}

                        <div className="flex space-x-3">
                            <Link to="/requesters">
                                <Button variant="outline" size="sm">Ver Todos</Button>
                            </Link>
                            <Link to="/requesters/create">
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Novo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                <Card title="Tarefas" subtitle="Gerencie tarefas e subtarefas">
                    <div className="space-y-4">
                        <div className="text-gray-600">
                            {tasksLoading ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <div className="space-y-1">
                                    <p>{taskStats.total} tarefa{taskStats.total !== 1 ? 's' : ''}</p>
                                    <p className="text-xs">{taskStats.completedTasks} concluída{taskStats.completedTasks !== 1 ? 's' : ''}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Link to="/tasks">
                                <Button variant="outline" size="sm">Ver Todas</Button>
                            </Link>
                            <Link to="/tasks/create">
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Nova
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                <Card title="Orçamentos" subtitle="Gerencie os orçamentos do sistema">
                    <div className="space-y-4">
                        <div className="text-gray-600">
                            {quotesLoading ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <div className="space-y-1">
                                    <p>{quoteStats.total} orçamento{quoteStats.total !== 1 ? 's' : ''}</p>
                                    <p className="text-xs font-semibold text-primary-600">
                                        Total: {formatCurrency(quoteStats.totalValue)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Link to="/quotes">
                                <Button variant="outline" size="sm">Ver Todos</Button>
                            </Link>
                            <Link to="/quotes/create">
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Novo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                <Card title="Projetos" subtitle="Gerencie os projetos do sistema">
                    <div className="space-y-4">
                        <div className="text-gray-600">
                            {projectsLoading ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <p>{projects.length} projeto{projects.length !== 1 ? 's' : ''} cadastrado{projects.length !== 1 ? 's' : ''}</p>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Link to="/projects">
                                <Button variant="outline" size="sm">Ver Todos</Button>
                            </Link>
                            <Link to="/projects/create">
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Novo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Entregas - Card separado */}
            <Card title="Entregas" subtitle="Gerencie as entregas dos projetos">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {deliveriesLoading ? '-' : deliveryStats.total}
                        </div>
                        <div className="text-sm text-gray-600">Total de Entregas</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {deliveriesLoading ? '-' : deliveryStats.approved}
                        </div>
                        <div className="text-sm text-gray-600">Entregas Aprovadas</div>
                    </div>
                    <div className="flex space-x-3 justify-center">
                        <Link to="/deliveries">
                            <Button variant="outline" size="sm">Ver Todas</Button>
                        </Link>
                        <Link to="/deliveries/create">
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Nova Entrega
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>

            {/* Resumo do Sistema */}
            <Card title="Resumo do Sistema">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
                    <div className="space-y-2">
                        <div className="text-2xl font-bold text-blue-600">{requesters.length}</div>
                        <div className="text-sm text-gray-600">Solicitantes</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl font-bold text-green-600">{taskStats.total}</div>
                        <div className="text-sm text-gray-600">Tarefas</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl font-bold text-yellow-600">{quoteStats.total}</div>
                        <div className="text-sm text-gray-600">Orçamentos</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl font-bold text-indigo-600">{projects.length}</div>
                        <div className="text-sm text-gray-600">Projetos</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl font-bold text-orange-600">{deliveryStats.total}</div>
                        <div className="text-sm text-gray-600">Entregas</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl font-bold text-purple-600">
                            {taskStats.total > 0 ? Math.round((taskStats.completedTasks / taskStats.total) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Taxa Conclusão</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;