import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, Settings } from 'lucide-react';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

export interface Column<T> {
    key: string;
    title: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
    hideable?: boolean; // Nova propriedade para controlar se a coluna pode ser ocultada
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
    first: boolean;
    last: boolean;
}

export interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    pagination?: PaginationInfo | null;
    sorting?: SortInfo[];
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
    emptyMessage?: string;
    className?: string;
    showColumnToggle?: boolean; // Nova propriedade para mostrar/ocultar o controle de colunas
    hiddenColumns?: string[]; // Colunas inicialmente ocultas
    onColumnVisibilityChange?: (hiddenColumns: string[]) => void; // Callback para mudanças na visibilidade
}

const DataTable = <T extends Record<string, any>>({
                                                      data,
                                                      columns,
                                                      loading = false,
                                                      pagination,
                                                      sorting = [],
                                                      onPageChange,
                                                      onPageSizeChange,
                                                      onSort,
                                                      emptyMessage = "Nenhum item encontrado",
                                                      className = "",
                                                      showColumnToggle = true,
                                                      hiddenColumns: initialHiddenColumns = [],
                                                      onColumnVisibilityChange
                                                  }: DataTableProps<T>) => {

    const [hiddenColumns, setHiddenColumns] = useState<string[]>(initialHiddenColumns);
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Filtra as colunas visíveis
    const visibleColumns = columns.filter(column => !hiddenColumns.includes(column.key));

    // Atualiza as colunas ocultas quando o prop inicial muda
    useEffect(() => {
        setHiddenColumns(initialHiddenColumns);
    }, [initialHiddenColumns]);

    const toggleColumn = (columnKey: string) => {
        const newHiddenColumns = hiddenColumns.includes(columnKey)
            ? hiddenColumns.filter(key => key !== columnKey)
            : [...hiddenColumns, columnKey];

        setHiddenColumns(newHiddenColumns);
        onColumnVisibilityChange?.(newHiddenColumns);
    };

    const getSortDirection = (field: string): 'asc' | 'desc' | null => {
        const sortInfo = sorting.find(s => s.field === field);
        return sortInfo ? sortInfo.direction : null;
    };

    const handleSort = (field: string) => {
        if (!onSort) return;

        const currentDirection = getSortDirection(field);
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        onSort(field, newDirection);
    };

    const renderSortIcon = (field: string) => {
        const direction = getSortDirection(field);

        if (direction === 'asc') {
            return <ArrowUp className="w-4 h-4 ml-1" />;
        } else if (direction === 'desc') {
            return <ArrowDown className="w-4 h-4 ml-1" />;
        }

        return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    };

    const renderCell = (item: T, column: Column<T>) => {
        if (column.render) {
            return column.render(item);
        }
        return item[column.key] || '-';
    };

    const getAlignClass = (align?: string) => {
        switch (align) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    const renderColumnToggle = () => {
        if (!showColumnToggle) return null;

        const hideableColumns = columns.filter(col => col.hideable !== false);

        if (hideableColumns.length === 0) return null;

        return (
            <div className="relative">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="flex items-center"
                >
                    <Settings className="w-4 h-4 mr-1" />
                    Colunas
                </Button>

                {showColumnMenu && (
                    <>
                        {/* Overlay para fechar o menu ao clicar fora */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowColumnMenu(false)}
                        />

                        {/* Menu de colunas */}
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
                            <div className="text-sm font-medium text-gray-900 mb-3">
                                Mostrar/Ocultar Colunas
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {hideableColumns.map((column) => {
                                    const isVisible = !hiddenColumns.includes(column.key);

                                    return (
                                        <label
                                            key={column.key}
                                            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isVisible}
                                                onChange={() => toggleColumn(column.key)}
                                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />

                                            <div className="flex items-center flex-1">
                                                {isVisible ? (
                                                    <Eye className="w-4 h-4 mr-2 text-green-600" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4 mr-2 text-gray-400" />
                                                )}
                                                <span className={`text-sm ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
                          {column.title}
                        </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {hideableColumns.length > 0 && (
                                <div className="border-t pt-3 mt-3 flex justify-between">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const allColumnKeys = hideableColumns.map(col => col.key);
                                            setHiddenColumns([]);
                                            onColumnVisibilityChange?.([]);
                                        }}
                                    >
                                        Mostrar Todas
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const allColumnKeys = hideableColumns.map(col => col.key);
                                            setHiddenColumns(allColumnKeys);
                                            onColumnVisibilityChange?.(allColumnKeys);
                                        }}
                                    >
                                        Ocultar Todas
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const pageSizeOptions = [5, 10, 25, 50, 100];

    const renderPaginationInfo = () => {
        if (!pagination) return null;

        const start = pagination.currentPage * pagination.pageSize + 1;
        const end = Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements);

        return (
            <div className="text-sm text-gray-700">
                Mostrando {start} a {end} de {pagination.totalElements} resultados
            </div>
        );
    };

    const renderPaginationButtons = () => {
        if (!pagination || !onPageChange) return null;

        const { currentPage, totalPages } = pagination;

        return (
            <div className="flex items-center space-x-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPageChange(0)}
                    disabled={currentPage === 0}
                >
                    <ChevronsLeft className="w-4 h-4" />
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="px-3 py-1 text-sm">
          Página {currentPage + 1} de {totalPages}
        </span>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                >
                    <ChevronsRight className="w-4 h-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header com controle de colunas */}
            {showColumnToggle && (
                <div className="border-b border-gray-200 px-4 py-3 flex justify-end">
                    {renderColumnToggle()}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        {visibleColumns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignClass(column.align)}`}
                                style={{ width: column.width }}
                            >
                                {column.sortable ? (
                                    <button
                                        onClick={() => handleSort(column.key)}
                                        className="group flex items-center hover:text-gray-700 focus:outline-none"
                                    >
                                        {column.title}
                                        {renderSortIcon(column.key)}
                                    </button>
                                ) : (
                                    column.title
                                )}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                                <LoadingSpinner size="lg" />
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => (
                            <tr
                                key={item.id || index}
                                className="hover:bg-gray-50 transition-colors duration-150"
                            >
                                {visibleColumns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${getAlignClass(column.align)}`}
                                    >
                                        {renderCell(item, column)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Footer with pagination */}
            {pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex items-center space-x-4">
                        {renderPaginationInfo()}

                        {onPageSizeChange && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Itens por página:</span>
                                <select
                                    value={pagination.pageSize}
                                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {pageSizeOptions.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {renderPaginationButtons()}
                </div>
            )}
        </div>
    );
};

export default DataTable;
