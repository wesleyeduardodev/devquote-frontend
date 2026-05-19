import * as React from 'react'
import { cn } from '@/utils/cn'

type Segment = {
  key: string
  label: string
  count: number
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'tertiary'
}

const TONE_BG: Record<string, string> = {
  neutral:  'bg-neutral-soft text-text-secondary border-r border-border-subtle',
  info:     'bg-info-soft    text-info-strong border-r border-info-border',
  warning:  'bg-warning-soft text-warning-strong border-r border-warning-border',
  success:  'bg-success-soft text-success-strong border-r border-success-border',
  danger:   'bg-danger-soft  text-danger-strong  border-r border-danger-border',
  tertiary: 'bg-surface-2    text-text-tertiary  border-r border-border-subtle',
}

interface Props {
  segments: Segment[]
  total: number
  onSegmentClick?: (segment: Segment) => void
  activeKey?: string | null
  className?: string
}

export const DeliveryPipelineOverview: React.FC<Props> = ({ segments, total, onSegmentClick, activeKey, className }) => {
  return (
    <div className={cn('rounded-lg border border-border-subtle overflow-hidden bg-surface-1', className)}>
      <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Pipeline</span>
        <span className="text-xs text-text-secondary">Total: <strong className="text-text-primary tabular-nums">{total}</strong></span>
      </div>
      <div className="flex w-full h-16 overflow-hidden">
        {segments.map((s) => {
          const flex = total > 0 ? Math.max(s.count / total, 0.05) : 1 / segments.length
          const active = activeKey === s.key
          const isClickable = !!onSegmentClick
          return (
            <button
              key={s.key}
              onClick={() => onSegmentClick?.(s)}
              style={{ flex: `${flex} 1 0%` }}
              className={cn(
                'flex flex-col items-start justify-center px-3 transition-colors text-left min-w-[60px]',
                TONE_BG[s.tone],
                isClickable && 'hover:brightness-95',
                active && 'ring-2 ring-inset ring-accent'
              )}
              title={`${s.label}: ${s.count}`}
            >
              <span className="text-xl font-semibold tabular-nums leading-none">{s.count}</span>
              <span className="text-[10px] uppercase tracking-wide mt-1 truncate w-full">{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
