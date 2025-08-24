import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

type ScreenGuardProps = {
  children: ReactNode;
  requiredScreen: string;
  fallback?: ReactNode;
  redirectTo?: string;
};

/**
 * Componente que protege conteúdo baseado em acesso a tela específica
 */
export function ScreenGuard({ 
  children, 
  requiredScreen, 
  fallback, 
  redirectTo = '/dashboard'
}: ScreenGuardProps) {
  const { hasScreenAccess, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasScreenAccess(requiredScreen)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

type MultipleScreenGuardProps = {
  children: ReactNode;
  requiredScreens: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
};

/**
 * Componente que protege conteúdo baseado em acesso a múltiplas telas
 */
export function MultipleScreenGuard({ 
  children, 
  requiredScreens, 
  requireAll = false,
  fallback, 
  redirectTo = '/dashboard'
}: MultipleScreenGuardProps) {
  const { hasScreenAccess, hasAnyScreenAccess, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAccess = requireAll 
    ? requiredScreens.every(screen => hasScreenAccess(screen))
    : hasAnyScreenAccess(requiredScreens);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

/**
 * Componente de acesso negado personalizado
 */
export function AccessDenied({ 
  message = "Você não tem permissão para acessar esta funcionalidade.",
  showBackButton = true 
}: {
  message?: string;
  showBackButton?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 p-8">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="h-8 w-8 text-red-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="1.5" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {showBackButton && (
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
}