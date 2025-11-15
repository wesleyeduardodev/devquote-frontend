import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    FileText,
    FolderOpen,
    Truck,
    CreditCard,
    BarChart3,
    Settings,
    Bell,
    Sliders,
    X
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavigationItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredProfiles: string[];
    subItems?: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({isOpen, onClose}) => {
    const location = useLocation();
    const { hasAnyProfile, isAdmin, isManager, isUser } = useAuth();

    const isActiveRoute = (path: string): boolean => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const allNavigationItems: NavigationItem[] = [
        {path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiredProfiles: ['ADMIN', 'MANAGER', 'USER']},
        {path: '/requesters', label: 'Solicitantes', icon: Users, requiredProfiles: ['ADMIN']},
        {path: '/tasks', label: 'Tarefas', icon: CheckSquare, requiredProfiles: ['ADMIN', 'MANAGER', 'USER']},
        {path: '/deliveries', label: 'Entregas', icon: Truck, requiredProfiles: ['ADMIN', 'MANAGER', 'USER']},
        {path: '/projects', label: 'Projetos', icon: FolderOpen, requiredProfiles: ['ADMIN']},
        {path: '/billing', label: 'Faturamento', icon: CreditCard, requiredProfiles: ['ADMIN', 'MANAGER']},
        {path: '/reports', label: 'Relatórios', icon: BarChart3, requiredProfiles: ['ADMIN', 'MANAGER']},
        {path: '/notifications', label: 'Notificações', icon: Bell, requiredProfiles: ['ADMIN']},
        {path: '/parameters', label: 'Parâmetros', icon: Sliders, requiredProfiles: ['ADMIN']},
        {path: '/settings', label: 'Configurações', icon: Settings, requiredProfiles: ['ADMIN']}
    ];

    const navigationItems = allNavigationItems.filter(item => {
        return hasAnyProfile(item.requiredProfiles);
    });

    return (
        <>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}


            <aside
                className={clsx(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >

                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <Link to="/dashboard" className="text-xl font-bold text-primary-600">
                        DevQuote
                    </Link>

                    <button
                        onClick={onClose}
                        className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="w-6 h-6"/>
                    </button>
                </div>


                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {navigationItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    className={clsx(
                                        'flex items-center px-4 py-3 rounded-lg transition-colors',
                                        isActiveRoute(item.path)
                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                >
                                    <item.icon className="w-5 h-5 mr-3"/>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        © 2025 DevQuote
                    </p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
