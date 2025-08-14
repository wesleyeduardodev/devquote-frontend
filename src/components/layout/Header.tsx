import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Menu} from 'lucide-react';
import {useAuth} from '@/hooks/useAuth';

interface HeaderProps {
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

interface User {
    username?: string;
    name?: string;
}

const Header: React.FC<HeaderProps> = ({onToggleSidebar, isSidebarOpen}) => {
    const navigate = useNavigate();
    const {user, logout} = useAuth();

    const handleLogout = (): void => {
        logout();
        navigate('/login');
    };

    const getUserDisplayName = (user: User | null): string => {
        if (!user) return 'Usuário';
        return user.name || user.username || 'Usuário';
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                    {/* Menu button for mobile */}
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
                    >
                        <Menu className="h-5 w-5 text-gray-600"/>
                    </button>

                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">DQ</span>
                        </div>
                        <h1 className="font-bold text-xl text-gray-900 hidden sm:block">
                            DevQuote
                        </h1>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-4">
          <span className="text-gray-700 text-sm">
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
        </header>
    );
};

export default Header;