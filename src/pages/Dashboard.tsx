import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  ListChecks, Truck, DollarSign, TrendingUp, CheckCircle2, AlertTriangle,
  ArrowRight, Activity as ActivityIcon, Inbox, FileWarning, Link2Off, Clock,
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import billingPeriodService from '@/services/billingPeriodService'
import { taskService } from '@/services/taskService'
import { deliveryService } from '@/services/deliveryService'
import { cn } from '@/utils/cn'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-v2/Card'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Badge } from '@/components/ui-v2/Badge'
import { DeliveryPipelineOverview } from '@/components/deliveries/DeliveryPipelineOverview'
import { STATUS_LABEL as DLV_LABEL, STATUS_TONE as DLV_TONE } from '@/components/deliveries/DeliveryStatusBadge'

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* ============================ KPI Card ============================ */
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONE_STYLE: Record<Tone, { bg: string; border: string; dot: string; value: string; label: string }> = {
  neutral: { bg: 'bg-surface-1',    border: 'border-border-subtle',  dot: 'bg-text-tertiary',  value: 'text-text-primary',            label: 'text-text-tertiary' },
  success: { bg: 'bg-success-soft',  border: 'border-success-border', dot: 'bg-success-strong', value: 'text-[var(--success-strong)]', label: 'text-[var(--success-strong)]' },
  warning: { bg: 'bg-warning-soft',  border: 'border-warning-border', dot: 'bg-warning-strong', value: 'text-[var(--warning-strong)]', label: 'text-[var(--warning-strong)]' },
  danger:  { bg: 'bg-danger-soft',   border: 'border-danger-border',  dot: 'bg-danger-strong',  value: 'text-[var(--danger-strong)]',  label: 'text-[var(--danger-strong)]' },
  info:    { bg: 'bg-info-soft',     border: 'border-info-border',    dot: 'bg-info-strong',    value: 'text-[var(--info-strong)]',    label: 'text-[var(--info-strong)]' },
}

interface KpiCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: Tone
  icon?: React.ReactNode
  to?: string
  loading?: boolean
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, tone = 'neutral', icon, to, loading }) => {
  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </Card>
    )
  }
  const s = TONE_STYLE[tone]
  const inner = (
    <Card className={cn('p-5 border transition-shadow', s.bg, s.border, to && 'hover:shadow-sm cursor-pointer')}>
      <div className={cn('flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide', s.label)}>
        {icon ? <span className="[&_svg]:size-3.5">{icon}</span> : <span className={cn('inline-block h-2 w-2 rounded-full', s.dot)} />}
        {label}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums', s.value)}>{value}</p>
      {hint && (
        <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
          {hint}
          {to && <ArrowRight className="size-3 ml-auto opacity-60" />}
        </div>
      )}
    </Card>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

/* ============================ Trend chart ============================ */
const TrendChart: React.FC<{ data: { label: string; value: number }[]; loading?: boolean }> = ({ data, loading }) => {
  if (loading) return <Skeleton className="h-64 w-full" />
  if (!data || data.length === 0) {
    return <EmptyState icon={<TrendingUp />} title="Sem dados de faturamento" description="Conforme períodos forem criados, a tendência aparecerá aqui." />
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dash-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.20} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60}
            tickFormatter={(v) => `R$ ${(Number(v) / 1000).toFixed(0)}k`} />
          <RTooltip
            contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(v: any) => [brl(Number(v)), 'Faturado']}
          />
          <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#dash-trend-fill)" name="Faturado" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ============================ Activity Feed ============================ */
const STATUS_TRANSLATE: Record<string, string> = {
  PENDING: 'Pendente', DEVELOPMENT: 'Desenvolvimento', DELIVERED: 'Entregue', HOMOLOGATION: 'Homologação',
  APPROVED: 'Aprovado', REJECTED: 'Rejeitado', PRODUCTION: 'Produção', CANCELLED: 'Cancelado',
}
const translateDescription = (desc: string) =>
  desc.replace(/Status:\s*([A-Z_]+)/g, (_, s) => `Status: ${STATUS_TRANSLATE[s] || s}`)

const ActivityFeed: React.FC<{ items: any[]; loading?: boolean }> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2 w-20" /></div>
          </div>
        ))}
      </div>
    )
  }
  if (!items || items.length === 0) {
    return <EmptyState icon={<ActivityIcon />} title="Sem atividade recente" description="Eventos aparecerão aqui conforme o sistema for usado." />
  }
  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map((a, i) => {
        const isDelivery = a.type === 'DELIVERY'
        return (
          <li key={`${a.entityId}-${i}`} className="flex items-start gap-3">
            <div className={cn('h-8 w-8 rounded-full grid place-items-center shrink-0',
              isDelivery ? 'bg-info-soft text-[var(--info-strong)]' : 'bg-accent-soft text-accent')}>
              {isDelivery ? <Truck className="size-3.5" /> : <ListChecks className="size-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{translateDescription(a.description || '')}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {a.user} · {a.timestamp ? format(new Date(a.timestamp), "dd MMM, HH:mm", { locale: ptBR }) : '—'}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ============================ Attention card ============================ */
interface AttentionItem { icon: React.ReactNode; label: string; href: string }
const AttentionCard: React.FC<{ items: AttentionItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return (
      <Card className="p-5 border-success-border bg-success-soft/40">
        <div className="flex items-center gap-2 text-[var(--success-strong)]">
          <CheckCircle2 className="size-4" />
          <span className="text-sm font-medium">Tudo em dia — nenhum gargalo no pipeline.</span>
        </div>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-md">
          <AlertTriangle className="size-4 text-[var(--warning-strong)]" />
          Requer atenção
          <Badge variant="warning" size="sm">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border-subtle">
          {items.map((it, i) => (
            <li key={i}>
              <Link to={it.href} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors group">
                <span className="text-[var(--warning-strong)] [&_svg]:size-4">{it.icon}</span>
                <span className="text-sm text-text-primary flex-1">{it.label}</span>
                <ArrowRight className="size-3.5 text-text-tertiary opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/* ============================ Dashboard ============================ */
const TO_RECEIVE_STATUSES = ['PENDENTE', 'FATURADO', 'ATRASADO']

const Dashboard: React.FC = () => {
  const { stats: dash, loading: dashLoading } = useDashboard()
  const { user, hasProfile } = useAuth() as any
  const canViewValues = hasProfile ? (hasProfile('ADMIN') || hasProfile('MANAGER')) : false
  const firstName = (user?.name || user?.username || 'Usuário').split(' ')[0]

  const [periods, setPeriods] = React.useState<any[]>([])
  const [taskStats, setTaskStats] = React.useState<{ total: number; totalWithoutDelivery: number; totalWithoutBilling: number } | null>(null)
  const [dlvStats, setDlvStats] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      billingPeriodService.findAllWithFilters({}),
      taskService.getStats(),
      deliveryService.getStats(),
    ]).then(([p, t, d]) => {
      if (cancelled) return
      if (p.status === 'fulfilled') setPeriods(p.value || [])
      if (t.status === 'fulfilled') setTaskStats(t.value)
      if (d.status === 'fulfilled') setDlvStats(d.value)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // Agregados de faturamento (status PT-BR)
  const billing = React.useMemo(() => {
    const sumBy = (statuses: string[]) =>
      periods.filter((p) => statuses.includes(p.status)).reduce((s, p) => s + (p.totalAmount || 0), 0)
    return {
      total: periods.reduce((s, p) => s + (p.totalAmount || 0), 0),
      received: sumBy(['PAGO']),
      toReceive: sumBy(TO_RECEIVE_STATUSES),
      overdueCount: periods.filter((p) => p.status === 'ATRASADO').length,
    }
  }, [periods])

  // Tendência real: faturamento por período (mês/ano)
  const trend = React.useMemo(() => {
    const byKey = new Map<string, { label: string; value: number }>()
    periods.forEach((p) => {
      const key = `${p.year}-${String(p.month).padStart(2, '0')}`
      const label = format(new Date(p.year, (p.month || 1) - 1, 1), 'MMM/yy', { locale: ptBR })
      byKey.set(key, { label, value: (byKey.get(key)?.value ?? 0) + (p.totalAmount || 0) })
    })
    return [...byKey.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v).slice(-12)
  }, [periods])

  // Pipeline de entregas
  const pipeline = React.useMemo(() => {
    if (!dlvStats) return { segments: [], total: 0 }
    const map: { key: string; field: string }[] = [
      { key: 'PENDING', field: 'totalPending' },
      { key: 'DEVELOPMENT', field: 'totalDevelopment' },
      { key: 'DELIVERED', field: 'totalDelivered' },
      { key: 'HOMOLOGATION', field: 'totalHomologation' },
      { key: 'APPROVED', field: 'totalApproved' },
      { key: 'REJECTED', field: 'totalRejected' },
      { key: 'PRODUCTION', field: 'totalProduction' },
      { key: 'CANCELLED', field: 'totalCancelled' },
    ]
    const segments = map.map((m) => ({
      key: m.key,
      label: DLV_LABEL[m.key] || m.key,
      count: dlvStats[m.field] ?? 0,
      tone: (DLV_TONE[m.key] || 'neutral') as any,
    }))
    return { segments, total: dlvStats.total ?? 0 }
  }, [dlvStats])

  // Requer atenção — itens reais (itens de faturamento só para ADMIN)
  const attentionItems = React.useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = []
    if (canViewValues && billing.overdueCount > 0) items.push({ icon: <Clock />, label: `${billing.overdueCount} fatura(s) atrasada(s)`, href: '/billing' })
    if ((taskStats?.totalWithoutDelivery ?? 0) > 0) items.push({ icon: <Inbox />, label: `${taskStats!.totalWithoutDelivery} tarefa(s) sem entrega`, href: '/tasks' })
    if (canViewValues && (taskStats?.totalWithoutBilling ?? 0) > 0) items.push({ icon: <Link2Off />, label: `${taskStats!.totalWithoutBilling} tarefa(s) sem faturamento`, href: '/billing' })
    if ((dlvStats?.totalWithoutItems ?? 0) > 0) items.push({ icon: <FileWarning />, label: `${dlvStats.totalWithoutItems} entrega(s) sem itens`, href: '/deliveries' })
    if ((dlvStats?.totalRejected ?? 0) > 0) items.push({ icon: <AlertTriangle />, label: `${dlvStats.totalRejected} entrega(s) rejeitada(s)`, href: '/deliveries' })
    return items
  }, [canViewValues, billing, taskStats, dlvStats])

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <header>
        <h1 className="text-xl font-semibold text-text-primary leading-tight">Bem-vindo de volta, {firstName}.</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewValues ? (
          <>
            <KpiCard
              label="A receber"
              value={brl(billing.toReceive)}
              tone="info"
              icon={<DollarSign />}
              hint="Pendente + Faturado + Atrasado"
              to="/billing"
              loading={loading}
            />
            <KpiCard
              label="Recebido"
              value={brl(billing.received)}
              tone="success"
              icon={<CheckCircle2 />}
              hint={`${brl(billing.total)} faturado no total`}
              to="/billing"
              loading={loading}
            />
            <KpiCard
              label="Tarefas sem entrega"
              value={(taskStats?.totalWithoutDelivery ?? 0).toLocaleString('pt-BR')}
              tone={(taskStats?.totalWithoutDelivery ?? 0) > 0 ? 'danger' : 'neutral'}
              icon={<Truck />}
              hint="Aguardando criação de entrega"
              to="/tasks"
              loading={loading}
            />
            <KpiCard
              label="Tarefas sem faturamento"
              value={(taskStats?.totalWithoutBilling ?? 0).toLocaleString('pt-BR')}
              tone={(taskStats?.totalWithoutBilling ?? 0) > 0 ? 'warning' : 'neutral'}
              icon={<DollarSign />}
              hint="Ainda não vinculadas a um período"
              to="/billing"
              loading={loading}
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Tarefas sem entrega"
              value={(taskStats?.totalWithoutDelivery ?? 0).toLocaleString('pt-BR')}
              tone={(taskStats?.totalWithoutDelivery ?? 0) > 0 ? 'danger' : 'neutral'}
              icon={<Truck />}
              hint="Aguardando criação de entrega"
              to="/tasks"
              loading={loading}
            />
            <KpiCard
              label="Entregas em produção"
              value={(dlvStats?.totalProduction ?? 0).toLocaleString('pt-BR')}
              tone="success"
              icon={<CheckCircle2 />}
              hint="Concluídas em produção"
              to="/deliveries"
              loading={loading}
            />
            <KpiCard
              label="Entregas sem itens"
              value={(dlvStats?.totalWithoutItems ?? 0).toLocaleString('pt-BR')}
              tone={(dlvStats?.totalWithoutItems ?? 0) > 0 ? 'warning' : 'neutral'}
              icon={<FileWarning />}
              hint="Aguardando itens"
              to="/deliveries"
              loading={loading}
            />
            <KpiCard
              label="Entregas rejeitadas"
              value={(dlvStats?.totalRejected ?? 0).toLocaleString('pt-BR')}
              tone={(dlvStats?.totalRejected ?? 0) > 0 ? 'danger' : 'neutral'}
              icon={<AlertTriangle />}
              hint="Requerem correção"
              to="/deliveries"
              loading={loading}
            />
          </>
        )}
      </section>

      {/* Atenção */}
      <section>
        {loading ? <Skeleton className="h-20 w-full" /> : <AttentionCard items={attentionItems} />}
      </section>

      {/* Pipeline de entregas */}
      <section>
        {loading ? <Skeleton className="h-20 w-full" /> : (
          pipeline.total > 0 && <DeliveryPipelineOverview segments={pipeline.segments} total={pipeline.total} />
        )}
      </section>

      {/* Trend (só ADMIN) + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {canViewValues && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Faturamento por período</CardTitle>
              <CardDescription>Valor total por mês de faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={trend} loading={loading} />
            </CardContent>
          </Card>
        )}

        <Card className={canViewValues ? '' : 'lg:col-span-3'}>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Últimos eventos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={dash?.recentActivities || []} loading={dashLoading} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard
