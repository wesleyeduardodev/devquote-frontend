import toast from 'react-hot-toast';

export interface ApiError {
    userMessage?: string;
    apiError?: {
        type?: string;
        title?: string;
        status?: number;
        detail?: string;
        instance?: string;
        timestamp?: string;
        traceId?: string;
        errorCode?: string;
        errors?: Array<{
            field: string;
            message: string;
            rejectedValue?: any;
        }>;
        [key: string]: any;
    };
    response?: {
        status: number;
        data: any;
    };
    message?: string;
    code?: string;
}

export function getUserErrorMessage(error: any): string {

    if (error?.userMessage) {
        return error.userMessage;
    }

    if (!error?.response) {
        if (error?.code === 'NETWORK_ERROR') {
            return 'Erro de conexão. Verifique sua internet.';
        }
        if (error?.code === 'TIMEOUT') {
            return 'Timeout na requisição. Tente novamente.';
        }
        return 'Erro de conexão com o servidor.';
    }

    const apiData = error.response?.data;
    if (apiData?.detail) {
        return apiData.detail;
    }

    if (apiData?.errors && Array.isArray(apiData.errors) && apiData.errors.length > 0) {
        return apiData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
    }

    const status = error.response?.status;
    switch (status) {
        case 400:
            return 'Dados inválidos na requisição.';
        case 401:
            return 'Não autorizado. Faça login novamente.';
        case 403:
            return 'Você não tem permissão para esta operação.';
        case 404:
            return 'Recurso não encontrado.';
        case 409:
            return 'Conflito de dados. Verifique se já existe um registro similar.';
        case 422:
            return 'Dados não puderam ser processados.';
        case 500:
            return 'Erro interno do servidor. Tente novamente mais tarde.';
        default:
            return 'Erro inesperado. Tente novamente.';
    }
}

export function showErrorToast(error: any, defaultMessage?: string): void {
    const message = getUserErrorMessage(error) || defaultMessage || 'Ocorreu um erro inesperado';
    toast.error(message);
}


export function handleApiError(error: any, context: string = 'operação'): void {
    console.error(`Erro na ${context}:`, error);
    
    const message = getUserErrorMessage(error);
    toast.error(message);

    if (process.env.NODE_ENV === 'development') {
        console.group(`🔴 Erro na ${context}`);
        console.log('URL:', error?.config?.url);
        console.log('Método:', error?.config?.method?.toUpperCase());
        console.log('Status:', error?.response?.status);
        console.log('Dados:', error?.response?.data);
        console.log('TraceId:', error?.apiError?.traceId);
        console.groupEnd();
    }
}

export function isErrorOfType(error: any, type: 'network' | 'auth' | 'validation' | 'permission' | 'not-found'): boolean {
    if (!error) return false;

    switch (type) {
        case 'network':
            return !error.response || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT';
        case 'auth':
            return error.response?.status === 401;
        case 'validation':
            return error.response?.status === 400 || error.response?.status === 422;
        case 'permission':
            return error.response?.status === 403;
        case 'not-found':
            return error.response?.status === 404;
        default:
            return false;
    }
}

