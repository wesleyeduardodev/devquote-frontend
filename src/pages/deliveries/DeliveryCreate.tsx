import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, FolderOpen, X, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { AvailableTask, AvailableProject, CreateDeliveryData } from '@/types/delivery.types'
import { deliveryService } from '@/services/deliveryService'
import { Button } from '@/components/ui-v2/Button'
import { PageHeader } from '@/components/ui-v2/PageHeader'
import { FlowChip } from '@/components/tasks/FlowChip'
import { TaskTypeLabel } from '@/components/tasks/TaskTypeLabel'
import { EnvLabel } from '@/components/deliveries/EnvLabel'
import TaskSelectionModal from '@/components/deliveries/TaskSelectionModal'
import ProjectSelectionModal from '@/components/deliveries/ProjectSelectionModal'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { cn } from '@/utils/cn'

const Section: React.FC<{ title: string; required?: boolean; children: React.ReactNode }> = ({ title, required, children }) => (
  <section className="border-t border-border-subtle pt-6 first:border-t-0 first:pt-0">
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">
      {title}
      {required && <span className="text-[var(--danger-strong)] ml-1">*</span>}
    </h2>
    <div className="space-y-4">{children}</div>
  </section>
)

const DeliveryCreate: React.FC = () => {
  const navigate = useNavigate()

  const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<AvailableProject[]>([])
  const [notes, setNotes] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)

  const isOperacional = selectedTask?.flowType === 'OPERACIONAL'

  const handleTaskSelect = (task: AvailableTask) => {
    setSelectedTask(task)
    setShowTaskModal(false)
    setTaskError(null)
    // Limpa projetos se trocar pra fluxo operacional
    if (task.flowType === 'OPERACIONAL') setSelectedProjects([])
    toast.success(`Tarefa "${task.code}" selecionada`)
  }

  const handleProjectsSelect = (projects: AvailableProject[]) => {
    setSelectedProjects(projects)
    setShowProjectModal(false)
    if (projects.length > 0) {
      toast.success(`${projects.length} projeto${projects.length > 1 ? 's' : ''} selecionado${projects.length > 1 ? 's' : ''}`)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTask) {
      setTaskError('Selecione uma tarefa antes de continuar.')
      toast.error('Selecione uma tarefa antes de continuar.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsCreating(true)
    try {
      const deliveryData: CreateDeliveryData = {
        taskId: selectedTask.id,
        status: 'PENDING',
        notes: notes,
        items: !isOperacional
          ? selectedProjects.map((p) => ({ projectId: p.id, status: 'PENDING' as const }))
          : [],
      }

      const created = await deliveryService.create(deliveryData)
      toast.success('Entrega criada com sucesso!')
      navigate(`/deliveries/${created.id}/edit`)
    } catch (error: any) {
      console.error('Erro ao criar entrega:', error)
      toast.error(error?.response?.data?.detail || error?.message || 'Erro ao criar entrega.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="w-full">
      <div className="w-full space-y-4">
        <PageHeader
          title="Nova entrega"
          subtitle={selectedTask ? `Para tarefa ${selectedTask.code}` : 'Selecione uma tarefa para começar'}
        />

        {/* Seletor de tarefa inline */}
        <div className={cn(
          'rounded-lg border bg-surface-1 p-4 flex items-center justify-between gap-3',
          taskError ? 'border-[var(--danger-border)]' : 'border-border-subtle'
        )}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-9 rounded-full bg-accent-soft text-accent grid place-items-center shrink-0">
              <Package className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Tarefa <span className="text-[var(--danger-strong)]">*</span>
              </div>
              {selectedTask ? (
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
              ) : (
                <p className={cn('text-sm mt-0.5', taskError ? 'text-[var(--danger-strong)]' : 'text-text-tertiary')}>
                  {taskError || 'Nenhuma tarefa selecionada'}
                </p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowTaskModal(true)}>
            {selectedTask ? 'Alterar' : 'Selecionar'}
          </Button>
        </div>

        {/* Formulário principal */}
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-6">

          {!isOperacional && (
            <Section title="Projetos / Repositórios">
              {selectedProjects.length > 0 ? (
                <div className="rounded-md border border-border-subtle bg-surface-app/40 p-4 space-y-3">
                  <div className="space-y-2">
                    {selectedProjects.map((project) => (
                      <div key={project.id} className="flex items-center gap-2">
                        <FolderOpen className="size-4 text-[var(--success-strong)] shrink-0" />
                        <span className="text-sm text-text-primary">{project.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProjects((prev) => prev.filter((p) => p.id !== project.id))}
                          className="ml-auto p-1 rounded text-text-tertiary hover:text-[var(--danger-strong)] hover:bg-surface-2"
                          aria-label={`Remover ${project.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowProjectModal(true)} disabled={!selectedTask}>
                    Alterar seleção
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  disabled={!selectedTask}
                  className={cn(
                    'w-full px-4 py-6 border-2 border-dashed rounded-md transition-colors text-center',
                    selectedTask
                      ? 'border-border-strong hover:border-accent text-text-secondary hover:text-accent'
                      : 'border-border-subtle text-text-tertiary cursor-not-allowed opacity-60',
                  )}
                >
                  <FolderOpen className="mx-auto size-6 mb-2" />
                  <p className="text-sm">
                    {selectedTask ? 'Selecionar projetos (opcional)' : 'Selecione uma tarefa primeiro'}
                  </p>
                </button>
              )}
            </Section>
          )}

          <Section title="Observações">
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Digite observações gerais sobre esta entrega. Você pode colar imagens diretamente..."
              minHeight="150px"
              entityType="DELIVERY"
            />
          </Section>

        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 -mx-3 sm:-mx-4 lg:-mx-4 mt-6 px-3 sm:px-4 lg:px-4 py-3 bg-surface-app/95 backdrop-blur border-t border-border-subtle z-20">
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/deliveries')} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={isCreating} disabled={!selectedTask} leadingIcon={<Save />}>
              Criar entrega
            </Button>
          </div>
        </div>
      </div>

      {/* Modais (antigos) */}
      <TaskSelectionModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onTaskSelect={handleTaskSelect}
      />
      <ProjectSelectionModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onProjectsSelect={handleProjectsSelect}
        selectedTaskTitle={selectedTask?.title}
      />
    </div>
  )
}

export default DeliveryCreate
