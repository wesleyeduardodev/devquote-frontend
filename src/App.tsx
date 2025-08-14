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
import QuoteList from './pages/quotes/QuoteList';
import QuoteCreate from './pages/quotes/QuoteCreate';
import QuoteEdit from './pages/quotes/QuoteEdit';
import ProjectList from './pages/projects/ProjectList';
import ProjectCreate from './pages/projects/ProjectCreate';
import ProjectEdit from './pages/projects/ProjectEdit';
import DeliveryList from './pages/deliveries/DeliveryList';
import DeliveryCreate from './pages/deliveries/DeliveryCreate';
import DeliveryEdit from './pages/deliveries/DeliveryEdit';
import BillingMonthManagement from './pages/billing/BillingMonthManagement';
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
                            <Route path="/dashboard" element={<Dashboard/>}/>
                            <Route path="/requesters" element={<RequesterList/>}/>
                            <Route path="/requesters/create" element={<RequesterCreate/>}/>
                            <Route path="/requesters/:id/edit" element={<RequesterEdit/>}/>
                            <Route path="/tasks" element={<TaskList/>}/>
                            <Route path="/tasks/create" element={<TaskCreate/>}/>
                            <Route path="/tasks/:id/edit" element={<TaskEdit/>}/>
                            <Route path="/quotes" element={<QuoteList/>}/>
                            <Route path="/quotes/create" element={<QuoteCreate/>}/>
                            <Route path="/quotes/:id/edit" element={<QuoteEdit/>}/>
                            <Route path="/projects" element={<ProjectList/>}/>
                            <Route path="/projects/create" element={<ProjectCreate/>}/>
                            <Route path="/projects/:id/edit" element={<ProjectEdit/>}/>
                            <Route path="/deliveries" element={<DeliveryList/>}/>
                            <Route path="/deliveries/create" element={<DeliveryCreate/>}/>
                            <Route path="/deliveries/:id/edit" element={<DeliveryEdit/>}/>
                            <Route path="/billing" element={<BillingMonthManagement/>}/>
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
        <Router>
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