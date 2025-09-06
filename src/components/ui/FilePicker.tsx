import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, FileText, Image, Video, Archive, AlertCircle } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';

interface FilePickerProps {
    files?: File[];
    onFilesChange?: (files: File[]) => void;
    maxFiles?: number;
    maxFileSize?: number; // in MB
    disabled?: boolean;
    className?: string;
}

interface FileWithPreview {
    file: File;
    id: string;
    error?: string;
}

const FilePicker: React.FC<FilePickerProps> = ({
    files = [],
    onFilesChange,
    maxFiles = 10,
    maxFileSize = 10, // 10MB default
    disabled = false,
    className = ''
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
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
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Vídeos
        'video/mp4',
        'video/webm',
        'video/ogg',
        // Áudio
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        // Compactados
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];

    const validateFile = useCallback((file: File): string | null => {
        if (!allowedTypes.includes(file.type)) {
            return `Tipo de arquivo não permitido: ${file.type}`;
        }
        
        const maxSizeBytes = maxFileSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return `Arquivo muito grande. Tamanho máximo: ${maxFileSize}MB`;
        }
        
        return null;
    }, [maxFileSize]);

    const addFiles = useCallback((newFiles: File[]) => {
        const currentCount = files.length;
        const availableSlots = maxFiles - currentCount;
        
        if (newFiles.length > availableSlots) {
            toast.error(`Máximo de ${maxFiles} arquivos permitidos. Você pode adicionar apenas mais ${availableSlots} arquivo(s).`);
            newFiles = newFiles.slice(0, availableSlots);
        }

        const validFiles: File[] = [];
        const errors: string[] = [];

        newFiles.forEach(file => {
            // Verificar se o arquivo já existe
            const exists = files.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );
            
            if (exists) {
                errors.push(`"${file.name}" já foi selecionado`);
                return;
            }

            const error = validateFile(file);
            if (error) {
                errors.push(`"${file.name}": ${error}`);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            toast.error(errors.join('\n'));
        }

        if (validFiles.length > 0) {
            const updatedFiles = [...files, ...validFiles];
            onFilesChange?.(updatedFiles);
            toast.success(`${validFiles.length} arquivo(s) selecionado(s)`);
        }
    }, [files, maxFiles, validateFile, onFilesChange]);

    const removeFile = useCallback((fileToRemove: File) => {
        const updatedFiles = files.filter(file => file !== fileToRemove);
        onFilesChange?.(updatedFiles);
    }, [files, onFilesChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        if (disabled) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, [addFiles, disabled]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
            // Clear input value to allow selecting same files again
            e.target.value = '';
        }
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith('image/')) {
            return <Image className="w-4 h-4 text-green-500" />;
        }
        if (contentType.startsWith('video/')) {
            return <Video className="w-4 h-4 text-red-500" />;
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

    return (
        <div className={className}>
            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : disabled
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
            >
                <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-400' : 'text-gray-400'}`} />
                <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900">
                        {disabled 
                            ? 'Upload desabilitado'
                            : isDragOver 
                            ? 'Solte os arquivos aqui'
                            : 'Arraste arquivos aqui ou'
                        }
                    </p>
                    {!disabled && (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                className="mt-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Selecionar arquivos
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                                Máximo {maxFiles} arquivos, {maxFileSize}MB cada
                            </p>
                        </>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    disabled={disabled}
                />
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                            Arquivos selecionados ({files.length})
                        </h4>
                        {!disabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onFilesChange?.([])}
                                className="text-xs text-gray-500 hover:text-red-600"
                            >
                                Remover todos
                            </Button>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                        {getFileIcon(file.type)}
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => removeFile(file)}
                                        className="ml-3 p-1 hover:bg-red-100 hover:text-red-600 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilePicker;