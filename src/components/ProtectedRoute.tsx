import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    // Perfis requeridos (escalável para novos perfis: ADMIN, MANAGER, USER, DEVELOPER, etc)
    requiredProfile?: string;
    requiredProfiles?: string[];
    requireAllProfiles?: boolean; // true = AND, false = OR (default)
    fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredProfile,
    requiredProfiles,
    requireAllProfiles = false,
    fallback
}) => {
    const { isAuthenticated, isLoading, hasProfile, hasAnyProfile, hasAllProfiles } = useAuth();
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

    // Verificar perfil único
    if (requiredProfile && !hasProfile(requiredProfile)) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return <Navigate to="/dashboard" replace />;
    }

    // Verificar múltiplos perfis
    if (requiredProfiles && requiredProfiles.length > 0) {
        const hasAccess = requireAllProfiles
            ? hasAllProfiles(requiredProfiles)
            : hasAnyProfile(requiredProfiles);

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
