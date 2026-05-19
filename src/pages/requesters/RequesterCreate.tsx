import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { useRequesters } from '@/hooks/useRequesters'
import { FormPage } from '@/components/ui-v2/FormPage'
import { RequesterFormV2, type RequesterFormData } from '@/components/forms/RequesterFormV2'

const RequesterCreate: React.FC = () => {
  const navigate = useNavigate()
  const { createRequester } = useRequesters()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (data: RequesterFormData) => {
    try {
      setLoading(true)
      await createRequester(data as any)
      navigate('/requesters')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormPage title="Novo solicitante" subtitle="Adicione um novo solicitante ao sistema" backTo="/requesters" backLabel="Voltar para Solicitantes" icon={<User />}>
      <RequesterFormV2 onSubmit={handleSubmit} onCancel={() => navigate('/requesters')} loading={loading} submitLabel="Criar solicitante" />
    </FormPage>
  )
}

export default RequesterCreate
