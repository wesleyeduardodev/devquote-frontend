import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, ExternalLink, FolderOpen, GitBranch, Maximize2, Package, Play, Flag, StickyNote,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { deliveryService } from '@/services/deliveryService'
import { Delivery } from '@/types/delivery.types'
import { Button } from '@/components/ui-v2/Button'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui-v2/Dialog'
import { FlowChip } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel } from '@/components/deliveries/EnvLabel'
import { DeliveryStatusBadge } from '@/components/deliveries/DeliveryStatusBadge'
import { cn } from '@/utils/cn'

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

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
  deliveryId: number | null
  open: boolean
  onClose: () => void
}

export const DeliveryQuickViewModal: React.FC<Props> = ({ deliveryId, open, onClose }) => {
  const navigate = useNavigate()
  const { hasProfile } = useAuth()
  const canViewValues = hasProfile('ADMIN') || hasProfile('MANAGER')

  const [delivery, setDelivery] = React.useState<Delivery | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !deliveryId) return
    let alive = true
    setLoading(true)
    setDelivery(null)
    deliveryService.getById(deliveryId)
      .then((data: any) => { if (alive) setDelivery(data) })
      .catch((e: any) => {
        if (!alive) return
        toast.error(e?.message || 'Erro ao carregar entrega')
        onClose()
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, deliveryId, onClose])

  const isOperacional = delivery?.flowType === 'OPERACIONAL'
  const items: any[] = (isOperacional ? delivery?.operationalItems : delivery?.items) || []

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="lg:w-[70vw] max-w-none lg:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              Entrega
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-soft text-accent">
                #{deliveryId}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription>
            {loading
              ? 'Carregando…'
              : (
                <span className="inline-flex items-center gap-2">
                  {delivery?.taskCode && <span className="font-mono text-xs">{delivery.taskCode}</span>}
                  {delivery?.taskCode && delivery?.taskName && <span className="text-text-tertiary">·</span>}
                  {delivery?.taskName && <span className="truncate">{delivery.taskName}</span>}
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

        {!loading && delivery && (
          <div className="space-y-4">
            {/* Chips + valor */}
            <div className="rounded-lg border border-border-subtle bg-surface-app/60 p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {delivery.flowType && <FlowChip value={delivery.flowType} />}
                {delivery.taskType && <TaskTypeLabel value={delivery.taskType} />}
                {delivery.environment && <EnvLabel value={delivery.environment} />}
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              {canViewValues && delivery.taskValue !== undefined && delivery.taskValue !== null && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Valor</p>
                  <p className="text-base font-semibold text-text-primary tabular-nums">{brl(delivery.taskValue)}</p>
                </div>
              )}
            </div>

            <Section title="Tarefa">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoField label="ID">
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(`/tasks/${delivery.taskId}`) }}
                    className="font-mono text-text-primary hover:underline"
                  >
                    #{delivery.taskId}
                  </button>
                </InfoField>
                <InfoField label="Código"><span className="font-mono">{delivery.taskCode || '—'}</span></InfoField>
                <InfoField label="Título"><span className="block truncate">{delivery.taskName || '—'}</span></InfoField>
              </div>
            </Section>

            <Section title="Cronograma">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <div className="rounded-md border border-warning-border bg-warning-soft p-3">
                  <div className="flex items-start gap-2">
                    <StickyNote className="size-4 text-[var(--warning-strong)] shrink-0 mt-0.5" />
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none flex-1"
                      dangerouslySetInnerHTML={{ __html: delivery.notes }}
                    />
                  </div>
                </div>
              </Section>
            )}

            <Section title={`Itens (${items.length})`}>
              {items.length === 0 ? (
                <div className="text-center py-6 rounded-md border border-dashed border-border-subtle">
                  <Package className="size-7 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">Esta entrega ainda não possui itens.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => (
                    <div key={item.id} className="rounded-md border border-border-subtle overflow-hidden">
                      <div className="bg-surface-app/60 px-3 py-2 border-b border-border-subtle">
                        <div className="flex items-center gap-3">
                          <span className="size-5 shrink-0 grid place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-text-secondary">
                            {idx + 1}
                          </span>
                          <FolderOpen className="size-4 text-accent shrink-0" />
                          <p className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">
                            {isOperacional ? (item.title || `Item #${item.id}`) : (item.projectName || `Item #${item.id}`)}
                          </p>
                          {item.status && <DeliveryStatusBadge status={item.status} />}
                        </div>
                      </div>
                      <div className="px-3 py-3 space-y-3">
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
                            {(item.startedAt || item.finishedAt) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InfoField label="Início"><span className="font-medium tabular-nums">{formatDate(item.startedAt)}</span></InfoField>
                                <InfoField label="Fim"><span className="font-medium tabular-nums">{formatDate(item.finishedAt)}</span></InfoField>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <InfoField label="Pull Request">
                              {item.pullRequest ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <GitBranch className="size-3.5 text-text-tertiary shrink-0" />
                                  <a
                                    href={item.pullRequest}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-accent hover:underline truncate flex-1 text-xs"
                                  >
                                    {item.pullRequest}
                                  </a>
                                  <ExternalLink className="size-3.5 text-text-tertiary shrink-0" />
                                </div>
                              ) : <span className="text-text-tertiary text-xs">—</span>}
                            </InfoField>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <InfoField label="Branch">
                                {item.branch
                                  ? <code className="font-mono text-xs bg-surface-2 px-2 py-1 rounded inline-block max-w-full truncate">{item.branch}</code>
                                  : <span className="text-text-tertiary text-xs">—</span>}
                              </InfoField>
                              <InfoField label="Branch de origem">
                                {item.sourceBranch
                                  ? <code className="font-mono text-xs bg-surface-2 px-2 py-1 rounded inline-block max-w-full truncate">{item.sourceBranch}</code>
                                  : <span className="text-text-tertiary text-xs">—</span>}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <InfoField label="Início"><span className="font-medium tabular-nums">{formatDate(item.startedAt)}</span></InfoField>
                              <InfoField label="Fim"><span className="font-medium tabular-nums">{formatDate(item.finishedAt)}</span></InfoField>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Auditoria">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button
            leadingIcon={<Maximize2 />}
            onClick={() => { if (deliveryId) { onClose(); navigate(`/deliveries/${deliveryId}`) } }}
            disabled={!deliveryId}
          >
            Abrir página completa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeliveryQuickViewModal
