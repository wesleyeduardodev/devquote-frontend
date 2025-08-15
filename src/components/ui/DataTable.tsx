// components/ui/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';

export interface TableColumn<T = any> {
    key: string;
    title: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
    minWidth?: string;
    render?: (value: any, row: T) => React.ReactNode;
    filterType?: 'text' | 'select';
    filterOptions?: { value: string; label: string }[];
    hideOnMobile?: boolean;
}

export interface TableAction<T = any> {
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick: (row: T) => void;
    loading?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
    hideOnMobile?: boolean;
}

interface DataTableProps<T = any> {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    rowKey?: string;
}

export const DataTable = <T extends Record<string, any>>({
                                                             data,
                                                             columns,
                                                             actions = [],
                                                             loading = false,
                                                             emptyMessage = "Nenhum item encontrado",
                                                             className = "",
                                                             rowKey = "id"
                                                         }: DataTableProps<T>) => {
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [filters, setFilters] = useState<Record<string, string>>({});

    // Aplicar filtros
    const filteredData = useMemo(() => {
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                const column = columns.find(col => col.key === key);
                const itemValue = item[key];

                if (column?.filterType === 'select') {
                    return itemValue === value;
                }

                // Filtro de texto
                return String(itemValue || '').toLowerCase().includes(value.toLowerCase());
            });
        });
    }, [data, filters, columns]);

    // Aplicar ordenação
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === bValue) return 0;

            const isAsc = sortConfig.direction === 'asc';

            if (aValue === null || aValue === undefined) return isAsc ? 1 : -1;
            if (bValue === null || bValue === undefined) return isAsc ? -1 : 1;

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return isAsc ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();

            return isAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
    }, [filteredData, sortConfig]);

    const handleSort = (key: string) => {
        const column = columns.find(col => col.key === key);
        if (!column?.sortable) return;

        setSortConfig(current => {
            if (current?.key === key) {
                if (current.direction === 'asc') {
                    return { key, direction: 'desc' };
                } else if (current.direction === 'desc') {
                    return null; // Remove sort
                }
            }
            return { key, direction: 'asc' };
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilter = (key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        });
    };

    const clearAllFilters = () => {
        setFilters({});
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronUp className="w-4 h-4 text-gray-300" />;
        }
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-4 h-4 text-blue-600" />
            : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    const getVariantClasses = (variant?: string) => {
        switch (variant) {
            case 'primary':
                return 'bg-blue-600 text-white hover:bg-blue-700';
            case 'danger':
                return 'bg-red-600 text-white hover:bg-red-700';
            case 'secondary':
            default:
                return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
        }
    };

    const hasActiveFilters = Object.values(filters).some(value => value);
    const visibleActions = actions.filter(action => !action.hideOnMobile);

    if (loading) {
        return (
            <div className="w-full bg-white rounded-lg shadow overflow-hidden">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-200"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full bg-white rounded-lg shadow overflow-hidden ${className}`}>
            {/* Filtros ativos */}
            {hasActiveFilters && (
                <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-blue-700">
                            <Search className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-shrink-0">Filtros:</span>
                            {Object.entries(filters).map(([key, value]) => {
                                if (!value) return null;
                                const column = columns.find(col => col.key === key);
                                return (
                                    <span key={key} className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    <span className="truncate max-w-24">{column?.title}: {value}</span>
                    <button
                        onClick={() => clearFilter(key)}
                        className="ml-1 hover:text-blue-600 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                                );
                            })}
                        </div>
                        <button
                            onClick={clearAllFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 flex-shrink-0"
                        >
                            Limpar todos
                        </button>
                    </div>
                </div>
            )}

            {/* Container responsivo */}
            <div className="w-full overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                        column.hideOnMobile ? 'hidden sm:table-cell' : ''
                                    } ${column.width || ''} ${column.minWidth ? `min-w-[${column.minWidth}]` : ''}`}
                                    style={column.minWidth ? { minWidth: column.minWidth } : {}}
                                >
                                    <div className="space-y-2">
                                        {/* Header com ordenação */}
                                        <div className="flex items-center space-x-1">
                                            <span className="flex-1 truncate">{column.title}</span>
                                            {column.sortable && (
                                                <button
                                                    onClick={() => handleSort(column.key)}
                                                    className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                                                >
                                                    {getSortIcon(column.key)}
                                                </button>
                                            )}
                                        </div>

                                        {/* Campo de filtro */}
                                        {column.filterable && (
                                            <div className="relative min-w-[120px]">
                                                {column.filterType === 'select' && column.filterOptions ? (
                                                    <select
                                                        value={filters[column.key] || ''}
                                                        onChange={(e) => handleFilterChange(column.key, e.target.value)}
                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">Todos</option>
                                                        {column.filterOptions.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Filtrar..."
                                                            value={filters[column.key] || ''}
                                                            onChange={(e) => handleFilterChange(column.key, e.target.value)}
                                                            className="w-full text-xs border border-gray-300 rounded pl-6 pr-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                        <Search className="w-3 h-3 text-gray-400 absolute left-1.5 top-1.5" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}

                            {visibleActions.length > 0 && (
                                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                    Ações
                                </th>
                            )}
                        </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (visibleActions.length > 0 ? 1 : 0)}
                                    className="px-3 sm:px-6 py-12 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row) => (
                                <tr key={row[rowKey]} className="hover:bg-gray-50">
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-3 sm:px-6 py-4 text-sm text-gray-900 ${
                                                column.hideOnMobile ? 'hidden sm:table-cell' : ''
                                            }`}
                                        >
                                            <div className="truncate max-w-xs">
                                                {column.render
                                                    ? column.render(row[column.key], row)
                                                    : row[column.key]
                                                }
                                            </div>
                                        </td>
                                    ))}

                                    {visibleActions.length > 0 && (
                                        <td className="px-3 sm:px-6 py-4 text-right text-sm">
                                            <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                                                {actions.map((action) => {
                                                    if (action.hideOnMobile && window.innerWidth < 640) return null;

                                                    const isLoading = action.loading?.(row) || false;
                                                    const isDisabled = action.disabled?.(row) || false;

                                                    return (
                                                        <button
                                                            key={action.key}
                                                            onClick={() => action.onClick(row)}
                                                            disabled={isDisabled || isLoading}
                                                            className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border text-xs font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getVariantClasses(action.variant)} whitespace-nowrap`}
                                                        >
                                                            {isLoading ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                                                            ) : (
                                                                action.icon && <span className="mr-1 sm:mr-1">{action.icon}</span>
                                                            )}
                                                            <span className="hidden sm:inline">{action.label}</span>
                                                            <span className="sm:hidden">{action.icon}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer com informações */}
            <div className="px-3 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-1 sm:space-y-0">
          <span>
            Mostrando {sortedData.length} de {data.length} registros
          </span>
                    {hasActiveFilters && (
                        <span>({data.length - sortedData.length} filtrados)</span>
                    )}
                </div>
            </div>
        </div>
    );
};
