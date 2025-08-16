import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus, Edit, Trash2, User, Mail, Phone} from 'lucide-react';
import {useRequesters} from '@/hooks/useRequesters';
import Button from '../../components/ui/Button';
import DataTable, { Column } from '../../components/ui/DataTable';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

const RequesterList = () => {
    const {
        requesters,
        pagination,
        loading,
        error,
        sorting,
        deleteRequester,
        setPage,
        setPageSize,
        setSorting
    } = useRequesters();

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(['updatedAt']); // Oculta coluna "Atualizado em" por padrão

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este solicitante?')) {
            try {
                setDeletingId(id);
                await deleteRequester(id);
            } catch (error) {
                console.error('Erro ao excluir solicitante:', error);
            } finally {
                setDeletingId(null);
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns: Column<Requester>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            width: '80px',
            align: 'center',
            hideable: false, // ID sempre visível
            render: (item) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{item.id}
                </span>
            )
        },
        {
            key: 'name',
            title: 'Nome',
            sortable: true,
            hideable: false, // Nome sempre visível
            render: (item) => (
                <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">{item.name}</span>
                </div>
            )
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true,
            hideable: true, // Pode ser ocultado
            render: (item) => item.email ? (
                <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{item.email}</span>
                </div>
            ) : (
                <span className="text-gray-400">-</span>
            )
        },
        {
            key: 'phone',
            title: 'Telefone',
            sortable: true,
            hideable: true, // Pode ser ocultado
            render: (item) => item.phone ? (
                <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{item.phone}</span>
                </div>
            ) : (
                <span className="text-gray-400">-</span>
            )
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            width: '180px',
            hideable: true, // Pode ser ocultado
            render: (item) => (
                <span className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                </span>
            )
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            width: '180px',
            hideable: true, // Pode ser ocultado
            render: (item) => (
                <span className="text-sm text-gray-500">
                    {formatDate(item.updatedAt)}
                </span>
            )
        },
        {
            key: 'actions',
            title: 'Ações',
            width: '150px',
            align: 'center',
            hideable: false, // Ações sempre visíveis
            render: (item) => (
                <div className="flex items-center justify-center space-x-2">
                    <Link to={`/requesters/${item.id}/edit`}>
                        <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(item.id)}
                        loading={deletingId === item.id}
                        disabled={deletingId === item.id}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    const handlePageChange = (page: number) => {
        setPage(page);
    };

    const handlePageSizeChange = (pageSize: number) => {
        setPageSize(pageSize);
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        setSorting(field, direction);
    };

    const handleColumnVisibilityChange = (newHiddenColumns: string[]) => {
        setHiddenColumns(newHiddenColumns);
        // Aqui você pode salvar a preferência do usuário no localStorage ou backend
        localStorage.setItem('requester-hidden-columns', JSON.stringify(newHiddenColumns));
    };

    // Carrega preferências salvas ao montar o componente
    React.useEffect(() => {
        const savedHiddenColumns = localStorage.getItem('requester-hidden-columns');
        if (savedHiddenColumns) {
            try {
                const parsed = JSON.parse(savedHiddenColumns);
                setHiddenColumns(parsed);
            } catch (error) {
                console.warn('Erro ao carregar preferências de colunas:', error);
            }
        }
    }, []);

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">
                        <strong>Erro:</strong> {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Solicitantes
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Gerencie os solicitantes do sistema de orçamento
                    </p>
                </div>

                <Link to="/requesters/create">
                    <Button className="flex items-center">
                        <Plus className="w-4 h-4 mr-2"/>
                        Novo Solicitante
                    </Button>
                </Link>
            </div>

            <DataTable
                data={requesters}
                columns={columns}
                loading={loading}
                pagination={pagination}
                sorting={sorting}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSort={handleSort}
                showColumnToggle={true}
                hiddenColumns={hiddenColumns}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                emptyMessage="Nenhum solicitante encontrado. Comece criando seu primeiro solicitante para o sistema de orçamento."
                className="shadow-lg"
            />
        </div>
    );
};

export default RequesterList;
