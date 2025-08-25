import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Settings,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Lock
} from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useUserManagement } from '@/hooks/useUserManagement';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Profile, CreateProfileRequest, UpdateProfileRequest, UserProfile } from '@/types/profile';
import { CreateUserDto, UpdateUserDto } from '@/types/user';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ProfileModal from './ProfileModal';
import UserAssignmentModal from './UserAssignmentModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProfileManagement = () => {
  const { hasProfile, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const { profiles, loading: profilesLoading, error: profilesError, createProfile, updateProfile, deleteProfile } = useProfiles();
  const { 
    users, 
    loading: usersLoading, 
    error: usersError, 
    createUser, 
    updateUser, 
    deleteUser,
    refetch: refetchUsers 
  } = useUserManagement(0, 1000);
  
  const [activeTab, setActiveTab] = useState<'users' | 'profiles'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for creating user
  const [userForm, setUserForm] = useState<CreateUserDto>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    profileCodes: []
  });

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSaveProfile = async (data: CreateProfileRequest | UpdateProfileRequest) => {
    try {
      if (isEditing && selectedProfile) {
        await updateProfile(selectedProfile.id, data as UpdateProfileRequest);
        toast.success('Perfil atualizado com sucesso');
      } else {
        await createProfile(data as CreateProfileRequest);
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
  
  // DEBUG FUNCTION - TEMPORARY
  const debugAuth = async () => {
    try {
      const token = localStorage.getItem('auth.token');
      console.log('Token exists:', !!token);
      
      const response = await fetch('http://localhost:8080/api/auth/debug', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('=== DEBUG AUTH RESPONSE ===');
      console.log('Authorities:', data.authorities);
      console.log('Has ROLE_ADMIN:', data.hasRoleAdmin);
      console.log('Full response:', data);
      alert('Check console for debug info');
    } catch (error) {
      console.error('Debug error:', error);
    }
  };
  
  const handleSaveUser = async () => {
    try {
      if (isEditing && selectedUser) {
        const updateData: UpdateUserDto = {
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          enabled: true,
          profileCodes: userForm.profileCodes
        };
        await updateUser(selectedUser.id, updateData);
        toast.success('Usuário atualizado com sucesso');
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

  const getStatusColor = (active: boolean) => {
    return active ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (active: boolean) => {
    return active ? CheckCircle : XCircle;
  };

  // Check if user has ADMIN profile
  useEffect(() => {
    // Wait for auth to load before checking permissions
    if (!authLoading && user && !hasProfile('ADMIN')) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      navigate('/');
    }
  }, [hasProfile, navigate, authLoading, user]);
  
  const loading = profilesLoading || usersLoading || authLoading;
  const error = profilesError || usersError;
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="mt-4 text-gray-600">Carregando perfis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar perfis</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários e Perfis</h1>
              <p className="text-gray-600 mt-2">
                Gerencie usuários, perfis e suas permissões
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={debugAuth} className="bg-red-600 hover:bg-red-700">
                DEBUG AUTH
              </Button>
              {activeTab === 'users' ? (
                <Button onClick={handleCreateUser} className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              ) : (
                <Button onClick={handleCreateProfile} className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Perfil
                </Button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'profiles'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Perfis
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar perfis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </Card>
          </div>

          {/* Stats */}
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeTab === 'users' ? users.length : profiles.length}
              </div>
              <div className="text-sm text-gray-600">
                Total {activeTab === 'users' ? 'Usuários' : 'Perfis'}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeTab === 'users' 
                  ? users.filter(u => u.enabled).length
                  : profiles.filter(p => p.active).length
                }
              </div>
              <div className="text-sm text-gray-600">
                {activeTab === 'users' ? 'Usuários' : 'Perfis'} Ativos
              </div>
            </div>
          </Card>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'users' ? (
          /* Users Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                    <CheckCircle className={`w-5 h-5 ${
                      user.enabled ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Email */}
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </div>

                  {/* Profiles */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Perfis:</p>
                    <div className="flex flex-wrap gap-1">
                      {user.profiles && user.profiles.length > 0 ? (
                        user.profiles.map((profile) => (
                          <span
                            key={profile.id}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                          >
                            {profile.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">Nenhum perfil atribuído</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? 'Tente ajustar os termos da sua busca'
                    : 'Comece criando seu primeiro usuário'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateUser}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Primeiro Usuário
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Profiles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => {
            const StatusIcon = getStatusIcon(profile.active);
            return (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                        <p className="text-sm text-gray-500">{profile.code}</p>
                      </div>
                    </div>
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(profile.active)}`} />
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {profile.description || 'Sem descrição'}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Nível:</span>
                      <span className="font-medium">{profile.level}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usuários:</span>
                      <span className="font-medium">{profile.userCount || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageUsers(profile)}
                      className="flex-1"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Usuários
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProfile(profile)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProfile(profile)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!!(profile.userCount && profile.userCount > 0)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )}

        {activeTab === 'profiles' && filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum perfil encontrado' : 'Nenhum perfil cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Tente ajustar os termos da sua busca'
                : 'Comece criando seu primeiro perfil de usuário'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateProfile}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Perfil
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          profile={selectedProfile}
          isEditing={isEditing}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showUserModal && selectedProfile && (
        <UserAssignmentModal
          profile={selectedProfile}
          users={users}
          onClose={() => setShowUserModal(false)}
        />
      )}
      
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
            
            {!isEditing && (
              <>
                <Input
                  label="Nome de Usuário"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  placeholder="joaosilva"
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="joao@example.com"
                  required
                />
                
                <Input
                  label="Senha"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </>
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
    </div>
  );
};

export default ProfileManagement;