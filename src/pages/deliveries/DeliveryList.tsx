import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, MoreHorizontal, Truck, Eye, Download, RefreshCw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import { useDeliveries } from '@/hooks/useDeliveries'
import { useAuth } from '@/hooks/useAuth'
import { gitSyncService } from '@/services/gitSyncService'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui-v2/DropdownMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-v2/Select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import { DeliveryStatusBadge, STATUS_LABEL } from '@/components/deliveries/DeliveryStatusBadge'
import { DeliveryPipelineOverview } from '@/components/deliveries/DeliveryPipelineOverview'
import { FlowChip, FLOW_LABEL } from '@/components/tasks/FlowChip'

interface DeliveryGroup {
  taskId: number
  taskName: string
  taskCode: string
  taskType?: string
  taskValue?: number
  deliveryId?: number
  deliveryStatus: string
  calculatedDeliveryStatus?: string
  totalItems?: number
  totalDeliveries: number
  completedDeliveries: number
  pendingDeliveries: number
  createdAt?: string
  updatedAt?: string
}

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const DeliveryList: React.FC = () => {
  const navigate = useNavigate()
  const { hasAnyProfile } = useAuth() as any
  const {
    deliveryGroups, pagination, loading, error, filters,
    deleteBulk,
    setPage, setPageSize, setFilter, clearFilters,
    exportToExcel, exportDeliveriesOnlyToExcel,
  } = useDeliveries({ size: 25 })

  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'bulk'; ids: number[] } | null>(null)
  const [syncing, setSyncing] = React.useState(false)

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const canCRUD = hasAnyProfile ? hasAnyProfile(['ADMIN', 'MANAGER']) : true

  // Pipeline overview a partir dos dados carregados (aproximado — soma dos grupos da página atual)
  const pipelineSegments = React.useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0, DEVELOPMENT: 0, DELIVERED: 0, HOMOLOGATION: 0,
      APPROVED: 0, REJECTED: 0, PRODUCTION: 0, CANCELLED: 0,
    }
    deliveryGroups.forEach((g: any) => {
      const s = (g.calculatedDeliveryStatus || g.deliveryStatus) as string
      if (s && counts[s] !== undefined) counts[s] += 1
    })
    const tones: Record<string, any> = {
      PENDING: 'neutral', DEVELOPMENT: 'info', DELIVERED: 'info',
      HOMOLOGATION: 'warning', APPROVED: 'success', REJECTED: 'danger',
      PRODUCTION: 'success', CANCELLED: 'tertiary',
    }
    return Object.keys(counts).map((key) => ({
      key,
      label: STATUS_LABEL[key],
      count: counts[key],
      tone: tones[key],
    }))
  }, [deliveryGroups])

  const pipelineTotal = pipelineSegments.reduce((a, b) => a + b.count, 0)

  const handleSync = async () => {
    try {
      setSyncing(true)
      await (gitSyncService as any).syncAll?.()
      toast.success('Sincronização iniciada')
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const columns = React.useMemo<ColumnDef<DeliveryGroup, any>[]>(() => [
    {
      id: 'id', header: 'ID', size: 70,
      cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.deliveryId ?? '—'}</span>,
    },
    {
      accessorKey: 'taskCode', header: 'Tarefa',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0">
          <span className="text-text-primary truncate max-w-[400px]">{row.original.taskName}</span>
          <span className="font-mono text-xs text-text-tertiary truncate">{row.original.taskCode}</span>
        </div>
      ),
    },
    {
      id: 'status', header: 'Status', size: 200,
      cell: ({ row }) => (
        <DeliveryStatusBadge
          status={row.original.calculatedDeliveryStatus || row.original.deliveryStatus}
          withTime={row.original.updatedAt}
        />
      ),
    },
    {
      id: 'progress', header: 'Itens', size: 110,
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-text-secondary">
          {row.original.completedDeliveries}/{row.original.totalDeliveries}
        </span>
      ),
    },
    {
      accessorKey: 'taskValue', header: () => <span className="block text-right">Valor</span>, size: 110,
      cell: ({ row }) => <span className="block text-right tabular-nums text-text-primary">{brl(row.original.taskValue)}</span>,
    },
    {
      id: '__actions', header: '', size: 80,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/deliveries/task/${row.original.taskId}`)} aria-label="Ver"><Eye /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Mais ações"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate(`/deliveries/task/${row.original.taskId}`)}><Eye />Visualizar</DropdownMenuItem>
              {canCRUD && (
                <DropdownMenuItem onSelect={() => navigate(`/deliveries/group/${row.original.taskId}/edit`)}><Pencil />Editar grupo</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate, canCRUD])

  const chips: any[] = []
  if (filters.flowType)    chips.push({ key: 'flowType', label: 'Fluxo',  value: FLOW_LABEL[filters.flowType as string] || String(filters.flowType), onRemove: () => setFilter('flowType', '') })
  if (filters.environment) chips.push({ key: 'env',      label: 'Ambiente', value: String(filters.environment), onRemove: () => setFilter('environment', '') })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entregas"
        subtitle={pagination ? `${pagination.totalElements} entrega${pagination.totalElements === 1 ? '' : 's'}` : undefined}
        filters={
          <Select value={filters.flowType || '__all'} onValueChange={(v) => setFilter('flowType', v === '__all' ? '' : v)}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Fluxo: Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Fluxo: Todos</SelectItem>
              <SelectItem value="DESENVOLVIMENTO">Desenvolvimento</SelectItem>
              <SelectItem value="OPERACIONAL">Operacional</SelectItem>
            </SelectContent>
          </Select>
        }
        actions={
          <>
            <Button variant="secondary" leadingIcon={<RefreshCw className={syncing ? 'animate-spin' : ''} />} onClick={handleSync} loading={syncing}>
              Sincronizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" leadingIcon={<Download />}>Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportToExcel().catch(() => {})}>Tudo</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportDeliveriesOnlyToExcel().catch(() => {})}>Só entregas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canCRUD && <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova entrega</Button>}
          </>
        }
      />

      <DeliveryPipelineOverview
        segments={pipelineSegments}
        total={pipelineTotal}
        activeKey={null}
      />

      <div>
        <FilterChipsRow chips={chips} onClearAll={() => clearFilters()} />

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
          <DataTable<DeliveryGroup>
            data={deliveryGroups as any[]}
            columns={columns}
            rowKey={(r) => r.taskId}
            loading={loading}
            error={error}
            selectable
            selection={selection}
            onSelectionChange={setSelection}
            onRowClick={(r) => navigate(`/deliveries/task/${r.taskId}`)}
            pagination={pagination ? {
              page: pagination.currentPage,
              pageSize: pagination.pageSize,
              total: pagination.totalElements,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            } : undefined}
            empty={
              <EmptyState
                icon={<Truck />}
                title="Nenhuma entrega"
                description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie a primeira entrega.'}
                actions={canCRUD && <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova entrega</Button>}
              />
            }
          />
        </div>

        {/* Mobile */}
        <div className="lg:hidden space-y-2">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          {!loading && deliveryGroups.length === 0 && (
            <EmptyState icon={<Truck />} title="Nenhuma entrega" description="Crie a primeira." actions={canCRUD && <Button leadingIcon={<Plus />} onClick={() => navigate('/deliveries/create')}>Nova</Button>} />
          )}
          {!loading && deliveryGroups.map((d: any) => (
            <button
              key={d.taskId}
              onClick={() => navigate(`/deliveries/task/${d.taskId}`)}
              className="w-full text-left rounded-lg border border-border-subtle bg-surface-1 p-4 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-mono text-xs text-text-tertiary shrink-0">#{d.deliveryId ?? '—'}</span>
                <span className="text-sm font-medium tabular-nums text-text-primary shrink-0">{brl(d.taskValue)}</span>
              </div>
              <p className="text-sm text-text-primary mb-1 line-clamp-2">{d.taskName}</p>
              <p className="font-mono text-xs text-text-tertiary mb-2">{d.taskCode}</p>
              <div className="flex items-center justify-between">
                <DeliveryStatusBadge status={d.calculatedDeliveryStatus || d.deliveryStatus} withTime={d.updatedAt} />
                <span className="text-xs text-text-tertiary tabular-nums">{d.completedDeliveries}/{d.totalDeliveries}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.ids.length} entrega(s)?</DialogTitle>
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
    </div>
  )
}

export default DeliveryList
