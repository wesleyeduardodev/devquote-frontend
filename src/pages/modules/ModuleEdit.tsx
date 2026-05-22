import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import toast from 'react-hot-toast'

import { moduleService } from '@/services/moduleService'
import { FormPage } from '@/components/ui-v2/FormPage'
import { Skeleton } from '@/components/ui-v2/Skeleton'
import { EmptyState } from '@/components/ui-v2/EmptyState'
import { Button } from '@/components/ui-v2/Button'
import { ModuleFormV2, type ModuleFormData } from '@/components/forms/ModuleFormV2'

const ModuleEdit: React.FC = () => {
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
        const r = await moduleService.getById(Number(id))
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

  const handleSubmit = async (form: ModuleFormData) => {
    if (!id) return
    try {
      setSaving(true)
      await moduleService.update(Number(id), form)
      toast.success('Módulo atualizado')
      navigate('/modules')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <EmptyState title="Erro ao carregar" description={error}
        actions={<Button variant="secondary" onClick={() => navigate('/modules')}>Voltar</Button>}
      />
    )
  }

  return (
    <FormPage
      title={loading ? <Skeleton className="h-5 w-48" /> : `Editar módulo #${id}`}
      subtitle={loading ? undefined : data?.name}
      backTo="/modules"
      backLabel="Voltar para Módulos"
      icon={<Boxes />}
    >
      {loading ? (
        <div className="space-y-4"><Skeleton className="h-10 w-full" /></div>
      ) : (
        <ModuleFormV2 initialData={data} onSubmit={handleSubmit} onCancel={() => navigate('/modules')} loading={saving} submitLabel="Salvar alterações" />
      )}
    </FormPage>
  )
}

export default ModuleEdit
