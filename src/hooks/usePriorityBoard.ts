import * as React from 'react'
import toast from 'react-hot-toast'
import { priorityService } from '@/services/priorityService'
import { PriorityBoard } from '@/types/priority.types'

export function usePriorityBoard() {
  const [board, setBoard] = React.useState<PriorityBoard | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchBoard = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await priorityService.getBoard()
      setBoard(data)
    } catch {
      toast.error('Erro ao carregar prioridades')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await priorityService.refresh()
      setBoard(data)
      toast.success('Prioridades atualizadas')
    } catch {
      toast.error('Erro ao atualizar prioridades')
    } finally {
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  return { board, loading, refreshing, refresh }
}
