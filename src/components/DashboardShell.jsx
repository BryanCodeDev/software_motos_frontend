import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Navbar } from './Navbar';
import {
  SidebarDesktop,
  SidebarMobile,
  SidebarHeaderMobile,
} from './Sidebar';
import { useAuth } from '../contexts/useAuth';
import { routes } from '../utils/routes';
import { getNav, findCurrent, PANEL_LABEL } from '../utils/dashboardNav';

const DashboardLoader = ({ message }) => (
  <main className="flex flex-1 items-center justify-center p-10">
    <div className="flex flex-col items-center gap-5 animate-fade-in" role="status">
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand-500/30 animate-pulse-ring" aria-hidden="true" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-border">
          <svg className="h-6 w-6 animate-spin text-brand-500" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      </span>
      <p className="text-sm font-medium text-text-secondary">{message}</p>
    </div>
  </main>
);

/**
 * Estructura común de los paneles (usuario, administrador y mixto).
 * - requiredRole: si se indica, quien no tenga ese rol es redirigido a su panel.
 * - maxWidth: clase Tailwind de ancho máximo del contenido.
 */
export const DashboardShell = ({ requiredRole, maxWidth }) => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  // Cierra el menú móvil al navegar (patrón recomendado: ajustar estado durante el render).
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setSidebarOpen(false);
  }

  const role = user?.role === 'admin' ? 'admin' : 'user';
  const items = getNav(role);
  const current = findCurrent(items, pathname);

  const redirectTo = useMemo(() => {
    if (loading) return null;
    if (!isAuthenticated) return routes.home;
    if (requiredRole && role !== requiredRole) {
      return role === 'admin' ? '/admin' : routes.dashboard;
    }
    return null;
  }, [loading, isAuthenticated, requiredRole, role]);

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [redirectTo, navigate]);

  // Cada cambio de página vuelve arriba.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  // Menú móvil: Escape cierra y el fondo no se desplaza.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  // Si la ventana pasa a escritorio, el menú móvil se cierra.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const displayName =
    user?.name || user?.email?.split('@')[0] || (role === 'admin' ? 'Administrador' : 'Usuario');
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setSidebarOpen(false);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      navigate(routes.home, { replace: true });
    }
  };

  const ready = !loading && isAuthenticated && !redirectTo;
  const contentWidth = maxWidth ?? (role === 'admin' ? 'max-w-7xl' : 'max-w-6xl');

  const sidebarProps = {
    items,
    displayName,
    email: user?.email,
    initial,
    role,
    onLogout: handleLogout,
    loggingOut,
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-50">
      <a
        href="#contenido-panel"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <Navbar />

      {ready ? (
        <div className="flex flex-1">
          <SidebarDesktop {...sidebarProps} />

          <div
            className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <SidebarMobile
            {...sidebarProps}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <SidebarHeaderMobile
              role={role}
              currentLabel={current.label}
              open={sidebarOpen}
              onOpen={() => setSidebarOpen(true)}
            />

            <main
              id="contenido-panel"
              tabIndex={-1}
              className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-10"
            >
              <div className={`mx-auto ${contentWidth}`}>
                <nav
                  aria-label="Ruta de navegación"
                  className="mb-6 hidden items-center gap-1.5 text-sm text-text-secondary lg:flex"
                >
                  <Link to={routes.home} className="rounded transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    Inicio
                  </Link>
                  <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <Link to={items[0].to} className="rounded transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    {PANEL_LABEL[role]}
                  </Link>
                  {current.to !== items[0].to && (
                    <>
                      <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                      <span aria-current="page" className="font-semibold text-neutral-900">
                        {current.label}
                      </span>
                    </>
                  )}
                </nav>

                {/* Solo opacidad: evita crear un contexto de transformación que rompa modales fixed */}
                <div key={pathname} className="animate-fade-in">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <DashboardLoader message={loading ? 'Verificando tu sesión…' : 'Redirigiendo…'} />
      )}
    </div>
  );
};

export default DashboardShell;