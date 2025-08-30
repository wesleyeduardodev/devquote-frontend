import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import Button from './Button';

interface ErrorDisplayProps {
    error?: any;
    title?: string;
    message?: string;
    showRetry?: boolean;
    onRetry?: () => void;
    className?: string;
    variant?: 'default' | 'minimal' | 'card';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    title,
    message,
    showRetry = true,
    onRetry,
    className = '',
    variant = 'default'
}) => {
    // Determina o tipo de erro
    const isNetworkError = !error?.response || error?.code === 'NETWORK_ERROR';
    const isServerError = error?.response?.status >= 500;
    const isNotFound = error?.response?.status === 404;
    const isUnauthorized = error?.response?.status === 401;
    const isForbidden = error?.response?.status === 403;

    // Seleciona ícone baseado no tipo de erro
    const getIcon = () => {
        if (isNetworkError) return <WifiOff className="w-8 h-8 text-gray-400" />;
        return <AlertCircle className="w-8 h-8 text-red-500" />;
    };

    // Determina título padrão
    const getDefaultTitle = () => {
        if (isNetworkError) return 'Erro de Conexão';
        if (isServerError) return 'Erro do Servidor';
        if (isNotFound) return 'Não Encontrado';
        if (isUnauthorized) return 'Não Autorizado';
        if (isForbidden) return 'Acesso Negado';
        return 'Erro';
    };

    // Determina mensagem padrão
    const getDefaultMessage = () => {
        if (isNetworkError) return 'Verifique sua conexão com a internet e tente novamente.';
        if (isServerError) return 'Erro interno do servidor. Tente novamente em alguns minutos.';
        if (isNotFound) return 'O recurso solicitado não foi encontrado.';
        if (isUnauthorized) return 'Sua sessão expirou. Faça login novamente.';
        if (isForbidden) return 'Você não tem permissão para acessar este recurso.';
        return 'Ocorreu um erro inesperado. Tente novamente.';
    };

    const displayTitle = title || getDefaultTitle();
    const displayMessage = message || error?.userMessage || getDefaultMessage();

    const baseClasses = `flex flex-col items-center justify-center text-center ${className}`;

    if (variant === 'minimal') {
        return (
            <div className={`${baseClasses} p-4`}>
                <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{displayMessage}</span>
                </div>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={`${baseClasses} bg-white rounded-lg border border-gray-200 shadow-sm p-6`}>
                {getIcon()}
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{displayTitle}</h3>
                <p className="mt-2 text-gray-600 max-w-sm">{displayMessage}</p>
                {showRetry && onRetry && (
                    <Button
                        variant="outline"
                        onClick={onRetry}
                        className="mt-4"
                        icon={RefreshCw}
                    >
                        Tentar Novamente
                    </Button>
                )}
            </div>
        );
    }

    // variant === 'default'
    return (
        <div className={`${baseClasses} p-8`}>
            {getIcon()}
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{displayTitle}</h3>
            <p className="mt-2 text-gray-600 max-w-md">{displayMessage}</p>
            
            {showRetry && onRetry && (
                <Button
                    variant="primary"
                    onClick={onRetry}
                    className="mt-6"
                    icon={RefreshCw}
                >
                    Tentar Novamente
                </Button>
            )}

            {/* Debug info em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Debug Info (Dev only)
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 rounded text-xs font-mono">
                        <div><strong>URL:</strong> {error?.config?.url}</div>
                        <div><strong>Method:</strong> {error?.config?.method?.toUpperCase()}</div>
                        <div><strong>Status:</strong> {error?.response?.status}</div>
                        <div><strong>TraceId:</strong> {error?.apiError?.traceId || 'N/A'}</div>
                        {error?.response?.data && (
                            <div className="mt-2">
                                <strong>Response:</strong>
                                <pre className="mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(error.response.data, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </details>
            )}
        </div>
    );
};

export default ErrorDisplay;