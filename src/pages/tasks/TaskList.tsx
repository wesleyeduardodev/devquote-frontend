import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, ListChecks, Mail, Eye, Send,
  Download, Search, Filter, Check, X, Settings2, Lock, MoreHorizontal, RotateCcw
} from 'lucide-react'
import { PdfIcon } from '@/components/ui-v2/icons/PdfIcon'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import { reportService } from '@/services/reportService'
import { taskService } from '@/services/taskService'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { Input } from '@/components/ui-v2/Input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui-v2/DropdownMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-v2/Select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription } from '@/components/ui-v2/Sheet'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui-v2/Popover'
import { FlowChip, FLOW_LABEL } from '@/components/tasks/FlowChip'
import { TaskTypeLabel, TASK_TYPE_META } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel, ENV_META } from '@/components/tasks/EnvLabel'
import { Monitor } from 'lucide-react'

interface Task {
  id: number
  code: string
  title: string
  description?: string
  flowType?: string
  taskType?: string
  requesterId?: number
  requesterName?: string
  amount?: number
  hasDelivery?: boolean
  hasQuoteInBilling?: boolean
  financialEmailSent?: boolean
}

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Formata ISO YYYY-MM-DD pra DD/MM/YYYY (display em chips). Aceita também já-formatado.
const fmtDateBR = (s: string) => {
  if (!s) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  return s
}

const COLUMN_VISIBILITY_KEY = 'devquote.tasks.columns.v2'

/** Configuração de quais colunas aparecem por default. Locked = não pode esconder. */
const COLUMN_DEFS: Array<{ id: string; label: string; defaultVisible: boolean; locked?: boolean }> = [
  { id: 'id',                 label: 'ID',                  defaultVisible: false },
  { id: 'code',               label: 'Código',              defaultVisible: true  },
  { id: 'flowType',           label: 'Fluxo',               defaultVisible: true  },
  { id: 'taskType',           label: 'Tipo',                defaultVisible: true  },
  { id: 'priority',           label: 'Prioridade',          defaultVisible: false },
  { id: 'environment',        label: 'Ambiente',            defaultVisible: false },
  { id: 'title',              label: 'Tarefa',              defaultVisible: true, locked: true },
  { id: 'requesterName',      label: 'Solicitante',         defaultVisible: true  },
  { id: 'systemModule',       label: 'Módulo do Sistema',   defaultVisible: false },
  { id: 'serverOrigin',       label: 'Servidor',            defaultVisible: false },
  { id: 'link',               label: 'Link da tarefa',      defaultVisible: false },
  { id: 'meetingLink',        label: 'Link da reunião',     defaultVisible: false },
  { id: 'delivery',           label: 'Entrega',             defaultVisible: true  },
  { id: 'billing',            label: 'Faturamento',         defaultVisible: true  },
  { id: 'amount',             label: 'Valor',               defaultVisible: true  },
  { id: 'createdAt',          label: 'Criada em',           defaultVisible: false },
  { id: 'createdByUserName',  label: 'Criada por',          defaultVisible: false },
  { id: 'updatedAt',          label: 'Atualizada em',       defaultVisible: false },
  { id: 'updatedByUserName',  label: 'Atualizada por',      defaultVisible: false },
  { id: 'subTasksCount',      label: 'Subtarefas',          defaultVisible: false },
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

const PRIORITY_META: Record<string, { label: string; dot: string; text: string }> = {
  LOW:    { label: 'Baixa',   dot: 'bg-emerald-500', text: 'text-[var(--success-strong)]' },
  MEDIUM: { label: 'Média',   dot: 'bg-amber-500',   text: 'text-[var(--warning-strong)]' },
  HIGH:   { label: 'Alta',    dot: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-300' },
  URGENT: { label: 'Urgente', dot: 'bg-rose-500',    text: 'text-[var(--danger-strong)]' },
}

const STATUS_PILL_TONES = {
  info:    { on: 'bg-info-soft text-[var(--info-strong)] border-info-border',         off: 'bg-danger-soft text-[var(--danger-strong)] border-danger-border' },
  success: { on: 'bg-success-soft text-[var(--success-strong)] border-success-border', off: 'bg-danger-soft text-[var(--danger-strong)] border-danger-border' },
} as const

const StatusPill: React.FC<{
  on: boolean
  onLabel: string
  offLabel: string
  tone: keyof typeof STATUS_PILL_TONES
}> = ({ on, onLabel, offLabel, tone }) => {
  const cls = STATUS_PILL_TONES[tone][on ? 'on' : 'off']
  const Icon = on ? Check : X
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full border text-[11px] font-medium ${cls}`}>
      <Icon className="size-3" strokeWidth={2.5} />
      {on ? onLabel : offLabel}
    </span>
  )
}

const TaskList: React.FC = () => {
  const navigate = useNavigate()
  const { hasAnyProfile, hasProfile } = useAuth() as any
  const isAdmin = hasProfile ? hasProfile('ADMIN') : true
  const {
    tasks, pagination, loading, error, filters, sorting,
    deleteTaskWithSubTasks, deleteBulkTasks,
    setPage, setPageSize, setFilter, clearFilters, setSorting,
    exportToExcel, exportTasksOnlyToExcel,
  } = useTasks({ size: 100 })

  const [search, setSearch] = React.useState((filters.title as string) || '')
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'one' | 'bulk'; ids: number[] } | null>(null)
  const [pdfLoadingId, setPdfLoadingId] = React.useState<number | null>(null)
  const [emailLoadingId, setEmailLoadingId] = React.useState<number | null>(null)

  const handleSendFinancialEmail = React.useCallback(async (task: Task) => {
    setEmailLoadingId(task.id)
    try {
      await taskService.sendFinancialEmail(task.id)
      toast.success('E-mail financeiro enviado')
    } catch {
      toast.error('Erro ao enviar e-mail financeiro')
    } finally {
      setEmailLoadingId(null)
    }
  }, [])

  const handleSendTaskEmail = React.useCallback(async (task: Task) => {
    setEmailLoadingId(task.id)
    try {
      await taskService.sendTaskEmail(task.id)
      toast.success('E-mail da tarefa enviado')
    } catch {
      toast.error('Erro ao enviar e-mail da tarefa')
    } finally {
      setEmailLoadingId(null)
    }
  }, [])
  const [stats, setStats] = React.useState<{ total: number; totalWithoutDelivery: number; totalWithoutBilling: number } | null>(null)
  const [filteredTotal, setFilteredTotal] = React.useState<number | null>(null)
  const [filteredTotalLoading, setFilteredTotalLoading] = React.useState(false)
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

  React.useEffect(() => {
    let cancelled = false
    taskService.getStats()
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => { /* silencioso — fallback fica em — */ })
    return () => { cancelled = true }
  }, [])

  const handleGeneratePdf = React.useCallback(async (task: Task) => {
    setPdfLoadingId(task.id)
    try {
      const blob = await reportService.generateTaskPdf(task.id)
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
        String(now.getSeconds()).padStart(2, '0')
      ].join('-')
      const flowCode = task.flowType === 'DESENVOLVIMENTO' ? 'DEV' : 'OP'
      link.download = `tarefa-${task.id}-${task.code}-${flowCode}-${ts}.pdf`
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

  React.useEffect(() => {
    const t = setTimeout(() => setFilter('title', search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Soma total filtrada (via backend, todas as páginas)
  React.useEffect(() => {
    let cancelled = false
    // Mesmo debounce do hook (300ms) pra alinhar com refetch da lista
    const t = setTimeout(async () => {
      setFilteredTotalLoading(true)
      try {
        // Normaliza datas para ISO (mesma lógica do useTasks)
        const toIso = (s: any) => {
          if (!s) return s
          const str = String(s)
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
            const [d, m, y] = str.split('/')
            return `${y}-${m}-${d}`
          }
          return undefined
        }
        const normalized: Record<string, any> = { ...filters }
        if (normalized.startDate) normalized.startDate = toIso(normalized.startDate)
        if (normalized.endDate)   normalized.endDate   = toIso(normalized.endDate)
        const total = await taskService.getTotalAmount(normalized)
        if (!cancelled) setFilteredTotal(total)
      } catch {
        if (!cancelled) setFilteredTotal(null)
      } finally {
        if (!cancelled) setFilteredTotalLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [filters])

  // Adapter useTasks.sorting (field/direction) <-> TanStack SortingState (id/desc)
  const tanstackSorting = React.useMemo(
    () => (sorting || []).map((s: any) => ({ id: s.field, desc: s.direction === 'desc' })),
    [sorting]
  )
  const handleSortingChange = React.useCallback((next: any) => {
    if (!next || next.length === 0) return
    const first = next[0]
    setSorting(first.id, first.desc ? 'desc' : 'asc')
  }, [setSorting])

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const canCRUD = hasAnyProfile ? hasAnyProfile(['ADMIN', 'MANAGER']) : true
  const canViewValues = canCRUD

  const allColumns = React.useMemo<ColumnDef<Task, any>[]>(() => [
    {
      id: 'id', accessorKey: 'id', header: 'ID', size: 64, meta: { align: 'center' },
      cell: ({ row }) => <span className="font-mono text-[11px] text-text-tertiary">#{row.original.id}</span>,
    },
    {
      id: 'code', accessorKey: 'code', header: 'Código', size: 110, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const link = (row.original as any).link
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
              {row.original.code}
            </a>
          )
        }
        return (
          <span className="font-mono text-xs font-medium text-text-primary tracking-tight truncate block">
            {row.original.code}
          </span>
        )
      },
    },
    {
      id: 'flowType', accessorKey: 'flowType', header: 'Fluxo', size: 165, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <FlowChip value={row.original.flowType} />
        </div>
      ),
    },
    {
      id: 'taskType', accessorKey: 'taskType', header: 'Tipo', size: 180, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <TaskTypeLabel value={row.original.taskType} />
        </div>
      ),
    },
    {
      id: 'priority', accessorKey: 'priority', header: 'Prioridade', size: 130, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const p = (row.original as any).priority as string | undefined
        const meta = p ? PRIORITY_META[p] : undefined
        if (!meta) return <span className="text-text-tertiary">—</span>
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-xs font-medium border bg-surface-2 border-border-subtle ${meta.text}`}>
            <span className={`size-2 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        )
      },
    },
    {
      id: 'environment', accessorKey: 'environment', header: 'Ambiente', size: 150, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <EnvLabel value={(row.original as any).environment} />
        </div>
      ),
    },
    {
      id: 'requesterName', accessorKey: 'requesterName', header: 'Solicitante', size: 170, enableSorting: false,
      cell: ({ row }) => {
        const name = (row.original as any).requesterName
        if (!name) return <span className="text-text-tertiary">—</span>
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-6 rounded-full bg-accent-soft text-accent grid place-items-center text-[10px] font-semibold shrink-0">
              {name[0]?.toUpperCase() || '?'}
            </span>
            <span className="text-sm text-text-primary truncate">{name}</span>
          </div>
        )
      },
    },
    {
      id: 'systemModule', accessorKey: 'systemModule', header: 'Módulo do Sistema', size: 160, enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary truncate block">
          {(row.original as any).systemModule || <span className="text-text-tertiary">—</span>}
        </span>
      ),
    },
    {
      id: 'serverOrigin', accessorKey: 'serverOrigin', header: 'Servidor', size: 140, enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary truncate block">
          {(row.original as any).serverOrigin || <span className="text-text-tertiary">—</span>}
        </span>
      ),
    },
    {
      id: 'meetingLink', accessorKey: 'meetingLink', header: 'Link da reunião', size: 220, enableSorting: false,
      cell: ({ row }) => {
        const link = (row.original as any).meetingLink
        if (!link) return <span className="text-text-tertiary">—</span>
        return (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-accent hover:underline truncate block"
            title={link}
          >
            {link}
          </a>
        )
      },
    },
    {
      id: 'link', accessorKey: 'link', header: 'Link da tarefa', size: 220, enableSorting: false,
      cell: ({ row }) => {
        const link = (row.original as any).link
        if (!link) return <span className="text-text-tertiary">—</span>
        return (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-accent hover:underline truncate block"
            title={link}
          >
            {link}
          </a>
        )
      },
    },
    {
      id: 'title', accessorKey: 'title', header: 'Tarefa', size: 360, enableSorting: false, meta: { wrap: true },
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0 py-1">
          <span className="text-text-primary font-medium leading-snug break-words">
            {row.original.title}
          </span>
        </div>
      ),
    },
    {
      id: 'delivery', header: 'Entrega', size: 120, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusPill on={!!row.original.hasDelivery} onLabel="Entrega" offLabel="Sem entrega" tone="info" />
        </div>
      ),
    },
    {
      id: 'billing', header: 'Faturamento', size: 125, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusPill on={!!row.original.hasQuoteInBilling} onLabel="Faturado" offLabel="Sem fatura" tone="success" />
        </div>
      ),
    },
    {
      id: 'subTasksCount', accessorKey: 'subTasks', header: 'Subtarefas', size: 110, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const subs = (row.original as any).subTasks as any[] | undefined
        const count = subs?.filter((s) => !s?.excluded).length ?? 0
        if (count === 0) return <span className="text-text-tertiary">—</span>
        return (
          <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-accent-soft text-accent text-xs font-medium">
            <ListChecks className="size-3" />
            {count}
          </span>
        )
      },
    },
    {
      id: 'amount', accessorKey: 'amount', header: 'Valor', size: 100, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const v = row.original.amount ?? 0
        return (
          <span className={`block tabular-nums ${v > 0 && row.original.hasQuoteInBilling ? 'text-success-strong font-medium' : 'text-text-primary'}`}>
            {brl(v)}
          </span>
        )
      },
    },
    {
      id: 'createdAt', accessorKey: 'createdAt', header: 'Criada em', size: 130, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const d = (row.original as any).createdAt
        if (!d) return <span className="text-text-tertiary">—</span>
        return <span className="text-xs text-text-secondary tabular-nums">{new Date(d).toLocaleDateString('pt-BR')}</span>
      },
    },
    {
      id: 'createdByUserName', accessorKey: 'createdByUserName', header: 'Criada por', size: 150, enableSorting: false,
      cell: ({ row }) => {
        const name = (row.original as any).createdByUserName
        if (!name) return <span className="text-text-tertiary">—</span>
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-6 rounded-full bg-surface-2 text-text-secondary grid place-items-center text-[10px] font-semibold shrink-0">
              {name[0]?.toUpperCase() || '?'}
            </span>
            <span className="text-xs text-text-primary truncate">{name}</span>
          </div>
        )
      },
    },
    {
      id: 'updatedAt', accessorKey: 'updatedAt', header: 'Atualizada em', size: 140, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => {
        const d = (row.original as any).updatedAt
        if (!d) return <span className="text-text-tertiary">—</span>
        return <span className="text-xs text-text-secondary tabular-nums">{new Date(d).toLocaleDateString('pt-BR')}</span>
      },
    },
    {
      id: 'updatedByUserName', accessorKey: 'updatedByUserName', header: 'Atualizada por', size: 160, enableSorting: false,
      cell: ({ row }) => {
        const name = (row.original as any).updatedByUserName
        if (!name) return <span className="text-text-tertiary">—</span>
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-6 rounded-full bg-surface-2 text-text-secondary grid place-items-center text-[10px] font-semibold shrink-0">
              {name[0]?.toUpperCase() || '?'}
            </span>
            <span className="text-xs text-text-primary truncate">{name}</span>
          </div>
        )
      },
    },
    {
      id: '__actions', header: '', size: 170, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {isAdmin && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => navigate(`/tasks/${row.original.id}/edit`)}
              aria-label="Editar"
              title="Editar"
            >
              <Pencil />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => handleGeneratePdf(row.original)}
            loading={pdfLoadingId === row.original.id}
            disabled={pdfLoadingId === row.original.id}
            aria-label="Exportar PDF do orçamento"
            title="Exportar PDF do orçamento"
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
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onSelect={() => handleSendFinancialEmail(row.original)}
                    disabled={emailLoadingId === row.original.id}
                  >
                    <Mail />Enviar e-mail financeiro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleSendTaskEmail(row.original)}
                    disabled={emailLoadingId === row.original.id}
                  >
                    <Send />Enviar e-mail da tarefa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={() => navigate(`/tasks/${row.original.id}`)}>
                <Eye />Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate, isAdmin, handleGeneratePdf, pdfLoadingId, emailLoadingId])

  /** Aplica visibilidade — Valor restrito a ADMIN+MANAGER; Faturamento idem (oculto p/ USER). */
  const columns = React.useMemo(() => {
    const lookup = new Map(allColumns.map((c) => [c.id || (c as any).accessorKey, c]))
    const visibleIds = COLUMN_DEFS
      .filter((d) => columnVisibility[d.id])
      .filter((d) => canViewValues || d.id !== 'amount')
      .filter((d) => canViewValues || d.id !== 'billing')
      .map((d) => d.id)
    const ordered = visibleIds.map((id) => lookup.get(id)).filter(Boolean) as ColumnDef<Task, any>[]
    const actionsCol = allColumns.find((c) => c.id === '__actions')
    return actionsCol ? [...ordered, actionsCol] : ordered
  }, [allColumns, columnVisibility, canViewValues])

  const [filtersOpen, setFiltersOpen] = React.useState(false)

  const chips: any[] = []
  if (filters.id)           chips.push({ key: 'id',           label: 'ID',                 value: String(filters.id),                                                                                                        onRemove: () => setFilter('id', '') })
  if (filters.code)         chips.push({ key: 'code',         label: 'Código',             value: String(filters.code),                                                                                                      onRemove: () => setFilter('code', '') })
  if (filters.title)        chips.push({ key: 'title',        label: 'Título',             value: String(filters.title),                                                                                                     onRemove: () => { setSearch(''); setFilter('title', '') } })
  if (filters.description)  chips.push({ key: 'description',  label: 'Descrição',          value: String(filters.description),                                                                                               onRemove: () => setFilter('description', '') })
  if (filters.link)         chips.push({ key: 'link',         label: 'Link',               value: String(filters.link),                                                                                                      onRemove: () => setFilter('link', '') })
  if (filters.flowType)     chips.push({ key: 'flowType',     label: 'Fluxo',              value: FLOW_LABEL[filters.flowType as string] || String(filters.flowType),                                                       onRemove: () => setFilter('flowType', '') })
  if (filters.taskType)     chips.push({ key: 'taskType',     label: 'Tipo',               value: TASK_TYPE_OPTIONS.find(o => o.value === filters.taskType)?.label || String(filters.taskType),                             onRemove: () => setFilter('taskType', '') })
  if (filters.environment)  chips.push({ key: 'env',          label: 'Ambiente',           value: String(filters.environment),                                                                                               onRemove: () => setFilter('environment', '') })
  if (filters.requesterId)  chips.push({ key: 'requester',    label: 'Solicitante',        value: `#${filters.requesterId}`,                                                                                                 onRemove: () => setFilter('requesterId', '') })
  if (filters.requesterName) chips.push({ key: 'requesterName', label: 'Nome solicitante', value: String(filters.requesterName),                                                                                            onRemove: () => setFilter('requesterName', '') })
  if (filters.startDate)    chips.push({ key: 'startDate',    label: 'Criada a partir de', value: fmtDateBR(String(filters.startDate)),                                                                                     onRemove: () => setFilter('startDate', '') })
  if (filters.endDate)      chips.push({ key: 'endDate',      label: 'Criada até',         value: fmtDateBR(String(filters.endDate)),                                                                                       onRemove: () => setFilter('endDate', '') })
  if (filters.hasDelivery !== undefined && filters.hasDelivery !== '') chips.push({ key: 'hasDelivery', label: 'Entrega', value: filters.hasDelivery === 'true' || filters.hasDelivery === true ? 'Sim' : 'Não', onRemove: () => setFilter('hasDelivery', '') })
  if (filters.hasQuoteInBilling !== undefined && filters.hasQuoteInBilling !== '') chips.push({ key: 'hasBilling', label: 'Faturamento', value: filters.hasQuoteInBilling === 'true' || filters.hasQuoteInBilling === true ? 'Sim' : 'Não', onRemove: () => setFilter('hasQuoteInBilling', '') })

  const activeFilterCount = chips.length

  return (
    <div>
      <PageHeader
        title="Tarefas"
        subtitle={pagination ? `${pagination.totalElements} tarefa${pagination.totalElements === 1 ? '' : 's'}` : undefined}
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

            {canViewValues && (
              <div className="flex items-center gap-2 ml-1">
                <StatChip
                  label="Sem entrega"
                  value={stats?.totalWithoutDelivery}
                  onClick={() => setFilter('hasDelivery', filters.hasDelivery === 'false' ? '' : 'false')}
                  active={filters.hasDelivery === 'false'}
                />
                <StatChip
                  label="Sem fatura"
                  value={stats?.totalWithoutBilling}
                  onClick={() => setFilter('hasQuoteInBilling', filters.hasQuoteInBilling === 'false' ? '' : 'false')}
                  active={filters.hasQuoteInBilling === 'false'}
                />
              </div>
            )}
          </>
        }
        actions={
          <>
            <ColumnsMenu visibility={columnVisibility} onChange={setColumnVisibility} defs={COLUMN_DEFS.filter((d) => canViewValues || (d.id !== 'amount' && d.id !== 'billing'))} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" leadingIcon={<Download />}>Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportToExcel().catch(() => {})}>Tarefas + itens</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportTasksOnlyToExcel().catch(() => {})}>Só tarefas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isAdmin && <Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>Nova tarefa</Button>}
          </>
        }
      />

      <FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />

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
        <DataTable<Task>
          data={tasks as any[]}
          columns={columns}
          sorting={tanstackSorting}
          onSortingChange={handleSortingChange}
          columnFilters={{
            id: {
              type: 'number',
              value: (filters.id as string) || '',
              onChange: (v) => setFilter('id', v),
              placeholder: '#',
            },
            code: {
              value: (filters.code as string) || '',
              onChange: (v) => setFilter('code', v),
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
            title: {
              value: (filters.title as string) || '',
              onChange: (v) => { setSearch(v); setFilter('title', v) },
              placeholder: 'Buscar título...',
            },
            requesterName: {
              value: (filters.requesterName as string) || '',
              onChange: (v) => setFilter('requesterName', v),
              placeholder: 'Solicitante...',
            },
            delivery: {
              value: (filters.hasDelivery as string) || '',
              onChange: (v) => setFilter('hasDelivery', v),
              render: () => (
                <Select value={(filters.hasDelivery as string) || '__all'} onValueChange={(v) => setFilter('hasDelivery', v === '__all' ? '' : v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    <SelectItem value="true">Com entrega</SelectItem>
                    <SelectItem value="false">Sem entrega</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
            billing: {
              value: (filters.hasQuoteInBilling as string) || '',
              onChange: (v) => setFilter('hasQuoteInBilling', v),
              render: () => (
                <Select value={(filters.hasQuoteInBilling as string) || '__all'} onValueChange={(v) => setFilter('hasQuoteInBilling', v === '__all' ? '' : v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    <SelectItem value="true">Faturado</SelectItem>
                    <SelectItem value="false">Sem fatura</SelectItem>
                  </SelectContent>
                </Select>
              ),
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
            link: {
              value: (filters.link as string) || '',
              onChange: (v) => setFilter('link', v),
              placeholder: 'URL...',
            },
            createdAt: {
              type: 'date',
              value: (filters.startDate as string) || '',
              onChange: (v) => setFilter('startDate', v),
              placeholder: '',
            },
            // updatedAt filtro inline removido — backend só suporta LIKE de string,
            // não data. Pra filtrar por intervalo use Datas de criação no Sheet.
          }}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => navigate(`/tasks/${r.id}`)}
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
                title="Nenhuma tarefa com esses filtros"
                description="Ajuste os filtros aplicados ou limpe-os para ver todas as tarefas."
                actions={
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => { setSearch(''); clearFilters() }}>
                      Limpar filtros
                    </Button>
                    {isAdmin && (
                      <Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>
                        Nova tarefa
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              <EmptyState
                icon={<ListChecks />}
                title="Nenhuma tarefa"
                description="Você ainda não tem tarefas cadastradas. Crie a primeira."
                actions={isAdmin ? <Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>Nova tarefa</Button> : undefined}
              />
            )
          }
          footer={(() => {
            const pageCount = tasks.length
            const totalRows = pagination?.totalElements ?? pageCount
            const hasActiveFilters = chips.length > 0
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-text-secondary">
                  <span>
                    <span className="text-text-tertiary">{hasActiveFilters ? 'Tarefas filtradas:' : 'Total de tarefas:'}</span>{' '}
                    <span className="font-medium text-text-primary tabular-nums">{totalRows.toLocaleString('pt-BR')}</span>
                  </span>
                </div>
                {canViewValues && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-tertiary">
                      {hasActiveFilters ? 'Soma filtrada:' : 'Soma total:'}
                    </span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {filteredTotalLoading
                        ? <span className="inline-block w-20 h-4 rounded bg-surface-2 animate-pulse" aria-label="Carregando…" />
                        : brl(filteredTotal ?? 0)}
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
        {!loading && tasks.length === 0 && (
          chips.length > 0 ? (
            <EmptyState
              icon={<Filter />}
              title="Nenhuma tarefa com esses filtros"
              description="Ajuste ou limpe os filtros."
              actions={
                <Button variant="secondary" onClick={() => { setSearch(''); clearFilters() }}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ListChecks />}
              title="Nenhuma tarefa"
              description="Crie a primeira."
              actions={isAdmin ? <Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>Nova</Button> : undefined}
            />
          )
        )}
        {!loading && tasks.map((t: any) => (
          <div
            key={t.id}
            className="w-full rounded-lg border border-border-subtle bg-surface-1 p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-text-tertiary shrink-0">#{t.id}</span>
                {t.link ? (
                  <a
                    href={t.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-xs font-medium text-accent hover:underline truncate"
                    title={`Abrir link: ${t.link}`}
                  >
                    {t.code}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-text-secondary truncate">{t.code}</span>
                )}
              </div>
              {canViewValues && <span className={`text-sm font-medium tabular-nums shrink-0 ${(t.amount ?? 0) > 0 && t.hasQuoteInBilling ? 'text-success-strong' : 'text-text-primary'}`}>{brl(t.amount)}</span>}
            </div>
            <button onClick={() => navigate(`/tasks/${t.id}`)} className="w-full text-left">
              <p className="text-sm text-text-primary mb-1.5 leading-snug break-words">{t.title}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {t.flowType && <FlowChip value={t.flowType} />}
                <StatusPill on={!!t.hasDelivery}        onLabel="Entrega"  offLabel="Sem entrega" tone="info" />
                {canViewValues && <StatusPill on={!!t.hasQuoteInBilling}  onLabel="Faturado" offLabel="Sem fatura"  tone="success" />}
              </div>
              {t.requesterName && (
                <p className="text-xs text-text-tertiary mt-1.5">{t.requesterName}</p>
              )}
            </button>

            <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
              {isAdmin && (
                <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/tasks/${t.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => handleGeneratePdf(t)}
                loading={pdfLoadingId === t.id}
                disabled={pdfLoadingId === t.id}
                aria-label="Exportar PDF do orçamento"
                title="Exportar PDF do orçamento"
                className="text-text-secondary hover:text-[var(--danger-strong)]"
              >
                <PdfIcon />
              </Button>
              {isAdmin && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete({ kind: 'one', ids: [t.id] })}
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
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onSelect={() => handleSendFinancialEmail(t)} disabled={emailLoadingId === t.id}>
                        <Mail />Enviar e-mail financeiro
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleSendTaskEmail(t)} disabled={emailLoadingId === t.id}>
                        <Send />Enviar e-mail da tarefa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onSelect={() => navigate(`/tasks/${t.id}`)}>
                    <Eye />Ver detalhes
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
            <SheetDescription>Refine sua busca por tarefas.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-6">

            <FilterSection title="Identificação">
              <div className="grid grid-cols-2 gap-3">
                <FilterField label="ID">
                  <Input
                    placeholder="Ex: 444"
                    value={(filters.id as string) || ''}
                    onChange={(e) => setFilter('id', e.target.value)}
                    inputMode="numeric"
                  />
                </FilterField>
                <FilterField label="Código">
                  <Input
                    placeholder="Ex: N6E2U2"
                    value={(filters.code as string) || ''}
                    onChange={(e) => setFilter('code', e.target.value)}
                  />
                </FilterField>
              </div>
              <FilterField label="Link (URL)">
                <Input
                  placeholder="Trecho do link..."
                  value={(filters.link as string) || ''}
                  onChange={(e) => setFilter('link', e.target.value)}
                />
              </FilterField>
            </FilterSection>

            <FilterSection title="Conteúdo">
              <FilterField label="Título">
                <Input
                  leadingIcon={<Search />}
                  placeholder="Buscar por título..."
                  value={(filters.title as string) || ''}
                  onChange={(e) => { setSearch(e.target.value); setFilter('title', e.target.value) }}
                />
              </FilterField>
              <FilterField label="Descrição">
                <Input
                  placeholder="Trecho na descrição..."
                  value={(filters.description as string) || ''}
                  onChange={(e) => setFilter('description', e.target.value)}
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
            </FilterSection>

            <FilterSection title="Solicitante">
              <div className="grid grid-cols-2 gap-3">
                <FilterField label="ID do solicitante">
                  <Input
                    placeholder="Ex: 7"
                    value={(filters.requesterId as string) || ''}
                    onChange={(e) => setFilter('requesterId', e.target.value)}
                    inputMode="numeric"
                  />
                </FilterField>
                <FilterField label="Nome do solicitante">
                  <Input
                    placeholder="Buscar nome..."
                    value={(filters.requesterName as string) || ''}
                    onChange={(e) => setFilter('requesterName', e.target.value)}
                  />
                </FilterField>
              </div>
            </FilterSection>

            <FilterSection title="Datas de criação">
              <div className="grid grid-cols-2 gap-3">
                <FilterField label="De">
                  <Input
                    type="date"
                    value={(filters.startDate as string) || ''}
                    onChange={(e) => setFilter('startDate', e.target.value)}
                  />
                </FilterField>
                <FilterField label="Até">
                  <Input
                    type="date"
                    value={(filters.endDate as string) || ''}
                    onChange={(e) => setFilter('endDate', e.target.value)}
                  />
                </FilterField>
              </div>
            </FilterSection>

            <FilterSection title="Vínculos">
              <FilterField label="Possui entrega">
                <TriStateToggle
                  value={filters.hasDelivery as any}
                  onChange={(v) => setFilter('hasDelivery', v)}
                  onLabel="Com entrega"
                  offLabel="Sem entrega"
                />
              </FilterField>
              <FilterField label="Possui faturamento">
                <TriStateToggle
                  value={filters.hasQuoteInBilling as any}
                  onChange={(v) => setFilter('hasQuoteInBilling', v)}
                  onLabel="Faturado"
                  offLabel="Sem fatura"
                />
              </FilterField>
            </FilterSection>

          </SheetBody>
          <SheetFooter>
            <Button variant="ghost" onClick={() => { setSearch(''); clearFilters() }}>Limpar tudo</Button>
            <Button onClick={() => setFiltersOpen(false)}>Aplicar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} tarefas` : 'tarefa'}?</DialogTitle>
            <DialogDescription>Subtarefas e anexos serão removidos. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  if (confirmDelete.kind === 'bulk') {
                    await deleteBulkTasks(confirmDelete.ids)
                  } else {
                    await deleteTaskWithSubTasks(confirmDelete.ids[0])
                  }
                  setSelection({})
                } catch (e: any) {
                  toast.error(e.message || 'Erro ao excluir')
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
    </div>
  )
}

export default TaskList

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

interface StatChipProps {
  label: string
  value?: number
  onClick?: () => void
  active?: boolean
}

const StatChip: React.FC<StatChipProps> = ({ label, value, onClick, active }) => {
  const isLoading = value === undefined
  const hasIssues = (value ?? 0) > 0
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      title={`Filtrar tarefas: ${label}`}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs font-medium transition-colors ${
        active
          ? 'bg-danger-soft border-[var(--danger-strong)] text-[var(--danger-strong)] ring-1 ring-[var(--danger-strong)]/30'
          : hasIssues
            ? 'bg-danger-soft border-danger-border text-[var(--danger-strong)] hover:brightness-95'
            : 'bg-surface-1 border-border-subtle text-text-secondary hover:bg-surface-2'
      } ${isLoading ? 'opacity-60' : ''}`}
    >
      <span className="tabular-nums font-semibold text-sm">
        {isLoading ? '—' : value!.toLocaleString('pt-BR')}
      </span>
      <span className="opacity-90">{label}</span>
    </button>
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

interface TriStateToggleProps {
  value: string | boolean | undefined
  onChange: (v: string) => void
  onLabel: string
  offLabel: string
}

const TriStateToggle: React.FC<TriStateToggleProps> = ({ value, onChange, onLabel, offLabel }) => {
  const current = value === true || value === 'true' ? 'on'
    : value === false || value === 'false' ? 'off'
    : 'any'
  const btnBase = 'flex-1 h-8 px-3 text-xs font-medium border transition-colors'
  return (
    <div className="inline-flex w-full rounded-md overflow-hidden border border-border-subtle">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`${btnBase} border-r ${current === 'any' ? 'bg-accent-soft text-accent border-accent/30' : 'bg-surface-1 text-text-secondary hover:bg-surface-2'}`}
      >
        Qualquer
      </button>
      <button
        type="button"
        onClick={() => onChange('true')}
        className={`${btnBase} border-r ${current === 'on' ? 'bg-success-soft text-[var(--success-strong)] border-success-border' : 'bg-surface-1 text-text-secondary hover:bg-surface-2'}`}
      >
        {onLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('false')}
        className={`${btnBase} ${current === 'off' ? 'bg-warning-soft text-[var(--warning-strong)] border-warning-border' : 'bg-surface-1 text-text-secondary hover:bg-surface-2'}`}
      >
        {offLabel}
      </button>
    </div>
  )
}
