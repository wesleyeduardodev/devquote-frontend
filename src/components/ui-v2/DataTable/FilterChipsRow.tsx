import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '../Button'
import type { FilterChip } from './DataTableToolbar'

export interface FilterChipsRowProps {
  chips: FilterChip[]
  onClearAll?: () => void
  className?: string
}

/**
 * Linha de chips ativos de filtro. Use abaixo do PageHeader quando os filtros
 * já estiverem dentro do PageHeader (slot `filters`).
 */
export const FilterChipsRow: React.FC<FilterChipsRowProps> = ({ chips, onClearAll, className }) => {
  if (!chips || chips.length === 0) return null
  return (
    <div className={`mb-3 flex flex-wrap items-center gap-1.5 ${className || ''}`}>
      {chips.map((c) => (
        <span
          key={`${c.key}-${c.value}`}
          className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-surface-2 border border-border-subtle text-xs text-text-secondary"
        >
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
  )
}
