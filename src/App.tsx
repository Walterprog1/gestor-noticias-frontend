import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApprovalPage from './pages/ApprovalPage';
import RecordsPage from './pages/RecordsPage';
import SourcesPage from './pages/SourcesPage';
import PromptsPage from './pages/PromptsPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/aprobacion" element={
          <ProtectedRoute roles={['administrador', 'operador']}>
            <ApprovalPage />
          </ProtectedRoute>
        } />
        <Route path="/registros" element={<RecordsPage />} />
        <Route path="/fuentes" element={
          <ProtectedRoute roles={['administrador']}>
            <SourcesPage />
          </ProtectedRoute>
        } />
        <Route path="/prompts" element={
          <ProtectedRoute roles={['administrador']}>
            <PromptsPage />
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute roles={['administrador']}>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
