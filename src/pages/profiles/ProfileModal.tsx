import React, { useState, useEffect } from 'react';
import { X, Shield, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '@/types/profile';

interface ProfileModalProps {
  profile: Profile | null;
  isEditing: boolean;
  onSave: (data: CreateProfileRequest | UpdateProfileRequest) => Promise<void>;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, isEditing, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    level: 1,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && profile) {
      setFormData({
        code: profile.code,
        name: profile.name,
        description: profile.description || '',
        level: profile.level,
        active: profile.active
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        level: 1,
        active: true
      });
    }
    setErrors({});
  }, [profile, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!isEditing && !formData.code.trim()) {
      newErrors.code = 'Código é obrigatório';
    }

    if (formData.code && !/^[A-Z_]+$/.test(formData.code)) {
      newErrors.code = 'Código deve conter apenas letras maiúsculas e underscore';
    }

    if (formData.level < 1 || formData.level > 100) {
      newErrors.level = 'Nível deve estar entre 1 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const updateData: UpdateProfileRequest = {
          name: formData.name,
          description: formData.description,
          level: formData.level,
          active: formData.active
        };
        await onSave(updateData);
      } else {
        const createData: CreateProfileRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          level: formData.level,
          active: formData.active
        };
        await onSave(createData);
      }
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Edite as informações do perfil' : 'Crie um novo perfil de usuário'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                disabled={isEditing}
                placeholder="ADMIN, MANAGER, USER..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                } ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.code && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.code}
                </div>
              )}
              {isEditing && (
                <p className="mt-1 text-sm text-gray-500">
                  O código não pode ser alterado após a criação
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Administrador, Gerente..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.level}
                onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.level && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.level}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Nível de hierarquia (1 = mais alto, 100 = mais baixo)
              </p>
            </div>

            {/* Active */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Perfil ativo
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Perfis inativos não podem ser atribuídos a usuários
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva as responsabilidades e permissões deste perfil..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;