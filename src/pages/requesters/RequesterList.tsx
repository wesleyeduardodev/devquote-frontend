import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Mail, Phone, User } from 'lucide-react';
import { useRequesters } from '@/hooks/useRequesters';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { DataTable, TableColumn, TableAction } from '../../components/ui/DataTable';

const RequesterList = () => {
    const { requesters = [], loading = true, deleteRequester } = useRequesters();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (requester: any) => {
        if (window.confirm(`Tem certeza que deseja excluir o solicitante "${requester.name}"?`)) {
            try {
                setDeletingId(requester.id);
                await deleteRequester(requester.id);
            } catch (error) {
                console.error('Erro ao excluir solicitante:', error);
            } finally {
                setDeletingId(null);
            }
        }
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const columns: TableColumn[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            filterable: true,
            minWidth: '80px',
            render: (value) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    #{value}
                </span>
            )
        },
        {
            key: 'name',
            title: 'Nome',
            sortable: true,
            filterable: true,
            minWidth: '200px',
            render: (value) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                    <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true,
            filterable: true,
            minWidth: '250px',
            hideOnMobile: true,
            render: (value) => value ? (
                <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{value}</span>
                </div>
            ) : (
                <span className="text-gray-400 text-sm">-</span>
            )
        },
        {
            key: 'phone',
            title: 'Telefone',
            sortable: true,
            filterable: true,
            minWidth: '160px',
            hideOnMobile: true,
            render: (value) => value ? (
                <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span>{value}</span>
                </div>
            ) : (
                <span className="text-gray-400 text-sm">-</span>
            )
        },
        {
            key: 'createdAt',
            title: 'Criado em',
            sortable: true,
            minWidth: '160px',
            hideOnMobile: true,
            render: (value) => (
                <div className="text-sm text-gray-500">
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'updatedAt',
            title: 'Atualizado em',
            sortable: true,
            minWidth: '160px',
            hideOnMobile: true,
            render: (value, row) => {
                if (!value || value === row.createdAt) {
                    return <span className="text-gray-400 text-sm">-</span>;
                }
                return (
                    <div className="text-sm text-gray-500">
                        {formatDate(value)}
                    </div>
                );
            }
        }
    ];

    const actions: TableAction[] = [
        {
            key: 'edit',
            label: 'Editar',
            icon: <Edit className="w-4 h-4" />,
            variant: 'secondary',
            onClick: (requester) => {
                window.location.href = `/requesters/${requester.id}/edit`;
            }
        },
        {
            key: 'delete',
            label: 'Excluir',
            icon: <Trash2 className="w-4 h-4" />,
            variant: 'danger',
            onClick: handleDelete,
            loading: (requester) => deletingId === requester.id,
            disabled: (requester) => deletingId === requester.id
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-none">
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Solicitantes
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Gerencie os solicitantes do sistema de orçamento
                        </p>
                    </div>

                    <Link to="/requesters/create">
                        <Button className="flex items-center w-full sm:w-auto justify-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Solicitante
                        </Button>
                    </Link>
                </div>

                {/* Tabela */}
                {requesters.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum solicitante encontrado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Comece criando seu primeiro solicitante para o sistema de orçamento.
                        </p>
                        <Link to="/requesters/create">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Primeiro Solicitante
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <DataTable
                        data={requesters}
                        columns={columns}
                        actions={actions}
                        emptyMessage="Nenhum solicitante encontrado com os filtros aplicados"
                    />
                )}
            </div>
        </div>
    );
};

export default RequesterList;
