import * as React from 'react'
import { Plus, Pencil, Trash2, Settings, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { useSystemParameters } from '@/hooks/useSystemParameters'
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
import { SecretMask, isSensitiveParamName } from '@/components/parameters/SecretMask'
import ParameterModal from './ParameterModal'

interface SystemParameter {
  id: number
  name: string
  value?: string
  description?: string
}

function inferCategory(name: string): string {
  if (/WHATSAPP/i.test(name)) return 'WhatsApp'
  if (/EMAIL|MAIL/i.test(name)) return 'E-mail'
  if (/JWT|TOKEN_/i.test(name)) return 'Autenticação'
  if (/AWS|S3/i.test(name)) return 'AWS / S3'
  if (/GITHUB|GIT_/i.test(name)) return 'GitHub'
  if (/CLICKUP/i.test(name)) return 'ClickUp'
  if (/MULTIPART|FILE|UPLOAD/i.test(name)) return 'Upload'
  return 'Geral'
}

const ParameterList: React.FC = () => {
  const { isAdmin } = useAuth() as any
  const {
    systemParameters, pagination, loading, error, filters,
    deleteSystemParameter, deleteBulkSystemParameters,
    setPage, setPageSize, setFilter, clearFilters,
  } = useSystemParameters({ size: 25 })

  const [search, setSearch] = React.useState((filters.name as string) || '')
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'one' | 'bulk'; ids: number[] } | null>(null)
  const [editingId, setEditingId] = React.useState<number | 'new' | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setFilter('name', search), 300)
    return () => clearTimeout(t)
  }, [search])

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const columns = React.useMemo<ColumnDef<SystemParameter, any>[]>(() => [
    { accessorKey: 'id', header: 'ID', size: 60, cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span> },
    {
      accessorKey: 'name',
      header: 'Nome',
      size: 260,
      meta: { wrap: true },
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-text-primary break-all">{row.original.name}</span>
            {isSensitiveParamName(row.original.name) && (
              <Badge variant="warning" size="sm"><AlertTriangle className="size-3" />Sensível</Badge>
            )}
          </div>
          <span className="text-xs text-text-tertiary">{inferCategory(row.original.name)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Valor',
      meta: { wrap: true },
      cell: ({ row }) => (
        <SecretMask
          name={row.original.name}
          value={row.original.value}
          className="font-mono text-xs text-text-secondary break-all whitespace-pre-wrap"
        />
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      meta: { wrap: true },
      cell: ({ row }) => (
        <span className="text-text-secondary break-words">{row.original.description || '—'}</span>
      ),
    },
    {
      id: '__actions', header: 'Ações', size: 110, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(row.original.id)} aria-label="Editar" title="Editar"><Pencil /></Button>
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
  ], [])

  const chips: any[] = []
  if (filters.name) chips.push({ key: 'name', label: 'Nome', value: String(filters.name), onRemove: () => { setSearch(''); setFilter('name', '') } })

  return (
    <div>
      <PageHeader
        title="Parâmetros"
        subtitle={pagination ? `${pagination.totalElements} parâmetro${pagination.totalElements === 1 ? '' : 's'}` : undefined}
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
        actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => setEditingId('new')}>Novo parâmetro</Button>}
      />

      <FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={isAdmin?.() && (
          <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>Excluir</Button>
        )}
      />

      <div className="hidden lg:block">
        <DataTable<SystemParameter>
          data={systemParameters as any[]}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => setEditingId(r.id)}
          pagination={pagination ? {
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalElements,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          } : undefined}
          empty={
            <EmptyState
              icon={<Settings />}
              title="Nenhum parâmetro"
              description={chips.length > 0 ? 'Ajuste os filtros.' : 'Cadastre o primeiro parâmetro do sistema.'}
              actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => setEditingId('new')}>Novo</Button>}
            />
          }
        />
      </div>

      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        {!loading && systemParameters.length === 0 && (
          <EmptyState icon={<Settings />} title="Nenhum parâmetro" description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro.'} actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => setEditingId('new')}>Novo</Button>} />
        )}
        {!loading && systemParameters.map((p: any) => (
          <div key={p.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
            <button onClick={() => setEditingId(p.id)} className="w-full text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-text-primary truncate">{p.name}</span>
                {isSensitiveParamName(p.name) && (
                  <Badge variant="warning" size="sm"><AlertTriangle className="size-3" /></Badge>
                )}
              </div>
              <div className="text-xs text-text-tertiary mb-1">{inferCategory(p.name)}</div>
              <SecretMask name={p.name} value={p.value} className="text-xs font-mono text-text-secondary" />
              {p.description && <div className="text-xs text-text-secondary mt-1 line-clamp-1">{p.description}</div>}
            </button>
            <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
              <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(p.id)} aria-label="Editar" title="Editar"><Pencil /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ kind: 'one', ids: [p.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>

      {editingId !== null && (
        <ParameterModal
          isOpen={true}
          onClose={() => setEditingId(null)}
          parameter={editingId === 'new' ? null : (systemParameters.find((p: any) => p.id === editingId) as any)}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} parâmetros` : 'parâmetro'}?</DialogTitle>
            <DialogDescription>Cuidado: alguns parâmetros afetam o sistema imediatamente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  if (confirmDelete.kind === 'bulk') await deleteBulkSystemParameters(confirmDelete.ids)
                  else await deleteSystemParameter(confirmDelete.ids[0])
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

export default ParameterList
