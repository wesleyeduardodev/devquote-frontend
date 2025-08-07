import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RequesterList from './pages/requesters/RequesterList';
import RequesterCreate from './pages/requesters/RequesterCreate';
import RequesterEdit from './pages/requesters/RequesterEdit';
import TaskList from './pages/tasks/TaskList';
import TaskCreate from './pages/tasks/TaskCreate';
import TaskEdit from './pages/tasks/TaskEdit';
import NotFound from './pages/NotFound';

// Componente para redirecionar usuários logados
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Componente principal das rotas
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota de Login */}
      <Route 
        path="/login" 
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        } 
      />

      {/* Rotas Protegidas */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Solicitantes - ROTAS CORRIGIDAS */}
              <Route path="/requesters" element={<RequesterList />} />
              <Route path="/requesters/create" element={<RequesterCreate />} />
              <Route path="/requesters/:id/edit" element={<RequesterEdit />} />
              
              {/* Tarefas */}
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/create" element={<TaskCreate />} />
              <Route path="/tasks/:id/edit" element={<TaskEdit />} />
              
              {/* Redirecionamento da raiz */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Página 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

// Componente principal da aplicação
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          
          {/* Toaster para notificações */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerStyle={{}}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4ade80',
                  secondary: 'black',
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: '#ef4444',
                  secondary: 'black',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;