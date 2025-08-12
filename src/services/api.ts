import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

function resolveBaseURL(): string {
  // Prioriza Vite; mantém compat com REACT_APP_* e um default seguro
  const fromVite = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL;
  const fromCRA =
      (typeof process !== 'undefined' ? (process as any)?.env?.REACT_APP_API_URL : undefined) ||
      (typeof process !== 'undefined' ? (process as any)?.env?.REACT_APP_API_BASE_URL : undefined);

  const base = (fromVite || fromCRA || 'http://localhost:8080/api').toString();

  // Normaliza removendo barra final duplicada (opcional)
  return base.replace(/\/+$/, '') + '/';
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: false,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request: injeta Bearer se existir
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
    (error) => Promise.reject(error)
);

// Response: trata 401 limpando sessão e redirecionando
api.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status;

      if (status === 401) {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('auth.token');
            window.localStorage.removeItem('auth.user');
            // Evita loop caso já esteja na tela de login
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        } catch {
          // no-op
        }
      }

      // (Opcional) você pode tratar 403/404/500 aqui se quiser
      return Promise.reject(err);
    }
);

export default api;
