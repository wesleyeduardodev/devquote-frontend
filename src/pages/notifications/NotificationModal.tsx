import React, { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, Plus, Trash2, Mail, MessageSquare, Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useNotificationConfigs, NotificationConfigType, NotificationType } from '@/hooks/useNotificationConfigs';
import toast from 'react-hot-toast';

interface NotificationConfig {
    id: number;
    configType: NotificationConfigType;
    notificationType: NotificationType;
    primaryEmail?: string;
    copyEmails: string[];
    phoneNumbers: string[];
    createdAt?: string;
    updatedAt?: string;
}

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification?: NotificationConfig | null;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notification }) => {
    const { createNotificationConfig, updateNotificationConfig } = useNotificationConfigs();
    const isEditing = !!notification;

    const [formData, setFormData] = useState({
        configType: NotificationConfigType.NOTIFICACAO_DADOS_TAREFA,
        notificationType: NotificationType.EMAIL,
        primaryEmail: '',
        copyEmails: [''],
        phoneNumbers: ['']
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isEditing && notification) {
            setFormData({
                configType: notification.configType,
                notificationType: notification.notificationType,
                primaryEmail: notification.primaryEmail || '',
                copyEmails: notification.copyEmails.length > 0 ? notification.copyEmails : [''],
                phoneNumbers: notification.phoneNumbers.length > 0 ? notification.phoneNumbers : ['']
            });
        } else {
            setFormData({
                configType: NotificationConfigType.NOTIFICACAO_DADOS_TAREFA,
                notificationType: NotificationType.EMAIL,
                primaryEmail: '',
                copyEmails: [''],
                phoneNumbers: ['']
            });
        }
        setErrors({});
    }, [notification, isEditing, isOpen]);

    const configTypeOptions = [
        { value: NotificationConfigType.NOTIFICACAO_DADOS_TAREFA, label: 'Dados da Tarefa' },
        { value: NotificationConfigType.NOTIFICACAO_ORCAMENTO_TAREFA, label: 'Orçamento da Tarefa' },
        { value: NotificationConfigType.NOTIFICACAO_ENTREGA, label: 'Entrega' },
        { value: NotificationConfigType.NOTIFICACAO_FATURAMENTO, label: 'Faturamento' }
    ];

    const notificationTypeOptions = [
        { value: NotificationType.EMAIL, label: 'E-mail', icon: <Mail className="w-4 h-4" /> },
        { value: NotificationType.WHATSAPP, label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
        { value: NotificationType.SMS, label: 'SMS', icon: <Smartphone className="w-4 h-4" /> }
    ];

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Email obrigatório apenas para tipo EMAIL
        if (formData.notificationType === NotificationType.EMAIL && !formData.primaryEmail.trim()) {
            newErrors.primaryEmail = 'E-mail principal é obrigatório para notificações por e-mail';
        }

        // Validar formato de email se preenchido
        if (formData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
            newErrors.primaryEmail = 'Formato de e-mail inválido';
        }

        // Validar emails em cópia
        formData.copyEmails.forEach((email, index) => {
            if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                newErrors[`copyEmail_${index}`] = 'Formato de e-mail inválido';
            }
        });

        // Telefones obrigatórios para SMS/WhatsApp
        if ((formData.notificationType === NotificationType.SMS || formData.notificationType === NotificationType.WHATSAPP)) {
            const validPhones = formData.phoneNumbers.filter(phone => phone.trim());
            if (validPhones.length === 0) {
                newErrors.phoneNumbers = 'Pelo menos um telefone é obrigatório para este tipo de notificação';
            }
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
                configType: formData.configType,
                notificationType: formData.notificationType,
                primaryEmail: formData.primaryEmail.trim() || undefined,
                copyEmails: formData.copyEmails.filter(email => email.trim()).map(email => email.trim()),
                phoneNumbers: formData.phoneNumbers.filter(phone => phone.trim()).map(phone => phone.trim())
            };

            if (isEditing && notification) {
                await updateNotificationConfig(notification.id, data);
            } else {
                await createNotificationConfig(data);
            }

            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar configuração:', error);
            toast.error(error.message || 'Erro ao salvar configuração de notificação');
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

    const addEmailField = () => {
        setFormData(prev => ({
            ...prev,
            copyEmails: [...prev.copyEmails, '']
        }));
    };

    const removeEmailField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            copyEmails: prev.copyEmails.filter((_, i) => i !== index)
        }));
    };

    const updateEmailField = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            copyEmails: prev.copyEmails.map((email, i) => i === index ? value : email)
        }));
        // Limpar erro específico deste campo
        const errorKey = `copyEmail_${index}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
    };

    const addPhoneField = () => {
        setFormData(prev => ({
            ...prev,
            phoneNumbers: [...prev.phoneNumbers, '']
        }));
    };

    const removePhoneField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
        }));
    };

    const updatePhoneField = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            phoneNumbers: prev.phoneNumbers.map((phone, i) => i === index ? value : phone)
        }));
        if (errors.phoneNumbers) {
            setErrors(prev => ({ ...prev, phoneNumbers: '' }));
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
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {isEditing ? 'Editar Configuração' : 'Nova Configuração'}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {isEditing ? 'Altere os dados da configuração' : 'Preencha os dados da nova configuração'}
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
                    {/* Tipo de Configuração */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Configuração *
                        </label>
                        <select
                            value={formData.configType}
                            onChange={(e) => handleInputChange('configType', e.target.value as NotificationConfigType)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={isEditing} // Não permite alterar o tipo ao editar
                        >
                            {configTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Notificação */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Notificação *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {notificationTypeOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleInputChange('notificationType', option.value)}
                                    disabled={isEditing} // Não permite alterar o tipo ao editar
                                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                                        formData.notificationType === option.value
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {option.icon}
                                    <span className="font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* E-mail Principal (apenas para EMAIL) */}
                    {formData.notificationType === NotificationType.EMAIL && (
                        <div>
                            <Input
                                label="E-mail Principal"
                                type="email"
                                value={formData.primaryEmail}
                                onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                                error={errors.primaryEmail}
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>
                    )}

                    {/* E-mails em Cópia (apenas para EMAIL) */}
                    {formData.notificationType === NotificationType.EMAIL && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                E-mails em Cópia
                            </label>
                            <div className="space-y-2">
                                {formData.copyEmails.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => updateEmailField(index, e.target.value)}
                                                placeholder="email@exemplo.com"
                                                error={errors[`copyEmail_${index}`]}
                                            />
                                        </div>
                                        {formData.copyEmails.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeEmailField(index)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addEmailField}
                                    className="mt-2"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar E-mail
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Telefones (para WhatsApp e SMS) */}
                    {(formData.notificationType === NotificationType.WHATSAPP || formData.notificationType === NotificationType.SMS) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefones *
                            </label>
                            <div className="space-y-2">
                                {formData.phoneNumbers.map((phone, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => updatePhoneField(index, e.target.value)}
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                        {formData.phoneNumbers.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removePhoneField(index)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addPhoneField}
                                    className="mt-2"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Telefone
                                </Button>
                                {errors.phoneNumbers && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{errors.phoneNumbers}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                            {isEditing ? 'Salvar Alterações' : 'Criar Configuração'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NotificationModal;