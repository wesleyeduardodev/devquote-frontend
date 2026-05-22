import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Server as ServerIcon } from 'lucide-react'
import { useServers } from '@/hooks/useServers'
import { FormPage } from '@/components/ui-v2/FormPage'
import { ServerFormV2, type ServerFormData } from '@/components/forms/ServerFormV2'

const ServerCreate: React.FC = () => {
  const navigate = useNavigate()
  const { createServer } = useServers() as any
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (data: ServerFormData) => {
    try {
      setLoading(true)
      await createServer(data)
      navigate('/servers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormPage title="Novo servidor" subtitle="Cadastre um servidor (nome + link)" backTo="/servers" backLabel="Voltar para Servidores" icon={<ServerIcon />}>
      <ServerFormV2 onSubmit={handleSubmit} onCancel={() => navigate('/servers')} loading={loading} submitLabel="Criar servidor" />
    </FormPage>
  )
}

export default ServerCreate
