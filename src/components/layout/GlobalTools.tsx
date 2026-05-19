import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDensity } from '@/hooks/useDensity'
import { useCommandPalette } from './CommandPalette'
import { Avatar } from '@/components/ui-v2/Avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem
} from '@/components/ui-v2/DropdownMenu'
import { TooltipQuick } from '@/components/ui-v2/Tooltip'

interface GlobalToolsProps {
  /** Mostra o botão de menu mobile (hambúrguer) à esquerda. */
  onToggleSidebar?: () => void
}

/**
 * Ferramentas globais: Cmd+K · Notificações · Avatar/menu.
 * Usado no topo do PageHeader para ficar alinhado com o título da página.
 */
export const GlobalTools: React.FC<GlobalToolsProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin, isManager } = useAuth() as any
  const navigate = useNavigate()
  const { density, setDensity } = useDensity()
  const palette = useCommandPalette()

  const handleLogout = async () => {
    try { await logout() } catch (e) { console.error(e) }
    navigate('/login')
  }
  const role = isAdmin?.() ? 'Administrador' : isManager?.() ? 'Gerente' : 'Usuário'
  const displayName = user?.name || user?.username || 'Usuário'

  return (
    <div className="flex items-center gap-1">
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-1 rounded-md hover:bg-surface-2 text-text-secondary transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
      )}

      <TooltipQuick label="Buscar global (⌘K)">
        <button
          onClick={palette.toggle}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label="Buscar global"
        >
          <Search className="size-4" />
          <kbd className="font-mono text-[10px] bg-surface-2 border border-border-subtle rounded px-1 py-0.5">⌘K</kbd>
        </button>
      </TooltipQuick>

      <TooltipQuick label="Notificações">
        <button
          className="p-2 rounded-md hover:bg-surface-2 text-text-secondary transition-colors relative"
          aria-label="Notificações"
        >
          <Bell className="size-4" />
        </button>
      </TooltipQuick>

      <div className="h-5 w-px bg-border-subtle mx-1" aria-hidden />

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-1.5 py-0.5 rounded-md hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
          <Avatar name={displayName} size="sm" />
          <div className="hidden sm:flex flex-col items-start min-w-0 leading-tight">
            <span className="text-sm font-medium text-text-primary truncate max-w-[160px]">{displayName}</span>
            <span className="text-[10px] text-text-tertiary">{role}</span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text-primary truncate">{displayName}</span>
              <span className="text-xs text-text-tertiary truncate">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <User className="size-4" />Meu perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Densidade</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as any)}>
            <DropdownMenuRadioItem value="compact">Compacto</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Confortável</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} variant="danger">
            <LogOut className="size-4" />Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
