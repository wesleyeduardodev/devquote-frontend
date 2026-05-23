import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar, { SIDEBAR_STORAGE_KEY } from './Sidebar'
import { cn } from '@/utils/cn'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  })
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // Atalho [: toggle sidebar (apenas quando não está em input/textarea/contenteditable)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[') return
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fecha o mobile drawer ao navegar
  React.useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <div className="h-dvh bg-surface-app text-text-primary flex overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex h-full">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-surface-inverse/40 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-down">
            <Sidebar
              collapsed={false}
              onToggleCollapsed={() => setMobileOpen(false)}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile-only floating menu button (≤lg) — desktop usa Sidebar fixa */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="lg:hidden fixed top-3 left-3 z-30 p-2 rounded-md bg-surface-1 border border-border-subtle shadow-sm text-text-secondary hover:bg-surface-2 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>

        <main className={cn('flex-1 overflow-auto')}>
          <div className="w-full px-3 sm:px-4 lg:px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
