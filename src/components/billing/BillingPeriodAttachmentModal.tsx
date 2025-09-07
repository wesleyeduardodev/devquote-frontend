import React, { useState, useEffect } from 'react';
import { X, Upload, Download, Trash2, File, AlertCircle } from 'lucide-react';
import { billingPeriodAttachmentService, BillingPeriodAttachmentResponse } from '../../services/billingPeriodAttachmentService';
import { formatFileSize } from '../../utils/formatters';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

interface BillingPeriodAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingPeriodId: number;
  billingPeriodTitle: string; // Ex: "Janeiro 2025"
  isAdmin?: boolean; // Indica se o usuário pode upload/delete
}

const BillingPeriodAttachmentModal: React.FC<BillingPeriodAttachmentModalProps> = ({
  isOpen,
  onClose,
  billingPeriodId,
  billingPeriodTitle,
  isAdmin = false
}) => {
  const [attachments, setAttachments] = useState<BillingPeriodAttachmentResponse[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Estados do modal de confirmação
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    attachment: BillingPeriodAttachmentResponse | null;
  }>({ isOpen: false, attachment: null });

  useEffect(() => {
    if (isOpen && billingPeriodId) {
      loadAttachments();
    }
  }, [isOpen, billingPeriodId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await billingPeriodAttachmentService.getBillingPeriodAttachments(billingPeriodId);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Erro ao carregar anexos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = (files: FileList) => {
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      await billingPeriodAttachmentService.uploadFiles(billingPeriodId, selectedFiles);
      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
      loadAttachments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  const handleDownload = async (attachment: BillingPeriodAttachmentResponse) => {
    try {
      await billingPeriodAttachmentService.downloadAttachment(attachment.id, attachment.originalFileName);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleDeleteClick = (attachment: BillingPeriodAttachmentResponse) => {
    setDeleteModal({ isOpen: true, attachment });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.attachment) return;

    try {
      setDeletingId(deleteModal.attachment.id);
      await billingPeriodAttachmentService.deleteAttachment(deleteModal.attachment.id);
      setAttachments(prev => prev.filter(a => a.id !== deleteModal.attachment!.id));
      toast.success('Arquivo excluído com sucesso!');
      setDeleteModal({ isOpen: false, attachment: null });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao excluir arquivo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, attachment: null });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <File className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Anexos do Período</h2>
                <p className="text-blue-100 text-sm">{billingPeriodTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div className="space-y-6">
            {/* Upload Area - Apenas para Admin */}
            {isAdmin && (
              <div className="space-y-6">
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
                    Faça upload de documentos relacionados ao período de faturamento
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Arraste e solte arquivos aqui ou clique para selecionar (máx. 10MB por arquivo)
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    id="billing-period-file-input"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                  />
                  <label
                    htmlFor="billing-period-file-input"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    Selecionar Arquivos
                  </label>
                </div>

                {/* Arquivos selecionados para upload */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
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
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="ml-3 p-1 hover:bg-red-100 hover:text-red-600 rounded text-gray-400"
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
                        disabled={uploading}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading ? (
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

            {/* Lista de anexos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Anexos ({attachments.length})
                </h4>
                {!isAdmin && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Modo visualização - apenas download disponível
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 mt-2">Carregando anexos...</p>
                </div>
              ) : attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <File className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.originalFileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleDownload(attachment)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md"
                          title="Baixar arquivo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {/* Botão de delete - apenas para Admin */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(attachment)}
                            disabled={deletingId === attachment.id}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md disabled:opacity-50"
                            title="Excluir arquivo"
                          >
                            {deletingId === attachment.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Nenhum anexo encontrado. Faça upload de seus primeiros arquivos acima.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

export default BillingPeriodAttachmentModal;