import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Zap } from 'lucide-react'
import Sidebar, { SIDEBAR_STORAGE_KEY } from './Sidebar'
import { GlobalTools } from './GlobalTools'
import { TooltipProvider } from '@/components/ui-v2/Tooltip'
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
        {/* Barra superior mobile (<lg): menu · marca · ferramentas globais. No desktop as
            ferramentas ficam na linha do título (PageHeader) e a navegação na Sidebar fixa. */}
        <TooltipProvider delayDuration={200}>
          <header className="lg:hidden shrink-0 z-30 bg-surface-1/95 backdrop-blur border-b border-border-subtle pt-[env(safe-area-inset-top)]">
            <div className="h-14 px-2 flex items-center gap-1">
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="p-2 rounded-md text-text-secondary hover:bg-surface-2 transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </button>
              <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
                <span className="h-7 w-7 rounded-md bg-accent text-accent-fg grid place-items-center shadow-sm shrink-0">
                  <Zap className="size-4" strokeWidth={2.25} />
                </span>
                <span className="text-md font-semibold text-text-primary tracking-tight truncate">DevQuote</span>
              </Link>
              <div className="ml-auto shrink-0">
                <GlobalTools />
              </div>
            </div>
          </header>
        </TooltipProvider>

        <main className={cn('flex-1 overflow-y-auto overflow-x-hidden')}>
          <div className="w-full min-w-0 px-3 sm:px-4 lg:px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
