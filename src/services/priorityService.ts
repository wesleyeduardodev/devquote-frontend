import api from './api'
import { PriorityBoard } from '../types/priority.types'

export const priorityService = {
  getBoard: async (includeAssignee: boolean = true): Promise<PriorityBoard> => {
    const response = await api.get('/priorities/board', { params: { includeAssignee } })
    return response.data
  },

  refresh: async (includeAssignee: boolean = true): Promise<PriorityBoard> => {
    const response = await api.post('/priorities/board/refresh', null, { params: { includeAssignee } })
    return response.data
  },

  updatePreferences: async (prefs: {
    orderedStatuses?: string[]
    primaryStatus?: string
    hiddenStatuses?: string[]
  }): Promise<void> => {
    await api.put('/priorities/board/preferences', prefs)
  },
}
