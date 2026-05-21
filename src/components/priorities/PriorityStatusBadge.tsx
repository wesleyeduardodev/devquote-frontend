import * as React from 'react'
import { cn } from '@/utils/cn'

/** Cores espelhando o pipeline do ClickUp (chave = status em minúsculas). */
const STATUS_META: Record<string, { label: string; color: string }> = {
  'a iniciar - dev interno': { label: 'A iniciar - dev interno', color: '#e16b16' },
  'em progresso': { label: 'Em progresso', color: '#e5484d' },
  'desenvolvimento concluído': { label: 'Desenvolvimento concluído', color: '#1bbca4' },
  'pronto para testes': { label: 'Pronto para testes', color: '#f5b400' },
  'testes concluídos': { label: 'Testes concluídos', color: '#3b6fe1' },
  'validação em produção': { label: 'Validação em produção', color: '#16a34a' },
  complete: { label: 'Concluído', color: '#16a34a' },
  'concluído': { label: 'Concluído', color: '#16a34a' },
}

function meta(status: string) {
  return STATUS_META[(status || '').toLowerCase().trim()] || { label: status || '—', color: '#6b7280' }
}

export const PriorityStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const m = meta(status)
  return (
    <span
      className={cn('inline-flex items-center gap-2 h-7 px-2.5 rounded-md text-xs font-semibold uppercase tracking-wide', className)}
      style={{ color: m.color, backgroundColor: `${m.color}1f` }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  )
}

export function statusColor(status: string) {
  return meta(status).color
}
