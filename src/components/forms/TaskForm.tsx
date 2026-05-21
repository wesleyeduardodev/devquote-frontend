import React, { useState, useCallback, useEffect } from 'react'
import { FormProvider, useForm, useWatch, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Paperclip, ChevronDown, ChevronUp, Monitor, Settings2, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import Input from '../ui/Input'
import Button from '../ui/Button'
import {
  Select as RSelect, SelectTrigger as RSelectTrigger, SelectContent as RSelectContent,
  SelectItem as RSelectItem, SelectValue as RSelectValue,
} from '@/components/ui-v2/Select'
import { TASK_TYPE_META } from '@/components/tasks/TaskTypeLabel'
import { ENV_META } from '@/components/tasks/EnvLabel'
import SubTaskForm from './SubTaskForm'
import FilePicker from '../ui/FilePicker'
import AttachmentList from '../ui/AttachmentList'
import RichTextEditor from '../ui/RichTextEditor'
import { TaskAttachmentResponse } from '@/services/taskAttachmentService'

interface SubTask { title: string; description?: string; amount: string; taskId?: number | null; excluded?: boolean }
interface TaskData {
  requesterId: number
  title: string
  description?: string
  flowType: string
  environment?: string
  code: string
  link?: string
  meetingLink?: string
  hasSubTasks?: boolean
  amount?: string
  taskType?: string
  serverOrigin?: string
  systemModule?: string
  priority?: string
  subTasks?: any[]
}

interface TaskFormProps {
  initialData?: any
  onSubmit: (data: any, pendingFiles?: File[]) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  taskId?: number
  onFilesUploaded?: (attachments: TaskAttachmentResponse[]) => void
}

const createSchema = (isEdit: boolean) => yup.object({
  title: yup.string().required('Título é obrigatório').max(200, 'Máximo 200 caracteres'),
  description: yup.string().optional(),
  flowType: yup.string().required('Tipo de fluxo é obrigatório'),
  environment: yup.string().optional(),
  code: isEdit
    ? yup.string().required('Código é obrigatório').max(50, 'Máximo 50 caracteres')
    : yup.string().when('flowType', {
        is: 'DESENVOLVIMENTO',
        then: (schema) => schema.required('Código é obrigatório para tarefas de desenvolvimento').max(50, 'Máximo 50 caracteres'),
        otherwise: (schema) => schema.optional(),
      }),
  requesterId: yup.mixed().required('Solicitante é obrigatório'),
  link: yup.string().url('URL inválida').optional(),
  meetingLink: yup.string().url('URL inválida').max(500, 'Máximo 500 caracteres').optional(),
  hasSubTasks: yup.boolean().optional(),
  amount: yup.string().optional(),
  taskType: yup.string().optional(),
  serverOrigin: yup.string().max(100, 'Máximo 100 caracteres').optional(),
  systemModule: yup.string().max(100, 'Máximo 100 caracteres').optional(),
  priority: yup.string().required('Prioridade é obrigatória'),
  subTasks: yup.array().optional(),
})

// ---- Opções dos selects (sem emojis — apps profissionais usam ícones ou label puro) ----
const DEV_TASK_TYPES = [
  { value: '', label: 'Selecione…' },
  { value: 'BUG', label: 'Bug' },
  { value: 'ENHANCEMENT', label: 'Melhoria' },
  { value: 'NEW_FEATURE', label: 'Nova funcionalidade' },
]

const OPS_TASK_TYPES = [
  { value: '', label: 'Selecione…' },
  { value: 'BACKUP', label: 'Backup' },
  { value: 'DEPLOY', label: 'Deploy' },
  { value: 'LOGS', label: 'Logs' },
  { value: 'DATABASE_APPLICATION', label: 'Aplicação de Banco' },
  { value: 'NOVO_SERVIDOR', label: 'Novo servidor' },
  { value: 'MONITORING', label: 'Monitoramento' },
  { value: 'SUPPORT', label: 'Suporte' },
  { value: 'CODE_REVIEW', label: 'Code Review' },
]

const ENV_OPTIONS = [
  { value: '', label: 'Selecione…' },
  { value: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { value: 'HOMOLOGACAO',     label: 'Homologação' },
  { value: 'PRODUCAO',        label: 'Produção' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: 'Baixa',   dot: 'bg-emerald-500' },
  { value: 'MEDIUM', label: 'Média',   dot: 'bg-amber-500' },
  { value: 'HIGH',   label: 'Alta',    dot: 'bg-orange-500' },
  { value: 'URGENT', label: 'Urgente', dot: 'bg-rose-500' },
]

// ---- Helpers de UI internos ----
const FormSection: React.FC<{ title: string; description?: string; children: React.ReactNode; className?: string }> = ({
  title, description, children, className,
}) => (
  <section className={cn('border-t border-border-subtle pt-6 first:border-t-0 first:pt-0', className)}>
    <header className="mb-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{title}</h2>
      {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
    </header>
    <div className="space-y-4">{children}</div>
  </section>
)

const SegmentedFlow: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <div role="radiogroup" className="inline-flex rounded-md border border-border-subtle bg-surface-2 p-0.5 select-none" aria-label="Tipo de fluxo">
    {[
      { v: 'DESENVOLVIMENTO', Icon: Monitor,    label: 'Desenvolvimento' },
      { v: 'OPERACIONAL',     Icon: Settings2,  label: 'Operacional' },
    ].map(({ v, Icon, label }) => {
      const active = value === v
      return (
        <button
          type="button"
          key={v}
          role="radio"
          aria-checked={active}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={cn(
            'flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded transition-colors',
            active
              ? 'bg-surface-1 text-text-primary shadow-sm border border-border-subtle'
              : 'text-text-secondary hover:text-text-primary',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      )
    })}
  </div>
)

const TaskForm: React.FC<TaskFormProps> = ({
  initialData = null, onSubmit, onCancel, loading = false, taskId, onFilesUploaded,
}) => {
  const { hasProfile } = useAuth()
  const isAdmin = hasProfile('ADMIN')
  const isEdit = !!initialData?.id

  const methods = useForm<TaskData>({
    resolver: yupResolver(createSchema(isEdit)),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      flowType: initialData?.flowType || 'DESENVOLVIMENTO',
      environment: initialData?.environment || '',
      code: initialData?.code || '',
      link: initialData?.link || '',
      meetingLink: initialData?.meetingLink || '',
      hasSubTasks: initialData?.hasSubTasks !== undefined ? initialData.hasSubTasks : false,
      amount: initialData?.amount || '',
      taskType: initialData?.taskType || '',
      serverOrigin: initialData?.serverOrigin || '',
      systemModule: initialData?.systemModule || '',
      priority: initialData?.priority || 'MEDIUM',
      subTasks: initialData?.subTasks
        ? [...initialData.subTasks].sort((a: any, b: any) => {
            const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER
            const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER
            if (ao !== bo) return ao - bo
            if (a.id && b.id) return a.id - b.id
            if (a.id) return -1
            if (b.id) return 1
            return 0
          })
        : [{ title: '', description: '', amount: '' }],
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, setValue } = methods

  const hasSubTasks = useWatch({ control, name: 'hasSubTasks' })
  const watchSubTasks = useWatch({ control, name: 'subTasks' })
  const flowType = useWatch({ control, name: 'flowType' })

  useEffect(() => {
    if (flowType === 'OPERACIONAL' && !initialData?.id) {
      setValue('code', '')
    }
  }, [flowType, setValue, initialData?.id])

  useEffect(() => {
    if (initialData?.id) {
      reset({
        title: initialData?.title || '',
        description: initialData?.description || '',
        flowType: initialData?.flowType || 'DESENVOLVIMENTO',
        environment: initialData?.environment || '',
        code: initialData?.code || '',
        link: initialData?.link || '',
        meetingLink: initialData?.meetingLink || '',
        hasSubTasks: initialData?.hasSubTasks !== undefined ? initialData.hasSubTasks : false,
        amount: initialData?.amount || '',
        taskType: initialData?.taskType || '',
        serverOrigin: initialData?.serverOrigin || '',
        systemModule: initialData?.systemModule || '',
        priority: initialData?.priority || 'MEDIUM',
        subTasks: initialData?.subTasks
          ? [...initialData.subTasks].sort((a: any, b: any) => {
              const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER
              const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER
              if (ao !== bo) return ao - bo
              if (a.id && b.id) return a.id - b.id
              if (a.id) return -1
              if (b.id) return 1
              return 0
            })
          : [{ title: '', description: '', amount: '' }],
      })
    }
  }, [initialData, reset])

  const [subTaskError, setSubTaskError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [attachmentRefresh, setAttachmentRefresh] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [attachmentCount, setAttachmentCount] = useState(0)
  const [isAttachmentSectionExpanded, setIsAttachmentSectionExpanded] = useState(false)

  const handleHasSubTasksChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    if (!isChecked && initialData?.id && watchSubTasks) {
      const activeSubTasks = watchSubTasks.filter((st: any) => !st?.excluded)
      if (activeSubTasks.length > 0) {
        setSubTaskError('Para desmarcar esta opção, você precisa remover todas as subtarefas primeiro e depois atualizar a tarefa.')
        setTimeout(() => { setValue('hasSubTasks', true) }, 0)
        return
      }
    }
    setSubTaskError(null)
    setValue('hasSubTasks', isChecked)
  }, [initialData?.id, watchSubTasks, setValue])

  const handleFormSubmit = async (data: TaskData): Promise<void> => {
    try {
      setSubTaskError(null)
      setFormError(null)

      if (data.hasSubTasks) {
        if (!data.subTasks || data.subTasks.length === 0) {
          const msg = 'Quando "Esta tarefa possui subtarefas" estiver marcado, você deve adicionar pelo menos uma subtarefa.'
          setFormError(msg)
          toast.error(msg)
          document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        const invalid = data.subTasks
          .map((st: any, idx: number) => ({ index: idx + 1, hasTitle: st.title && st.title.trim() !== '' }))
          .filter((s) => !s.hasTitle)
        if (invalid.length > 0) {
          const msg = invalid.length === 1
            ? `Subtarefa ${invalid[0].index}: O título é obrigatório`
            : `Subtarefas ${invalid.map((s) => s.index).join(', ')}: Os títulos são obrigatórios`
          setFormError(msg)
          toast.error(msg)
          document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
      }

      // Fluxo DESENVOLVIMENTO: se o link não foi informado, monta a partir do código (tarefa do ClickUp).
      const trimmedCode = (data.code || '').trim()
      const derivedLink =
        (!data.link || !data.link.trim()) && data.flowType === 'DESENVOLVIMENTO' && trimmedCode
          ? `https://app.clickup.com/t/${trimmedCode}`
          : data.link

      const formatted = {
        ...data,
        link: derivedLink,
        requesterId: data.requesterId || initialData?.requesterId,
        amount: data.hasSubTasks ? undefined : (isAdmin ? parseFloat(data.amount || '0') : null),
        subTasks: data.hasSubTasks
          ? (data.subTasks || []).map((st: any, idx: number) => ({
              ...st,
              amount: parseFloat(st.amount || '0'),
              sortOrder: idx + 1,
              taskId: initialData?.id || null,
            }))
          : [],
      }

      await onSubmit(formatted, pendingFiles.length > 0 ? pendingFiles : undefined)

      if (!initialData?.id) {
        reset()
        setPendingFiles([])
      }
    } catch (error: any) {
      console.error('Erro no formulário de tarefa:', error)
      if (error?.message?.includes('Tem Subtarefas')) {
        setSubTaskError('Não é possível desmarcar "Tem Subtarefas" enquanto existirem subtarefas vinculadas. Remova todas as subtarefas primeiro.')
        setValue('hasSubTasks', true)
        return
      }
      if (error?.message?.includes('Requester not selected')) {
        return
      }

      // Extrai mensagem do backend (ProblemDetail RFC 7807 / errors array / message simples)
      let msg = 'Erro ao processar solicitação'
      const code = error?.response?.data?.code ?? error?.response?.data?.errorCode
      if (error.response?.data?.detail) msg = error.response.data.detail
      else if (error.response?.data?.message) msg = error.response.data.message
      else if (error.response?.data?.errors) msg = `Campos inválidos: ${error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`
      else if (error.message) msg = error.message

      // Erros conhecidos → aponta direto no campo
      const isDuplicateCode = code === 'DUPLICATE_TASK_CODE' || /código.*j[áa].*existe|duplicate.*code/i.test(msg)
      if (isDuplicateCode) {
        methods.setError('code', { type: 'manual', message: msg }, { shouldFocus: true })
        document.getElementById('field-code')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // useTasks já dispara toast.error com a mensagem do backend — não duplica
        return
      }

      // Fallback: mostra banner no topo (sem resetar form)
      setFormError(msg)
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // useTasks já dispara toast.error pra erros do backend. Não duplicar.
    }
  }

  const taskTypeOptions = flowType === 'OPERACIONAL' ? OPS_TASK_TYPES : DEV_TASK_TYPES

  const handleFormInvalid = (formErrors: any) => {
    // RHF bloqueou o submit. Mostra toast com o primeiro erro pro usuário saber
    // que tem algo no form mesmo que o erro inline esteja fora da viewport.
    const firstError = Object.values(formErrors)[0] as any
    const msg = firstError?.message || 'Há campos obrigatórios pendentes'
    toast.error(msg)
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)} className="pb-24">
        <input {...register('requesterId')} type="hidden" />

        {formError && (
          <div className="mb-6 flex gap-3 rounded-md border border-danger-border bg-danger-soft p-4">
            <AlertCircle className="size-5 shrink-0 text-[var(--danger-strong)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--danger-strong)]">Erro ao processar solicitação</p>
              <p className="mt-1 text-sm text-[var(--danger-strong)]/90">{formError}</p>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-sm font-medium text-[var(--danger-strong)] hover:underline shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="space-y-6 rounded-lg border border-border-subtle bg-surface-1 p-6">

          {/* Classificação */}
          <FormSection title="Classificação">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Tipo de Fluxo <span className="text-[var(--danger-strong)]">*</span>
              </label>
              <Controller
                control={control}
                name="flowType"
                render={({ field }) => <SegmentedFlow value={field.value} onChange={field.onChange} disabled={isSubmitting || loading} />}
              />
              {errors.flowType && <p className="mt-1 text-xs text-[var(--danger-strong)]">{errors.flowType.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                {...register('code')}
                id="field-code"
                label="Código"
                placeholder={
                  initialData?.id
                    ? 'Digite o código'
                    : (flowType === 'OPERACIONAL' ? 'Gerado automaticamente' : 'Digite o código')
                }
                error={errors.code?.message}
                maxLength={100}
                required={flowType === 'DESENVOLVIMENTO' || !!initialData?.id}
                disabled={flowType === 'OPERACIONAL' && !initialData?.id}
              />
              <Controller
                control={control}
                name="priority"
                render={({ field }) => {
                  const current = PRIORITY_OPTIONS.find((o) => o.value === field.value)
                  return (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Prioridade <span className="text-[var(--danger-strong)]">*</span>
                      </label>
                      <RSelect value={field.value} onValueChange={field.onChange}>
                        <RSelectTrigger className="w-full">
                          <RSelectValue>
                            {current ? (
                              <span className="inline-flex items-center gap-2">
                                <span className={cn('size-2.5 rounded-full', current.dot)} />
                                {current.label}
                              </span>
                            ) : 'Selecione…'}
                          </RSelectValue>
                        </RSelectTrigger>
                        <RSelectContent>
                          {PRIORITY_OPTIONS.map((o) => (
                            <RSelectItem key={o.value} value={o.value}>
                              <span className="inline-flex items-center gap-2">
                                <span className={cn('size-2.5 rounded-full', o.dot)} />
                                {o.label}
                              </span>
                            </RSelectItem>
                          ))}
                        </RSelectContent>
                      </RSelect>
                      {errors.priority && <p className="mt-1 text-xs text-[var(--danger-strong)]">{errors.priority.message}</p>}
                    </div>
                  )
                }}
              />
              <Controller
                control={control}
                name="taskType"
                render={({ field }) => {
                  const meta = field.value ? TASK_TYPE_META[field.value] : undefined
                  const Icon = meta?.Icon
                  return (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Tipo de Tarefa</label>
                      <RSelect value={field.value || ''} onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}>
                        <RSelectTrigger className="w-full">
                          <RSelectValue placeholder="Selecione…">
                            {field.value ? (
                              <span className="inline-flex items-center gap-1.5">
                                {Icon && <Icon className={cn('size-3.5', meta?.iconClass)} />}
                                {meta?.label || field.value}
                              </span>
                            ) : 'Selecione…'}
                          </RSelectValue>
                        </RSelectTrigger>
                        <RSelectContent>
                          <RSelectItem value="__none">Selecione…</RSelectItem>
                          {taskTypeOptions.filter((o) => o.value).map((o) => {
                            const m = TASK_TYPE_META[o.value]
                            const I = m?.Icon
                            return (
                              <RSelectItem key={o.value} value={o.value}>
                                <span className="inline-flex items-center gap-1.5">
                                  {I && <I className={cn('size-3.5', m?.iconClass)} />}
                                  {o.label}
                                </span>
                              </RSelectItem>
                            )
                          })}
                        </RSelectContent>
                      </RSelect>
                      {errors.taskType && <p className="mt-1 text-xs text-[var(--danger-strong)]">{errors.taskType.message}</p>}
                    </div>
                  )
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                control={control}
                name="environment"
                render={({ field }) => {
                  const meta = field.value ? ENV_META[field.value] : undefined
                  const Icon = meta?.Icon
                  return (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Ambiente</label>
                      <RSelect value={field.value || ''} onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}>
                        <RSelectTrigger className="w-full">
                          <RSelectValue placeholder="Selecione…">
                            {field.value ? (
                              <span className="inline-flex items-center gap-1.5">
                                {Icon && <Icon className={cn('size-3.5', meta?.iconClass)} />}
                                {meta?.label || field.value}
                              </span>
                            ) : 'Selecione…'}
                          </RSelectValue>
                        </RSelectTrigger>
                        <RSelectContent>
                          <RSelectItem value="__none">Selecione…</RSelectItem>
                          {ENV_OPTIONS.filter((o) => o.value).map((o) => {
                            const m = ENV_META[o.value]
                            const I = m?.Icon
                            return (
                              <RSelectItem key={o.value} value={o.value}>
                                <span className="inline-flex items-center gap-1.5">
                                  {I && <I className={cn('size-3.5', m?.iconClass)} />}
                                  {o.label}
                                </span>
                              </RSelectItem>
                            )
                          })}
                        </RSelectContent>
                      </RSelect>
                      {errors.environment && <p className="mt-1 text-xs text-[var(--danger-strong)]">{errors.environment.message}</p>}
                    </div>
                  )
                }}
              />
              <Input
                {...register('systemModule')}
                label="Módulo do Sistema"
                placeholder="Ex: Autenticação, Relatórios…"
                error={errors.systemModule?.message}
                maxLength={100}
              />
              <Input
                {...register('serverOrigin')}
                label="Servidor"
                placeholder="Ex: prod-app-01"
                error={errors.serverOrigin?.message}
                maxLength={100}
              />
            </div>
          </FormSection>

          {/* Conteúdo */}
          <FormSection title="Conteúdo">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Título <span className="text-[var(--danger-strong)]">*</span>
              </label>
              <textarea
                {...register('title')}
                rows={2}
                placeholder="O que precisa ser feito? (máx. 200 caracteres)"
                className="w-full px-3 py-2 border border-border-strong rounded-md bg-surface-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-y"
                maxLength={200}
              />
              {errors.title && <p className="mt-1 text-xs text-[var(--danger-strong)]">{errors.title.message}</p>}
            </div>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição</label>
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Detalhe a tarefa (opcional). Cole imagens com Ctrl+V ou arraste e solte."
                    error={errors.description?.message}
                    disabled={isSubmitting || loading}
                    minHeight="160px"
                    entityType="TASK"
                    entityId={taskId || initialData?.id}
                  />
                </div>
              )}
            />
          </FormSection>

          {/* Links */}
          <FormSection title="Links" description="Opcional">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('link')}
                type="url"
                label="Link da Tarefa"
                placeholder="https://app.clickup.com/…"
                error={errors.link?.message}
                maxLength={200}
              />
              <Input
                {...register('meetingLink')}
                type="url"
                label="Link da Reunião"
                placeholder="https://meet.google.com/…"
                error={errors.meetingLink?.message}
                maxLength={500}
              />
            </div>
          </FormSection>

          {/* Subtarefas / Valor */}
          <FormSection title="Cobrança">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                {...register('hasSubTasks')}
                type="checkbox"
                id="hasSubTasks"
                onChange={handleHasSubTasksChange}
                className="size-4 rounded border-border-strong text-accent focus:ring-accent/30"
              />
              <span className="text-sm font-medium text-text-secondary">Esta tarefa possui subtarefas</span>
            </label>
            {subTaskError && (
              <div className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-[var(--danger-strong)]">
                {subTaskError}
              </div>
            )}

            {hasSubTasks ? (
              <div className="rounded-md border border-border-subtle bg-surface-app/40 p-4">
                <SubTaskForm taskId={taskId || initialData?.id} />
                {errors.subTasks && <p className="mt-2 text-xs text-[var(--danger-strong)]">{(errors as any).subTasks?.message}</p>}
              </div>
            ) : (
              isAdmin && (
                <div className="max-w-xs">
                  <Input
                    {...register('amount')}
                    type="number"
                    step="0.01"
                    min="0"
                    label="Valor da Tarefa"
                    placeholder="0,00"
                    error={errors.amount?.message}
                  />
                </div>
              )
            )}
          </FormSection>

          {/* Anexos */}
          <FormSection title="Anexos">
            <button
              type="button"
              onClick={() => setIsAttachmentSectionExpanded(!isAttachmentSectionExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-border-subtle hover:bg-surface-2 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Paperclip className="size-4 text-text-tertiary" />
                Arquivos anexados
                {!taskId && pendingFiles.length > 0 && (
                  <span className="text-xs font-semibold text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">{pendingFiles.length}</span>
                )}
                {taskId && attachmentCount > 0 && (
                  <span className="text-xs font-semibold text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">{attachmentCount}</span>
                )}
              </span>
              {isAttachmentSectionExpanded
                ? <ChevronUp className="size-4 text-text-tertiary" />
                : <ChevronDown className="size-4 text-text-tertiary" />}
            </button>

            {taskId && taskId > 0 && !isAttachmentSectionExpanded && (
              <div className="hidden">
                <AttachmentList taskId={taskId} refreshTrigger={attachmentRefresh} onCountChange={setAttachmentCount} />
              </div>
            )}

            {isAttachmentSectionExpanded && (
              <div className="mt-3 rounded-md border border-border-subtle p-4 bg-surface-app/40">
                <p className="text-xs text-text-tertiary mb-3">
                  {taskId
                    ? 'Faça upload de documentos, imagens e outros arquivos da tarefa.'
                    : 'Selecione arquivos que serão anexados após criar a tarefa.'}
                </p>
                <FilePicker
                  files={pendingFiles}
                  onFilesChange={setPendingFiles}
                  maxFiles={10}
                  maxFileSize={10}
                  disabled={isSubmitting || loading}
                  taskId={taskId}
                  showUploadButton={!!taskId}
                  onUploadSuccess={(attachments) => {
                    onFilesUploaded?.(attachments)
                    setAttachmentRefresh((p) => p + 1)
                  }}
                />
                {taskId && taskId > 0 && (
                  <div className="mt-4">
                    <AttachmentList
                      taskId={taskId}
                      refreshTrigger={attachmentRefresh}
                      forceExpanded={true}
                      onCountChange={setAttachmentCount}
                    />
                  </div>
                )}
              </div>
            )}
          </FormSection>
        </div>

        {/* Sticky footer com ações primárias */}
        <div className="sticky bottom-0 -mx-3 sm:-mx-4 lg:-mx-4 mt-6 px-3 sm:px-4 lg:px-4 py-3 bg-surface-app/95 backdrop-blur border-t border-border-subtle z-20">
          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || loading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={isSubmitting || loading} disabled={isSubmitting || loading}>
              {initialData?.id ? 'Salvar alterações' : 'Criar tarefa'}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

export default TaskForm
