import * as React from 'react'
import { Monitor, Settings2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export const FLOW_LABEL: Record<string, string> = {
  DESENVOLVIMENTO: 'Desenvolvimento',
  OPERACIONAL: 'Operacional',
}

interface FlowChipProps {
  value?: string
  className?: string
}

/**
 * Chip colorido + ícone para identificar o fluxo da tarefa.
 * - Desenvolvimento: tom info (azul) + Monitor
 * - Operacional:    tom violeta + Settings
 */
export const FlowChip: React.FC<FlowChipProps> = ({ value, className }) => {
  if (!value) return <span className="text-text-tertiary">—</span>

  if (value === 'DESENVOLVIMENTO') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium',
          'bg-info-soft text-[var(--info-strong)] border border-info-border',
          className
        )}
      >
        <Monitor className="size-3" />
        {FLOW_LABEL[value]}
      </span>
    )
  }

  if (value === 'OPERACIONAL') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium',
          'bg-[rgba(139,92,246,0.10)] text-[rgb(124,58,237)] border border-[rgba(139,92,246,0.30)]',
          'dark:text-[rgb(196,181,253)]',
          className
        )}
      >
        <Settings2 className="size-3" />
        {FLOW_LABEL[value]}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-xs font-medium bg-surface-2 text-text-secondary border border-border-subtle', className)}>
      {value}
    </span>
  )
}
