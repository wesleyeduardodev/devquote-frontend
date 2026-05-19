import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface DataTableBulkBarProps {
  selectedCount: number
  onClear: () => void
  actions: React.ReactNode
  className?: string
}

export const DataTableBulkBar: React.FC<DataTableBulkBarProps> = ({ selectedCount, onClear, actions, className }) => {
  if (selectedCount === 0) return null
  return (
    <div className={cn('flex items-center gap-3 px-3 py-2 mb-3 rounded-md border border-accent/30 bg-accent-soft', className)}>
      <button onClick={onClear} className="p-0.5 rounded hover:bg-accent/10" aria-label="Limpar seleção">
        <X className="size-4 text-accent" />
      </button>
      <span className="text-sm font-medium text-accent">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">{actions}</div>
    </div>
  )
}
