import * as React from 'react'
import toast from 'react-hot-toast'
import { RefreshCw, ChevronDown, ChevronRight, Flag, ExternalLink, ClipboardList, Plug, FilePlus2, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Button } from '@/components/ui-v2/Button'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui-v2/Dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-v2/Select'
import { PriorityStatusBadge } from '@/components/priorities/PriorityStatusBadge'
import { usePriorityBoard } from '@/hooks/usePriorityBoard'
import { useAuth } from '@/hooks/useAuth'
import { taskService } from '@/services/taskService'
import { requesterService } from '@/services/requesterService'
import { PriorityGroup, PriorityTask } from '@/types/priority.types'
import { cn } from '@/utils/cn'

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: '#e5484d' },
  high: { label: 'Alta', color: '#e16b16' },
  normal: { label: 'Normal', color: '#3b6fe1' },
  low: { label: 'Baixa', color: '#6b7280' },
}

/** ClickUp priority -> TaskPriority do DevQuote (default MEDIUM). */
function mapPriority(p?: string | null): string {
  switch ((p || '').toLowerCase()) {
    case 'urgent': return 'URGENT'
    case 'high': return 'HIGH'
    case 'low': return 'LOW'
    case 'normal': return 'MEDIUM'
    default: return 'MEDIUM'
  }
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

interface RowProps {
  task: PriorityTask
  isAdmin: boolean
  onCreate: (t: PriorityTask) => void
}

const TaskRow: React.FC<RowProps> = ({ task, isAdmin, onCreate }) => (
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
    <span className="shrink-0 w-28 flex justify-end">
      {task.existsInDevQuote ? (
        <span className="inline-flex items-center gap-1 text-xs text-success-strong" title="Tarefa já cadastrada no DevQuote">
          <CheckCircle2 className="size-3.5" /> Já cadastrada
        </span>
      ) : isAdmin ? (
        <Button size="sm" variant="secondary" leadingIcon={<FilePlus2 />} onClick={() => onCreate(task)}>
          Criar tarefa
        </Button>
      ) : null}
    </span>
  </li>
)

const GroupSection: React.FC<{ group: PriorityGroup; defaultOpen: boolean; isAdmin: boolean; onCreate: (t: PriorityTask) => void }> = ({ group, defaultOpen, isAdmin, onCreate }) => {
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
            {group.tasks.map((t) => <TaskRow key={t.id} task={t} isAdmin={isAdmin} onCreate={onCreate} />)}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-text-tertiary border-t border-border-subtle">Nenhuma tarefa neste status.</p>
        )
      )}
    </div>
  )
}

export default function PrioritiesBoard() {
  const { board, loading, refreshing, refresh, markTaskCreated } = usePriorityBoard()
  const { hasProfile } = useAuth() as any
  const isAdmin = hasProfile ? hasProfile('ADMIN') : false

  const [requesters, setRequesters] = React.useState<{ id: number; name: string }[]>([])
  const [createFor, setCreateFor] = React.useState<PriorityTask | null>(null)
  const [flowType, setFlowType] = React.useState<string>('')
  const [requesterId, setRequesterId] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!isAdmin) return
    requesterService
      .getAllPaginated({ page: 0, size: 500, sort: [{ field: 'name', direction: 'asc' }] })
      .then((res: any) => setRequesters((res?.content ?? res ?? []).map((r: any) => ({ id: r.id, name: r.name }))))
      .catch(() => {})
  }, [isAdmin])

  const openCreate = (t: PriorityTask) => {
    setCreateFor(t)
    setFlowType('')
    setRequesterId('')
  }

  const confirmCreate = async () => {
    if (!createFor || !flowType || !requesterId) return
    setSubmitting(true)
    try {
      await taskService.createWithSubTasks({
        requesterId: Number(requesterId),
        code: createFor.id,
        title: createFor.name,
        description: createFor.description || '',
        flowType,
        priority: mapPriority(createFor.priority),
        hasSubTasks: false,
        subTasks: [],
      })
      toast.success('Tarefa criada com entrega')
      markTaskCreated(createFor.id)
      setCreateFor(null)
    } catch (e: any) {
      if (e?.apiError?.errorCode === 'DUPLICATE_TASK_CODE') {
        toast.error('Já existe uma tarefa com esse código')
        markTaskCreated(createFor.id)
        setCreateFor(null)
      } else {
        toast.error(e?.userMessage || 'Erro ao criar tarefa')
      }
    } finally {
      setSubmitting(false)
    }
  }

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
            <GroupSection key={g.status} group={g} defaultOpen={g.primary} isAdmin={isAdmin} onCreate={openCreate} />
          ))}
        </div>
      )}

      {/* Modal: criar tarefa no DevQuote a partir do ClickUp */}
      <Dialog open={!!createFor} onOpenChange={(o) => { if (!o) setCreateFor(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar tarefa no DevQuote</DialogTitle>
            <DialogDescription>
              Será criada a tarefa (e a entrega) a partir desta tarefa do ClickUp. Informe o fluxo e o solicitante.
            </DialogDescription>
          </DialogHeader>

          {createFor && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border-subtle bg-surface-2 p-3">
                <p className="text-xs text-text-tertiary">Código: <span className="font-mono text-text-secondary">{createFor.id}</span></p>
                <p className="mt-1 text-sm text-text-primary">{createFor.name}</p>
                <p className="mt-1 text-xs text-text-tertiary">Prioridade: {PRIORITY_META[(createFor.priority || '').toLowerCase()]?.label || 'Médio (padrão)'}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Fluxo *</label>
                <Select value={flowType} onValueChange={setFlowType}>
                  <SelectTrigger><SelectValue placeholder="Selecione o fluxo…">{flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : flowType === 'OPERACIONAL' ? 'Operacional' : ''}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESENVOLVIMENTO">Desenvolvimento</SelectItem>
                    <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Solicitante *</label>
                <Select value={requesterId} onValueChange={setRequesterId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o solicitante…">{requesters.find((r) => String(r.id) === requesterId)?.name || ''}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {requesters.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateFor(null)} disabled={submitting}>Cancelar</Button>
            <Button onClick={confirmCreate} loading={submitting} disabled={!flowType || !requesterId || submitting}>
              Criar tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
