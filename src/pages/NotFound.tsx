import * as React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, MapPinned } from 'lucide-react'
import { Button } from '@/components/ui-v2/Button'

const NotFound: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="max-w-md w-full text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-text-tertiary mb-6">
        <MapPinned className="size-7" />
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">Erro 404</p>
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Página não encontrada</h1>
      <p className="text-sm text-text-secondary mb-6">
        A página que você está procurando não existe ou foi movida.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button variant="secondary" leadingIcon={<ArrowLeft />} onClick={() => window.history.back()}>Voltar</Button>
        <Link to="/"><Button leadingIcon={<Home />}>Ir para o Dashboard</Button></Link>
      </div>
    </div>
  </div>
)

export default NotFound
