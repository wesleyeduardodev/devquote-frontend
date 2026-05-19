import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isDeleting?: boolean;
  entityName?: string;
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen, onClose, onConfirm, selectedCount, isDeleting = false, entityName = 'itens'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface-inverse/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-1 rounded-xl shadow-xl border border-border-subtle w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[var(--danger-soft)] rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--danger-strong)]" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              Confirmar exclusão
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-text-tertiary hover:text-text-primary hover:bg-surface-2 rounded-md p-1 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-text-secondary mb-4">
            Você está prestes a excluir <strong className="text-text-primary">{selectedCount}</strong> {entityName}
            {selectedCount === 1 ? '' : 's'}. Esta ação não pode ser desfeita.
          </p>

          <div className="bg-[var(--danger-soft)] border border-[var(--danger-border)] rounded-md p-3 mb-2">
            <p className="text-xs text-[var(--danger-strong)] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span><strong>Atenção:</strong> esta ação é permanente e não pode ser revertida.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border-subtle bg-surface-app/30 rounded-b-xl">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={isDeleting} disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;
