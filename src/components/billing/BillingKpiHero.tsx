import * as React from 'react'
import { TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { Card } from '@/components/ui-v2/Card'
import { cn } from '@/utils/cn'

const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface KpiCardSimpleProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  className?: string
}

const TONE_DOT: Record<string, string> = {
  neutral: 'bg-text-tertiary',
  success: 'bg-success-strong',
  warning: 'bg-warning-strong',
  danger:  'bg-danger-strong',
  info:    'bg-info-strong',
  accent:  'bg-accent',
}

export const BillingKpiCard: React.FC<KpiCardSimpleProps> = ({ label, value, hint, tone = 'neutral', className }) => (
  <Card className={cn('p-4', className)}>
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
      <span className={cn('inline-block h-2 w-2 rounded-full', TONE_DOT[tone])} />
      {label}
    </div>
    <p className="mt-1.5 text-xl font-semibold text-text-primary tabular-nums">{value}</p>
    {hint && <p className="text-xs text-text-tertiary mt-0.5">{hint}</p>}
  </Card>
)

interface BillingKpiHeroProps {
  total: number
  delta?: number
  trendData?: { x: string; y: number }[]
}

export const BillingKpiHero: React.FC<BillingKpiHeroProps> = ({ total, delta, trendData }) => (
  <Card className="p-6">
    <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Receita total</p>
    <div className="mt-2 flex items-baseline gap-3">
      <span className="text-3xl font-semibold text-text-primary tabular-nums">{brl(total)}</span>
      {typeof delta === 'number' && (
        <span className={cn('inline-flex items-center gap-1 text-xs', delta >= 0 ? 'text-success-strong' : 'text-danger-strong')}>
          <TrendingUp className={cn('size-3', delta < 0 && 'rotate-180')} />
          <span className="tabular-nums">{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span>
          <span className="text-text-tertiary">vs. período anterior</span>
        </span>
      )}
    </div>
    {trendData && trendData.length > 1 && (
      <div className="h-16 mt-4 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="billing-hero-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.30}/>
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="y" stroke="var(--accent)" strokeWidth={2} fill="url(#billing-hero-spark)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </Card>
)
