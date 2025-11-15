import React, { useState, useEffect } from 'react';
import { X, Settings, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useSystemParameters } from '@/hooks/useSystemParameters';
import toast from 'react-hot-toast';

interface SystemParameter {
    id: number;
    name: string;
    value?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ParameterModalProps {
    isOpen: boolean;
    onClose: () => void;
    parameter?: SystemParameter | null;
}

const ParameterModal: React.FC<ParameterModalProps> = ({ isOpen, onClose, parameter }) => {
    const { createSystemParameter, updateSystemParameter } = useSystemParameters();
    const isEditing = !!parameter;

    const [formData, setFormData] = useState({
        name: '',
        value: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isEditing && parameter) {
            setFormData({
                name: parameter.name || '',
                value: parameter.value || '',
                description: parameter.description || ''
            });
        } else {
            setFormData({
                name: '',
                value: '',
                description: ''
            });
        }
        setErrors({});
    }, [parameter, isEditing, isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        } else if (formData.name.length > 255) {
            newErrors.name = 'Nome deve ter no máximo 255 caracteres';
        }

        if (formData.description && formData.description.length > 255) {
            newErrors.description = 'Descrição deve ter no máximo 255 caracteres';
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
            const data = {
                name: formData.name.trim(),
                value: formData.value.trim() || undefined,
                description: formData.description.trim() || undefined
            };

            if (isEditing && parameter) {
                await updateSystemParameter(parameter.id, data);
            } else {
                await createSystemParameter(data);
            }

            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar parâmetro:', error);
            toast.error(error.message || 'Erro ao salvar parâmetro');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {isEditing ? 'Editar Parâmetro' : 'Novo Parâmetro'}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {isEditing ? 'Altere os dados do parâmetro' : 'Preencha os dados do novo parâmetro'}
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
                    {/* Nome */}
                    <div>
                        <Input
                            label="Nome"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            error={errors.name}
                            placeholder="Ex: whatsapp.api.url"
                            required
                            maxLength={255}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use notação com pontos para organizar (ex: whatsapp.api.token)
                        </p>
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor
                        </label>
                        <textarea
                            value={formData.value}
                            onChange={(e) => handleInputChange('value', e.target.value)}
                            rows={4}
                            placeholder="Valor do parâmetro (texto livre)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <Input
                            label="Descrição"
                            type="text"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            error={errors.description}
                            placeholder="Descrição do parâmetro"
                            maxLength={255}
                        />
                    </div>

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-800 font-medium">
                                    Dica de uso
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Parâmetros são úteis para configurações dinâmicas como URLs de APIs, tokens de integração,
                                    flags de funcionalidades, entre outros. Use nomes descritivos e organize por categoria com pontos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
                            disabled={loading}
                        >
                            {isEditing ? 'Salvar Alterações' : 'Criar Parâmetro'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ParameterModal;
