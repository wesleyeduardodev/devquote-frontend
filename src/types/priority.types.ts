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
  count: number
  tasks: PriorityTask[]
}

export interface PriorityBoard {
  provider: string
  configured: boolean
  fetchedAt: string
  groups: PriorityGroup[]
}
