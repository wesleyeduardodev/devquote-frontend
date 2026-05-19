import * as React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'

export interface RequesterFormData {
  name: string
  email: string
  phone?: string
}

const schema = yup.object({
  name: yup.string().required('Nome é obrigatório').max(200, 'Máximo 200 caracteres'),
  email: yup.string().required('Email é obrigatório').email('Email inválido').max(200, 'Máximo 200 caracteres'),
  phone: yup.string().max(20, 'Máximo 20 caracteres').optional(),
})

interface Props {
  initialData?: Partial<RequesterFormData>
  onSubmit: (data: RequesterFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export const RequesterFormV2: React.FC<Props> = ({ initialData, onSubmit, onCancel, loading, submitLabel = 'Salvar' }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<RequesterFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit(async (data) => { await onSubmit(data) })}
      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(async (d) => onSubmit(d))() }}
      className="space-y-5"
    >
      <Field label="Nome" required error={errors.name?.message}>
        <Input leadingIcon={<User />} placeholder="Nome completo" {...register('name')} invalid={!!errors.name} autoFocus />
      </Field>

      <Field label="E-mail" required error={errors.email?.message}>
        <Input leadingIcon={<Mail />} type="email" placeholder="email@exemplo.com" {...register('email')} invalid={!!errors.email} />
      </Field>

      <Field label="Telefone" hint="Opcional. Apenas números." error={errors.phone?.message}>
        <Input leadingIcon={<Phone />} placeholder="(98) 98765-4321" {...register('phone')} invalid={!!errors.phone} />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}

const Field: React.FC<{
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}> = ({ label, required, hint, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-text-secondary mb-1.5">
      {label} {required && <span className="text-danger-strong">*</span>}
    </label>
    {children}
    {error
      ? <p className="mt-1 text-xs text-danger-strong">{error}</p>
      : hint ? <p className="mt-1 text-xs text-text-tertiary">{hint}</p> : null}
  </div>
)
