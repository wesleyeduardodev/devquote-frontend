import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ColumnFilterConfig {
  type?: 'text' | 'number' | 'date'
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  debounceMs?: number
  /** Renderiza um elemento React customizado em vez do input padrão (ex: Select). */
  render?: () => React.ReactNode
}

interface ColumnFilterInputProps extends ColumnFilterConfig {
  align?: 'left' | 'center' | 'right'
  /** Indica que o filtro está sendo aplicado (refetch em andamento). */
  loading?: boolean
}

/**
 * Input de filtro por coluna.
 * Estado controlado direto pelo parent — o hook (useTasks) já faz debounce
 * antes de chamar o backend, então não duplicamos debounce aqui.
 */
export const ColumnFilterInput: React.FC<ColumnFilterInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  render,
  align,
  loading,
}) => {
  if (render) return <>{render()}</>

  const hasValue = !!value
  return (
    <div className="relative">
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Filtrar...'}
        inputMode={type === 'number' ? 'numeric' : undefined}
        className={cn(
          'w-full h-7 px-2 rounded-md border border-border-subtle bg-surface-1 text-xs text-text-primary',
          'placeholder:text-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
          loading && hasValue && 'pr-6',
          align === 'center' && 'text-center',
          align === 'right' && 'text-right'
        )}
      />
      {loading && hasValue && (
        <Loader2
          className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-accent animate-spin pointer-events-none"
          aria-label="Aplicando filtro"
        />
      )}
    </div>
  )
}
