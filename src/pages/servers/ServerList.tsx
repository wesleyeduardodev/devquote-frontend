import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Server as ServerIcon, Search, ExternalLink } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { useServers } from '@/hooks/useServers'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { Input } from '@/components/ui-v2/Input'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'

interface ServerRow { id: number; name: string; link?: string }

const ServerList: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth() as any
  const {
    servers, pagination, loading, error, filters,
    deleteServer, deleteBulkServers,
    setPage, setPageSize, setFilter, clearFilters,
  } = useServers({ size: 100 })

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

  const columns = React.useMemo<ColumnDef<ServerRow, any>[]>(() => [
    {
      accessorKey: 'id',
      header: () => <span>ID</span>,
      size: 70,
      cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: () => <span>Servidor</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-text-primary font-medium">{row.original.name}</span>
          {row.original.link && (
            <a
              href={row.original.link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 truncate max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.link.replace(/^https?:\/\//, '')}
              <ExternalLink className="size-3 opacity-60" />
            </a>
          )}
        </div>
      ),
    },
    {
      id: '__actions',
      header: 'Ações',
      size: 110,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/servers/${row.original.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
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
        title="Servidores"
        subtitle={pagination ? `${pagination.totalElements} servidor${pagination.totalElements === 1 ? '' : 'es'}` : undefined}
        filters={
          <div className="w-full sm:w-[260px]">
            <Input leadingIcon={<Search />} placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
        actions={isAdmin?.() && (
          <Button leadingIcon={<Plus />} onClick={() => navigate('/servers/create')}>Novo servidor</Button>
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
        <DataTable<ServerRow>
          data={servers as any[]}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => navigate(`/servers/${r.id}/edit`)}
          pagination={pagination ? {
            page: pagination.currentPage, pageSize: pagination.pageSize, total: pagination.totalElements,
            onPageChange: setPage, onPageSizeChange: setPageSize,
          } : undefined}
          empty={
            <EmptyState
              icon={<ServerIcon />}
              title="Nenhum servidor"
              description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro servidor.'}
              actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/servers/create')}>Novo servidor</Button>}
            />
          }
        />
      </div>

      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {!loading && servers.length === 0 && (
          <EmptyState icon={<ServerIcon />} title="Nenhum servidor" description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro.'} actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/servers/create')}>Novo</Button>} />
        )}
        {!loading && servers.map((s: any) => (
          <div key={s.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
            <button onClick={() => navigate(`/servers/${s.id}/edit`)} className="w-full text-left">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-text-primary truncate">{s.name}</span>
                <Badge size="sm">#{s.id}</Badge>
              </div>
              {s.link && (
                <div className="text-xs text-text-secondary truncate">{s.link.replace(/^https?:\/\//, '')}</div>
              )}
            </button>
            <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
              <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/servers/${s.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ kind: 'one', ids: [s.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} servidores` : 'servidor'}?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Tarefas que usam este servidor ficarão sem servidor.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={async () => {
              if (!confirmDelete) return
              try {
                if (confirmDelete.kind === 'bulk') await deleteBulkServers(confirmDelete.ids)
                else await deleteServer(confirmDelete.ids[0])
                setSelection({})
              } finally { setConfirmDelete(null) }
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ServerList
