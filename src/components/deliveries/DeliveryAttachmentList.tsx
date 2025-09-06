import React, { useState, useCallback, useEffect } from 'react';
import { Upload, File, Download, Trash2, ChevronDown, ChevronRight, AlertCircle, X } from 'lucide-react';
import { deliveryAttachmentService, type DeliveryAttachmentResponse } from '../../services/deliveryAttachmentService';
import { deliveryItemAttachmentService, type DeliveryItemAttachmentResponse } from '../../services/deliveryItemAttachmentService';
import { formatFileSize } from '../../utils/formatters';
import toast from 'react-hot-toast';

type AttachmentType = DeliveryAttachmentResponse | DeliveryItemAttachmentResponse;

interface AttachmentListProps {
  deliveryId?: number;
  deliveryItemId?: number;
  refreshTrigger?: number;
  className?: string;
  forceExpanded?: boolean;
  readOnly?: boolean;
}

export function DeliveryAttachmentList({
  deliveryId,
  deliveryItemId,
  refreshTrigger = 0,
  className = '',
  forceExpanded = false,
  readOnly = false
}: AttachmentListProps) {
  const [attachments, setAttachments] = useState<AttachmentType[]>([]);
  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Determinar qual service usar baseado nos props
  const isDeliveryAttachment = deliveryId !== undefined;
  const targetId = isDeliveryAttachment ? deliveryId : deliveryItemId!;
  
  const service = isDeliveryAttachment ? deliveryAttachmentService : deliveryItemAttachmentService;

  const loadAttachments = useCallback(async () => {
    if (!targetId) return;
    
    try {
      setLoading(true);
      const data = isDeliveryAttachment
        ? await deliveryAttachmentService.getDeliveryAttachments(targetId)
        : await deliveryItemAttachmentService.getDeliveryItemAttachments(targetId);
      
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Erro ao carregar anexos');
    } finally {
      setLoading(false);
    }
  }, [targetId, isDeliveryAttachment]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments, refreshTrigger]);

  const handleFileSelection = (files: FileList) => {
    if (!targetId || readOnly || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleUploadFiles = async () => {
    if (!targetId || selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      
      if (isDeliveryAttachment) {
        await deliveryAttachmentService.uploadFiles(targetId, selectedFiles);
      } else {
        await deliveryItemAttachmentService.uploadFiles(targetId, selectedFiles);
      }
      
      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
      loadAttachments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  const formatFileSizeLocal = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (readOnly) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
    e.target.value = '';
  };

  const handleDownload = async (attachment: AttachmentType) => {
    try {
      await service.downloadAttachment(attachment.id, attachment.originalFileName);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleDelete = async (attachment: AttachmentType) => {
    if (readOnly) return;
    
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${attachment.originalFileName}"?`)) {
      return;
    }

    try {
      await service.deleteAttachment(attachment.id);
      toast.success('Arquivo excluído com sucesso!');
      loadAttachments();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const toggleExpanded = () => {
    if (!forceExpanded) {
      setIsExpanded(!isExpanded);
    }
  };

  const attachmentCount = attachments.length;
  const hasAttachments = attachmentCount > 0;

  return (
    <div className={className}>
      {/* Header colapsável */}
      <div 
        className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 ${forceExpanded ? 'cursor-default' : ''}`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {!forceExpanded && (
            isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <File className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {isDeliveryAttachment ? 'Anexos' : 'Anexos do Item'}
          </span>
          <span className="text-xs text-gray-400">(clique para gerenciar)</span>
          {hasAttachments && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {attachmentCount}
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
          {/* Upload Area - apenas se não for read-only */}
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
                Faça upload de documentos, planilhas, imagens ou outros arquivos relacionados à {isDeliveryAttachment ? 'entrega' : 'item'}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Arraste e solte arquivos aqui ou clique para selecionar (máx. 10MB por arquivo)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id={`file-input-${targetId}-${isDeliveryAttachment ? 'delivery' : 'item'}`}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.zip,.rar,.7z"
              />
              <label
                htmlFor={`file-input-${targetId}-${isDeliveryAttachment ? 'delivery' : 'item'}`}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? 'Enviando...' : 'Selecionar Arquivos'}
              </label>
            </div>
          )}

          {/* Lista de anexos */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando anexos...</p>
              </div>
            ) : hasAttachments ? (
              attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.originalFileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(attachment)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Baixar arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(attachment)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Excluir arquivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {readOnly 
                    ? 'Nenhum anexo encontrado' 
                    : 'Nenhum arquivo anexado ainda. Faça upload de seus primeiros arquivos acima.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Arquivos selecionados para upload */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Arquivos selecionados ({selectedFiles.length})
                </h4>
                <button
                  type="button"
                  onClick={clearSelectedFiles}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium"
                >
                  Limpar todos
                </button>
              </div>

              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <File className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSizeLocal(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="ml-3 p-1 hover:bg-red-100 hover:text-red-600 rounded text-gray-400 hover:text-red-600"
                      title="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Botão de upload */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUploadFiles}
                  disabled={isUploading}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar {selectedFiles.length} arquivo(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}