import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, User, LogIn, Zap, Phone, Mail, Linkedin, Github, Instagram, Facebook, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'

type FormValues = { username: string; password: string }

const WMELO_URL = 'https://wmelotech-production.up.railway.app/'

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
    <div className="min-h-screen bg-surface-app lg:grid lg:grid-cols-2">
      {/* ---- Painel de marca (WMelo Tech) — só desktop ---- */}
      <BrandPanel />

      {/* ---- Coluna do formulário ---- */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Logo DevQuote */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-fg shadow-lg shadow-accent/25 mb-4">
              <Zap className="size-7" strokeWidth={2.25} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">DevQuote</h1>
            <p className="text-sm text-text-secondary mt-1">Faça login para acessar sua conta</p>
          </div>

          {/* Card do formulário */}
          <div className="bg-surface-1 rounded-2xl border border-border-subtle shadow-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-text-secondary mb-1.5">Usuário</label>
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
                <label htmlFor="password" className="block text-xs font-semibold text-text-secondary mb-1.5">Senha</label>
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

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
              <ShieldCheck className="size-3.5" />
              Conexão segura · acesso restrito
            </p>
          </div>

          {/* Rodapé — empresa */}
          <Footer />
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * Painel lateral de marca — WMelo Tech (sempre dark, é showcase)
 * ============================================================ */
const TEAL = '#2DD4BF'

function BrandPanel() {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      style={{ background: 'radial-gradient(120% 120% at 80% 0%, #112233 0%, #0A0F1C 45%, #070A14 100%)' }}
    >
      {/* grade sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(45,212,191,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(120% 90% at 50% 30%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 50% 30%, #000 40%, transparent 100%)',
        }}
        aria-hidden
      />
      {/* brilho teal */}
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* topo: logo WMelo */}
      <div className="relative z-10">
        <a href={WMELO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 group">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#06281f] font-black text-xl shadow-lg transition-transform group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, #5EEAD4 0%, ${TEAL} 100%)` }}
          >
            W
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            WMelo <span style={{ color: TEAL }}>Tech</span>
          </span>
        </a>
      </div>

      {/* centro: proposta de valor */}
      <div className="relative z-10 max-w-md">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs"
          style={{ borderColor: 'rgba(45,212,191,0.3)', color: TEAL, background: 'rgba(45,212,191,0.06)' }}
        >
          <span className="inline-block size-1.5 rounded-full" style={{ background: TEAL }} />
          // um produto WMelo Tech
        </span>

        <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
          Controle total dos seus{' '}
          <span style={{ color: TEAL }}>orçamentos e entregas</span>.
        </h2>

        <p className="mt-5 text-base leading-relaxed text-slate-300/90">
          O DevQuote centraliza solicitantes, tarefas, entregas e faturamento
          num só lugar — feito sob medida pela WMelo Tech para times de tecnologia.
        </p>

        {/* stats */}
        <div className="mt-10 grid grid-cols-3 gap-6 border-t pt-8" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Stat value="10+" label="Anos de experiência" />
          <Stat value="50+" label="Projetos entregues" />
          <Stat value="99%" label="Uptime garantido" />
        </div>
      </div>

      {/* rodapé: link pro site */}
      <div className="relative z-10">
        <a
          href={WMELO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-white"
        >
          Conheça a WMelo Tech
          <ArrowUpRight className="size-4" style={{ color: TEAL }} />
        </a>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold xl:text-3xl" style={{ color: TEAL }}>{value}</div>
      <div className="mt-1 text-xs leading-snug text-slate-400">{label}</div>
    </div>
  )
}

/* ============================================================
 * Rodapé — empresa WMelo Tech
 * ============================================================ */
function Footer() {
  return (
    <div className="text-center mt-8 space-y-3">
      <div>
        <a
          href={WMELO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary transition-colors hover:text-accent"
        >
          Desenvolvido por WMelo Tech
          <ArrowUpRight className="size-3.5" />
        </a>
        <p className="text-xs text-text-tertiary">Soluções em tecnologia sob medida</p>
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

      <p className="text-xs text-text-tertiary pt-2">© {new Date().getFullYear()} WMelo Tech · DevQuote</p>
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
