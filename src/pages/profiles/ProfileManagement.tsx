import * as React from 'react'
import { Plus, Pencil, Trash2, Users, Shield, UserPlus, Search } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'

import { useUserManagement } from '@/hooks/useUserManagement'
import { useProfiles } from '@/hooks/useProfiles'
import type { Profile, UserProfile, CreateProfileRequest, UpdateProfileRequest } from '@/types/profile'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Badge } from '@/components/ui-v2/Badge'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { Avatar } from '@/components/ui-v2/Avatar'
import { Card } from '@/components/ui-v2/Card'
import { StatusDot } from '@/components/ui-v2/StatusDot'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui-v2/Tabs'
import { DataTable, DataTableBulkBar } from '@/components/ui-v2/DataTable'
import { Input } from '@/components/ui-v2/Input'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import ProfileModal from './ProfileModal'
import UserAssignmentModal from './UserAssignmentModal'

const ProfileManagement: React.FC = () => {
  const usersHook = useUserManagement({ size: 25 })
  const profilesHook = useProfiles(true, { size: 25 })

  const [tab, setTab] = React.useState<'users' | 'profiles'>('users')
  const [userSearch, setUserSearch] = React.useState('')
  const [userSelection, setUserSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDeleteUser, setConfirmDeleteUser] = React.useState<{ ids: number[] } | null>(null)

  const [profileSearch, setProfileSearch] = React.useState('')
  const [profileSelection, setProfileSelection] = React.useState<Record<string, boolean>>({})
  const [confirmDeleteProfile, setConfirmDeleteProfile] = React.useState<{ ids: number[] } | null>(null)

  const [profileModal, setProfileModal] = React.useState<{ profile: Profile | null; isEditing: boolean } | null>(null)
  const [userAssignment, setUserAssignment] = React.useState<Profile | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => usersHook.setFilter('username', userSearch), 300)
    return () => clearTimeout(t)
  }, [userSearch])

  React.useEffect(() => {
    const t = setTimeout(() => profilesHook.setFilter('name', profileSearch), 300)
    return () => clearTimeout(t)
  }, [profileSearch])

  const selectedUserIds = React.useMemo(
    () => Object.keys(userSelection).filter((k) => userSelection[k]).map((k) => Number(k)),
    [userSelection]
  )
  const selectedProfileIds = React.useMemo(
    () => Object.keys(profileSelection).filter((k) => profileSelection[k]).map((k) => Number(k)),
    [profileSelection]
  )

  /* ============= KPIs ============= */
  const totalUsers   = usersHook.pagination?.totalElements ?? usersHook.users.length
  const activeUsers  = usersHook.users.filter((u) => u.enabled).length
  const adminCount   = usersHook.users.filter((u) => u.profiles?.some((p) => p.code === 'ADMIN')).length
  const userCount    = usersHook.users.filter((u) => u.profiles?.some((p) => p.code === 'USER')).length

  /* ============= USER COLUMNS ============= */
  const userColumns = React.useMemo<ColumnDef<UserProfile, any>[]>(() => [
    { accessorKey: 'id', header: 'ID', size: 60, cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span> },
    {
      accessorKey: 'username', header: 'Usuário',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={row.original.name || row.original.username} size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-text-primary font-medium truncate">{row.original.name || row.original.username}</span>
            <span className="text-xs text-text-tertiary truncate">{row.original.username} · {row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'profiles', header: 'Perfis', size: 180,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.profiles?.length > 0 ? row.original.profiles.map((p) => (
            <Badge key={p.id} variant="info" size="sm">{p.name}</Badge>
          )) : <span className="text-text-tertiary text-xs">—</span>}
        </div>
      ),
    },
    {
      accessorKey: 'enabled', header: 'Status', size: 110,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <StatusDot tone={row.original.enabled ? 'success' : 'neutral'} />
          <span className="text-text-primary">{row.original.enabled ? 'Ativo' : 'Inativo'}</span>
        </span>
      ),
    },
    {
      id: '__actions', header: 'Ações', size: 90, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setConfirmDeleteUser({ ids: [row.original.id] })}
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

  /* ============= PROFILE COLUMNS ============= */
  const profileColumns = React.useMemo<ColumnDef<Profile, any>[]>(() => [
    { accessorKey: 'id', header: 'ID', size: 60, cell: ({ row }) => <span className="font-mono text-xs text-text-tertiary">#{row.original.id}</span> },
    {
      accessorKey: 'name', header: 'Perfil',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-medium">{row.original.name}</span>
            <Badge variant="neutral" size="sm">{row.original.code}</Badge>
          </div>
          {row.original.description && (
            <span className="text-xs text-text-tertiary truncate max-w-md">{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'level', header: 'Nível', size: 80,
      cell: ({ row }) => <span className="tabular-nums text-text-secondary">{row.original.level}</span>,
    },
    {
      accessorKey: 'userCount', header: 'Usuários', size: 100,
      cell: ({ row }) => <span className="tabular-nums text-text-secondary">{row.original.userCount ?? 0}</span>,
    },
    {
      accessorKey: 'active', header: 'Status', size: 110,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <StatusDot tone={row.original.active ? 'success' : 'neutral'} />
          <span className="text-text-primary">{row.original.active ? 'Ativo' : 'Inativo'}</span>
        </span>
      ),
    },
    {
      id: '__actions', header: 'Ações', size: 140, meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon-sm" variant="ghost" onClick={() => setProfileModal({ profile: row.original, isEditing: true })} aria-label="Editar" title="Editar"><Pencil /></Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setUserAssignment(row.original)} aria-label="Atribuir usuários" title="Atribuir usuários"><UserPlus /></Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setConfirmDeleteProfile({ ids: [row.original.id] })}
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

  const handleProfileSave = async (data: CreateProfileRequest | UpdateProfileRequest) => {
    try {
      if (profileModal?.isEditing && profileModal.profile) {
        await profilesHook.updateProfile(profileModal.profile.id, data as UpdateProfileRequest)
      } else {
        await profilesHook.createProfile(data as CreateProfileRequest)
      }
      setProfileModal(null)
    } catch (e) {
      // erro já tratado pelo hook
    }
  }

  return (
    <div>
      <PageHeader
        title="Perfis & Usuários"
        subtitle="Gerencie usuários do sistema e seus perfis de acesso"
        actions={
          tab === 'users' ? (
            <Button leadingIcon={<Plus />} disabled>Novo usuário</Button>
          ) : (
            <Button leadingIcon={<Plus />} onClick={() => setProfileModal({ profile: null, isEditing: false })}>Novo perfil</Button>
          )
        }
      />

      {/* KPIs (somente quando estiver na aba usuários) */}
      {tab === 'users' && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Card className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Total</p>
            <p className="mt-1 text-xl font-semibold text-text-primary tabular-nums">{totalUsers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Ativos</p>
            <p className="mt-1 text-xl font-semibold text-success-strong tabular-nums">{activeUsers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Admins</p>
            <p className="mt-1 text-xl font-semibold text-text-primary tabular-nums">{adminCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Usuários</p>
            <p className="mt-1 text-xl font-semibold text-text-primary tabular-nums">{userCount}</p>
          </Card>
        </section>
      )}

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="mb-4">
          <TabsTrigger value="users"><Users className="size-3.5" />Usuários{usersHook.pagination && <Badge variant="neutral" size="sm" className="ml-1">{usersHook.pagination.totalElements}</Badge>}</TabsTrigger>
          <TabsTrigger value="profiles"><Shield className="size-3.5" />Perfis{profilesHook.pagination && <Badge variant="neutral" size="sm" className="ml-1">{profilesHook.pagination.totalElements}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="mb-3 w-full sm:w-[280px]">
            <Input
              leadingIcon={<Search />}
              placeholder="Buscar por username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          <DataTableBulkBar
            selectedCount={selectedUserIds.length}
            onClear={() => setUserSelection({})}
            actions={<Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDeleteUser({ ids: selectedUserIds })}>Excluir</Button>}
          />

          <div className="hidden lg:block">
            <DataTable<UserProfile>
              data={usersHook.users}
              columns={userColumns}
              rowKey={(r) => r.id}
              loading={usersHook.loading}
              error={usersHook.error}
              selectable
              selection={userSelection}
              onSelectionChange={setUserSelection}
              pagination={usersHook.pagination ? {
                page: usersHook.pagination.currentPage,
                pageSize: usersHook.pagination.pageSize,
                total: usersHook.pagination.totalElements,
                onPageChange: usersHook.setPage,
                onPageSizeChange: usersHook.setPageSize,
              } : undefined}
              empty={<EmptyState icon={<Users />} title="Nenhum usuário" description="Crie usuários para que possam acessar o sistema." />}
            />
          </div>

          <div className="lg:hidden space-y-2">
            {usersHook.loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            {!usersHook.loading && usersHook.users.length === 0 && <EmptyState icon={<Users />} title="Nenhum usuário" description="—" />}
            {!usersHook.loading && usersHook.users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name || u.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">{u.name || u.username}</span>
                      <StatusDot tone={u.enabled ? 'success' : 'neutral'} />
                    </div>
                    <p className="text-xs text-text-tertiary truncate">{u.email}</p>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDeleteUser({ ids: [u.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
                </div>
                {u.profiles?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {u.profiles.map((p) => <Badge key={p.id} variant="info" size="sm">{p.name}</Badge>)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profiles">
          <div className="mb-3 w-full sm:w-[280px]">
            <Input
              leadingIcon={<Search />}
              placeholder="Buscar perfil..."
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
            />
          </div>
          <DataTableBulkBar
            selectedCount={selectedProfileIds.length}
            onClear={() => setProfileSelection({})}
            actions={<Button size="sm" variant="danger" leadingIcon={<Trash2 />} onClick={() => setConfirmDeleteProfile({ ids: selectedProfileIds })}>Excluir</Button>}
          />

          <div className="hidden lg:block">
            <DataTable<Profile>
              data={profilesHook.profiles}
              columns={profileColumns}
              rowKey={(r) => r.id}
              loading={profilesHook.loading}
              error={profilesHook.error}
              selectable
              selection={profileSelection}
              onSelectionChange={setProfileSelection}
              onRowClick={(r) => setProfileModal({ profile: r, isEditing: true })}
              pagination={profilesHook.pagination ? {
                page: profilesHook.pagination.currentPage,
                pageSize: profilesHook.pagination.pageSize,
                total: profilesHook.pagination.totalElements,
                onPageChange: profilesHook.setPage,
                onPageSizeChange: profilesHook.setPageSize,
              } : undefined}
              empty={<EmptyState icon={<Shield />} title="Nenhum perfil" description="Crie perfis para organizar permissões." actions={<Button leadingIcon={<Plus />} onClick={() => setProfileModal({ profile: null, isEditing: false })}>Novo perfil</Button>} />}
            />
          </div>

          <div className="lg:hidden space-y-2">
            {profilesHook.loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            {!profilesHook.loading && profilesHook.profiles.length === 0 && <EmptyState icon={<Shield />} title="Nenhum perfil" description="Crie o primeiro." actions={<Button leadingIcon={<Plus />} onClick={() => setProfileModal({ profile: null, isEditing: false })}>Novo</Button>} />}
            {!profilesHook.loading && profilesHook.profiles.map((p) => (
              <div key={p.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
                <button onClick={() => setProfileModal({ profile: p, isEditing: true })} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-text-primary truncate">{p.name}</span>
                      <Badge variant="neutral" size="sm">{p.code}</Badge>
                    </div>
                    <StatusDot tone={p.active ? 'success' : 'neutral'} />
                  </div>
                  {p.description && <p className="text-xs text-text-tertiary line-clamp-2">{p.description}</p>}
                  <p className="text-xs text-text-secondary mt-1">{p.userCount ?? 0} usuário(s) · nível {p.level}</p>
                </button>
                <div className="flex items-center justify-end gap-0.5 mt-3 pt-3 border-t border-border-subtle">
                  <Button size="icon-sm" variant="ghost" onClick={() => setProfileModal({ profile: p, isEditing: true })} aria-label="Editar" title="Editar"><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setUserAssignment(p)} aria-label="Atribuir usuários" title="Atribuir usuários"><UserPlus /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDeleteProfile({ ids: [p.id] })} aria-label="Excluir" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modais existentes integrados */}
      {profileModal && (
        <ProfileModal
          profile={profileModal.profile}
          isEditing={profileModal.isEditing}
          onSave={handleProfileSave}
          onClose={() => setProfileModal(null)}
        />
      )}
      {userAssignment && (
        <UserAssignmentModal
          profile={userAssignment}
          users={usersHook.users}
          onClose={() => { setUserAssignment(null); usersHook.refetch?.(); profilesHook.refetch?.() }}
        />
      )}

      {/* Confirms */}
      <Dialog open={!!confirmDeleteUser} onOpenChange={(o) => { if (!o) setConfirmDeleteUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDeleteUser?.ids.length === 1 ? 'usuário' : `${confirmDeleteUser?.ids.length} usuários`}?</DialogTitle>
            <DialogDescription>O acesso ao sistema será revogado imediatamente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteUser(null)}>Cancelar</Button>
            <Button variant="danger" onClick={async () => {
              if (!confirmDeleteUser) return
              try {
                if (confirmDeleteUser.ids.length === 1) await usersHook.deleteUser(confirmDeleteUser.ids[0])
                else await usersHook.deleteBulkUsers(confirmDeleteUser.ids)
                setUserSelection({})
              } catch (e: any) {
                toast.error(e?.message || 'Falha ao excluir')
              } finally {
                setConfirmDeleteUser(null)
              }
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteProfile} onOpenChange={(o) => { if (!o) setConfirmDeleteProfile(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {confirmDeleteProfile?.ids.length === 1 ? 'perfil' : `${confirmDeleteProfile?.ids.length} perfis`}?</DialogTitle>
            <DialogDescription>Usuários atribuídos a este perfil perderão as permissões correspondentes.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteProfile(null)}>Cancelar</Button>
            <Button variant="danger" onClick={async () => {
              if (!confirmDeleteProfile) return
              try {
                if (confirmDeleteProfile.ids.length === 1) await profilesHook.deleteProfile(confirmDeleteProfile.ids[0])
                else await profilesHook.deleteBulkProfiles(confirmDeleteProfile.ids)
                setProfileSelection({})
              } catch (e: any) {
                toast.error(e?.message || 'Falha ao excluir')
              } finally {
                setConfirmDeleteProfile(null)
              }
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfileManagement
