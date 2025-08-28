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
    X
} from 'lucide-react';
import clsx from 'clsx';
import { useScreenPermissions } from '@/hooks/usePermissions';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavigationItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    screen: string;
    subItems?: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({isOpen, onClose}) => {
    const location = useLocation();
    const screenPermissions = useScreenPermissions();

    const isActiveRoute = (path: string): boolean => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    // Definir todos os itens de navegação com suas respectivas telas
    const allNavigationItems: NavigationItem[] = [
        {path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, screen: 'dashboard'},
        {path: '/requesters', label: 'Solicitantes', icon: Users, screen: 'users'}, // Mapeado para 'users' no backend
        {path: '/tasks', label: 'Tarefas', icon: CheckSquare, screen: 'tasks'},
        {path: '/quotes', label: 'Orçamentos', icon: FileText, screen: 'quotes'},
        {path: '/deliveries', label: 'Entregas', icon: Truck, screen: 'deliveries'},
        {path: '/projects', label: 'Projetos', icon: FolderOpen, screen: 'projects'},
        {path: '/billing', label: 'Faturamento', icon: CreditCard, screen: 'billing'},
        {path: '/reports', label: 'Relatórios', icon: BarChart3, screen: 'reports'},
        {path: '/settings', label: 'Configurações', icon: Settings, screen: 'settings'}
    ];

    // Filtrar itens baseado nas permissões de tela do usuário
    const navigationItems = allNavigationItems.filter(item => {
        try {
            return screenPermissions.hasScreenAccess(item.screen);
        } catch (error) {
            // Fallback: mostrar todos os itens se houver erro nas permissões
            console.warn('Erro ao verificar permissões de tela:', error);
            return true;
        }
    });

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
                                    <Link
                                        to={item.path}
                                        onClick={(e) => {
                                            // Só fecha o menu se for clique normal (botão esquerdo)
                                            if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                                onClose();
                                            }
                                        }}
                                        className={clsx(
                                            'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
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
                                    </Link>
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