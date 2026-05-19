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
    useRequesterContact: boolean;
    primaryEmail?: string;
    primaryPhone?: string;
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
        useRequesterContact: false,
        primaryEmail: '',
        primaryPhone: '',
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
                useRequesterContact: notification.useRequesterContact,
                primaryEmail: notification.primaryEmail || '',
                primaryPhone: notification.primaryPhone || '',
                copyEmails: notification.copyEmails.length > 0 ? notification.copyEmails : [''],
                phoneNumbers: notification.phoneNumbers.length > 0 ? notification.phoneNumbers : ['']
            });
        } else {
            setFormData({
                configType: NotificationConfigType.NOTIFICACAO_DADOS_TAREFA,
                notificationType: NotificationType.EMAIL,
                useRequesterContact: false,
                primaryEmail: '',
                primaryPhone: '',
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


        if (formData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
            newErrors.primaryEmail = 'Formato de e-mail inválido';
        }

        formData.copyEmails.forEach((email, index) => {
            if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                newErrors[`copyEmail_${index}`] = 'Formato de e-mail inválido';
            }
        });

        if ((formData.notificationType === NotificationType.SMS || formData.notificationType === NotificationType.WHATSAPP) && !formData.useRequesterContact) {
            if (!formData.primaryPhone?.trim()) {
                newErrors.primaryPhone = 'Destinatário principal é obrigatório';
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
                useRequesterContact: formData.useRequesterContact,
                primaryEmail: formData.primaryEmail.trim() || undefined,
                primaryPhone: formData.primaryPhone.trim() || undefined,
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
            <div className="bg-surface-1 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                    <div className="flex items-center">
                        <div className="p-2 bg-accent-soft rounded-lg mr-3">
                            <Bell className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary">
                                {isEditing ? 'Editar Configuração' : 'Nova Configuração'}
                            </h2>
                            <p className="text-sm text-text-secondary">
                                {isEditing ? 'Altere os dados da configuração' : 'Preencha os dados da nova configuração'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-tertiary" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Tipo de Configuração */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Tipo de Configuração *
                        </label>
                        <select
                            value={formData.configType}
                            onChange={(e) => handleInputChange('configType', e.target.value as NotificationConfigType)}
                            className="w-full p-3 border border-border-strong rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                            disabled={isEditing}
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
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Tipo de Notificação *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {notificationTypeOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleInputChange('notificationType', option.value)}
                                    disabled={isEditing}
                                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                                        formData.notificationType === option.value
                                            ? 'border-primary-500 bg-accent-soft text-accent-hover'
                                            : 'border-border-strong hover:border-text-tertiary'
                                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {option.icon}
                                    <span className="font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Checkbox para usar destinatário do solicitante */}
                    <div>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.useRequesterContact}
                                onChange={(e) => handleInputChange('useRequesterContact', e.target.checked)}
                                className="rounded border-border-strong text-accent focus:ring-accent"
                            />
                            <span className="text-sm font-medium text-text-secondary">
                                {formData.notificationType === NotificationType.EMAIL
                                    ? 'Usar e-mail do solicitante da tarefa'
                                    : 'Usar destinatário do solicitante da tarefa'
                                }
                            </span>
                        </label>
                    </div>

                    {/* E-mail Principal (apenas para EMAIL e quando não usar solicitante) */}
                    {formData.notificationType === NotificationType.EMAIL && !formData.useRequesterContact && (
                        <div>
                            <Input
                                label="E-mail Principal"
                                type="email"
                                value={formData.primaryEmail}
                                onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                                error={errors.primaryEmail}
                                placeholder="email@exemplo.com"
                            />
                        </div>
                    )}

                    {/* Destinatário Principal (apenas para SMS/WhatsApp e quando não usar solicitante) */}
                    {(formData.notificationType === NotificationType.SMS || formData.notificationType === NotificationType.WHATSAPP) && !formData.useRequesterContact && (
                        <div>
                            <Input
                                label="Destinatário Principal"
                                type="text"
                                value={formData.primaryPhone}
                                onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                                error={errors.primaryPhone}
                                placeholder="Número ou ID do grupo"
                            />
                            <p className="text-xs text-text-tertiary mt-1">
                                Número: 5511999999999 ou Grupo: 120363012345678901@g.us
                            </p>
                        </div>
                    )}

                    {/* E-mail Principal (quando usar solicitante - apenas informativo) */}
                    {formData.notificationType === NotificationType.EMAIL && formData.useRequesterContact && (
                        <div className="bg-info-soft border border-accent/20 rounded-lg p-3">
                            <p className="text-sm text-accent">
                                <strong>E-mail principal:</strong> Será usado o e-mail do solicitante vinculado à tarefa
                            </p>
                        </div>
                    )}

                    {/* Destinatário Principal (quando usar solicitante - apenas informativo) */}
                    {(formData.notificationType === NotificationType.SMS || formData.notificationType === NotificationType.WHATSAPP) && formData.useRequesterContact && (
                        <div className="bg-info-soft border border-accent/20 rounded-lg p-3">
                            <p className="text-sm text-accent">
                                <strong>Destinatário principal:</strong> Será usado o telefone do solicitante vinculado à tarefa
                            </p>
                        </div>
                    )}


                    {/* E-mails em Cópia (apenas para EMAIL) */}
                    {formData.notificationType === NotificationType.EMAIL && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
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

                    {/* Destinatários em Cópia (para WhatsApp e SMS) */}
                    {(formData.notificationType === NotificationType.WHATSAPP || formData.notificationType === NotificationType.SMS) && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Destinatários em Cópia
                            </label>
                            <p className="text-xs text-text-tertiary mb-2">
                                Números de telefone ou IDs de grupos
                            </p>
                            <div className="space-y-2">
                                {formData.phoneNumbers.map((phone, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => updatePhoneField(index, e.target.value)}
                                                placeholder="5511999999999 ou 120363012345678901@g.us"
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
                                    Adicionar Destinatário
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
                    <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
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