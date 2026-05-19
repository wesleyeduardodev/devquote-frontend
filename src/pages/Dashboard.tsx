import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  ListChecks, Truck, DollarSign, CheckCircle2, TrendingUp, TrendingDown,
  Activity as ActivityIcon, AlertTriangle, ArrowRight, Inbox
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-v2/Card'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Badge } from '@/components/ui-v2/Badge'

/* ============================ Helpers ============================ */
const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pct = (n: number | null | undefined) => `${(n ?? 0).toFixed(1)}%`

/* ============================ KPI Card ============================ */
interface KpiCardProps {
  label: string
  value: React.ReactNode
  delta?: number
  deltaSuffix?: string
  trend?: { x: string; y: number }[]
  loading?: boolean
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, deltaSuffix, trend, loading }) => {
  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </Card>
    )
  }
  const positive = (delta ?? 0) >= 0
  return (
    <Card className="p-5 transition-shadow hover:shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-text-primary tabular-nums">{value}</span>
      </div>
      {typeof delta === 'number' && (
        <div className={cn('mt-1 flex items-center gap-1 text-xs', positive ? 'text-success-strong' : 'text-danger-strong')}>
          {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          <span className="tabular-nums">{positive ? '+' : ''}{delta.toFixed(1)}%</span>
          {deltaSuffix && <span className="text-text-tertiary">{deltaSuffix}</span>}
        </div>
      )}
      {trend && trend.length > 1 && (
        <div className="h-10 mt-3 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="y" stroke="var(--accent)" strokeWidth={1.5} fill={`url(#spark-${label})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

/* ============================ Trend chart ============================ */
const TrendChart: React.FC<{ data: { label: string; value: number; count: number }[]; loading?: boolean }> = ({ data, loading }) => {
  if (loading) return <Skeleton className="h-64 w-full" />
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp />}
        title="Sem dados de tendência"
        description="Conforme tarefas forem registradas, a tendência aparecerá aqui."
      />
    )
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.20}/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="label" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
          <RTooltip
            contentStyle={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(v: any, k: any) => k === 'value' ? brl(Number(v)) : v}
          />
          <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#trend-fill)" name="Valor" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ============================ Activity Feed ============================ */
const ActivityFeed: React.FC<{ items: any[]; loading?: boolean }> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon />}
        title="Sem atividade recente"
        description="Histórico de eventos aparecerá aqui conforme o sistema for usado."
      />
    )
  }
  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map((a, i) => (
        <li key={`${a.entityId}-${i}`} className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-surface-2 grid place-items-center text-text-tertiary shrink-0">
            <ActivityIcon className="size-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{a.description}</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {a.user} · {a.timestamp ? format(new Date(a.timestamp), "dd MMM, HH:mm", { locale: ptBR }) : '—'}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ============================ Attention card ============================ */
interface AttentionItem {
  icon: React.ReactNode
  label: string
  href: string
  count?: number
}
const AttentionCard: React.FC<{ items: AttentionItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return (
      <Card className="p-5 border-success-border bg-success-soft/40">
        <div className="flex items-center gap-2 text-success-strong">
          <CheckCircle2 className="size-4" />
          <span className="text-sm font-medium">Tudo em dia.</span>
        </div>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-md">
            <AlertTriangle className="size-4 text-warning-strong" />
            Requer atenção
            <Badge variant="warning" size="sm">{items.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border-subtle">
          {items.map((it, i) => (
            <li key={i}>
              <Link
                to={it.href}
                className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors group"
              >
                <span className="text-warning-strong [&_svg]:size-4">{it.icon}</span>
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
const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboard()
  const { user, isAdmin, isManager } = useAuth() as any

  const firstName = (user?.name || user?.username || 'Usuário').split(' ')[0]

  // Sparklines (a partir de tasksChart)
  const tasksSpark = React.useMemo(() => {
    const c = stats?.tasksChart || []
    return c.slice(-7).map((d) => ({ x: d.label, y: d.count }))
  }, [stats])
  const revenueSpark = React.useMemo(() => {
    const c = stats?.tasksChart || []
    return c.slice(-12).map((d) => ({ x: d.label, y: d.value }))
  }, [stats])

  // Attention items — heurísticos a partir dos dados existentes
  const attentionItems = React.useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = []
    const dByStatus = stats?.deliveriesByStatus || []
    const pending = dByStatus.find((s) => s.status === 'PENDING')?.count ?? 0
    const homolog = dByStatus.find((s) => s.status === 'HOMOLOGATION')?.count ?? 0
    const reject  = dByStatus.find((s) => s.status === 'REJECTED')?.count ?? 0
    if (pending > 0) items.push({ icon: <Inbox />,       label: `${pending} entrega(s) pendente(s)`,       href: '/deliveries' })
    if (homolog > 0) items.push({ icon: <AlertTriangle/>, label: `${homolog} em homologação`,                href: '/deliveries' })
    if (reject > 0)  items.push({ icon: <AlertTriangle/>, label: `${reject} rejeitada(s)`,                   href: '/deliveries' })
    return items
  }, [stats])

  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle />}
        title="Erro ao carregar"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <header>
        <h1 className="text-xl font-semibold text-text-primary leading-tight">
          Bem-vindo de volta, {firstName}.
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Tarefas concluídas"
          value={(stats?.general.completedTasks ?? 0).toLocaleString('pt-BR')}
          delta={stats?.tasks?.growthPercentage}
          deltaSuffix="vs. mês anterior"
          trend={tasksSpark}
          loading={loading}
        />
        <KpiCard
          label="Entregas"
          value={(stats?.deliveries?.total ?? 0).toLocaleString('pt-BR')}
          delta={stats?.deliveries?.growthPercentage}
          deltaSuffix="vs. mês anterior"
          loading={loading}
        />
        <KpiCard
          label="Receita do mês"
          value={brl(stats?.billing?.thisMonth)}
          delta={stats?.billing?.growthPercentage}
          deltaSuffix="vs. mês anterior"
          trend={revenueSpark}
          loading={loading}
        />
        <KpiCard
          label="Taxa de conclusão"
          value={pct(stats?.general.completionRate)}
          loading={loading}
        />
      </section>

      {/* Atenção */}
      <section>
        {!loading && <AttentionCard items={attentionItems} />}
        {loading && <Skeleton className="h-24 w-full" />}
      </section>

      {/* Trend + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência</CardTitle>
            <CardDescription>Valor faturado por período</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={stats?.tasksChart || []} loading={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Últimos eventos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={stats?.recentActivities || []} loading={loading} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard
