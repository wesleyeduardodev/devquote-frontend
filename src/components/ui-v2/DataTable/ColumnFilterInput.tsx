import * as React from 'react'
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
}

/**
 * Input de filtro por coluna com debounce.
 * Mantém valor local pra digitação fluida; envia onChange só após `debounceMs`.
 */
export const ColumnFilterInput: React.FC<ColumnFilterInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  render,
  align,
}) => {
  if (render) return <>{render()}</>

  // Sem debounce local — o hook (useTasks) já debounce 1s antes de chamar o backend.
  // Aqui só propagamos imediatamente pra manter input controlado.
  return (
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
        align === 'center' && 'text-center',
        align === 'right' && 'text-right'
      )}
    />
  )
}
