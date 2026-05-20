import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { useRequesters } from '@/hooks/useRequesters'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { Input } from '@/components/ui-v2/Input'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'

interface Requester { id: number; name: string; email?: string; phone?: string }

const RequesterList: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth() as any
  const {
    requesters, pagination, loading, error, filters,
    deleteRequester, deleteBulkRequesters,
    setPage, setPageSize, setFilter, clearFilters,
  } = useRequesters({ size: 25 })

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

  const columns = React.useMemo<ColumnDef<Requester, any>[]>(() => [
    {
      accessorKey: 'id',
      header: () => <span>ID</span>,
      size: 70,
      cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: () => <span>Solicitante</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-text-primary font-medium">{row.original.name}</span>
          {row.original.email && (
            <a href={`mailto:${row.original.email}`} className="text-xs text-text-secondary hover:text-accent transition-colors" onClick={(e) => e.stopPropagation()}>
              {row.original.email}
            </a>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: () => <span>Telefone</span>,
      size: 160,
      cell: ({ row }) => (
        <span className="text-text-secondary tabular-nums">{row.original.phone || '—'}</span>
      ),
    },
    {
      id: '__actions',
      header: 'Ações',
      size: 110,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/requesters/${row.original.id}/edit`)} aria-label="Editar" title="Editar">
            <Pencil />
          </Button>
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
        </div>
      ),
    },
  ], [navigate])

  const chips = []
  if (filters.name) chips.push({ key: 'name', label: 'Nome', value: String(filters.name), onRemove: () => { setSearch(''); setFilter('name', '') } })
  if (filters.email) chips.push({ key: 'email', label: 'Email', value: String(filters.email), onRemove: () => setFilter('email', '') })
  if (filters.phone) chips.push({ key: 'phone', label: 'Telefone', value: String(filters.phone), onRemove: () => setFilter('phone', '') })

  return (
    <div>
      <PageHeader
        title="Solicitantes"
        subtitle={pagination ? `${pagination.totalElements} solicitante${pagination.totalElements === 1 ? '' : 's'}` : undefined}
        filters={
          <div className="w-full sm:w-[260px]">
            <Input
              leadingIcon={<Search />}
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
        actions={isAdmin?.() && (
          <Button leadingIcon={<Plus />} onClick={() => navigate('/requesters/create')}>
            Novo solicitante
          </Button>
        )}
      />

      <FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={
          isAdmin?.() && (
            <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>
              Excluir selecionados
            </Button>
          )
        }
      />

      {/* Desktop */}
      <div className="hidden lg:block">
        <DataTable<Requester>
          data={requesters as any[]}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => navigate(`/requesters/${r.id}/edit`)}
          pagination={pagination ? {
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalElements,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          } : undefined}
          empty={
            <EmptyState
              icon={<Users />}
              title="Nenhum solicitante"
              description={chips.length > 0 ? 'Ajuste os filtros ou limpe-os.' : 'Crie o primeiro solicitante para começar.'}
              actions={isAdmin?.() && (
                <Button leadingIcon={<Plus />} onClick={() => navigate('/requesters/create')}>Novo solicitante</Button>
              )}
            />
          }
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        {!loading && requesters.length === 0 && (
          <EmptyState
            icon={<Users />}
            title="Nenhum solicitante"
            description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro.'}
            actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/requesters/create')}>Novo</Button>}
          />
        )}
        {!loading && requesters.map((r: any) => (
          <div key={r.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
            <button onClick={() => navigate(`/requesters/${r.id}/edit`)} className="w-full text-left">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-text-primary truncate">{r.name}</span>
                <Badge size="sm">#{r.id}</Badge>
              </div>
              {r.email && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary truncate">
                  <Mail className="size-3 shrink-0" />{r.email}
                </div>
              )}
              {r.phone && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                  <Phone className="size-3 shrink-0" />{r.phone}
                </div>
              )}
            </button>
            <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
              <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/requesters/${r.id}/edit`)} aria-label="Editar" title="Editar"><Pencil /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ kind: 'one', ids: [r.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} solicitantes` : 'solicitante'}?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  if (confirmDelete.kind === 'bulk') await deleteBulkRequesters(confirmDelete.ids)
                  else await deleteRequester(confirmDelete.ids[0])
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

export default RequesterList
