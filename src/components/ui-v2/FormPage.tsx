import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'

interface FormPageProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  backTo?: string
  backLabel?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export const FormPage: React.FC<FormPageProps> = ({ title, subtitle, backTo, backLabel = 'Voltar', icon, children }) => {
  const navigate = useNavigate()
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <Button variant="ghost" size="sm" leadingIcon={<ArrowLeft />} onClick={() => backTo ? navigate(backTo) : navigate(-1)}>
          {backLabel}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-border-subtle flex items-start gap-3">
          {icon && (
            <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent grid place-items-center shrink-0 [&_svg]:size-5">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-text-primary leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </Card>
    </div>
  )
}
