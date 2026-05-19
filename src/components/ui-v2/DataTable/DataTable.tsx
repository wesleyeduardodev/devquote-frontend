import * as React from 'react'
import {
  flexRender, getCoreRowModel, useReactTable,
  type ColumnDef, type SortingState, type RowSelectionState
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Checkbox } from '../Checkbox'
import { Skeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'
import { ColumnFilterInput } from './ColumnFilterInput'

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  rowKey?: (row: T) => string | number
  loading?: boolean
  error?: string | null

  /**
   * Map de filtros por column.id (ou accessorKey).
   * Quando fornecido, renderiza uma linha de filtros logo abaixo do header.
   * Manter fora da memo dos columns evita stale closures.
   */
  columnFilters?: Record<string, import('./ColumnFilterInput').ColumnFilterConfig>

  /** Modo de seleção */
  selectable?: boolean
  selection?: RowSelectionState
  onSelectionChange?: (sel: RowSelectionState) => void

  /** Sort */
  sorting?: SortingState
  onSortingChange?: (s: SortingState) => void

  /** Pagination (controlado) */
  pagination?: {
    page: number          // base 0
    pageSize: number
    total: number
    onPageChange: (p: number) => void
    onPageSizeChange?: (s: number) => void
    pageSizeOptions?: number[]
  }

  /** Click na linha */
  onRowClick?: (row: T) => void

  /** Customizações de UI */
  empty?: React.ReactNode
  className?: string
  density?: 'compact' | 'comfortable'
  stickyHeader?: boolean
}

export function DataTable<T>({
  data, columns, rowKey, loading, error,
  columnFilters,
  selectable, selection, onSelectionChange,
  sorting, onSortingChange,
  pagination, onRowClick,
  empty, className, density = 'compact', stickyHeader = true,
}: DataTableProps<T>) {

  const finalColumns = React.useMemo<ColumnDef<T, any>[]>(() => {
    if (!selectable) return columns
    const selCol: ColumnDef<T, any> = {
      id: '__select',
      size: 32,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Selecionar linha"
        />
      ),
    }
    return [selCol, ...columns]
  }, [columns, selectable])

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    enableSortingRemoval: false,
    enableMultiSort: false,
    state: {
      sorting: sorting ?? [],
      rowSelection: selection ?? {},
    },
    onSortingChange: (updater) => {
      if (!onSortingChange) return
      const next = typeof updater === 'function' ? updater(sorting ?? []) : updater
      onSortingChange(next)
    },
    onRowSelectionChange: (updater) => {
      if (!onSelectionChange) return
      const next = typeof updater === 'function' ? updater(selection ?? {}) : updater
      onSelectionChange(next)
    },
    enableRowSelection: !!selectable,
    manualPagination: !!pagination,
    manualSorting: !!onSortingChange,
    getRowId: rowKey ? (row, i) => String(rowKey(row)) : (_row, i) => String(i),
  })

  const rowH = density === 'compact' ? 'h-10' : 'h-14'

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar"
        description={error}
      />
    )
  }

  return (
    <div className={cn('rounded-lg border border-border-subtle bg-surface-1 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead className={cn('bg-surface-app/60 border-b border-border-strong', stickyHeader && 'sticky top-0 z-10')}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border-subtle">
                {hg.headers.map((h) => {
                  const sortDir = h.column.getIsSorted()
                  const canSort = h.column.getCanSort()
                  const align = (h.column.columnDef.meta as any)?.align as ('center' | 'right' | undefined)
                  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                  const innerJustify = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''
                  return (
                    <th
                      key={h.id}
                      style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}
                      className={cn('px-3 py-2.5 text-xs font-semibold text-text-secondary whitespace-nowrap', alignClass)}
                    >
                      {h.isPlaceholder ? null : canSort ? (
                        <button
                          onClick={h.column.getToggleSortingHandler()}
                          className={cn('inline-flex items-center gap-1 hover:text-text-primary transition-colors', innerJustify, align === 'center' && 'w-full')}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sortDir === 'asc' ? <ArrowUp className="size-3" /> :
                           sortDir === 'desc' ? <ArrowDown className="size-3" /> :
                           <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      ) : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}

            {/* Linha de filtros por coluna. O filtro vem do prop `columnFilters` (não do
                meta dos columns) pra evitar stale closures quando o user memoiza columns. */}
            {columnFilters && Object.keys(columnFilters).length > 0 && (
              <tr className="border-b border-border-subtle bg-surface-1">
                {table.getHeaderGroups()[0].headers.map((h) => {
                  const meta = h.column.columnDef.meta as any
                  const align = meta?.align as ('center' | 'right' | undefined)
                  const columnId = (h.column.columnDef as any).accessorKey ?? h.column.id
                  const filter = columnFilters[columnId] ?? columnFilters[h.column.id]
                  return (
                    <th
                      key={`f-${h.id}`}
                      className="px-2 py-1.5"
                      style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}
                    >
                      {filter ? (
                        <ColumnFilterInput {...filter} align={align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'} />
                      ) : null}
                    </th>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`sk-${i}`} className={cn('border-b border-border-subtle', rowH)}>
                  {finalColumns.map((c, j) => (
                    <td key={`sk-${i}-${j}`} className="px-3 py-2">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={finalColumns.length} className="p-0">
                  {empty || (
                    <EmptyState
                      title="Nenhum resultado"
                      description="Tente ajustar os filtros ou criar um novo registro."
                    />
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'border-b border-border-subtle transition-colors',
                    idx % 2 === 1 && 'bg-[var(--zebra-row)]',
                    'hover:bg-surface-2',
                    rowH,
                    onRowClick && 'cursor-pointer',
                    row.getIsSelected() && 'bg-accent-soft/40'
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as any
                    const noWrap = meta?.wrap !== true
                    const align = meta?.align as ('center' | 'right' | undefined)
                    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-3 py-2 text-text-primary align-middle',
                          noWrap ? 'whitespace-nowrap overflow-hidden text-ellipsis' : '',
                          alignClass
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <PaginationBar pagination={pagination} />
      )}
    </div>
  )
}

const PaginationBar: React.FC<{ pagination: NonNullable<DataTableProps<any>['pagination']> }> = ({ pagination }) => {
  const { page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100] } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min(total, (page + 1) * pageSize)

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-border-subtle text-sm text-text-secondary">
      <div className="hidden sm:block text-xs">
        Mostrando <span className="font-medium text-text-primary tabular-nums">{start}</span>–<span className="font-medium text-text-primary tabular-nums">{end}</span> de <span className="font-medium text-text-primary tabular-nums">{total}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Primeira"
        ><ChevronsLeft className="size-3.5" /></button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Anterior"
        ><ChevronLeft className="size-3.5" /></button>
        <span className="text-xs px-2 tabular-nums">{page + 1} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Próxima"
        ><ChevronRight className="size-3.5" /></button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Última"
        ><ChevronsRight className="size-3.5" /></button>
      </div>

      {onPageSizeChange && (
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span>Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 bg-surface-1 border border-border-strong rounded-md px-1.5 text-xs"
          >
            {pageSizeOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      )}
    </div>
  )
}
