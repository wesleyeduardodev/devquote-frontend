import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, ListChecks, Mail, Eye,
  Download, Search, Filter, Check, Minus, X
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
import { FlowChip, FLOW_LABEL } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'

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
  { value: 'DEV', label: 'Desenvolvimento' },
  { value: 'HML', label: 'Homologação' },
  { value: 'PROD', label: 'Produção' },
]

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
  const { hasAnyProfile } = useAuth() as any
  const {
    tasks, pagination, loading, error, filters,
    deleteTaskWithSubTasks, deleteBulkTasks,
    setPage, setPageSize, setFilter, clearFilters,
    exportToExcel, exportTasksOnlyToExcel,
  } = useTasks({ size: 25 })

  const [search, setSearch] = React.useState((filters.title as string) || '')
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'one' | 'bulk'; ids: number[] } | null>(null)
  const [pdfLoadingId, setPdfLoadingId] = React.useState<number | null>(null)
  const [stats, setStats] = React.useState<{ total: number; totalWithoutDelivery: number; totalWithoutBilling: number } | null>(null)

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

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const canCRUD = hasAnyProfile ? hasAnyProfile(['ADMIN', 'MANAGER']) : true

  const columns = React.useMemo<ColumnDef<Task, any>[]>(() => [
    {
      accessorKey: 'id', header: 'ID', size: 64, meta: { align: 'center' },
      cell: ({ row }) => <span className="font-mono text-[11px] text-text-tertiary">#{row.original.id}</span>,
    },
    {
      accessorKey: 'code', header: 'Código', size: 120, meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-text-primary tracking-tight truncate block">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'flowType', header: 'Fluxo', size: 180, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <FlowChip value={row.original.flowType} />
        </div>
      ),
    },
    {
      accessorKey: 'taskType', header: 'Tipo', size: 200, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <TaskTypeLabel value={row.original.taskType} />
        </div>
      ),
    },
    {
      accessorKey: 'title', header: 'Tarefa', meta: { wrap: true },
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0 py-1">
          <span className="text-text-primary font-medium leading-snug break-words">
            {row.original.title}
          </span>
          {row.original.requesterName && (
            <span className="text-xs text-text-tertiary mt-0.5 truncate">{row.original.requesterName}</span>
          )}
        </div>
      ),
    },
    {
      id: 'status', header: 'Status', size: 220, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <StatusPill
            on={!!row.original.hasDelivery}
            onLabel="Entrega"
            offLabel="Sem entrega"
            tone="info"
          />
          <StatusPill
            on={!!row.original.hasQuoteInBilling}
            onLabel="Faturado"
            offLabel="Sem fatura"
            tone="success"
          />
          {row.original.financialEmailSent && (
            <Badge variant="neutral" size="sm"><Mail className="size-3" />Enviado</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amount', header: 'Valor', size: 110, meta: { align: 'center' },
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
      id: '__actions', header: '', size: 160,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Primárias: visualizar + editar */}
          <div className="flex items-center gap-0.5">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => navigate(`/tasks/${row.original.id}`)}
              aria-label="Visualizar"
              title="Visualizar"
            >
              <Eye />
            </Button>
            {canCRUD && (
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
          </div>

          {/* Secundárias: exportar + excluir (com separação visual) */}
          <div className="flex items-center gap-0.5 border-l border-border-subtle pl-2">
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
            {canCRUD && (
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
          </div>
        </div>
      ),
    },
  ], [navigate, canCRUD, handleGeneratePdf, pdfLoadingId])

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
  if (filters.startDate)    chips.push({ key: 'startDate',    label: 'Criada a partir de', value: String(filters.startDate),                                                                                                 onRemove: () => setFilter('startDate', '') })
  if (filters.endDate)      chips.push({ key: 'endDate',      label: 'Criada até',         value: String(filters.endDate),                                                                                                   onRemove: () => setFilter('endDate', '') })
  if (filters.hasDelivery !== undefined && filters.hasDelivery !== '') chips.push({ key: 'hasDelivery', label: 'Entrega', value: filters.hasDelivery === 'true' || filters.hasDelivery === true ? 'Sim' : 'Não', onRemove: () => setFilter('hasDelivery', '') })
  if (filters.hasQuoteInBilling !== undefined && filters.hasQuoteInBilling !== '') chips.push({ key: 'hasBilling', label: 'Faturamento', value: filters.hasQuoteInBilling === 'true' || filters.hasQuoteInBilling === true ? 'Sim' : 'Não', onRemove: () => setFilter('hasQuoteInBilling', '') })
  if (filters.financialEmailSent !== undefined && filters.financialEmailSent !== '') chips.push({ key: 'emailSent', label: 'Email financeiro', value: filters.financialEmailSent === 'true' || filters.financialEmailSent === true ? 'Enviado' : 'Não enviado', onRemove: () => setFilter('financialEmailSent', '') })

  const activeFilterCount = chips.length

  return (
    <div>
      <PageHeader
        title="Tarefas"
        subtitle={pagination ? `${pagination.totalElements} tarefa${pagination.totalElements === 1 ? '' : 's'}` : undefined}
        filters={
          <>
            <div className="w-[80px]">
              <Input
                placeholder="ID"
                value={(filters.id as string) || ''}
                onChange={(e) => setFilter('id', e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="w-[140px]">
              <Input
                placeholder="Código"
                value={(filters.code as string) || ''}
                onChange={(e) => setFilter('code', e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[240px]">
              <Input
                leadingIcon={<Search />}
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={(filters.flowType as string) || '__all'} onValueChange={(v) => setFilter('flowType', v === '__all' ? '' : v)}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Fluxo: Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Fluxo: Todos</SelectItem>
                <SelectItem value="DESENVOLVIMENTO">Desenvolvimento</SelectItem>
                <SelectItem value="OPERACIONAL">Operacional</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" leadingIcon={<Filter />} onClick={() => setFiltersOpen(true)}>
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-fg text-[10px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Estatísticas globais (todas as páginas) */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              <StatChip
                label="Sem entrega"
                value={stats?.totalWithoutDelivery}
                onClick={() => setFilter('hasDelivery', 'false')}
                active={filters.hasDelivery === 'false'}
              />
              <StatChip
                label="Sem fatura"
                value={stats?.totalWithoutBilling}
                onClick={() => setFilter('hasQuoteInBilling', 'false')}
                active={filters.hasQuoteInBilling === 'false'}
              />
            </div>
          </>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" leadingIcon={<Download />}>Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportToExcel().catch(() => {})}>Tarefas + itens</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportTasksOnlyToExcel().catch(() => {})}>Só tarefas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>Nova tarefa</Button>
          </>
        }
      />

      <FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={canCRUD && (
          <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>
            Excluir
          </Button>
        )}
      />

      <div className="hidden lg:block">
        <DataTable<Task>
          data={tasks as any[]}
          columns={columns}
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
            <EmptyState
              icon={<ListChecks />}
              title="Nenhuma tarefa"
              description={chips.length > 0 ? 'Ajuste os filtros para ver outras tarefas.' : 'Crie a primeira tarefa.'}
              actions={<Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>Nova tarefa</Button>}
            />
          }
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        {!loading && tasks.length === 0 && (
          <EmptyState icon={<ListChecks />} title="Nenhuma tarefa" description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie a primeira.'} actions={<Button leadingIcon={<Plus />} onClick={() => navigate('/tasks/create')}>Nova</Button>} />
        )}
        {!loading && tasks.map((t: any) => (
          <div
            key={t.id}
            className="w-full rounded-lg border border-border-subtle bg-surface-1 p-4 transition-colors"
          >
            <button onClick={() => navigate(`/tasks/${t.id}`)} className="w-full text-left">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-text-tertiary shrink-0">#{t.id}</span>
                  <span className="font-mono text-xs text-text-secondary truncate">{t.code}</span>
                </div>
                <span className={`text-sm font-medium tabular-nums shrink-0 ${(t.amount ?? 0) > 0 && t.hasQuoteInBilling ? 'text-success-strong' : 'text-text-primary'}`}>{brl(t.amount)}</span>
              </div>
              <p className="text-sm text-text-primary mb-1.5 leading-snug break-words">{t.title}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {t.flowType && <FlowChip value={t.flowType} />}
                <StatusPill on={!!t.hasDelivery}        onLabel="Entrega"  offLabel="Sem entrega" tone="info" />
                <StatusPill on={!!t.hasQuoteInBilling}  onLabel="Faturado" offLabel="Sem fatura"  tone="success" />
              </div>
              {t.requesterName && (
                <p className="text-xs text-text-tertiary mt-1.5">{t.requesterName}</p>
              )}
            </button>

            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-0.5">
                <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/tasks/${t.id}`)} aria-label="Visualizar" title="Visualizar"><Eye /></Button>
                {canCRUD && (
                  <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/tasks/${t.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
                )}
              </div>
              <div className="flex items-center gap-0.5 border-l border-border-subtle pl-2">
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
                {canCRUD && (
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
              </div>
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
                    <SelectItem value="DESENVOLVIMENTO">Desenvolvimento</SelectItem>
                    <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Tipo">
                <Select value={(filters.taskType as string) || '__all'} onValueChange={(v) => setFilter('taskType', v === '__all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os tipos</SelectItem>
                    {TASK_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Ambiente">
                <Select value={(filters.environment as string) || '__all'} onValueChange={(v) => setFilter('environment', v === '__all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os ambientes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos os ambientes</SelectItem>
                    {ENV_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
              <FilterField label="Email financeiro">
                <TriStateToggle
                  value={filters.financialEmailSent as any}
                  onChange={(v) => setFilter('financialEmailSent', v)}
                  onLabel="Enviado"
                  offLabel="Não enviado"
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
