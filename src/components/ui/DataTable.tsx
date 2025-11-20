import React, {useState, useEffect, useMemo} from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    Settings,
    X,
    Filter
} from 'lucide-react';
import { getDisplayPageNumber, formatPaginationText } from '@/utils/paginationUtils';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

export interface Column<T> {
    key: string;
    title: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'number' | 'date';
    render?: (item: T) => React.ReactNode;
    headerRender?: () => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
    hideable?: boolean;
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

export interface FilterValues {
    [key: string]: string | undefined;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    pagination?: PaginationInfo | null;
    sorting?: SortInfo[];
    filters?: FilterValues;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
    onFilter?: (field: string, value: string) => void;
    onClearFilters?: () => void;
    emptyMessage?: string;
    className?: string;
    showColumnToggle?: boolean;
    hiddenColumns?: string[];
    onColumnVisibilityChange?: (hiddenColumns: string[]) => void;
}

const DataTable = <T extends Record<string, any>>({
                                                      data,
                                                      columns,
                                                      loading = false,
                                                      pagination,
                                                      sorting = [],
                                                      filters = {},
                                                      onPageChange,
                                                      onPageSizeChange,
                                                      onSort,
                                                      onFilter,
                                                      onClearFilters,
                                                      emptyMessage = "Nenhum item encontrado",
                                                      className = "",
                                                      showColumnToggle = true,
                                                      hiddenColumns: initialHiddenColumns = [],
                                                      onColumnVisibilityChange
                                                  }: DataTableProps<T>) => {

    const [hiddenColumns, setHiddenColumns] = useState<string[]>(initialHiddenColumns);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

    const memoizedInitialHiddenColumns = useMemo(() => initialHiddenColumns, [initialHiddenColumns.join(',')]);
    const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

    const visibleColumns = useMemo(() => 
        columns.filter(column => !hiddenColumns.includes(column.key)),
        [columns, hiddenColumns]
    );

    useEffect(() => {
        setHiddenColumns(memoizedInitialHiddenColumns);
    }, [memoizedInitialHiddenColumns]);

    useEffect(() => {
        setLocalFilters(memoizedFilters);
    }, [memoizedFilters]);

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

    const handleFilterChange = (field: string, value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            [field]: value
        }));

        if (onFilter) {
            onFilter(field, value);
        }
    };

    const handleClearFilter = (field: string) => {
        handleFilterChange(field, '');
    };

    const handleClearAllFilters = () => {
        setLocalFilters({});
        if (onClearFilters) {
            onClearFilters();
        }
    };

    const hasActiveFilters = Object.values(localFilters).some(value => value && value.trim() !== '');

    const renderSortIcon = (field: string) => {
        const direction = getSortDirection(field);

        if (direction === 'asc') {
            return <ArrowUp className="w-4 h-4 ml-1"/>;
        } else if (direction === 'desc') {
            return <ArrowDown className="w-4 h-4 ml-1"/>;
        }

        return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50"/>;
    };

    const renderCell = (item: T, column: Column<T>) => {
        if (column.render) {
            return column.render(item);
        }
        return item[column.key] || '-';
    };

    const getAlignClass = (align?: string) => {
        switch (align) {
            case 'center':
                return 'text-center';
            case 'right':
                return 'text-right';
            default:
                return 'text-left';
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
                    <Settings className="w-4 h-4 mr-1"/>
                    Colunas
                </Button>

                {showColumnMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowColumnMenu(false)}
                        />

                        <div
                            className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
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
                                                    <Eye className="w-4 h-4 mr-2 text-green-600"/>
                                                ) : (
                                                    <EyeOff className="w-4 h-4 mr-2 text-gray-400"/>
                                                )}
                                                <span
                                                    className={`text-sm ${isVisible ? 'text-gray-900' : 'text-gray-500'}`}>
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

    const renderFilterInput = (column: Column<T>) => {
        if (!column.filterable) return null;

        const filterValue = localFilters[column.key] || '';
        const inputType = column.filterType === 'number' ? 'number' :
            column.filterType === 'date' ? 'date' : 'text';

        return (
            <div className="mt-1 relative">
                <input
                    type={inputType}
                    value={filterValue}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    placeholder={`Filtrar...`}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {filterValue && (
                    <button
                        onClick={() => handleClearFilter(column.key)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-3 h-3"/>
                    </button>
                )}
            </div>
        );
    };

    const pageSizeOptions = [5, 10, 25, 50, 100, 250, 500];

    const renderPaginationInfo = () => {
        if (!pagination || 
            pagination.currentPage === undefined || 
            pagination.pageSize === undefined || 
            pagination.totalElements === undefined) {
            return null;
        }

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

        const {currentPage, totalPages} = pagination;

        return (
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {/* Mobile: Mostrar apenas botões essenciais */}
                <div className="flex items-center space-x-1 sm:hidden">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-2"
                    >
                        <ChevronLeft className="w-4 h-4"/>
                    </Button>

                    <div className="flex items-center px-3 py-1 text-sm bg-gray-50 rounded border">
                        <span className="font-medium">{getDisplayPageNumber(currentPage, totalPages)}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span>{totalPages}</span>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-2"
                    >
                        <ChevronRight className="w-4 h-4"/>
                    </Button>
                </div>

                {/* Desktop: Mostrar todos os botões */}
                <div className="hidden sm:flex sm:items-center sm:space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPageChange(0)}
                        disabled={currentPage === 0}
                    >
                        <ChevronsLeft className="w-4 h-4"/>
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                    >
                        <ChevronLeft className="w-4 h-4"/>
                    </Button>

                    <span className="px-3 py-1 text-sm">
                        {formatPaginationText(currentPage, totalPages)}
                    </span>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                    >
                        <ChevronRight className="w-4 h-4"/>
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPageChange(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                    >
                        <ChevronsRight className="w-4 h-4"/>
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header com controle de colunas e filtros - Mobile responsive */}
            {(showColumnToggle || hasActiveFilters) && (
                <div className="border-b border-gray-200 px-4 py-3">
                    {/* Mobile Layout */}
                    <div className="flex flex-col space-y-2 sm:hidden">
                        {hasActiveFilters && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-blue-600"/>
                                    <span className="text-sm text-gray-600">Filtros ativos</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleClearAllFilters}
                                    className="text-xs"
                                >
                                    Limpar
                                </Button>
                            </div>
                        )}
                        {showColumnToggle && (
                            <div className="flex justify-center">
                                {renderColumnToggle()}
                            </div>
                        )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <>
                                    <Filter className="w-4 h-4 text-blue-600"/>
                                    <span className="text-sm text-gray-600">Filtros ativos</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleClearAllFilters}
                                        className="text-xs"
                                    >
                                        Limpar filtros
                                    </Button>
                                </>
                            )}
                        </div>
                        {renderColumnToggle()}
                    </div>
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
                                className={`px-2 py-3 sm:px-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignClass(column.align)}`}
                                style={column.width ? {width: column.width, minWidth: column.width, maxWidth: column.width} : {}}
                            >
                                <div className={`flex flex-col ${column.align === 'center' ? 'items-center' : column.align === 'right' ? 'items-end' : 'items-start'}`}>
                                    {column.headerRender ? (
                                        column.headerRender()
                                    ) : column.sortable ? (
                                        <button
                                            onClick={() => handleSort(column.key)}
                                            className={`group flex items-center hover:text-gray-700 focus:outline-none ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {column.title}
                                            {renderSortIcon(column.key)}
                                        </button>
                                    ) : (
                                        <div className={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}>{column.title}</div>
                                    )}
                                    {renderFilterInput(column)}
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                                <LoadingSpinner size="lg"/>
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
                                        className={`px-2 py-3 sm:px-3 whitespace-nowrap text-sm text-gray-900 ${getAlignClass(column.align)}`}
                                        style={column.width ? {width: column.width, minWidth: column.width, maxWidth: column.width} : {}}
                                    >
                                        <div className="max-w-xs sm:max-w-none truncate">
                                            {renderCell(item, column)}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Footer with pagination - Mobile responsive */}
            {pagination && (
                <div className="bg-white px-4 py-3 border-t border-gray-200">
                    {/* Mobile Layout */}
                    <div className="flex flex-col space-y-3 sm:hidden">
                        {renderPaginationInfo()}
                        
                        {onPageSizeChange && (
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-sm text-gray-700">Por página:</span>
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
                        
                        <div className="flex justify-center">
                            {renderPaginationButtons()}
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between">
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
                </div>
            )}
        </div>
    );
};

export default DataTable;
