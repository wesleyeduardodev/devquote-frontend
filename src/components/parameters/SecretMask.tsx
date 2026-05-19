import * as React from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui-v2/Button'

/** Decide se o nome do parâmetro indica conteúdo sensível. */
export function isSensitiveParamName(name: string | undefined): boolean {
  if (!name) return false
  return /KEY|SECRET|TOKEN|PASSWORD|PWD|API_KEY/i.test(name)
}

interface SecretMaskProps {
  name?: string
  value?: string
  className?: string
}

export const SecretMask: React.FC<SecretMaskProps> = ({ name, value, className }) => {
  const sensitive = isSensitiveParamName(name)
  const [visible, setVisible] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 10_000)
    return () => clearTimeout(t)
  }, [visible])

  if (!value) return <span className="text-text-tertiary">—</span>

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('Copiado')
    } catch {
      toast.error('Falha ao copiar')
    }
  }

  if (!sensitive) {
    return <span className={className}>{value}</span>
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs text-text-secondary tabular-nums">
        {visible ? value : '••••••••••••'}
      </span>
      <Button size="icon-sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setVisible((v) => !v) }} aria-label={visible ? 'Ocultar' : 'Mostrar'}>
        {visible ? <EyeOff /> : <Eye />}
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={handleCopy} aria-label="Copiar">
        {copied ? <Check /> : <Copy />}
      </Button>
    </span>
  )
}
