import * as React from 'react'
import { RefreshCw, ChevronDown, ChevronRight, Flag, ExternalLink, ClipboardList, Plug } from 'lucide-react'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Button } from '@/components/ui-v2/Button'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { PriorityStatusBadge } from '@/components/priorities/PriorityStatusBadge'
import { usePriorityBoard } from '@/hooks/usePriorityBoard'
import { PriorityGroup, PriorityTask } from '@/types/priority.types'
import { cn } from '@/utils/cn'

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: '#e5484d' },
  high: { label: 'Alta', color: '#e16b16' },
  normal: { label: 'Normal', color: '#3b6fe1' },
  low: { label: 'Baixa', color: '#6b7280' },
}

function PriorityFlag({ priority }: { priority?: string | null }) {
  if (!priority) return null
  const m = PRIORITY_META[priority.toLowerCase()] || { label: priority, color: '#6b7280' }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: m.color }} title={`Prioridade: ${m.label}`}>
      <Flag className="size-3.5" />
      {m.label}
    </span>
  )
}

function fmtUpdated(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `Atualizado às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const TaskRow: React.FC<{ task: PriorityTask }> = ({ task }) => (
  <li className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
    <span className="shrink-0 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-2 px-1.5 text-xs font-semibold tabular-nums text-text-secondary">
      {task.ordem != null ? task.ordem : '–'}
    </span>
    <a
      href={task.url}
      target="_blank"
      rel="noreferrer"
      className="flex-1 min-w-0 group inline-flex items-center gap-1.5 text-sm text-text-primary hover:text-accent"
      title={task.name}
    >
      <span className="truncate">{task.name}</span>
      <ExternalLink className="size-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
    {task.tags && task.tags.length > 0 && (
      <span className="hidden md:flex items-center gap-1 shrink-0">
        {task.tags.slice(0, 2).map((t) => (
          <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">{t}</span>
        ))}
      </span>
    )}
    <span className="shrink-0 w-16 text-right"><PriorityFlag priority={task.priority} /></span>
  </li>
)

const GroupSection: React.FC<{ group: PriorityGroup; defaultOpen: boolean }> = ({ group, defaultOpen }) => {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className={cn('rounded-xl border bg-surface-1 overflow-hidden', group.primary ? 'border-accent/40 shadow-sm' : 'border-border-subtle')}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        {open ? <ChevronDown className="size-4 text-text-tertiary" /> : <ChevronRight className="size-4 text-text-tertiary" />}
        <PriorityStatusBadge status={group.status} />
        <span className="text-sm font-medium text-text-secondary tabular-nums">{group.count}</span>
        {group.primary && (
          <span className="ml-auto rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">Principal</span>
        )}
      </button>
      {open && (
        group.tasks.length > 0 ? (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {group.tasks.map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-text-tertiary border-t border-border-subtle">Nenhuma tarefa neste status.</p>
        )
      )}
    </div>
  )
}

export default function PrioritiesBoard() {
  const { board, loading, refreshing, refresh } = usePriorityBoard()

  return (
    <div>
      <PageHeader
        title="Prioridades"
        subtitle={board?.fetchedAt ? fmtUpdated(board.fetchedAt) : undefined}
        actions={
          <Button
            variant="secondary"
            leadingIcon={<RefreshCw className={refreshing ? 'animate-spin' : ''} />}
            onClick={refresh}
            loading={refreshing}
          >
            Atualizar
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : !board || !board.configured ? (
        <EmptyState
          icon={<Plug />}
          title="Integração não configurada"
          description="Configure as chaves do board (ClickUp) na tela de Parâmetros para ver suas prioridades aqui."
        />
      ) : board.groups.every((g) => g.count === 0) ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Nenhuma tarefa encontrada"
          description="Não há tarefas atribuídas a você nos status configurados."
        />
      ) : (
        <div className="space-y-3">
          {board.groups.map((g) => (
            <GroupSection key={g.status} group={g} defaultOpen={g.primary} />
          ))}
        </div>
      )}
    </div>
  )
}
