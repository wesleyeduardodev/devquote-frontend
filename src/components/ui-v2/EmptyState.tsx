import * as React from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actions, className }) => (
  <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
    {icon && (
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-tertiary [&_svg]:size-6">
        {icon}
      </div>
    )}
    <h3 className="text-md font-semibold text-text-primary">{title}</h3>
    {description && <p className="mt-1 text-sm text-text-secondary max-w-md">{description}</p>}
    {actions && <div className="mt-4 flex items-center gap-2">{actions}</div>}
  </div>
)
