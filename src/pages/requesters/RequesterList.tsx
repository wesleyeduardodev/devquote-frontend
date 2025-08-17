import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useRequesters } from '@/hooks/useRequesters';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface Requester {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

const RequesterList: React.FC = () => {
    const navigate = useNavigate();
    const {
        requesters,
        pagination,
        loading,
        sorting,
        filters,
        setPage,
        setPageSize,
        setSorting,
        setFilter,
        clearFilters,
        deleteRequester
    } = useRequesters();

    const handleEdit = (id: number) => {
        navigate(`/requesters/${id}/edit`);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este solicitante?')) {
            try {
                await deleteRequester(id);
            } catch (error) {
                toast.error('Erro ao excluir solicitante');
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns: Column<Requester>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'number',
            width: '120px',
            align: 'center',
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
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                </div>
            )
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => (
                <a
                    href={`mailto:${item.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {item.email || '-'}
                </a>
            )
        },
        {
            key: 'phone',
            title: 'Telefone',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (item) => item.phone || '-'
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.createdAt)
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            filterable: true,
            filterType: 'date',
            render: (item) => formatDate(item.updatedAt),
            hideable: true
        },
        {
            key: 'actions',
            title: 'Ações',
            align: 'center',
            width: '120px',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item.id)}
                        title="Editar"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Solicitantes</h1>
                    <p className="text-gray-600 mt-1">Gerencie os solicitantes do sistema</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/requesters/create')}
                    className="flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Solicitante
                </Button>
            </div>

            {/* Table Card */}
            <Card className="p-0">
                <DataTable
                    data={requesters}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    sorting={sorting}
                    filters={filters}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    onSort={setSorting}
                    onFilter={setFilter}
                    onClearFilters={clearFilters}
                    emptyMessage="Nenhum solicitante encontrado"
                    showColumnToggle={true}
                    hiddenColumns={['updatedAt']} // Coluna updatedAt oculta por padrão
                />
            </Card>
        </div>
    );
};

export default RequesterList;
