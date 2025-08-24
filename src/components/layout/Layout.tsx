import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

interface User {
    username?: string;
    name?: string;
}

interface NavigationItem {
    path: string;
    label: string;
    screen: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, hasScreenAccess } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    const handleLogout = (): void => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = (): void => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Helper para verificar se a rota está ativa
    const isActiveRoute = (path: string): boolean => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getUserDisplayName = (user: User | null): string => {
        if (!user) return 'Usuário';
        return user.name || user.username || 'Usuário';
    };

    // Todos os itens de navegação possíveis
    const allNavigationItems: NavigationItem[] = [
        { path: '/dashboard', label: 'Dashboard', screen: 'dashboard' },
        { path: '/requesters', label: 'Solicitantes', screen: 'users' },
        { path: '/tasks', label: 'Tarefas', screen: 'tasks' },
        { path: '/quotes', label: 'Orçamentos', screen: 'quotes' },
        { path: '/deliveries', label: 'Entregas', screen: 'deliveries' },
        { path: '/projects', label: 'Projetos', screen: 'projects' },
        { path: '/billing', label: 'Faturamento', screen: 'billing' }
    ];

    // Filtra itens baseado nas permissões do usuário
    const navigationItems = useMemo(() => {
        return allNavigationItems.filter(item => hasScreenAccess(item.screen));
    }, [hasScreenAccess]);

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsMobileMenuOpen(false); // Fechar menu mobile após navegação
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Responsivo */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo e Menu Mobile */}
                        <div className="flex items-center space-x-3">
                            {/* Botão Menu Mobile */}
                            <button
                                onClick={toggleMobileMenu}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Abrir menu"
                            >
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>

                            {/* Logo */}
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">DQ</span>
                                </div>
                                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                                    DevQuote
                                </h1>
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 text-sm hidden sm:inline">
                                Olá, {getUserDisplayName(user)}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Desktop */}
            <nav className="bg-white shadow-sm border-b border-gray-200 hidden lg:block">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8 h-12 items-center overflow-x-auto">
                        {navigationItems.map((item: NavigationItem) => (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`whitespace-nowrap font-medium transition-colors border-b-2 pb-2 ${
                                    isActiveRoute(item.path)
                                        ? 'text-primary-600 border-primary-600'
                                        : 'text-gray-700 hover:text-primary-600 border-transparent hover:border-primary-300'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Menu Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={toggleMobileMenu}
                    />

                    {/* Menu Panel */}
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
                        {/* Header do Menu */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">DQ</span>
                                </div>
                                <h2 className="font-bold text-lg text-gray-900">DevQuote</h2>
                            </div>
                            <button
                                onClick={toggleMobileMenu}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Fechar menu"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* User Info Mobile */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-600">Logado como:</p>
                            <p className="font-medium text-gray-900">{getUserDisplayName(user)}</p>
                        </div>

                        {/* Navigation Items */}
                        <nav className="p-4">
                            <ul className="space-y-2">
                                {navigationItems.map((item) => (
                                    <li key={item.path}>
                                        <button
                                            onClick={() => handleNavigate(item.path)}
                                            className={`w-full text-left px-3 py-3 rounded-lg font-medium transition-colors ${
                                                isActiveRoute(item.path)
                                                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            {/* Footer Responsivo */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-gray-500 text-sm">
                        DevQuote - Sistema de Controle de Orçamentos
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;