import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { FormPage } from '@/components/ui-v2/FormPage'
import { ProjectFormV2, type ProjectFormData } from '@/components/forms/ProjectFormV2'

const ProjectCreate: React.FC = () => {
  const navigate = useNavigate()
  const { createProject } = useProjects() as any
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      setLoading(true)
      await createProject(data)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormPage title="Novo projeto" subtitle="Adicione um repositório ao sistema" backTo="/projects" backLabel="Voltar para Projetos" icon={<FolderKanban />}>
      <ProjectFormV2 onSubmit={handleSubmit} onCancel={() => navigate('/projects')} loading={loading} submitLabel="Criar projeto" />
    </FormPage>
  )
}

export default ProjectCreate
