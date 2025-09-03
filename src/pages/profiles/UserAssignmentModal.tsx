import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Profile, UserProfile, AssignProfileRequest } from '@/types/profile';
import { useUserManagement } from '@/hooks/useUserManagement';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface UserAssignmentModalProps {
  profile: Profile;
  users: UserProfile[];
  onClose: () => void;
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({ profile, users, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<UserProfile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState<number | null>(null);
  const [removeLoading, setRemoveLoading] = useState<number | null>(null);

  useEffect(() => {
    // Fetch users with this profile
    fetchProfileUsers();
  }, [profile]);

  const fetchProfileUsers = async () => {
    try {
      setLoading(true);
      // Get all users and filter those with this profile
      const usersWithProfile = users.filter(user => {
        return user.profiles?.some(p => p.id === profile.id);
      });
      
      const usersWithoutProfile = users.filter(user => 
        !user.profiles?.some(p => p.id === profile.id)
      );

      setAssignedUsers(usersWithProfile);
      setAvailableUsers(usersWithoutProfile);
    } catch (error) {
      console.error('Error fetching profile users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProfile = async (userId: number) => {
    try {
      setAssignLoading(userId);
      const request: AssignProfileRequest = {
        userId,
        profileId: profile.id,
        active: true
      };
      
      await api.post('/permissions/users/profiles', request);
      
      // Move user from available to assigned
      const user = availableUsers.find(u => u.id === userId);
      if (user) {
        setAvailableUsers(prev => prev.filter(u => u.id !== userId));
        setAssignedUsers(prev => [...prev, user]);
      }
      
      toast.success('Perfil atribuído com sucesso');
    } catch (error: any) {
      console.error('Error assigning profile:', error);
      toast.error(error.response?.data?.message || 'Erro ao atribuir perfil');
    } finally {
      setAssignLoading(null);
    }
  };

  const handleRemoveProfile = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja remover este perfil do usuário?')) {
      return;
    }

    try {
      setRemoveLoading(userId);
      await api.delete(`/permissions/users/${userId}/profiles/${profile.id}`);
      
      // Move user from assigned to available
      const user = assignedUsers.find(u => u.id === userId);
      if (user) {
        setAssignedUsers(prev => prev.filter(u => u.id !== userId));
        setAvailableUsers(prev => [...prev, user]);
      }
      
      toast.success('Perfil removido com sucesso');
    } catch (error: any) {
      console.error('Error removing profile:', error);
      toast.error(error.response?.data?.message || 'Erro ao remover perfil');
    } finally {
      setRemoveLoading(null);
    }
  };

  const filteredAssignedUsers = assignedUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const UserCard: React.FC<{ user: UserProfile; isAssigned: boolean }> = ({ user, isAssigned }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{user.name || user.username}</h4>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
        </div>
      </div>
      
      <div className="ml-4">
        {isAssigned ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRemoveProfile(user.id)}
            loading={removeLoading === user.id}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <UserMinus className="w-4 h-4 mr-1" />
            Remover
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => handleAssignProfile(user.id)}
            loading={assignLoading === user.id}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Atribuir
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gerenciar Usuários - {profile.name}
              </h2>
              <p className="text-sm text-gray-600">
                Atribua ou remova usuários deste perfil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200 h-full">
              {/* Assigned Users */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Usuários com este perfil
                  </h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {filteredAssignedUsers.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAssignedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário com este perfil'}
                      </p>
                    </div>
                  ) : (
                    filteredAssignedUsers.map(user => (
                      <UserCard key={user.id} user={user} isAssigned={true} />
                    ))
                  )}
                </div>
              </div>

              {/* Available Users */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Usuários disponíveis
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {filteredAvailableUsers.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os usuários já possuem este perfil'}
                      </p>
                    </div>
                  ) : (
                    filteredAvailableUsers.map(user => (
                      <UserCard key={user.id} user={user} isAssigned={false} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {assignedUsers.length} usuário(s) com o perfil "{profile.name}"
            </p>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAssignmentModal;