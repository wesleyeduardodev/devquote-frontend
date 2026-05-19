import * as React from 'react'
import { cn } from '@/utils/cn'
import { GlobalTools } from '@/components/layout/GlobalTools'
import { TooltipProvider } from './Tooltip'

export interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Filtros (busca, selects, stat chips). Linha 2 esquerda. */
  filters?: React.ReactNode
  /** Ações primárias da tela. Linha 2 direita. */
  actions?: React.ReactNode
  /** Esconde as ferramentas globais (apenas se a tela tiver layout próprio). */
  hideGlobalTools?: boolean
  className?: string
}

/**
 * Header da página em 2 linhas:
 *   Linha 1: [título + subtítulo]   ········   [GlobalTools (⌘K · sino · avatar)]
 *   Linha 2: [filters]              ········   [actions]
 *
 * Em <lg as linhas continuam, mas cada uma empilha em colunas.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title, subtitle, filters, actions, hideGlobalTools, className,
}) => (
  <TooltipProvider delayDuration={200}>
    <header className={cn('mb-4', className)}>
      {/* Linha 1: título · ferramentas globais */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0 flex items-baseline gap-2">
          <h1 className="text-xl font-semibold text-text-primary leading-tight">{title}</h1>
          {subtitle && (
            <>
              <span className="text-text-tertiary" aria-hidden>·</span>
              <span className="text-sm text-text-secondary truncate">{subtitle}</span>
            </>
          )}
        </div>

        {!hideGlobalTools && (
          <div className="shrink-0">
            <GlobalTools />
          </div>
        )}
      </div>

      {/* Linha 2: filtros · ações */}
      {(filters || actions) && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          {filters && (
            <div className="flex flex-wrap items-center gap-2 lg:flex-1 lg:min-w-0">
              {filters}
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2 shrink-0 lg:ml-auto">
              {actions}
            </div>
          )}
        </div>
      )}
    </header>
  </TooltipProvider>
)
