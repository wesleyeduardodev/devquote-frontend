import api from './api'
import { PriorityBoard, BoardFilterMode } from '../types/priority.types'

export const priorityService = {
  getBoard: async (mode: BoardFilterMode = 'DEV_AND_ASSIGNEE'): Promise<PriorityBoard> => {
    const response = await api.get('/priorities/board', { params: { mode } })
    return response.data
  },

  refresh: async (mode: BoardFilterMode = 'DEV_AND_ASSIGNEE'): Promise<PriorityBoard> => {
    const response = await api.post('/priorities/board/refresh', null, { params: { mode } })
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
