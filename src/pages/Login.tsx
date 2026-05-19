import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, User, LogIn, Zap, Phone, Mail, Linkedin, Github, Instagram, Facebook } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'

type FormValues = { username: string; password: string }

const loginSchema = yup.object({
  username: yup.string().required('Usuário é obrigatório'),
  password: yup.string().required('Senha é obrigatória'),
})

export default function Login() {
  const { login, isLoading } = useAuth() as any
  const navigate = useNavigate()
  const location = useLocation() as any
  const redirectTo = location?.state?.from?.pathname || '/dashboard'

  const [showPassword, setShowPassword] = React.useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(loginSchema) as any,
    mode: 'onChange',
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await login({ username: data.username, password: data.password })
      toast.success('Login realizado com sucesso')
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Usuário ou senha inválidos')
    }
  }

  return (
    <div className="min-h-screen bg-surface-app flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm mb-4">
            <Zap className="size-7" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">DevQuote</h1>
          <p className="text-sm text-text-secondary mt-1">Faça login para acessar sua conta</p>
        </div>

        {/* Form card */}
        <div className="bg-surface-1 rounded-xl border border-border-subtle shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-text-secondary mb-1.5">Usuário</label>
              <Input
                id="username"
                leadingIcon={<User />}
                placeholder="Digite seu usuário"
                autoComplete="username"
                {...register('username')}
                invalid={!!errors.username}
              />
              {errors.username?.message && <p className="text-xs text-danger-strong mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">Senha</label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                leadingIcon={<Lock />}
                trailingIcon={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-tertiary hover:text-text-primary" aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
                placeholder="Digite sua senha"
                autoComplete="current-password"
                {...register('password')}
                invalid={!!errors.password}
              />
              {errors.password?.message && <p className="text-xs text-danger-strong mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" loading={isLoading} leadingIcon={!isLoading ? <LogIn /> : undefined}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Desenvolvido por Wesley Eduardo</p>
            <p className="text-xs text-text-tertiary">Desenvolvedor Full Stack</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-xs text-text-tertiary">
            <a href="tel:+5598981650805" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
              <Phone className="size-3" />+55 98 98165-0805
            </a>
            <a href="mailto:wesleyeduardo.dev@gmail.com" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
              <Mail className="size-3" />wesleyeduardo.dev@gmail.com
            </a>
          </div>

          <div className="flex justify-center gap-2 pt-1">
            <SocialIcon href="https://www.linkedin.com/in/wesley-eduardo-8a1066169/" Icon={Linkedin} label="LinkedIn" />
            <SocialIcon href="https://github.com/wesleyeduardodev" Icon={Github} label="GitHub" />
            <SocialIcon href="https://www.instagram.com/wesleyeduardo.dev" Icon={Instagram} label="Instagram" />
            <SocialIcon href="https://www.facebook.com/wesleyeduardo.dev" Icon={Facebook} label="Facebook" />
          </div>

          <p className="text-xs text-text-tertiary pt-2">© {new Date().getFullYear()} DevQuote</p>
        </div>
      </div>
    </div>
  )
}

const SocialIcon: React.FC<{ href: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = ({ href, Icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-surface-1 border border-border-subtle text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
    aria-label={label}
  >
    <Icon className="size-3.5" />
  </a>
)
