import * as React from 'react'
import { StatusDot } from '@/components/ui-v2/StatusDot'
import { cn } from '@/utils/cn'

type Status = 'PENDING' | 'DEVELOPMENT' | 'DELIVERED' | 'HOMOLOGATION' | 'APPROVED' | 'REJECTED' | 'PRODUCTION' | 'CANCELLED' | string

export const STATUS_LABEL: Record<string, string> = {
  PENDING:      'Pendente',
  DEVELOPMENT:  'Desenvolvimento',
  DELIVERED:    'Entregue',
  HOMOLOGATION: 'Homologação',
  APPROVED:     'Aprovado',
  REJECTED:     'Rejeitado',
  PRODUCTION:   'Produção',
  CANCELLED:    'Cancelado',
}

export const STATUS_TONE: Record<string, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING:      'neutral',
  DEVELOPMENT:  'info',
  DELIVERED:    'info',
  HOMOLOGATION: 'warning',
  APPROVED:     'success',
  REJECTED:     'danger',
  PRODUCTION:   'success',
  CANCELLED:    'neutral',
}

interface Props {
  status?: Status
  className?: string
  withTime?: string | Date
}

const RELATIVE_DAYS = (d?: string | Date): { label: string; tone: 'neutral' | 'warning' | 'danger' } | null => {
  if (!d) return null
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return null
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 1) return { label: 'hoje', tone: 'neutral' }
  if (diff < 7) return { label: `${diff}d`, tone: 'neutral' }
  if (diff < 14) return { label: `${diff}d`, tone: 'warning' }
  return { label: `${diff}d`, tone: 'danger' }
}

export const DeliveryStatusBadge: React.FC<Props> = ({ status, className, withTime }) => {
  if (!status) return <span className="text-text-tertiary">—</span>
  const tone = STATUS_TONE[status] || 'neutral'
  const label = STATUS_LABEL[status] || status
  const rel = RELATIVE_DAYS(withTime)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <StatusDot tone={tone} />
      <span className="text-text-primary">{label}</span>
      {rel && (
        <span className={cn('text-xs tabular-nums', rel.tone === 'warning' ? 'text-warning-strong' : rel.tone === 'danger' ? 'text-danger-strong' : 'text-text-tertiary')}>
          · {rel.label}
        </span>
      )}
    </span>
  )
}
