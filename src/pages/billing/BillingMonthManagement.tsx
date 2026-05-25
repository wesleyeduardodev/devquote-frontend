import * as React from 'react'
import {
  Plus, Pencil, Trash2, MoreHorizontal, DollarSign, Download, Link as LinkIcon, Link2Off,
  Eye, Mail, Paperclip, CheckCircle2, FileText, Clock, AlertCircle, XCircle, Monitor, Settings2,
  Search,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useAuth } from '@/hooks/useAuth'
import billingPeriodService from '@/services/billingPeriodService'
import { moduleService } from '@/services/moduleService'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui-v2/DropdownMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-v2/Select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui-v2/Sheet'
import { Input } from '@/components/ui-v2/Input'
import { BillingKpiHero, BillingKpiCard } from '@/components/billing/BillingKpiHero'

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

const MONTH_NAME = (m: number) =>
  format(new Date(2000, (m || 1) - 1, 1), 'MMMM', { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())

const MONTH_LABEL = (m: number) => `${m} - ${MONTH_NAME(m)}`

const TASK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'BUG', label: 'Bug' },
  { value: 'ENHANCEMENT', label: 'Melhoria' },
  { value: 'NEW_FEATURE', label: 'Nova funcionalidade' },
  { value: 'BACKUP', label: 'Backup' },
  { value: 'DEPLOY', label: 'Deploy' },
  { value: 'LOGS', label: 'Logs' },
  { value: 'NOVO_SERVIDOR', label: 'Novo servidor' },
  { value: 'MONITORING', label: 'Monitoramento' },
  { value: 'SUPPORT', label: 'Suporte' },
  { value: 'CODE_REVIEW', label: 'Code Review' },
]

interface ModuleOption { id: number; name: string }

interface StatusMeta {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  pill: string
}

const STATUS_META: Record<string, StatusMeta> = {
  PENDENTE:  { label: 'Pendente',  Icon: Clock,        tone: 'warning', pill: 'bg-warning-soft text-[var(--warning-strong)] border-warning-border' },
  FATURADO:  { label: 'Faturado',  Icon: FileText,     tone: 'info',    pill: 'bg-info-soft text-[var(--info-strong)] border-info-border' },
  PAGO:      { label: 'Pago',      Icon: CheckCircle2, tone: 'success', pill: 'bg-success-soft text-[var(--success-strong)] border-success-border' },
  ATRASADO:  { label: 'Atrasado',  Icon: AlertCircle,  tone: 'danger',  pill: 'bg-danger-soft text-[var(--danger-strong)] border-danger-border' },
  CANCELADO: { label: 'Cancelado', Icon: XCircle,      tone: 'neutral', pill: 'bg-surface-2 text-text-secondary border-border-subtle' },
}

const STATUS_ORDER = ['PENDENTE', 'FATURADO', 'PAGO', 'ATRASADO', 'CANCELADO']

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status]
  const Icon = meta?.Icon
  const cls = meta?.pill || 'bg-surface-2 text-text-secondary border-border-subtle'
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold border ${cls}`}>
      {Icon && <Icon className="size-3.5" />}
      {meta?.label || status}
    </span>
  )
}

const BillingMonthManagement: React.FC = () => {
  const { hasProfile } = useAuth() as any
  const isAdmin = hasProfile ? hasProfile('ADMIN') : true

  const [periods, setPeriods] = React.useState<BillingPeriod[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filters, setFilters] = React.useState<{ year?: number; month?: number; status?: string; flowType?: string; moduleId?: number; taskType?: string }>({})
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [availableYears, setAvailableYears] = React.useState<number[]>([])
  const [modules, setModules] = React.useState<ModuleOption[]>([])

  // Modal/sheet states
  const [periodSheet, setPeriodSheet] = React.useState<{ mode: 'create' } | { mode: 'edit'; period: BillingPeriod } | null>(null)
  const [linkTo, setLinkTo] = React.useState<BillingPeriod | null>(null)
  const [unlinkFrom, setUnlinkFrom] = React.useState<BillingPeriod | null>(null)
  const [viewTasksOf, setViewTasksOf] = React.useState<BillingPeriod | null>(null)
  const [attachmentsOf, setAttachmentsOf] = React.useState<BillingPeriod | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<{ ids: number[] } | null>(null)
  const [confirmEmail, setConfirmEmail] = React.useState<BillingPeriod | null>(null)
  const [emailLoadingId, setEmailLoadingId] = React.useState<number | null>(null)

  // Busca de tarefa por código -> período
  const [lookupCode, setLookupCode] = React.useState('')
  const [lookupLoading, setLookupLoading] = React.useState(false)
  const [lookupOpen, setLookupOpen] = React.useState(false)
  const [lookupResult, setLookupResult] = React.useState<{
    taskId: number; taskCode: string; taskTitle: string;
    billingPeriodId: number; month: number; year: number; status: string; paymentDate?: string;
  } | null>(null)
  const [lookupNotFound, setLookupNotFound] = React.useState<string | null>(null)

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

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [years, modulesData] = await Promise.all([
          billingPeriodService.getAvailableYears(),
          moduleService.getAll(),
        ])
        if (!alive) return
        setAvailableYears(Array.isArray(years) ? years : [])
        const list: ModuleOption[] = (modulesData?.content ?? modulesData ?? [])
          .map((m: any) => ({ id: m.id, name: m.name }))
          .sort((a: ModuleOption, b: ModuleOption) => a.name.localeCompare(b.name, 'pt-BR'))
        setModules(list)
      } catch {
        // Silencioso — filtros caem em fallback (anos vazios usam o atual; módulos some)
      }
    })()
    return () => { alive = false }
  }, [])

  // KPIs — soma por status (valores PT-BR do backend)
  const kpis = React.useMemo(() => {
    const sumBy = (status: string) =>
      periods.filter((p) => p.status === status).reduce((s, p) => s + (p.totalAmount || 0), 0)
    const countBy = (status: string) => periods.filter((p) => p.status === status).length
    return {
      total: periods.reduce((s, p) => s + (p.totalAmount || 0), 0),
      paid:      sumBy('PAGO'),      paidCount:      countBy('PAGO'),
      pending:   sumBy('PENDENTE'),  pendingCount:   countBy('PENDENTE'),
      overdue:   sumBy('ATRASADO'),  overdueCount:   countBy('ATRASADO'),
      cancelled: sumBy('CANCELADO'), cancelledCount: countBy('CANCELADO'),
      count: periods.length,
    }
  }, [periods])

  const handleMarkPaid = async (p: BillingPeriod) => {
    try {
      await billingPeriodService.updateStatus(p.id, 'PAGO')
      toast.success('Marcado como pago')
      await fetchPeriods()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar')
    }
  }

  const handleSendEmail = async (p: BillingPeriod) => {
    setEmailLoadingId(p.id)
    try {
      await billingPeriodService.sendBillingEmail(p.id, [], filters.flowType)
      toast.success('E-mail de faturamento enviado')
      await fetchPeriods()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao enviar e-mail')
    } finally {
      setEmailLoadingId(null)
      setConfirmEmail(null)
    }
  }

  const handleLookupByCode = async () => {
    const code = lookupCode.trim()
    if (!code) {
      toast.error('Informe o código da tarefa')
      return
    }
    setLookupLoading(true)
    setLookupResult(null)
    setLookupNotFound(null)
    try {
      const found = await billingPeriodService.findByTaskCode(code)
      if (found) {
        setLookupResult(found)
      } else {
        setLookupNotFound(code)
      }
      setLookupOpen(true)
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao buscar período da tarefa')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleDelete = async (ids: number[]) => {
    try {
      if (ids.length === 1) {
        await (billingPeriodService as any).deleteWithAllLinkedTasks(ids[0])
      } else {
        await billingPeriodService.deleteBulk(ids)
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
      id: 'period', header: 'Período', size: 200, enableSorting: false,
      cell: ({ row }) => (
        <span className="text-text-primary font-medium">
          {MONTH_LABEL(row.original.month)} {row.original.year}
        </span>
      ),
    },
    {
      id: 'status', accessorKey: 'status', header: 'Status', size: 150, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusPill status={row.original.status} />
        </div>
      ),
    },
    {
      id: 'taskCount', accessorKey: 'taskCount', header: 'Tarefas', size: 90, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="text-text-secondary tabular-nums">{row.original.taskCount ?? 0}</span>,
    },
    {
      id: 'totalAmount', accessorKey: 'totalAmount', header: () => <span className="block text-right">Valor</span>, size: 130, enableSorting: false,
      cell: ({ row }) => <span className="block text-right tabular-nums text-text-primary font-medium">{brl(row.original.totalAmount)}</span>,
    },
    {
      id: 'paymentDate', accessorKey: 'paymentDate', header: 'Pagamento', size: 120, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        if (!row.original.paymentDate) return <span className="text-text-tertiary">—</span>
        const date = new Date(row.original.paymentDate)
        if (isNaN(date.getTime())) return <span className="text-text-tertiary">—</span>
        const isPast = date.getTime() < Date.now() && row.original.status !== 'PAGO' && row.original.status !== 'CANCELADO'
        return (
          <span className={isPast ? 'text-[var(--danger-strong)] tabular-nums' : 'text-text-secondary tabular-nums'}>
            {format(date, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        )
      },
    },
    {
      id: '__actions', header: 'Ações', size: 280, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button size="icon-sm" variant="ghost" onClick={() => setViewTasksOf(p)} title="Ver tarefas"><Eye /></Button>
            {isAdmin && (
              <Button size="icon-sm" variant="ghost" onClick={() => setLinkTo(p)} title="Vincular tarefas" className="text-[var(--info-strong)]"><LinkIcon /></Button>
            )}
            {isAdmin && (
              <Button size="icon-sm" variant="ghost" onClick={() => setUnlinkFrom(p)} title="Desvincular tarefas" className="text-text-secondary hover:text-[var(--danger-strong)]"><Link2Off /></Button>
            )}
            {isAdmin && (
              <Button
                size="icon-sm" variant="ghost"
                onClick={() => setConfirmEmail(p)}
                loading={emailLoadingId === p.id}
                disabled={emailLoadingId === p.id}
                title="Enviar e-mail de faturamento"
              >
                <Mail />
              </Button>
            )}
            {isAdmin && (
              <Button size="icon-sm" variant="ghost" onClick={() => setPeriodSheet({ mode: 'edit', period: p })} title="Editar"><Pencil /></Button>
            )}
            {isAdmin && (
              <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ ids: [p.id] })} title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
            )}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost" title="Mais ações"><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setAttachmentsOf(p)}><Paperclip />Anexos</DropdownMenuItem>
                  {p.status !== 'PAGO' && (
                    <DropdownMenuItem onSelect={() => handleMarkPaid(p)}><CheckCircle2 />Marcar como pago</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      },
    },
  ], [isAdmin, emailLoadingId])

  const chips: any[] = []
  if (filters.flowType) chips.push({ key: 'flow',   label: 'Fluxo',  value: filters.flowType === 'DESENVOLVIMENTO' ? 'Desenvolvimento' : 'Operacional', onRemove: () => setFilters((f) => ({ ...f, flowType: undefined })) })
  if (filters.year)     chips.push({ key: 'year',   label: 'Ano',    value: String(filters.year),                                                     onRemove: () => setFilters((f) => ({ ...f, year: undefined })) })
  if (filters.month)    chips.push({ key: 'month',  label: 'Mês',    value: MONTH_LABEL(filters.month),                                               onRemove: () => setFilters((f) => ({ ...f, month: undefined })) })
  if (filters.status)   chips.push({ key: 'status', label: 'Status', value: STATUS_META[filters.status]?.label || filters.status,                    onRemove: () => setFilters((f) => ({ ...f, status: undefined })) })
  if (filters.moduleId) chips.push({ key: 'module', label: 'Módulo', value: modules.find((m) => m.id === filters.moduleId)?.name || `#${filters.moduleId}`, onRemove: () => setFilters((f) => ({ ...f, moduleId: undefined })) })
  if (filters.taskType) chips.push({ key: 'taskType', label: 'Tipo', value: TASK_TYPE_OPTIONS.find((o) => o.value === filters.taskType)?.label || filters.taskType, onRemove: () => setFilters((f) => ({ ...f, taskType: undefined })) })

  const setFilter = (key: string, value: any) => setFilters((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento"
        subtitle={`${kpis.count} período${kpis.count === 1 ? '' : 's'}`}
        filters={
          <>
            <Select value={filters.flowType || '__all'} onValueChange={(v) => setFilter('flowType', v === '__all' ? undefined : v)}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Fluxo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os fluxos</SelectItem>
                <SelectItem value="DESENVOLVIMENTO">
                  <span className="inline-flex items-center gap-1.5"><Monitor className="size-3.5 text-[var(--info-strong)]" />Desenvolvimento</span>
                </SelectItem>
                <SelectItem value="OPERACIONAL">
                  <span className="inline-flex items-center gap-1.5"><Settings2 className="size-3.5 text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]" />Operacional</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(filters.year || '__all')} onValueChange={(v) => setFilter('year', v === '__all' ? undefined : Number(v))}>
              <SelectTrigger className="w-[120px] h-8"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos anos</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(filters.month || '__all')} onValueChange={(v) => setFilter('month', v === '__all' ? undefined : Number(v))}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos meses</SelectItem>
                {Array.from({ length: 12 }).map((_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{MONTH_LABEL(i + 1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status || '__all'} onValueChange={(v) => setFilter('status', v === '__all' ? undefined : v)}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos status</SelectItem>
                {STATUS_ORDER.map((s) => {
                  const meta = STATUS_META[s]
                  const Icon = meta.Icon
                  return (
                    <SelectItem key={s} value={s}>
                      <span className="inline-flex items-center gap-1.5"><Icon className="size-3.5" />{meta.label}</span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={String(filters.moduleId || '__all')} onValueChange={(v) => setFilter('moduleId', v === '__all' ? undefined : Number(v))}>
              <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Módulo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos módulos</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.taskType || '__all'} onValueChange={(v) => setFilter('taskType', v === '__all' ? undefined : v)}>
              <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos tipos</SelectItem>
                {TASK_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <>
            <Button variant="secondary" leadingIcon={<Download />} onClick={async () => {
              try {
                const blob = await billingPeriodService.exportToExcel(filters)
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `faturamento-${new Date().toISOString().slice(0, 10)}.xlsx`
                a.click()
                URL.revokeObjectURL(url)
              } catch { toast.error('Falha ao exportar') }
            }}>Exportar</Button>
            {isAdmin && <Button leadingIcon={<Plus />} onClick={() => setPeriodSheet({ mode: 'create' })}>Novo período</Button>}
          </>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <BillingKpiHero total={kpis.total} />
        </div>
        <BillingKpiCard label="Pago"      value={brl(kpis.paid)}      tone="success" hint={`${kpis.paidCount} período(s)`} />
        <BillingKpiCard label="Pendente"  value={brl(kpis.pending)}   tone="warning" hint={`${kpis.pendingCount} período(s)`} />
        <BillingKpiCard label="Atrasado"  value={brl(kpis.overdue)}   tone="danger"  hint={kpis.overdueCount === 0 ? 'Em dia ✓' : `${kpis.overdueCount} atrasado(s)`} />
        <BillingKpiCard label="Cancelado" value={brl(kpis.cancelled)} tone="neutral" hint={`${kpis.cancelledCount} cancelado(s)`} />
      </section>

      {/* Busca rápida: em qual período está uma tarefa? */}
      <section className="rounded-lg border border-border-subtle bg-surface-1 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Buscar tarefa por código
            </label>
            <p className="text-xs text-text-tertiary">
              Informe o código da tarefa para ver em qual período de faturamento ela está vinculada.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:w-auto w-full">
            <Input
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="Código da tarefa"
              leadingIcon={<Search />}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLookupByCode() }}
              className="sm:w-64"
            />
            <Button onClick={handleLookupByCode} loading={lookupLoading} leadingIcon={<Search />}>
              Buscar
            </Button>
          </div>
        </div>
      </section>

      <div>
        <FilterChipsRow chips={chips} onClearAll={() => setFilters({})} />

        <DataTableBulkBar
          selectedCount={selectedIds.length}
          onClear={() => setSelection({})}
          actions={isAdmin && (
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
            onRowClick={(r) => setViewTasksOf(r)}
            empty={
              <EmptyState
                icon={<DollarSign />}
                title="Nenhum período"
                description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro período de faturamento.'}
                actions={isAdmin && <Button leadingIcon={<Plus />} onClick={() => setPeriodSheet({ mode: 'create' })}>Novo período</Button>}
              />
            }
          />
        </div>

        {/* Mobile */}
        <div className="lg:hidden space-y-2">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          {!loading && periods.length === 0 && (
            <EmptyState icon={<DollarSign />} title="Nenhum período" description="Crie o primeiro." actions={isAdmin && <Button leadingIcon={<Plus />} onClick={() => setPeriodSheet({ mode: 'create' })}>Novo</Button>} />
          )}
          {!loading && periods.map((p) => (
            <div key={p.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
              <button onClick={() => setViewTasksOf(p)} className="w-full text-left">
                <div className="mb-1.5">
                  <span className="font-medium text-text-primary">{MONTH_LABEL(p.month)} {p.year}</span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <StatusPill status={p.status} />
                  <span className="text-sm font-medium tabular-nums">{brl(p.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>{p.taskCount ?? 0} tarefa(s)</span>
                  {p.paymentDate && <span>vence {format(new Date(p.paymentDate), 'dd/MM/yyyy')}</span>}
                </div>
              </button>
              <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
                <Button size="icon-sm" variant="ghost" onClick={() => setViewTasksOf(p)} title="Ver tarefas"><Eye /></Button>
                {isAdmin && <Button size="icon-sm" variant="ghost" onClick={() => setLinkTo(p)} title="Vincular" className="text-[var(--info-strong)]"><LinkIcon /></Button>}
                {isAdmin && <Button size="icon-sm" variant="ghost" onClick={() => setUnlinkFrom(p)} title="Desvincular"><Link2Off /></Button>}
                {isAdmin && <Button size="icon-sm" variant="ghost" onClick={() => setConfirmEmail(p)} title="E-mail"><Mail /></Button>}
                {isAdmin && <Button size="icon-sm" variant="ghost" onClick={() => setPeriodSheet({ mode: 'edit', period: p })} title="Editar"><Pencil /></Button>}
                {isAdmin && <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ ids: [p.id] })} title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon-sm" variant="ghost" title="Mais"><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setAttachmentsOf(p)}><Paperclip />Anexos</DropdownMenuItem>
                      {p.status !== 'PAGO' && (
                        <DropdownMenuItem onSelect={() => handleMarkPaid(p)}><CheckCircle2 />Marcar como pago</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
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
        moduleId={filters.moduleId}
        taskType={filters.taskType}
      />
      <ViewTasksModal
        isOpen={!!viewTasksOf}
        onClose={() => setViewTasksOf(null)}
        billingPeriod={viewTasksOf as any}
        flowType={filters.flowType}
        moduleId={filters.moduleId}
        taskType={filters.taskType}
      />
      {attachmentsOf && (
        <BillingPeriodAttachmentModal
          isOpen={true}
          onClose={() => setAttachmentsOf(null)}
          billingPeriodId={attachmentsOf.id}
          billingPeriodTitle={`${MONTH_LABEL(attachmentsOf.month)} ${attachmentsOf.year}`}
          isAdmin={isAdmin}
        />
      )}

      {/* Create/Edit sheet */}
      <PeriodSheet
        state={periodSheet}
        onClose={() => setPeriodSheet(null)}
        onSaved={fetchPeriods}
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

      {/* Resultado da busca por código */}
      <Dialog open={lookupOpen} onOpenChange={(o) => { if (!o) { setLookupOpen(false); setLookupResult(null); setLookupNotFound(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lookupResult ? 'Tarefa encontrada' : 'Tarefa não vinculada'}
            </DialogTitle>
            <DialogDescription>
              {lookupResult
                ? 'Esta tarefa está vinculada ao período abaixo.'
                : `Nenhum período de faturamento contém a tarefa "${lookupNotFound}". A tarefa pode não existir ou ainda não foi vinculada.`}
            </DialogDescription>
          </DialogHeader>

          {lookupResult && (
            <div className="space-y-3 py-2">
              <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
                <div className="text-xs text-text-tertiary mb-1">Tarefa</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-text-primary truncate">{lookupResult.taskTitle}</span>
                  <span className="font-mono text-xs text-text-secondary shrink-0">{lookupResult.taskCode}</span>
                </div>
                <div className="text-xs text-text-tertiary mt-1">#{lookupResult.taskId}</div>
              </div>

              <div className="rounded-md border border-border-subtle bg-surface-2 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Período</span>
                  <span className="text-sm font-medium text-text-primary">
                    {MONTH_LABEL(lookupResult.month)} {lookupResult.year}
                    <span className="text-xs text-text-tertiary ml-2">#{lookupResult.billingPeriodId}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Status</span>
                  <StatusPill status={lookupResult.status} />
                </div>
                {lookupResult.paymentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">Pagamento</span>
                    <span className="text-sm text-text-secondary tabular-nums">
                      {format(new Date(lookupResult.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {lookupResult && (
              <Button
                variant="secondary"
                leadingIcon={<Eye />}
                onClick={() => {
                  const period = periods.find((p) => p.id === lookupResult.billingPeriodId)
                  if (period) {
                    setViewTasksOf(period)
                  } else {
                    setViewTasksOf({
                      id: lookupResult.billingPeriodId,
                      month: lookupResult.month,
                      year: lookupResult.year,
                      status: lookupResult.status,
                      paymentDate: lookupResult.paymentDate,
                    } as BillingPeriod)
                  }
                  setLookupOpen(false)
                }}
              >
                Ver tarefas do período
              </Button>
            )}
            <Button onClick={() => { setLookupOpen(false); setLookupResult(null); setLookupNotFound(null) }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm email */}
      <Dialog open={!!confirmEmail} onOpenChange={(o) => { if (!o) setConfirmEmail(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar e-mail de faturamento?</DialogTitle>
            <DialogDescription>
              {confirmEmail && `Será enviado o e-mail do período ${MONTH_LABEL(confirmEmail.month)} ${confirmEmail.year} para os destinatários configurados.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmEmail(null)}>Cancelar</Button>
            <Button
              onClick={() => confirmEmail && handleSendEmail(confirmEmail)}
              loading={emailLoadingId !== null}
              leadingIcon={<Mail />}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Create/Edit sheet ===================== */
type PeriodSheetState = { mode: 'create' } | { mode: 'edit'; period: BillingPeriod } | null

const PeriodSheet: React.FC<{ state: PeriodSheetState; onClose: () => void; onSaved: () => void }> = ({ state, onClose, onSaved }) => {
  const isEdit = state?.mode === 'edit'
  const editPeriod = state?.mode === 'edit' ? state.period : null
  const now = new Date()

  const [month, setMonth] = React.useState(now.getMonth() + 1)
  const [year, setYear] = React.useState(now.getFullYear())
  const [paymentDate, setPaymentDate] = React.useState('')
  const [status, setStatus] = React.useState('PENDENTE')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!state) return
    if (state.mode === 'edit') {
      setMonth(state.period.month)
      setYear(state.period.year)
      setPaymentDate(state.period.paymentDate ? state.period.paymentDate.slice(0, 10) : '')
      setStatus(state.period.status || 'PENDENTE')
    } else {
      setMonth(now.getMonth() + 1)
      setYear(now.getFullYear())
      setPaymentDate('')
      setStatus('PENDENTE')
    }
  }, [state])

  const submit = async () => {
    try {
      setLoading(true)
      const payload = { month, year, paymentDate: paymentDate || undefined, status }
      if (isEdit && editPeriod) {
        await billingPeriodService.update(editPeriod.id, payload)
        toast.success('Período atualizado')
      } else {
        await billingPeriodService.create(payload)
        toast.success('Período criado')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={!!state} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent size="sm">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar período' : 'Novo período'}</SheetTitle>
          <SheetDescription>{isEdit ? 'Atualize os dados do período de faturamento.' : 'Cria um período de faturamento mensal.'}</SheetDescription>
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
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => {
                    const meta = STATUS_META[s]
                    const Icon = meta.Icon
                    return (
                      <SelectItem key={s} value={s}>
                        <span className="inline-flex items-center gap-1.5"><Icon className="size-3.5" />{meta.label}</span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={loading}>{isEdit ? 'Salvar alterações' : 'Criar período'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default BillingMonthManagement
