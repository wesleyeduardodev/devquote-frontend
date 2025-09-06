import React, { useState, useCallback } from 'react';
import { Upload, File, Trash2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

interface LocalFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

interface LocalFileUploadProps {
  files: LocalFile[];
  onFilesChange: (files: LocalFile[]) => void;
  className?: string;
  readOnly?: boolean;
}

export function LocalFileUpload({
  files,
  onFilesChange,
  className = '',
  readOnly = false
}: LocalFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateFile = (file: File): boolean => {
    // Tamanho máximo: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return false;
    }

    // Tipos permitidos
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    return allowedTypes.includes(file.type);
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const validFiles: LocalFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(fileList).forEach(file => {
      if (!validateFile(file)) {
        invalidFiles.push(file.name);
        return;
      }

      // Verificar se já existe
      const exists = files.some(f => f.name === file.name && f.size === file.size);
      if (exists) {
        return;
      }

      validFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type
      });
    });

    if (invalidFiles.length > 0) {
      alert(`Arquivos inválidos: ${invalidFiles.join(', ')}\n\nTipo não permitido ou tamanho maior que 10MB`);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (readOnly) return;
    
    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
      handleFiles(fileList);
    }
  }, [handleFiles, readOnly]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) {
      setIsDragOver(true);
    }
  }, [readOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      handleFiles(fileList);
    }
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  }, [files, onFilesChange]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const hasFiles = files.length > 0;

  return (
    <div className={className}>
      {/* Header colapsável */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <File className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Anexos</span>
          <span className="text-xs text-gray-400">(clique para gerenciar)</span>
          {hasFiles && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {files.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? 'Recolher' : 'Expandir'}
        </button>
      </div>

      {/* Conteúdo expansível */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Upload Area */}
          {!readOnly && (
            <div
              className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${
                isDragOver ? 'border-blue-400 bg-blue-50' : 'hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Faça upload de documentos, planilhas, imagens ou outros arquivos relacionados à entrega
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Arraste e solte arquivos aqui ou clique para selecionar (máx. 10MB por arquivo)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="local-file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.zip,.rar,.7z"
              />
              <label
                htmlFor="local-file-input"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Selecionar Arquivos
              </label>
            </div>
          )}

          {/* Lista de arquivos */}
          <div className="space-y-2">
            {hasFiles ? (
              <>
                <h4 className="text-sm font-medium text-gray-900">
                  Arquivos Selecionados ({files.length})
                </h4>
                {files.map((localFile) => (
                  <div key={localFile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{localFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(localFile.size)}
                        </p>
                      </div>
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeFile(localFile.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remover arquivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {readOnly 
                    ? 'Nenhum anexo encontrado' 
                    : 'Nenhum arquivo selecionado ainda. Faça upload de seus primeiros arquivos acima.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}