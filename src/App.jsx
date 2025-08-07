import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import RequesterList from './pages/requesters/RequesterList';
import RequesterCreate from './pages/requesters/RequesterCreate';
import RequesterEdit from './pages/requesters/RequesterEdit';
import TaskList from './pages/tasks/TaskList';
import TaskCreate from './pages/tasks/TaskCreate';
import TaskEdit from './pages/tasks/TaskEdit';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="requesters" element={<RequesterList />} />
            <Route path="requesters/create" element={<RequesterCreate />} />
            <Route path="requesters/:id/edit" element={<RequesterEdit />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/create" element={<TaskCreate />} />
            <Route path="tasks/:id/edit" element={<TaskEdit />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;