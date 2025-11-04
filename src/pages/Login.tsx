import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, User, LogIn, Phone, Mail, Linkedin, Github, Instagram, Facebook } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type FormValues = { username: string; password: string; };

const loginSchema = yup.object({
    username: yup.string().required('Usuário é obrigatório'),
    password: yup.string().required('Senha é obrigatória')
});

export default function Login() {
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const redirectTo = location?.state?.from?.pathname || '/dashboard';

    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: yupResolver(loginSchema),
        mode: 'onChange'
    });

    const onSubmit = async (data: FormValues) => {
        try {
            await login({ username: data.username, password: data.password });
            toast.success('Login realizado com sucesso!');
            navigate(redirectTo, { replace: true });
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Usuário ou senha inválidos';
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">

            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <span className="text-white text-3xl">⚡</span>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">
                        Dev<span className="text-blue-600">Quote</span>
                    </h2>
                    <p className="text-gray-600 font-medium">Sistema de Gestão de Orçamentos</p>
                    <p className="text-sm text-gray-500 mt-2">Faça login para acessar sua conta</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Usuário
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Digite seu usuário"
                                    className="pl-10 w-full border border-gray-300 rounded-lg h-12 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    {...register('username')}
                                />
                            </div>
                            {errors.username?.message && (
                                <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Digite sua senha"
                                    className="pl-10 pr-10 w-full border border-gray-300 rounded-lg h-12 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                </button>
                            </div>
                            {errors.password?.message && (
                                <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-700 text-white font-semibold hover:from-blue-700 hover:to-purple-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            {isLoading ? 'Entrando...' : (<><LogIn className="h-4 w-4" /> Entrar no Sistema</>)}
                        </button>
                    </form>
                </div>

                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600 font-medium">💼 Solução Empresarial para Desenvolvedores</p>

                    {/* Nome do Desenvolvedor */}
                    <div className="space-y-1">
                        <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Desenvolvido por Wesley Eduardo
                        </h3>
                        <p className="text-xs text-gray-600">Desenvolvedor Full Stack</p>
                    </div>

                    {/* Contatos */}
                    <div className="flex flex-wrap justify-center gap-4 text-xs">
                        <a
                            href="tel:+5598981650805"
                            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>+55 98 98165-0805</span>
                        </a>
                        <a
                            href="mailto:wesleyeduardo.dev@gmail.com"
                            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>wesleyeduardo.dev@gmail.com</span>
                        </a>
                    </div>

                    <div className="flex justify-center gap-3">
                        <a
                            href="https://www.linkedin.com/in/wesley-eduardo-8a1066169/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/60 backdrop-blur-sm text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                            title="LinkedIn"
                        >
                            <Linkedin className="w-4 h-4" />
                        </a>
                        <a
                            href="https://github.com/wesleyeduardodev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                            title="GitHub"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                        <a
                            href="https://www.instagram.com/wesleyeduardo.dev?igsh=ano4MTVqN2F6ZWh0&utm_source=qr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/60 backdrop-blur-sm text-pink-600 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                            title="Instagram"
                        >
                            <Instagram className="w-4 h-4" />
                        </a>
                        <a
                            href="https://www.facebook.com/wesleyeduardo.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/60 backdrop-blur-sm text-blue-700 hover:bg-blue-700 hover:text-white rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                            title="Facebook"
                        >
                            <Facebook className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="text-xs text-gray-500 pt-2">
                        © 2025 DevQuote. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
}