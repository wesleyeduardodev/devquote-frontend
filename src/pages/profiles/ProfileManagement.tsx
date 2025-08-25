import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Settings,
  Filter
} from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import BulkDeleteModal from '@/components/ui/BulkDeleteModal';
import { Profile, UserProfile } from '@/types/profile';
import { CreateUserDto, UpdateUserDto } from '@/types/user';
import toast from 'react-hot-toast';

const ProfileManagement = () => {
  const { hasProfile, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  
  // Verifica se o usuário tem permissão de escrita (apenas ADMIN)
  const isAdmin = hasProfile('ADMIN');
  const isReadOnly = !isAdmin; // MANAGER e USER têm apenas leitura

  // Removido hook de perfis - agora apenas gerencia usuários

  // User management hooks
  const {
    users,
    loading: usersLoading,
    error: usersError,
    createUser,
    updateUser,
    deleteUser,
    deleteBulkUsers,
    pagination: usersPagination,
    setPage: setUsersPage,
    setPageSize: setUsersPageSize,
    setSorting: setUsersSorting,
    setFilter: setUsersFilter,
    clearFilters: clearUsersFilters,
    sorting: usersSorting,
    filters: usersFilters,
    refetch: refetchUsers
  } = useUserManagement();

  // State management
  // Removido activeTab - agora apenas gerencia usuários
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // Form state for creating user
  const [userForm, setUserForm] = useState<CreateUserDto>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    profileCodes: []
  });

  // Check permissions - permite ADMIN, MANAGER e USER
  useEffect(() => {
    if (!authLoading && user && !hasProfile('ADMIN') && !hasProfile('MANAGER') && !hasProfile('USER')) {
      toast.error('Acesso negado. Você não tem permissão para acessar esta página.');
      navigate('/');
    }
  }, [hasProfile, navigate, authLoading, user]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Selection handlers
  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const items = users;
    const currentPageIds = items.map((item: any) => item.id);
    const allSelected = currentPageIds.every((id: number) => selectedItems.includes(id));

    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const clearSelection = () => setSelectedItems([]);

  const selectionState = useMemo(() => {
    const items = users;
    const currentPageIds = items.map((item: any) => item.id);
    const selectedFromCurrentPage = selectedItems.filter((id) =>
      currentPageIds.includes(id)
    );

    return {
      allSelected:
        currentPageIds.length > 0 &&
        selectedFromCurrentPage.length === currentPageIds.length,
      someSelected:
        selectedFromCurrentPage.length > 0 &&
        selectedFromCurrentPage.length < currentPageIds.length,
      hasSelection: selectedItems.length > 0,
      selectedFromCurrentPage,
    };
  }, [users, selectedItems]);

  // Profile handlers
  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsEditing(false);
    setShowProfileModal(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsEditing(true);
    setShowProfileModal(true);
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (profile.userCount && profile.userCount > 0) {
      toast.error('Não é possível excluir um perfil que possui usuários associados');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o perfil "${profile.name}"?`)) {
      try {
        await deleteProfile(profile.id);
        toast.success('Perfil excluído com sucesso');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveProfile = async (data: any) => {
    try {
      if (isEditing && selectedProfile) {
        await updateProfile(selectedProfile.id, data);
        toast.success('Perfil atualizado com sucesso');
      } else {
        await createProfile(data);
        toast.success('Perfil criado com sucesso');
      }
      setShowProfileModal(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleManageUsers = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowUserModal(true);
  };

  // User handlers
  const handleCreateUser = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      profileCodes: []
    });
    setSelectedUser(null);
    setIsEditing(false);
    setShowCreateUserModal(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileCodes: user.roles || [] // Usa os códigos dos perfis diretamente
    });
    setIsEditing(true);
    setShowCreateUserModal(true);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
      try {
        await deleteUser(user.id);
        toast.success('Usuário excluído com sucesso');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleSaveUser = async () => {
    try {
      if (isEditing && selectedUser) {
        const updateData: UpdateUserDto = {
          username: userForm.username,
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          enabled: true,
          profileCodes: userForm.profileCodes
        };

        // Verifica se está alterando o username do próprio usuário logado
        const isChangingOwnUsername = user?.id === selectedUser.id &&
                                      selectedUser.username !== userForm.username;

        await updateUser(selectedUser.id, updateData);
        toast.success('Usuário atualizado com sucesso');

        // Se alterou o próprio username, faz logout
        if (isChangingOwnUsername) {
          toast.info('Username alterado. Redirecionando para login...');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        await createUser(userForm);
        toast.success('Usuário criado com sucesso');
      }
      setShowCreateUserModal(false);
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBulkUsers(selectedItems);
      const qty = selectedItems.length;
      clearSelection();
      setShowBulkDeleteModal(false);
      toast.success(`${qty} usuário(s) excluído(s) com sucesso`);
    } catch (error) {
      toast.error(`Erro ao excluir usuários selecionados`);
    } finally {
      setIsDeleting(false);
    }
  };

  // User columns - versão completa para ADMIN
  const adminUserColumns: Column<UserProfile>[] = [
    {
      key: 'select',
      title: '',
      width: '50px',
      align: 'center',
      headerRender: () => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectionState.allSelected}
            ref={(input) => {
              if (input) input.indeterminate = selectionState.someSelected;
            }}
            onChange={toggleAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      ),
      render: (item) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedItems.includes(item.id)}
            onChange={() => toggleItem(item.id)}
            className={`w-4 h-4 border-gray-300 rounded focus:ring-blue-500 ${
              user?.id === item.id ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
            }`}
            onClick={(e) => e.stopPropagation()}
            disabled={user?.id === item.id}
            title={user?.id === item.id ? "Você não pode selecionar sua própria conta" : ""}
          />
        </div>
      ),
    },
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (item) => `#${item.id}`,
    },
    {
      key: 'username',
      title: 'Usuário',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (item) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">{item.username}</span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Nome',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (item) => `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-',
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (item) => (
        <a
          href={`mailto:${item.email}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {item.email}
        </a>
      ),
    },
    {
      key: 'profiles',
      title: 'Perfis',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.profiles && item.profiles.length > 0 ? (
            item.profiles.map((profile) => (
              <span
                key={profile.id}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
              >
                {profile.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">Sem perfil</span>
          )}
        </div>
      ),
    },
    {
      key: 'enabled',
      title: 'Status',
      sortable: true,
      align: 'center',
      render: (item) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          item.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.enabled ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Inativo
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Ações',
      align: 'center',
      width: '120px',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditUser(item)}
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteUser(item)}
            title={user?.id === item.id ? "Você não pode excluir sua própria conta" : "Excluir"}
            className={user?.id === item.id
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-600 hover:text-red-800 hover:bg-red-50"}
            disabled={user?.id === item.id}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // User columns - versão somente leitura para MANAGER e USER
  const readOnlyUserColumns: Column<UserProfile>[] = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '80px',
      render: (item) => `#${item.id}`,
    },
    {
      key: 'username',
      title: 'Usuário',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{item.username}</span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Nome',
      sortable: true,
      render: (item) => item.firstName || item.name || '-',
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span>{item.email}</span>
        </div>
      ),
    },
    {
      key: 'profiles',
      title: 'Perfis',
      render: (item) => (
        <div className="flex gap-1 flex-wrap">
          {item.roles?.map((role) => (
            <span
              key={role}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {role === 'ADMIN' ? 'Administrador' : role === 'MANAGER' ? 'Gerente' : 'Usuário'}
            </span>
          )) || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            item.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {item.enabled ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Inativo
            </>
          )}
        </span>
      ),
    },
  ];

  // Escolhe as colunas baseado no perfil do usuário
  const userColumns = isAdmin ? adminUserColumns : readOnlyUserColumns;

  // Profile columns
  const profileColumns: Column<Profile>[] = [
    {
      key: 'select',
      title: '',
      width: '50px',
      align: 'center',
      headerRender: () => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectionState.allSelected}
            ref={(input) => {
              if (input) input.indeterminate = selectionState.someSelected;
            }}
            onChange={toggleAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      ),
      render: (item) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedItems.includes(item.id)}
            onChange={() => toggleItem(item.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (item) => `#${item.id}`,
    },
    {
      key: 'code',
      title: 'Código',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (item) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      title: 'Nome',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (item) => (
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-2 text-blue-500" />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Descrição',
      filterable: true,
      filterType: 'text',
      render: (item) => item.description || '-',
    },
    {
      key: 'level',
      title: 'Nível',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (item) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
          Nível {item.level}
        </span>
      ),
    },
    {
      key: 'userCount',
      title: 'Usuários',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (item) => (
        <span className="inline-flex items-center">
          <Users className="w-4 h-4 mr-1 text-gray-400" />
          {item.userCount || 0}
        </span>
      ),
    },
    {
      key: 'active',
      title: 'Status',
      sortable: true,
      align: 'center',
      render: (item) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.active ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Inativo
            </>
          )}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Criado em',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (item) => formatDate(item.createdAt),
      hideable: true,
    },
    {
      key: 'actions',
      title: 'Ações',
      align: 'center',
      width: '150px',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleManageUsers(item)}
            title="Gerenciar Usuários"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditProfile(item)}
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteProfile(item)}
            title="Excluir"
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            disabled={!!(item.userCount && item.userCount > 0)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const loading = usersLoading || authLoading;
  const error = usersError;

  // Show loading while checking permissions
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Check permissions after auth is loaded
  if (!authLoading && !hasProfile('ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Gerenciamento de Usuários' : 'Visualização de Usuários'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Gerencie usuários e suas permissões' : 'Visualize usuários cadastrados'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button onClick={handleCreateUser} className="flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        )}
      </div>


      {/* Selection bar - apenas para ADMIN */}
      {isAdmin && selectionState.hasSelection && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {selectedItems.length} usuário(s) selecionado(s)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="text-gray-500 hover:text-gray-700"
              >
                Limpar seleção
              </Button>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Selecionados
            </Button>
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Carregando...</span>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-8">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          {(
            <DataTable
              data={users}
              columns={userColumns}
              loading={loading}
              pagination={usersPagination}
              sorting={usersSorting}
              filters={usersFilters}
              onPageChange={setUsersPage}
              onPageSizeChange={setUsersPageSize}
              onSort={setUsersSorting}
              onFilter={setUsersFilter}
              onClearFilters={clearUsersFilters}
              emptyMessage="Nenhum usuário encontrado"
              showColumnToggle={true}
              hiddenColumns={[]}
            />
          )}
        </Card>
      )}

      {/* Modals */}

      {/* Create/Edit User Modal */}
      {showCreateUserModal && (
        <Modal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          title={isEditing ? 'Editar Usuário' : 'Criar Novo Usuário'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome"
                value={userForm.firstName}
                onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                placeholder="João"
                required
              />
              <Input
                label="Sobrenome"
                value={userForm.lastName}
                onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                placeholder="Silva"
                required
              />
            </div>

            <Input
              label="Nome de Usuário"
              value={userForm.username}
              onChange={(e) => setUserForm({...userForm, username: e.target.value})}
              placeholder="joaosilva"
              required
              helpText={isEditing && user?.username === selectedUser?.username ?
                "⚠️ Alterar o username fará logout automático" : ""}
            />

            <Input
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              placeholder="joao@example.com"
              required
            />

            {!isEditing && (
              <Input
                label="Senha"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="••••••••"
                required
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfil
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={userForm.profileCodes?.[0] || ''}
                onChange={(e) => setUserForm({...userForm, profileCodes: e.target.value ? [e.target.value] : []})}
                required
              >
                <option value="">Selecione um perfil</option>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
                <option value="USER">Usuário</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateUserModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveUser}>
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk delete modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedItems.length}
        isDeleting={isDeleting}
        entityName="usuário"
      />
    </div>
  );
};

export default ProfileManagement;
