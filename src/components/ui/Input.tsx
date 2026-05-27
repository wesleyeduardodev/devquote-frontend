import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { Calendar, Clock, type LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: string;
    className?: string;
    required?: boolean;
    /**
     * Ícone à direita do input. Se omitido e `type` for `date`/`datetime-local`/`time`,
     * usa Calendar/Clock automaticamente. O ícone é clicável e abre o picker nativo
     * (input.showPicker()), enquanto o usuário continua podendo digitar manualmente.
     */
    icon?: LucideIcon;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label, error, helpText, className, required, icon, type, ...props
}, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);

    const isDateLike = type === 'date' || type === 'datetime-local' || type === 'month' || type === 'week';
    const isTime = type === 'time';
    const ResolvedIcon: LucideIcon | undefined = icon ?? (isDateLike ? Calendar : isTime ? Clock : undefined);
    const hasIcon = !!ResolvedIcon;
    const isPickerType = isDateLike || isTime;

    const openPicker = () => {
        const el = innerRef.current;
        if (!el || el.disabled) return;
        const anyEl = el as HTMLInputElement & { showPicker?: () => void };
        if (typeof anyEl.showPicker === 'function') {
            try { anyEl.showPicker(); } catch { el.focus(); }
        } else {
            el.focus();
        }
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {label}
                    {required && <span className="text-[var(--danger-strong)] ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    ref={innerRef}
                    type={type}
                    className={clsx(
                        'w-full h-10 px-3 rounded-md border text-sm bg-surface-1 text-text-primary placeholder:text-text-tertiary',
                        'transition-colors duration-fast',
                        'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
                        error
                            ? 'border-[var(--danger-strong)]'
                            : 'border-border-strong hover:border-text-tertiary',
                        'disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-70',
                        hasIcon && 'pr-10',
                        // Esconde o picker indicator nativo quando o ícone customizado está visível,
                        // pra não duplicar (mantém o picker funcional via showPicker no clique do ícone).
                        isPickerType && '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer',
                        className
                    )}
                    {...props}
                />
                {ResolvedIcon && (
                    <button
                        type="button"
                        onClick={openPicker}
                        disabled={props.disabled}
                        tabIndex={-1}
                        aria-label="Abrir seletor"
                        className={clsx(
                            'absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center',
                            'h-7 w-7 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2',
                            'transition-colors duration-fast',
                            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
                        )}
                    >
                        <ResolvedIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
            {helpText && !error && (
                <p className="mt-1 text-xs text-text-tertiary">{helpText}</p>
            )}
            {error && (
                <p className="mt-1 text-xs text-[var(--danger-strong)]">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
