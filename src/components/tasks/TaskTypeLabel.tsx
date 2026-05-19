import * as React from 'react'
import {
  Bug, Flag, Sparkles, Save, Rocket, FileText, Server,
  Activity, Headphones, ScanSearch, Database, HelpCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface TypeMeta {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  /** classes do ícone (cor) */
  iconClass: string
}

const TASK_TYPE_META: Record<string, TypeMeta> = {
  BUG:                   { label: 'Bug',                  Icon: Bug,         iconClass: 'text-[var(--success-strong)]' },
  ENHANCEMENT:           { label: 'Melhoria',             Icon: Flag,        iconClass: 'text-[var(--danger-strong)]' },
  NEW_FEATURE:           { label: 'Nova funcionalidade',  Icon: Sparkles,    iconClass: 'text-[var(--warning-strong)]' },
  BACKUP:                { label: 'Backup',               Icon: Save,        iconClass: 'text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]' },
  DEPLOY:                { label: 'Deploy',               Icon: Rocket,      iconClass: 'text-[var(--info-strong)]' },
  LOGS:                  { label: 'Logs',                 Icon: FileText,    iconClass: 'text-text-tertiary' },
  NOVO_SERVIDOR:         { label: 'Novo servidor',        Icon: Server,      iconClass: 'text-[var(--info-strong)]' },
  MONITORING:            { label: 'Monitoramento',        Icon: Activity,    iconClass: 'text-[rgb(8,145,178)] dark:text-[rgb(103,232,249)]' },
  SUPPORT:               { label: 'Suporte',              Icon: Headphones,  iconClass: 'text-text-tertiary' },
  CODE_REVIEW:           { label: 'Code Review',          Icon: ScanSearch,  iconClass: 'text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]' },
  APLICACAO_BANCO:       { label: 'Aplicação BD',         Icon: Database,    iconClass: 'text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]' },
  DATABASE_APPLICATION:  { label: 'Aplicação BD',         Icon: Database,    iconClass: 'text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]' },
}

interface TaskTypeLabelProps {
  value?: string
  className?: string
}

export const TaskTypeLabel: React.FC<TaskTypeLabelProps> = ({ value, className }) => {
  if (!value) return <span className="text-text-tertiary">—</span>
  const meta = TASK_TYPE_META[value]
  const Icon = meta?.Icon || HelpCircle
  const label = meta?.label || value
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm text-text-secondary', className)}>
      <Icon className={cn('size-3.5 shrink-0', meta?.iconClass || 'text-text-tertiary')} />
      <span className="truncate">{label}</span>
    </span>
  )
}
