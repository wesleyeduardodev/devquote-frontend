import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/** Atalhos globais estilo Linear: G+<letter> para navegar, ⌘N contextual para criar. */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()
  const lastKeyRef = React.useRef<{ key: string; at: number } | null>(null)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
      }

      // ⌘N / Ctrl+N — criar no contexto da rota atual
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        const map: Record<string, string> = {
          '/tasks':       '/tasks/create',
          '/deliveries':  '/deliveries/create',
          '/requesters':  '/requesters/create',
          '/projects':    '/projects/create',
        }
        // se está em alguma listagem mapeada
        const match = Object.keys(map).find((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
        if (match) {
          e.preventDefault()
          navigate(map[match])
        }
        return
      }

      // Atalhos sem modificador: precisamos detectar sequências como G T
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()

      // Sequência G + X
      if (lastKeyRef.current && lastKeyRef.current.key === 'g' && Date.now() - lastKeyRef.current.at < 1000) {
        const map: Record<string, string> = {
          d: '/dashboard',
          t: '/tasks',
          e: '/deliveries',
          f: '/billing',
          r: '/requesters',
          p: '/projects',
        }
        if (map[k]) {
          e.preventDefault()
          navigate(map[k])
        }
        lastKeyRef.current = null
        return
      }

      if (k === 'g') {
        lastKeyRef.current = { key: 'g', at: Date.now() }
        return
      }

      lastKeyRef.current = null
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, location.pathname])
}
