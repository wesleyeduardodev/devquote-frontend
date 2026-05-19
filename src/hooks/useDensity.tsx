import * as React from 'react'

type Density = 'compact' | 'comfortable'

interface DensityContextValue {
  density: Density
  setDensity: (d: Density) => void
  toggleDensity: () => void
}

const DensityContext = React.createContext<DensityContextValue | null>(null)
const STORAGE_KEY = 'devquote.density'

function getInitial(): Density {
  if (typeof window === 'undefined') return 'comfortable'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'compact' ? 'compact' : 'comfortable'
}

function apply(d: Density) {
  document.documentElement.setAttribute('data-density', d)
}

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensityState] = React.useState<Density>(getInitial)

  React.useEffect(() => {
    apply(density)
    window.localStorage.setItem(STORAGE_KEY, density)
  }, [density])

  const setDensity = React.useCallback((d: Density) => setDensityState(d), [])
  const toggleDensity = React.useCallback(() => {
    setDensityState((cur) => (cur === 'compact' ? 'comfortable' : 'compact'))
  }, [])

  return (
    <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
      {children}
    </DensityContext.Provider>
  )
}

export function useDensity() {
  const ctx = React.useContext(DensityContext)
  if (!ctx) throw new Error('useDensity deve ser usado dentro de <DensityProvider>')
  return ctx
}
