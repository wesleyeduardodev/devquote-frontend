import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorMessage = 'Ocorreu um erro inesperado';
    
    if (error.response) {
      // Erro de response do servidor
      const status = error.response.status;
      
      switch (status) {
        case 400:
          if (error.response.data.errors) {
            // Erros de validação
            const validationErrors = error.response.data.errors;
            errorMessage = Object.values(validationErrors).join(', ');
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = 'Dados inválidos fornecidos';
          }
          break;
        case 404:
          errorMessage = 'Recurso não encontrado';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        default:
          errorMessage = error.response.data.message || errorMessage;
      }
    } else if (error.request) {
      // Erro de network
      errorMessage = 'Erro de conexão. Verifique se a API está rodando.';
    }
    
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export default api;