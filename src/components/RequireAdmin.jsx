import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { routes } from '../utils/routes';

const EASE = [0.22, 1, 0.36, 1];

export const RequireAdmin = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const reduce = useReducedMotion();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/20 animate-pulse-ring" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-border">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
          </span>
        </span>
        <span className="text-sm font-medium text-text-secondary">Verificando permisos…</span>
      </div>
    );
  }

  // Se guarda la ruta pedida para volver a ella después de iniciar sesión.
  if (!isAuthenticated) return <Navigate to={routes.login} replace state={{ from: location }} />;

  if (user?.role !== 'admin') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-glow sm:p-10"
        >
          <div className="relative mx-auto mb-6 h-16 w-16">
            <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-brand-500/15 animate-pulse-ring" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
              <ShieldAlert className="h-7 w-7" aria-hidden="true" />
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Acceso restringido</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Esta sección es solo para administradores. Si crees que deberías tener acceso, contacta al equipo
            responsable de la plataforma.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={routes.dashboard} className="btn-primary px-5 py-2.5 text-sm">
              <LayoutDashboard size={16} aria-hidden="true" /> Ir a mi panel
            </Link>
            <Link to={routes.home} className="btn-outline px-5 py-2.5 text-sm">
              <ArrowLeft size={16} aria-hidden="true" /> Volver al inicio
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return children;
};

export default RequireAdmin;