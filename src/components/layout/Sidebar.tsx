import React from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    FileText,
    FolderOpen,
    Truck,
    CreditCard,
    X
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavigationItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const Sidebar: React.FC<SidebarProps> = ({isOpen, onClose}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActiveRoute = (path: string): boolean => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleNavigate = (path: string): void => {
        navigate(path);
        onClose(); // Fechar sidebar no mobile após navegação
    };

    const navigationItems: NavigationItem[] = [
        {path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
        {path: '/requesters', label: 'Solicitantes', icon: Users},
        {path: '/tasks', label: 'Tarefas', icon: CheckSquare},
        {path: '/quotes', label: 'Orçamentos', icon: FileText},
        {path: '/projects', label: 'Projetos', icon: FolderOpen},
        {path: '/deliveries', label: 'Entregas', icon: Truck},
        {path: '/billing', label: 'Faturamento', icon: CreditCard}
    ];

    return (
        <>
            {/* Overlay para mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header do Sidebar */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">DQ</span>
                        </div>
                        <h2 className="font-bold text-lg text-gray-900">DevQuote</h2>
                    </div>

                    {/* Botão fechar para mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5 text-gray-600"/>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4">
                    <ul className="space-y-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActiveRoute(item.path);

                            return (
                                <li key={item.path}>
                                    <button
                                        onClick={() => handleNavigate(item.path)}
                                        className={clsx(
                                            'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                                            isActive
                                                ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                                        )}
                                    >
                                        <Icon
                                            className={clsx(
                                                'h-5 w-5',
                                                isActive ? 'text-primary-600' : 'text-gray-500'
                                            )}
                                        />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer do Sidebar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        <p>DevQuote v1.0</p>
                        <p>Sistema de Orçamentos</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;