import * as React from 'react'
import { Code2, FlaskConical, Rocket, HelpCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface EnvMeta {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  iconClass: string
}

export const ENV_META: Record<string, EnvMeta> = {
  DESENVOLVIMENTO: { label: 'Desenvolvimento', Icon: Code2,        iconClass: 'text-[var(--info-strong)]' },
  HOMOLOGACAO:     { label: 'Homologação',     Icon: FlaskConical, iconClass: 'text-[var(--warning-strong)]' },
  PRODUCAO:        { label: 'Produção',        Icon: Rocket,       iconClass: 'text-[var(--success-strong)]' },
}

interface Props { value?: string; className?: string }

export const EnvLabel: React.FC<Props> = ({ value, className }) => {
  if (!value) return <span className="text-text-tertiary">—</span>
  const meta = ENV_META[value]
  const Icon = meta?.Icon || HelpCircle
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm text-text-secondary', className)}>
      <Icon className={cn('size-3.5 shrink-0', meta?.iconClass || 'text-text-tertiary')} />
      <span className="truncate">{meta?.label || value}</span>
    </span>
  )
}
