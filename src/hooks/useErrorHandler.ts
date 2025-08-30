import { useCallback, useState } from 'react';
import { handleApiError, getUserErrorMessage, isErrorOfType } from '@/utils/errorHandler';

interface UseErrorHandlerReturn {
    error: any;
    hasError: boolean;
    isLoading: boolean;
    isNetworkError: boolean;
    isAuthError: boolean;
    clearError: () => void;
    handleError: (error: any, context?: string) => void;
    executeWithErrorHandling: <T>(
        asyncFn: () => Promise<T>,
        context?: string,
        showToast?: boolean
    ) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
    const [error, setError] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleError = useCallback((err: any, context?: string) => {
        setError(err);
        if (context) {
            handleApiError(err, context);
        }
    }, []);

    const executeWithErrorHandling = useCallback(
        async <T>(
            asyncFn: () => Promise<T>,
            context?: string,
            showToast: boolean = true
        ): Promise<T | null> => {
            try {
                setIsLoading(true);
                clearError();
                const result = await asyncFn();
                return result;
            } catch (err: any) {
                setError(err);
                if (showToast && context) {
                    handleApiError(err, context);
                }
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [clearError]
    );

    const hasError = !!error;
    const isNetworkError = hasError && isErrorOfType(error, 'network');
    const isAuthError = hasError && isErrorOfType(error, 'auth');

    return {
        error,
        hasError,
        isLoading,
        isNetworkError,
        isAuthError,
        clearError,
        handleError,
        executeWithErrorHandling,
    };
};