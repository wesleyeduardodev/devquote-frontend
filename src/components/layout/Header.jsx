import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  console.log('Header sendo renderizado!');
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Menu button for mobile */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
            {user?.username || 'Usuário'}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors text-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;