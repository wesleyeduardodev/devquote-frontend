/**
 * Modo de filtragem do board (espelha o enum BoardFilterMode do backend), pelos papéis
 * Desenvolvedor × Responsável. DEV_OR_ASSIGNEE é a união (tudo que me envolve); os outros
 * 3 são a partição exclusiva.
 */
export type BoardFilterMode = 'DEV_OR_ASSIGNEE' | 'DEV_NOT_ASSIGNEE' | 'DEV_AND_ASSIGNEE' | 'ASSIGNEE_NOT_DEV'

export interface PriorityTask {
  id: string
  name: string
  description?: string | null
  url: string
  ordem?: number | null
  priority?: string | null
  type?: string | null
  tags?: string[]
  existsInDevQuote?: boolean
  /** Id interno da Task no DevQuote quando já cadastrada; permite abrir o modal de visualização. */
  devQuoteTaskId?: number | null
}

export interface PriorityGroup {
  status: string
  primary: boolean
  /** Status marcado como oculto via CLICKUP_HIDDEN_STATUSES. Front decide se mostra ou não. */
  hidden?: boolean
  count: number
  tasks: PriorityTask[]
}

export interface PriorityCurrentUser {
  id?: string | null
  username?: string | null
  email?: string | null
}

export interface PriorityBoard {
  provider: string
  configured: boolean
  fetchedAt: string
  groups: PriorityGroup[]
  currentUser?: PriorityCurrentUser | null
}
