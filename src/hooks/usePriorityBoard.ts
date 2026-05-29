import * as React from 'react'
import toast from 'react-hot-toast'
import { priorityService } from '@/services/priorityService'
import { PriorityBoard, BoardFilterMode } from '@/types/priority.types'

const FILTER_MODE_KEY = 'devquote.priorities.filterMode.v2'

function readMode(): BoardFilterMode {
  if (typeof window === 'undefined') return 'DEV_OR_ASSIGNEE'
  const raw = window.localStorage.getItem(FILTER_MODE_KEY)
  if (raw === 'DEV_OR_ASSIGNEE' || raw === 'DEV_NOT_ASSIGNEE' || raw === 'DEV_AND_ASSIGNEE' || raw === 'ASSIGNEE_NOT_DEV') return raw
  return 'DEV_OR_ASSIGNEE' // default: tudo que me envolve (dev OU responsável)
}

export function usePriorityBoard() {
  const [board, setBoard] = React.useState<PriorityBoard | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [mode, setModeState] = React.useState<BoardFilterMode>(readMode)

  const setMode = React.useCallback((m: BoardFilterMode) => {
    setModeState(m)
    try { window.localStorage.setItem(FILTER_MODE_KEY, m) } catch {}
  }, [])

  const fetchBoard = React.useCallback(async (modeParam?: BoardFilterMode) => {
    setLoading(true)
    try {
      const data = await priorityService.getBoard(modeParam ?? mode)
      setBoard(data)
    } catch {
      toast.error('Erro ao carregar tarefas ClickUp')
    } finally {
      setLoading(false)
    }
  }, [mode])

  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await priorityService.refresh(mode)
      setBoard(data)
      toast.success('Tarefas ClickUp atualizadas')
    } catch {
      toast.error('Erro ao atualizar tarefas ClickUp')
    } finally {
      setRefreshing(false)
    }
  }, [mode])

  const markTaskCreated = React.useCallback((taskId: string, devQuoteTaskId?: number) => {
    setBoard((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        groups: prev.groups.map((g) => ({
          ...g,
          tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, existsInDevQuote: true, devQuoteTaskId: devQuoteTaskId ?? t.devQuoteTaskId } : t)),
        })),
      }
    })
  }, [])

  React.useEffect(() => {
    fetchBoard(mode)
  }, [mode])

  return { board, loading, refreshing, refresh, markTaskCreated, mode, setMode }
}
