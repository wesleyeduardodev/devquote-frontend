import * as React from 'react'
import { Plus, Pencil, Trash2, MoreHorizontal, DollarSign, Download, Link as LinkIcon, Link2Off, Eye, Mail, Paperclip, CheckCircle2, XCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useAuth } from '@/hooks/useAuth'
import billingPeriodService from '@/services/billingPeriodService'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui-v2/DropdownMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-v2/Select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui-v2/Sheet'
import { Input } from '@/components/ui-v2/Input'
import { BillingKpiHero, BillingKpiCard } from '@/components/billing/BillingKpiHero'
import { StatusDot } from '@/components/ui-v2/StatusDot'

import LinkTasksToBillingModal from '@/components/billing/LinkTasksToBillingModal'
import UnlinkTasksFromBillingModal from '@/components/billing/UnlinkTasksFromBillingModal'
import ViewTasksModal from '@/components/billing/ViewTasksModal'
import BillingPeriodAttachmentModal from '@/components/billing/BillingPeriodAttachmentModal'

interface BillingPeriod {
  id: number
  month: number
  year: number
  paymentDate?: string
  status: string
  billingEmailSent?: boolean
  totalAmount?: number
  taskCount?: number
  createdAt?: string
  updatedAt?: string
}

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MONTH_LABEL = (m: number) =>
  format(new Date(2000, (m || 1) - 1, 1), 'MMMM', { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  PARTIALLY_PAID: 'Parcialmente pago',
  OVERDUE:   'Atrasado',
  CANCELLED: 'Cancelado',
}

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  PAID: 'success',
  PARTIALLY_PAID: 'warning',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
}

const BillingMonthManagement: React.FC = () => {
  const { hasAnyProfile } = useAuth() as any
  const canCRUD = hasAnyProfile ? hasAnyProfile(['ADMIN', 'MANAGER']) : true

  const [periods, setPeriods] = React.useState<BillingPeriod[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filters, setFilters] = React.useState<{ year?: number; month?: number; status?: string; flowType?: string }>({})
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})

  // Modal/sheet states
  const [createSheetOpen, setCreateSheetOpen] = React.useState(false)
  const [linkTo, setLinkTo] = React.useState<BillingPeriod | null>(null)
  const [unlinkFrom, setUnlinkFrom] = React.useState<BillingPeriod | null>(null)
  const [viewTasksOf, setViewTasksOf] = React.useState<BillingPeriod | null>(null)
  const [attachmentsOf, setAttachmentsOf] = React.useState<BillingPeriod | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<{ ids: number[] } | null>(null)
  const [editing, setEditing] = React.useState<BillingPeriod | null>(null)

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const fetchPeriods = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await billingPeriodService.findAllWithFilters(filters as any)
      setPeriods(data)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [filters])

  React.useEffect(() => { fetchPeriods() }, [fetchPeriods])

  // KPIs
  const kpis = React.useMemo(() => {
    const total = periods.reduce((s, p) => s + (p.totalAmount || 0), 0)
    const paid    = periods.filter((p) => p.status === 'PAID').reduce((s, p) => s + (p.totalAmount || 0), 0)
    const pending = periods.filter((p) => p.status === 'PENDING').reduce((s, p) => s + (p.totalAmount || 0), 0)
    const overdue = periods.filter((p) => p.status === 'OVERDUE').reduce((s, p) => s + (p.totalAmount || 0), 0)
    const cancelled = periods.filter((p) => p.status === 'CANCELLED').reduce((s, p) => s + (p.totalAmount || 0), 0)
    return { total, paid, pending, overdue, cancelled, count: periods.length }
  }, [periods])

  const handleMarkPaid = async (p: BillingPeriod) => {
    try {
      await (billingPeriodService as any).update(p.id, { status: 'PAID' })
      toast.success('Marcado como pago')
      await fetchPeriods()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar')
    }
  }

  const handleDelete = async (ids: number[]) => {
    try {
      if (ids.length === 1) {
        await (billingPeriodService as any).deleteWithAllLinkedTasks(ids[0])
      } else {
        await (billingPeriodService as any).deleteBulk(ids)
      }
      toast.success(`${ids.length} excluído(s)`)
      await fetchPeriods()
      setSelection({})
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir')
    } finally {
      setConfirmDelete(null)
    }
  }

  const columns = React.useMemo<ColumnDef<BillingPeriod, any>[]>(() => [
    {
      id: 'period', header: 'Período', size: 200,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-text-primary font-medium">
            {MONTH_LABEL(row.original.month)} {row.original.year}
          </span>
          <span className="text-xs text-text-tertiary">#{row.original.id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status', header: 'Status', size: 160,
      cell: ({ row }) => {
        const tone = STATUS_TONE[row.original.status] || 'neutral'
        return (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <StatusDot tone={tone} />
            <span className="text-text-primary">{STATUS_LABEL[row.original.status] || row.original.status}</span>
          </span>
        )
      },
    },
    {
      accessorKey: 'taskCount', header: 'Tarefas', size: 90,
      cell: ({ row }) => <span className="text-text-secondary tabular-nums">{row.original.taskCount ?? 0}</span>,
    },
    {
      accessorKey: 'totalAmount', header: () => <span className="block text-right">Valor</span>, size: 130,
      cell: ({ row }) => <span className="block text-right tabular-nums text-text-primary font-medium">{brl(row.original.totalAmount)}</span>,
    },
    {
      accessorKey: 'paymentDate', header: 'Pagamento', size: 130,
      cell: ({ row }) => {
        if (!row.original.paymentDate) return <span className="text-text-tertiary">—</span>
        const date = new Date(row.original.paymentDate)
        const isPast = !isNaN(date.getTime()) && date.getTime() < Date.now() && row.original.status !== 'PAID'
        return (
          <span className={isPast ? 'text-danger-strong tabular-nums' : 'text-text-secondary tabular-nums'}>
            {format(date, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        )
      },
    },
    {
      id: '__actions', header: '', size: 90,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => setViewTasksOf(row.original as any)} aria-label="Ver"><Eye /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Mais"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setViewTasksOf(row.original as any)}><Eye />Ver tarefas</DropdownMenuItem>
              {canCRUD && (
                <>
                  <DropdownMenuItem onSelect={() => setLinkTo(row.original as any)}><LinkIcon />Vincular tarefas</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setUnlinkFrom(row.original as any)}><Link2Off />Desvincular tarefas</DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onSelect={() => setAttachmentsOf(row.original as any)}><Paperclip />Anexos</DropdownMenuItem>
              {canCRUD && row.original.status !== 'PAID' && (
                <DropdownMenuItem onSelect={() => handleMarkPaid(row.original as any)}><CheckCircle2 />Marcar pago</DropdownMenuItem>
              )}
              {canCRUD && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="danger" onSelect={() => setConfirmDelete({ ids: [row.original.id] })}>
                    <Trash2 />Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [canCRUD])

  const chips: any[] = []
  if (filters.year)     chips.push({ key: 'year',     label: 'Ano',     value: String(filters.year),                       onRemove: () => setFilters((f) => ({ ...f, year: undefined })) })
  if (filters.month)    chips.push({ key: 'month',    label: 'Mês',     value: MONTH_LABEL(filters.month),                 onRemove: () => setFilters((f) => ({ ...f, month: undefined })) })
  if (filters.status)   chips.push({ key: 'status',   label: 'Status',  value: STATUS_LABEL[filters.status] || filters.status, onRemove: () => setFilters((f) => ({ ...f, status: undefined })) })
  if (filters.flowType) chips.push({ key: 'flow',     label: 'Fluxo',   value: filters.flowType,                           onRemove: () => setFilters((f) => ({ ...f, flowType: undefined })) })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento"
        subtitle={`${kpis.count} período${kpis.count === 1 ? '' : 's'}`}
        filters={
          <>
            <Select value={filters.status || '__all'} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === '__all' ? undefined : v }))}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos status</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(filters.year || '__all')} onValueChange={(v) => setFilters((f) => ({ ...f, year: v === '__all' ? undefined : Number(v) }))}>
              <SelectTrigger className="w-[120px] h-8"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos anos</SelectItem>
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - i
                  return <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                })}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <>
            <Button variant="secondary" leadingIcon={<Download />} onClick={async () => {
              try {
                const blob = await (billingPeriodService as any).exportToExcel(filters)
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `faturamento-${new Date().toISOString().slice(0,10)}.xlsx`
                a.click()
                URL.revokeObjectURL(url)
              } catch (e: any) { toast.error('Falha ao exportar') }
            }}>Exportar</Button>
            {canCRUD && <Button leadingIcon={<Plus />} onClick={() => setCreateSheetOpen(true)}>Novo período</Button>}
          </>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <BillingKpiHero total={kpis.total} />
        </div>
        <BillingKpiCard label="Pago"      value={brl(kpis.paid)}     tone="success" hint={`${periods.filter((p) => p.status === 'PAID').length} período(s)`} />
        <BillingKpiCard label="Pendente"  value={brl(kpis.pending)}  tone="warning" hint={`${periods.filter((p) => p.status === 'PENDING').length} período(s)`} />
        <BillingKpiCard label="Atrasado"  value={brl(kpis.overdue)}  tone="danger"  hint={kpis.overdue === 0 ? 'Em dia ✓' : `${periods.filter((p) => p.status === 'OVERDUE').length} atrasado(s)`} />
        <BillingKpiCard label="Cancelado" value={brl(kpis.cancelled)} tone="neutral" hint={`${periods.filter((p) => p.status === 'CANCELLED').length} cancelado(s)`} />
      </section>

      <div>
        <FilterChipsRow chips={chips} onClearAll={() => setFilters({})} />

        <DataTableBulkBar
          selectedCount={selectedIds.length}
          onClear={() => setSelection({})}
          actions={canCRUD && (
            <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ ids: selectedIds })}>
              Excluir
            </Button>
          )}
        />

        <div className="hidden lg:block">
          <DataTable<BillingPeriod>
            data={periods}
            columns={columns}
            rowKey={(r) => r.id}
            loading={loading}
            selectable
            selection={selection}
            onSelectionChange={setSelection}
            onRowClick={(r) => setViewTasksOf(r as any)}
            empty={
              <EmptyState
                icon={<DollarSign />}
                title="Nenhum período"
                description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro período de faturamento.'}
                actions={canCRUD && <Button leadingIcon={<Plus />} onClick={() => setCreateSheetOpen(true)}>Novo período</Button>}
              />
            }
          />
        </div>

        {/* Mobile */}
        <div className="lg:hidden space-y-2">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          {!loading && periods.length === 0 && (
            <EmptyState icon={<DollarSign />} title="Nenhum período" description="Crie o primeiro." actions={canCRUD && <Button leadingIcon={<Plus />} onClick={() => setCreateSheetOpen(true)}>Novo</Button>} />
          )}
          {!loading && periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewTasksOf(p)}
              className="w-full text-left rounded-lg border border-border-subtle bg-surface-1 p-4 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-text-primary">{MONTH_LABEL(p.month)} {p.year}</span>
                <span className="font-mono text-xs text-text-tertiary">#{p.id}</span>
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <StatusDot tone={STATUS_TONE[p.status] || 'neutral'} />
                  <span>{STATUS_LABEL[p.status] || p.status}</span>
                </span>
                <span className="text-sm font-medium tabular-nums">{brl(p.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>{p.taskCount ?? 0} tarefa(s)</span>
                {p.paymentDate && <span>vence {format(new Date(p.paymentDate), 'dd/MM/yyyy')}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modais existentes integrados */}
      <LinkTasksToBillingModal
        isOpen={!!linkTo}
        onClose={() => setLinkTo(null)}
        billingPeriod={linkTo as any}
        onTasksLinked={() => { fetchPeriods(); setLinkTo(null) }}
        flowType={filters.flowType}
      />
      <UnlinkTasksFromBillingModal
        isOpen={!!unlinkFrom}
        onClose={() => setUnlinkFrom(null)}
        billingPeriod={unlinkFrom as any}
        onTasksUnlinked={() => { fetchPeriods(); setUnlinkFrom(null) }}
        flowType={filters.flowType}
      />
      <ViewTasksModal
        isOpen={!!viewTasksOf}
        onClose={() => setViewTasksOf(null)}
        billingPeriod={viewTasksOf as any}
        flowType={filters.flowType}
      />
      {attachmentsOf && (
        <BillingPeriodAttachmentModal
          isOpen={true}
          onClose={() => setAttachmentsOf(null)}
          billingPeriodId={attachmentsOf.id}
          billingPeriodTitle={`${MONTH_LABEL(attachmentsOf.month)} ${attachmentsOf.year}`}
          isAdmin={canCRUD}
        />
      )}

      {/* Create sheet — formulário simples */}
      <CreatePeriodSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreated={fetchPeriods}
      />

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.ids.length === 1 ? 'período' : `${confirmDelete?.ids.length} períodos`}?</DialogTitle>
            <DialogDescription>Tarefas vinculadas serão desvinculadas. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete.ids)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Create sheet ===================== */
const CreatePeriodSheet: React.FC<{ open: boolean; onClose: () => void; onCreated: () => void }> = ({ open, onClose, onCreated }) => {
  const now = new Date()
  const [month, setMonth] = React.useState(now.getMonth() + 1)
  const [year, setYear] = React.useState(now.getFullYear())
  const [paymentDate, setPaymentDate] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setMonth(now.getMonth() + 1)
    setYear(now.getFullYear())
    setPaymentDate('')
  }, [open])

  const submit = async () => {
    try {
      setLoading(true)
      await (billingPeriodService as any).create({ month, year, paymentDate: paymentDate || undefined, status: 'PENDING' })
      toast.success('Período criado')
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao criar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent size="sm">
        <SheetHeader>
          <SheetTitle>Novo período</SheetTitle>
          <SheetDescription>Cria um período de faturamento mensal.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Mês</label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{MONTH_LABEL(i + 1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Ano</label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Data de pagamento (opcional)</label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={loading}>Criar período</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default BillingMonthManagement
