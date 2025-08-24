import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

type ResourceGuardProps = {
  children: ReactNode;
  resource: string;
  operation: string;
  fallback?: ReactNode;
  showFallback?: boolean;
};

/**
 * Componente que protege conteúdo baseado em permissões de recurso/operação
 */
export function ResourceGuard({ 
  children, 
  resource, 
  operation, 
  fallback,
  showFallback = true
}: ResourceGuardProps) {
  const { hasResourcePermission } = useAuth();

  if (!hasResourcePermission(resource, operation)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (!showFallback) {
      return null;
    }
    
    return (
      <div className="text-gray-400 text-sm italic">
        Sem permissão para {operation.toLowerCase()} {resource}
      </div>
    );
  }

  return <>{children}</>;
}

type MultipleResourceGuardProps = {
  children: ReactNode;
  permissions: Array<{ resource: string; operation: string }>;
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
};

/**
 * Componente que protege conteúdo baseado em múltiplas permissões de recursos
 */
export function MultipleResourceGuard({ 
  children, 
  permissions,
  requireAll = false,
  fallback,
  showFallback = true
}: MultipleResourceGuardProps) {
  const { hasResourcePermission } = useAuth();

  const hasAccess = requireAll
    ? permissions.every(({ resource, operation }) => hasResourcePermission(resource, operation))
    : permissions.some(({ resource, operation }) => hasResourcePermission(resource, operation));

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (!showFallback) {
      return null;
    }
    
    return (
      <div className="text-gray-400 text-sm italic">
        Sem permissão para executar esta operação
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Props para botões com proteção de permissão
 */
type ProtectedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  resource: string;
  operation: string;
  fallback?: ReactNode;
  showWhenDisabled?: boolean;
  disabledMessage?: string;
};

/**
 * Botão que só aparece/funciona se o usuário tiver a permissão necessária
 */
export function ProtectedButton({ 
  resource, 
  operation, 
  fallback,
  showWhenDisabled = true,
  disabledMessage = "Sem permissão",
  children,
  className = "",
  disabled,
  ...props 
}: ProtectedButtonProps) {
  const { hasResourcePermission } = useAuth();
  const hasPermission = hasResourcePermission(resource, operation);

  if (!hasPermission && !showWhenDisabled) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!hasPermission && showWhenDisabled) {
    return (
      <button
        {...props}
        disabled={true}
        title={disabledMessage}
        className={`${className} opacity-50 cursor-not-allowed`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...props}
      disabled={disabled || !hasPermission}
      className={className}
    >
      {children}
    </button>
  );
}