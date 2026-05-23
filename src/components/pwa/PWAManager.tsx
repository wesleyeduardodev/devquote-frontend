import * as React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'react-hot-toast'
import { Download, RefreshCw, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'devquote.pwa.installDismissedAt'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

export const PWAManager: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Verifica atualização a cada 30min enquanto a aba está aberta
        setInterval(() => { void r.update() }, 30 * 60 * 1000)
      }
    },
  })

  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  })

  // Captura o evento beforeinstallprompt
  React.useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    const recentlyDismissed = dismissedAt > 0 && (Date.now() - dismissedAt) < DISMISS_TTL_MS

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      if (!recentlyDismissed && !installed) {
        setInstallEvent(e as BeforeInstallPromptEvent)
      }
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
      toast.success('App instalado!')
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [installed])

  // Toast quando há atualização disponível
  React.useEffect(() => {
    if (!needRefresh) return
    const id = toast.custom((t) => (
      <div
        className={`max-w-sm bg-surface-1 border border-border-strong rounded-lg shadow-lg p-3 flex items-center gap-3 ${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out'}`}
        role="status"
      >
        <RefreshCw className="size-5 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">Nova versão disponível</div>
          <div className="text-xs text-text-secondary">Atualize para aplicar as melhorias.</div>
        </div>
        <button
          onClick={() => { void updateServiceWorker(true) }}
          className="text-xs font-medium bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent-hover transition-colors"
        >
          Atualizar
        </button>
        <button
          onClick={() => { setNeedRefresh(false); toast.dismiss(t.id) }}
          className="text-text-tertiary hover:text-text-primary"
          aria-label="Dispensar"
        >
          <X className="size-4" />
        </button>
      </div>
    ), { duration: Infinity, id: 'pwa-update' })

    return () => { toast.dismiss(id) }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  // Toast (rápido) quando offline-ready
  React.useEffect(() => {
    if (offlineReady) {
      toast.success('App pronto para uso offline', { duration: 3000 })
      setOfflineReady(false)
    }
  }, [offlineReady, setOfflineReady])

  const handleInstall = async () => {
    if (!installEvent) return
    try {
      await installEvent.prompt()
      await installEvent.userChoice
    } finally {
      setInstallEvent(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setInstallEvent(null)
  }

  if (!installEvent || installed) return null

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className="fixed z-50 bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm bg-surface-1 border border-border-strong rounded-xl shadow-xl p-4"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-text-tertiary hover:text-text-primary"
        aria-label="Fechar"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <Download className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div id="pwa-install-title" className="text-sm font-semibold text-text-primary">
            Instalar DevQuote
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Acesse mais rápido e use offline. Instala no celular ou desktop.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="text-xs font-medium bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent-hover transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-medium text-text-secondary hover:text-text-primary px-2 py-1.5"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAManager
