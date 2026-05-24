import api from './api'

export interface ClickUpSetupUser {
  id: string
  username: string
  email: string
}

export interface ClickUpSetupItem {
  id: string
  name: string
  parent?: string | null
}

export interface ClickUpFieldOption {
  id: string
  name: string
}

export interface ClickUpField {
  id: string
  name: string
  type: string
  options?: ClickUpFieldOption[] | null
}

export interface ClickUpFieldsResponse {
  all: ClickUpField[]
  suggestedDeveloperFieldId?: string | null
  suggestedDeveloperOptionId?: string | null
  suggestedOrderFieldId?: string | null
}

export interface ClickUpSaveRequest {
  token: string
  listId: string
  developerFieldId: string
  developerOptionId: string
  orderFieldId?: string | null
}

const HEADER = 'X-ClickUp-Token'

export const clickupSetupService = {
  validateToken: async (token: string): Promise<ClickUpSetupUser> => {
    const res = await api.post('/integrations/clickup/setup/validate-token', { token })
    return res.data
  },

  listWorkspaces: async (token: string): Promise<ClickUpSetupItem[]> => {
    const res = await api.get('/integrations/clickup/setup/workspaces', { headers: { [HEADER]: token } })
    return res.data
  },

  listSpaces: async (token: string, teamId: string): Promise<ClickUpSetupItem[]> => {
    const res = await api.get(`/integrations/clickup/setup/workspaces/${teamId}/spaces`, { headers: { [HEADER]: token } })
    return res.data
  },

  listLists: async (token: string, spaceId: string): Promise<ClickUpSetupItem[]> => {
    const res = await api.get(`/integrations/clickup/setup/spaces/${spaceId}/lists`, { headers: { [HEADER]: token } })
    return res.data
  },

  listSharedLists: async (token: string, teamId: string): Promise<ClickUpSetupItem[]> => {
    const res = await api.get(`/integrations/clickup/setup/workspaces/${teamId}/shared-lists`, { headers: { [HEADER]: token } })
    return res.data
  },

  listFields: async (token: string, listId: string): Promise<ClickUpFieldsResponse> => {
    const res = await api.get(`/integrations/clickup/setup/lists/${listId}/fields`, { headers: { [HEADER]: token } })
    return res.data
  },

  save: async (payload: ClickUpSaveRequest): Promise<void> => {
    await api.post('/integrations/clickup/setup/save', payload)
  },

  reset: async (): Promise<void> => {
    await api.delete('/integrations/clickup/setup/reset')
  },
}
