import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText, Calendar, AlertCircle, Link as LinkIcon, Video, Copy, Check,
  Paperclip, ChevronDown, ChevronUp, Edit3, ExternalLink, ListChecks,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { taskService } from '@/services/taskService'
import { Button as BtnV2 } from '@/components/ui-v2/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AttachmentList from '@/components/ui/AttachmentList'
import SubTaskAttachmentList from '@/components/ui/SubTaskAttachmentList'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { FlowChip } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel } from '@/components/tasks/EnvLabel'
import { cn } from '@/utils/cn'

interface Subtask {
  id: number
  title?: string
  description: string
  completed: boolean
  amount?: number
  createdAt?: string
}

interface Task {
  id: number
  title: string
  name?: string
  code?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  taskType?: string
  flowType?: 'DESENVOLVIMENTO' | 'OPERACIONAL'
  environment?: 'DESENVOLVIMENTO' | 'HOMOLOGACAO' | 'PRODUCAO'
  serverOrigin?: string
  systemModule?: string
  requesterName?: string
  requesterId?: number
  link?: string
  meetingLink?: string
  subtasks?: Subtask[]
  subTasks?: Subtask[]
  totalAmount?: number
  amount?: number
  createdAt?: string
  updatedAt?: string
  createdByUserName?: string
  updatedByUserName?: string
}

// ---- helpers ----
const PRIORITY_META: Record<string, { label: string; dot: string; text: string }> = {
  LOW:    { label: 'Baixa',   dot: 'bg-emerald-500', text: 'text-[var(--success-strong)]' },
  MEDIUM: { label: 'Média',   dot: 'bg-amber-500',   text: 'text-[var(--warning-strong)]' },
  HIGH:   { label: 'Alta',    dot: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-300' },
  URGENT: { label: 'Urgente', dot: 'bg-rose-500',    text: 'text-[var(--danger-strong)]' },
}

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <section className={cn('border-t border-border-subtle pt-6 first:border-t-0 first:pt-0', className)}>
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
)

const InfoField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={className}>
    <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
    <div className="text-sm text-text-primary">{children}</div>
  </div>
)

const CopyButton: React.FC<{ value: string; field: string; copied: string | null; onCopy: (v: string, f: string) => void }> = ({ value, field, copied, onCopy }) => (
  <button
    onClick={() => onCopy(value, field)}
    type="button"
    className={cn(
      'p-1.5 rounded transition-colors shrink-0',
      copied === field ? 'bg-success-soft text-[var(--success-strong)]' : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2',
    )}
    title="Copiar"
  >
    {copied === field ? <Check className="size-4" /> : <Copy className="size-4" />}
  </button>
)

const TaskView: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasProfile } = useAuth()
  const isAdmin = hasProfile('ADMIN')
  const canViewValues = hasProfile('ADMIN') || hasProfile('MANAGER')

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isAttachmentSectionExpanded, setIsAttachmentSectionExpanded] = useState(false)
  const [taskAttachmentCount, setTaskAttachmentCount] = useState(0)
  const [subTaskAttachmentCounts, setSubTaskAttachmentCounts] = useState<Record<number, number>>({})
  const [expandedSubTaskAttachments, setExpandedSubTaskAttachments] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) { navigate('/tasks'); return }
      try {
        setLoading(true)
        const data = await taskService.getById(Number(id))
        setTask(data)
      } catch (e) {
        console.error('Erro ao carregar tarefa:', e)
        navigate('/tasks')
      } finally { setLoading(false) }
    }
    fetchTask()
  }, [id, navigate])

  const handleCopy = async (content: string, fieldName: string) => {
    if (!content) return
    try { await navigator.clipboard.writeText(content) }
    catch { /* fallback handled elsewhere if needed */ }
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const calculateTaskTotal = () => {
    if (!task) return 0
    if (task.totalAmount !== undefined) return task.totalAmount
    if (task.amount !== undefined) return task.amount
    const subs = task.subtasks || task.subTasks || []
    return subs.reduce((t, s) => t + (s.amount || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <LoadingSpinner size="lg" />
          <span>Carregando tarefa…</span>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-[var(--danger-strong)]" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Tarefa não encontrada</h2>
          <p className="text-sm text-text-secondary mb-6">
            A tarefa que você está procurando não foi encontrada.
          </p>
          <BtnV2 onClick={() => navigate('/tasks')} className="w-full">
            Voltar para listagem
          </BtnV2>
        </Card>
      </div>
    )
  }

  const subtasks = task.subtasks || task.subTasks || []
  const taskName = task.title || task.name || ''
  const priorityMeta = task.priority ? PRIORITY_META[task.priority] : undefined
  const total = calculateTaskTotal()

  return (
    <div className="w-full">
      <div className="w-full space-y-4">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              Tarefa
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-soft text-accent">
                #{task.id}
              </span>
            </span>
          }
          subtitle={
            <span className="inline-flex items-center gap-2">
              {task.code && <span className="font-mono text-xs">{task.code}</span>}
              {task.code && task.requesterName && <span className="text-text-tertiary">·</span>}
              {task.requesterName && <span>{task.requesterName}</span>}
            </span>
          }
          actions={
            isAdmin ? (
              <BtnV2 variant="secondary" leadingIcon={<Edit3 />} onClick={() => navigate(`/tasks/${task.id}/edit`)}>
                Editar
              </BtnV2>
            ) : undefined
          }
        />

        {/* Cabeçalho compacto: chips + valor à direita */}
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-4 flex flex-wrap items-center justify-between gap-3">
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
          </div>
          {canViewValues && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Valor total</p>
              <p className="text-lg font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-6">

          <Section title="Conteúdo">
            <InfoField label="Título">
              <p className="text-base text-text-primary leading-snug break-words">{taskName}</p>
            </InfoField>

            {task.description ? (
              <InfoField label="Descrição">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-md"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              </InfoField>
            ) : (
              <InfoField label="Descrição">
                <p className="text-text-tertiary italic">Sem descrição</p>
              </InfoField>
            )}
          </Section>

          {(task.systemModule || task.serverOrigin) && (
            <Section title="Operacional">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.systemModule && (
                  <InfoField label="Módulo do Sistema">
                    <span className="font-medium">{task.systemModule}</span>
                  </InfoField>
                )}
                {task.serverOrigin && (
                  <InfoField label="Servidor">
                    <span className="font-medium">{task.serverOrigin}</span>
                  </InfoField>
                )}
              </div>
            </Section>
          )}

          {(task.link || task.meetingLink) && (
            <Section title="Links">
              {task.link && (
                <InfoField label="Link da tarefa">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-3.5 text-text-tertiary shrink-0" />
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline truncate flex-1"
                    >
                      {task.link}
                    </a>
                    <ExternalLink className="size-3.5 text-text-tertiary shrink-0" />
                    <CopyButton value={task.link} field="taskLink" copied={copiedField} onCopy={handleCopy} />
                  </div>
                </InfoField>
              )}
              {task.meetingLink && (
                <InfoField label="Link da reunião">
                  <div className="flex items-center gap-2">
                    <Video className="size-3.5 text-text-tertiary shrink-0" />
                    <a
                      href={task.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline truncate flex-1"
                    >
                      {task.meetingLink}
                    </a>
                    <ExternalLink className="size-3.5 text-text-tertiary shrink-0" />
                    <CopyButton value={task.meetingLink} field="meetingLink" copied={copiedField} onCopy={handleCopy} />
                  </div>
                </InfoField>
              )}
            </Section>
          )}

          {subtasks.length > 0 && (
            <Section title={`Subtarefas (${subtasks.length})`}>
              <div className="rounded-md border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                {subtasks.map((s, idx) => (
                  <div key={s.id} className={cn('px-4 py-3 hover:bg-surface-app/40 transition-colors', s.completed && 'bg-success-soft/30')}>
                    <div className="flex items-start gap-3">
                      <span className="size-6 shrink-0 grid place-items-center rounded-full bg-surface-2 text-xs font-semibold text-text-secondary">
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
                        <button
                          type="button"
                          onClick={() => setExpandedSubTaskAttachments((p) => ({ ...p, [s.id]: !p[s.id] }))}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
                        >
                          <Paperclip className="size-3" />
                          Anexos
                          {subTaskAttachmentCounts[s.id] > 0 && (
                            <span className="font-medium text-accent">({subTaskAttachmentCounts[s.id]})</span>
                          )}
                          {expandedSubTaskAttachments[s.id] ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </button>
                        {!expandedSubTaskAttachments[s.id] && (
                          <div className="hidden">
                            <SubTaskAttachmentList
                              subTaskId={s.id}
                              onCountChange={(count) => setSubTaskAttachmentCounts((p) => ({ ...p, [s.id]: count }))}
                            />
                          </div>
                        )}
                        {expandedSubTaskAttachments[s.id] && (
                          <div className="mt-2 rounded-md border border-border-subtle p-3 bg-surface-app/40">
                            <SubTaskAttachmentList
                              subTaskId={s.id}
                              forceExpanded={true}
                              readOnly={true}
                              onCountChange={(count) => setSubTaskAttachmentCounts((p) => ({ ...p, [s.id]: count }))}
                            />
                          </div>
                        )}
                      </div>
                      {canViewValues && s.amount !== undefined && s.amount > 0 && (
                        <span className="text-sm font-semibold text-[var(--success-strong)] tabular-nums whitespace-nowrap">
                          {formatCurrency(s.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Anexos">
            <button
              type="button"
              onClick={() => setIsAttachmentSectionExpanded(!isAttachmentSectionExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-border-subtle hover:bg-surface-2 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Paperclip className="size-4 text-text-tertiary" />
                Arquivos da tarefa
                {taskAttachmentCount > 0 && (
                  <span className="text-xs font-semibold text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">{taskAttachmentCount}</span>
                )}
              </span>
              {isAttachmentSectionExpanded ? <ChevronUp className="size-4 text-text-tertiary" /> : <ChevronDown className="size-4 text-text-tertiary" />}
            </button>
            {!isAttachmentSectionExpanded && (
              <div className="hidden">
                <AttachmentList taskId={task.id} onCountChange={setTaskAttachmentCount} />
              </div>
            )}
            {isAttachmentSectionExpanded && (
              <div className="mt-3 rounded-md border border-border-subtle p-4 bg-surface-app/40">
                <AttachmentList taskId={task.id} forceExpanded={true} readOnly={true} onCountChange={setTaskAttachmentCount} />
              </div>
            )}
          </Section>

          <Section title="Auditoria">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  )
}

export default TaskView
