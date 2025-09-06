import React, { useState, useEffect } from 'react';
import { Download, Trash2, File, FileText, Image, Archive, Music, Video, AlertTriangle, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { attachmentService } from '@/services/attachmentService';
import { TaskAttachment } from '@/types/attachments';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import toast from 'react-hot-toast';

interface AttachmentListProps {
    taskId?: number;
    refreshTrigger?: number;
    className?: string;
    forceExpanded?: boolean;
}

const AttachmentList: React.FC<AttachmentListProps> = ({ 
    taskId, 
    refreshTrigger = 0,
    className = '',
    forceExpanded = false
}) => {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(forceExpanded);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        attachment: TaskAttachment | null;
    }>({ isOpen: false, attachment: null });

    useEffect(() => {
        fetchAttachments();
    }, [taskId, refreshTrigger]);

    const fetchAttachments = async () => {
        if (!taskId || taskId <= 0) {
            setAttachments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await attachmentService.getTaskAttachments(taskId);
            setAttachments(data.filter(attachment => !attachment.excluded));
        } catch (error) {
            toast.error('Erro ao carregar arquivos anexados');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (attachment: TaskAttachment) => {
        try {
            const blob = await attachmentService.downloadAttachment(attachment.id);
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.originalFileName;
            
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Arquivo baixado com sucesso!');
        } catch (error) {
            toast.error('Erro ao baixar arquivo');
        }
    };

    const handleDeleteClick = (attachment: TaskAttachment) => {
        setDeleteModal({ isOpen: true, attachment });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.attachment) return;

        try {
            setDeletingId(deleteModal.attachment.id);
            await attachmentService.deleteAttachment(deleteModal.attachment.id);
            setAttachments(prev => prev.filter(a => a.id !== deleteModal.attachment!.id));
            toast.success('Arquivo excluído com sucesso!');
            setDeleteModal({ isOpen: false, attachment: null });
        } catch (error) {
            toast.error('Erro ao excluir arquivo');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, attachment: null });
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith('image/')) {
            return <Image className="w-4 h-4 text-green-500" />;
        }
        if (contentType.startsWith('video/')) {
            return <Video className="w-4 h-4 text-red-500" />;
        }
        if (contentType.startsWith('audio/')) {
            return <Music className="w-4 h-4 text-purple-500" />;
        }
        if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) {
            return <FileText className="w-4 h-4 text-blue-500" />;
        }
        if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('archive')) {
            return <Archive className="w-4 h-4 text-yellow-500" />;
        }
        return <File className="w-4 h-4 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Renderização do cabeçalho colapsável
    const renderHeader = () => {
        const attachmentCount = loading ? '...' : attachments.length;
        const statusText = loading ? 'Carregando...' : 
                          attachments.length === 0 ? 'Nenhum arquivo anexado' :
                          attachments.length === 1 ? '1 arquivo anexado' :
                          `${attachments.length} arquivos anexados`;

        return (
            <div 
                className={`border border-gray-200 rounded-lg cursor-pointer transition-all ${className}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Anexos</span>
                            <span className="text-xs text-gray-500">({attachmentCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{statusText}</span>
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Se não está expandido E não é forceExpanded, mostra apenas o cabeçalho
    if (!isExpanded && !forceExpanded) {
        return renderHeader();
    }

    // Se está expandido, mostra conteúdo completo
    if (loading) {
        return (
            <div className={`border border-gray-200 rounded-lg ${className}`}>
                <div 
                    className="px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsExpanded(false)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Anexos</span>
                            <span className="text-xs text-gray-500">(...)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Carregando...</span>
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center py-6">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-gray-600 text-sm">Carregando arquivos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`${forceExpanded ? '' : 'border border-gray-200 rounded-lg'} ${className}`}>
            {!forceExpanded && (
                <div 
                    className="px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsExpanded(false)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Anexos</span>
                            <span className="text-xs text-gray-500">({attachments.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                                {attachments.length === 0 ? 'Nenhum arquivo anexado' :
                                 attachments.length === 1 ? '1 arquivo anexado' :
                                 `${attachments.length} arquivos anexados`}
                            </span>
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Conteúdo quando não há anexos */}
            {attachments.length === 0 ? (
                <div className="text-center py-6">
                    <File className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-4">Nenhum arquivo anexado</p>
                    <p className="text-xs text-gray-400">
                        Faça upload de documentos, planilhas, imagens ou outros arquivos relacionados à tarefa
                    </p>
                </div>
            ) : (
                /* Lista de anexos */
                <>
                    <div className="divide-y divide-gray-200">
                        {attachments.map((attachment) => (
                            <div key={attachment.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            {getFileIcon(attachment.contentType)}
                                        </div>
                                        
                                        <div className="ml-3 flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {attachment.originalFileName}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>{formatFileSize(attachment.fileSize)}</span>
                                                <span>•</span>
                                                <span>Enviado em {formatDate(attachment.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDownload(attachment)}
                                            className="p-2 hover:bg-blue-100 hover:text-blue-600"
                                            title="Baixar arquivo"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(attachment)}
                                            disabled={deletingId === attachment.id}
                                            className="p-2 hover:bg-red-100 hover:text-red-600"
                                            title="Excluir arquivo"
                                        >
                                            {deletingId === attachment.id ? (
                                                <LoadingSpinner size="xs" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {attachments.length > 5 && (
                        <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                Muitos arquivos anexados. Considere organizar em pastas compactadas.
                            </p>
                        </div>
                    )}
                </>
            )}
            
            {/* Modal de Confirmação de Exclusão */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Excluir Arquivo"
                itemName={deleteModal.attachment?.originalFileName}
                isDeleting={deletingId === deleteModal.attachment?.id}
            />
        </div>
    );
};

export default AttachmentList;