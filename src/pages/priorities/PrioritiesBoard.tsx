import * as React from 'react'
import toast from 'react-hot-toast'
import {
  RefreshCw, ChevronDown, ChevronRight, Flag, ExternalLink, ClipboardList, Plug, FilePlus2,
  CheckCircle2, Star, EyeOff, Eye, GripVertical,
} from 'lucide-react'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Button } from '@/components/ui-v2/Button'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui-v2/Dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-v2/Select'
import { PriorityStatusBadge } from '@/components/priorities/PriorityStatusBadge'
import { TaskQuickViewModal } from '@/components/tasks/TaskQuickViewModal'
import { usePriorityBoard } from '@/hooks/usePriorityBoard'
import { useAuth } from '@/hooks/useAuth'
import { taskService } from '@/services/taskService'
import { requesterService } from '@/services/requesterService'
import { priorityService } from '@/services/priorityService'
import { BoardFilterMode, PriorityGroup, PriorityTask } from '@/types/priority.types'
import { cn } from '@/utils/cn'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const FILTER_MODES: { value: BoardFilterMode; label: string; title: string }[] = [
  { value: 'DEV_NOT_ASSIGNEE', label: 'Dev, não responsável', title: 'Tarefas onde você é o Desenvolvedor e o Responsável é outra pessoa' },
  { value: 'DEV_AND_ASSIGNEE', label: 'Dev + responsável', title: 'Tarefas onde você é Desenvolvedor e Responsável ao mesmo tempo' },
  { value: 'ASSIGNEE_NOT_DEV', label: 'Responsável, não dev', title: 'Tarefas onde você é o Responsável mas quem desenvolve é outra pessoa' },
]

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
  onView: (taskId: number) => void
}

const TaskRow: React.FC<RowProps> = ({ task, isAdmin, onCreate, onView }) => (
  <li className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors">
    <span className="shrink-0 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-2 px-1.5 text-xs font-semibold tabular-nums text-text-secondary">
      {task.ordem != null ? task.ordem : '–'}
    </span>
    <a
      href={task.url}
      target="_blank"
      rel="noreferrer"
      className="flex-1 min-w-0 group inline-flex items-center gap-1.5 text-sm text-text-primary hover:text-accent"
      title={`${task.id} - ${task.name}`}
    >
      <span className="font-mono text-xs font-semibold text-accent bg-accent-soft px-1.5 py-0.5 rounded shrink-0">{task.id}</span>
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
      {task.devQuoteTaskId != null ? (
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Eye />}
          onClick={() => onView(task.devQuoteTaskId as number)}
          title="Ver tarefa no DevQuote"
          className="text-[var(--info-strong)] border-[var(--info-border)] hover:bg-[var(--info-soft)]"
        >
          Ver tarefa
        </Button>
      ) : task.existsInDevQuote ? (
        <span className="inline-flex items-center gap-1 text-xs text-success-strong" title="Tarefa já cadastrada no DevQuote">
          <CheckCircle2 className="size-3.5" /> Já cadastrada
        </span>
      ) : isAdmin ? (
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<FilePlus2 />}
          onClick={() => onCreate(task)}
          className="text-[var(--success-strong)] border-[var(--success-border)] hover:bg-[var(--success-soft)]"
        >
          Criar tarefa
        </Button>
      ) : null}
    </span>
  </li>
)

interface GroupSectionProps {
  group: PriorityGroup
  defaultOpen: boolean
  isAdmin: boolean
  onCreate: (t: PriorityTask) => void
  onView: (taskId: number) => void
  onMarkPrimary?: (status: string) => void
  onToggleHidden?: (status: string, hidden: boolean) => void
}

const GroupSection: React.FC<GroupSectionProps> = ({ group, defaultOpen, isAdmin, onCreate, onView, onMarkPrimary, onToggleHidden }) => {
  const [open, setOpen] = React.useState(defaultOpen)

  // Sortable só pra ADMIN — não-admin não pode reordenar
  const sortable = useSortable({ id: group.status, disabled: !isAdmin })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border bg-surface-1 overflow-hidden',
        group.primary ? 'border-accent/40 shadow-sm' : 'border-border-subtle',
        group.hidden && 'opacity-70',
        isDragging && 'shadow-xl ring-2 ring-accent/30',
      )}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-surface-2 transition-colors">
        {/* Drag handle (só admin) */}
        {isAdmin && (
          <button
            {...attributes}
            {...listeners}
            className="inline-flex h-8 w-6 items-center justify-center text-text-tertiary hover:text-text-primary cursor-grab active:cursor-grabbing touch-none"
            aria-label="Arrastar pra reordenar"
            title="Arrastar pra reordenar"
          >
            <GripVertical className="size-4" />
          </button>
        )}

        {/* Expand/collapse + status badge + count */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-3 py-2 text-left"
        >
          {open ? <ChevronDown className="size-4 text-text-tertiary" /> : <ChevronRight className="size-4 text-text-tertiary" />}
          <PriorityStatusBadge status={group.status} />
          <span className="text-sm font-medium text-text-secondary tabular-nums">{group.count}</span>
          {group.primary && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">Principal</span>
          )}
          {group.hidden && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-tertiary">oculto</span>
          )}
        </button>

        {/* Botões de ação (admin) */}
        {isAdmin && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onMarkPrimary?.(group.status) }}
              disabled={group.primary}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                group.primary
                  ? 'text-accent'
                  : 'text-text-tertiary hover:text-accent hover:bg-surface-2'
              )}
              title={group.primary ? 'Este é o status Principal' : 'Marcar como Principal (badge de destaque)'}
              aria-label="Marcar como Principal"
            >
              <Star className={cn('size-4', group.primary && 'fill-current')} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHidden?.(group.status, !group.hidden) }}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
              )}
              title={group.hidden ? 'Mostrar este status no board' : 'Ocultar este status do board'}
              aria-label={group.hidden ? 'Restaurar' : 'Ocultar'}
            >
              {group.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </div>
        )}
      </div>

      {open && (
        group.tasks.length > 0 ? (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {group.tasks.map((t) => <TaskRow key={t.id} task={t} isAdmin={isAdmin} onCreate={onCreate} onView={onView} />)}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-text-tertiary border-t border-border-subtle">Nenhuma tarefa neste status.</p>
        )
      )}
    </div>
  )
}

export default function PrioritiesBoard() {
  const { board, loading, refreshing, refresh, markTaskCreated, mode, setMode } = usePriorityBoard()
  const { hasProfile } = useAuth() as any
  const isAdmin = hasProfile ? hasProfile('ADMIN') : false

  const [requesters, setRequesters] = React.useState<{ id: number; name: string }[]>([])
  const [viewTaskId, setViewTaskId] = React.useState<number | null>(null)
  const [createFor, setCreateFor] = React.useState<PriorityTask | null>(null)
  const [flowType, setFlowType] = React.useState<string>('')
  const [requesterId, setRequesterId] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)

  // Estado local dos grupos — sincronizado com board.groups mas mutável pra updates otimistas
  const [groups, setGroups] = React.useState<PriorityGroup[]>([])
  React.useEffect(() => {
    setGroups(board?.groups || [])
  }, [board?.groups])

  // Mostrar/esconder os ocultos no board
  const [showHidden, setShowHidden] = React.useState(false)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const hiddenCount = groups.filter((g) => g.hidden).length
  const visibleGroups = showHidden ? groups : groups.filter((g) => !g.hidden)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groups.findIndex((g) => g.status === active.id)
    const newIndex = groups.findIndex((g) => g.status === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(groups, oldIndex, newIndex)
    setGroups(next) // otimista
    try {
      await priorityService.updatePreferences({ orderedStatuses: next.map((g) => g.status) })
      toast.success('Ordem do board atualizada')
    } catch {
      toast.error('Falha ao salvar ordem — restaurando')
      setGroups(board?.groups || [])
    }
  }

  const handleMarkPrimary = async (status: string) => {
    const prev = groups
    setGroups((gs) => gs.map((g) => ({ ...g, primary: g.status === status })))
    try {
      await priorityService.updatePreferences({ primaryStatus: status })
      toast.success(`"${status}" marcado como Principal`)
    } catch {
      toast.error('Falha ao salvar — restaurando')
      setGroups(prev)
    }
  }

  const handleToggleHidden = async (status: string, hidden: boolean) => {
    const prev = groups
    setGroups((gs) => gs.map((g) => g.status === status ? { ...g, hidden } : g))
    const newHidden = (groups.filter((g) => g.status === status ? hidden : g.hidden)).map((g) => g.status)
    try {
      await priorityService.updatePreferences({ hiddenStatuses: newHidden })
      toast.success(hidden ? `"${status}" ocultado` : `"${status}" restaurado`)
    } catch {
      toast.error('Falha ao salvar — restaurando')
      setGroups(prev)
    }
  }

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
      const created = await taskService.createWithSubTasks({
        requesterId: Number(requesterId),
        code: createFor.id,
        title: createFor.name,
        description: createFor.description || '',
        link: createFor.url || `https://app.clickup.com/t/${createFor.id}`,
        flowType,
        priority: mapPriority(createFor.priority),
        hasSubTasks: false,
        subTasks: [],
      })
      toast.success('Tarefa criada com entrega')
      markTaskCreated(createFor.id, created?.id)
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
        title="Tarefas ClickUp"
        subtitle={
          board?.currentUser?.username || board?.fetchedAt
            ? [
                board?.currentUser?.username ? `Conectado como ${board.currentUser.username}` : null,
                board?.fetchedAt ? fmtUpdated(board.fetchedAt) : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border border-border-strong bg-surface-1 p-0.5" role="group" aria-label="Filtro do board">
              {FILTER_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  title={m.title}
                  className={cn(
                    'h-7 rounded px-2.5 text-xs font-medium transition-colors',
                    mode === m.value
                      ? 'bg-accent text-accent-fg'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              leadingIcon={<RefreshCw className={refreshing ? 'animate-spin' : ''} />}
              onClick={refresh}
              loading={refreshing}
            >
              Atualizar
            </Button>
          </div>
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
          description="Configure as chaves do board (ClickUp) na tela de Parâmetros para ver suas tarefas ClickUp aqui."
        />
      ) : board.groups.every((g) => g.count === 0) ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Nenhuma tarefa encontrada"
          description="Não há tarefas atribuídas a você nos status configurados."
        />
      ) : (
        <>
          {hiddenCount > 0 && (
            <div className="mb-2 flex items-center justify-end">
              <button
                onClick={() => setShowHidden((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
              >
                {showHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {showHidden ? `Esconder ${hiddenCount} oculto${hiddenCount > 1 ? 's' : ''}` : `Ver ${hiddenCount} oculto${hiddenCount > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleGroups.map((g) => g.status)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {visibleGroups.map((g) => (
                  <GroupSection
                    key={g.status}
                    group={g}
                    defaultOpen={g.primary}
                    isAdmin={isAdmin}
                    onCreate={openCreate}
                    onView={setViewTaskId}
                    onMarkPrimary={handleMarkPrimary}
                    onToggleHidden={handleToggleHidden}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
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

      {/* Modal: visualização rápida da tarefa já cadastrada no DevQuote */}
      <TaskQuickViewModal
        taskId={viewTaskId}
        open={viewTaskId != null}
        onClose={() => setViewTaskId(null)}
      />
    </div>
  )
}
