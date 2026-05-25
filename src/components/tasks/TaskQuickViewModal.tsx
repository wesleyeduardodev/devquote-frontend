import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, ExternalLink, Link as LinkIcon, Maximize2, Truck, Video,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { taskService } from '@/services/taskService'
import { Button } from '@/components/ui-v2/Button'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui-v2/Dialog'
import { FlowChip } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel } from '@/components/tasks/EnvLabel'
import { cn } from '@/utils/cn'

interface SubTask {
  id: number
  title?: string
  description?: string
  completed?: boolean
  amount?: number
}

interface TaskFull {
  id: number
  title?: string
  name?: string
  code?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  taskType?: string
  flowType?: 'DESENVOLVIMENTO' | 'OPERACIONAL'
  environment?: 'DESENVOLVIMENTO' | 'HOMOLOGACAO' | 'PRODUCAO'
  moduleName?: string
  serverName?: string
  serverLink?: string
  requesterName?: string
  link?: string
  meetingLink?: string
  subtasks?: SubTask[]
  subTasks?: SubTask[]
  totalAmount?: number
  amount?: number
  hasDelivery?: boolean
  createdAt?: string
  updatedAt?: string
  createdByUserName?: string
  updatedByUserName?: string
}

const PRIORITY_META: Record<string, { label: string; dot: string; text: string }> = {
  LOW:    { label: 'Baixa',   dot: 'bg-emerald-500', text: 'text-[var(--success-strong)]' },
  MEDIUM: { label: 'Média',   dot: 'bg-amber-500',   text: 'text-[var(--warning-strong)]' },
  HIGH:   { label: 'Alta',    dot: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-300' },
  URGENT: { label: 'Urgente', dot: 'bg-rose-500',    text: 'text-[var(--danger-strong)]' },
}

const formatDate = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-t border-border-subtle pt-4 first:border-t-0 first:pt-0">
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </section>
)

const InfoField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={className}>
    <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
    <div className="text-sm text-text-primary">{children}</div>
  </div>
)

interface Props {
  taskId: number | null
  open: boolean
  onClose: () => void
}

export const TaskQuickViewModal: React.FC<Props> = ({ taskId, open, onClose }) => {
  const navigate = useNavigate()
  const { hasProfile } = useAuth()
  const canViewValues = hasProfile('ADMIN') || hasProfile('MANAGER')

  const [task, setTask] = React.useState<TaskFull | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !taskId) return
    let alive = true
    setLoading(true)
    setTask(null)
    taskService.getById(taskId)
      .then((data: any) => { if (alive) setTask(data) })
      .catch((e: any) => {
        if (!alive) return
        toast.error(e?.message || 'Erro ao carregar tarefa')
        onClose()
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, taskId, onClose])

  const subtasks = task?.subtasks || task?.subTasks || []
  const taskName = task?.title || task?.name || ''
  const priorityMeta = task?.priority ? PRIORITY_META[task.priority] : undefined
  const total = task?.totalAmount ?? task?.amount ?? subtasks.reduce((t, s) => t + (s.amount || 0), 0)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="lg:w-[70vw] max-w-none lg:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              Tarefa
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-soft text-accent">
                #{taskId}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription>
            {loading
              ? 'Carregando…'
              : (
                <span className="inline-flex items-center gap-2">
                  {task?.code && <span className="font-mono text-xs">{task.code}</span>}
                  {task?.code && task?.requesterName && <span className="text-text-tertiary">·</span>}
                  {task?.requesterName && <span>{task.requesterName}</span>}
                </span>
              )}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!loading && task && (
          <div className="space-y-4">
            {/* Chips + valor */}
            <div className="rounded-lg border border-border-subtle bg-surface-app/60 p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {task.flowType && <FlowChip value={task.flowType} />}
                {task.taskType && <TaskTypeLabel value={task.taskType} />}
                {task.environment && <EnvLabel value={task.environment} />}
                {priorityMeta && (
                  <span className={cn('inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-xs font-medium border bg-surface-2 border-border-subtle', priorityMeta.text)}>
                    <span className={cn('size-2 rounded-full', priorityMeta.dot)} />
                    {priorityMeta.label}
                  </span>
                )}
                {task.hasDelivery && (
                  <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-xs font-medium border bg-info-soft text-[var(--info-strong)] border-info-border">
                    <Truck className="size-3" />
                    Com entrega
                  </span>
                )}
              </div>
              {canViewValues && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Valor total</p>
                  <p className="text-base font-semibold text-text-primary tabular-nums">{brl(total)}</p>
                </div>
              )}
            </div>

            <Section title="Conteúdo">
              <InfoField label="Título">
                <p className="text-base text-text-primary leading-snug break-words">{taskName || '—'}</p>
              </InfoField>
              <InfoField label="Descrição">
                {task.description ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-md"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                ) : (
                  <p className="text-text-tertiary italic">Sem descrição</p>
                )}
              </InfoField>
            </Section>

            {(task.moduleName || task.serverName) && (
              <Section title="Operacional">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {task.moduleName && (
                    <InfoField label="Módulo do Sistema"><span className="font-medium">{task.moduleName}</span></InfoField>
                  )}
                  {task.serverName && (
                    <InfoField label="Servidor">
                      {task.serverLink ? (
                        <a href={task.serverLink} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline inline-flex items-center gap-1">
                          {task.serverName}<ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="font-medium">{task.serverName}</span>
                      )}
                    </InfoField>
                  )}
                </div>
              </Section>
            )}

            {(task.link || task.meetingLink) && (
              <Section title="Links">
                {task.link && (
                  <InfoField label="Link da tarefa">
                    <div className="flex items-center gap-2 min-w-0">
                      <LinkIcon className="size-3.5 text-text-tertiary shrink-0" />
                      <a href={task.link} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate flex-1">{task.link}</a>
                      <ExternalLink className="size-3.5 text-text-tertiary shrink-0" />
                    </div>
                  </InfoField>
                )}
                {task.meetingLink && (
                  <InfoField label="Link da reunião">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="size-3.5 text-text-tertiary shrink-0" />
                      <a href={task.meetingLink} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate flex-1">{task.meetingLink}</a>
                      <ExternalLink className="size-3.5 text-text-tertiary shrink-0" />
                    </div>
                  </InfoField>
                )}
              </Section>
            )}

            {subtasks.length > 0 && (
              <Section title={`Subtarefas (${subtasks.length})`}>
                <div className="rounded-md border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                  {subtasks.map((s, idx) => (
                    <div key={s.id} className={cn('px-3 py-2.5', s.completed && 'bg-success-soft/30')}>
                      <div className="flex items-start gap-3">
                        <span className="size-5 shrink-0 grid place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-text-secondary">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          {s.title && (
                            <p className={cn('text-sm font-medium leading-snug break-words', s.completed ? 'text-[var(--success-strong)] line-through' : 'text-text-primary')}>
                              {s.title}
                            </p>
                          )}
                          {s.description && (
                            <div
                              className={cn('prose prose-sm dark:prose-invert max-w-none mt-1', s.completed && 'text-[var(--success-strong)]')}
                              dangerouslySetInnerHTML={{ __html: s.description }}
                            />
                          )}
                        </div>
                        {canViewValues && s.amount !== undefined && s.amount > 0 && (
                          <span className="text-sm font-semibold text-[var(--success-strong)] tabular-nums whitespace-nowrap">
                            {brl(s.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Auditoria">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="Criada em">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-text-tertiary" />
                    <span className="font-medium tabular-nums">{formatDate(task.createdAt)}</span>
                    {task.createdByUserName && <span className="text-text-tertiary text-xs">· por {task.createdByUserName}</span>}
                  </div>
                </InfoField>
                <InfoField label="Última atualização">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-text-tertiary" />
                    <span className="font-medium tabular-nums">{formatDate(task.updatedAt)}</span>
                    {task.updatedByUserName && <span className="text-text-tertiary text-xs">· por {task.updatedByUserName}</span>}
                  </div>
                </InfoField>
              </div>
            </Section>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button
            leadingIcon={<Maximize2 />}
            onClick={() => { if (taskId) { onClose(); navigate(`/tasks/${taskId}`) } }}
            disabled={!taskId}
          >
            Abrir página completa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TaskQuickViewModal
