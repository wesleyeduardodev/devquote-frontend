import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import { useModules } from '@/hooks/useModules'
import { FormPage } from '@/components/ui-v2/FormPage'
import { ModuleFormV2, type ModuleFormData } from '@/components/forms/ModuleFormV2'

const ModuleCreate: React.FC = () => {
  const navigate = useNavigate()
  const { createModule } = useModules() as any
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (data: ModuleFormData) => {
    try {
      setLoading(true)
      await createModule(data)
      navigate('/modules')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormPage title="Novo módulo" subtitle="Cadastre um módulo do sistema" backTo="/modules" backLabel="Voltar para Módulos" icon={<Boxes />}>
      <ModuleFormV2 onSubmit={handleSubmit} onCancel={() => navigate('/modules')} loading={loading} submitLabel="Criar módulo" />
    </FormPage>
  )
}

export default ModuleCreate
