import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import toast from 'react-hot-toast'

import { requesterService } from '@/services/requesterService'
import { FormPage } from '@/components/ui-v2/FormPage'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Button } from '@/components/ui-v2/Button'
import { RequesterFormV2, type RequesterFormData } from '@/components/forms/RequesterFormV2'

const RequesterEdit: React.FC = () => {
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
        const r = await (requesterService as any).getById(id)
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

  const handleSubmit = async (form: RequesterFormData) => {
    if (!id) return
    try {
      setSaving(true)
      await (requesterService as any).update(id, form)
      toast.success('Solicitante atualizado')
      navigate('/requesters')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar"
        description={error}
        actions={<Button variant="secondary" onClick={() => navigate('/requesters')}>Voltar</Button>}
      />
    )
  }

  return (
    <FormPage
      title={loading ? <Skeleton className="h-5 w-48" /> : `Editar solicitante #${id}`}
      subtitle={loading ? undefined : data?.name}
      backTo="/requesters"
      backLabel="Voltar para Solicitantes"
      icon={<User />}
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <RequesterFormV2
          initialData={data}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/requesters')}
          loading={saving}
          submitLabel="Salvar alterações"
        />
      )}
    </FormPage>
  )
}

export default RequesterEdit
