import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText, Calendar, GitBranch, Package, Truck, Check, Play, Flag,
  Copy, StickyNote, FolderOpen, ChevronRight, ChevronDown, ExternalLink,
  Edit3, ListChecks,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { deliveryService } from '@/services/deliveryService'
import { Delivery, DeliveryItem } from '@/types/delivery.types'
import { Button } from '@/components/ui-v2/Button'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { FlowChip } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel } from '@/components/deliveries/EnvLabel'
import { DeliveryStatusBadge, STATUS_LABEL } from '@/components/deliveries/DeliveryStatusBadge'
import { DeliveryAttachmentList } from '@/components/deliveries/DeliveryAttachmentList'
import { DeliveryOperationalAttachmentList } from '@/components/deliveries/DeliveryOperationalAttachmentList'
import { cn } from '@/utils/cn'

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
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

const DeliveryView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasProfile } = useAuth()
  const canEdit = hasProfile('ADMIN') || hasProfile('MANAGER')
  const isAdmin = hasProfile('ADMIN')

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false)

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!id) { navigate('/deliveries'); return }
      try {
        setLoading(true)
        const data = await deliveryService.getById(Number(id))
        setDelivery(data)
      } catch (e) {
        console.error('Erro ao carregar entrega:', e)
        navigate('/deliveries')
      } finally {
        setLoading(false)
      }
    }
    fetchDelivery()
  }, [id, navigate])

  const handleCopy = async (content: string, fieldName: string) => {
    if (!content) return
    try { await navigator.clipboard.writeText(content) } catch { /* ignore */ }
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const toggleItem = (itemId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center rounded-lg border border-border-subtle bg-surface-1 p-8">
          <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-6 h-6 text-[var(--danger-strong)]" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Entrega não encontrada</h2>
          <p className="text-sm text-text-secondary mb-6">
            A entrega que você está procurando não foi encontrada.
          </p>
          <Button onClick={() => navigate('/deliveries')} className="w-full">
            Voltar para listagem
          </Button>
        </div>
      </div>
    )
  }

  const isOperacional = delivery.flowType === 'OPERACIONAL'
  const items = isOperacional ? delivery.operationalItems : delivery.items
  const itemCount = items?.length || 0

  return (
    <div className="w-full">
      <div className="w-full space-y-4">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              Entrega
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-soft text-accent">
                #{delivery.id}
              </span>
            </span>
          }
          subtitle={
            <span className="inline-flex items-center gap-2">
              {delivery.taskCode && <span className="font-mono text-xs">{delivery.taskCode}</span>}
              {delivery.taskCode && delivery.taskName && <span className="text-text-tertiary">·</span>}
              {delivery.taskName && <span className="truncate">{delivery.taskName}</span>}
            </span>
          }
          actions={
            canEdit ? (
              <Button variant="secondary" leadingIcon={<Edit3 />} onClick={() => navigate(`/deliveries/${delivery.id}/edit`)}>
                Editar
              </Button>
            ) : undefined
          }
        />

        {/* Cabeçalho compacto: chips + valor à direita */}
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {delivery.flowType && <FlowChip value={delivery.flowType} />}
            {delivery.taskType && <TaskTypeLabel value={delivery.taskType} />}
            {delivery.environment && <EnvLabel value={delivery.environment} />}
            <DeliveryStatusBadge status={delivery.status} withTime={delivery.updatedAt} />
          </div>
          {isAdmin && delivery.taskValue !== undefined && delivery.taskValue !== null && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Valor</p>
              <p className="text-lg font-semibold text-text-primary tabular-nums">{brl(delivery.taskValue)}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-6">

          <Section title="Tarefa">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="ID da tarefa">
                <button
                  type="button"
                  onClick={() => navigate(`/tasks/${delivery.taskId}`)}
                  className="font-mono text-text-primary hover:underline"
                >
                  #{delivery.taskId}
                </button>
              </InfoField>
              <InfoField label="Código">
                <span className="font-mono">{delivery.taskCode || '—'}</span>
              </InfoField>
              <InfoField label="Título">
                <span className="truncate block">{delivery.taskName || '—'}</span>
              </InfoField>
            </div>
          </Section>

          <Section title="Cronograma">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Data início">
                <div className="flex items-center gap-2">
                  <Play className="size-3.5 text-[var(--success-strong)]" />
                  <span className="font-medium tabular-nums">{formatDate(delivery.startedAt)}</span>
                </div>
              </InfoField>
              <InfoField label="Data fim">
                <div className="flex items-center gap-2">
                  <Flag className="size-3.5 text-[var(--success-strong)]" />
                  <span className="font-medium tabular-nums">{formatDate(delivery.finishedAt)}</span>
                </div>
              </InfoField>
            </div>
          </Section>

          {delivery.notes && (
            <Section title="Observações">
              <div className="rounded-md border border-warning-border bg-warning-soft p-4">
                <div className="flex items-start gap-2">
                  <StickyNote className="size-4 text-[var(--warning-strong)] shrink-0 mt-0.5" />
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-md flex-1"
                    dangerouslySetInnerHTML={{ __html: delivery.notes }}
                  />
                </div>
              </div>
            </Section>
          )}

          <Section title={`Itens (${itemCount})`}>
            {itemCount === 0 ? (
              <div className="text-center py-8 rounded-md border border-dashed border-border-subtle">
                <Package className="size-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-tertiary">Esta entrega ainda não possui itens cadastrados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(items as any[]).map((item: any, idx: number) => {
                  const isExpanded = expandedItems.has(item.id)
                  return (
                    <div key={item.id} className="border border-border-subtle rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full bg-surface-1 px-3 py-2.5 hover:bg-surface-2 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded
                            ? <ChevronDown className="size-4 text-text-tertiary shrink-0" />
                            : <ChevronRight className="size-4 text-text-tertiary shrink-0" />}
                          <span className="size-6 shrink-0 grid place-items-center rounded-full bg-surface-2 text-xs font-semibold text-text-secondary">
                            {idx + 1}
                          </span>
                          <FolderOpen className="size-4 text-accent shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {isOperacional ? item.title : item.projectName}
                            </p>
                            <p className="text-xs text-text-tertiary">Item #{item.id}</p>
                          </div>
                          <DeliveryStatusBadge status={item.status} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-surface-app/40 px-3 py-3 border-t border-border-subtle space-y-4">
                          {isOperacional ? (
                            <>
                              {item.description && (
                                <InfoField label="Descrição">
                                  <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                  />
                                </InfoField>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoField label="Início">
                                  <span className="font-medium tabular-nums">{formatDate(item.startedAt)}</span>
                                </InfoField>
                                <InfoField label="Fim">
                                  <span className="font-medium tabular-nums">{formatDate(item.finishedAt)}</span>
                                </InfoField>
                              </div>
                              <DeliveryOperationalAttachmentList
                                operationalItemId={item.id}
                                readOnly={true}
                                forceExpanded={false}
                                className="border-t border-border-subtle pt-3"
                              />
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 gap-3">
                                <InfoField label="Pull Request">
                                  {item.pullRequest ? (
                                    <div className="flex items-center gap-2">
                                      <GitBranch className="size-3.5 text-text-tertiary shrink-0" />
                                      <a
                                        href={item.pullRequest}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent hover:underline truncate flex-1 text-xs"
                                      >
                                        {item.pullRequest}
                                      </a>
                                      <ExternalLink className="size-3.5 text-text-tertiary shrink-0" />
                                      <CopyButton value={item.pullRequest} field={`pr-${item.id}`} copied={copiedField} onCopy={handleCopy} />
                                    </div>
                                  ) : <span className="text-text-tertiary">—</span>}
                                </InfoField>
                                <InfoField label="Branch">
                                  {item.branch ? (
                                    <div className="flex items-center gap-2">
                                      <code className="font-mono text-xs bg-surface-2 px-2 py-1 rounded flex-1 truncate">{item.branch}</code>
                                      <CopyButton value={item.branch} field={`branch-${item.id}`} copied={copiedField} onCopy={handleCopy} />
                                    </div>
                                  ) : <span className="text-text-tertiary">—</span>}
                                </InfoField>
                                <InfoField label="Branch de origem">
                                  {item.sourceBranch ? (
                                    <div className="flex items-center gap-2">
                                      <code className="font-mono text-xs bg-surface-2 px-2 py-1 rounded flex-1 truncate">{item.sourceBranch}</code>
                                      <CopyButton value={item.sourceBranch} field={`sb-${item.id}`} copied={copiedField} onCopy={handleCopy} />
                                    </div>
                                  ) : <span className="text-text-tertiary">—</span>}
                                </InfoField>
                              </div>

                              {item.notes && (
                                <InfoField label="Observações">
                                  <div
                                    className="prose prose-sm dark:prose-invert max-w-none rounded-md border-l-2 border-warning-border bg-warning-soft/50 pl-3 py-2"
                                    dangerouslySetInnerHTML={{ __html: item.notes }}
                                  />
                                </InfoField>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoField label="Início">
                                  <span className="font-medium tabular-nums">{formatDate(item.startedAt)}</span>
                                </InfoField>
                                <InfoField label="Fim">
                                  <span className="font-medium tabular-nums">{formatDate(item.finishedAt)}</span>
                                </InfoField>
                              </div>

                              <DeliveryAttachmentList
                                deliveryItemId={item.id}
                                readOnly={true}
                                forceExpanded={false}
                                className="border-t border-border-subtle pt-3"
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          <Section title="Anexos">
            <button
              type="button"
              onClick={() => setAttachmentsExpanded(!attachmentsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-border-subtle hover:bg-surface-2 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Truck className="size-4 text-text-tertiary" />
                Arquivos da entrega
              </span>
              {attachmentsExpanded
                ? <ChevronDown className="size-4 text-text-tertiary" />
                : <ChevronRight className="size-4 text-text-tertiary" />}
            </button>
            {attachmentsExpanded && (
              <div className="mt-3 rounded-md border border-border-subtle p-4 bg-surface-app/40">
                <DeliveryAttachmentList deliveryId={delivery.id} forceExpanded={true} readOnly={true} />
              </div>
            )}
          </Section>

          <Section title="Auditoria">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Criada em">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-text-tertiary" />
                  <span className="font-medium tabular-nums">{formatDate(delivery.createdAt)}</span>
                </div>
              </InfoField>
              <InfoField label="Última atualização">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-text-tertiary" />
                  <span className="font-medium tabular-nums">{formatDate(delivery.updatedAt)}</span>
                </div>
              </InfoField>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}

export default DeliveryView
