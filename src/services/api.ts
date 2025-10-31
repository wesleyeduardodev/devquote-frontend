import axios, {InternalAxiosRequestConfig, AxiosError} from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function resolveBaseURL(): string {
    const cleanUrl = API_URL.replace(/\/+$/, '');
    return cleanUrl + '/';
}

const api = axios.create({
    baseURL: resolveBaseURL(),
    withCredentials: false,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = window.localStorage.getItem('auth.token') || window.localStorage.getItem('token');
            if (token) {
                config.headers = config.headers ?? {};
                (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: any) => Promise.reject(error)
);

// Interface para erro padronizado do backend
interface ApiErrorResponse {
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
}

// Função para extrair mensagem de erro amigável
function getErrorMessage(error: AxiosError): string {
    const response = error.response;
    
    if (!response) {
        if (error.code === 'NETWORK_ERROR') {
            return 'Erro de conexão. Verifique sua internet.';
        }
        if (error.code === 'TIMEOUT') {
            return 'Timeout na requisição. Tente novamente.';
        }
        return 'Erro de conexão com o servidor.';
    }

    const data = response.data as ApiErrorResponse;

    // Se tem uma mensagem detalhada do backend, usa ela
    if (data?.detail) {
        return data.detail;
    }

    // Se tem erro de validação com campos específicos
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
    }

    // Mensagens padrão por status HTTP
    switch (response.status) {
        case 400:
            return 'Dados inválidos na requisição.';
        case 401:
            return 'Sessão expirada. Faça login novamente.';
        case 403:
            return 'Você não tem permissão para esta operação.';
        case 404:
            return 'Recurso não encontrado.';
        case 409:
            return 'Conflito de dados. Verifique se já existe um registro similar.';
        case 422:
            return 'Dados não puderam ser processados.';
        case 429:
            return 'Muitas tentativas. Tente novamente em alguns minutos.';
        case 500:
            return 'Erro interno do servidor. Tente novamente mais tarde.';
        case 502:
        case 503:
        case 504:
            return 'Serviço temporariamente indisponível.';
        default:
            return 'Erro inesperado. Tente novamente.';
    }
}

api.interceptors.response.use(
    (res: any) => res,
    (error: AxiosError) => {
        const status = error?.response?.status;

        // Handle 401 - Unauthorized
        if (status === 401) {
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('auth.token');
                    window.localStorage.removeItem('auth.user');
                    window.localStorage.removeItem('token');
                    
                    if (!window.location.pathname.includes('/login')) {
                        toast.error('Sessão expirada. Redirecionando para login...');
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 1500);
                    }
                }
            } catch {
                // Silently fail
            }
        } else {
            // Para outros erros, extraia a mensagem amigável
            const errorMessage = getErrorMessage(error);
            
            // Adiciona informações extras do erro para debug
            const enhancedError = {
                ...error,
                userMessage: errorMessage,
                apiError: error.response?.data as ApiErrorResponse,
            };

            // Log do erro para debug (removível em produção)
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method?.toUpperCase(),
                status: error.response?.status,
                message: errorMessage,
                data: error.response?.data,
                traceId: (error.response?.data as ApiErrorResponse)?.traceId,
            });
            
            return Promise.reject(enhancedError);
        }
        
        return Promise.reject(error);
    }
);

export default api;
