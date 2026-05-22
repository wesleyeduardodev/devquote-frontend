import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Server as ServerIcon } from 'lucide-react'
import toast from 'react-hot-toast'

import { serverService } from '@/services/serverService'
import { FormPage } from '@/components/ui-v2/FormPage'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Button } from '@/components/ui-v2/Button'
import { ServerFormV2, type ServerFormData } from '@/components/forms/ServerFormV2'

const ServerEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [data, setData] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    const fetch = async () => {
      if (!id) return
      try {
        setLoading(true)
        const r = await serverService.getById(Number(id))
        if (alive) setData(r)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Erro ao carregar')
      } finally {
        if (alive) setLoading(false)
      }
    }
    fetch()
    return () => { alive = false }
  }, [id])

  const handleSubmit = async (form: ServerFormData) => {
    if (!id) return
    try {
      setSaving(true)
      await serverService.update(Number(id), form)
      toast.success('Servidor atualizado')
      navigate('/servers')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <EmptyState title="Erro ao carregar" description={error}
        actions={<Button variant="secondary" onClick={() => navigate('/servers')}>Voltar</Button>}
      />
    )
  }

  return (
    <FormPage
      title={loading ? <Skeleton className="h-5 w-48" /> : `Editar servidor #${id}`}
      subtitle={loading ? undefined : data?.name}
      backTo="/servers"
      backLabel="Voltar para Servidores"
      icon={<ServerIcon />}
    >
      {loading ? (
        <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : (
        <ServerFormV2 initialData={data} onSubmit={handleSubmit} onCancel={() => navigate('/servers')} loading={saving} submitLabel="Salvar alterações" />
      )}
    </FormPage>
  )
}

export default ServerEdit
