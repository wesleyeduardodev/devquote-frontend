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
      {/* Linha 1: título · ferramentas globais (no mobile as ferramentas ficam na barra do Layout) */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0 flex flex-col gap-0.5 lg:flex-row lg:items-baseline lg:gap-2">
          <h1 className="text-lg lg:text-xl font-semibold text-text-primary leading-tight break-words">{title}</h1>
          {subtitle && (
            <>
              <span className="hidden lg:inline text-text-tertiary" aria-hidden>·</span>
              <span className="text-sm text-text-secondary lg:truncate">{subtitle}</span>
            </>
          )}
        </div>

        {!hideGlobalTools && (
          <div className="hidden lg:block shrink-0">
            <GlobalTools />
          </div>
        )}
      </div>

      {/* Linha 2: filtros · ações (empilha e quebra linha no mobile para nada sair da tela) */}
      {(filters || actions) && (
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          {filters && (
            <div className="flex flex-wrap items-center gap-2 min-w-0 lg:flex-1">
              {filters}
            </div>
          )}
          {actions && (
            <div className="flex flex-wrap items-center gap-2 min-w-0 lg:shrink-0 lg:ml-auto lg:flex-nowrap">
              {actions}
            </div>
          )}
        </div>
      )}
    </header>
  </TooltipProvider>
)
