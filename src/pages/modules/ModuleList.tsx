import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Boxes, Search } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { useModules } from '@/hooks/useModules'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { Input } from '@/components/ui-v2/Input'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'

interface Module { id: number; name: string }

const ModuleList: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth() as any
  const {
    modules, pagination, loading, error, filters,
    deleteModule, deleteBulkModules,
    setPage, setPageSize, setFilter, clearFilters,
  } = useModules({ size: 25 })

  const [search, setSearch] = React.useState((filters.name as string) || '')
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'one' | 'bulk'; ids: number[] } | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setFilter('name', search), 300)
    return () => clearTimeout(t)
  }, [search])

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const columns = React.useMemo<ColumnDef<Module, any>[]>(() => [
    {
      accessorKey: 'id',
      header: () => <span>ID</span>,
      size: 70,
      cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: () => <span>Módulo</span>,
      cell: ({ row }) => <span className="text-text-primary font-medium">{row.original.name}</span>,
    },
    {
      id: '__actions',
      header: 'Ações',
      size: 110,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/modules/${row.original.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ kind: 'one', ids: [row.original.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
        </div>
      ),
    },
  ], [navigate])

  const chips: any[] = []
  if (filters.name) chips.push({ key: 'name', label: 'Nome', value: String(filters.name), onRemove: () => { setSearch(''); setFilter('name', '') } })

  return (
    <div>
      <PageHeader
        title="Módulos"
        subtitle={pagination ? `${pagination.totalElements} módulo${pagination.totalElements === 1 ? '' : 's'}` : undefined}
        filters={
          <div className="w-full sm:w-[260px]">
            <Input leadingIcon={<Search />} placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
        actions={isAdmin?.() && (
          <Button leadingIcon={<Plus />} onClick={() => navigate('/modules/create')}>Novo módulo</Button>
        )}
      />

      <FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={isAdmin?.() && (
          <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>Excluir selecionados</Button>
        )}
      />

      <div className="hidden lg:block">
        <DataTable<Module>
          data={modules as any[]}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => navigate(`/modules/${r.id}/edit`)}
          pagination={pagination ? {
            page: pagination.currentPage, pageSize: pagination.pageSize, total: pagination.totalElements,
            onPageChange: setPage, onPageSizeChange: setPageSize,
          } : undefined}
          empty={
            <EmptyState
              icon={<Boxes />}
              title="Nenhum módulo"
              description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro módulo.'}
              actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/modules/create')}>Novo módulo</Button>}
            />
          }
        />
      </div>

      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {!loading && modules.length === 0 && (
          <EmptyState icon={<Boxes />} title="Nenhum módulo" description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro.'} actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/modules/create')}>Novo</Button>} />
        )}
        {!loading && modules.map((m: any) => (
          <div key={m.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
            <button onClick={() => navigate(`/modules/${m.id}/edit`)} className="w-full text-left">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-text-primary truncate">{m.name}</span>
                <Badge size="sm">#{m.id}</Badge>
              </div>
            </button>
            <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
              <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/modules/${m.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ kind: 'one', ids: [m.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} módulos` : 'módulo'}?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Tarefas que usam este módulo ficarão sem módulo.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={async () => {
              if (!confirmDelete) return
              try {
                if (confirmDelete.kind === 'bulk') await deleteBulkModules(confirmDelete.ids)
                else await deleteModule(confirmDelete.ids[0])
                setSelection({})
              } finally { setConfirmDelete(null) }
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ModuleList
