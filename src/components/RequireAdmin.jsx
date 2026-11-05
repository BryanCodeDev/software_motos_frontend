import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { routes } from '../utils/routes';

export const RequireAdmin = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-7 w-7 animate-spin text-brand-accent" aria-hidden="true" />
        <span className="sr-only">Verificando permisos…</span>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={routes.login} replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export default RequireAdmin;