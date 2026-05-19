import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Save, User, Mail, Lock, AlertTriangle, Settings } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { AuthService } from '@/services/authService'

import { FormPage } from '@/components/ui-v2/FormPage'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { Separator } from '@/components/ui-v2/Separator'

interface FormState {
  username: string
  name: string
  email: string
  password: string
  confirmPassword: string
}

export const UserSettings: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth() as any
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<FormState>({ username: '', name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = React.useState<Partial<FormState>>({})

  React.useEffect(() => {
    if (user) {
      setData({
        username: user.username || '',
        name: user.name || user.firstName || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
      })
    }
  }, [user])

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.name || user?.name.trim() === '') {
        try {
          const current = await AuthService.getCurrentUser()
          if (current?.name) {
            setData((prev) => ({
              ...prev,
              username: current.username || prev.username,
              name: current.name || prev.name,
              email: current.email || prev.email,
            }))
          }
        } catch (e) { console.error(e) }
      }
    }
    fetchUserData()
  }, [user])

  const validate = (): boolean => {
    const next: Partial<FormState> = {}
    if (!data.username.trim()) next.username = 'Nome de usuário é obrigatório'
    if (!data.name.trim()) next.name = 'Nome completo é obrigatório'
    if (!data.email.trim()) next.email = 'E-mail é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = 'Formato de e-mail inválido'
    if (data.password) {
      if (data.password.length < 6) next.password = 'Mínimo 6 caracteres'
      if (data.password !== data.confirmPassword) next.confirmPassword = 'As senhas não coincidem'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await AuthService.updateProfile(data as any)
      toast.success('Perfil atualizado. Faça login novamente.')
      logout()
      navigate('/login')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Falha ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof FormState>(k: K, v: string) => {
    setData((prev) => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }))
  }

  if (!user) {
    return (
      <FormPage title="Configurações" backTo="/dashboard" icon={<Settings />}>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </FormPage>
    )
  }

  return (
    <FormPage
      title="Configurações"
      subtitle="Atualize seus dados de acesso"
      backTo="/dashboard"
      backLabel="Voltar"
      icon={<Settings />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Perfil */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-3 inline-flex items-center gap-1.5">
            <User className="size-3.5" />Perfil
          </h2>

          <div className="space-y-4">
            <Field label="Nome de usuário" hint="Não pode ser alterado" error={errors.username}>
              <Input leadingIcon={<User />} value={data.username} disabled />
            </Field>

            <Field label="Nome completo" required error={errors.name}>
              <Input leadingIcon={<User />} value={data.name} onChange={(e) => set('name', e.target.value)} invalid={!!errors.name} />
            </Field>

            <Field label="E-mail" required error={errors.email}>
              <Input leadingIcon={<Mail />} type="email" value={data.email} onChange={(e) => set('email', e.target.value)} invalid={!!errors.email} />
            </Field>
          </div>
        </section>

        <Separator />

        {/* Senha */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-1 inline-flex items-center gap-1.5">
            <Lock className="size-3.5" />Alterar senha
          </h2>
          <p className="text-xs text-text-tertiary mb-3">Deixe em branco para manter a senha atual</p>

          <div className="space-y-4">
            <Field label="Nova senha" error={errors.password}>
              <Input leadingIcon={<Lock />} type="password" value={data.password} onChange={(e) => set('password', e.target.value)} invalid={!!errors.password} />
            </Field>

            <Field label="Confirmar nova senha" error={errors.confirmPassword}>
              <Input leadingIcon={<Lock />} type="password" value={data.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} invalid={!!errors.confirmPassword} />
            </Field>
          </div>
        </section>

        <div className="rounded-md border border-warning-border bg-warning-soft p-3 flex items-start gap-2">
          <AlertTriangle className="size-4 text-warning-strong shrink-0 mt-0.5" />
          <p className="text-xs text-warning-strong">
            Após atualizar, você será desconectado e precisará fazer login novamente.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={loading}>Cancelar</Button>
          <Button type="submit" loading={loading} leadingIcon={!loading ? <Save /> : undefined}>Salvar alterações</Button>
        </div>
      </form>
    </FormPage>
  )
}

const Field: React.FC<{ label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }> = ({ label, required, hint, error, children }) => (
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
