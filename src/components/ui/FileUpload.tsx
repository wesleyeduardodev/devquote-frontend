import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, FileText, Image, Video, Archive, AlertCircle } from 'lucide-react';
import { TaskAttachmentResponse, taskAttachmentService } from '../../services/taskAttachmentService';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface FileUploadProps {
    taskId?: number;
    onUploadSuccess?: (attachments: TaskAttachmentResponse[]) => void;
    onUploadError?: (error: string) => void;
    maxFiles?: number;
    maxFileSize?: number; // in MB
    disabled?: boolean;
    className?: string;
}

interface FileWithPreview {
    file: File;
    id: string;
    error?: string;
    uploading?: boolean;
    uploaded?: boolean;
    attachment?: TaskAttachmentResponse;
}

const FileUpload: React.FC<FileUploadProps> = ({
    taskId,
    onUploadSuccess,
    onUploadError,
    maxFiles = 10,
    maxFileSize = 10, // 10MB default
    disabled = false,
    className = ''
}) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allowedTypes = [
        // Documentos
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        // Imagens
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Vídeos
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        // Arquivos compactados
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];

    const validateFile = (file: File): string | null => {
        if (!allowedTypes.includes(file.type)) {
            return 'Tipo de arquivo não permitido';
        }
        if (file.size > maxFileSize * 1024 * 1024) {
            return `Arquivo muito grande (máx: ${maxFileSize}MB)`;
        }
        return null;
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
        if (file.type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
        if (file.type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) 
            return <Archive className="w-8 h-8 text-yellow-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const addFiles = useCallback((newFiles: File[]) => {
        const validFiles: FileWithPreview[] = [];
        
        for (const file of newFiles) {
            // Check if file already exists
            if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
                toast.error(`Arquivo "${file.name}" já foi adicionado`);
                continue;
            }

            const error = validateFile(file);
            validFiles.push({
                file,
                id: Math.random().toString(36).substr(2, 9),
                error: error || undefined
            });
        }

        if (files.length + validFiles.length > maxFiles) {
            toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
    }, [files, maxFiles]);

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
            // Clear input value to allow selecting same files again
            e.target.value = '';
        }
    };

    const uploadFiles = async () => {
        if (!taskId) {
            toast.error('ID da tarefa é necessário para fazer upload');
            return;
        }

        const validFiles = files.filter(f => !f.error && !f.uploaded);
        if (validFiles.length === 0) {
            toast.error('Nenhum arquivo válido para enviar');
            return;
        }

        setUploading(true);

        try {
            // Mark files as uploading
            setFiles(prev => prev.map(f => 
                !f.error && !f.uploaded ? { ...f, uploading: true } : f
            ));

            const filesToUpload = validFiles.map(f => f.file);
            const uploadedAttachments = await taskAttachmentService.uploadFiles(taskId, filesToUpload);

            // Mark files as uploaded
            setFiles(prev => prev.map(f => {
                if (!f.error && !f.uploaded) {
                    const attachment = uploadedAttachments.find(a => 
                        a.originalFileName === f.file.name
                    );
                    return { ...f, uploading: false, uploaded: true, attachment };
                }
                return f;
            }));

            toast.success(`${uploadedAttachments.length} arquivo(s) enviado(s) com sucesso!`);
            onUploadSuccess?.(uploadedAttachments);

        } catch (error: any) {
            console.error('Error uploading files:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erro ao fazer upload dos arquivos';
            toast.error(errorMessage);
            onUploadError?.(errorMessage);

            // Reset uploading state
            setFiles(prev => prev.map(f => ({ ...f, uploading: false })));
        } finally {
            setUploading(false);
        }
    };

    const clearFiles = () => {
        setFiles([]);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Drop Zone */}
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }
                    ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                        <p className="text-lg font-medium text-gray-700">
                            {isDragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                        </p>
                        <p className="text-sm text-gray-500">
                            Máximo {maxFiles} arquivos, {maxFileSize}MB cada
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            PDF, Word, Excel, Imagens, Vídeos, Arquivos compactados
                        </p>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled}
                />
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                            Arquivos Selecionados ({files.length})
                        </h4>
                        <button
                            onClick={clearFiles}
                            className="text-sm text-gray-500 hover:text-red-600"
                            disabled={uploading}
                        >
                            Limpar todos
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {files.map((fileItem) => (
                            <div
                                key={fileItem.id}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border
                                    ${fileItem.error 
                                        ? 'border-red-200 bg-red-50' 
                                        : fileItem.uploaded 
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200 bg-gray-50'
                                    }
                                `}
                            >
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    {getFileIcon(fileItem.file)}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {fileItem.file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(fileItem.file.size)}
                                        </p>
                                        {fileItem.error && (
                                            <p className="text-xs text-red-600 flex items-center mt-1">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                {fileItem.error}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {fileItem.uploading && <LoadingSpinner size="sm" />}
                                    {fileItem.uploaded && (
                                        <span className="text-green-600 text-sm">✓ Enviado</span>
                                    )}
                                    <button
                                        onClick={() => removeFile(fileItem.id)}
                                        className="text-gray-400 hover:text-red-600"
                                        disabled={fileItem.uploading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    {taskId && files.some(f => !f.error && !f.uploaded) && (
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={uploadFiles}
                                disabled={uploading || disabled}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {uploading && <LoadingSpinner size="sm" />}
                                <span>
                                    {uploading ? 'Enviando...' : `Enviar ${files.filter(f => !f.error && !f.uploaded).length} arquivo(s)`}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileUpload;