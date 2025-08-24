import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import {Menu, User, LogOut, Shield} from 'lucide-react';
import {useAuth} from '@/hooks/useAuth';
import { useProfilePermissions } from '@/hooks/usePermissions';

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
    const {user, logout, permissions} = useAuth();
    const profilePermissions = useProfilePermissions();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = async (): Promise<void> => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            navigate('/login');
        }
    };

    const getUserDisplayName = (user: User | null): string => {
        if (!user) return 'Usuário';
        return user.name || user.username || 'Usuário';
    };

    const getUserRole = (): string => {
        if (profilePermissions.isAdmin()) return 'Administrador';
        if (profilePermissions.isManager()) return 'Gerente';
        if (profilePermissions.isUser()) return 'Usuário';
        return 'Usuário';
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
                    {/* User info and menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="text-sm font-medium text-gray-900">
                                    {getUserDisplayName(user)}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {getUserRole()}
                                </div>
                            </div>
                        </button>

                        {/* Dropdown menu */}
                        {showUserMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-3 border-b border-gray-100">
                                        <div className="font-medium text-gray-900">{getUserDisplayName(user)}</div>
                                        <div className="text-sm text-gray-500">{user?.email}</div>
                                        <div className="text-xs text-gray-400 flex items-center mt-1">
                                            <Shield className="h-3 w-3 mr-1" />
                                            {getUserRole()}
                                        </div>
                                    </div>
                                    
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                // Aqui poderia abrir modal de perfil
                                            }}
                                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User className="h-4 w-4 mr-2" />
                                            Meu Perfil
                                        </button>
                                        
                                        <div className="border-t border-gray-100 my-1" />
                                        
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;