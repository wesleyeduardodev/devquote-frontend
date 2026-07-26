import * as React from 'react'
import {
  Plus, Paperclip, Trash2, Pencil, Download, StickyNote, ChevronDown, ChevronRight,
  MoreHorizontal, Upload, X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import billingNoteService from '@/services/billingNoteService'
import { BillingNote, BillingNoteAttachment } from '@/types/billingNote.types'
import { formatFileSize } from '@/utils/formatters'

import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui-v2/Sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui-v2/Dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui-v2/DropdownMenu'
import RichTextEditor from '@/components/ui/RichTextEditor'

export interface BillingNotesSheetProps {
  open: boolean
  onClose: () => void
  /** Nulo/indefinido = anotações gerais de faturamento. */
  billingPeriodId?: number | null
  /** Rótulo do escopo exibido no cabeçalho (ex.: "10 - Outubro 2026"). */
  scopeLabel?: string
  isAdmin: boolean
  /** Chamado após criar/editar/excluir, para atualizar contadores na tela. */
  onChanged?: () => void
}

type EditorState = { mode: 'create' } | { mode: 'edit'; note: BillingNote } | null

const stripHtml = (html?: string | null): string => {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  try {
    return format(parseISO(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

const BillingNotesSheet: React.FC<BillingNotesSheetProps> = ({
  open,
  onClose,
  billingPeriodId,
  scopeLabel,
  isAdmin,
  onChanged,
}) => {
  const isGeneral = billingPeriodId == null

  const [notes, setNotes] = React.useState<BillingNote[]>([])
  const [loading, setLoading] = React.useState(false)
  const [editor, setEditor] = React.useState<EditorState>(null)
  const [draftTitle, setDraftTitle] = React.useState('')
  const [draftContent, setDraftContent] = React.useState('')
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([])
  const [saving, setSaving] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<number | null>(null)
  const [attachmentsByNote, setAttachmentsByNote] = React.useState<Record<number, BillingNoteAttachment[]>>({})
  const [confirmDelete, setConfirmDelete] = React.useState<BillingNote | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const loadNotes = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = isGeneral
        ? await billingNoteService.getGeneralNotes()
        : await billingNoteService.getNotesByBillingPeriod(billingPeriodId as number)
      setNotes(data)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar anotações')
    } finally {
      setLoading(false)
    }
  }, [billingPeriodId, isGeneral])

  React.useEffect(() => {
    if (!open) return
    setEditor(null)
    setExpandedId(null)
    setAttachmentsByNote({})
    loadNotes()
  }, [open, loadNotes])

  const loadAttachments = async (noteId: number) => {
    try {
      const data = await billingNoteService.getAttachments(noteId)
      setAttachmentsByNote((prev) => ({ ...prev, [noteId]: data }))
    } catch {
      toast.error('Erro ao carregar anexos da anotação')
    }
  }

  const toggleExpand = (note: BillingNote) => {
    const next = expandedId === note.id ? null : note.id
    setExpandedId(next)
    if (next != null && !attachmentsByNote[note.id] && note.attachmentCount > 0) {
      loadAttachments(note.id)
    }
  }

  const openCreate = () => {
    setDraftTitle('')
    setDraftContent('')
    setPendingFiles([])
    setEditor({ mode: 'create' })
  }

  const openEdit = (note: BillingNote) => {
    setDraftTitle(note.title || '')
    setDraftContent(note.content || '')
    setPendingFiles([])
    setEditor({ mode: 'edit', note })
  }

  const closeEditor = () => {
    setEditor(null)
    setDraftTitle('')
    setDraftContent('')
    setPendingFiles([])
  }

  const handleSave = async () => {
    if (!editor) return

    const hasTitle = draftTitle.trim().length > 0
    const hasContent = stripHtml(draftContent).length > 0
    if (!hasTitle && !hasContent) {
      toast.error('Informe um título ou um conteúdo para a anotação')
      return
    }

    try {
      setSaving(true)
      const payload = {
        billingPeriodId: isGeneral ? null : billingPeriodId,
        title: draftTitle.trim() || null,
        content: draftContent || null,
      }

      const saved = editor.mode === 'edit'
        ? await billingNoteService.update(editor.note.id, payload)
        : await billingNoteService.create(payload)

      if (pendingFiles.length > 0) {
        await billingNoteService.uploadAttachments(saved.id, pendingFiles)
      }

      toast.success(editor.mode === 'edit' ? 'Anotação atualizada' : 'Anotação criada')
      closeEditor()
      await loadNotes()
      if (editor.mode === 'edit') {
        setAttachmentsByNote((prev) => {
          const next = { ...prev }
          delete next[editor.note.id]
          return next
        })
      }
      onChanged?.()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar anotação')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      await billingNoteService.delete(confirmDelete.id)
      toast.success('Anotação excluída')
      setConfirmDelete(null)
      await loadNotes()
      onChanged?.()
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir anotação')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async (attachment: BillingNoteAttachment) => {
    try {
      await billingNoteService.downloadAttachment(attachment.id, attachment.originalFileName)
    } catch {
      toast.error('Erro ao baixar arquivo')
    }
  }

  const handleDeleteAttachment = async (noteId: number, attachment: BillingNoteAttachment) => {
    try {
      await billingNoteService.deleteAttachment(attachment.id)
      setAttachmentsByNote((prev) => ({
        ...prev,
        [noteId]: (prev[noteId] || []).filter((a) => a.id !== attachment.id),
      }))
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, attachmentCount: Math.max(0, n.attachmentCount - 1) } : n)))
      toast.success('Anexo excluído')
    } catch {
      toast.error('Erro ao excluir anexo')
    }
  }

  const addPendingFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
  }

  const headerTitle = isGeneral ? 'Anotações de faturamento' : `Anotações — ${scopeLabel ?? 'período'}`
  const headerDescription = isGeneral
    ? 'Anotações gerais, válidas para o faturamento como um todo.'
    : 'Anotações específicas deste período de faturamento.'

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent size="lg">
          <SheetHeader>
            <SheetTitle>{headerTitle}</SheetTitle>
            <SheetDescription>{headerDescription}</SheetDescription>
          </SheetHeader>

          <SheetBody>
            {editor ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Título (opcional)</label>
                  <Input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Ex.: Reajuste 2026"
                    maxLength={255}
                  />
                </div>

                <RichTextEditor
                  label="Anotação"
                  value={draftContent}
                  onChange={setDraftContent}
                  placeholder="Escreva a anotação. Cole imagens com Ctrl+V ou arraste e solte."
                  minHeight="220px"
                  entityType="BILLING_NOTE"
                  entityId={editor.mode === 'edit' ? editor.note.id : undefined}
                />

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Anexos</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => { addPendingFiles(e.target.files); e.target.value = '' }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Upload />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar arquivos
                  </Button>

                  {pendingFiles.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pendingFiles.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-2 px-3 py-1.5 text-sm">
                          <span className="truncate text-text-primary">{file.name}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-text-tertiary">{formatFileSize(file.size)}</span>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              title="Remover"
                              onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                            >
                              <X />
                            </Button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {editor.mode === 'create' && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      Os arquivos serão enviados ao salvar. Imagens coladas dentro do texto só ficam disponíveis após o primeiro salvamento.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {isAdmin && (
                  <Button leadingIcon={<Plus />} onClick={openCreate}>Nova anotação</Button>
                )}

                {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

                {!loading && notes.length === 0 && (
                  <EmptyState
                    icon={<StickyNote />}
                    title="Nenhuma anotação"
                    description={isAdmin ? 'Crie a primeira anotação deste escopo.' : 'Ainda não há anotações registradas.'}
                    actions={isAdmin && <Button leadingIcon={<Plus />} onClick={openCreate}>Nova anotação</Button>}
                  />
                )}

                {!loading && notes.map((note) => {
                  const expanded = expandedId === note.id
                  const attachments = attachmentsByNote[note.id] || []
                  return (
                    <div key={note.id} className="rounded-lg border border-border-subtle bg-surface-1">
                      <div className="flex items-start justify-between gap-2 p-3">
                        <button
                          type="button"
                          className="flex-1 min-w-0 text-left"
                          onClick={() => toggleExpand(note)}
                        >
                          <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-1">
                            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            <span>{formatDateTime(note.createdAt)}</span>
                            {note.createdByName && <span>· {note.createdByName}</span>}
                          </div>
                          {note.title && (
                            <p className="font-medium text-text-primary truncate">{note.title}</p>
                          )}
                          {!expanded && (
                            <p className="text-sm text-text-secondary line-clamp-2">
                              {stripHtml(note.content) || 'Sem conteúdo'}
                            </p>
                          )}
                        </button>

                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon-sm" variant="ghost" title="Mais ações"><MoreHorizontal /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openEdit(note)}><Pencil />Editar</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setConfirmDelete(note)}><Trash2 />Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {expanded && (
                        <div className="border-t border-border-subtle p-3 space-y-3">
                          {note.content ? (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                          ) : (
                            <p className="text-sm text-text-tertiary">Sem conteúdo.</p>
                          )}

                          {note.attachmentCount > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-text-secondary">Anexos ({note.attachmentCount})</p>
                              {attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-2 px-3 py-1.5">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Paperclip className="size-3.5 text-text-tertiary shrink-0" />
                                    <span className="truncate text-sm text-text-primary">{attachment.originalFileName}</span>
                                    <span className="text-xs text-text-tertiary shrink-0">{formatFileSize(attachment.fileSize)}</span>
                                  </span>
                                  <span className="flex items-center gap-0.5 shrink-0">
                                    <Button size="icon-sm" variant="ghost" title="Baixar" onClick={() => handleDownload(attachment)}><Download /></Button>
                                    {isAdmin && (
                                      <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        title="Excluir anexo"
                                        className="text-text-secondary hover:text-[var(--danger-strong)]"
                                        onClick={() => handleDeleteAttachment(note.id, attachment)}
                                      >
                                        <Trash2 />
                                      </Button>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!expanded && note.attachmentCount > 0 && (
                        <div className="px-3 pb-2 -mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                            <Paperclip className="size-3" />
                            {note.attachmentCount} anexo(s)
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </SheetBody>

          <SheetFooter>
            {editor ? (
              <>
                <Button variant="secondary" onClick={closeEditor} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>
                  {editor.mode === 'edit' ? 'Salvar alterações' : 'Criar anotação'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={onClose}>Fechar</Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir anotação?</DialogTitle>
            <DialogDescription>
              A anotação e seus anexos serão removidos permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteNote} loading={deleting}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BillingNotesSheet
