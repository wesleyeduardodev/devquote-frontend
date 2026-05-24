import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Package, Save, Eye, GitPullRequest } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { useAuth } from '@/hooks/useAuth'
import { deliveryService } from '@/services/deliveryService'
import { deliveryItemService } from '@/services/deliveryItemService'
import deliveryOperationalService from '@/services/deliveryOperationalService'
import { projectService } from '@/services/projectService'
import { taskService } from '@/services/taskService'
import {
  Delivery, DeliveryItem, DeliveryItemFormData, AvailableProject, AvailableTask,
} from '@/types/delivery.types'
import { DeliveryOperationalItem } from '@/types/deliveryOperational'

import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-v2/Select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui-v2/Dialog'
import { FlowChip } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel, ENV_META } from '@/components/deliveries/EnvLabel'
import { DeliveryAttachmentList } from '@/components/deliveries/DeliveryAttachmentList'

import DeliveryItemForm from '@/components/deliveries/DeliveryItemForm'
import DeliveryOperationalItemForm, { DeliveryOperationalItemFormData } from '@/components/deliveries/DeliveryOperationalItemForm'
import ProjectSelectionModal from '@/components/deliveries/ProjectSelectionModal'
import RichTextEditor from '@/components/ui/RichTextEditor'
import SortableListItem from '@/components/ui/SortableListItem'
import { cn } from '@/utils/cn'

const formatDateTimeForInput = (dateTime: string | undefined): string => {
  if (!dateTime) return ''
  return dateTime.substring(0, 16)
}
const formatDateTimeForAPI = (dateTime: string | undefined): string | undefined => {
  if (!dateTime) return undefined
  if (dateTime.length === 16) return dateTime + ':00'
  return dateTime
}

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, description, children, actions }) => (
  <section className="border-t border-border-subtle pt-6 first:border-t-0 first:pt-0">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{title}</h2>
        {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
)

const DeliveryEdit: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>()
  const navigate = useNavigate()
  const { hasProfile } = useAuth()

  const isAdmin = hasProfile('ADMIN')
  const canEdit = isAdmin
  const canDelete = isAdmin

  const [loading, setLoading] = useState(true)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null)
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([])
  const [operationalItems, setOperationalItems] = useState<DeliveryOperationalItem[]>([])
  const [selectedProjects, setSelectedProjects] = useState<AvailableProject[]>([])

  const [notes, setNotes] = useState<string>('')
  const [originalNotes, setOriginalNotes] = useState<string>('')
  const [savingNotes, setSavingNotes] = useState(false)

  const [environment, setEnvironment] = useState<string>('')
  const [originalEnvironment, setOriginalEnvironment] = useState<string>('')
  const [savingEnvironment, setSavingEnvironment] = useState(false)
  const [syncingPr, setSyncingPr] = useState(false)

  const handleSyncPullRequests = async () => {
    if (!delivery) return
    setSyncingPr(true)
    try {
      const result = await deliveryService.syncPullRequests(delivery.id)
      toast.success(result.message)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Falha ao sincronizar PRs no ClickUp')
    } finally {
      setSyncingPr(false)
    }
  }

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<DeliveryItem | null>(null)
  const [confirmDeleteOp, setConfirmDeleteOp] = useState<DeliveryOperationalItem | null>(null)

  const [itemsFormData, setItemsFormData] = useState<Map<number, DeliveryItemFormData>>(new Map())

  const loadDeliveryData = async () => {
    if (!deliveryId) return
    setLoading(true)
    try {
      const deliveryData = await deliveryService.getById(parseInt(deliveryId))
      setDelivery(deliveryData)
      setNotes(deliveryData.notes || '')
      setOriginalNotes(deliveryData.notes || '')
      setEnvironment(deliveryData.environment || '')
      setOriginalEnvironment(deliveryData.environment || '')

      let taskFlowType: string | undefined
      if (deliveryData.taskId) {
        const taskData = await taskService.getById(deliveryData.taskId)
        taskFlowType = taskData.flowType
        setSelectedTask({
          id: taskData.id,
          title: taskData.title,
          code: taskData.code,
          flowType: taskData.flowType,
          taskType: taskData.taskType,
          environment: taskData.environment,
          amount: taskData.amount,
          requester: { name: taskData.requesterName } as any,
          hasDelivery: true,
        })
      }

      if (taskFlowType === 'OPERACIONAL') {
        const opItems = await deliveryOperationalService.getItemsByDelivery(deliveryData.id)
        setOperationalItems(opItems)
      } else {
        const items = await deliveryItemService.getByDeliveryId(deliveryData.id)
        setDeliveryItems(items)

        const initialFormData = new Map<number, DeliveryItemFormData>()
        const projectIds: number[] = []

        for (const item of items) {
          initialFormData.set(item.id, {
            id: item.id,
            deliveryId: item.deliveryId,
            projectId: item.projectId,
            projectName: item.projectName,
            status: item.status,
            branch: item.branch || '',
            sourceBranch: item.sourceBranch || '',
            pullRequest: item.pullRequest || '',
            startedAt: formatDateTimeForInput(item.startedAt),
            finishedAt: formatDateTimeForInput(item.finishedAt),
            notes: item.notes || '',
            ...((item as any).script !== undefined ? { script: (item as any).script } : {}),
          } as any)
          projectIds.push(item.projectId)
        }
        setItemsFormData(initialFormData)

        if (projectIds.length > 0) {
          const uniqueProjectIds = Array.from(new Set(projectIds))
          const projects = await projectService.getByIds(uniqueProjectIds)
          setSelectedProjects(projects.map((p) => ({ id: p.id, name: p.name, description: p.description })))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da entrega:', error)
      toast.error('Erro ao carregar dados da entrega')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (deliveryId) loadDeliveryData() }, [deliveryId])

  const handleSaveItemData = async (itemId: number, data: DeliveryItemFormData) => {
    const item = deliveryItems.find((i) => i.id === itemId)
    if (!item || !delivery) return
    try {
      await deliveryItemService.update(item.id, {
        deliveryId: delivery.id,
        projectId: item.projectId,
        status: data.status,
        branch: data.branch,
        sourceBranch: data.sourceBranch,
        pullRequest: data.pullRequest,
        script: (data as any).script,
        startedAt: formatDateTimeForAPI(data.startedAt),
        finishedAt: formatDateTimeForAPI(data.finishedAt),
        notes: data.notes,
      } as any)
      setItemsFormData((prev) => { const next = new Map(prev); next.set(itemId, data); return next })
      toast.success('Item salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      toast.error('Erro ao salvar item')
    }
  }

  const handleAddProjects = async (projects: AvailableProject[]) => {
    if (!delivery) return
    try {
      const newItems: DeliveryItem[] = []
      for (const project of projects) {
        const newItem = await deliveryItemService.create({
          deliveryId: delivery.id,
          projectId: project.id,
          status: 'PENDING',
        } as any)
        newItems.push(newItem)
        setItemsFormData((prev) => {
          const next = new Map(prev)
          next.set(newItem.id, {
            id: newItem.id,
            deliveryId: newItem.deliveryId,
            projectId: newItem.projectId,
            projectName: project.name,
            status: newItem.status,
            branch: newItem.branch || '',
            sourceBranch: newItem.sourceBranch || '',
            pullRequest: newItem.pullRequest || '',
            startedAt: formatDateTimeForInput(newItem.startedAt),
            finishedAt: formatDateTimeForInput(newItem.finishedAt),
            notes: newItem.notes || '',
          } as any)
          return next
        })
      }
      setDeliveryItems([...deliveryItems, ...newItems])
      const existingProjectIds = new Set(selectedProjects.map((p) => p.id))
      const newUniqueProjects = projects.filter((p) => !existingProjectIds.has(p.id))
      if (newUniqueProjects.length > 0) setSelectedProjects([...selectedProjects, ...newUniqueProjects])
      setShowProjectModal(false)
      toast.success(`${newItems.length} item(s) adicionado(s)!`)
    } catch (error) {
      console.error('Erro ao adicionar itens:', error)
      toast.error('Erro ao adicionar itens')
    }
  }

  const handleConfirmDeleteItem = async () => {
    if (!confirmDeleteItem) return
    try {
      await deliveryItemService.delete(confirmDeleteItem.id)
      const updated = deliveryItems.filter((i) => i.id !== confirmDeleteItem.id)
      setDeliveryItems(updated)
      const stillHasProject = updated.some((i) => i.projectId === confirmDeleteItem.projectId)
      if (!stillHasProject) {
        setSelectedProjects(selectedProjects.filter((p) => p.id !== confirmDeleteItem.projectId))
      }
      setItemsFormData((prev) => { const next = new Map(prev); next.delete(confirmDeleteItem.id); return next })
      setConfirmDeleteItem(null)
      toast.success('Item removido!')
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast.error('Erro ao remover item')
    }
  }

  const handleAddOperationalItem = async () => {
    if (!delivery) return
    try {
      const newItem = await deliveryOperationalService.createItem({
        deliveryId: delivery.id,
        title: 'Novo Item Operacional',
        status: 'PENDING',
      })
      setOperationalItems([...operationalItems, newItem])
      toast.success('Item operacional criado!')
    } catch (error) {
      console.error('Erro ao criar item operacional:', error)
      toast.error('Erro ao criar item operacional')
    }
  }

  const handleSaveOperationalItem = async (itemId: number, data: DeliveryOperationalItemFormData) => {
    if (!delivery) return
    try {
      const updated = await deliveryOperationalService.updateItem(itemId, {
        deliveryId: delivery.id,
        title: data.title,
        description: data.description,
        status: data.status,
        startedAt: formatDateTimeForAPI(data.startedAt),
        finishedAt: formatDateTimeForAPI(data.finishedAt),
      } as any)
      setOperationalItems(operationalItems.map((i) => (i.id === itemId ? updated : i)))
      toast.success('Item operacional salvo!')
    } catch (error) {
      console.error('Erro ao salvar item operacional:', error)
      toast.error('Erro ao salvar item operacional')
    }
  }

  const handleConfirmDeleteOp = async () => {
    if (!confirmDeleteOp) return
    try {
      await deliveryOperationalService.deleteItem(confirmDeleteOp.id)
      setOperationalItems(operationalItems.filter((i) => i.id !== confirmDeleteOp.id))
      setConfirmDeleteOp(null)
      toast.success('Item operacional excluído!')
    } catch (error) {
      console.error('Erro ao excluir item operacional:', error)
      toast.error('Erro ao excluir item operacional')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const persistDevReorder = async (newItems: DeliveryItem[]) => {
    if (!delivery) return
    try {
      await deliveryItemService.reorder(
        delivery.id,
        newItems.map((it, idx) => ({ id: it.id, sortOrder: idx + 1 })),
      )
    } catch {
      toast.error('Erro ao reordenar itens')
      await loadDeliveryData()
    }
  }
  const handleDevReorder = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0) return
    const newItems = arrayMove(deliveryItems, oldIndex, newIndex)
    setDeliveryItems(newItems)
    persistDevReorder(newItems)
  }
  const handleDevDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = deliveryItems.findIndex((i) => String(i.id) === active.id)
    const newIndex = deliveryItems.findIndex((i) => String(i.id) === over.id)
    handleDevReorder(oldIndex, newIndex)
  }

  const persistOpReorder = async (newItems: DeliveryOperationalItem[]) => {
    if (!delivery) return
    try {
      await deliveryOperationalService.reorderItems(
        delivery.id,
        newItems.map((it, idx) => ({ id: it.id, sortOrder: idx + 1 })),
      )
    } catch {
      toast.error('Erro ao reordenar itens')
      await loadDeliveryData()
    }
  }
  const handleOpReorder = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0) return
    const newItems = arrayMove(operationalItems, oldIndex, newIndex)
    setOperationalItems(newItems)
    persistOpReorder(newItems)
  }
  const handleOpDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = operationalItems.findIndex((i) => String(i.id) === active.id)
    const newIndex = operationalItems.findIndex((i) => String(i.id) === over.id)
    handleOpReorder(oldIndex, newIndex)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center rounded-lg border border-border-subtle bg-surface-1 p-8">
          <Package className="size-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Entrega não encontrada</h3>
          <Button onClick={() => navigate('/deliveries')}>Voltar para entregas</Button>
        </div>
      </div>
    )
  }

  const isOperacional = selectedTask?.flowType === 'OPERACIONAL'
  const envChanged = environment !== originalEnvironment
  const notesChanged = notes !== originalNotes

  return (
    <div className="w-full">
      <div className="w-full space-y-4">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              Editar entrega
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-soft text-accent">
                #{delivery.id}
              </span>
            </span>
          }
          subtitle={
            <span className="inline-flex items-center gap-2">
              {selectedTask?.code && <span className="font-mono text-xs">{selectedTask.code}</span>}
              {selectedTask?.code && selectedTask?.title && <span className="text-text-tertiary">·</span>}
              {selectedTask?.title && <span className="truncate">{selectedTask.title}</span>}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                leadingIcon={<GitPullRequest />}
                onClick={handleSyncPullRequests}
                loading={syncingPr}
                title="Sincroniza os PRs dos items pro ClickUp (campo Branch + descrição)"
              >
                Atualizar Branch
              </Button>
              <Button variant="secondary" leadingIcon={<Eye />} onClick={() => navigate(`/deliveries/${delivery.id}`)}>
                Visualizar
              </Button>
            </div>
          }
        />

        {/* Tarefa associada (somente leitura) */}
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-full bg-accent-soft text-accent grid place-items-center shrink-0">
              <Package className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Tarefa associada
              </div>
              {selectedTask && (
                <div className="flex flex-col mt-0.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-text-primary truncate">{selectedTask.title}</span>
                    <span className="font-mono text-xs text-text-tertiary shrink-0">· {selectedTask.code}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedTask.flowType && <FlowChip value={selectedTask.flowType} />}
                    {selectedTask.taskType && <TaskTypeLabel value={selectedTask.taskType} />}
                    {selectedTask.environment && <EnvLabel value={selectedTask.environment} />}
                    {selectedTask.requester?.name && (
                      <span className="text-xs text-text-tertiary">· {selectedTask.requester.name}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-6">

          <Section
            title="Ambiente da entrega"
            actions={canEdit && envChanged ? (
              <Button
                size="sm"
                loading={savingEnvironment}
                onClick={async () => {
                  if (!delivery) return
                  try {
                    setSavingEnvironment(true)
                    await deliveryService.updateEnvironment(delivery.id, (environment as any) || undefined)
                    setOriginalEnvironment(environment)
                    toast.success('Ambiente atualizado!')
                  } catch (error) {
                    console.error('Erro ao atualizar ambiente:', error)
                    toast.error('Erro ao atualizar ambiente')
                  } finally {
                    setSavingEnvironment(false)
                  }
                }}
              >
                Salvar
              </Button>
            ) : undefined}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Select value={environment || '__none'} onValueChange={(v) => setEnvironment(v === '__none' ? '' : v)} disabled={!canEdit}>
                  <SelectTrigger><SelectValue placeholder="Não especificado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Não especificado</SelectItem>
                    {['DESENVOLVIMENTO', 'HOMOLOGACAO', 'PRODUCAO'].map((env) => {
                      const meta = ENV_META[env]
                      const Icon = meta?.Icon
                      return (
                        <SelectItem key={env} value={env}>
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && <Icon className={cn('size-3.5', meta.iconClass)} />}
                            {meta?.label || env}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                {environment && <EnvLabel value={environment} />}
              </div>
            </div>
          </Section>

          <Section
            title="Observações"
            actions={canEdit && notesChanged ? (
              <Button
                size="sm"
                loading={savingNotes}
                onClick={async () => {
                  if (!delivery) return
                  try {
                    setSavingNotes(true)
                    await deliveryService.updateNotes(delivery.id, notes)
                    setOriginalNotes(notes)
                    toast.success('Observações salvas!')
                  } catch (error) {
                    console.error('Erro ao salvar observações:', error)
                    toast.error('Erro ao salvar observações')
                  } finally {
                    setSavingNotes(false)
                  }
                }}
              >
                Salvar
              </Button>
            ) : undefined}
          >
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder={canEdit ? 'Digite observações sobre esta entrega...' : 'Sem observações.'}
              minHeight="150px"
              disabled={!canEdit}
              entityType="DELIVERY"
              entityId={delivery.id}
            />
          </Section>

          <Section title="Anexos da entrega">
            <DeliveryAttachmentList deliveryId={delivery.id} readOnly={!canEdit} forceExpanded={false} />
          </Section>

          <Section
            title={isOperacional ? `Itens operacionais (${operationalItems.length})` : `Itens de entrega (${deliveryItems.length})`}
            actions={canEdit ? (
              <Button
                size="sm"
                leadingIcon={<Plus />}
                onClick={isOperacional ? handleAddOperationalItem : () => setShowProjectModal(true)}
              >
                {isOperacional ? 'Adicionar item' : 'Adicionar projetos'}
              </Button>
            ) : undefined}
          >
            {isOperacional ? (
              operationalItems.length === 0 ? (
                <div className="text-center py-8 rounded-md border border-dashed border-border-subtle">
                  <Package className="size-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary mb-3">Nenhum item operacional.</p>
                  {canEdit && (
                    <Button size="sm" leadingIcon={<Plus />} onClick={handleAddOperationalItem}>
                      Adicionar item operacional
                    </Button>
                  )}
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOpDragEnd}>
                  <SortableContext items={operationalItems.map((i) => String(i.id))} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {operationalItems.map((item, index) => (
                        <SortableListItem key={item.id} id={String(item.id)}>
                          {({ attributes, listeners }) => (
                            <div className="rounded-md border border-border-subtle bg-surface-app/40 hover:bg-surface-2 transition-colors">
                              <DeliveryOperationalItemForm
                                initialData={item}
                                onSave={(data) => handleSaveOperationalItem(item.id, data)}
                                onDelete={() => setConfirmDeleteOp(item)}
                                isReadOnly={!canEdit}
                                position={index + 1}
                                isFirst={index === 0}
                                isLast={index === operationalItems.length - 1}
                                onMoveUp={canEdit ? () => handleOpReorder(index, index - 1) : undefined}
                                onMoveDown={canEdit ? () => handleOpReorder(index, index + 1) : undefined}
                                dragHandleProps={canEdit ? { ...attributes, ...listeners } : undefined}
                              />
                            </div>
                          )}
                        </SortableListItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )
            ) : (
              deliveryItems.length === 0 ? (
                <div className="text-center py-8 rounded-md border border-dashed border-border-subtle">
                  <Package className="size-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary mb-3">Nenhum item de entrega.</p>
                  {canEdit && (
                    <Button size="sm" leadingIcon={<Plus />} onClick={() => setShowProjectModal(true)}>
                      Adicionar projetos
                    </Button>
                  )}
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDevDragEnd}>
                  <SortableContext items={deliveryItems.map((i) => String(i.id))} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {deliveryItems.map((item, index) => {
                        const project = selectedProjects.find((p) => p.id === item.projectId)
                        const formData = itemsFormData.get(item.id)
                        if (!project) return null
                        return (
                          <SortableListItem key={item.id} id={String(item.id)}>
                            {({ attributes, listeners }) => (
                              <div className="rounded-md border border-border-subtle bg-surface-app/40 p-4 hover:bg-surface-2 transition-colors">
                                <DeliveryItemForm
                                  project={project}
                                  initialData={formData}
                                  onSave={(data) => handleSaveItemData(item.id, data)}
                                  isReadOnly={!canEdit}
                                  position={index + 1}
                                  isFirst={index === 0}
                                  isLast={index === deliveryItems.length - 1}
                                  onMoveUp={canEdit ? () => handleDevReorder(index, index - 1) : undefined}
                                  onMoveDown={canEdit ? () => handleDevReorder(index, index + 1) : undefined}
                                  dragHandleProps={canEdit ? { ...attributes, ...listeners } : undefined}
                                  customActions={
                                    canDelete ? (
                                      <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => setConfirmDeleteItem(item)}
                                        className="text-text-secondary hover:text-[var(--danger-strong)]"
                                        title={`Remover ${project.name}`}
                                      >
                                        <Trash2 />
                                      </Button>
                                    ) : undefined
                                  }
                                />
                              </div>
                            )}
                          </SortableListItem>
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )
            )}
          </Section>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 -mx-3 sm:-mx-4 lg:-mx-4 mt-6 px-3 sm:px-4 lg:px-4 py-3 bg-surface-app/95 backdrop-blur border-t border-border-subtle z-20">
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/deliveries')}>Voltar</Button>
            <Button variant="secondary" leadingIcon={<Eye />} onClick={() => navigate(`/deliveries/${delivery.id}`)}>
              Visualizar
            </Button>
          </div>
        </div>
      </div>

      <ProjectSelectionModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onProjectsSelect={handleAddProjects}
      />

      <Dialog open={!!confirmDeleteItem} onOpenChange={(o) => { if (!o) setConfirmDeleteItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover item de entrega?</DialogTitle>
            <DialogDescription>O item e seus anexos serão removidos. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteItem(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmDeleteItem}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteOp} onOpenChange={(o) => { if (!o) setConfirmDeleteOp(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir item operacional?</DialogTitle>
            <DialogDescription>O item e seus anexos serão removidos. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteOp(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmDeleteOp}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeliveryEdit
