import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { DataTableProps } from './DataTable'

export type MobilePaginationProps = NonNullable<DataTableProps<any>['pagination']> & { className?: string }

/**
 * Paginação das listas em cards (mobile). Mesmo contrato do `pagination` do DataTable,
 * para reaproveitar o objeto já montado para a versão desktop.
 */
export const MobilePagination: React.FC<MobilePaginationProps> = ({ page, pageSize, total, onPageChange, className }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize && page === 0) return null
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min(total, (page + 1) * pageSize)

  return (
    <div className={cn('flex items-center justify-between gap-3 pt-2', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="h-10 px-3 inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-1 text-sm text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />Anterior
      </button>
      <span className="text-xs text-text-secondary tabular-nums text-center">
        <span className="font-medium text-text-primary">{start}–{end}</span> de {total}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="h-10 px-3 inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-1 text-sm text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Próxima página"
      >
        Próxima<ChevronRight className="size-4" />
      </button>
    </div>
  )
}
