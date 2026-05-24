import * as React from 'react'
import toast from 'react-hot-toast'
import { priorityService } from '@/services/priorityService'
import { PriorityBoard } from '@/types/priority.types'

const INCLUDE_ASSIGNEE_KEY = 'devquote.priorities.includeAssignee'

function readPref(): boolean {
  if (typeof window === 'undefined') return true
  const raw = window.localStorage.getItem(INCLUDE_ASSIGNEE_KEY)
  if (raw === null) return true // default ON — Desenvolvedor OR Responsável
  return raw === '1'
}

export function usePriorityBoard() {
  const [board, setBoard] = React.useState<PriorityBoard | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [includeAssignee, setIncludeAssigneeState] = React.useState<boolean>(readPref)

  const setIncludeAssignee = React.useCallback((v: boolean) => {
    setIncludeAssigneeState(v)
    try { window.localStorage.setItem(INCLUDE_ASSIGNEE_KEY, v ? '1' : '0') } catch {}
  }, [])

  const fetchBoard = React.useCallback(async (includeAssigneeParam?: boolean) => {
    setLoading(true)
    try {
      const data = await priorityService.getBoard(includeAssigneeParam ?? includeAssignee)
      setBoard(data)
    } catch {
      toast.error('Erro ao carregar prioridades')
    } finally {
      setLoading(false)
    }
  }, [includeAssignee])

  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await priorityService.refresh(includeAssignee)
      setBoard(data)
      toast.success('Prioridades atualizadas')
    } catch {
      toast.error('Erro ao atualizar prioridades')
    } finally {
      setRefreshing(false)
    }
  }, [includeAssignee])

  const markTaskCreated = React.useCallback((taskId: string) => {
    setBoard((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        groups: prev.groups.map((g) => ({
          ...g,
          tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, existsInDevQuote: true } : t)),
        })),
      }
    })
  }, [])

  React.useEffect(() => {
    fetchBoard(includeAssignee)
  }, [includeAssignee])

  return { board, loading, refreshing, refresh, markTaskCreated, includeAssignee, setIncludeAssignee }
}
