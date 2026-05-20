import * as React from 'react'
import { Plus, Pencil, Trash2, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { useNotificationConfigs, NotificationConfigType, NotificationType } from '@/hooks/useNotificationConfigs'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { DataTable, DataTableBulkBar } from '@/components/ui-v2/DataTable'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import NotificationModal from './NotificationModal'

interface NotificationConfig {
  id: number
  configType: NotificationConfigType
  notificationType: NotificationType
  useRequesterContact: boolean
  primaryEmail?: string
  primaryPhone?: string
  copyEmails: string[]
  phoneNumbers: string[]
}

const CONFIG_TYPE_LABELS: Record<string, string> = {
  NOTIFICACAO_DADOS_TAREFA: 'Dados da Tarefa',
  NOTIFICACAO_ORCAMENTO_TAREFA: 'Orçamento da Tarefa',
  NOTIFICACAO_ENTREGA: 'Entrega',
  NOTIFICACAO_FATURAMENTO: 'Faturamento',
}

const CHANNEL_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  EMAIL:    { label: 'E-mail',   icon: Mail },
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare },
  SMS:      { label: 'SMS',      icon: Smartphone },
}

const NotificationList: React.FC = () => {
  const { isAdmin } = useAuth() as any
  const {
    notificationConfigs, pagination, loading, error,
    deleteNotificationConfig, deleteBulkNotificationConfigs,
    setPage, setPageSize,
  } = useNotificationConfigs({ size: 25 })

  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: 'one' | 'bulk'; ids: number[] } | null>(null)
  const [editingId, setEditingId] = React.useState<number | 'new' | null>(null)

  const selectedIds = React.useMemo(
    () => Object.keys(selection).filter((k) => selection[k]).map((k) => Number(k)),
    [selection]
  )

  const columns = React.useMemo<ColumnDef<NotificationConfig, any>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 70,
      cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span>,
    },
    {
      accessorKey: 'configType',
      header: 'Configuração',
      cell: ({ row }) => (
        <span className="text-text-primary font-medium">
          {CONFIG_TYPE_LABELS[row.original.configType] || row.original.configType}
        </span>
      ),
    },
    {
      accessorKey: 'notificationType',
      header: 'Canal',
      size: 130,
      cell: ({ row }) => {
        const meta = CHANNEL_META[row.original.notificationType] || { label: row.original.notificationType, icon: Bell }
        const Icon = meta.icon
        return (
          <Badge variant="info" size="sm"><Icon className="size-3" />{meta.label}</Badge>
        )
      },
    },
    {
      id: 'primary',
      header: 'Destinatário principal',
      cell: ({ row }) => {
        const r = row.original
        if (r.useRequesterContact) return <span className="text-text-secondary italic">Contato do solicitante</span>
        return <span className="text-text-secondary truncate">{r.primaryEmail || r.primaryPhone || '—'}</span>
      },
    },
    {
      id: 'copies',
      header: 'Cópia',
      size: 110,
      cell: ({ row }) => {
        const r = row.original
        const total = (r.copyEmails?.length || 0) + (r.phoneNumbers?.length || 0)
        return <span className="text-xs text-text-tertiary tabular-nums">{total > 0 ? `+${total}` : '—'}</span>
      },
    },
    {
      id: '__actions',
      header: 'Ações',
      size: 110,
      meta: { align: 'center' },
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

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle={pagination ? `${pagination.totalElements} configuraç${pagination.totalElements === 1 ? 'ão' : 'ões'}` : undefined}
        actions={isAdmin?.() && (
          <Button leadingIcon={<Plus />} onClick={() => setEditingId('new')}>Nova configuração</Button>
        )}
      />

      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelection({})}
        actions={isAdmin?.() && (
          <Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDelete({ kind: 'bulk', ids: selectedIds })}>
            Excluir
          </Button>
        )}
      />

      <div className="hidden lg:block">
        <DataTable<NotificationConfig>
          data={notificationConfigs as any[]}
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
              icon={<Bell />}
              title="Nenhuma configuração"
              description="Crie uma configuração para enviar notificações automáticas."
              actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => setEditingId('new')}>Nova</Button>}
            />
          }
        />
      </div>

      <div className="lg:hidden space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {!loading && notificationConfigs.length === 0 && (
          <EmptyState icon={<Bell />} title="Nenhuma configuração" description="Crie a primeira." actions={isAdmin?.() && <Button leadingIcon={<Plus />} onClick={() => setEditingId('new')}>Nova</Button>} />
        )}
        {!loading && notificationConfigs.map((n: any) => {
          const meta = CHANNEL_META[n.notificationType] || { label: n.notificationType, icon: Bell }
          const Icon = meta.icon
          return (
            <div key={n.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
              <button onClick={() => setEditingId(n.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-text-primary truncate">{CONFIG_TYPE_LABELS[n.configType] || n.configType}</span>
                  <Badge variant="info" size="sm"><Icon className="size-3" />{meta.label}</Badge>
                </div>
                <div className="text-xs text-text-secondary truncate">
                  {n.useRequesterContact ? <em>Contato do solicitante</em> : (n.primaryEmail || n.primaryPhone || '—')}
                </div>
              </button>
              <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
                <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(n.id)} aria-label="Editar" title="Editar"><Pencil /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete({ kind: 'one', ids: [n.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
              </div>
            </div>
          )
        })}
      </div>

      {editingId !== null && (
        <NotificationModal
          isOpen={true}
          onClose={() => setEditingId(null)}
          notification={editingId === 'new' ? null : (notificationConfigs.find((n: any) => n.id === editingId) as any)}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDelete?.kind === 'bulk' ? `${confirmDelete.ids.length} configurações` : 'configuração'}?</DialogTitle>
            <DialogDescription>Notificações deixarão de ser enviadas para os destinatários afetados.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                try {
                  if (confirmDelete.kind === 'bulk') await deleteBulkNotificationConfigs(confirmDelete.ids)
                  else await deleteNotificationConfig(confirmDelete.ids[0])
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

export default NotificationList
