import * as React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Github, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'

export interface ProjectFormData {
  name: string
  repositoryUrl?: string
}

const schema = yup.object({
  name: yup.string().required('Nome é obrigatório').max(200, 'Máximo 200 caracteres'),
  repositoryUrl: yup.string().url('URL inválida').max(500, 'Máximo 500 caracteres').optional(),
})

interface Props {
  initialData?: Partial<ProjectFormData>
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export const ProjectFormV2: React.FC<Props> = ({ initialData, onSubmit, onCancel, loading, submitLabel = 'Salvar' }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: initialData?.name || '',
      repositoryUrl: initialData?.repositoryUrl || '',
    },
  })

  return (
    <form onSubmit={handleSubmit(async (data) => { await onSubmit(data) })} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Nome do projeto <span className="text-danger-strong">*</span>
        </label>
        <Input leadingIcon={<FolderKanban />} placeholder="Mentor Web" {...register('name')} invalid={!!errors.name} autoFocus />
        {errors.name?.message && <p className="mt-1 text-xs text-danger-strong">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">URL do repositório</label>
        <Input leadingIcon={<Github />} placeholder="https://github.com/org/repo" {...register('repositoryUrl')} invalid={!!errors.repositoryUrl} />
        {errors.repositoryUrl?.message
          ? <p className="mt-1 text-xs text-danger-strong">{errors.repositoryUrl.message}</p>
          : <p className="mt-1 text-xs text-text-tertiary">Opcional. Aceita GitHub, GitLab, Bitbucket.</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
