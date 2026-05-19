import * as React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '../Input'
import { Button } from '../Button'
import { cn } from '@/utils/cn'

export interface FilterChip {
  key: string
  label: string
  value: string
  onRemove: () => void
}

export interface DataTableToolbarProps {
  search?: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }
  chips?: FilterChip[]
  onClearAll?: () => void
  filtersTrigger?: React.ReactNode
  rightActions?: React.ReactNode
  className?: string
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({ search, chips = [], onClearAll, filtersTrigger, rightActions, className }) => (
  <div className={cn('flex flex-col gap-2 mb-3', className)}>
    <div className="flex flex-wrap items-center gap-2">
      {search && (
        <div className="w-full sm:w-[280px]">
          <Input
            leadingIcon={<Search />}
            placeholder={search.placeholder || 'Buscar...'}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
          />
        </div>
      )}
      {filtersTrigger}
      <div className="flex-1" />
      {rightActions}
    </div>

    {chips.length > 0 && (
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <span key={`${c.key}-${c.value}`} className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-surface-2 border border-border-subtle text-xs text-text-secondary">
            <span className="text-text-tertiary">{c.label}:</span>
            <span className="text-text-primary font-medium">{c.value}</span>
            <button
              onClick={c.onRemove}
              className="ml-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={`Remover filtro ${c.label}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {onClearAll && chips.length >= 2 && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>Limpar todos</Button>
        )}
      </div>
    )}
  </div>
)
