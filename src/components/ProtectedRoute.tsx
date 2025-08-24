import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredScreen?: string;
    requiredScreens?: string[];
    requireAllScreens?: boolean;
    fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredScreen,
    requiredScreens,
    requireAllScreens = false,
    fallback
}) => {
    const { isAuthenticated, isLoading, hasScreenAccess, hasAnyScreenAccess } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" className="mx-auto" />
                    <p className="mt-4 text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verificar permissões de tela se especificadas
    if (requiredScreen && !hasScreenAccess(requiredScreen)) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return <Navigate to="/dashboard" replace />;
    }

    if (requiredScreens && requiredScreens.length > 0) {
        const hasAccess = requireAllScreens 
            ? requiredScreens.every(screen => hasScreenAccess(screen))
            : hasAnyScreenAccess(requiredScreens);
            
        if (!hasAccess) {
            if (fallback) {
                return <>{fallback}</>;
            }
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;