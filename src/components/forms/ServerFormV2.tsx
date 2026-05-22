import * as React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Server as ServerIcon, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'

export interface ServerFormData {
  name: string
  link?: string
}

const schema = yup.object({
  name: yup.string().required('Nome é obrigatório').max(150, 'Máximo 150 caracteres'),
  link: yup.string().url('URL inválida').max(300, 'Máximo 300 caracteres').optional(),
})

interface Props {
  initialData?: Partial<ServerFormData>
  onSubmit: (data: ServerFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export const ServerFormV2: React.FC<Props> = ({ initialData, onSubmit, onCancel, loading, submitLabel = 'Salvar' }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ServerFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { name: initialData?.name || '', link: initialData?.link || '' },
  })

  return (
    <form onSubmit={handleSubmit(async (data) => { await onSubmit(data) })} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Nome do servidor <span className="text-danger-strong">*</span>
        </label>
        <Input leadingIcon={<ServerIcon />} placeholder="Ex: Acciona, Andrade…" {...register('name')} invalid={!!errors.name} autoFocus />
        {errors.name?.message && <p className="mt-1 text-xs text-danger-strong">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">Link</label>
        <Input leadingIcon={<LinkIcon />} placeholder="https://acciona.mentorconstrucaoapp.com.br" {...register('link')} invalid={!!errors.link} />
        {errors.link?.message
          ? <p className="mt-1 text-xs text-danger-strong">{errors.link.message}</p>
          : <p className="mt-1 text-xs text-text-tertiary">Opcional. Padrão: https://&lt;tenant&gt;.mentorconstrucaoapp.com.br</p>}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
