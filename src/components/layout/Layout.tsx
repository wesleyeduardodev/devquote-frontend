import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';

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
}

const Layout: React.FC<LayoutProps> = ({children}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {user, logout} = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

    const handleLogout = (): void => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = (): void => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Helper para verificar se a rota está ativa
    const isActiveRoute = (path: string): boolean => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getUserDisplayName = (user: User | null): string => {
        if (!user) return 'Usuário';
        return user.name || user.username || 'Usuário';
    };

    const navigationItems: NavigationItem[] = [
        {path: '/dashboard', label: 'Dashboard'},
        {path: '/requesters', label: 'Solicitantes'},
        {path: '/tasks', label: 'Tarefas'},
        {path: '/quotes', label: 'Orçamentos'},
        {path: '/projects', label: 'Projetos'},
        {path: '/deliveries', label: 'Entregas'},
        {path: '/billing', label: 'Faturamento'}
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Simples */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">DQ</span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">DevQuote</h1>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
              <span className="text-gray-700">
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

            {/* Navigation Simples */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8 h-12 items-center overflow-x-auto">
                        {navigationItems.map((item: NavigationItem) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            {/* Footer Simples */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-gray-500 text-sm">
                        DevQuote - Sistema de Controle de Orçamentos
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;