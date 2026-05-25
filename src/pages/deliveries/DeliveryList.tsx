import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, MoreHorizontal, Truck, Eye, Download, RefreshCw,
  Filter, Search, Lock, Settings2, RotateCcw, Monitor, BarChart3, FileSpreadsheet, GitPullRequest,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import { useDeliveries } from '@/hooks/useDeliveries'
import { useAuth } from '@/hooks/useAuth'
import { gitSyncService } from '@/services/gitSyncService'
import { reportService } from '@/services/reportService'
import { moduleService } from '@/services/moduleService'
import { serverService } from '@/services/serverService'
import { deliveryService } from '@/services/deliveryService'
import { Combobox } from '@/components/ui-v2/Combobox'
import { PdfIcon } from '@/components/ui-v2/icons/PdfIcon'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { Input } from '@/components/ui-v2/Input'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui-v2/DropdownMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui-v2/Select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription } from '@/components/ui-v2/Sheet'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui-v2/Popover'
import { STATUS_LABEL } from '@/components/deliveries/DeliveryStatusBadge'
import { FlowChip, FLOW_LABEL } from '@/components/tasks/FlowChip'
import { TaskTypeLabel, TASK_TYPE_META } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel, ENV_META } from '@/components/deliveries/EnvLabel'
import { DeliveryQuickViewModal } from '@/components/deliveries/DeliveryQuickViewModal'

interface Delivery {
  id: number
  taskId: number
  taskName?: string
  taskCode?: string
  taskType?: string
  taskLink?: string
  taskValue?: number
  flowType?: string
  environment?: string
  status: string
  startedAt?: string
  finishedAt?: string
  totalItems?: number
  pendingCount?: number
  developmentCount?: number
  deliveredCount?: number
  homologationCount?: number
  approvedCount?: number
  rejectedCount?: number
  productionCount?: number
  createdAt?: string
  updatedAt?: string
}

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDateBR = (s?: string) => {
  if (!s) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  return s
}

const fmtDateTimeBR = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Formato compacto pras colunas estreitas da lista: 16/05/26 19:05
const fmtDateTimeCompact = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

const COLUMN_VISIBILITY_KEY = 'devquote.deliveries.columns.v2'

const COLUMN_DEFS: Array<{ id: string; label: string; defaultVisible: boolean; locked?: boolean }> = [
  { id: 'id',         label: 'ID',          defaultVisible: false },
  { id: 'taskId',     label: 'Tarefa ID',   defaultVisible: false },
  { id: 'taskCode',   label: 'Código',      defaultVisible: true },
  { id: 'flowType',   label: 'Fluxo',       defaultVisible: true },
  { id: 'taskType',   label: 'Tipo',        defaultVisible: true },
  { id: 'taskName',   label: 'Tarefa',      defaultVisible: true, locked: true },
  { id: 'taskValue',  label: 'Valor',       defaultVisible: true },
  { id: 'status',     label: 'Status',      defaultVisible: true },
  { id: 'startedAt',  label: 'Início',      defaultVisible: true },
  { id: 'finishedAt', label: 'Fim',         defaultVisible: true },
  { id: 'environment',label: 'Ambiente',    defaultVisible: false },
  { id: 'moduleName', label: 'Módulo',      defaultVisible: false },
  { id: 'serverName', label: 'Servidor',    defaultVisible: false },
  { id: 'createdAt',  label: 'Criada em',   defaultVisible: false },
  { id: 'updatedAt',  label: 'Atualizada em', defaultVisible: false },
]

const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = COLUMN_DEFS.reduce((acc, c) => {
  acc[c.id] = c.defaultVisible
  return acc
}, {} as Record<string, boolean>)

const TASK_TYPE_OPTIONS = [
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
  { value: 'DATABASE_APPLICATION', label: 'Aplicação BD' },
]

const ENV_OPTIONS = [
  { value: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { value: 'HOMOLOGACAO',     label: 'Homologação' },
  { value: 'PRODUCAO',        label: 'Produção' },
]

const STATUS_OPTIONS = [
  { value: 'PENDING' },
  { value: 'DEVELOPMENT' },
  { value: 'DELIVERED' },
  { value: 'HOMOLOGATION' },
  { value: 'APPROVED' },
  { value: 'REJECTED' },
  { value: 'PRODUCTION' },
  { value: 'CANCELLED' },
]

const STATUS_PILL: Record<string, string> = {
  PENDING:      'bg-warning-soft text-[var(--warning-strong)] border-warning-border',
  DEVELOPMENT:  'bg-info-soft text-[var(--info-strong)] border-info-border',
  DELIVERED:    'bg-success-soft text-[var(--success-strong)] border-success-border',
  HOMOLOGATION: 'bg-warning-soft text-[var(--warning-strong)] border-warning-border',
  APPROVED:     'bg-success-soft text-[var(--success-strong)] border-success-border',
  REJECTED:     'bg-danger-soft text-[var(--danger-strong)] border-danger-border',
  PRODUCTION:   'bg-[rgba(139,92,246,0.10)] text-[rgb(124,58,237)] border-[rgba(139,92,246,0.30)] dark:text-[rgb(196,181,253)]',
  CANCELLED:    'bg-surface-2 text-text-tertiary border-border-subtle',
}

const STATUS_STAT_KEY: Record<string, string> = {
  PENDING:      'totalPending',
  DEVELOPMENT:  'totalDevelopment',
  DELIVERED:    'totalDelivered',
  HOMOLOGATION: 'totalHomologation',
  APPROVED:     'totalApproved',
  REJECTED:     'totalRejected',
  PRODUCTION:   'totalProduction',
  CANCELLED:    'totalCancelled',
}

const STATUS_DOT: Record<string, string> = {
  PENDING:      'bg-[var(--warning-strong)]',
  DEVELOPMENT:  'bg-[var(--info-strong)]',
  DELIVERED:    'bg-[var(--success-strong)]',
  HOMOLOGATION: 'bg-[var(--warning-strong)]',
  APPROVED:     'bg-[var(--success-strong)]',
  REJECTED:     'bg-[var(--danger-strong)]',
  PRODUCTION:   'bg-[rgb(124,58,237)]',
  CANCELLED:    'bg-text-tertiary',
}

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return <span className="text-text-tertiary">—</span>
  const cls = STATUS_PILL[status] || 'bg-surface-2 text-text-secondary border-border-subtle'
  return (
    <span className={`inline-flex items-center justify-center h-6 px-2.5 rounded-full text-xs font-semibold border ${cls}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

const DeliveryList: React.FC = () => {
  const navigate = useNavigate()
  const { hasAnyProfile, hasProfile } = useAuth() as any
  const isAdmin = hasProfile ? hasProfile('ADMIN') : true
  const {
    deliveries, pagination, loading, error, filters, sorting, stats, totalAmount,
    deleteBulk,
    setPage, setPageSize, setFilter, clearFilters, setSorting,
    exportToExcel, exportDeliveriesOnlyToExcel,
  } = useDeliveries({ size: 100 })

  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'one' | 'bulk'; ids: number[] } | null>(null)
  const [syncing, setSyncing] = React.useState(false)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [pdfLoadingId, setPdfLoadingId] = React.useState<number | null>(null)
  const [syncPrLoadingId, setSyncPrLoadingId] = React.useState<number | null>(null)
  const [quickViewId, setQuickViewId] = React.useState<number | null>(null)
  const [generatingReport, setGeneratingReport] = React.useState(false)
  const [modules, setModules] = React.useState<{ id: number; name: string }[]>([])
  const [servers, setServers] = React.useState<{ id: number; name: string }[]>([])

  React.useEffect(() => {
    moduleService.getAll().then((r: any) => setModules((r?.content ?? r ?? []).map((m: any) => ({ id: m.id, name: m.name })))).catch(() => {})
    serverService.getAll().then((r: any) => setServers((r?.content ?? r ?? []).map((s: any) => ({ id: s.id, name: s.name })))).catch(() => {})
  }, [])

  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLUMN_VISIBILITY
    try {
      const saved = window.localStorage.getItem(COLUMN_VISIBILITY_KEY)
      if (saved) return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_COLUMN_VISIBILITY
  })
  React.useEffect(() => {
    try { window.localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility)) } catch {}
  }, [columnVisibility])

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const canCRUD = hasAnyProfile ? hasAnyProfile(['ADMIN', 'MANAGER']) : true
  const canViewValues = canCRUD

  const handleSync = async () => {
    try {
      setSyncing(true)
      const result = await gitSyncService.syncMergedPullRequests()
      toast.success(result?.message || 'Sincronização concluída')
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateStatistics = React.useCallback(async () => {
    setGeneratingReport(true)
    try {
      const parseDate = (dateStr?: string): string | null => {
        if (!dateStr) return null
        if (dateStr.includes('T')) return dateStr
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return `${dateStr}T00:00:00`
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split('/')
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`
        }
        return null
      }
      const request = {
        dataInicio: parseDate(filters.startDate as string),
        dataFim: parseDate(filters.endDate as string),
        tipoTarefa: (filters.taskType as string) || null,
        ambiente: (filters.environment as string) || null,
      }
      const blob = await reportService.generateOperationalPdf(request as any)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      link.download = `estatisticas_operacionais_${ts}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Relatório de estatísticas gerado')
    } catch {
      toast.error('Erro ao gerar relatório de estatísticas')
    } finally {
      setGeneratingReport(false)
    }
  }, [filters])

  const handleGeneratePdf = React.useCallback(async (d: Delivery) => {
    setPdfLoadingId(d.id)
    try {
      const blob = await reportService.generateDeliveryPdf(d.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const now = new Date()
      const ts = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear(),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('-')
      link.download = `entrega-${d.id}-${d.taskCode || ''}-${ts}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('PDF gerado com sucesso')
    } catch {
      toast.error('Erro ao gerar PDF')
    } finally {
      setPdfLoadingId(null)
    }
  }, [])

  const handleSyncPullRequests = React.useCallback(async (d: Delivery) => {
    setSyncPrLoadingId(d.id)
    try {
      const result = await deliveryService.syncPullRequests(d.id)
      toast.success(result.message)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Falha ao sincronizar PRs no ClickUp')
    } finally {
      setSyncPrLoadingId(null)
    }
  }, [])

  // Adapter useDeliveries.sorting <-> TanStack
  const tanstackSorting = React.useMemo(
    () => (sorting || []).map((s: any) => ({ id: s.field, desc: s.direction === 'desc' })),
    [sorting]
  )
  const handleSortingChange = React.useCallback((next: any) => {
    if (!next || next.length === 0) return
    const first = next[0]
    setSorting(first.id, first.desc ? 'desc' : 'asc')
  }, [setSorting])

  const allColumns = React.useMemo<ColumnDef<Delivery, any>[]>(() => [
    {
      id: 'id', accessorKey: 'id', header: 'ID', size: 70, meta: { align: 'center' },
      cell: ({ row }) => <span className="font-mono text-[11px] text-text-tertiary">#{row.original.id}</span>,
    },
    {
      id: 'taskId', accessorKey: 'taskId', header: 'Tarefa ID', size: 90, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="font-mono text-[11px] text-text-tertiary">#{row.original.taskId}</span>,
    },
    {
      id: 'taskCode', accessorKey: 'taskCode', header: 'Código', size: 130, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const link = row.original.taskLink
        if (link) {
          return (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs font-medium text-accent hover:underline tracking-tight truncate block"
              title={`Abrir link: ${link}`}
            >
              {row.original.taskCode}
            </a>
          )
        }
        return (
          <span className="font-mono text-xs font-medium text-text-primary tracking-tight truncate block">
            {row.original.taskCode}
          </span>
        )
      },
    },
    {
      id: 'flowType', accessorKey: 'flowType', header: 'Fluxo', size: 110, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <FlowChip value={row.original.flowType} />
        </div>
      ),
    },
    {
      id: 'taskType', accessorKey: 'taskType', header: 'Tipo', size: 160, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <TaskTypeLabel value={row.original.taskType} />
        </div>
      ),
    },
    {
      id: 'taskName', accessorKey: 'taskName', header: 'Tarefa', size: 540, enableSorting: false, meta: { wrap: true },
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0 py-1">
          <span className="text-text-primary font-medium leading-snug break-words">
            {row.original.taskName || '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'taskValue', accessorKey: 'taskValue', header: () => <span className="block text-right">Valor</span>, size: 110, enableSorting: false,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums text-text-primary">{brl(row.original.taskValue)}</span>
      ),
    },
    {
      id: 'status', accessorKey: 'status', header: 'Status', size: 130, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusPill status={row.original.status} />
        </div>
      ),
    },
    {
      id: 'startedAt', accessorKey: 'startedAt', header: 'Início', size: 115, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary tabular-nums">
          {row.original.startedAt ? fmtDateTimeCompact(row.original.startedAt) : <span className="text-text-tertiary">—</span>}
        </span>
      ),
    },
    {
      id: 'finishedAt', accessorKey: 'finishedAt', header: 'Fim', size: 115, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary tabular-nums">
          {row.original.finishedAt ? fmtDateTimeCompact(row.original.finishedAt) : <span className="text-text-tertiary">—</span>}
        </span>
      ),
    },
    {
      id: 'environment', accessorKey: 'environment', header: 'Ambiente', size: 160, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <EnvLabel value={row.original.environment} />
        </div>
      ),
    },
    {
      id: 'moduleName', accessorKey: 'moduleName', header: 'Módulo', size: 150, enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary truncate block">
          {(row.original as any).moduleName || <span className="text-text-tertiary">—</span>}
        </span>
      ),
    },
    {
      id: 'serverName', accessorKey: 'serverName', header: 'Servidor', size: 140, enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary truncate block">
          {(row.original as any).serverName || <span className="text-text-tertiary">—</span>}
        </span>
      ),
    },
    {
      id: 'createdAt', accessorKey: 'createdAt', header: 'Criada em', size: 130, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const d = row.original.createdAt
        if (!d) return <span className="text-text-tertiary">—</span>
        return <span className="text-xs text-text-secondary tabular-nums">{new Date(d).toLocaleDateString('pt-BR')}</span>
      },
    },
    {
      id: 'updatedAt', accessorKey: 'updatedAt', header: 'Atualizada em', size: 140, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const d = row.original.updatedAt
        if (!d) return <span className="text-text-tertiary">—</span>
        return <span className="text-xs text-text-secondary tabular-nums">{new Date(d).toLocaleDateString('pt-BR')}</span>
      },
    },
    {
      id: '__actions', header: '', size: 190, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setQuickViewId(row.original.id)}
            aria-label="Visualização rápida"
            title="Visualização rápida"
          >
            <Eye />
          </Button>
          {isAdmin && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => navigate(`/deliveries/${row.original.id}/edit`)}
              aria-label="Editar"
              title="Editar"
            >
              <Pencil />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => handleSyncPullRequests(row.original)}
            loading={syncPrLoadingId === row.original.id}
            disabled={syncPrLoadingId === row.original.id}
            aria-label="Atualizar Branch no ClickUp"
            title="Atualizar Branch no ClickUp (sincroniza PRs dos items)"
          >
            <GitPullRequest />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => handleGeneratePdf(row.original)}
            loading={pdfLoadingId === row.original.id}
            disabled={pdfLoadingId === row.original.id}
            aria-label="Exportar PDF da entrega"
            title="Exportar PDF da entrega"
            className="text-text-secondary hover:text-[var(--danger-strong)]"
          >
            <PdfIcon />
          </Button>
          {isAdmin && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setConfirmDelete({ kind: 'one', ids: [row.original.id] })}
              aria-label="Excluir"
              title="Excluir"
              className="text-text-secondary hover:text-[var(--danger-strong)]"
            >
              <Trash2 />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Mais ações" title="Mais ações">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate(`/deliveries/${row.original.id}`)}>
                <Eye />Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate(`/tasks/${row.original.taskId}`)}>
                <Eye />Ver tarefa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate, isAdmin, handleGeneratePdf, pdfLoadingId])

  /** Aplica visibilidade — Valor restrito a ADMIN+MANAGER. */
  const columns = React.useMemo(() => {
    const lookup = new Map(allColumns.map((c) => [c.id || (c as any).accessorKey, c]))
    const visibleIds = COLUMN_DEFS
      .filter((d) => columnVisibility[d.id])
      .filter((d) => canViewValues || d.id !== 'taskValue')
      .map((d) => d.id)
    const ordered = visibleIds.map((id) => lookup.get(id)).filter(Boolean) as ColumnDef<Delivery, any>[]
    const actionsCol = allColumns.find((c) => c.id === '__actions')
    return actionsCol ? [...ordered, actionsCol] : ordered
  }, [allColumns, columnVisibility, canViewValues])

  const chips: any[] = []
  if (filters.id !== undefined && filters.id !== '')               chips.push({ key: 'id',          label: 'ID',          value: String(filters.id),                                                                                            onRemove: () => setFilter('id', '') })
  if (filters.taskId !== undefined && filters.taskId !== '')       chips.push({ key: 'taskId',      label: 'Tarefa ID',   value: String(filters.taskId),                                                                                        onRemove: () => setFilter('taskId', '') })
  if (filters.taskCode)                                            chips.push({ key: 'taskCode',    label: 'Código',      value: String(filters.taskCode),                                                                                       onRemove: () => setFilter('taskCode', '') })
  if (filters.taskName)                                            chips.push({ key: 'taskName',    label: 'Título',      value: String(filters.taskName),                                                                                       onRemove: () => setFilter('taskName', '') })
  if (filters.flowType)                                            chips.push({ key: 'flowType',    label: 'Fluxo',       value: FLOW_LABEL[filters.flowType as string] || String(filters.flowType),                                            onRemove: () => setFilter('flowType', '') })
  if (filters.taskType)                                            chips.push({ key: 'taskType',    label: 'Tipo',        value: TASK_TYPE_OPTIONS.find(o => o.value === filters.taskType)?.label || String(filters.taskType),                  onRemove: () => setFilter('taskType', '') })
  if (filters.environment)                                         chips.push({ key: 'environment', label: 'Ambiente',    value: ENV_META[filters.environment as string]?.label || String(filters.environment),                                 onRemove: () => setFilter('environment', '') })
  if (filters.status)                                              chips.push({ key: 'status',      label: 'Status',      value: STATUS_LABEL[filters.status as string] || String(filters.status),                                              onRemove: () => setFilter('status', '') })
  if (filters.moduleId)                                            chips.push({ key: 'moduleId',    label: 'Módulo',      value: modules.find(m => String(m.id) === String(filters.moduleId))?.name || String(filters.moduleId),                onRemove: () => setFilter('moduleId', '') })
  if (filters.serverId)                                            chips.push({ key: 'serverId',    label: 'Servidor',    value: servers.find(s => String(s.id) === String(filters.serverId))?.name || String(filters.serverId),                onRemove: () => setFilter('serverId', '') })
  if (filters.startDate)                                           chips.push({ key: 'startDate',   label: 'Início ≥',    value: fmtDateBR(String(filters.startDate)),                                                                          onRemove: () => setFilter('startDate', '') })
  if (filters.endDate)                                             chips.push({ key: 'endDate',     label: 'Fim ≤',       value: fmtDateBR(String(filters.endDate)),                                                                            onRemove: () => setFilter('endDate', '') })
  if (filters.hasItems === 'false')                                chips.push({ key: 'hasItems',    label: 'Itens',       value: 'Sem itens',                                                                                                   onRemove: () => setFilter('hasItems', '') })

  const activeFilterCount = chips.length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Entregas"
        subtitle={pagination ? `${pagination.totalElements} entrega${pagination.totalElements === 1 ? '' : 's'}` : undefined}
        filters={
          <>
            <Button variant="secondary" leadingIcon={<Filter />} onClick={() => setFiltersOpen(true)}>
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-fg text-[10px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2 ml-1">
              <Select
                value={filters.hasItems === 'false' ? '__noitems' : ((filters.status as string) || '__all')}
                onValueChange={(v) => {
                  if (v === '__all') { setFilter('status', ''); setFilter('hasItems', '') }
                  else if (v === '__noitems') { setFilter('status', ''); setFilter('hasItems', 'false') }
                  else { setFilter('hasItems', ''); setFilter('status', v) }
                }}
              >
                <SelectTrigger className="h-8 w-[210px]"><SelectValue placeholder="Status: todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Status: todos</SelectItem>
                  {STATUS_OPTIONS.map((o) => {
                    const count = stats ? ((stats as any)[STATUS_STAT_KEY[o.value]] as number) : undefined
                    return (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`size-2 rounded-full ${STATUS_DOT[o.value]}`} />
                          {STATUS_LABEL[o.value]}
                          <span className="text-text-tertiary tabular-nums">· {count ?? 0}</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                  <SelectSeparator />
                  <SelectItem value="__noitems">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--danger-strong)]" />
                      Sem itens
                      <span className="text-text-tertiary tabular-nums">· {stats?.totalWithoutItems ?? 0}</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
        actions={
          <>
            <ColumnsMenu visibility={columnVisibility} onChange={setColumnVisibility} defs={canViewValues ? COLUMN_DEFS : COLUMN_DEFS.filter((d) => d.id !== 'taskValue')} />
            {isAdmin && (
              <Button variant="secondary" leadingIcon={<RefreshCw className={syncing ? 'animate-spin' : ''} />} onClick={handleSync} loading={syncing}>
                Sincronizar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" leadingIcon={<Download />} loading={generatingReport}>Relatórios</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportToExcel('DESENVOLVIMENTO', canViewValues).catch(() => {})}><FileSpreadsheet />Desenvolvimento (Excel)</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportToExcel('OPERACIONAL', canViewValues).catch(() => {})}><FileSpreadsheet />Operacional (Excel)</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportDeliveriesOnlyToExcel(canViewValues).catch(() => {})}><FileSpreadsheet />Entregas (Excel)</DropdownMenuItem>
                {canCRUD && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleGenerateStatistics()}><BarChart3 />Estatísticas (PDF)</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {isAdmin && <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova entrega</Button>}
          </>
        }
      />

      <FilterChipsRow chips={chips} onClearAll={() => clearFilters()} />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={isAdmin && (
          <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>
            Excluir
          </Button>
        )}
      />

      <div className="hidden lg:block">
        <DataTable<Delivery>
          data={deliveries as any[]}
          columns={columns}
          sorting={tanstackSorting}
          onSortingChange={handleSortingChange}
          columnFilters={{
            id: {
              type: 'number',
              value: filters.id !== undefined && filters.id !== '' ? String(filters.id) : '',
              onChange: (v) => setFilter('id', v),
              placeholder: '#',
            },
            taskId: {
              type: 'number',
              value: filters.taskId !== undefined && filters.taskId !== '' ? String(filters.taskId) : '',
              onChange: (v) => setFilter('taskId', v),
              placeholder: '#',
            },
            taskCode: {
              value: (filters.taskCode as string) || '',
              onChange: (v) => setFilter('taskCode', v),
              placeholder: 'Código...',
            },
            flowType: {
              value: (filters.flowType as string) || '',
              onChange: (v) => setFilter('flowType', v),
              render: () => (
                <Select value={(filters.flowType as string) || '__all'} onValueChange={(v) => setFilter('flowType', v === '__all' ? '' : v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    <SelectItem value="DESENVOLVIMENTO">
                      <span className="inline-flex items-center gap-1.5"><Monitor className="size-3.5 text-[var(--info-strong)]" />Desenvolvimento</span>
                    </SelectItem>
                    <SelectItem value="OPERACIONAL">
                      <span className="inline-flex items-center gap-1.5"><Settings2 className="size-3.5 text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]" />Operacional</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
            taskType: {
              value: (filters.taskType as string) || '',
              onChange: (v) => setFilter('taskType', v),
              render: () => (
                <Select value={(filters.taskType as string) || '__all'} onValueChange={(v) => setFilter('taskType', v === '__all' ? '' : v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    {TASK_TYPE_OPTIONS.map((o) => {
                      const meta = TASK_TYPE_META[o.value]
                      const Icon = meta?.Icon
                      return (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && <Icon className={`size-3.5 ${meta.iconClass}`} />}
                            {o.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ),
            },
            taskName: {
              value: (filters.taskName as string) || '',
              onChange: (v) => setFilter('taskName', v),
              placeholder: 'Buscar título...',
            },
            status: {
              value: (filters.status as string) || '',
              onChange: (v) => setFilter('status', v),
              render: () => (
                <Select value={(filters.status as string) || '__all'} onValueChange={(v) => setFilter('status', v === '__all' ? '' : v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`size-2 rounded-full ${STATUS_DOT[o.value]}`} />
                          {STATUS_LABEL[o.value]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            },
            startedAt: {
              type: 'date',
              value: (filters.startDate as string) || '',
              onChange: (v) => setFilter('startDate', v),
              placeholder: '',
            },
            finishedAt: {
              type: 'date',
              value: (filters.endDate as string) || '',
              onChange: (v) => setFilter('endDate', v),
              placeholder: '',
            },
            environment: {
              value: (filters.environment as string) || '',
              onChange: (v) => setFilter('environment', v),
              render: () => (
                <Select value={(filters.environment as string) || '__all'} onValueChange={(v) => setFilter('environment', v === '__all' ? '' : v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    {ENV_OPTIONS.map((o) => {
                      const meta = ENV_META[o.value]
                      const Icon = meta?.Icon
                      return (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && <Icon className={`size-3.5 ${meta.iconClass}`} />}
                            {o.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ),
            },
          }}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => navigate(`/deliveries/${r.id}`)}
          pagination={pagination ? {
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalElements,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          } : undefined}
          empty={
            chips.length > 0 ? (
              <EmptyState
                icon={<Filter />}
                title="Nenhuma entrega com esses filtros"
                description="Ajuste ou limpe os filtros para ver mais entregas."
                actions={
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => clearFilters()}>Limpar filtros</Button>
                    {canCRUD && (
                      <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova entrega</Button>
                    )}
                  </div>
                }
              />
            ) : (
              <EmptyState
                icon={<Truck />}
                title="Nenhuma entrega"
                description="Crie a primeira entrega para uma tarefa cadastrada."
                actions={canCRUD ? <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova entrega</Button> : undefined}
              />
            )
          }
          footer={(() => {
            const totalRows = pagination?.totalElements ?? deliveries.length
            const hasActiveFilters = chips.length > 0
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-text-secondary">
                  <span>
                    <span className="text-text-tertiary">{hasActiveFilters ? 'Entregas filtradas:' : 'Total de entregas:'}</span>{' '}
                    <span className="font-medium text-text-primary tabular-nums">{totalRows.toLocaleString('pt-BR')}</span>
                  </span>
                </div>
                {canViewValues && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-tertiary">{hasActiveFilters ? 'Soma filtrada:' : 'Soma total:'}</span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {totalAmount === null
                        ? <span className="inline-block w-20 h-4 rounded bg-surface-2 animate-pulse" aria-label="Carregando…" />
                        : brl(totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            )
          })()}
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {!loading && deliveries.length === 0 && (
          chips.length > 0 ? (
            <EmptyState
              icon={<Filter />}
              title="Nenhuma entrega com esses filtros"
              description="Ajuste ou limpe os filtros."
              actions={<Button variant="secondary" onClick={() => clearFilters()}>Limpar filtros</Button>}
            />
          ) : (
            <EmptyState
              icon={<Truck />}
              title="Nenhuma entrega"
              description="Crie a primeira."
              actions={isAdmin ? <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova</Button> : undefined}
            />
          )
        )}
        {!loading && deliveries.map((d: any) => (
          <div
            key={d.id}
            className="w-full rounded-lg border border-border-subtle bg-surface-1 p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-text-tertiary shrink-0">#{d.id}</span>
                {d.taskLink ? (
                  <a
                    href={d.taskLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-xs font-medium text-accent hover:underline truncate"
                    title={`Abrir link: ${d.taskLink}`}
                  >
                    {d.taskCode}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-text-secondary truncate">{d.taskCode}</span>
                )}
              </div>
              {canViewValues && <span className="text-sm font-medium tabular-nums shrink-0 text-text-primary">{brl(d.taskValue)}</span>}
            </div>
            <button onClick={() => navigate(`/deliveries/${d.id}`)} className="w-full text-left">
              <p className="text-sm text-text-primary mb-1.5 leading-snug break-words">{d.taskName}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {d.flowType && <FlowChip value={d.flowType} />}
                <StatusPill status={d.status} />
              </div>
              {(d.startedAt || d.finishedAt) && (
                <p className="text-xs text-text-tertiary mt-2">
                  {d.startedAt && <>Início: {fmtDateTimeBR(d.startedAt)}</>}
                  {d.startedAt && d.finishedAt && ' · '}
                  {d.finishedAt && <>Fim: {fmtDateTimeBR(d.finishedAt)}</>}
                </p>
              )}
            </button>

            <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
              <Button size="icon-sm" variant="ghost" onClick={() => setQuickViewId(d.id)} aria-label="Visualização rápida" title="Visualização rápida"><Eye /></Button>
              {isAdmin && (
                <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/deliveries/${d.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => handleGeneratePdf(d)}
                loading={pdfLoadingId === d.id}
                disabled={pdfLoadingId === d.id}
                aria-label="Exportar PDF da entrega"
                title="Exportar PDF da entrega"
                className="text-text-secondary hover:text-[var(--danger-strong)]"
              >
                <PdfIcon />
              </Button>
              {isAdmin && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete({ kind: 'one', ids: [d.id] })}
                  aria-label="Excluir"
                  title="Excluir"
                  className="text-text-secondary hover:text-[var(--danger-strong)]"
                >
                  <Trash2 />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label="Mais ações" title="Mais ações">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigate(`/deliveries/${d.id}`)}>
                    <Eye />Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate(`/tasks/${d.taskId}`)}>
                    <Eye />Ver tarefa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Refine sua busca por entregas.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-6">

            <FilterSection title="Identificação">
              <div className="grid grid-cols-2 gap-3">
                <FilterField label="ID da entrega">
                  <Input
                    placeholder="Ex: 12"
                    value={filters.id !== undefined && filters.id !== '' ? String(filters.id) : ''}
                    onChange={(e) => setFilter('id', e.target.value)}
                    inputMode="numeric"
                  />
                </FilterField>
                <FilterField label="ID da tarefa">
                  <Input
                    placeholder="Ex: 444"
                    value={filters.taskId !== undefined && filters.taskId !== '' ? String(filters.taskId) : ''}
                    onChange={(e) => setFilter('taskId', e.target.value)}
                    inputMode="numeric"
                  />
                </FilterField>
              </div>
              <FilterField label="Código da tarefa">
                <Input
                  placeholder="Ex: N6E2U2"
                  value={(filters.taskCode as string) || ''}
                  onChange={(e) => setFilter('taskCode', e.target.value)}
                />
              </FilterField>
            </FilterSection>

            <FilterSection title="Conteúdo">
              <FilterField label="Título da tarefa">
                <Input
                  leadingIcon={<Search />}
                  placeholder="Buscar por título..."
                  value={(filters.taskName as string) || ''}
                  onChange={(e) => setFilter('taskName', e.target.value)}
                />
              </FilterField>
            </FilterSection>

            <FilterSection title="Classificação">
              <FilterField label="Fluxo">
                <Select value={(filters.flowType as string) || '__all'} onValueChange={(v) => setFilter('flowType', v === '__all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os fluxos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os fluxos</SelectItem>
                    <SelectItem value="DESENVOLVIMENTO">
                      <span className="inline-flex items-center gap-1.5">
                        <Monitor className="size-3.5 text-[var(--info-strong)]" />Desenvolvimento
                      </span>
                    </SelectItem>
                    <SelectItem value="OPERACIONAL">
                      <span className="inline-flex items-center gap-1.5">
                        <Settings2 className="size-3.5 text-[rgb(124,58,237)] dark:text-[rgb(196,181,253)]" />Operacional
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Tipo">
                <Select value={(filters.taskType as string) || '__all'} onValueChange={(v) => setFilter('taskType', v === '__all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os tipos</SelectItem>
                    {TASK_TYPE_OPTIONS.map((o) => {
                      const meta = TASK_TYPE_META[o.value]
                      const Icon = meta?.Icon
                      return (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && <Icon className={`size-3.5 ${meta.iconClass}`} />}
                            {o.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Ambiente">
                <Select value={(filters.environment as string) || '__all'} onValueChange={(v) => setFilter('environment', v === '__all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os ambientes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os ambientes</SelectItem>
                    {ENV_OPTIONS.map((o) => {
                      const meta = ENV_META[o.value]
                      const Icon = meta?.Icon
                      return (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && <Icon className={`size-3.5 ${meta.iconClass}`} />}
                            {o.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Status">
                <Select value={(filters.status as string) || '__all'} onValueChange={(v) => setFilter('status', v === '__all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os status</SelectItem>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`size-2 rounded-full ${STATUS_DOT[o.value]}`} />
                          {STATUS_LABEL[o.value]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Módulo">
                <Combobox
                  value={(filters.moduleId as string) || ''}
                  onChange={(v) => setFilter('moduleId', v)}
                  placeholder="Todos os módulos"
                  searchPlaceholder="Buscar módulo…"
                  options={[{ value: '', label: 'Todos os módulos' }, ...modules.map((m) => ({ value: String(m.id), label: m.name }))]}
                />
              </FilterField>
              <FilterField label="Servidor">
                <Combobox
                  value={(filters.serverId as string) || ''}
                  onChange={(v) => setFilter('serverId', v)}
                  placeholder="Todos os servidores"
                  searchPlaceholder="Buscar servidor…"
                  options={[{ value: '', label: 'Todos os servidores' }, ...servers.map((s) => ({ value: String(s.id), label: s.name }))]}
                />
              </FilterField>
            </FilterSection>

            <FilterSection title="Datas">
              <div className="grid grid-cols-2 gap-3">
                <FilterField label="Início ≥">
                  <Input
                    type="date"
                    value={(filters.startDate as string) || ''}
                    onChange={(e) => setFilter('startDate', e.target.value)}
                  />
                </FilterField>
                <FilterField label="Fim ≤">
                  <Input
                    type="date"
                    value={(filters.endDate as string) || ''}
                    onChange={(e) => setFilter('endDate', e.target.value)}
                  />
                </FilterField>
              </div>
            </FilterSection>

          </SheetBody>
          <SheetFooter>
            <Button variant="ghost" onClick={() => clearFilters()}>Limpar tudo</Button>
            <Button onClick={() => setFiltersOpen(false)}>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} entregas` : 'entrega'}?</DialogTitle>
            <DialogDescription>Itens e anexos serão removidos. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  await deleteBulk(confirmDelete.ids)
                  setSelection({})
                } finally {
                  setConfirmDelete(null)
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeliveryQuickViewModal
        open={quickViewId !== null}
        deliveryId={quickViewId}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  )
}

export default DeliveryList

interface ColumnsMenuProps {
  visibility: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
  defs?: typeof COLUMN_DEFS
}

const ColumnsMenu: React.FC<ColumnsMenuProps> = ({ visibility, onChange, defs = COLUMN_DEFS }) => {
  const setOne = (id: string, value: boolean) => onChange({ ...visibility, [id]: value })
  const showAll = () => onChange(defs.reduce((acc, c) => { acc[c.id] = true; return acc }, {} as Record<string, boolean>))
  const hideAll = () => onChange(defs.reduce((acc, c) => { acc[c.id] = !!c.locked; return acc }, {} as Record<string, boolean>))
  const resetDefault = () => onChange({ ...DEFAULT_COLUMN_VISIBILITY })
  const visibleCount = defs.filter((c) => visibility[c.id]).length
  const isDefault = defs.every((c) => !!visibility[c.id] === c.defaultVisible)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" leadingIcon={<Settings2 />}>
          Colunas
          <span className="ml-1 text-text-tertiary tabular-nums">{visibleCount}/{defs.length}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] p-0">
        <div className="px-3 py-2 border-b border-border-subtle">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Mostrar / ocultar colunas</p>
        </div>
        <ul className="max-h-[320px] overflow-y-auto py-1">
          {defs.map((c) => {
            const checked = !!visibility[c.id]
            return (
              <li key={c.id}>
                <label
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-surface-2 transition-colors ${c.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  title={c.locked ? 'Coluna obrigatória' : undefined}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={c.locked}
                    onChange={(e) => !c.locked && setOne(c.id, e.target.checked)}
                    className="size-4 rounded border-border-strong text-accent focus:ring-accent/30"
                  />
                  <span className={`flex-1 ${checked ? 'text-text-primary' : 'text-text-tertiary'}`}>{c.label}</span>
                  {c.locked && <Lock className="size-3 text-text-tertiary" />}
                </label>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border-subtle p-2 space-y-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-center"
            onClick={resetDefault}
            disabled={isDefault}
          >
            <RotateCcw className="size-3.5 mr-1" />
            Restaurar padrão
          </Button>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="flex-1" onClick={showAll}>Mostrar todas</Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={hideAll}>Ocultar todas</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2.5">{title}</h3>
    <div className="space-y-3">{children}</div>
  </section>
)

const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-text-secondary">{label}</label>
    {children}
  </div>
)
