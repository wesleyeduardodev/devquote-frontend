import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../hooks/useAuth';

const Layout = ({children}) => {
  const navigate = useNavigate();
  const {user, logout} = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Simples */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DQ</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">DevQuote</h1>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Olá, {user?.username}</span>
                <button
                    onClick={handleLogout}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors text-sm"
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
            <div className="flex space-x-8 h-12 items-center">
              <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </button>
              <button
                  onClick={() => navigate('/requesters')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Solicitantes
              </button>
              <button
                  onClick={() => navigate('/tasks')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Tarefas
              </button>
              <button
                  onClick={() => navigate('/quotes')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Orçamentos
              </button>
              <button
                  onClick={() => navigate('/projects')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Projetos
              </button>
              <button
                  onClick={() => navigate('/deliveries')}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Entregas
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto">
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