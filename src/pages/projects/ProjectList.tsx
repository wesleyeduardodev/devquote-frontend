import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, MoreHorizontal, FolderKanban, ExternalLink, Github } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar, FilterChipsRow } from '@/components/ui-v2/DataTable'
import { Input } from '@/components/ui-v2/Input'
import { Search } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui-v2/DropdownMenu'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'

interface Project { id: number; name: string; repositoryUrl?: string }

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth() as any
  const {
    projects, pagination, loading, error, filters,
    deleteProject, deleteBulkProjects,
    setPage, setPageSize, setFilter, clearFilters,
  } = useProjects({ size: 25 })

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

  const columns = React.useMemo<ColumnDef<Project, any>[]>(() => [
    {
      accessorKey: 'id',
      header: () => <span>ID</span>,
      size: 70,
      cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: () => <span>Projeto</span>,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-text-primary font-medium">{row.original.name}</span>
          {row.original.repositoryUrl && (
            <a
              href={row.original.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 truncate max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="size-3" />{row.original.repositoryUrl.replace(/^https?:\/\//, '')}
              <ExternalLink className="size-3 opacity-60" />
            </a>
          )}
        </div>
      ),
    },
    {
      id: '__actions',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/projects/${row.original.id}/edit`)} aria-label="Editar">
            <Pencil />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Mais ações"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate(`/projects/${row.original.id}/edit`)}><Pencil />Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onSelect={() => setConfirmDelete({ kind: 'one', ids: [row.original.id] })}>
                <Trash2 />Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate])

  const chips: any[] = []
  if (filters.name) chips.push({ key: 'name', label: 'Nome', value: String(filters.name), onRemove: () => { setSearch(''); setFilter('name', '') } })
  if (filters.repositoryUrl) chips.push({ key: 'repo', label: 'Repo', value: String(filters.repositoryUrl), onRemove: () => setFilter('repositoryUrl', '') })

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle={pagination ? `${pagination.totalElements} projeto${pagination.totalElements === 1 ? '' : 's'}` : undefined}
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
          <Button leadingIcon={<Plus />} onClick={() => navigate('/projects/create')}>Novo projeto</Button>
        )}
      />

      <FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={isAdmin?.() && (
          <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>
            Excluir selecionados
          </Button>
        )}
      />

      <div className="hidden lg:block">
        <DataTable<Project>
          data={projects as any[]}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          selectable
          selection={selection}
          onSelectionChange={setSelection}
          onRowClick={(r) => navigate(`/projects/${r.id}/edit`)}
          pagination={pagination ? {
            page: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalElements,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          } : undefined}
          empty={
            <EmptyState
              icon={<FolderKanban />}
              title="Nenhum projeto"
              description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro projeto.'}
              actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/projects/create')}>Novo projeto</Button>}
            />
          }
        />
      </div>

      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        {!loading && projects.length === 0 && (
          <EmptyState
            icon={<FolderKanban />}
            title="Nenhum projeto"
            description={chips.length > 0 ? 'Ajuste os filtros.' : 'Crie o primeiro.'}
            actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => navigate('/projects/create')}>Novo</Button>}
          />
        )}
        {!loading && projects.map((p: any) => (
          <button
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}/edit`)}
            className="w-full text-left rounded-lg border border-border-subtle bg-surface-1 p-4 hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-medium text-text-primary truncate">{p.name}</span>
              <Badge size="sm">#{p.id}</Badge>
            </div>
            {p.repositoryUrl && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary truncate">
                <Github className="size-3 shrink-0" />{p.repositoryUrl.replace(/^https?:\/\//, '')}
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} projetos` : 'projeto'}?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  if (confirmDelete.kind === 'bulk') await deleteBulkProjects(confirmDelete.ids)
                  else await deleteProject(confirmDelete.ids[0])
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

export default ProjectList
