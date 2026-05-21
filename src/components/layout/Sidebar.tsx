import * as React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ListChecks, Truck, DollarSign,
  Users, FolderKanban, Shield, Bell, Settings,
  ChevronsLeft, ChevronsRight, Sun, Moon, Monitor,
  Zap, Check, ChevronDown, LogOut, ListOrdered
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { TooltipProvider, TooltipQuick } from '@/components/ui-v2/Tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui-v2/DropdownMenu'

type Profile = 'ADMIN' | 'MANAGER' | 'USER'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  profiles?: Profile[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Geral',
    items: [
      { to: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard, shortcut: 'G D' },
      { to: '/tasks',       label: 'Tarefas',      icon: ListChecks,      shortcut: 'G T' },
      { to: '/deliveries',  label: 'Entregas',     icon: Truck,           shortcut: 'G E' },
      { to: '/priorities',  label: 'Prioridades',  icon: ListOrdered },
      { to: '/billing',     label: 'Faturamento',  icon: DollarSign,      shortcut: 'G F', profiles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { to: '/requesters', label: 'Solicitantes', icon: Users,         profiles: ['ADMIN'] },
      { to: '/projects',   label: 'Projetos',     icon: FolderKanban,  profiles: ['ADMIN'] },
    ],
  },
  {
    title: 'Administração',
    items: [
      { to: '/profiles',      label: 'Perfis',       icon: Shield,   profiles: ['ADMIN'] },
      { to: '/notifications', label: 'Notificações', icon: Bell,     profiles: ['ADMIN'] },
      { to: '/parameters',    label: 'Parâmetros',   icon: Settings, profiles: ['ADMIN'] },
    ],
  },
]

export const SIDEBAR_STORAGE_KEY = 'devquote.sidebar.collapsed'

export interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  onCloseMobile?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapsed, onCloseMobile }) => {
  const { hasAnyProfile, logout } = useAuth() as any
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const isAllowed = (item: NavItem) => {
    if (!item.profiles || item.profiles.length === 0) return true
    return hasAnyProfile ? hasAnyProfile(item.profiles) : true
  }

  const handleLogout = async () => {
    try { await logout?.() } finally { navigate('/login') }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'flex flex-col h-full',
          'bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]',
          'border-r border-[var(--sidebar-border)]',
          'transition-[width] duration-base ease-smooth',
          collapsed ? 'w-[64px]' : 'w-[260px]'
        )}
      >
        <div className={cn('h-14 flex items-center px-3 border-b border-[var(--sidebar-border)] gap-2 shrink-0', collapsed && 'justify-center px-0')}>
          <BrandMark collapsed={collapsed} />
          {!collapsed && <WorkspaceSwitcher />}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {SECTIONS.map((sec, secIdx) => {
            const visibleItems = sec.items.filter(isAllowed)
            if (visibleItems.length === 0) return null
            return (
              <div key={sec.title} className={cn(collapsed ? 'mb-2' : 'mb-4')}>
                {!collapsed ? (
                  <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--sidebar-text-dim)]">
                    {sec.title}
                  </div>
                ) : (
                  secIdx > 0 && <div className="mx-auto mb-2 h-px w-6 bg-[var(--sidebar-border)]" aria-hidden />
                )}
                <ul className={cn(collapsed ? 'space-y-1.5' : 'space-y-0.5')}>
                  {visibleItems.map((item) => (
                    <li key={item.to} className={cn(collapsed && 'flex justify-center')}>
                      <NavItemEl item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className={cn('shrink-0 border-t border-[var(--sidebar-border)] p-2 flex flex-col gap-1', collapsed && 'items-center')}>
          <ThemeToggle collapsed={collapsed} theme={theme} setTheme={setTheme} />
          <FooterIconButton
            collapsed={collapsed}
            onClick={handleLogout}
            icon={<LogOut />}
            label="Sair da conta"
            danger
          />
          <FooterIconButton
            collapsed={collapsed}
            onClick={onToggleCollapsed}
            icon={collapsed ? <ChevronsRight /> : <ChevronsLeft />}
            label={collapsed ? 'Expandir' : 'Recolher'}
            shortcut="["
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}

export default Sidebar

const BrandMark: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <div className="flex items-center gap-2">
    <div className="h-8 w-8 rounded-md bg-accent text-accent-fg grid place-items-center shadow-sm">
      <Zap className="size-4" strokeWidth={2.25} />
    </div>
    {!collapsed && (
      <span className="text-md font-semibold text-[var(--sidebar-text)] tracking-tight">DevQuote</span>
    )}
  </div>
)

const NavItemEl: React.FC<{ item: NavItem; collapsed: boolean; onNavigate?: () => void }> = ({ item, collapsed, onNavigate }) => {
  const Icon = item.icon
  const inner = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors',
          collapsed ? 'justify-center size-9' : 'h-8 px-2',
          isActive
            ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]'
            : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--sidebar-active-bar)]" aria-hidden />
          )}
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span className="truncate flex-1">{item.label}</span>}
          {!collapsed && item.shortcut && (
            <kbd className="font-mono text-[10px] leading-none px-1.5 py-1 rounded border border-[var(--sidebar-border)] text-[var(--sidebar-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity">{item.shortcut}</kbd>
          )}
        </>
      )}
    </NavLink>
  )
  if (collapsed) {
    return (
      <TooltipQuick label={`${item.label}${item.shortcut ? ` · ${item.shortcut}` : ''}`} side="right">
        {inner}
      </TooltipQuick>
    )
  }
  return inner
}

const WorkspaceSwitcher: React.FC = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const tenants = [
    { id: 'wesley', label: "Wesley's workspace", host: 'wesley.devquote.com.br' },
    { id: 'joao',   label: "João's workspace",   host: 'joao.devquote.com.br' },
    { id: 'local',  label: 'Local',              host: 'localhost' },
  ]
  const current = tenants.find((t) => host.endsWith(t.host)) || tenants.find((t) => t.id === 'local') || tenants[0]

  const goTo = (host: string) => {
    if (host === 'localhost') return
    const url = `${window.location.protocol}//${host}${window.location.pathname}`
    window.location.assign(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex-1 min-w-0 flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-[var(--sidebar-hover)] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
        <span className="text-sm font-medium text-[var(--sidebar-text)] truncate flex-1">{current.label}</span>
        <ChevronDown className="size-3.5 text-[var(--sidebar-text-dim)] shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => goTo(t.host)}>
            <span className="flex-1">{t.label}</span>
            {t.id === current.id && <Check className="size-4 text-accent" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ThemeToggle: React.FC<{ collapsed: boolean; theme: string; setTheme: (t: any) => void }> = ({ collapsed, theme, setTheme }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      className={cn(
        'flex items-center gap-2 rounded-md text-sm text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] transition-colors',
        collapsed ? 'size-9 justify-center' : 'w-full px-2 h-8'
      )}
    >
      {theme === 'dark' ? <Moon className="size-4" /> : theme === 'dim' ? <Moon className="size-4 opacity-70" /> : theme === 'system' ? <Monitor className="size-4" /> : <Sun className="size-4" />}
      {!collapsed && <span className="flex-1 text-left">Tema</span>}
    </DropdownMenuTrigger>
    <DropdownMenuContent side="top" align="start">
      <DropdownMenuItem onSelect={() => setTheme('light')}><Sun className="size-4" />Claro</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setTheme('dim')}><Moon className="size-4 opacity-70" />Dim (suave)</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setTheme('dark')}><Moon className="size-4" />Escuro</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setTheme('system')}><Monitor className="size-4" />Sistema</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

const FooterIconButton: React.FC<{
  collapsed: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  shortcut?: string
  danger?: boolean
}> = ({ collapsed, onClick, icon, label, shortcut, danger }) => {
  const btn = (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md text-sm transition-colors',
        danger
          ? 'text-[var(--sidebar-text-muted)] hover:bg-danger-soft hover:text-[var(--danger-strong)]'
          : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]',
        collapsed ? 'size-9 justify-center' : 'w-full px-2 h-8'
      )}
    >
      <span className="[&_svg]:size-4">{icon}</span>
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
      {!collapsed && shortcut && (
        <kbd className="font-mono text-[10px] leading-none px-1.5 py-1 rounded border border-[var(--sidebar-border)] bg-[var(--sidebar-hover)] text-[var(--sidebar-text-dim)]">{shortcut}</kbd>
      )}
    </button>
  )
  if (collapsed) return <TooltipQuick label={`${label}${shortcut ? ` · ${shortcut}` : ''}`} side="right">{btn}</TooltipQuick>
  return btn
}
