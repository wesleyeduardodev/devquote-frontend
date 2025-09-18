import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import {AuthProvider, useAuth} from './hooks/useAuth';
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
import ProjectList from './pages/projects/ProjectList';
import ProjectCreate from './pages/projects/ProjectCreate';
import ProjectEdit from './pages/projects/ProjectEdit';
import DeliveryList from './pages/deliveries/DeliveryList';
import DeliveryCreate from './pages/deliveries/DeliveryCreate';
import DeliveryGroupEdit from './pages/deliveries/DeliveryGroupEdit';
import DeliveryEdit from './pages/deliveries/DeliveryEdit';
import BillingMonthManagement from './pages/billing/BillingMonthManagement';
import ProfileManagement from './pages/profiles/ProfileManagement';
import NotificationList from './pages/notifications/NotificationList';
import { UserSettings } from './pages/UserSettings';
import NotFound from './pages/NotFound';

interface RedirectIfAuthenticatedProps {
    children: React.ReactNode;
}

const RedirectIfAuthenticated: React.FC<RedirectIfAuthenticatedProps> = ({children}) => {
    const {isAuthenticated, isLoading} = useAuth();

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

    if (isAuthenticated) return <Navigate to="/dashboard" replace/>;
    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <RedirectIfAuthenticated>
                        <Login/>
                    </RedirectIfAuthenticated>
                }
            />
            <Route path="/*" element={
                <ProtectedRoute>
                    <Layout>
                        <Routes>
                            {/* Dashboard - Todos têm acesso */}
                            <Route path="/dashboard" element={<Dashboard/>}/>
                            
                            {/* Requesters/Users - Apenas ADMIN */}
                            <Route path="/requesters" element={
                                <ProtectedRoute requiredScreen="users">
                                    <RequesterList/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/requesters/create" element={
                                <ProtectedRoute requiredScreen="users">
                                    <RequesterCreate/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/requesters/:id/edit" element={
                                <ProtectedRoute requiredScreen="users">
                                    <RequesterEdit/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* Tasks - ADMIN, MANAGER, USER */}
                            <Route path="/tasks" element={
                                <ProtectedRoute requiredScreen="tasks">
                                    <TaskList/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/tasks/create" element={
                                <ProtectedRoute requiredScreen="tasks">
                                    <TaskCreate/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/tasks/:id/edit" element={
                                <ProtectedRoute requiredScreen="tasks">
                                    <TaskEdit/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* Projects - Apenas ADMIN */}
                            <Route path="/projects" element={
                                <ProtectedRoute requiredScreen="projects">
                                    <ProjectList/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/projects/create" element={
                                <ProtectedRoute requiredScreen="projects">
                                    <ProjectCreate/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/projects/:id/edit" element={
                                <ProtectedRoute requiredScreen="projects">
                                    <ProjectEdit/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* Deliveries - ADMIN, MANAGER, USER */}
                            <Route path="/deliveries" element={
                                <ProtectedRoute requiredScreen="deliveries">
                                    <DeliveryList/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/deliveries/create" element={
                                <ProtectedRoute requiredScreen="deliveries">
                                    <DeliveryCreate/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/deliveries/group/:taskId/edit" element={
                                <ProtectedRoute requiredScreen="deliveries">
                                    <DeliveryGroupEdit/>
                                </ProtectedRoute>
                            }/>
                            <Route path="/deliveries/:deliveryId/edit" element={
                                <ProtectedRoute requiredScreen="deliveries">
                                    <DeliveryEdit/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* Billing - ADMIN, MANAGER */}
                            <Route path="/billing" element={
                                <ProtectedRoute requiredScreen="billing">
                                    <BillingMonthManagement/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* Profile Management - Apenas ADMIN */}
                            <Route path="/profiles" element={
                                <ProtectedRoute requiredScreen="settings">
                                    <ProfileManagement/>
                                </ProtectedRoute>
                            }/>

                            {/* Notification Configurations - Apenas ADMIN */}
                            <Route path="/notifications" element={
                                <ProtectedRoute requiredScreen="settings">
                                    <NotificationList/>
                                </ProtectedRoute>
                            }/>
                            
                            {/* User Settings - Todos os usuários autenticados */}
                            <Route path="/settings" element={<UserSettings/>}/>
                            
                            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                            <Route path="*" element={<NotFound/>}/>
                        </Routes>
                    </Layout>
                </ProtectedRoute>
            }/>
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <Router
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <AuthProvider>
                <div className="App">
                    <AppRoutes/>
                    <Toaster
                        position="top-right"
                        reverseOrder={false}
                        gutter={8}
                        containerStyle={{}}
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff'
                            },
                            success: {
                                duration: 3000,
                                style: {
                                    background: '#4ade80',
                                    color: '#000'
                                }
                            },
                            error: {
                                duration: 4000,
                                style: {
                                    background: '#ef4444',
                                    color: '#fff'
                                }
                            },
                        }}
                    />
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;