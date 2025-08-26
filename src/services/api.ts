import axios, {InternalAxiosRequestConfig} from 'axios';

function resolveBaseURL(): string {

    let fromVite;

    try {
        const metaEnv = (import.meta as any)?.env || {};
        fromVite = metaEnv.VITE_API_URL || metaEnv.VITE_API_BASE_URL;
    } catch {
        fromVite = undefined;
    }

    const base = fromVite || 'http://localhost:8080/api';
    //const base = fromVite || 'https://devquote-backend-latest.onrender.com/api';

    return String(base).replace(/\/+$/, '') + '/';
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

api.interceptors.response.use(
    (res: any) => res,
    (err: any) => {
        const status = err?.response?.status;

        if (status === 401) {
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('auth.token');
                    window.localStorage.removeItem('auth.user');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            } catch {
            }
        }
        return Promise.reject(err);
    }
);

export default api;
