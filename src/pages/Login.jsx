import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, User, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Validação do formulário
const loginSchema = yup.object({
  username: yup
    .string()
    .required('Usuário é obrigatório')
    .min(3, 'Usuário deve ter pelo menos 3 caracteres'),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(4, 'Senha deve ter pelo menos 4 caracteres'),
});

// Credenciais fixas (temporário)
const VALID_CREDENTIALS = {
  username: 'admin',
  password: '1234'
};

const Login = () => {
  const navigate = useNavigate();
  
  // Verificar se o hook useAuth está funcionando
  let authHook = null;
  try {
    authHook = useAuth();
  } catch (error) {
    console.error('Erro no useAuth:', error);
    toast.error('Erro de configuração. Verifique o console.');
  }
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log('Iniciando login com:', data);

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar credenciais
      if (data.username === VALID_CREDENTIALS.username && 
          data.password === VALID_CREDENTIALS.password) {
        
        console.log('Credenciais válidas');
        
        // Verificar se authHook existe
        if (authHook && authHook.login) {
          const userData = {
            username: data.username,
            loginTime: new Date().toISOString()
          };
          
          console.log('Chamando login com:', userData);
          authHook.login(userData);
          toast.success('Login realizado com sucesso!');
          
          // Redirecionar
          setTimeout(() => {
            console.log('Redirecionando para dashboard');
            navigate('/dashboard');
          }, 500);
        } else {
          // Fallback: salvar diretamente no localStorage
          console.log('Usando fallback localStorage');
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify({
            username: data.username,
            loginTime: new Date().toISOString()
          }));
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard');
        }
        
      } else {
        console.log('Credenciais inválidas');
        setError('username', { 
          type: 'manual', 
          message: 'Usuário ou senha inválidos' 
        });
        setError('password', { 
          type: 'manual', 
          message: 'Usuário ou senha inválidos' 
        });
        toast.error('Credenciais inválidas!');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro no servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            DevQuote
          </h2>
          <p className="text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Usuário */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  className="pl-10"
                  {...register('username')}
                  error={errors.username?.message}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className="pl-10 pr-10"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Credenciais de teste */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Credenciais para teste:
              </p>
              <p className="text-xs text-blue-700">
                <strong>Usuário:</strong> admin<br />
                <strong>Senha:</strong> 1234
              </p>
            </div>

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Debug:</strong> AuthHook = {authHook ? '✅ OK' : '❌ Erro'}
                </p>
              </div>
            )}

            {/* Botão de Login */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Sistema de Controle de Orçamentos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;