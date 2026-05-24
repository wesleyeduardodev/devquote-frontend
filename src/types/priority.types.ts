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
