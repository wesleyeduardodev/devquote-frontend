import api from './api'
import { PriorityBoard } from '../types/priority.types'

export const priorityService = {
  getBoard: async (): Promise<PriorityBoard> => {
    const response = await api.get('/priorities/board')
    return response.data
  },

  refresh: async (): Promise<PriorityBoard> => {
    const response = await api.post('/priorities/board/refresh')
    return response.data
  },
}
