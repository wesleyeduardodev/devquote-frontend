import * as React from 'react'
import { Command } from 'cmdk'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from './Popover'
import { cn } from '@/utils/cn'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  value?: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

/** Select com busca (digitar e filtrar). Bom para listas grandes. */
export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  searchPlaceholder = 'Buscar…',
  emptyText = 'Nada encontrado.',
  className,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-8 w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-surface-1 px-3 text-sm',
            selected ? 'text-text-primary' : 'text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className="line-clamp-1 text-left">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-text-tertiary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[12rem]" align="start">
        <Command className="max-h-72 overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border-subtle">
            <Search className="size-4 text-text-tertiary shrink-0" />
            <Command.Input
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            />
          </div>
          <Command.List className="max-h-60 overflow-auto p-1">
            <Command.Empty className="px-2 py-3 text-xs text-text-tertiary">{emptyText}</Command.Empty>
            {options.map((o) => (
              <Command.Item
                key={o.value || '__none'}
                value={o.label}
                onSelect={() => { onChange(o.value); setOpen(false) }}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-text-primary outline-none data-[selected=true]:bg-surface-2"
              >
                <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  {value === o.value && <Check className="size-3.5 text-accent" />}
                </span>
                {o.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
