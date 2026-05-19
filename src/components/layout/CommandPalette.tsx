import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  LayoutDashboard, ListChecks, Truck, DollarSign, Users, FolderKanban,
  Shield, Bell, Settings, Plus, Search, FileText, ArrowRight, Sun, Moon, Monitor
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { taskService } from '@/services/taskService'
import { requesterService } from '@/services/requesterService'
import { projectService } from '@/services/projectService'

interface SearchResult {
  id: string
  type: 'task' | 'requester' | 'project'
  title: string
  subtitle?: string
  href: string
}

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (o: boolean) => void
  toggle: () => void
}
const Ctx = React.createContext<CommandPaletteContextValue | null>(null)

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  const toggle = React.useCallback(() => setOpen((o) => !o), [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </Ctx.Provider>
  )
}

export function useCommandPalette() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useCommandPalette deve estar dentro de <CommandPaletteProvider>')
  return ctx
}

const CommandPalette: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const navigate = useNavigate()
  const { hasAnyProfile, isAdmin } = useAuth()
  const { setTheme } = useTheme()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  // Debounce busca
  React.useEffect(() => {
    if (!open) return
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const q = query.trim()
        const sort = [{ field: 'id', direction: 'desc' as const }]
        const [tasks, requesters, projects] = await Promise.allSettled([
          taskService.getAllPaginated({ page: 0, size: 5, sort, filters: { title: q } as any }).catch(() => null),
          requesterService.getAllPaginated({ page: 0, size: 5, sort, filters: { name: q } as any }).catch(() => null),
          projectService.getAllPaginated({ page: 0, size: 5, sort, filters: { name: q } as any }).catch(() => null),
        ])
        const out: SearchResult[] = []
        const grab = (r: PromiseSettledResult<any>): any[] => {
          if (r.status !== 'fulfilled' || !r.value) return []
          const v = r.value
          return Array.isArray(v) ? v : v.content || v.items || []
        }
        grab(tasks).slice(0, 5).forEach((t: any) => out.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title || `Tarefa #${t.id}`,
          subtitle: t.code ? `#${t.id} · ${t.code}` : `#${t.id}`,
          href: `/tasks/${t.id}`,
        }))
        grab(requesters).slice(0, 5).forEach((r: any) => out.push({
          id: `req-${r.id}`,
          type: 'requester',
          title: r.name,
          subtitle: r.email,
          href: `/requesters/${r.id}/edit`,
        }))
        grab(projects).slice(0, 5).forEach((p: any) => out.push({
          id: `proj-${p.id}`,
          type: 'project',
          title: p.name,
          subtitle: p.repositoryUrl,
          href: `/projects/${p.id}/edit`,
        }))
        setResults(out)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [query, open])

  const go = (href: string) => {
    onOpenChange(false)
    setQuery('')
    navigate(href)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-inverse/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[20%] z-50 w-[92vw] max-w-xl -translate-x-1/2 rounded-xl border border-border-subtle bg-surface-1 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">Buscar e navegar</Dialog.Title>
          <Command shouldFilter={false} className="flex flex-col max-h-[60vh]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
              <Search className="size-4 text-text-tertiary" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Buscar tarefas, projetos, solicitantes..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">ESC</kbd>
            </div>

            <Command.List className="flex-1 overflow-auto p-2">
              {loading && (
                <div className="px-2 py-3 text-xs text-text-tertiary">Buscando…</div>
              )}

              {!query && (
                <>
                  <CommandGroup heading="Ações">
                    <CommandItem icon={<Plus />} label="Criar tarefa" shortcut="N" onSelect={() => go('/tasks/create')} />
                    <CommandItem icon={<Plus />} label="Criar entrega" onSelect={() => go('/deliveries/create')} />
                    {isAdmin?.() && <CommandItem icon={<Plus />} label="Criar solicitante" onSelect={() => go('/requesters/create')} />}
                  </CommandGroup>

                  <CommandGroup heading="Navegar">
                    <CommandItem icon={<LayoutDashboard />} label="Dashboard"   shortcut="G D" onSelect={() => go('/dashboard')} />
                    <CommandItem icon={<ListChecks />}     label="Tarefas"      shortcut="G T" onSelect={() => go('/tasks')} />
                    <CommandItem icon={<Truck />}          label="Entregas"     shortcut="G E" onSelect={() => go('/deliveries')} />
                    {hasAnyProfile?.(['ADMIN','MANAGER']) && (
                      <CommandItem icon={<DollarSign />}  label="Faturamento" shortcut="G F" onSelect={() => go('/billing')} />
                    )}
                    {isAdmin?.() && (
                      <>
                        <CommandItem icon={<Users />}        label="Solicitantes"  onSelect={() => go('/requesters')} />
                        <CommandItem icon={<FolderKanban />} label="Projetos"      onSelect={() => go('/projects')} />
                        <CommandItem icon={<Shield />}       label="Perfis"        onSelect={() => go('/profiles')} />
                        <CommandItem icon={<Bell />}         label="Notificações"  onSelect={() => go('/notifications')} />
                        <CommandItem icon={<Settings />}     label="Parâmetros"    onSelect={() => go('/parameters')} />
                      </>
                    )}
                  </CommandGroup>

                  <CommandGroup heading="Tema">
                    <CommandItem icon={<Sun />}     label="Tema claro"       onSelect={() => { setTheme('light');  onOpenChange(false) }} />
                    <CommandItem icon={<Moon />}    label="Tema Dim (suave)" onSelect={() => { setTheme('dim');    onOpenChange(false) }} />
                    <CommandItem icon={<Moon />}    label="Tema escuro"      onSelect={() => { setTheme('dark');   onOpenChange(false) }} />
                    <CommandItem icon={<Monitor />} label="Tema do sistema"  onSelect={() => { setTheme('system'); onOpenChange(false) }} />
                  </CommandGroup>
                </>
              )}

              {query && !loading && results.length === 0 && (
                <Command.Empty className="px-2 py-6 text-center text-sm text-text-tertiary">
                  Nenhum resultado para “{query}”
                </Command.Empty>
              )}

              {results.length > 0 && (
                <CommandGroup heading="Resultados">
                  {results.map((r) => (
                    <CommandItem
                      key={r.id}
                      icon={r.type === 'task' ? <ListChecks /> : r.type === 'requester' ? <Users /> : <FolderKanban />}
                      label={r.title}
                      subtitle={r.subtitle}
                      trailing={<ArrowRight className="size-3.5 text-text-tertiary" />}
                      onSelect={() => go(r.href)}
                    />
                  ))}
                </CommandGroup>
              )}
            </Command.List>

            <div className="border-t border-border-subtle px-3 py-2 flex items-center justify-between text-[11px] text-text-tertiary">
              <div className="flex items-center gap-2">
                <kbd className="font-mono">↑↓</kbd> navegar
                <kbd className="font-mono">↵</kbd> selecionar
              </div>
              <span><kbd className="font-mono">esc</kbd> fechar</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const CommandGroup: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
  <Command.Group
    heading={<span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary px-2 py-1.5 block">{heading}</span> as any}
    className="mb-2"
  >
    {children}
  </Command.Group>
)

const CommandItem: React.FC<{
  icon?: React.ReactNode
  label: string
  subtitle?: string
  shortcut?: string
  trailing?: React.ReactNode
  onSelect?: () => void
}> = ({ icon, label, subtitle, shortcut, trailing, onSelect }) => (
  <Command.Item
    onSelect={onSelect}
    className={cn(
      'flex items-center gap-2.5 px-2 py-2 text-sm rounded-md cursor-pointer',
      'data-[selected=true]:bg-surface-2 data-[selected=true]:text-text-primary',
      'text-text-secondary'
    )}
  >
    {icon && <span className="text-text-tertiary [&_svg]:size-4 shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">
      <div className="truncate text-text-primary">{label}</div>
      {subtitle && <div className="truncate text-xs text-text-tertiary">{subtitle}</div>}
    </div>
    {shortcut && <kbd className="font-mono text-[10px] text-text-tertiary bg-surface-2 border border-border-subtle rounded px-1.5 py-0.5">{shortcut}</kbd>}
    {trailing}
  </Command.Item>
)
