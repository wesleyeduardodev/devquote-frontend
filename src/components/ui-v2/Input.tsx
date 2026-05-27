import * as React from 'react'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, trailingIcon, invalid, type, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, [])

    const isDateLike = type === 'date' || type === 'datetime-local' || type === 'month' || type === 'week'
    const isTime = type === 'time'
    const isPickerType = isDateLike || isTime

    // Se não há trailingIcon explícito e o tipo é um picker, injetamos um ícone
    // clicável que abre o picker nativo (showPicker). O usuário ainda pode digitar.
    const autoPickerIcon = isPickerType && !trailingIcon ? (isDateLike ? Calendar : Clock) : null

    const openPicker = () => {
      const el = innerRef.current
      if (!el || el.disabled) return
      const anyEl = el as HTMLInputElement & { showPicker?: () => void }
      if (typeof anyEl.showPicker === 'function') {
        try { anyEl.showPicker() } catch { el.focus() }
      } else {
        el.focus()
      }
    }

    const baseInput = cn(
      'flex h-8 w-full rounded-md border bg-surface-1 px-3 text-sm text-text-primary placeholder:text-text-tertiary',
      'transition-colors duration-fast',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      invalid ? 'border-[var(--danger-strong)] focus-visible:ring-[var(--danger-strong)]/20 focus-visible:border-[var(--danger-strong)]' : 'border-border-strong',
      leadingIcon && 'pl-9',
      (trailingIcon || autoPickerIcon) && 'pr-9',
      // Esconde o picker indicator nativo (mas cobrindo a área do ícone — clique funciona em qualquer browser)
      isPickerType && '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer',
      className
    )

    if (leadingIcon || trailingIcon || autoPickerIcon) {
      const AutoIcon = autoPickerIcon
      return (
        <div className="relative w-full">
          {leadingIcon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4 pointer-events-none">
              {leadingIcon}
            </div>
          )}
          <input ref={innerRef} type={type} className={baseInput} {...props} />
          {trailingIcon && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4">
              {trailingIcon}
            </div>
          )}
          {AutoIcon && !trailingIcon && (
            <button
              type="button"
              onClick={openPicker}
              disabled={props.disabled}
              tabIndex={-1}
              aria-label="Abrir seletor"
              className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <AutoIcon className="size-4" />
            </button>
          )}
        </div>
      )
    }
    return <input ref={innerRef} type={type} className={baseInput} {...props} />
  }
)
Input.displayName = 'Input'
