import * as React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Boxes } from 'lucide-react'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'

export interface ModuleFormData {
  name: string
}

const schema = yup.object({
  name: yup.string().required('Nome é obrigatório').max(150, 'Máximo 150 caracteres'),
})

interface Props {
  initialData?: Partial<ModuleFormData>
  onSubmit: (data: ModuleFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export const ModuleFormV2: React.FC<Props> = ({ initialData, onSubmit, onCancel, loading, submitLabel = 'Salvar' }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ModuleFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { name: initialData?.name || '' },
  })

  return (
    <form onSubmit={handleSubmit(async (data) => { await onSubmit(data) })} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Nome do módulo <span className="text-danger-strong">*</span>
        </label>
        <Input leadingIcon={<Boxes />} placeholder="Ex: Diário de Obra, Orçamento de Obra…" {...register('name')} invalid={!!errors.name} autoFocus />
        {errors.name?.message && <p className="mt-1 text-xs text-danger-strong">{errors.name.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
