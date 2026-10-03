import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-surface-inverse/40 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-[calc(100vw-1.5rem)] max-w-lg max-h-[90dvh] overflow-y-auto overflow-x-hidden overscroll-contain',
        'rounded-xl border border-border-subtle bg-surface-1 p-4 sm:p-6 shadow-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 z-20 rounded-md p-1.5 sm:p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <X className="size-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 pb-4 pr-8 min-w-0', className)} {...props} />
)

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  // Rodapé fixo no fim do scroll do diálogo. No mobile os botões empilham em largura total
  // (ação principal em cima); a partir de sm voltam lado a lado alinhados à direita.
  <div
    className={cn(
      'sticky bottom-0 z-10 bg-surface-1 flex flex-col-reverse gap-2 pt-4 border-t border-border-subtle mt-4',
      '-mx-4 px-4 -mb-4 pb-4 sm:-mx-6 sm:px-6 sm:-mb-6 sm:pb-6',
      '[&>*]:w-full sm:flex-row sm:justify-end sm:flex-wrap sm:[&>*]:w-auto',
      className
    )}
    {...props}
  />
)

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-text-primary', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-text-secondary', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'
